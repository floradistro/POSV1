import { NextResponse } from 'next/server'
import { floraAPI } from '../../../lib/woocommerce'

export async function GET() {
  try {
    console.log('🧪 Testing ACF field integration...')
    
    // Fetch a few products to test ACF fields
    const products = await floraAPI.getProducts({
      per_page: 3
    })
    
    console.log(`📦 Fetched ${products.length} products for ACF testing`)
    
    // Log ACF data for each product
    const acfTestResults = products.map(product => ({
      id: product.id,
      name: product.name,
      categories: product.categories.map(cat => cat.name),
      has_acf: !!product.acf,
      acf_raw: product.acf,
      acf_fields_count: product.acf_fields?.length || 0,
      acf_fields: product.acf_fields?.map(field => ({
        key: field.key,
        label: field.label,
        type: field.type,
        value: typeof field.value === 'string' && field.value.length > 100 
          ? field.value.substring(0, 100) + '...' 
          : field.value
      })) || []
    }))
    
    console.log('🔍 ACF Test Results:', JSON.stringify(acfTestResults, null, 2))
    
    const summary = {
      total_products: products.length,
      products_with_acf: acfTestResults.filter(p => p.has_acf).length,
      total_acf_fields: acfTestResults.reduce((sum, p) => sum + p.acf_fields_count, 0),
      field_types_found: Array.from(new Set(
        acfTestResults.flatMap(p => p.acf_fields.map(f => f.type))
      )),
      sample_field_keys: Array.from(new Set(
        acfTestResults.flatMap(p => p.acf_fields.map(f => f.key))
      )).slice(0, 10)
    }
    
    return NextResponse.json({
      success: true,
      message: 'ACF test completed',
      results: acfTestResults,
      summary
    })
    
  } catch (error) {
    console.error('❌ ACF test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
} 