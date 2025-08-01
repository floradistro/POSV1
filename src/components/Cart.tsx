'use client'

import { Trash2, Plus, Minus, User, X } from 'lucide-react'
import Image from 'next/image'
import { CheckoutModal } from './CheckoutModal'
import { IDScanner } from './IDScanner'
import { FloraProduct } from '../lib/woocommerce'
import { useState } from 'react'

// Helper function to format variation display
function formatVariationDisplay(variation: string): string {
  if (!variation || variation === 'default') return ''
  
  if (variation.includes('flower-')) {
    const grams = variation.replace('flower-', '')
    return `${grams}g Flower`
  }
  
  if (variation.includes('preroll-')) {
    const count = variation.replace('preroll-', '')
    return `${count}x Pre-rolls`
  }
  
  if (variation.includes('qty-')) {
    const qty = variation.replace('qty-', '')
    return `${qty} units`
  }
  
  return variation
}

// Main page cart item interface (matches the one in page.tsx)
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
  orderHistory?: Array<{
    id: number
    date: string
    total: number
    items: string[]
    status: 'completed' | 'pending' | 'cancelled' | 'processing' | 'on-hold' | 'refunded' | 'failed'
  }>
}

interface CartProps {
  items: CartItem[]
  onUpdateQuantity: (productId: number, variation: string, newQuantity: number) => void
  onRemoveItem: (productId: number, variation: string) => void
  assignedCustomer: Customer | null
  onAssignCustomer: (customer: Customer) => void
  onUnassignCustomer: () => void
}

export function Cart({ 
  items, 
  onUpdateQuantity, 
  onRemoveItem, 
  assignedCustomer, 
  onAssignCustomer, 
  onUnassignCustomer 
}: CartProps) {
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  
  const subtotal = items.reduce((total, item) => {
    const price = parseFloat(item.price) || 0
    console.log(`Cart calculation - Product: ${item.name}, Variation: ${item.selectedVariation}, Price: $${price}`)
    return total + price * item.cartQuantity
  }, 0)

  const tax = subtotal * 0.06
  const total = subtotal + tax

  const handleScanResult = (data: any) => {
    console.log('Scanned customer data:', data)
    setIsScannerOpen(false)
    // Process the scanned data here
  }

  if (items.length === 0) {
    return (
      <div className="w-80 bg-background-primary border-l border-border p-6 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-background-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-text-tertiary" />
            </div>
            <p className="text-text-secondary">Your cart is empty</p>
          </div>
        </div>
        
        {/* Customer Assignment Section */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-text-primary">Customer</span>
            {!assignedCustomer && (
              <button 
                onClick={() => setIsScannerOpen(true)}
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="text-sm">Scan ID</span>
              </button>
            )}
          </div>
          
          {assignedCustomer ? (
            <div className="flex items-center justify-between p-3 bg-background-secondary rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">
                    {assignedCustomer.firstName.charAt(0)}{assignedCustomer.lastName.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {assignedCustomer.firstName} {assignedCustomer.lastName}
                  </p>
                  <p className="text-xs text-text-secondary">{assignedCustomer.email}</p>
                </div>
              </div>
              <button 
                onClick={onUnassignCustomer}
                className="text-error hover:text-error/80 transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <p className="text-sm text-text-secondary">No customer assigned</p>
          )}
        </div>

        {isScannerOpen && (
          <IDScanner 
            isOpen={isScannerOpen}
            onClose={() => setIsScannerOpen(false)}
            onScanComplete={handleScanResult}
          />
        )}
      </div>
    )
  }

  return (
    <div className="w-80 bg-background-primary border-l border-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-semibold text-text-primary mb-2">Cart ({items.length})</h2>
        
        {/* Customer Assignment */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-text-primary">Customer</span>
          {!assignedCustomer && (
            <button 
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            >
              <User className="w-4 h-4" />
              <span className="text-sm">Scan ID</span>
            </button>
          )}
        </div>
        
        {assignedCustomer ? (
          <div className="flex items-center justify-between p-3 bg-background-secondary rounded-lg mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-primary">
                  {assignedCustomer.firstName.charAt(0)}{assignedCustomer.lastName.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {assignedCustomer.firstName} {assignedCustomer.lastName}
                </p>
                <p className="text-xs text-text-secondary">{assignedCustomer.email}</p>
              </div>
            </div>
            <button 
              onClick={onUnassignCustomer}
              className="text-error hover:text-error/80 transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <p className="text-sm text-text-secondary mb-4">No customer assigned</p>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={`${item.id}-${item.selectedVariation}`} className="flex gap-3">
              <div className="flex-1">
                {item.images?.[0] && (
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <Image
                      src={item.images[0].src}
                      alt={item.name}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-text-primary mb-1 line-clamp-2">
                    {item.name}
                  </h3>
                  {formatVariationDisplay(item.selectedVariation) && (
                    <p className="text-xs text-text-secondary mb-1">
                      {formatVariationDisplay(item.selectedVariation)}
                    </p>
                  )}
                  <p className="text-primary font-medium text-sm mt-1">
                    ${(parseFloat(item.price) * item.cartQuantity).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={() => onRemoveItem(item.id, item.selectedVariation)}
                  className="text-error hover:text-error/80 transition-colors p-1"
                >
                  <X className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.selectedVariation, item.cartQuantity - 1)}
                    className="w-6 h-6 rounded bg-background-secondary hover:bg-background-tertiary flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.cartQuantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.selectedVariation, item.cartQuantity + 1)}
                    className="w-6 h-6 rounded bg-background-secondary hover:bg-background-tertiary flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-text-secondary text-sm">
                  ${parseFloat(item.price).toFixed(2)} each
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-border">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Subtotal</span>
            <span className="text-text-primary">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Tax (6%)</span>
            <span className="text-text-primary">${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold pt-2 border-t border-border">
            <span className="text-text-primary">Total</span>
            <span className="text-text-primary">${total.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={() => setIsCheckoutModalOpen(true)}
          className="w-full bg-primary hover:bg-primary/90 text-white py-3 px-4 rounded-lg font-medium transition-colors"
        >
          Checkout
        </button>
      </div>

      {isCheckoutModalOpen && (
        <CheckoutModal
          isOpen={isCheckoutModalOpen}
          cartItems={items}
          total={total}
          onClose={() => setIsCheckoutModalOpen(false)}
          onSuccess={() => {
            // Clear cart after successful checkout
            items.forEach(item => onRemoveItem(item.id, item.selectedVariation))
            setIsCheckoutModalOpen(false)
          }}
        />
      )}

      {isScannerOpen && (
        <IDScanner 
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanComplete={handleScanResult}
        />
      )}
    </div>
  )
} 