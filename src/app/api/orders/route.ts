import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('store_id')
    const perPage = searchParams.get('per_page') || '50'
    const orderBy = searchParams.get('orderby') || 'date'
    const order = searchParams.get('order') || 'desc'
    const after = searchParams.get('after')
    const before = searchParams.get('before')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    if (!storeId) {
      return NextResponse.json(
        { error: 'Store ID is required' },
        { status: 400 }
      )
    }

    // Build query parameters for WooCommerce API
    const params = new URLSearchParams({
      per_page: perPage,
      orderby: orderBy,
      order: order,
    })

    // Add date filters
    if (after) params.append('after', `${after}T00:00:00`)
    if (before) params.append('before', `${before}T23:59:59`)
    
    // Add status filter
    if (status) params.append('status', status)
    
    // Add search filter
    if (search) params.append('search', search)

    // Note: Store-specific filtering will be implemented based on Flora Distro's order structure
    // For now, we'll fetch all orders and can filter client-side or adjust based on their API structure

    const apiUrl = `https://api.floradistro.com/wp-json/wc/v3/orders?${params}`
    
    console.log('🔍 Fetching orders from:', apiUrl)

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Basic ${Buffer.from(
          'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5:cs_38194e74c7ddc5d72b6c32c70485728e7e529678'
        ).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('❌ WooCommerce API error:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Error details:', errorText)
      
      return NextResponse.json(
        { error: 'Failed to fetch orders from WooCommerce' },
        { status: response.status }
      )
    }

    const orders = await response.json()
    console.log(`✅ Fetched ${orders.length} orders from Flora Distro API`)
    console.log('📋 Sample order structure:', orders[0] ? JSON.stringify(orders[0], null, 2) : 'No orders found')

    // Transform the data to match our interface
    const transformedOrders = orders.map((order: any) => ({
      id: order.id,
      number: order.number || order.id?.toString(),
      date_created: order.date_created,
      status: order.status,
      total: order.total,
      currency: order.currency || 'USD',
      billing: {
        first_name: order.billing?.first_name || '',
        last_name: order.billing?.last_name || '',
        email: order.billing?.email || '',
        phone: order.billing?.phone || '',
      },
      line_items: (order.line_items || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        total: item.total,
      })),
    }))

    // Temporarily show all orders for testing - location filtering disabled
    let filteredOrders = transformedOrders
    
    console.log(`🏪 Showing ${filteredOrders.length} orders (location filtering disabled for testing)`)
    
    // TODO: Re-enable location filtering once we understand the user's location setup
    /*
    if (storeId) {
      filteredOrders = transformedOrders.filter((order: any) => {
        // Check meta_data for location information
        const originalOrder = orders.find((o: any) => o.id === order.id)
        if (originalOrder?.meta_data) {
          // Look for location information in meta_data
          const locationMeta = originalOrder.meta_data.find((meta: any) => 
            meta.key === '_order_source_location' || meta.key === 'selected_location'
          )
          
          if (locationMeta) {
            // Handle different location formats
            if (locationMeta.key === '_order_source_location') {
              return locationMeta.value.toString().toLowerCase().includes(storeId.toLowerCase())
            } else if (locationMeta.key === 'selected_location' && typeof locationMeta.value === 'string') {
              try {
                const locationData = JSON.parse(locationMeta.value)
                return locationData.selected_value === storeId || 
                       locationData.selected_text?.toLowerCase().includes(storeId.toLowerCase())
              } catch (e) {
                return false
              }
            }
          }
        }
        return false
      })
      
      console.log(`🏪 Filtered to ${filteredOrders.length} orders for location: ${storeId}`)
    }
    */

    return NextResponse.json(filteredOrders)

  } catch (error) {
    console.error('❌ Error in orders API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 