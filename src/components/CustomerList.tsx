'use client'

import { useState, useEffect } from 'react'

interface Customer {
  id: number
  name: string
  email: string
  phone: string
  totalOrders: number
  totalSpent: number
  lastVisit: string
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

interface CustomerListProps {
  customers: Customer[]
  selectedCustomer: Customer | null
  onSelectCustomer: (customer: Customer) => void
  loading: boolean
  searchQuery: string
  setSearchQuery: (query: string) => void
}

export default function CustomerList({ 
  customers,
  selectedCustomer,
  onSelectCustomer,
  loading,
  searchQuery,
  setSearchQuery
}: CustomerListProps) {
  const [expandedCustomer, setExpandedCustomer] = useState<number | null>(null)

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer => {
    const query = searchQuery.toLowerCase()
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query) ||
      customer.phone.includes(query)
    )
  })

  const handleCustomerClick = (customer: Customer) => {
    if (selectedCustomer?.id === customer.id) {
      onSelectCustomer(null as any)
      setExpandedCustomer(null)
    } else {
      onSelectCustomer(customer)
      setExpandedCustomer(customer.id)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-platinum/60">Loading customers...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Search Bar */}
      <div className="p-4 border-b border-platinum/20">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search customers by name, email, or phone..."
          className="w-full px-4 py-2 bg-[#1a1a1a] text-platinum rounded-lg border border-platinum/20 focus:outline-none focus:border-platinum/40"
        />
      </div>

      {/* Customer List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredCustomers.length === 0 ? (
          <div className="text-center text-platinum/60 py-8">
            {searchQuery ? 'No customers found matching your search' : 'No customers available'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className={`bg-[#1a1a1a] rounded-lg p-4 cursor-pointer transition-all ${
                  selectedCustomer?.id === customer.id
                    ? 'ring-2 ring-platinum/40'
                    : 'hover:bg-[#222]'
                }`}
                onClick={() => handleCustomerClick(customer)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={customer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=c0c0c0&color=000`}
                      alt={customer.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <h3 className="text-platinum font-medium">{customer.name}</h3>
                      <p className="text-platinum/60 text-sm">{customer.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-platinum font-medium">{customer.loyaltyPoints} pts</p>
                    <p className="text-platinum/60 text-sm capitalize">{customer.status}</p>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedCustomer === customer.id && (
                  <div className="mt-4 pt-4 border-t border-platinum/10">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-platinum/60">Phone</p>
                        <p className="text-platinum">{customer.phone}</p>
                      </div>
                      <div>
                        <p className="text-platinum/60">Last Visit</p>
                        <p className="text-platinum">{customer.lastVisit}</p>
                      </div>
                      <div>
                        <p className="text-platinum/60">Total Orders</p>
                        <p className="text-platinum">{customer.totalOrders}</p>
                      </div>
                      <div>
                        <p className="text-platinum/60">Total Spent</p>
                        <p className="text-platinum">${customer.totalSpent.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Order History */}
                    {customer.orderHistory && customer.orderHistory.length > 0 && (
                      <div className="mt-4">
                        <p className="text-platinum/60 text-sm mb-2">Recent Orders</p>
                        <div className="space-y-2">
                          {customer.orderHistory.slice(0, 3).map((order) => (
                            <div key={order.id} className="bg-[#0f0f0f] rounded p-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-platinum/60">{order.date}</span>
                                <span className="text-platinum">${order.total.toFixed(2)}</span>
                              </div>
                              <p className="text-platinum/40 text-xs mt-1">
                                {order.items.slice(0, 2).join(', ')}
                                {order.items.length > 2 && ` +${order.items.length - 2} more`}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 