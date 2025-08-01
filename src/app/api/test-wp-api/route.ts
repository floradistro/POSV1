import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://api.floradistro.com'
const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY || 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5'
const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET || 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678'

export async function GET(request: NextRequest) {
  console.log('🧪 Testing WordPress API connectivity...')
  
  const tests = []
  
  // Test 1: Basic WP REST API
  try {
    const wpResponse = await fetch(`${API_BASE}/wp-json/`, {
      headers: {
        'Content-Type': 'application/json',
      }
    })
    tests.push({
      name: 'WordPress REST API',
      url: `${API_BASE}/wp-json/`,
      status: wpResponse.status,
      success: wpResponse.ok
    })
  } catch (error) {
    tests.push({
      name: 'WordPress REST API',
      url: `${API_BASE}/wp-json/`,
      error: error instanceof Error ? error.message : String(error),
      success: false
    })
  }
  
  // Test 2: WooCommerce API
  try {
    const wcResponse = await fetch(`${API_BASE}/wp-json/wc/v3/products?per_page=1`, {
      headers: {
        'Authorization': 'Basic ' + btoa(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`),
        'Content-Type': 'application/json',
      }
    })
    tests.push({
      name: 'WooCommerce API',
      url: `${API_BASE}/wp-json/wc/v3/products`,
      status: wcResponse.status,
      success: wcResponse.ok
    })
  } catch (error) {
    tests.push({
      name: 'WooCommerce API',
      url: `${API_BASE}/wp-json/wc/v3/products`,
      error: error instanceof Error ? error.message : String(error),
      success: false
    })
  }
  
  // Test 3: Addify Multi Inventory API (base)
  try {
    const addifyResponse = await fetch(`${API_BASE}/wp-json/wc/v3/addify_multi_inventory`, {
      headers: {
        'Authorization': 'Basic ' + btoa(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`),
        'Content-Type': 'application/json',
      }
    })
    tests.push({
      name: 'Addify Multi Inventory API',
      url: `${API_BASE}/wp-json/wc/v3/addify_multi_inventory`,
      status: addifyResponse.status,
      success: addifyResponse.ok
    })
  } catch (error) {
    tests.push({
      name: 'Addify Multi Inventory API',
      url: `${API_BASE}/wp-json/wc/v3/addify_multi_inventory`,
      error: error instanceof Error ? error.message : String(error),
      success: false
    })
  }
  
  // Test 4: List all available REST routes
  try {
    const routesResponse = await fetch(`${API_BASE}/wp-json/`, {
      headers: {
        'Content-Type': 'application/json',
      }
    })
    if (routesResponse.ok) {
      const routes = await routesResponse.json()
      const addifyRoutes = Object.keys(routes.routes || {})
        .filter(route => route.includes('addify'))
      tests.push({
        name: 'Available Addify Routes',
        routes: addifyRoutes,
        success: true
      })
    }
  } catch (error) {
    tests.push({
      name: 'Available Addify Routes',
      error: error instanceof Error ? error.message : String(error),
      success: false
    })
  }
  
  return NextResponse.json({
    api_base: API_BASE,
    timestamp: new Date().toISOString(),
    tests
  })
} 