// Flora Distro WooCommerce API Service
const FLORA_API_BASE = 'https://api.floradistro.com/wp-json/wc/v3'
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5'
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678'

// Weight-based pricing for different product types (EXACT match to Flora website)
export const PRODUCT_PRICING = {
  flower: {
    '1g': 15,
    '3.5g': 40,
    '7g': 60,
    '14g': 110,
    '28g': 200
  },
  concentrate: {
    '1g': 55,
    '3.5g': 170,
    '7g': 320,
    '14g': 600,
    '28g': 1100
  },
  wax: {
    '0.5g': 30,
    '1g': 55,
    '2g': 100,
    '3.5g': 170,
    '7g': 320
  },
  edible: {
    '1-pack': 8,
    '2-pack': 15,
    '3-pack': 22,
    '4-pack': 28,
    '10-pack': 60,
    '20-pack': 110,
    '50-pack': 250
  },
  moonwater: {
    'Original': 12,
    'Citrus': 12,
    'Berry': 12,
    'Tropical': 12,
    'Herbal': 12,
    'Mint': 12
  },
  vape: {
    '1': 49.99,
    '2': 79.99,
    '3': 104.99,
    '4': 124.99
  }
};

// Category ID mappings from Flora's WooCommerce
const CATEGORY_MAPPINGS = {
  flower: '1357',
  concentrate: '1408', 
  wax: '1408',
  edible: '1356',
  moonwater: '1356', // Same as edible for now
  vape: '1374'
};

// Helper function to determine product category from various sources
export const determineProductCategory = (product: FloraProduct): string => {
  // Check category slug first
  const categorySlug = product.categories?.[0]?.slug || ''
  if (categorySlug) {
    console.log(`Product ${product.name} has category slug: ${categorySlug}`)
    if (categorySlug.includes('moonwater') || categorySlug.includes('beverage') || categorySlug.includes('drink')) {
      return 'moonwater'
    }
    return categorySlug
  }
  
  // Check all category names (not just first one)
  const categories = product.categories?.map(cat => cat.name.toLowerCase()) || []
  const isMoonwater = categories.some(cat => 
    ['moonwater', 'beverage', 'drink', 'drinks'].includes(cat) ||
    cat.includes('moonwater') || cat.includes('beverage') || cat.includes('drink')
  )
  
  if (isMoonwater) {
    console.log(`Product ${product.name} identified as moonwater by categories: ${categories.join(', ')}`)
    return 'moonwater'
  }
  
  // Check first category name for other types
  const categoryName = categories[0] || ''
  if (categoryName) {
    console.log(`Product ${product.name} has category name: ${categoryName}`)
    if (categoryName.includes('flower')) return 'flower'
    if (categoryName.includes('vape')) return 'vape'
    if (categoryName.includes('edible')) return 'edible'
    if (categoryName.includes('concentrate')) return 'concentrate'
    if (categoryName.includes('wax')) return 'wax'
  }
  
  // Check category ID
  const categoryId = product.categories?.[0]?.id?.toString() || ''
  if (categoryId) {
    console.log(`Product ${product.name} has category ID: ${categoryId}`)
    if (categoryId === '1357') return 'flower'
    if (categoryId === '1374') return 'vape'
    if (categoryId === '1356') {
      // Check if it's moonwater by name
      if (product.name.toLowerCase().includes('moonwater')) return 'moonwater'
      return 'edible'
    }
    if (categoryId === '1408') return 'concentrate'
  }
  
  // Check product name for moonwater
  if (product.name.toLowerCase().includes('moonwater')) {
    console.log(`Product ${product.name} identified as moonwater by name`)
    return 'moonwater'
  }
  
  console.log(`Product ${product.name} - no clear category found, defaulting to flower`)
  return 'flower' // Default fallback
};

export interface FloraVariation {
  id: number;
  price: string;
  regular_price: string;
  sale_price: string;
  attributes: Array<{
    id: number;
    name: string;
    option: string;
  }>;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  stock_quantity: number | null;
  manage_stock: boolean;
}

export interface FloraProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  stock_quantity: number | null;
  categories: Array<{ id: number; name: string; slug: string; }>;
  images: Array<{ id: number; src: string; name: string; alt: string; }>;
  attributes: Array<{ id: number; name: string; options: string[]; }>;
  meta_data: Array<{ key: string; value: any; }>;
  variations?: number[];
  has_options?: boolean;
  type: string; // 'simple' | 'variable'
  // Variations data
  variationsData?: FloraVariation[];
}

export interface FloraCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  image?: {
    id: number;
    src: string;
    name: string;
    alt: string;
  };
  count: number;
}

export interface CreateOrderData {
  payment_method: string;
  payment_method_title: string;
  set_paid: boolean;
  line_items: Array<{
    product_id: number;
    quantity: number;
    variation_id?: number;
  }>;
  billing?: {
    email?: string;
  };
}

class FloraWooCommerceAPI {
  private baseURL: string
  private auth: string

  constructor() {
    this.baseURL = FLORA_API_BASE
    this.auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64')
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    const url = new URL(`${this.baseURL}${endpoint}`)
    
    // Add parameters to URL
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${this.auth}`,
        'Content-Type': 'application/json',
      },
      mode: 'cors',
    })

    if (!response.ok) {
      throw new Error(`Flora API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async getProducts(params: {
    per_page?: number;
    page?: number;
    category?: string;
    search?: string;
    status?: string;
  } = {}): Promise<FloraProduct[]> {
    const defaultParams = { per_page: 50, status: 'publish', ...params }
    const products = await this.makeRequest<FloraProduct[]>('/products', defaultParams)
    
    // Fetch variations for variable products
    const productsWithVariations = await Promise.all(
      products.map(async (product) => {
        if (product.type === 'variable' && product.variations && product.variations.length > 0) {
          try {
            const variations = await this.getProductVariations(product.id)
            return { ...product, variationsData: variations, has_options: true }
          } catch (error) {
            console.warn(`Failed to fetch variations for product ${product.id}:`, error)
            return { ...product, has_options: true }
          }
        }
        return { ...product, has_options: false }
      })
    )
    
    return productsWithVariations
  }

  async getProductVariations(productId: number): Promise<FloraVariation[]> {
    try {
      const variations = await this.makeRequest<FloraVariation[]>(`/products/${productId}/variations`, { per_page: 100 })
      return variations
    } catch (error) {
      console.warn(`Failed to fetch variations for product ${productId}:`, error)
      return []
    }
  }

  async getProductsByCategory(categorySlug: string, perPage: number = 50): Promise<FloraProduct[]> {
    return this.getProducts({ per_page: perPage, category: categorySlug })
  }

  async getCategories(): Promise<FloraCategory[]> {
    return this.makeRequest<FloraCategory[]>('/products/categories', { per_page: 100 })
  }

  async getProduct(id: number): Promise<FloraProduct> {
    const product = await this.makeRequest<FloraProduct>(`/products/${id}`)
    
    // Fetch variations if it's a variable product
    if (product.type === 'variable' && product.variations && product.variations.length > 0) {
      try {
        const variations = await this.getProductVariations(product.id)
        return { ...product, variationsData: variations, has_options: true }
      } catch (error) {
        console.warn(`Failed to fetch variations for product ${product.id}:`, error)
        return { ...product, has_options: true }
      }
    }
    
    return { ...product, has_options: false }
  }

  async createOrder(orderData: CreateOrderData): Promise<any> {
    // For now, this is a mock implementation for the POS system
    // In a real implementation, this would make an API call to create the order
    console.log('Creating order:', orderData)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Return a mock order response
    return {
      id: Math.floor(Math.random() * 10000),
      status: 'completed',
      total: orderData.line_items.reduce((sum, item) => sum + (item.quantity * 10), 0), // Mock calculation
      payment_method: orderData.payment_method,
      date_created: new Date().toISOString(),
    }
  }
}

export const floraAPI = new FloraWooCommerceAPI()

// Helper function to get ACF values from meta_data
export const getACFValue = (product: FloraProduct, acfKey: string): string | undefined => {
  const metaValue = product.meta_data?.find((m: any) => m.key === acfKey)?.value;
  if (metaValue && typeof metaValue === 'string' && metaValue.trim()) {
    return metaValue.trim();
  }
  return undefined;
};

// Helper functions for Flora products
export const getProductPrice = (product: FloraProduct, selectedVariation?: string): number => {
  // For products with actual WooCommerce variations, use the variation price
  if (product.has_options && product.variationsData && selectedVariation) {
    // Find the matching variation by checking all attribute types
    const variation = product.variationsData.find(v => 
      v.attributes.some(attr => 
        (attr.name === 'Weight' || attr.name === 'Size' || attr.name === 'Quantity' || 
         attr.name === 'Flavor' || attr.name === 'Pack Size') && 
        attr.option === selectedVariation
      )
    )
    if (variation) {
      const price = parseFloat(variation.price || variation.regular_price || '0')
      if (price > 0) {
        console.log(`Found variation price: $${price} for ${selectedVariation}`)
        return price
      }
    }
  }
  
  // Fallback to hardcoded pricing for products without proper variations
  if (selectedVariation) {
    const categoryKey = determineProductCategory(product) as keyof typeof PRODUCT_PRICING
    
    console.log(`Product: ${product.name}, Using category: ${categoryKey}, Variation: ${selectedVariation}`)
    
    const categoryPricing = PRODUCT_PRICING[categoryKey] || PRODUCT_PRICING.flower
    if (categoryPricing && categoryPricing[selectedVariation as keyof typeof categoryPricing]) {
      const price = categoryPricing[selectedVariation as keyof typeof categoryPricing]
      console.log(`Found hardcoded price: $${price} for ${selectedVariation}`)
      return price
    } else {
      console.log(`No pricing found for ${categoryKey} - ${selectedVariation}`)
    }
  }
  
  return parseFloat(product.sale_price || product.price || '0')
}

export const getRegularPrice = (product: FloraProduct): number => {
  return parseFloat(product.regular_price || product.price || '0')
}

export const isOnSale = (product: FloraProduct): boolean => {
  return product.on_sale && !!product.sale_price && parseFloat(product.sale_price) < parseFloat(product.regular_price || product.price || '0')
}

export const getProductImage = (product: FloraProduct): string => {
  if (product.images && product.images.length > 0) {
    return product.images[0].src
  }
  return '/flora_chip_optimized.webp' // Fallback image
}

export const getProductCategory = (product: FloraProduct): string => {
  if (product.categories && product.categories.length > 0) {
    return product.categories[0].name
  }
  return 'Cannabis'
}

export const getStockStatus = (product: FloraProduct): 'in-stock' | 'low-stock' | 'out-of-stock' => {
  if (product.stock_status === 'outofstock') return 'out-of-stock'
  if (product.stock_quantity !== null && product.stock_quantity <= 10) return 'low-stock'
  return 'in-stock'
}

// Get available sizes/variations for a product based on category
export const getProductSizes = (product: FloraProduct): string[] => {
  const categoryKey = determineProductCategory(product)
  
  console.log(`Getting sizes for: ${product.name}, Category: ${categoryKey}`)
  
  // If product has variations, extract from variations data
  if (product.has_options && product.variationsData && product.variationsData.length > 0) {
    const sizes = product.variationsData
      .map(variation => {
        // Check for all possible attribute types (Weight, Size, Quantity, Flavor, Pack Size)
        const sizeAttr = variation.attributes.find(attr => 
          attr.name === 'Weight' || attr.name === 'Size' || attr.name === 'Quantity' ||
          attr.name === 'Flavor' || attr.name === 'Pack Size'
        )
        return sizeAttr?.option
      })
      .filter(Boolean) as string[]
    
    if (sizes.length > 0) {
      console.log(`Found variation sizes: ${sizes.join(', ')}`)
      return Array.from(new Set(sizes)) // Remove duplicates
    }
  }
  
  // Always return default sizes based on category - EXACT match to Flora website
  switch (categoryKey) {
    case 'flower':
      console.log('Using flower sizes (Flora website exact)')
      return ['1g', '3.5g', '7g', '14g', '28g']
    case 'concentrate':
      console.log('Using concentrate sizes (Flora website exact)')
      return ['1g', '3.5g', '7g', '14g', '28g']
    case 'wax':
      console.log('Using wax sizes (Flora website exact)')
      return ['0.5g', '1g', '2g', '3.5g', '7g']
    case 'edible':
      console.log('Using edible quantities')
      return ['1-pack', '2-pack', '3-pack', '4-pack', '10-pack', '20-pack', '50-pack']
    case 'moonwater':
      console.log('Using moonwater flavors')
      return ['Original', 'Citrus', 'Berry', 'Tropical', 'Herbal', 'Mint']
    case 'vape':
      console.log('Using vape sizes')
      return ['1', '2', '3', '4']
    default:
      console.log('Using default flower sizes')
      return ['1g', '3.5g', '7g', '14g', '28g']
  }
}

// Get default selection for a product
export const getDefaultSelection = (product: FloraProduct): string => {
  const categoryKey = determineProductCategory(product)
  const sizes = getProductSizes(product)
  
  switch (categoryKey) {
    case 'flower':
      return '3.5g' // Most popular flower size on Flora website
    case 'concentrate':
      return '1g' // Most popular concentrate size
    case 'wax':
      return '1g' // Most popular wax size  
    case 'edible':
      return '10mg' // Most popular edible dosage
    case 'vape':
      return '1' // Single vape default
    default:
      return '3.5g'
  }
}

export const sampleFloraProducts: FloraProduct[] = [
  {
    id: 999,
    name: "White Runtz",
    slug: "white-runtz",
    description: "Premium indoor flower with exceptional quality and potency.",
    short_description: "Premium indoor flower",
    price: "45.00",
    regular_price: "45.00",
    sale_price: "",
    on_sale: false,
    stock_status: "instock",
    stock_quantity: 50,
    type: "variable",
    has_options: true,
    categories: [{ id: 1357, name: "Flower", slug: "flower" }],
    images: [{ id: 1, src: "/flora_chip_optimized.webp", name: "White Runtz", alt: "White Runtz Cannabis Flower" }],
    attributes: [{ id: 1, name: "Weight", options: ["0.5g", "1g", "2g", "3.5g", "7g", "14g", "28g"] }],
    meta_data: [
      { key: "thca_%", value: "28.5" },
      { key: "nose", value: "Sweet, Fruity" },
      { key: "effects", value: "Relaxing" },
      { key: "terpene", value: "Limonene" },
      { key: "strain_type", value: "Hybrid" },
      { key: "lineage", value: "Zkittlez x Gelato" }
    ],
    variations: [1, 2, 3, 4, 5, 6, 7]
  },
  {
    id: 998,
    name: "Blue Dream Vape",
    slug: "blue-dream-vape",
    description: "Premium vape cartridge with smooth vapor and excellent flavor.",
    short_description: "Premium vape cartridge",
    price: "49.99",
    regular_price: "49.99",
    sale_price: "",
    on_sale: false,
    stock_status: "instock",
    stock_quantity: 25,
    type: "variable",
    has_options: true,
    categories: [{ id: 1374, name: "Vape", slug: "vape" }],
    images: [{ id: 2, src: "/flora_chip_optimized.webp", name: "Blue Dream Vape", alt: "Blue Dream Vape Cartridge" }],
    attributes: [{ id: 2, name: "Quantity", options: ["1", "2", "3", "4"] }],
    meta_data: [
      { key: "thca_%", value: "85.2" },
      { key: "nose", value: "Berry, Sweet" },
      { key: "effects", value: "Uplifting" },
      { key: "terpene", value: "Myrcene" },
      { key: "strain_type", value: "Sativa" },
      { key: "lineage", value: "Blueberry x Haze" }
    ],
    variations: [8, 9, 10, 11]
  },
  {
    id: 997,
    name: "Strawberry Gummies",
    slug: "strawberry-gummies",
    description: "Delicious strawberry-flavored gummies with precise dosing.",
    short_description: "Strawberry-flavored gummies",
    price: "25.00",
    regular_price: "25.00",
    sale_price: "",
    on_sale: false,
    stock_status: "instock",
    stock_quantity: 15,
    type: "variable",
    has_options: true,
    categories: [{ id: 1356, name: "Edible", slug: "edible" }],
    images: [{ id: 3, src: "/flora_chip_optimized.webp", name: "Strawberry Gummies", alt: "Strawberry Cannabis Gummies" }],
    attributes: [{ id: 3, name: "Dosage", options: ["5mg", "10mg", "25mg", "50mg"] }],
    meta_data: [
      { key: "thca_%", value: "10" },
      { key: "nose", value: "Strawberry, Sweet" },
      { key: "effects", value: "Relaxing" },
      { key: "strain_type", value: "Hybrid" }
    ],
    variations: [12, 13, 14, 15]
  },
  {
    id: 996,
    name: "Citrus Moonwater",
    slug: "citrus-moonwater",
    description: "Refreshing cannabis-infused beverage with bright citrus flavors.",
    short_description: "Citrus-flavored cannabis beverage",
    price: "12.00",
    regular_price: "12.00",
    sale_price: "",
    on_sale: false,
    stock_status: "instock",
    stock_quantity: 20,
    type: "variable",
    has_options: true,
    categories: [{ id: 1360, name: "Moonwater", slug: "moonwater" }],
    images: [{ id: 4, src: "/icons/Moonwater.png", name: "Citrus Moonwater", alt: "Citrus Moonwater Cannabis Beverage" }],
    attributes: [
      { id: 1, name: "Flavor", options: ["Citrus", "Berry", "Tropical"] },
      { id: 2, name: "Pack Size", options: ["Single", "4-pack", "12-pack"] }
    ],
    meta_data: [
      { key: "strength_mg", value: "10" },
      { key: "effects", value: "Uplifting Energizing Social" },
      { key: "strain_type", value: "Sativa" }
    ],
    variations: [1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009],
    variationsData: [
      {
        id: 1001,
        price: "12.00",
        regular_price: "12.00",
        sale_price: "",
        stock_status: "instock",
        stock_quantity: 20,
        manage_stock: true,
        attributes: [
          { id: 1, name: "Flavor", option: "Citrus" },
          { id: 2, name: "Pack Size", option: "Single" }
        ]
      },
      {
        id: 1002,
        price: "45.00",
        regular_price: "45.00",
        sale_price: "",
        stock_status: "instock",
        stock_quantity: 20,
        manage_stock: true,
        attributes: [
          { id: 1, name: "Flavor", option: "Citrus" },
          { id: 2, name: "Pack Size", option: "4-pack" }
        ]
      },
      {
        id: 1003,
        price: "120.00",
        regular_price: "120.00",
        sale_price: "",
        stock_status: "instock",
        stock_quantity: 20,
        manage_stock: true,
        attributes: [
          { id: 1, name: "Flavor", option: "Citrus" },
          { id: 2, name: "Pack Size", option: "12-pack" }
        ]
      },
      {
        id: 1004,
        price: "12.00",
        regular_price: "12.00",
        sale_price: "",
        stock_status: "instock",
        stock_quantity: 20,
        manage_stock: true,
        attributes: [
          { id: 1, name: "Flavor", option: "Berry" },
          { id: 2, name: "Pack Size", option: "Single" }
        ]
      },
      {
        id: 1005,
        price: "45.00",
        regular_price: "45.00",
        sale_price: "",
        stock_status: "instock",
        stock_quantity: 15,
        manage_stock: true,
        attributes: [
          { id: 1, name: "Flavor", option: "Berry" },
          { id: 2, name: "Pack Size", option: "4-pack" }
        ]
      },
      {
        id: 1006,
        price: "120.00",
        regular_price: "120.00",
        sale_price: "",
        stock_status: "instock",
        stock_quantity: 15,
        manage_stock: true,
        attributes: [
          { id: 1, name: "Flavor", option: "Berry" },
          { id: 2, name: "Pack Size", option: "12-pack" }
        ]
      },
      {
        id: 1007,
        price: "12.00",
        regular_price: "12.00",
        sale_price: "",
        stock_status: "instock",
        stock_quantity: 20,
        manage_stock: true,
        attributes: [
          { id: 1, name: "Flavor", option: "Tropical" },
          { id: 2, name: "Pack Size", option: "Single" }
        ]
      },
      {
        id: 1008,
        price: "45.00",
        regular_price: "45.00",
        sale_price: "",
        stock_status: "instock",
        stock_quantity: 15,
        manage_stock: true,
        attributes: [
          { id: 1, name: "Flavor", option: "Tropical" },
          { id: 2, name: "Pack Size", option: "4-pack" }
        ]
      },
      {
        id: 1009,
        price: "120.00",
        regular_price: "120.00",
        sale_price: "",
        stock_status: "instock",
        stock_quantity: 15,
        manage_stock: true,
        attributes: [
          { id: 1, name: "Flavor", option: "Tropical" },
          { id: 2, name: "Pack Size", option: "12-pack" }
        ]
      }
    ]
  },
  {
    id: 995,
    name: "Mixed Berry Gummies",
    slug: "mixed-berry-gummies",
    description: "Delicious mixed berry gummies with precise 5mg dosing per piece.",
    short_description: "Mixed berry cannabis gummies",
    price: "20.00",
    regular_price: "20.00",
    sale_price: "",
    on_sale: false,
    stock_status: "instock",
    stock_quantity: 12,
    type: "simple",
    has_options: false,
    categories: [{ id: 1356, name: "Edible", slug: "edible" }],
    images: [{ id: 5, src: "/flora_chip_optimized.webp", name: "Mixed Berry Gummies", alt: "Mixed Berry Cannabis Gummies" }],
    attributes: [],
    meta_data: [
      { key: "strength_mg", value: "5" },
      { key: "effects", value: "Relaxing Euphoric Sleepy" },
      { key: "strain_type", value: "Indica" }
    ],
    variations: []
  }
] 

// Sample moonwater products for testing
const sampleMoonwaterProducts: FloraProduct[] = [
  {
    id: 9001,
    name: "Moonwater - Original Flavor",
    slug: "moonwater-original",
    description: "Refreshing moonwater beverage with calming effects",
    short_description: "10mg THC moonwater beverage",
    price: "12.00",
    regular_price: "12.00",
    sale_price: "",
    on_sale: false,
    stock_status: "instock",
    stock_quantity: 50,
    categories: [{ id: 1356, name: "Moonwater", slug: "moonwater" }],
    images: [{ 
      id: 1, 
      src: "/icons/Moonwater.png", 
      name: "moonwater", 
      alt: "Moonwater beverage"
    }],
    attributes: [
      {
        id: 1,
        name: "Flavor",
        options: ["Original", "Citrus", "Berry", "Tropical"]
      },
      {
        id: 2,
        name: "Pack Size",
        options: ["Single", "4-Pack"]
      }
    ],
    meta_data: [
      { key: "strength_mg", value: "10" },
      { key: "effects", value: "Refreshing, Hydrating, Calming" }
    ],
    variations: [1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008],
    has_options: true,
    type: "variable",
    variationsData: [
      {
        id: 1001,
        price: "12.00",
        regular_price: "12.00",
        sale_price: "",
        stock_status: "instock",
        stock_quantity: 20,
        manage_stock: true,
        attributes: [
          { id: 1, name: "Flavor", option: "Original" },
          { id: 2, name: "Pack Size", option: "Single" }
        ]
      },
      {
        id: 1002,
        price: "12.00",
        regular_price: "12.00",
        sale_price: "",
        stock_status: "instock",
        stock_quantity: 20,
        manage_stock: true,
        attributes: [
          { id: 1, name: "Flavor", option: "Citrus" },
          { id: 2, name: "Pack Size", option: "Single" }
        ]
      },
      {
        id: 1003,
        price: "12.00",
        regular_price: "12.00",
        sale_price: "",
        stock_status: "instock",
        stock_quantity: 20,
        manage_stock: true,
        attributes: [
          { id: 1, name: "Flavor", option: "Berry" },
          { id: 2, name: "Pack Size", option: "Single" }
        ]
      },
      {
        id: 1004,
        price: "12.00",
        regular_price: "12.00",
        sale_price: "",
        stock_status: "instock",
        stock_quantity: 20,
        manage_stock: true,
        attributes: [
          { id: 1, name: "Flavor", option: "Tropical" },
          { id: 2, name: "Pack Size", option: "Single" }
        ]
      },
      {
        id: 1005,
        price: "45.00",
        regular_price: "45.00",
        sale_price: "",
        stock_status: "instock",
        stock_quantity: 15,
        manage_stock: true,
        attributes: [
          { id: 1, name: "Flavor", option: "Original" },
          { id: 2, name: "Pack Size", option: "4-Pack" }
        ]
      },
      {
        id: 1006,
        price: "45.00",
        regular_price: "45.00",
        sale_price: "",
        stock_status: "instock",
        stock_quantity: 15,
        manage_stock: true,
        attributes: [
          { id: 1, name: "Flavor", option: "Citrus" },
          { id: 2, name: "Pack Size", option: "4-Pack" }
        ]
      },
      {
        id: 1007,
        price: "45.00",
        regular_price: "45.00",
        sale_price: "",
        stock_status: "instock",
        stock_quantity: 15,
        manage_stock: true,
        attributes: [
          { id: 1, name: "Flavor", option: "Berry" },
          { id: 2, name: "Pack Size", option: "4-Pack" }
        ]
      },
      {
        id: 1008,
        price: "45.00",
        regular_price: "45.00",
        sale_price: "",
        stock_status: "instock",
        stock_quantity: 15,
        manage_stock: true,
        attributes: [
          { id: 1, name: "Flavor", option: "Tropical" },
          { id: 2, name: "Pack Size", option: "4-Pack" }
        ]
      }
    ]
  }
] 