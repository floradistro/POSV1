'use client'

import { useState, useEffect } from 'react'
import { buttonStyles, textStyles, animationStyles } from '../lib/styles'
import { floraAPI, FloraProduct, FloraCategory, getProductCategory, sampleFloraProducts, getProductPrice } from '../lib/woocommerce'
import { wooCommerceServerAPI, WooCommerceProduct } from '../lib/woocommerce-server'
import { SmartProductGrid } from '../components/SmartProductGrid'
import CustomerList from '../components/CustomerList'
import SmartSearch from '../components/SmartSearch'
import { IDScanner } from '../components/IDScanner'
import SettingsPanel from '../components/SettingsPanel'
import PWAInstaller from '../components/PWAInstaller'
import { Camera, ShoppingCart } from 'lucide-react'
import { sampleCustomers } from '../data/customers'

interface CartItem extends FloraProduct {
  selectedVariation: string
  cartQuantity: number
}

type ViewMode = 'products' | 'customers'

// Transform WooCommerceProduct to FloraProduct
const transformToFloraProduct = async (wooProduct: WooCommerceProduct): Promise<FloraProduct> => {
  let variationsData = undefined
  
  // Fetch variations for variable products
  if (wooProduct.type === 'variable' && wooProduct.variations && wooProduct.variations.length > 0) {
    try {
      variationsData = await wooCommerceServerAPI.getProductVariations(wooProduct.id)
    } catch (error) {
      console.warn(`Failed to fetch variations for product ${wooProduct.id}:`, error)
    }
  }

  return {
    id: wooProduct.id,
    name: wooProduct.name,
    slug: wooProduct.slug,
    description: wooProduct.description,
    short_description: wooProduct.short_description,
    price: wooProduct.price,
    regular_price: wooProduct.regular_price,
    sale_price: wooProduct.sale_price,
    on_sale: wooProduct.on_sale,
    stock_status: wooProduct.stock_status as 'instock' | 'outofstock' | 'onbackorder',
    stock_quantity: wooProduct.stock_quantity,
    categories: wooProduct.categories,
    images: wooProduct.images,
    attributes: wooProduct.attributes,
    meta_data: wooProduct.meta_data,
    variations: wooProduct.variations,
    has_options: wooProduct.variations && wooProduct.variations.length > 0,
    type: wooProduct.type,
    variationsData: variationsData
  }
}

export default function FloraDistrosPOS() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [products, setProducts] = useState<FloraProduct[]>([])
  const [categories, setCategories] = useState<FloraCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [apiError, setApiError] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<Record<number, string>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('products')
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [assignedCustomer, setAssignedCustomer] = useState<any>(null)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [scannedCustomerData, setScannedCustomerData] = useState<any>(null)
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false)

  const mainCategories = [
    { name: 'All', slug: 'all', icon: '' },
    { name: 'Flower', slug: 'flower', icon: '' },
    { name: 'Vapes', slug: 'vape', icon: '' },
    { name: 'Edibles', slug: 'edible', icon: '' },
    { name: 'Concentrates', slug: 'concentrate', icon: '' },
    { name: 'Moonwater', slug: 'moonwater', icon: '' }
  ]

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setApiError(false)
        
        // Try to load from WooCommerce API using the working server API
        console.log('🔄 Loading products from WooCommerce API...')
        const [wooProducts, categoriesData] = await Promise.all([
          wooCommerceServerAPI.getProducts({ per_page: 100, status: 'publish' }),
          floraAPI.getCategories() // Keep using floraAPI for categories
        ])
        
        console.log(`📦 Loaded ${wooProducts.length} products from WooCommerce`)
        
        // Transform WooCommerce products to Flora products
        const transformedProducts = await Promise.all(
          wooProducts.map(transformToFloraProduct)
        )
        
        // Debug: Log moonwater products
        const moonwaterProducts = transformedProducts.filter(product => {
          const category = getProductCategory(product)
          return category === 'moonwater'
        })
        console.log(`🌙 Found ${moonwaterProducts.length} moonwater products:`, moonwaterProducts.map(p => p.name))
        
        setProducts(transformedProducts)
        setCategories(categoriesData)
        
      } catch (error) {
        console.error('Error loading data:', error)
        setApiError(true)
        // Fallback to sample data
        setProducts(sampleFloraProducts)
        setCategories([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Filter products based on active category and search
  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === 'all' || getProductCategory(product) === activeCategory
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.short_description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesCategory && matchesSearch
  })

  // Cart functionality
  const addToCart = (product: FloraProduct, selectedVariation: string = '') => {
    const existingItemIndex = cartItems.findIndex(
      item => item.id === product.id && item.selectedVariation === selectedVariation
    )

    if (existingItemIndex >= 0) {
      const updatedItems = [...cartItems]
      updatedItems[existingItemIndex].cartQuantity += 1
      setCartItems(updatedItems)
    } else {
      const cartItem: CartItem = {
        ...product,
        selectedVariation,
        cartQuantity: 1
      }
      setCartItems([...cartItems, cartItem])
    }
  }

  const removeFromCart = (productId: number, selectedVariation: string = '') => {
    setCartItems(cartItems.filter(
      item => !(item.id === productId && item.selectedVariation === selectedVariation)
    ))
  }

  const updateCartQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      const updatedItems = [...cartItems]
      updatedItems.splice(index, 1)
      setCartItems(updatedItems)
    } else {
      const updatedItems = [...cartItems]
      updatedItems[index].cartQuantity = newQuantity
      setCartItems(updatedItems)
    }
  }

  const handleAddToCart = (product: FloraProduct, selectedVariation?: string) => {
    const variation = selectedVariation || ''
    addToCart(product, variation)
  }

  const handleProductClick = (product: FloraProduct) => {
    // Handle product click - could open modal, navigate, etc.
    console.log('Product clicked:', product.name)
  }

  const handleOptionSelect = (productId: number, option: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [productId]: option
    }))
  }

  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer)
  }

  const handleAddToSale = (customer: any) => {
    setAssignedCustomer(customer)
    setSelectedCustomer(null)
  }

  const handleScanResult = (scanData: any) => {
    setScannedCustomerData(scanData)
    setIsScannerOpen(false)
    // Process scan data and potentially assign customer
    console.log('Scanned customer data:', scanData)
  }

  const handleCheckout = () => {
    console.log('Checkout initiated with items:', cartItems)
    // Implement checkout logic
  }

  // Calculate cart totals
  const cartTotal = cartItems.reduce((total, item) => {
    const itemPrice = getProductPrice(item, item.selectedVariation)
    return total + (itemPrice * item.cartQuantity)
  }, 0)

  const cartItemCount = cartItems.reduce((count, item) => count + item.cartQuantity, 0)

  if (loading) {
    return (
      <div className="h-screen bg-background-primary flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🌿</div>
          <p className="text-luxury-lg text-text-primary font-light">Loading Flora Distro POS...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-background-primary text-text-primary overflow-hidden flex">
      {/* Main Content Area */}
      <div className="flex flex-col flex-1">


        {/* Horizontal Navigation */}
        <nav className="bg-background-secondary border-b border-white/[0.08] px-6 py-1">
          {(viewMode as ViewMode) === 'products' ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Logo */}
                  <button
                    onClick={() => setIsSettingsPanelOpen(!isSettingsPanelOpen)}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-background-tertiary flex-shrink-0"
                  >
                    <img
                      src="/logo.png"
                      alt="Flora Distro"
                      className="w-8 h-8 object-contain"
                    />
                  </button>
                  
                  {/* Categories */}
                  <div className="flex items-center gap-1">
                  {mainCategories.map((category) => (
                    <button
                      key={category.slug}
                      onClick={() => setActiveCategory(category.slug)}
                      className={`px-4 py-1 rounded-lg text-sm font-light transition-all duration-200 ${
                        activeCategory === category.slug
                          ? 'bg-[#1a1a1a] text-white border border-white/20'
                          : 'text-text-secondary hover:text-text-primary hover:bg-background-tertiary'
                      }`}
                    >
                      <span className="hidden md:inline">{category.name}</span>
                    </button>
                  ))}
                  </div>
                </div>
                
                {/* Demo Mode & View Mode Toggle */}
                <div className="flex items-center gap-2">
                  {apiError && (
                    <div className="flora-glass px-3 py-2 rounded-lg border border-warning/30">
                      <span className="text-luxury-xs text-warning">Demo Mode</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                                  <button
                  onClick={() => setViewMode('products')}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                    (viewMode as ViewMode) === 'products'
                      ? 'bg-background-tertiary text-white border border-white/20'
                      : 'bg-background-secondary text-white/70 hover:text-white hover:bg-background-tertiary'
                  }`}
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('customers')}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                      (viewMode as ViewMode) === 'customers'
                        ? 'bg-background-tertiary text-white border border-white/20'
                        : 'bg-background-secondary text-white/70 hover:text-white hover:bg-background-tertiary'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </button>
                  </div>
                </div>
              </div>
              
              {/* Search Bar for Products */}
              <div className="mt-3 flex justify-center">
                <SmartSearch
                  viewMode={viewMode}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  products={products}
                  customers={sampleCustomers}
                  productCount={filteredProducts.length}
                />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Logo */}
                <button
                  onClick={() => setIsSettingsPanelOpen(!isSettingsPanelOpen)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-background-tertiary flex-shrink-0"
                >
                  <img
                    src="/logo.png"
                    alt="Flora Distro"
                    className="w-8 h-8 object-contain"
                  />
                </button>
                
                {/* Customer Tabs */}
                <div className="flex items-center gap-1">
                <button className="px-4 py-1 rounded-lg text-sm font-light bg-[#1a1a1a] text-white border border-white/20">
                  All Customers
                </button>
                <button className="px-4 py-1 rounded-lg text-sm font-light text-text-secondary hover:text-text-primary hover:bg-background-tertiary">
                  Recent Visitors
                </button>
                </div>
              </div>
              
              {/* Search Bar for Customers */}
              <div className="mt-3 flex justify-center">
                <SmartSearch
                  viewMode={viewMode}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  products={products}
                  customers={sampleCustomers}
                  productCount={filteredProducts.length}
                />
              </div>
              
              {/* Demo Mode & View Mode Toggle */}
              <div className="flex items-center gap-2">
                {apiError && (
                  <div className="flora-glass px-3 py-2 rounded-lg border border-warning/30">
                    <span className="text-luxury-xs text-warning">Demo Mode</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                <button
                  onClick={() => setViewMode('products')}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                    (viewMode as ViewMode) === 'products'
                      ? 'bg-background-tertiary text-white border border-white/20'
                      : 'bg-background-secondary text-white/70 hover:text-white hover:bg-background-tertiary'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('customers')}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                    (viewMode as ViewMode) === 'customers'
                      ? 'bg-background-tertiary text-white border border-white/20'
                      : 'bg-background-secondary text-white/70 hover:text-white hover:bg-background-tertiary'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </button>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-scroll pb-8">
          <div className="w-full max-w-none">
            {(viewMode as ViewMode) === 'products' ? (
              filteredProducts.length > 0 ? (
                <div className="w-full">
                  <SmartProductGrid
                    products={filteredProducts}
                    selectedOptions={selectedOptions}
                    onAddToCart={handleAddToCart}
                    onProductClick={handleProductClick}
                    onOptionSelect={handleOptionSelect}
                    layoutMode="grid"
                  />
                </div>
              ) : (
                <div className="w-full flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🌿</div>
                    <p className="text-luxury-lg text-text-primary font-light">No products found in this category</p>
                    <p className="text-luxury-sm text-text-tertiary mt-2">Try selecting a different category</p>
                  </div>
                </div>
              )
            ) : (
              <div className="w-full">
                <CustomerList
                  searchQuery={searchQuery}
                  onCustomerSelect={handleCustomerSelect}
                  onAddToSale={handleAddToSale}
                  assignedCustomer={assignedCustomer}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Right Cart Panel */}
      <div className="w-80 bg-background-secondary border-l border-white/[0.08] flex flex-col" style={{ height: 'calc(100vh - 24px)' }}>
        {/* Cart Section - Top Half */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          {/* Assigned Customer */}
          {assignedCustomer && (
            <div className="flex items-center gap-3 p-3 bg-background-tertiary border-b border-white/[0.08]">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-white/95 font-light text-sm">
                  {assignedCustomer.name.split(' ').map((n: string) => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/95 text-sm font-light truncate">{assignedCustomer.name}</p>
                <p className="text-white/60 text-xs">
                  {assignedCustomer.loyaltyPoints} chips • {assignedCustomer.status.toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => setAssignedCustomer(null)}
                className="text-white/40 hover:text-white/70 transition-colors p-1"
              >
                ×
              </button>
            </div>
          )}

          {/* Cart Items */}
          <div className="flex-1 overflow-auto min-h-0">
            {/* Floating ID Scanner Button */}
            {!assignedCustomer && (
              <button
                onClick={() => setIsScannerOpen(true)}
                className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full flex items-center justify-center bg-background-tertiary hover:bg-background-primary text-white font-medium transition-colors duration-200 border border-white/10"
              >
                <Camera className="w-5 h-5" />
              </button>
            )}
            
            {cartItems.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-8 h-8 mx-auto mb-3 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 1.5M7 13l1.5 1.5M16 19a2 2 0 100 4 2 2 0 000-4zM8 19a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                <p className="text-text-secondary text-sm">Your cart is empty</p>
                <p className="text-text-tertiary text-xs mt-1">Add products to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item, index) => {
                  const itemPrice = getProductPrice(item, item.selectedVariation)
                  
                  return (
                    <div key={`${item.id}-${item.selectedVariation}`} className="w-full bg-background-tertiary rounded-lg p-3 border border-white/10">
                      <div className="flex items-start gap-3">
                        <img
                          src={item.images?.[0]?.src || '/flora_chip_optimized.webp'}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-text-primary truncate">{item.name}</h3>
                          {item.selectedVariation && (
                            <p className="text-xs text-text-secondary mt-1">{item.selectedVariation}</p>
                          )}
                          <div className="flex justify-between items-center mt-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateCartQuantity(index, Math.max(1, item.cartQuantity - 1))}
                                className="w-6 h-6 rounded bg-background-secondary hover:bg-background-primary text-white/70 hover:text-white text-sm flex items-center justify-center"
                              >
                                -
                              </button>
                              <span className="text-sm text-white w-8 text-center">{item.cartQuantity}</span>
                              <button
                                onClick={() => updateCartQuantity(index, item.cartQuantity + 1)}
                                className="w-6 h-6 rounded bg-background-secondary hover:bg-background-primary text-white/70 hover:text-white text-sm flex items-center justify-center"
                              >
                                +
                              </button>
                            </div>
                            <span className="text-sm font-medium text-white">
                              ${(itemPrice * item.cartQuantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id, item.selectedVariation)}
                          className="text-text-tertiary hover:text-error text-xs p-1 flex-shrink-0"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          {cartItems.length > 0 && (
            <div className="p-4 border-t border-white/[0.08] space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Subtotal</span>
                  <span className="text-text-primary">${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Tax (8.25%)</span>
                  <span className="text-text-primary">${(cartTotal * 0.0825).toFixed(2)}</span>
                </div>
                <div className="border-t border-white/[0.06] pt-2">
                  <div className="flex justify-between font-medium">
                    <span className="text-text-primary">Total</span>
                    <span className="text-green-400 text-lg">${(cartTotal * 1.0825).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={handleCheckout}
                className={`${buttonStyles.primary} w-full justify-center`}
              >
                Complete Sale
              </button>
            </div>
          )}
        </div>

        {/* Chat Section - Bottom Half */}
        <div className="flex-1 flex flex-col border-t border-white/[0.08] min-h-0">
          {/* Chat Messages */}
          <div className="flex-1 overflow-auto p-3 space-y-3 min-h-0">
            <div className="text-center py-8">
              <svg className="w-8 h-8 mx-auto text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>

          {/* Chat Input */}
          <div className="p-3 border-t border-white/[0.08]">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 bg-background-tertiary border border-white/10 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/20"
              />
              <button className="px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/80 transition-colors">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ID Scanner Modal */}
      {isScannerOpen && (
        <IDScanner 
          onScan={handleScanResult} 
          onClose={() => setIsScannerOpen(false)} 
        />
      )}

      {/* Settings Drawer */}
      <SettingsPanel 
        isOpen={isSettingsPanelOpen} 
        onClose={() => setIsSettingsPanelOpen(false)} 
      />

      {/* PWA Installer */}
      <PWAInstaller />
      
      {/* Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-6 bg-[#1a1a1a] border-t border-white/[0.08] px-3 flex items-center justify-between text-xs z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-white/70">Live</span>
          </div>
          <span className="text-white/50">Charlotte, NC</span>
          <span className="text-white/50">Staff: Jordan M.</span>
        </div>
        <div className="flex items-center gap-4">
          {(viewMode as ViewMode) === 'products' ? (
            <>
              <span className="text-white/50">
                {activeCategory === 'all' 
                  ? `${filteredProducts.length} products total`
                  : `${filteredProducts.length} ${activeCategory} products`
                }
              </span>
              <span className="text-white/50">{cartItemCount} in cart</span>
            </>
          ) : (
            <span className="text-white/50">{sampleCustomers.length} customers</span>
          )}
        </div>
      </div>
    </div>
  )
} 