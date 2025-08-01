import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://api.floradistro.com'
const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY || 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5'
const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET || 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678'

export async function GET(
  request: NextRequest,
  { params }: { params: { storeId: string } }
) {
  const storeId = params.storeId
  // The REST API endpoint for tax rates
  const url = `${API_BASE}/wp-json/wc/v3/addify_headless_inventory/location/${storeId}/tax-rates`
  
  console.log(`🔍 Fetching tax rates from: ${url}`)
  console.log(`🔑 Using API base: ${API_BASE}`)

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': 'Basic ' + btoa(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`),
      },
      cache: 'no-store' // Prevent caching of the fetch request
    })

    console.log('📡 Response status:', response.status)
    console.log('📡 Response headers:', response.headers)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    // Filter out old tax format (temporary fix)
    if (data && data.tax_rates && Array.isArray(data.tax_rates)) {
      // Check if this is old format data (has 'type' field)
      const hasOldFormat = data.tax_rates.some((rate: any) => 'type' in rate)
      
      if (hasOldFormat) {
        console.log('⚠️  Old tax format detected, returning empty rates until cleanup')
        data.tax_rates = []
        data.total_rate = 0
      }
    }
    
    console.log('📊 Fetched tax rates for store', storeId + ':', data)
    
    // Return with cache headers to prevent stale data
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Error fetching tax rates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 