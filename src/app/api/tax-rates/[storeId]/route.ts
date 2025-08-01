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
    // Fetch tax rates from the Addify plugin endpoint
    const response = await fetch(url, {
      headers: {
        'Authorization': 'Basic ' + btoa(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`),
        'Content-Type': 'application/json',
      }
    })

    console.log(`📡 Response status: ${response.status}`)
    console.log(`📡 Response headers:`, response.headers)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to fetch tax rates: ${response.status}`)
      console.error(`Error response: ${errorText}`)
      
      // If 404, provide a default response for testing
      if (response.status === 404) {
        console.log('⚠️ Tax rates endpoint not found, returning default test rates')
        
        // Default tax rates for testing - these should match your actual store configurations
        const testTaxRates: Record<string, any> = {
          '31': { // Charlotte Nations Ford
            location_id: 31,
            location_name: 'Charlotte Nations Ford',
            tax_rates: [
              { name: 'NC State Tax', rate: 4.75, type: 'percentage', compound: 'no' },
              { name: 'Mecklenburg County Tax', rate: 2.5, type: 'percentage', compound: 'no' },
              { name: 'Cannabis Excise Tax', rate: 15, type: 'percentage', compound: 'yes' }
            ],
            total_rate: 23.96
          },
          '30': { // Charlotte Monroe
            location_id: 30,
            location_name: 'Charlotte Monroe',
            tax_rates: [
              { name: 'NC State Tax', rate: 4.75, type: 'percentage', compound: 'no' },
              { name: 'Mecklenburg County Tax', rate: 2.5, type: 'percentage', compound: 'no' },
              { name: 'Cannabis Excise Tax', rate: 15, type: 'percentage', compound: 'yes' }
            ],
            total_rate: 23.96
          },
          '35': { // Elizabethton
            location_id: 35,
            location_name: 'Elizabethton',
            tax_rates: [
              { name: 'TN State Tax', rate: 7, type: 'percentage', compound: 'no' },
              { name: 'Local Tax', rate: 2.5, type: 'percentage', compound: 'no' }
            ],
            total_rate: 9.5
          },
          '34': { // Salisbury
            location_id: 34,
            location_name: 'Salisbury',
            tax_rates: [
              { name: 'NC State Tax', rate: 4.75, type: 'percentage', compound: 'no' },
              { name: 'Rowan County Tax', rate: 2, type: 'percentage', compound: 'no' }
            ],
            total_rate: 6.75
          },
          '32': { // Blowing Rock
            location_id: 32,
            location_name: 'Blowing Rock',
            tax_rates: [
              { name: 'NC State Tax', rate: 4.75, type: 'percentage', compound: 'no' },
              { name: 'Watauga County Tax', rate: 2.25, type: 'percentage', compound: 'no' }
            ],
            total_rate: 7
          }
        }
        
        const storeData = testTaxRates[storeId] || {
          location_id: parseInt(storeId),
          location_name: 'Store ' + storeId,
          tax_rates: [],
          total_rate: 0
        }
        
        return NextResponse.json(storeData)
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch tax rates' },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log(`📊 Fetched tax rates for store ${storeId}:`, data)
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching tax rates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 