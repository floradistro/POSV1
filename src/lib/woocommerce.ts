// Flora POS API - Optimized for Addify Multi-Location Inventory & POS Plugins
// Base configuration
const API_BASE = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://api.floradistro.com'
const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY || 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5'
const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET || 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678'

// API Endpoints
const ENDPOINTS = {
  // Addify Multi-Location Inventory API
  ADDIFY_AUTH: '/wp-json/addify-mli/v1/auth/login',
  ADDIFY_STORES: '/wp-json/addify-mli/v1/stores/public',
  ADDIFY_INVENTORY: '/wp-json/wc/v3/addify_headless_inventory/products',
  
  // Standard WooCommerce API
  WC_PRODUCTS: '/wp-json/wc/v3/products',
  WC_ORDERS: '/wp-json/wc/v3/orders',
  WC_CUSTOMERS: '/wp-json/wc/v3/customers',
} as const

// Types
export interface FloraProduct {
  id: number
  name: string
  slug: string
  description: string
  short_description: string
  price: string
  regular_price: string
  sale_price: string
  stock_quantity: number
  manage_stock: boolean
  in_stock: boolean
  categories: Array<{
    id: number
    name: string
    slug: string
  }>
  images: Array<{
    id: number
    src: string
    alt: string
  }>
  type: string
  status: string
  // Location-specific fields from Addify
  location_stock?: number
  location_name?: string
}

export interface FloraStore {
  id: number
  name: string
  slug: string
  description: string
  address?: string
}

export interface AuthResponse {
  success: boolean
  token?: string
  user?: {
    id: number
    email: string
    display_name: string
  }
  store?: FloraStore
  terminal?: {
    id: string
    name: string
  }
}

export interface CreateOrderData {
  payment_method: 'cash' | 'card'
  payment_method_title: string
  set_paid: boolean
  billing: {
    first_name: string
    last_name: string
    address_1: string
    address_2: string
    city: string
    state: string
    postcode: string
    country: string
    email: string
    phone: string
  }
  shipping: {
    first_name: string
    last_name: string
    address_1: string
    address_2: string
    city: string
    state: string
    postcode: string
    country: string
  }
  shipping_lines: Array<any>
  line_items: Array<{
    product_id: number
    quantity: number
    meta_data?: Array<{
      key: string
      value: string
    }>
  }>
}

// Utility functions
function createAuthHeader(): string {
  return 'Basic ' + btoa(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`)
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text()
    console.error(`API Error: ${response.status} ${response.statusText}`, errorText)
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

// Main API class
export class FloraAPI {
  private baseUrl: string
  
  constructor() {
    this.baseUrl = API_BASE
  }

  // Authentication - Uses Addify MLI plugin
  async login(email: string, password: string, storeId: string, terminalId: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}${ENDPOINTS.ADDIFY_AUTH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          store_id: parseInt(storeId),
          terminal_id: terminalId
        })
      })

      const data = await handleResponse<any>(response)
      
      return {
        success: true,
        token: data.token,
        user: data.user,
        store: data.store,
        terminal: data.terminal
      }
    } catch (error) {
      console.error('Login failed:', error)
      return { success: false }
    }
  }

  // Get all available stores - Uses Addify MLI plugin
  async getStores(): Promise<FloraStore[]> {
    try {
      const response = await fetch(`${this.baseUrl}${ENDPOINTS.ADDIFY_STORES}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      return handleResponse<FloraStore[]>(response)
    } catch (error) {
      console.error('Failed to fetch stores:', error)
      return []
    }
  }

  // Get products with location-specific inventory
  async getProducts(params: {
    storeId?: string
    category?: number
    search?: string
    per_page?: number
  } = {}): Promise<FloraProduct[]> {
    try {
      // Build WooCommerce query parameters
      const searchParams = new URLSearchParams()
      if (params.category) {
        searchParams.set('category', params.category.toString())
        console.log(`🏷️ Filtering by category ID: ${params.category}`)
      }
      if (params.search) {
        searchParams.set('search', params.search)
        console.log(`🔍 Searching for: ${params.search}`)
      }
      if (params.per_page) searchParams.set('per_page', params.per_page.toString())
      else searchParams.set('per_page', '50')
      
      // Optimize WooCommerce query for speed
      searchParams.set('stock_status', 'instock')
      searchParams.set('status', 'publish')
      searchParams.set('orderby', 'id')
      searchParams.set('order', 'asc')
      
      // Reduce data transfer by excluding heavy fields
      searchParams.set('_fields', 'id,name,slug,description,short_description,price,regular_price,sale_price,stock_quantity,manage_stock,in_stock,categories,images,type,status')
      
      // Fetch products from WooCommerce
      console.log(`⏱️ Starting WooCommerce products fetch...`)
      const startTime = Date.now()
      
      const response = await fetch(`${this.baseUrl}${ENDPOINTS.WC_PRODUCTS}?${searchParams}`, {
        headers: {
          'Authorization': createAuthHeader(),
          'Content-Type': 'application/json',
        }
      })

      const products = await handleResponse<any[]>(response)
      const fetchTime = Date.now() - startTime
      console.log(`📦 Fetched ${products.length} products from WooCommerce in ${fetchTime}ms`)

      // Map products first
      const mappedProducts = products.map(this.mapToFloraProduct)
      
      // Add default image for products without images
      const productsWithDefaultImages = mappedProducts.map(product => {
        if (!product.images || product.images.length === 0) {
          return {
            ...product,
            images: [{
              id: 0,
              src: '/icons/vapeicon2.png', // Default product icon
              alt: product.name || 'Product'
            }]
          }
        }
        return product
      })
      
      console.log(`🖼️ Added default images to ${mappedProducts.length - productsWithDefaultImages.filter(p => p.images[0].id !== 0).length} products`)
      console.log(`📸 All ${productsWithDefaultImages.length} products now have images`)

      // If no store specified, return all products
      if (!params.storeId) {
        console.log(`✅ Returning ${productsWithDefaultImages.length} products (no store filter)`)
        return productsWithDefaultImages
      }

      // Use bulk inventory API for location-specific filtering
      const productIds = productsWithDefaultImages.map((p: FloraProduct) => p.id)
      if (productIds.length === 0) {
        return []
      }

      console.log(`🔍 Fetching bulk inventory for ${productIds.length} products at store ${params.storeId}`)
      console.log(`🌐 API URL: ${this.baseUrl}/wp-json/wc/v3/addify_headless_inventory/inventory/bulk`)
      
      const inventoryStartTime = Date.now()
      const inventoryResponse = await fetch(`${this.baseUrl}/wp-json/wc/v3/addify_headless_inventory/inventory/bulk`, {
        method: 'POST',
        headers: {
          'Authorization': createAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_ids: productIds,
          location_id: parseInt(params.storeId)
        })
      })

      console.log(`📡 Bulk inventory response status: ${inventoryResponse.status}`)
      
      if (!inventoryResponse.ok) {
        const errorText = await inventoryResponse.text()
        console.warn(`⚠️ Bulk inventory API failed: ${inventoryResponse.status} - ${errorText}`)
        console.warn(`⚠️ Falling back to returning all products`)
        return productsWithDefaultImages
      }

      const bulkInventory = await inventoryResponse.json()
      const inventoryTime = Date.now() - inventoryStartTime
      console.log(`📊 Received inventory data for ${Object.keys(bulkInventory).length} products in ${inventoryTime}ms`)

      // Enrich products with location-specific inventory
      const productsWithInventory: FloraProduct[] = []
      const productsWithoutInventory: any[] = []
      
      productsWithDefaultImages.forEach((product: FloraProduct) => {
        const inventory = bulkInventory[product.id.toString()]
        if (inventory && inventory.length > 0) {
          // Use the first inventory item for this location
          const locationInventory = inventory[0]
          productsWithInventory.push({
            ...product,
            location_stock: locationInventory.quantity,
            location_name: locationInventory.location_name,
            stock_quantity: locationInventory.quantity,
            in_stock: locationInventory.quantity > 0
          })
        } else {
          productsWithoutInventory.push(product)
        }
      })

      console.log(`📦 ${productsWithInventory.length} products have inventory at this location`)
      console.log(`❌ ${productsWithoutInventory.length} products have no inventory at this location`)
      
      if (productsWithoutInventory.length > 0) {
        console.log(`📝 Products without inventory:`, productsWithoutInventory.slice(0, 5).map(p => `${p.id}: ${p.name}`))
      }

      console.log(`✅ Returning ${productsWithInventory.length} products with location inventory`)
      return productsWithInventory

    } catch (error) {
      console.error('Failed to fetch products:', error)
      return []
    }
  }

  // Get product categories
  async getCategories(): Promise<Array<{ id: number; name: string; slug: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/wp-json/wc/v3/products/categories`, {
        headers: {
          'Authorization': createAuthHeader(),
          'Content-Type': 'application/json',
        }
      })

      return handleResponse<Array<{ id: number; name: string; slug: string }>>(response)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      return []
    }
  }

  // Create order
  async createOrder(orderData: CreateOrderData): Promise<{ id: number; status: string }> {
    try {
      const response = await fetch(`${this.baseUrl}${ENDPOINTS.WC_ORDERS}`, {
        method: 'POST',
        headers: {
          'Authorization': createAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      })

      return handleResponse<{ id: number; status: string }>(response)
    } catch (error) {
      console.error('Failed to create order:', error)
      throw error
    }
  }

  // Map WooCommerce product to FloraProduct interface
  private mapToFloraProduct(product: any): FloraProduct {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      short_description: product.short_description || '',
      price: product.price || '0',
      regular_price: product.regular_price || '0',
      sale_price: product.sale_price || '',
      stock_quantity: product.stock_quantity || 0,
      manage_stock: product.manage_stock || false,
      in_stock: product.stock_status === 'instock',
      categories: product.categories || [],
      images: product.images || [],
      type: product.type || 'simple',
      status: product.status || 'publish'
    }
  }
}

// Export singleton instance
export const floraAPI = new FloraAPI()

// Export utility function for external use
export const createWooHeaders = () => ({
  'Authorization': createAuthHeader(),
  'Content-Type': 'application/json',
}) 