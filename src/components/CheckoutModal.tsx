'use client'

import { useState } from 'react'
import { X, CreditCard, DollarSign, Loader2 } from 'lucide-react'
import { FloraProduct, floraAPI, CreateOrderData } from '@/lib/woocommerce'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'

// Main page cart item interface (different from store cart)
interface MainPageCartItem {
  id: number
  name: string
  price: string
  selectedVariation: string
  cartQuantity: number
  [key: string]: any // For other product properties
}

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  cartItems: MainPageCartItem[]
  total: number
  onSuccess: () => void
}

export function CheckoutModal({ isOpen, onClose, cartItems, total, onSuccess }: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash')
  const [cashReceived, setCashReceived] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')

  const createOrderMutation = useMutation({
    mutationFn: (orderData: CreateOrderData) => {
      console.log('🚀 Mutation function called with:', orderData)
      return floraAPI.createOrder(orderData)
    },
    onSuccess: (data) => {
      console.log('✅ Mutation success:', data)
      toast.success(`Order #${data.id} completed successfully!`)
      onSuccess()
      onClose()
      // Reset form
      setPaymentMethod('cash')
      setCashReceived('')
      setCustomerEmail('')
    },
    onError: (error) => {
      console.error('❌ Mutation error:', error)
      toast.error(`Failed to create order: ${error.message}`)
    },
  })

  const handleCheckout = () => {
    console.log('🛒 Starting checkout process...')
    console.log('Payment method:', paymentMethod)
    console.log('Cart items:', cartItems)
    console.log('Total:', total)
    
    const orderData: CreateOrderData = {
      payment_method: paymentMethod,
      payment_method_title: paymentMethod === 'cash' ? 'Cash' : 'Card',
      set_paid: true,
      line_items: cartItems.map((item) => ({
        product_id: item.id,
        quantity: item.cartQuantity,
        // For variations, we'll need to find the variation ID from the selectedVariation string
        // This is a simplified approach - in production you'd want to store the actual variation ID
        meta_data: item.selectedVariation ? [
          {
            key: 'selected_variation',
            value: item.selectedVariation
          }
        ] : undefined
      })),
      ...(customerEmail && { billing: { email: customerEmail } }),
    }

    console.log('📦 Order data:', orderData)
    createOrderMutation.mutate(orderData)
  }

  const change = paymentMethod === 'cash' && cashReceived 
    ? parseFloat(cashReceived) - total 
    : 0

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background-secondary rounded-lg p-6 w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text">Checkout</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Order Summary */}
          <div className="bg-background rounded-lg p-4">
            <h3 className="font-medium text-text mb-2">Order Summary</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Items</span>
                <span className="text-text">{cartItems.length}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-text">Total</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Customer Email (Optional) */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text mb-2">
              Customer Email (Optional)
            </label>
            <input
              id="email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="customer@example.com"
              className="w-full px-3 py-2 bg-background rounded-lg border border-background-tertiary focus:border-primary focus:outline-none text-text placeholder-text-tertiary"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">Payment Method</label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  console.log('💰 Cash payment selected')
                  setPaymentMethod('cash')
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-colors ${
                  paymentMethod === 'cash'
                    ? 'bg-primary text-white'
                    : 'bg-background-tertiary text-text-secondary hover:bg-background-tertiary/80'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                Cash
              </button>
              <button
                onClick={() => {
                  console.log('💳 Card payment selected')
                  setPaymentMethod('card')
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-colors ${
                  paymentMethod === 'card'
                    ? 'bg-primary text-white'
                    : 'bg-background-tertiary text-text-secondary hover:bg-background-tertiary/80'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Card
              </button>
            </div>
          </div>

          {/* Cash Received */}
          {paymentMethod === 'cash' && (
            <div>
              <label htmlFor="cash" className="block text-sm font-medium text-text mb-2">
                Cash Received
              </label>
              <input
                id="cash"
                type="number"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder="0.00"
                min={total}
                step="0.01"
                className="w-full px-3 py-2 bg-background rounded-lg border border-background-tertiary focus:border-primary focus:outline-none text-text placeholder-text-tertiary"
              />
              {cashReceived && parseFloat(cashReceived) >= total && (
                <p className="mt-2 text-sm">
                  Change: <span className="font-bold text-primary">${change.toFixed(2)}</span>
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-background-tertiary rounded-lg font-medium text-text-secondary hover:bg-background-tertiary/50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={(e) => {
                e.preventDefault()
                console.log('🖱️ Complete Sale button clicked!')
                
                const isDisabled = createOrderMutation.isPending || (paymentMethod === 'cash' && (!cashReceived || parseFloat(cashReceived) < total))
                console.log('Button disabled?', isDisabled)
                console.log('Payment method:', paymentMethod)
                console.log('Cash received:', cashReceived)
                console.log('Total:', total)
                console.log('Mutation pending?', createOrderMutation.isPending)
                
                if (paymentMethod === 'cash') {
                  console.log('Cash validation:', {
                    cashReceived,
                    cashReceivedParsed: parseFloat(cashReceived),
                    total,
                    isValid: cashReceived && parseFloat(cashReceived) >= total
                  })
                }
                
                if (!isDisabled) {
                  console.log('🎯 Proceeding with checkout...')
                  handleCheckout()
                } else {
                  console.log('⚠️ Button is disabled, not proceeding')
                }
              }}
              disabled={
                createOrderMutation.isPending ||
                (paymentMethod === 'cash' && (!cashReceived || parseFloat(cashReceived) < total))
              }
              className="flex-1 py-2 px-4 bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {createOrderMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Complete Sale'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 