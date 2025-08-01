'use client'

import { useState } from 'react'
import { ProductGrid } from '../components/ProductGrid'
import { Cart } from '../components/Cart'
import { AppWrapper } from '../components/AppWrapper'
import { StatusBar } from '../components/StatusBar'
import { useAuth } from '../contexts/AuthContext'
import { FloraProduct } from '../lib/woocommerce'

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
      <div className="h-screen bg-background-primary text-text-primary flex flex-col">
        {/* Header */}
        <div className="bg-background-secondary border-b border-border px-2 py-1 flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            {/* Category Selector */}
            <div className="flex gap-0.5">
              {mainCategories.map((category) => (
                <button
                  key={category.slug}
                  onClick={() => {
                    console.log(`🏷️ Category clicked: ${category.name} (slug: ${category.slug}, id: ${category.id})`)
                    setActiveCategory(category.slug)
                  }}
                  className={`px-1.5 py-0.5 rounded text-xs font-medium transition-colors ${
                    activeCategory === category.slug
                      ? 'bg-primary text-white'
                      : 'bg-background-tertiary text-text-secondary hover:bg-background-tertiary/80'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
            
            {/* Search */}
            <div className="flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-2 py-0.5 bg-background-tertiary border border-border rounded text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary"
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
          {/* Products Grid */}
          <div className="flex-1 p-6 overflow-y-auto">
            <ProductGrid
              category={activeCategory === 'all' ? null : mainCategories.find(cat => cat.slug === activeCategory)?.id || null}
              searchQuery={searchQuery}
              onAddToCart={handleAddToCart}
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
        />
      </div>
    </AppWrapper>
  )
} 