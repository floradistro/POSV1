import { NextRequest, NextResponse } from 'next/server'
import { floraAPI } from '../../../../lib/woocommerce'

export async function GET(request: NextRequest) {
  try {
    console.log('🏪 Fetching stores...')
    
    const stores = await floraAPI.getStores()
    
    if (stores.length > 0) {
      console.log('✅ Fetched', stores.length, 'stores')
      return NextResponse.json(stores)
    } else {
      console.log('⚠️ No stores found')
      return NextResponse.json([])
    }
  } catch (error) {
    console.error('❌ Error fetching stores:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stores' },
      { status: 500 }
    )
  }
} 