'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { ProductGrid } from '../components/ProductGrid'
import { Cart } from '../components/Cart'
import { AppWrapper } from '../components/AppWrapper'
import { StatusBar } from '../components/StatusBar'
import { useAuth } from '../contexts/AuthContext'
import { FloraProduct, floraAPI, FloraCustomer } from '../lib/woocommerce'

interface CartItem extends FloraProduct {
  selectedVariation: string
  cartQuantity: number
}

interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  address: string
  totalOrders: number
  totalSpent: number
  loyaltyPoints: number
  status: 'active' | 'inactive' | 'vip'
  avatar?: string
}

export default function FloraDistrosPOS() {
  const { store, user } = useAuth()
  const [activeCategory, setActiveCategory] = useState('all')
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [assignedCustomer, setAssignedCustomer] = useState<Customer | null>(null)
  const [productCount, setProductCount] = useState<number>(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCustomerViewOpen, setIsCustomerViewOpen] = useState(false)
  const [customerSearchQuery, setCustomerSearchQuery] = useState('')

  // Fetch customers data
  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['customers', customerSearchQuery],
    queryFn: async (): Promise<FloraCustomer[]> => {
      return floraAPI.getCustomers({
        search: customerSearchQuery || undefined,
        per_page: 50
      })
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  const mainCategories = [
    { name: 'All', slug: 'all', id: null },
    { name: 'Flower', slug: 'flower', id: 25 },
    { name: 'Vapes', slug: 'vape', id: 19 },
    { name: 'Edibles', slug: 'edibles', id: 21 },
    { name: 'Concentrates', slug: 'concentrate', id: 22 },
    { name: 'Moonwater', slug: 'moonwater', id: 16 }
  ]

  const handleAddToCart = (product: FloraProduct, selectedVariation?: string) => {
    const variation = selectedVariation || 'default'
    
    // Calculate the correct price based on the selected variation
    let price = parseFloat(product.sale_price || product.price || '0')
    
    if (variation && variation !== 'default') {
      if (product.mli_product_type === 'weight' && product.pricing_tiers) {
        if (variation.includes('preroll-')) {
          const count = variation.replace('preroll-', '')
          price = product.preroll_pricing_tiers?.[count] || price
        } else if (variation.includes('flower-')) {
          const grams = variation.replace('flower-', '')
          price = product.pricing_tiers[grams] || price
        }
      } else if (product.mli_product_type === 'quantity' && product.pricing_tiers) {
        const qty = variation.replace('qty-', '')
        price = product.pricing_tiers[qty] || price
      }
    }
    
    const existingItemIndex = cartItems.findIndex(
      item => item.id === product.id && item.selectedVariation === variation
    )

    if (existingItemIndex >= 0) {
      const updatedItems = [...cartItems]
      updatedItems[existingItemIndex].cartQuantity += 1
      setCartItems(updatedItems)
    } else {
      const newItem: CartItem = { 
        ...product, 
        price: price.toString(), // Override the price with the variation-specific price
        cartQuantity: 1, 
        selectedVariation: variation 
      }
      setCartItems([...cartItems, newItem])
    }
  }

  const handleRemoveFromCart = (productId: number, variation: string) => {
    setCartItems(cartItems.filter(item => 
      !(item.id === productId && item.selectedVariation === variation)
    ))
  }

  const handleUpdateQuantity = (productId: number, variation: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId, variation)
    } else {
      setCartItems(cartItems.map(item =>
        item.id === productId && item.selectedVariation === variation
          ? { ...item, cartQuantity: newQuantity }
          : item
      ))
    }
  }

  const handleAssignCustomer = (customer: Customer) => {
    setAssignedCustomer(customer)
  }

  const handleUnassignCustomer = () => {
    setAssignedCustomer(null)
  }

  return (
    <AppWrapper>
      <div className="h-screen bg-background-primary text-text-primary flex flex-col relative">
        {/* Menu Drawer */}
        <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-background-secondary border-r border-border transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-text-primary">Menu</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 hover:bg-background-tertiary rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Menu Items */}
            <nav className="space-y-2">
              <button className="w-full text-left px-4 py-3 hover:bg-background-tertiary rounded-lg transition-colors flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v1H8V5z" />
                </svg>
                Inventory
              </button>
              

              <button className="w-full text-left px-4 py-3 hover:bg-background-tertiary rounded-lg transition-colors flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Customers
              </button>
              
              <button className="w-full text-left px-4 py-3 hover:bg-background-tertiary rounded-lg transition-colors flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>
              
              <div className="border-t border-border my-4"></div>
              
              <button className="w-full text-left px-4 py-3 hover:bg-background-tertiary rounded-lg transition-colors flex items-center gap-3 text-red-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </nav>
          </div>
        </div>

        {/* Overlay */}
        {isMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMenuOpen(false)}
          />
        )}

        {/* Header */}
        <div className="bg-background-secondary border-b border-border px-2 py-1 flex-shrink-0 relative z-30">
          <div className="flex items-center justify-between gap-2">
            {/* Logo */}
            <div className="flex-shrink-0">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-1 hover:bg-background-tertiary rounded-lg transition-colors"
              >
                <Image
                  src="/logo.png"
                  alt="Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain"
                />
              </button>
            </div>
            
            {/* Category Selector */}
            <div className="flex gap-1">
              {mainCategories.map((category) => (
                <button
                  key={category.slug}
                  onClick={() => {
                    console.log(`🏷️ Category clicked: ${category.name} (slug: ${category.slug}, id: ${category.id})`)
                    setActiveCategory(category.slug)
                  }}
                  className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
                    activeCategory === category.slug
                      ? 'bg-primary text-white'
                      : 'bg-background-tertiary text-text-secondary hover:bg-background-tertiary/80'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
            
            {/* Customer View Toggle */}
            <button
              onClick={() => setIsCustomerViewOpen(!isCustomerViewOpen)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
                isCustomerViewOpen
                  ? 'bg-primary text-white'
                  : 'bg-background-tertiary text-text-secondary hover:bg-background-tertiary/80'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Customers
            </button>

            {/* Search */}
            <div className="flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 bg-background-tertiary border border-border rounded text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Cart Summary */}
            <div className="text-right text-xs">
              <span className="text-text-secondary">{cartItems.length} items</span>
              <span className="text-text-primary font-semibold ml-2">
                ${cartItems.reduce((total, item) => total + (parseFloat(item.price) * item.cartQuantity), 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex min-h-0">
          {/* Customer View Panel */}
          {isCustomerViewOpen && (
            <div className="w-80 bg-background-secondary border-r border-border flex-shrink-0">
              <div className="p-4 border-b border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-3">Customer Directory</h3>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 bg-background-tertiary border border-border rounded text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <svg className="absolute right-3 top-2.5 w-4 h-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              <div className="overflow-y-auto flex-1">
                {customersLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-text-secondary text-sm">Loading customers...</span>
                  </div>
                ) : customers.length === 0 ? (
                  <div className="p-4 text-center text-text-secondary text-sm">
                    {customerSearchQuery ? 'No customers found matching your search.' : 'No customers found.'}
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {customers.map((customer) => {
                      const customerName = `${customer.first_name} ${customer.last_name}`.trim() || customer.username
                      const customerPhone = customer.billing?.phone || ''
                      const totalSpent = parseFloat(customer.total_spent || '0')
                      const ordersCount = customer.orders_count || 0
                      const loyaltyPoints = customer.loyalty_points || 0
                      
                      // Debug log for first customer
                      if (customer === customers[0]) {
                        console.log('🔍 Customer data debug:', {
                          customer,
                          ordersCount,
                          totalSpent,
                          loyaltyPoints,
                          rawTotalSpent: customer.total_spent,
                          rawOrdersCount: customer.orders_count,
                          rawLoyaltyPoints: customer.loyalty_points
                        })
                      }
                      
                      return (
                        <div
                          key={customer.id}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            assignedCustomer?.id === customer.id.toString()
                              ? 'bg-primary/20 border border-primary/30'
                              : 'hover:bg-background-tertiary'
                          }`}
                          onClick={() => {
                            if (assignedCustomer?.id === customer.id.toString()) {
                              setAssignedCustomer(null)
                            } else {
                              setAssignedCustomer({
                                id: customer.id.toString(),
                                firstName: customer.first_name || customer.username,
                                lastName: customer.last_name || '',
                                email: customer.email,
                                phone: customerPhone,
                                dateOfBirth: '',
                                address: `${customer.billing?.address_1 || ''} ${customer.billing?.city || ''}`.trim(),
                                totalOrders: ordersCount,
                                totalSpent: totalSpent,
                                loyaltyPoints: loyaltyPoints, // Use real loyalty points
                                status: customer.is_paying_customer ? 'active' : 'inactive',
                                avatar: customer.avatar_url
                              })
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-text-primary text-sm">{customerName}</div>
                              <div className="text-xs text-text-secondary">{customer.email}</div>
                              {customerPhone && (
                                <div className="text-xs text-text-tertiary">{customerPhone}</div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-text-secondary">
                                {ordersCount > 0 ? `${ordersCount} orders` : 'No orders'}
                              </div>
                              <div className="text-xs font-medium text-text-primary">${totalSpent.toFixed(2)}</div>
                              <div className="text-xs font-medium text-green-400">
                                {loyaltyPoints > 0 ? `${loyaltyPoints.toLocaleString()} chips` : '0 chips'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1 px-0 py-6 overflow-y-auto">
            <ProductGrid
              category={activeCategory === 'all' ? null : mainCategories.find(cat => cat.slug === activeCategory)?.id || null}
              searchQuery={searchQuery}
              onAddToCart={handleAddToCart}
              onProductCountChange={setProductCount}
              isCustomerViewOpen={isCustomerViewOpen}
            />
          </div>

          {/* Cart Sidebar */}
          <Cart
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveFromCart}
            assignedCustomer={assignedCustomer}
            onAssignCustomer={handleAssignCustomer}
            onUnassignCustomer={handleUnassignCustomer}
          />
        </div>

        {/* VSCode-style Status Bar */}
        <StatusBar
          store={store ? { name: store.name, address: store.address } : undefined}
          user={user ? { name: `${user.firstName} ${user.lastName}`, role: user.role } : undefined}
          cartItemCount={cartItems.length}
          productCount={productCount}
        />
      </div>
    </AppWrapper>
  )
} 