import { NextResponse } from 'next/server'
import { floraAPI } from '../../../lib/woocommerce'

export async function GET() {
  try {
    console.log('🧪 Testing basic product fetching...')
    
    // Fetch a few products to test basic functionality
    const products = await floraAPI.getProducts({
      per_page: 3
    })
    
    console.log(`📦 Fetched ${products.length} products successfully`)
    
    // Return basic product info
    const productSummary = products.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      categories: product.categories.map(cat => cat.name),
      stock: product.stock_quantity,
      in_stock: product.in_stock
    }))
    
    return NextResponse.json({
      success: true,
      message: 'Products fetching successfully',
      count: products.length,
      products: productSummary
    })
    
  } catch (error) {
    console.error('❌ Product test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 