import { NextResponse } from 'next/server'
import { createWooHeaders } from '../../../../../lib/woocommerce'

const API_BASE = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://api.floradistro.com'

export async function GET(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const productId = params.productId
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    console.log(`🔍 Fetching ACF fields for product ${productId}...`)
    
    // Fetch the full product data to get ACF fields
    const response = await fetch(`${API_BASE}/wp-json/wc/v3/products/${productId}`, {
      headers: createWooHeaders()
    })

    if (!response.ok) {
      throw new Error(`WooCommerce API error: ${response.status}`)
    }

    const product = await response.json()
    
    // Process ACF fields
    let acfFields: Array<{ key: string; label: string; value: any; type: string }> = []
    
    if (product.acf && Object.keys(product.acf).length > 0) {
      // Direct ACF fields
      acfFields = processACFFields(product.acf)
      console.log(`✅ Found ${acfFields.length} direct ACF fields for product ${productId}`)
    } else if (product.meta_data) {
      // Extract from meta_data
      const acfFromMeta: Record<string, any> = {}
             product.meta_data.forEach((meta: any) => {
         // Only include actual product information ACF fields - exclude system/technical fields
         if (!meta.key.startsWith('_') && 
             !meta.key.startsWith('mli_') && 
             !meta.key.startsWith('af_mli_') &&
             !meta.key.includes('inventory') &&
             !meta.key.includes('location_stock') &&
             !meta.key.includes('location_price') &&
             !meta.key.includes('multi_inventory') &&
             !meta.key.includes('weight_based') &&
             !meta.key.includes('available_weights') &&
             !meta.key.includes('bulk_inventory') &&
             !meta.key.includes('stock_log') &&
             !meta.key.includes('timestamp') &&
             !meta.key.includes('date') &&
             !meta.key.includes('_date') &&
             !meta.key.includes('update_') &&
             !meta.key.includes('test_') &&
             meta.key !== 'mli_product_type' &&
             meta.key !== 'use_multi_inventory' &&
             meta.key !== 'location_id' &&
             meta.key !== 'in_location' &&
             meta.key !== 'in_stock_quantity' &&
             meta.key !== 'weight_based_pricing' &&
             meta.key !== 'available_weights' &&
             meta.key !== 'prod_level_inven' &&
             meta.key !== 'bulk_inventory_grams' &&
             meta.key !== 'in_date' &&
             meta.key !== 'test_update_timestamp' &&
             meta.value !== null && 
             meta.value !== '') {
           acfFromMeta[meta.key] = meta.value
         }
       })
      
      if (Object.keys(acfFromMeta).length > 0) {
        acfFields = processACFFields(acfFromMeta)
        console.log(`✅ Found ${acfFields.length} ACF fields in meta_data for product ${productId}`)
      }
    }

    return NextResponse.json({
      success: true,
      product_id: parseInt(productId),
      acf_fields: acfFields,
      field_count: acfFields.length
    })

  } catch (error) {
    console.error(`❌ Failed to fetch ACF for product ${params.productId}:`, error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper function to process ACF fields
function processACFFields(acf: Record<string, any>): Array<{ key: string; label: string; value: any; type: string }> {
  if (!acf || typeof acf !== 'object') return []
  
  const acfFields = []
  
  for (const [key, value] of Object.entries(acf)) {
    if (value === null || value === undefined || value === '') continue
    
    // Determine field type based on value
    let type = 'text'
    let displayValue = value
    
    if (typeof value === 'boolean') {
      type = 'boolean'
      displayValue = value ? 'Yes' : 'No'
    } else if (Array.isArray(value)) {
      type = 'array'
      displayValue = value.join(', ')
    } else if (typeof value === 'object' && value.url) {
      type = 'image'
      displayValue = value
    } else if (typeof value === 'object') {
      type = 'object'
      displayValue = JSON.stringify(value, null, 2)
    } else if (typeof value === 'number') {
      type = 'number'
    } else if (typeof value === 'string' && value.includes('http')) {
      type = 'url'
    }
    
    // Convert snake_case to readable labels
    const label = key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    
    acfFields.push({
      key,
      label,
      value: displayValue,
      type
    })
  }
  
  return acfFields
} 