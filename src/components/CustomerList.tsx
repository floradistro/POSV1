'use client'

import { useState } from 'react'
import { Customer, sampleCustomers } from '../data/customers'

interface CustomerListProps {
  searchQuery: string
  onCustomerSelect: (customer: Customer | null) => void
  onAddToSale: (customer: Customer) => void
  assignedCustomer?: Customer | null
}

export default function CustomerList({ searchQuery, onCustomerSelect, onAddToSale, assignedCustomer }: CustomerListProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [expandedCustomer, setExpandedCustomer] = useState<number | null>(null)

  // Filter customers based on search query
  const filteredCustomers = sampleCustomers.filter(customer => {
    if (!searchQuery) return true
    return (
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery)
    )
  })

  const handleCustomerClick = (customer: Customer) => {
    // If clicking the same customer, unselect them
    if (selectedCustomer?.id === customer.id) {
      setSelectedCustomer(null)
      onCustomerSelect(null)
    } else {
      setSelectedCustomer(customer)
      onCustomerSelect(customer)
    }
    // Toggle expand on click
    setExpandedCustomer(expandedCustomer === customer.id ? null : customer.id)
  }

  if (filteredCustomers.length === 0) {
    return (
      <section className="w-full relative bg-vscode-bgSecondary overflow-hidden -mt-px min-h-full border border-vscode-border" style={{ boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.3), 0 4px 6px rgba(0, 0, 0, 0.2)' }}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-vscode-text font-light text-lg">No customers found</p>
            <p className="text-vscode-textSecondary text-sm mt-2">Try adjusting your search</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="w-full relative bg-vscode-bg overflow-hidden -mt-px min-h-full border border-vscode-border" style={{ boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.3), 0 4px 6px rgba(0, 0, 0, 0.2)' }}>
      <div className="w-full relative z-10 min-h-full">
        <div className="w-full grid grid-cols-1 gap-0">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              onClick={() => handleCustomerClick(customer)}
              className={`group relative transition-all duration-300 opacity-100 translate-y-0 border-r border-b border-vscode-border cursor-pointer hover:bg-vscode-bgSecondary/50 ${
                selectedCustomer?.id === customer.id ? 'bg-vscode-bgSecondary/50' : ''
              } ${expandedCustomer === customer.id ? 'bg-vscode-bgSecondary/30' : ''}`}
            >
              <div 
                className="transition-all duration-200 px-3 py-1.5 relative"
                style={{
                  background: 'var(--color-secondary-bg)',
                  backdropFilter: 'blur(20px) saturate(120%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(120%)'
                }}
              >
                <div className="flex items-center gap-3 py-1">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-vscode-panel flex items-center justify-center flex-shrink-0 border border-vscode-border">
                    <span className="text-vscode-text font-light text-xs">
                      {customer.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-light text-vscode-text text-sm group-hover:text-white transition-colors duration-300">
                        {customer.name}
                      </h3>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-vscode-textSecondary text-xs leading-tight">{customer.email}</p>
                      <span className="text-vscode-textMuted text-xs font-light">
                        Last visit {new Date(customer.lastVisit).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-vscode-textMuted text-xs leading-tight">{customer.phone}</p>
                  </div>

                  {/* Stats - Compact */}
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <span className="text-vscode-text text-xs font-medium">{customer.totalOrders}</span>
                      <span className="text-vscode-textMuted text-xs block">orders</span>
                    </div>
                    <div className="text-center">
                      <span className="text-success text-xs font-medium">${customer.totalSpent.toFixed(0)}</span>
                      <span className="text-vscode-textMuted text-xs block">spent</span>
                    </div>
                    <div className="text-center">
                      <span className="text-vscode-text text-xs font-medium">{customer.loyaltyPoints}</span>
                      <span className="text-vscode-textMuted text-xs block">chips</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddToSale(customer)
                    }}
                    disabled={assignedCustomer?.id === customer.id}
                    className={`relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-500 overflow-hidden group ${
                      assignedCustomer?.id === customer.id
                        ? 'bg-vscode-accent text-white border border-vscode-accent cursor-default shadow-vscode'
                        : 'bg-vscode-panel hover:bg-vscode-accent text-vscode-textSecondary hover:text-white border border-vscode-border hover:border-vscode-accent hover:scale-110 active:scale-95 backdrop-blur-sm shadow-vscode hover:shadow-vscode-lg'
                    }`}
                  >
                    {/* Subtle glow effect */}
                    <div className={`absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                      assignedCustomer?.id !== customer.id ? 'bg-gradient-to-r from-transparent via-vscode-accent/15 to-transparent animate-gradient-flash' : ''
                    }`} />
                    
                    {/* Icon */}
                    <span className="relative z-10 font-semibold">
                      {assignedCustomer?.id === customer.id ? '✓' : '+'}
                    </span>
                    
                    {/* Subtle glow effect */}
                    <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
                      assignedCustomer?.id === customer.id 
                        ? 'shadow-[0_0_20px_rgba(241,76,76,0.3)]' 
                        : 'group-hover:shadow-[0_0_15px_rgba(241,76,76,0.2)]'
                    }`} />
                  </button>
                </div>

                {/* Expandable Order History */}
                {expandedCustomer === customer.id && customer.orderHistory && (
                  <div className="mt-3 pt-3 border-t border-vscode-border">
                    <h4 className="text-vscode-textSecondary text-xs font-light mb-2 tracking-wide">Recent Orders</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {customer.orderHistory.map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-2 bg-vscode-bgTertiary rounded border border-vscode-border"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-vscode-text text-xs font-medium">#{order.id}</span>
                              <span className="text-vscode-textSecondary text-xs">
                                {new Date(order.date).toLocaleDateString()}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-xs font-light ${
                                order.status === 'completed' ? 'text-success bg-success/20' :
                                order.status === 'pending' ? 'text-warning bg-warning/20' :
                                'text-vscode-accent bg-vscode-accent/20'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            <p className="text-vscode-textSecondary text-xs truncate">
                              {order.items.join(', ')}
                            </p>
                          </div>
                          <div className="text-right ml-2">
                            <span className="text-success text-xs font-medium">
                              ${order.total.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 