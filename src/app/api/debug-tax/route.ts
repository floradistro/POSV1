import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'https://api.floradistro.com'
const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY || 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5'
const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET || 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678'

export async function GET(request: NextRequest) {
  const locationId = 32 // Blowing Rock
  
  try {
    // 1. Check the tax rates endpoint
    const taxUrl = `${API_BASE}/wp-json/wc/v3/addify_headless_inventory/location/${locationId}/tax-rates`
    const taxResponse = await fetch(taxUrl, {
      headers: {
        'Authorization': 'Basic ' + btoa(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`),
      },
      cache: 'no-store'
    })
    const taxData = await taxResponse.json()
    
    // 2. Check if location exists
    const locationUrl = `${API_BASE}/wp-json/wc/v3/addify_headless_inventory/location/${locationId}`
    const locationResponse = await fetch(locationUrl, {
      headers: {
        'Authorization': 'Basic ' + btoa(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`),
      },
      cache: 'no-store'
    })
    const locationData = await locationResponse.json()
    
    // 3. Check old custom tax meta (if it exists)
    // This would need a custom endpoint, so we'll skip for now
    
    return NextResponse.json({
      debug: {
        locationId,
        taxEndpointResponse: taxData,
        locationExists: locationResponse.ok,
        locationData: locationData,
        apiBase: API_BASE,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 