'use client'

import { CartItem } from '@/store/cart'
import { Trash2, Plus, Minus, Camera } from 'lucide-react'
import Image from 'next/image'
import { CheckoutModal } from './CheckoutModal'
import { IDScanner } from './IDScanner'
import { useState } from 'react'

interface CartProps {
  items: CartItem[]
  onUpdateQuantity: (productId: number, quantity: number, variationId?: number) => void
  onRemoveItem: (productId: number, variationId?: number) => void
  onClearCart: () => void
}

export function Cart({ items, onUpdateQuantity, onRemoveItem, onClearCart }: CartProps) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [customerData, setCustomerData] = useState<any>(null)
  
  const handleScanResult = (data: any) => {
    console.log('Customer data scanned:', data)
    setCustomerData(data)
    setIsScannerOpen(false)
    // TODO: Search customer database with scanned data
  }
  
  const subtotal = items.reduce((total, item) => {
    const price = parseFloat(item.product.sale_price || item.product.price)
    return total + price * item.quantity
  }, 0)
  
  const tax = subtotal * 0.10 // 10% tax
  const total = subtotal + tax

  if (items.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-background-tertiary">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-text">Cart</h2>
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            >
              <Camera className="w-4 h-4" />
              <span className="text-sm">Scan ID</span>
            </button>
          </div>
          {customerData && (
            <div className="bg-background-secondary rounded-lg p-3 mb-3">
              <p className="text-text text-sm font-medium">Customer: {customerData.fullName}</p>
              <p className="text-text-secondary text-xs">{customerData.city}, {customerData.state}</p>
            </div>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-text-secondary">Your cart is empty</p>
        </div>
        
        {/* ID Scanner Modal */}
        {isScannerOpen && (
          <IDScanner 
            onScan={handleScanResult} 
            onClose={() => setIsScannerOpen(false)} 
          />
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-background-tertiary">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-text">Cart ({items.length})</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            >
              <Camera className="w-4 h-4" />
              <span className="text-sm">Scan ID</span>
            </button>
            <button
              onClick={onClearCart}
              className="text-error hover:text-error/80 transition-colors text-sm"
            >
              Clear
            </button>
          </div>
        </div>
        {customerData && (
          <div className="bg-background-secondary rounded-lg p-3">
            <p className="text-text text-sm font-medium">Customer: {customerData.fullName}</p>
            <p className="text-text-secondary text-xs">{customerData.city}, {customerData.state}</p>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.map((item) => (
          <div
            key={`${item.product.id}-${item.variation?.id || 0}`}
            className="bg-background rounded-lg p-3 space-y-2"
          >
            <div className="flex gap-3">
              {item.product.images?.[0] && (
                <div className="relative w-16 h-16 flex-shrink-0">
                  <Image
                    src={item.product.images[0].src}
                    alt={item.product.name}
                    fill
                    className="object-cover rounded"
                  />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-text text-sm line-clamp-2">{item.product.name}</h4>
                {item.variation && (
                  <p className="text-xs text-text-tertiary">
                    {Object.entries(item.variation.attributes).map(([key, value]) => `${key}: ${value}`).join(', ')}
                  </p>
                )}
                <p className="text-primary font-medium text-sm mt-1">
                  ${(parseFloat(item.product.sale_price || item.product.price) * item.quantity).toFixed(2)}
                </p>
              </div>
              
              <button
                onClick={() => onRemoveItem(item.product.id, item.variation?.id)}
                className="text-error hover:text-error/80 transition-colors p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1, item.variation?.id)}
                  className="bg-background-tertiary hover:bg-background-tertiary/80 p-1 rounded transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-text font-medium w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1, item.variation?.id)}
                  className="bg-background-tertiary hover:bg-background-tertiary/80 p-1 rounded transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-text-secondary text-sm">
                ${parseFloat(item.product.sale_price || item.product.price).toFixed(2)} each
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="border-t border-background-tertiary p-4 space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Subtotal</span>
            <span className="text-text">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Tax (10%)</span>
            <span className="text-text">${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span className="text-text">Total</span>
            <span className="text-primary">${total.toFixed(2)}</span>
          </div>
        </div>
        
        <button
          onClick={() => setIsCheckoutOpen(true)}
          className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-lg font-medium transition-colors"
        >
          Checkout
        </button>
      </div>
      
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={items}
        total={total}
        onSuccess={onClearCart}
      />
      
              {/* ID Scanner Modal */}
        {isScannerOpen && (
          <IDScanner 
            onScan={handleScanResult} 
            onClose={() => setIsScannerOpen(false)} 
          />
        )}
    </div>
  )
} 