'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
// import { AppWrapper } from '@/components/AppWrapper'

interface Order {
  id: number
  number: string
  date_created: string
  status: string
  total: string
  currency: string
  billing: {
    first_name: string
    last_name: string
    email: string
    phone: string
  }
  line_items: Array<{
    id: number
    name: string
    quantity: number
    total: string
  }>
}

export default function OrdersPage() {
  const { user, store, token, isLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
      return
    }
    
    if (user?.storeId) {
      fetchOrders()
    }
  }, [user, isLoading, router])

  const fetchOrders = async () => {
    // Temporarily removed token check since API is public for debugging
    // if (!token) {
    //   console.error('No authentication token available')
    //   return
    // }

    try {
      setLoading(true)
      const params = new URLSearchParams({
        store_id: 'Charlotte Monroe', // Using actual location for testing
        per_page: '50',
        orderby: 'date',
        order: 'desc'
      })

      if (dateFrom) params.append('after', dateFrom)
      if (dateTo) params.append('before', dateTo)
      if (statusFilter) params.append('status', statusFilter)
      if (searchTerm) params.append('search', searchTerm)

      console.log('🔍 Fetching orders with params:', params.toString())
      console.log('🔍 Search filters:', { searchTerm, dateFrom, dateTo, statusFilter })
      
      const response = await fetch(`/api/orders?${params}`, {
        headers: {
          // 'Authorization': `Bearer ${token}`, // Temporarily removed - JWT malformed
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', errorText)
        throw new Error('Failed to fetch orders')
      }
      
      const data = await response.json()
      console.log('📦 Received orders:', data.length)
      if (data.length > 0) {
        console.log('📋 First order sample:', data[0])
      }
      setOrders(data)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchOrders()
  }

  const clearFilters = () => {
    setSearchTerm('')
    setDateFrom('')
    setDateTo('')
    setStatusFilter('')
    // Fetch orders immediately after clearing filters
    setTimeout(() => {
      fetchOrders()
    }, 100)
  }

  // Auto-search when Enter is pressed in search field
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400'
      case 'processing': return 'bg-blue-500/20 text-blue-400'
      case 'pending': return 'bg-amber-500/20 text-amber-400'
      case 'cancelled': return 'bg-red-500/20 text-red-400'
      case 'refunded': return 'bg-purple-500/20 text-purple-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="text-platinum">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-primary text-platinum">
      {/* Header */}
      <div className="bg-background-secondary border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-background-tertiary rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold">Orders</h1>
            </div>
                         <div className="text-sm text-platinum/60">
               Location: {store?.name || user?.storeId}
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-full overflow-y-auto">
        {/* Search and Filters */}
        <div className="bg-background-secondary rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search by Invoice # or Customer */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-platinum/80 mb-2">
                Search Invoice # or Customer
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                placeholder="Enter invoice number, customer name, or email..."
                className="w-full px-3 py-2 bg-background-tertiary border border-white/[0.08] rounded-lg text-platinum placeholder-platinum/40 focus:outline-none focus:ring-2 focus:ring-platinum/20"
              />
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-platinum/80 mb-2">
                Date From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  // Auto-search when date is changed
                  setTimeout(fetchOrders, 500)
                }}
                className="w-full px-3 py-2 bg-background-tertiary border border-white/[0.08] rounded-lg text-platinum focus:outline-none focus:ring-2 focus:ring-platinum/20"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-platinum/80 mb-2">
                Date To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  // Auto-search when date is changed
                  setTimeout(fetchOrders, 500)
                }}
                className="w-full px-3 py-2 bg-background-tertiary border border-white/[0.08] rounded-lg text-platinum focus:outline-none focus:ring-2 focus:ring-platinum/20"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-platinum/80 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  // Auto-search when status is changed
                  setTimeout(fetchOrders, 300)
                }}
                className="w-full px-3 py-2 bg-background-tertiary border border-white/[0.08] rounded-lg text-platinum focus:outline-none focus:ring-2 focus:ring-platinum/20"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-platinum text-background-primary rounded-lg hover:bg-platinum/90 transition-colors font-medium"
            >
              Search Orders
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-background-tertiary text-platinum rounded-lg hover:bg-white/[0.08] transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-background-secondary rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="text-platinum/60">Loading orders...</div>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-platinum/60">No orders found</div>
            </div>
          ) : (
            <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
              <table className="w-full">
                <thead className="bg-background-tertiary sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-platinum/80 uppercase tracking-wider">
                      Order #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-platinum/80 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-platinum/80 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-platinum/80 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-platinum/80 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-platinum/80 uppercase tracking-wider">
                      Items
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-background-tertiary/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-platinum">#{order.number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-platinum/80">{formatDate(order.date_created)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-platinum">
                          {order.billing.first_name} {order.billing.last_name}
                        </div>
                        <div className="text-xs text-platinum/60">{order.billing.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-platinum">
                          ${parseFloat(order.total).toFixed(2)} {order.currency}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-platinum/80">
                          {order.line_items.length} item{order.line_items.length !== 1 ? 's' : ''}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 