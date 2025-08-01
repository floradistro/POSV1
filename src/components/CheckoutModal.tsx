'use client'

import { useState } from 'react'
import { X, CreditCard, DollarSign, Loader2 } from 'lucide-react'
import { floraAPI, CreateOrderData } from '../lib/woocommerce'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'

// Cart item interface (matches the one used in Cart component)
interface CartItem {
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
  cartItems: CartItem[]
  total: number
  onSuccess: () => void
}

export function CheckoutModal({ isOpen, onClose, cartItems, total, onSuccess }: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash')
  const [cashReceived, setCashReceived] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: CreateOrderData) => {
      console.log('🚀 Creating order with data:', orderData)
      return floraAPI.createOrder(orderData)
    },
    onSuccess: (data) => {
      console.log('✅ Order created successfully:', data)
      toast.success(`Order #${data.id} completed successfully!`)
      onSuccess()
      onClose()
      // Reset form
      setPaymentMethod('cash')
      setCashReceived('')
      setCustomerEmail('')
    },
    onError: (error) => {
      console.error('❌ Order creation failed:', error)
      toast.error(`Failed to create order: ${error.message}`)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (paymentMethod === 'cash') {
      const received = parseFloat(cashReceived)
      if (isNaN(received) || received < total) {
        toast.error('Cash received must be greater than or equal to total')
        return
      }
    }

    console.log('Processing checkout...')
    console.log('Payment method:', paymentMethod)
    console.log('Total:', total)
    
    const orderData: CreateOrderData = {
      payment_method: paymentMethod,
      payment_method_title: paymentMethod === 'cash' ? 'Cash' : 'Card',
      set_paid: true,
      billing: {
        first_name: '',
        last_name: '',
        address_1: '',
        address_2: '',
        city: '',
        state: '',
        postcode: '',
        country: 'US',
        email: customerEmail || '',
        phone: ''
      },
      shipping: {
        first_name: '',
        last_name: '',
        address_1: '',
        address_2: '',
        city: '',
        state: '',
        postcode: '',
        country: 'US'
      },
      shipping_lines: [],
      line_items: cartItems.map(item => ({
        product_id: item.id,
        quantity: item.cartQuantity,
        meta_data: item.selectedVariation !== 'default' ? [{
          key: 'variation',
          value: item.selectedVariation
        }] : undefined
      }))
    }

    createOrderMutation.mutate(orderData)
  }

  const calculateChange = () => {
    const received = parseFloat(cashReceived)
    return isNaN(received) ? 0 : Math.max(0, received - total)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background-primary rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-text-primary">Checkout</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Order Summary */}
          <div className="space-y-3">
            <h3 className="font-medium text-text-primary">Order Summary</h3>
            <div className="space-y-2">
              {cartItems.map((item) => (
                <div key={`${item.id}-${item.selectedVariation}`} className="flex justify-between text-sm">
                  <span className="text-text-secondary">
                    {item.name} {item.selectedVariation !== 'default' && `(${item.selectedVariation})`} × {item.cartQuantity}
                  </span>
                  <span className="text-text-primary font-medium">
                    ${(parseFloat(item.price) * item.cartQuantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-border">
              <div className="flex justify-between font-semibold text-text-primary">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Customer Email */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-primary">
              Customer Email (Optional)
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="customer@example.com"
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <h3 className="font-medium text-text-primary">Payment Method</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${
                  paymentMethod === 'cash'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background-secondary text-text-secondary hover:border-primary/50'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${
                  paymentMethod === 'card'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background-secondary text-text-secondary hover:border-primary/50'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Card
              </button>
            </div>
          </div>

          {/* Cash Payment Details */}
          {paymentMethod === 'cash' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-primary">
                  Cash Received
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={total}
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={total.toFixed(2)}
                  required
                />
              </div>
              {cashReceived && (
                <div className="p-3 bg-background-secondary rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Change Due</span>
                    <span className="text-text-primary font-medium">
                      ${calculateChange().toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={createOrderMutation.isPending}
            className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {createOrderMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Complete Order - $${total.toFixed(2)}`
            )}
          </button>
        </form>
      </div>
    </div>
  )
} 