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
  // Addify Multi-Location Inventory fields
  mli_product_type?: 'weight' | 'quantity'
  mli_weight_options?: string // comma-separated weight options
  mli_preroll_conversion?: number
  mli_pricing_tiers?: string // JSON string with pricing tiers
  // Parsed fields for easier use
  weight_options?: number[] // parsed from mli_weight_options
  pricing_tiers?: Record<string, number> // parsed from mli_pricing_tiers (flower pricing)
  preroll_pricing_tiers?: Record<string, number> // parsed preroll pricing from mli_pricing_tiers
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
  total?: string // Total amount for the order
  customer_id?: number // Optional customer ID for loyalty points
  created_via?: string // Order source tracking
  meta_data?: Array<{
    key: string
    value: string
  }>
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
    total?: string
    subtotal?: string
    meta_data?: Array<{
      key: string
      value: string
    }>
  }>
}

export interface FloraCustomer {
  id: number
  email: string
  first_name: string
  last_name: string
  role: string
  username: string
  billing: {
    first_name: string
    last_name: string
    company: string
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
    company: string
    address_1: string
    address_2: string
    city: string
    state: string
    postcode: string
    country: string
  }
  is_paying_customer: boolean
  avatar_url: string
  meta_data: Array<{
    key: string
    value: any
  }>
  date_created: string
  date_modified: string
  orders_count: number
  total_spent: string
  loyalty_points?: number // Real loyalty points from the plugin
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
      
      // Include meta fields for Addify pricing tiers and inventory type
      searchParams.set('_fields', 'id,name,slug,description,short_description,price,regular_price,sale_price,stock_quantity,manage_stock,in_stock,categories,images,type,status,meta_data')
      
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

  // Get customers with real order data
  async getCustomers(params: {
    search?: string
    per_page?: number
    page?: number
  } = {}): Promise<FloraCustomer[]> {
    try {
      const searchParams = new URLSearchParams()
      if (params.search) searchParams.set('search', params.search)
      if (params.per_page) searchParams.set('per_page', params.per_page.toString())
      else searchParams.set('per_page', '20') // Reduced to 20 since we'll be making additional API calls
      if (params.page) searchParams.set('page', params.page.toString())
      
      // Remove orderby parameter to avoid API errors - let WooCommerce use default ordering
      // searchParams.set('orderby', 'registered_date')
      // searchParams.set('order', 'desc')
      
      // Add cache busting parameter
      searchParams.set('_cache_bust', Date.now().toString())

      console.log(`👥 Fetching customers with params:`, Object.fromEntries(searchParams))

      const response = await fetch(`${this.baseUrl}${ENDPOINTS.WC_CUSTOMERS}?${searchParams}`, {
        headers: {
          'Authorization': createAuthHeader(),
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Customer API error: ${response.status} - ${errorText}`)
        
        // Try without orderby if it fails
        console.log(`🔄 Retrying without orderby parameter...`)
        const retryParams = new URLSearchParams()
        if (params.search) retryParams.set('search', params.search)
        if (params.per_page) retryParams.set('per_page', params.per_page.toString())
        else retryParams.set('per_page', '20')
        if (params.page) retryParams.set('page', params.page.toString())
        
        const retryResponse = await fetch(`${this.baseUrl}${ENDPOINTS.WC_CUSTOMERS}?${retryParams}`, {
          headers: {
            'Authorization': createAuthHeader(),
            'Content-Type': 'application/json',
          }
        })
        
        if (!retryResponse.ok) {
          const retryErrorText = await retryResponse.text()
          console.error(`❌ Retry also failed: ${retryResponse.status} - ${retryErrorText}`)
          return []
        }
        
        const customers = await retryResponse.json()
        console.log(`✅ Retry succeeded! Fetched ${customers.length} customers`)
        return this.processCustomersWithOrderData(customers)
      }

      const customers = await handleResponse<FloraCustomer[]>(response)
      console.log(`👥 Fetched ${customers.length} customers, now fetching their order data...`)
      
      return this.processCustomersWithOrderData(customers)
    } catch (error) {
      console.error('Failed to fetch customers:', error)
      return []
    }
  }

  // Process customers with order and points data
  private async processCustomersWithOrderData(customers: FloraCustomer[]): Promise<FloraCustomer[]> {
    // Fetch order statistics and points for each customer
    const customersWithData = await Promise.all(
      customers.map(async (customer) => {
        try {
          // Fetch orders for this customer
          const orderStats = await this.getCustomerOrderStats(customer.id)
          const points = await this.getCustomerPoints(customer.id)
          return {
            ...customer,
            orders_count: orderStats.count,
            total_spent: orderStats.total.toString(),
            loyalty_points: points
          }
        } catch (error) {
          console.warn(`Failed to fetch data for customer ${customer.id}:`, error)
          return {
            ...customer,
            orders_count: 0,
            total_spent: '0',
            loyalty_points: 0
          }
        }
      })
    )
    
    console.log(`📊 Enhanced ${customersWithData.length} customers with real order and points data`)
    
    // Log sample customer with real data
    if (customersWithData.length > 0) {
      const sample = customersWithData[0]
      console.log('📈 Sample customer with real data:', {
        id: sample.id,
        name: `${sample.first_name} ${sample.last_name}`,
        orders_count: sample.orders_count,
        total_spent: sample.total_spent,
        loyalty_points: sample.loyalty_points
      })
    }
    
    return customersWithData
  }

  // Get customer order statistics
  private async getCustomerOrderStats(customerId: number): Promise<{ count: number; total: number }> {
    try {
      const searchParams = new URLSearchParams()
      searchParams.set('customer', customerId.toString())
      searchParams.set('per_page', '100') // Get up to 100 orders to calculate stats
      searchParams.set('status', 'completed,processing,on-hold') // Only count meaningful orders
      searchParams.set('_fields', 'id,total') // Only get ID and total to minimize data transfer

      const response = await fetch(`${this.baseUrl}${ENDPOINTS.WC_ORDERS}?${searchParams}`, {
        headers: {
          'Authorization': createAuthHeader(),
          'Content-Type': 'application/json',
        }
      })

      const orders = await handleResponse<Array<{ id: number; total: string }>>(response)
      
      const count = orders.length
      const total = orders.reduce((sum, order) => sum + parseFloat(order.total || '0'), 0)
      
      return { count, total }
    } catch (error) {
      console.warn(`Failed to fetch order stats for customer ${customerId}:`, error)
      return { count: 0, total: 0 }
    }
  }

  // Get customer loyalty points
  private async getCustomerPoints(customerId: number): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/wp-json/wc-points-rewards/v1/user/${customerId}/balance`, {
        headers: {
          'Authorization': createAuthHeader(),
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        // If points API fails, silently return 0 (customer might not have points account)
        return 0
      }

      const pointsData = await response.json()
      return pointsData.balance || 0
    } catch (error) {
      // Silently handle points API errors (plugin might not be active for all customers)
      return 0
    }
  }

  // Create order
  async createOrder(orderData: CreateOrderData, calculatedTotal?: number): Promise<{ id: number; status: string }> {
    try {
      console.log('🛒 Creating order with data:', orderData)
      
      const response = await fetch(`${this.baseUrl}${ENDPOINTS.WC_ORDERS}`, {
        method: 'POST',
        headers: {
          'Authorization': createAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      })

      const order = await handleResponse<{ id: number; status: string; customer_id: number; total: string }>(response)
      console.log('✅ Order created successfully:', order)
      console.log('🔍 Order total field:', order.total, 'typeof:', typeof order.total)
      
      // Award loyalty points if customer is assigned and order is successful
      if (order.customer_id && order.customer_id > 0) {
        console.log(`🎯 Customer ID found: ${order.customer_id}, attempting to award points...`)
        try {
          // Add a small delay to ensure order is fully processed
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Use order total from response, or fallback to calculated total from frontend
          let orderTotal = parseFloat(order.total || '0')
          if (orderTotal === 0 && calculatedTotal && calculatedTotal > 0) {
            console.log(`⚠️ API returned $0 total, using calculated total from frontend: $${calculatedTotal}`)
            orderTotal = calculatedTotal
          } else if (orderTotal === 0) {
            console.log(`⚠️ API returned $0 total and no calculated total provided`)
            orderTotal = 1 // Fallback for testing
            console.log(`🔄 Using fallback total of $${orderTotal} for testing`)
          }
          
          await this.awardPointsForOrder(order.customer_id, order.id, orderTotal)
          console.log(`✅ Successfully awarded loyalty points to customer ${order.customer_id} for order ${order.id}`)
        } catch (pointsError) {
          console.error(`❌ Failed to award points for order ${order.id}:`, pointsError)
          // Don't fail the order if points fail
        }
      } else {
        console.warn(`⚠️ No customer ID found in order response. Order data:`, order)
        console.warn(`⚠️ Original order data customer_id:`, orderData.customer_id)
        console.warn(`⚠️ Checking if customer_id was passed in original order data...`)
        
        // Try to use the customer_id from the original order data if the response doesn't have it
        if (orderData.customer_id && orderData.customer_id > 0) {
          console.log(`🔄 Using customer_id from original order data: ${orderData.customer_id}`)
          try {
            // Add a small delay to ensure order is fully processed
            await new Promise(resolve => setTimeout(resolve, 1000))
            await this.awardPointsForOrder(orderData.customer_id, order.id, parseFloat(order.total || '0'))
            console.log(`✅ Successfully awarded loyalty points to customer ${orderData.customer_id} for order ${order.id}`)
          } catch (pointsError) {
            console.error(`❌ Failed to award points for order ${order.id}:`, pointsError)
          }
        }
      }
      
      return order
    } catch (error) {
      console.error('Failed to create order:', error)
      throw error
    }
  }

  // Award loyalty points for completed order
  private async awardPointsForOrder(customerId: number, orderId: number, orderTotal: number): Promise<void> {
    try {
      console.log(`💰 Calculating points for order ${orderId}: $${orderTotal} → ${Math.floor(orderTotal)} points`)
      console.log(`🔍 Customer ID: ${customerId}, Order ID: ${orderId}, Order Total: $${orderTotal}`)
      
      // Calculate points based on order total (1 point per dollar spent)
      const pointsToAward = Math.floor(orderTotal)
      
      if (pointsToAward <= 0) {
        console.log(`⚠️ No points to award for order ${orderId} (total: $${orderTotal})`)
        return
      }

      console.log(`🎯 Awarding ${pointsToAward} points to customer ${customerId} via multiple methods...`)
      
      // Get initial balance for comparison
      let initialBalance = 0
      try {
        console.log(`🔍 Getting initial points balance...`)
        const balanceResponse = await fetch(`${this.baseUrl}/wp-json/wc-points-rewards/v1/user/${customerId}/balance`, {
          headers: {
            'Authorization': createAuthHeader(),
            'Content-Type': 'application/json',
          }
        })
        
        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json()
          initialBalance = balanceData.balance || 0
          console.log(`📊 Initial balance: ${initialBalance} points`)
        } else {
          const balanceError = await balanceResponse.text()
          console.warn(`⚠️ Could not get initial balance: ${balanceResponse.status} - ${balanceError}`)
        }
      } catch (balanceError) {
        console.error(`❌ Initial balance check failed:`, balanceError)
      }
      
      // Method 1: Try the direct points adjustment endpoint (this one works!)
      try {
        console.log(`🎯 Method 1: Trying direct points adjustment endpoint...`)
        const authHeader = createAuthHeader()
        console.log(`🔐 Using auth header: ${authHeader.substring(0, 20)}...`)
        console.log(`🌐 Request URL: ${this.baseUrl}/wp-json/wc-points-rewards/v1/user/${customerId}/adjust`)
        console.log(`📦 Request payload:`, {
          points: pointsToAward,
          description: `Points earned from order #${orderId} ($${orderTotal.toFixed(2)})`
        })
        
        const adjustResponse = await fetch(`${this.baseUrl}/wp-json/wc-points-rewards/v1/user/${customerId}/adjust`, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            points: pointsToAward,
            description: `Points earned from order #${orderId} ($${orderTotal.toFixed(2)})`
          })
        })
        
        console.log(`📡 Direct adjustment response: ${adjustResponse.status} ${adjustResponse.statusText}`)
        
        if (adjustResponse.ok) {
          const adjustResult = await adjustResponse.json()
          console.log(`✅ Direct adjustment succeeded!`, adjustResult)
          console.log(`🎉 Customer ${customerId} balance: ${adjustResult.previous_balance} → ${adjustResult.new_balance} points`)
          
          // Double-check the balance to make sure points were actually saved
          console.log(`🔍 Double-checking balance to verify points were saved...`)
          try {
            await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
            const verifyResponse = await fetch(`${this.baseUrl}/wp-json/wc-points-rewards/v1/user/${customerId}/balance`, {
              headers: {
                'Authorization': createAuthHeader(),
                'Content-Type': 'application/json',
              }
            })
            
            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json()
              const currentBalance = verifyData.balance || 0
              console.log(`🔍 VERIFICATION: Customer ${customerId} current balance is ${currentBalance} points`)
              
              if (currentBalance >= adjustResult.new_balance) {
                console.log(`✅ CONFIRMED: Points were successfully saved to the database!`)
              } else {
                console.error(`❌ WARNING: Points may not have been saved! Expected ${adjustResult.new_balance}, got ${currentBalance}`)
              }
            } else {
              console.warn(`⚠️ Could not verify balance: ${verifyResponse.status}`)
            }
          } catch (verifyError) {
            console.warn(`⚠️ Balance verification failed:`, verifyError)
          }
          
          return // Success! No need to try other methods
        } else {
          const adjustError = await adjustResponse.text()
          console.warn(`⚠️ Direct adjustment failed: ${adjustResponse.status} - ${adjustError}`)
        }
      } catch (adjustError) {
        console.warn(`⚠️ Direct adjustment approach failed:`, adjustError)
      }

      // Method 2: Try the webhook endpoint
      try {
        console.log(`🎯 Method 2: Trying webhook approach for order completion...`)
        console.log(`🌐 Webhook URL: ${this.baseUrl}/wp-json/wc-points-rewards/v1/webhook/order-complete`)
        console.log(`📦 Webhook payload: { order_id: ${orderId} }`)
        
        const webhookResponse = await fetch(`${this.baseUrl}/wp-json/wc-points-rewards/v1/webhook/order-complete`, {
          method: 'POST',
          headers: {
            'Authorization': createAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            order_id: orderId
          })
        })
        
        console.log(`📡 Webhook response status: ${webhookResponse.status} ${webhookResponse.statusText}`)
        
        if (webhookResponse.ok) {
          const webhookResult = await webhookResponse.json()
          console.log(`✅ Webhook succeeded! Response:`, webhookResult)
          return await this.verifyPointsAwarded(customerId, initialBalance, pointsToAward)
        } else {
          const webhookError = await webhookResponse.text()
          console.warn(`⚠️ Webhook failed: ${webhookResponse.status} - ${webhookError}`)
        }
      } catch (webhookError) {
        console.warn(`⚠️ Webhook approach failed:`, webhookError)
      }
      
      // Method 3: Fallback to direct points adjustment
      console.log(`🎯 Method 3: Trying direct points adjustment...`)
      const pointsPayload = {
        points: pointsToAward,
        description: `Points earned from order #${orderId} ($${orderTotal.toFixed(2)})`
      }
      
      console.log(`📡 Points API request:`, {
        url: `${this.baseUrl}/wp-json/wc-points-rewards/v1/user/${customerId}/adjust`,
        payload: pointsPayload,
        headers: {
          'Authorization': 'Basic [REDACTED]',
          'Content-Type': 'application/json',
        }
      })

      const response = await fetch(`${this.baseUrl}/wp-json/wc-points-rewards/v1/user/${customerId}/adjust`, {
        method: 'POST',
        headers: {
          'Authorization': createAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pointsPayload)
      })

      console.log(`📡 Points API response status: ${response.status} ${response.statusText}`)
      console.log(`📡 Points API response headers:`, Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Points API error response:`, errorText)
        
        // Try one more approach - check if the user has a points balance endpoint we can check
        console.log(`🔍 Checking if customer ${customerId} has points account...`)
        try {
          const balanceResponse = await fetch(`${this.baseUrl}/wp-json/wc-points-rewards/v1/user/${customerId}/balance`, {
            headers: {
              'Authorization': createAuthHeader(),
              'Content-Type': 'application/json',
            }
          })
          
          if (balanceResponse.ok) {
            const balanceData = await balanceResponse.json()
            console.log(`💳 Customer ${customerId} points balance:`, balanceData)
          } else {
            console.warn(`⚠️ Could not check customer balance: ${balanceResponse.status}`)
          }
        } catch (balanceError) {
          console.warn(`⚠️ Balance check failed:`, balanceError)
        }
        
        throw new Error(`Points API returned ${response.status}: ${response.statusText} - ${errorText}`)
      }

      const result = await response.json()
      console.log(`✅ Direct API points awarded! Response:`, result)
      console.log(`🎉 Customer ${customerId} now has ${result.new_balance || 'unknown'} points (was ${result.previous_balance || 'unknown'})`)
      
      return await this.verifyPointsAwarded(customerId, initialBalance, pointsToAward)
    } catch (error) {
      console.error(`❌ Failed to award points to customer ${customerId}:`, error)
      throw error
    }
  }

  // Test the points awarding endpoint directly
  async testPointsEndpoint(customerId: number, points: number = 5): Promise<void> {
    try {
      console.log(`🧪 Testing points endpoint with customer ${customerId} and ${points} points...`)
      
      // Get initial balance
      const initialResponse = await fetch(`${this.baseUrl}/wp-json/wc-points-rewards/v1/user/${customerId}/balance`, {
        headers: {
          'Authorization': createAuthHeader(),
          'Content-Type': 'application/json',
        }
      })
      
      let initialBalance = 0
      if (initialResponse.ok) {
        const initialData = await initialResponse.json()
        initialBalance = initialData.balance || 0
        console.log(`📊 Initial balance: ${initialBalance} points`)
      } else {
        console.warn(`⚠️ Could not get initial balance: ${initialResponse.status}`)
      }
      
      // Test the new endpoint
      const testResponse = await fetch(`${this.baseUrl}/wp-json/wc-points-rewards/v1/award-points`, {
        method: 'POST',
        headers: {
          'Authorization': createAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: customerId,
          points: points,
          reason: `Test points from POS system - ${new Date().toISOString()}`
        })
      })
      
      console.log(`📡 Test endpoint response: ${testResponse.status} ${testResponse.statusText}`)
      
      if (testResponse.ok) {
        const result = await testResponse.json()
        console.log(`✅ Test endpoint succeeded!`, result)
        
        // Verify the balance increased
        const finalResponse = await fetch(`${this.baseUrl}/wp-json/wc-points-rewards/v1/user/${customerId}/balance`, {
          headers: {
            'Authorization': createAuthHeader(),
            'Content-Type': 'application/json',
          }
        })
        
        if (finalResponse.ok) {
          const finalData = await finalResponse.json()
          const finalBalance = finalData.balance || 0
          const actualPointsAdded = finalBalance - initialBalance
          
          console.log(`📊 Final balance: ${finalBalance} points`)
          console.log(`📈 Points added: ${actualPointsAdded} (expected: ${points})`)
          
          if (actualPointsAdded >= points) {
            console.log(`🎉 SUCCESS! Points endpoint is working correctly!`)
          } else {
            console.error(`❌ FAILED: Expected ${points} points but only ${actualPointsAdded} were added`)
          }
        }
      } else {
        const errorText = await testResponse.text()
        console.error(`❌ Test endpoint failed: ${testResponse.status} - ${errorText}`)
      }
    } catch (error) {
      console.error(`❌ Test endpoint error:`, error)
    }
  }

  // Verify that points were actually awarded by checking balance
  private async verifyPointsAwarded(customerId: number, initialBalance: number, expectedPoints: number): Promise<void> {
    try {
      console.log(`🔍 Verifying points were awarded...`)
      const verifyResponse = await fetch(`${this.baseUrl}/wp-json/wc-points-rewards/v1/user/${customerId}/balance`, {
        headers: {
          'Authorization': createAuthHeader(),
          'Content-Type': 'application/json',
        }
      })
      
      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json()
        const currentBalance = verifyData.balance || 0
        const actualPointsAdded = currentBalance - initialBalance
        
        console.log(`📊 Points verification:`)
        console.log(`  Initial balance: ${initialBalance}`)
        console.log(`  Current balance: ${currentBalance}`)
        console.log(`  Expected points: ${expectedPoints}`)
        console.log(`  Actual points added: ${actualPointsAdded}`)
        
        if (actualPointsAdded >= expectedPoints) {
          console.log(`✅ SUCCESS! Points were successfully awarded!`)
        } else if (actualPointsAdded > 0) {
          console.warn(`⚠️ PARTIAL SUCCESS: ${actualPointsAdded} points added (expected ${expectedPoints})`)
        } else {
          console.error(`❌ FAILED: No points were added to customer ${customerId}`)
          throw new Error(`Points verification failed: No points were added`)
        }
      } else {
        console.warn(`⚠️ Could not verify points: ${verifyResponse.status}`)
      }
    } catch (verifyError) {
      console.warn(`⚠️ Points verification failed:`, verifyError)
    }
  }

  // Map WooCommerce product to FloraProduct interface
  private mapToFloraProduct(product: any): FloraProduct {
    // Helper function to get meta value
    const getMetaValue = (key: string): string | undefined => {
      const meta = product.meta_data?.find((item: any) => item.key === key)
      return meta?.value
    }

    // Parse Addify meta data
    const mli_product_type = getMetaValue('mli_product_type') as 'weight' | 'quantity' | undefined
    const mli_weight_options = getMetaValue('mli_weight_options')
    const mli_preroll_conversion = parseFloat(getMetaValue('mli_preroll_conversion') || '0.7')
    const mli_pricing_tiers = getMetaValue('mli_pricing_tiers')

    // Parse weight options into array
    const weight_options = mli_weight_options 
      ? mli_weight_options.split(',').map(w => parseFloat(w.trim())).filter(w => !isNaN(w))
      : undefined

    // Parse pricing tiers JSON (handle both simple and nested structures)
    let pricing_tiers: Record<string, number> | undefined
    let preroll_pricing_tiers: Record<string, number> | undefined
    if (mli_pricing_tiers) {
      try {
        const parsed = JSON.parse(mli_pricing_tiers)
        // Check if it's a nested structure (like flower products)
        if (parsed.flower && typeof parsed.flower === 'object') {
          // Use the flower pricing for flower products
          pricing_tiers = parsed.flower
          // Also extract preroll pricing if available
          if (parsed.preroll && typeof parsed.preroll === 'object') {
            preroll_pricing_tiers = parsed.preroll
          }
        } else if (typeof parsed === 'object' && !Array.isArray(parsed)) {
          // Simple structure (like concentrates)
          pricing_tiers = parsed
        }
      } catch (e) {
        console.warn(`Failed to parse pricing tiers for product ${product.id}:`, mli_pricing_tiers)
      }
    }

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
      status: product.status || 'publish',
      // Addify Multi-Location Inventory fields
      mli_product_type,
      mli_weight_options,
      mli_preroll_conversion,
      mli_pricing_tiers,
      // Parsed fields for easier use
      weight_options,
      pricing_tiers,
      preroll_pricing_tiers
    }
  }
}

// Export singleton instance
export const floraAPI = new FloraAPI()

// Expose test function globally for debugging
if (typeof window !== 'undefined') {
  (window as any).testPointsEndpoint = (customerId: number, points: number = 5) => {
    return floraAPI.testPointsEndpoint(customerId, points)
  }
}

// Export utility function for external use
export const createWooHeaders = () => ({
  'Authorization': createAuthHeader(),
  'Content-Type': 'application/json',
}) 