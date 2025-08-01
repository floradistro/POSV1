'use client'

import { Trash2, Plus, Minus, User, X, CreditCard, DollarSign, Loader2, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { IDScanner } from './IDScanner'
import { MatrixRain } from './MatrixRain'
import { FloraProduct, floraAPI, CreateOrderData } from '../lib/woocommerce'
import { useLocation } from '@/contexts/LocationContext'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useTaxRates, calculateTaxAmount, type TaxRate } from '@/hooks/useTaxRates'

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
  const { currentLocation } = useLocation()
  const [isCheckoutView, setIsCheckoutView] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash')
  const [cashReceived, setCashReceived] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  
  // Fetch tax rates for the current location
  const { data: taxRatesData, isLoading: taxRatesLoading } = useTaxRates()
  
  const subtotal = items.reduce((total, item) => {
    const price = parseFloat(item.price) || 0
    console.log(`Cart calculation - Product: ${item.name}, Variation: ${item.selectedVariation}, Price: $${price}`)
    return total + price * item.cartQuantity
  }, 0)

  // Calculate tax using location-specific rates
  const { taxAmount: tax, taxBreakdown } = calculateTaxAmount(
    subtotal,
    taxRatesData?.tax_rates || []
  )
  const total = subtotal + tax

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: CreateOrderData) => {
      console.log('🚀 Creating order with data:', orderData)
      console.log('💰 Passing calculated total to API:', total)
      return floraAPI.createOrder(orderData, total)
    },
    onSuccess: (data) => {
      console.log('✅ Order created successfully:', data)
      toast.success(`Order #${data.id} completed successfully!`)
      // Clear cart after successful checkout
      items.forEach(item => onRemoveItem(item.id, item.selectedVariation))
      setIsCheckoutView(false)
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

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (paymentMethod === 'cash') {
      const received = parseFloat(cashReceived)
      if (isNaN(received) || received < total) {
        toast.error('Cash received must be greater than or equal to total')
        return
      }
    }

    console.log('🛒 Starting checkout process...')
    console.log('💳 Payment method:', paymentMethod)
    console.log('💰 Total:', total)
    console.log('👤 Assigned customer:', assignedCustomer)
    
    // Get current location info from context
    const deviceInfo = `${navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'} POS`
    const timestamp = new Date().toISOString()
    
    const orderData: CreateOrderData = {
      payment_method: paymentMethod,
      payment_method_title: paymentMethod === 'cash' ? 'Cash' : 'Card',
      set_paid: true,
      total: total.toFixed(2),
      created_via: 'pos',
      meta_data: [
        {
          key: '_order_source_platform',
          value: 'POS System'
        },
        {
          key: '_order_source_location',
          value: currentLocation.name
        },
        {
          key: '_order_source_details',
          value: `POS ${currentLocation.name}`
        },
        {
          key: '_order_source_device',
          value: deviceInfo
        },
        {
          key: '_order_source_timestamp',
          value: timestamp
        },
        {
          key: '_pos_terminal_id',
          value: currentLocation.terminalId
        },
        {
          key: '_cashier_name',
          value: 'POS User' // This should come from your auth context
        },
        {
          key: '_cashier_email',
          value: 'pos@floracannabis.com' // This should come from your auth context
        },
        {
          key: '_tax_total',
          value: tax.toFixed(2)
        },
        {
          key: '_tax_breakdown',
          value: JSON.stringify(taxBreakdown || [])
        },
        {
          key: '_location_tax_rates',
          value: JSON.stringify(taxRatesData?.tax_rates || [])
        },
        {
          key: '_wc_tax_rate_ids',
          value: JSON.stringify(taxRatesData?.tax_rates?.map((r: TaxRate) => r.id) || [])
        }
      ],
      billing: {
        first_name: assignedCustomer?.firstName || '',
        last_name: assignedCustomer?.lastName || '',
        address_1: assignedCustomer?.address || '',
        address_2: '',
        city: '',
        state: '',
        postcode: '',
        country: 'US',
        email: assignedCustomer?.email || customerEmail || '',
        phone: assignedCustomer?.phone || ''
      },
      shipping: {
        first_name: assignedCustomer?.firstName || '',
        last_name: assignedCustomer?.lastName || '',
        address_1: assignedCustomer?.address || '',
        address_2: '',
        city: '',
        state: '',
        postcode: '',
        country: 'US'
      },
      shipping_lines: [],
      line_items: items.map(item => {
        const itemPrice = parseFloat(item.price) || 0
        const itemTotal = (itemPrice * item.cartQuantity).toFixed(2)
        
        console.log(`📦 Line item: ${item.name}, Price: $${itemPrice}, Qty: ${item.cartQuantity}, Total: $${itemTotal}`)
        
        const lineItem: any = {
          product_id: item.id,
          quantity: item.cartQuantity,
          total: itemTotal,
          subtotal: itemTotal
        }
        
        // Add variation and location metadata
        const metaData: Array<{key: string, value: string}> = []
        
        if (item.selectedVariation !== 'default') {
          metaData.push({
            key: 'variation',
            value: item.selectedVariation
          })
          metaData.push({
            key: 'selected_location',
            value: JSON.stringify({
              selected_value: currentLocation.id,
              selected_text: `${currentLocation.name} Location`
            })
          })
        }
        
        if (metaData.length > 0) {
          lineItem.meta_data = metaData
        }
        
        return lineItem
      })
    }

    // Add customer ID to order if customer is assigned
    if (assignedCustomer) {
      const customerId = parseInt(assignedCustomer.id)
      console.log(`🎯 Adding customer ID to order: ${customerId}`)
      ;(orderData as any).customer_id = customerId
    } else {
      console.warn('⚠️ No customer assigned - points will not be awarded')
    }

    console.log('📦 Final order data:', orderData)
    createOrderMutation.mutate(orderData)
  }

  const calculateChange = () => {
    const received = parseFloat(cashReceived)
    return isNaN(received) ? 0 : Math.max(0, received - total)
  }

  const handleScanResult = async (data: any) => {
    console.log('Scanned customer data:', data)
    setIsScannerOpen(false)
    
    try {
      console.log('🆔 Raw scanned ID data:', data)
      
      // Extract key information from scanned ID
      const firstName = data.firstName || ''
      const lastName = data.lastName || ''
      const email = data.email || '' // IDs don't usually have email, but we'll check
      const phone = data.phone || '' // IDs don't usually have phone, but we'll check
      const dateOfBirth = data.dateOfBirth || ''
      const address = [data.streetAddress, data.streetAddress2, data.city, data.state, data.zipCode]
        .filter(Boolean)
        .join(', ')
      
      console.log('📋 Extracted data:', { firstName, lastName, email, phone, dateOfBirth, address })
      console.log('🔍 Searching for existing customer with:', { firstName, lastName, dateOfBirth })
      
      // Search for existing customer by name and date of birth
      const searchQuery = `${firstName} ${lastName}`.trim()
      console.log('🔍 Searching for customer with query:', searchQuery)
      
      const existingCustomers = await floraAPI.getCustomers({
        search: searchQuery,
        per_page: 50
      })
      
      console.log('📋 Found existing customers:', existingCustomers.length)
      existingCustomers.forEach((customer, index) => {
        console.log(`Customer ${index + 1}:`, {
          id: customer.id,
          name: `${customer.first_name} ${customer.last_name}`,
          email: customer.email
        })
      })
      
      // Try to find exact match by name (more flexible matching)
      let matchedCustomer = null
      if (existingCustomers.length > 0) {
        matchedCustomer = existingCustomers.find(customer => {
          const customerName = `${customer.first_name} ${customer.last_name}`.trim().toLowerCase()
          const scannedName = searchQuery.toLowerCase()
          console.log('🔍 Comparing:', { customerName, scannedName })
          return customerName === scannedName
        })
        
        // If no exact match, try partial matching
        if (!matchedCustomer) {
          matchedCustomer = existingCustomers.find(customer => {
            const customerFirstName = customer.first_name?.toLowerCase() || ''
            const customerLastName = customer.last_name?.toLowerCase() || ''
            const scannedFirstName = firstName.toLowerCase()
            const scannedLastName = lastName.toLowerCase()
            
            return customerFirstName.includes(scannedFirstName) && customerLastName.includes(scannedLastName)
          })
        }
      }
      
      console.log('🎯 Matched customer:', matchedCustomer ? `${matchedCustomer.first_name} ${matchedCustomer.last_name}` : 'None')
      
      if (matchedCustomer) {
        // Customer exists, assign them to the cart
        console.log('Found existing customer:', matchedCustomer)
        const customerPhone = matchedCustomer.billing?.phone || ''
        const totalSpent = parseFloat(matchedCustomer.total_spent || '0')
        const ordersCount = matchedCustomer.orders_count || 0
        const loyaltyPoints = matchedCustomer.loyalty_points || 0
        
                 onAssignCustomer({
           id: matchedCustomer.id.toString(),
           firstName: matchedCustomer.first_name || firstName,
           lastName: matchedCustomer.last_name || lastName,
           email: matchedCustomer.email,
           phone: customerPhone,
           dateOfBirth: dateOfBirth,
           address: `${matchedCustomer.billing?.address_1 || ''} ${matchedCustomer.billing?.city || ''}`.trim() || address,
           totalOrders: ordersCount,
           totalSpent: totalSpent,
           loyaltyPoints: loyaltyPoints,
           status: matchedCustomer.is_paying_customer ? 'active' : 'inactive',
           avatar: matchedCustomer.avatar_url
         })
        
        toast.success(`Customer ${firstName} ${lastName} assigned to cart`)
      } else {
                 // Customer doesn't exist, create new one
         console.log('Creating new customer with scanned data')
         
         // Generate a unique email to avoid conflicts
         const timestamp = Date.now()
         const generatedEmail = email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${timestamp}@scanned-id.local`
         
         const newCustomerData = {
           first_name: firstName,
           last_name: lastName,
           email: generatedEmail,
           billing: {
             first_name: firstName,
             last_name: lastName,
             address_1: data.streetAddress || '',
             address_2: data.streetAddress2 || '',
             city: data.city || '',
             state: data.state || '',
             postcode: data.zipCode || '',
             phone: phone,
             country: 'US' // Add required country field
           },
           shipping: {
             first_name: firstName,
             last_name: lastName,
             address_1: data.streetAddress || '',
             address_2: data.streetAddress2 || '',
             city: data.city || '',
             state: data.state || '',
             postcode: data.zipCode || '',
             country: 'US' // Add required country field
           }
         }
         
         console.log('📝 Customer data to create:', newCustomerData)
        
                 // Create customer via WooCommerce API
         const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/wp-json/wc/v3/customers`, {
           method: 'POST',
           headers: {
             'Authorization': 'Basic ' + btoa(`${process.env.NEXT_PUBLIC_WC_CONSUMER_KEY}:${process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET}`),
             'Content-Type': 'application/json',
           },
           body: JSON.stringify(newCustomerData)
         })
        
                 console.log('📡 API Response status:', response.status)
         console.log('📡 API Response headers:', Object.fromEntries(response.headers.entries()))
         
         if (response.ok) {
           const createdCustomer = await response.json()
           console.log('✅ Created new customer:', createdCustomer)
           
           // Assign the new customer to cart
           onAssignCustomer({
             id: createdCustomer.id.toString(),
             firstName: firstName,
             lastName: lastName,
             email: createdCustomer.email,
             phone: phone,
             dateOfBirth: dateOfBirth,
             address: address,
             totalOrders: 0,
             totalSpent: 0,
             loyaltyPoints: 0,
             status: 'active',
             avatar: createdCustomer.avatar_url
           })
           
           toast.success(`New customer ${firstName} ${lastName} created and assigned to cart`)
         } else {
           const responseText = await response.text()
           console.error('❌ Failed to create customer - Status:', response.status)
           console.error('❌ Response text:', responseText)
           
           let errorData
           try {
             errorData = JSON.parse(responseText)
           } catch (e) {
             errorData = { message: responseText }
           }
           
           console.error('❌ Parsed error data:', errorData)
           
           // Show more detailed error message
           const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`
           toast.error(`Failed to create customer: ${errorMessage}`)
         }
      }
    } catch (error) {
      console.error('Error processing scanned ID:', error)
      toast.error('Failed to process scanned ID data')
    }
  }

  if (items.length === 0) {
    return (
      <div className="w-80 bg-background-primary border-l border-border flex flex-col">
        <div className="flex-1 relative">
          <MatrixRain width={320} height={400} className="absolute inset-0 w-full h-full" />
          
          {/* Floating ID Scanner Button */}
          {!assignedCustomer && (
            <div className="absolute bottom-4 right-4">
              <button 
                onClick={() => setIsScannerOpen(true)}
                className="bg-primary hover:bg-primary/80 text-white p-3 rounded-full shadow-lg transition-colors flex items-center gap-2"
              >
                <User className="w-5 h-5" />
                <span className="text-sm font-medium">Scan ID</span>
              </button>
            </div>
          )}
        </div>
        
        {/* Customer Assignment Section - Only show when customer is assigned */}
        {assignedCustomer && (
          <div className="px-2 py-1">
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
                  <p className="text-xs font-medium text-green-400">
                    {assignedCustomer.loyaltyPoints > 0 ? `${assignedCustomer.loyaltyPoints.toLocaleString()} chips` : '0 chips'}
                  </p>
                </div>
              </div>
              <button 
                onClick={onUnassignCustomer}
                className="text-error hover:text-error/80 transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
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

  return (
    <div className="w-80 bg-background-primary border-l border-white/[0.04] flex flex-col">
      {/* Header */}
              <div className="px-2 py-6 border-b border-white/[0.04]">
        {isCheckoutView ? (
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => setIsCheckoutView(false)}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-text-primary">Checkout</h2>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>

      {isCheckoutView ? (
        /* Checkout Form View */
        <form onSubmit={handleCheckoutSubmit} className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto px-2 py-6 space-y-6">
            {/* Order Summary */}
            <div className="space-y-3">
              <h3 className="font-medium text-text-primary">Order Summary</h3>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={`${item.id}-${item.selectedVariation}`} className="flex justify-between text-sm">
                    <span className="text-text-secondary">
                      {item.name} {formatVariationDisplay(item.selectedVariation) && `(${formatVariationDisplay(item.selectedVariation)})`} × {item.cartQuantity}
                    </span>
                    <span className="text-text-primary font-medium">
                      ${(parseFloat(item.price) * item.cartQuantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-border">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-secondary">Subtotal</span>
                  <span className="text-text-primary">${subtotal.toFixed(2)}</span>
                </div>
                {taxBreakdown && taxBreakdown.length > 0 ? (
                  taxBreakdown.map((taxItem, index) => (
                    <div key={index} className="flex justify-between text-sm mb-1">
                      <span className="text-text-secondary">{taxItem.name}</span>
                      <span className="text-text-primary">${taxItem.amount.toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-text-secondary">Tax</span>
                    <span className="text-text-primary">${tax.toFixed(2)}</span>
                  </div>
                )}
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
          </div>

          {/* Submit Button */}
          <div className="p-6 border-t border-border">
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
          </div>
        </form>
      ) : (
        <>
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-2 py-6">
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
          <div className="px-2 py-6 border-t border-white/[0.04]">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Subtotal</span>
                <span className="text-text-primary">${subtotal.toFixed(2)}</span>
              </div>
              {taxBreakdown && taxBreakdown.length > 0 ? (
                taxBreakdown.map((taxItem, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-text-secondary">{taxItem.name}</span>
                    <span className="text-text-primary">${taxItem.amount.toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Tax</span>
                  <span className="text-text-primary">${tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold pt-2 border-t border-white/[0.04]">
                <span className="text-text-primary">Total</span>
                <span className="text-text-primary">${total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setIsCheckoutView(true)}
                              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-full font-medium transition-colors"
            >
              Checkout
            </button>
          </div>
        </>
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