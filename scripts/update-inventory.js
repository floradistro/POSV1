// Flora Distro Inventory Update Script
// Updates all products to have at least 50 quantity

const FLORA_API_BASE = 'https://api.floradistro.com/wp-json/wc/v3'
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5'
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678'

class FloraInventoryUpdater {
  constructor() {
    this.baseURL = FLORA_API_BASE
    this.auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64')
  }

  async makeRequest(endpoint, method = 'GET', data = null) {
    const url = `${this.baseURL}${endpoint}`
    
    const options = {
      method,
      headers: {
        'Authorization': `Basic ${this.auth}`,
        'Content-Type': 'application/json',
      },
    }

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data)
    }

    try {
      const response = await fetch(url, options)
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Request failed for ${endpoint}:`, error.message)
      throw error
    }
  }

  async getAllProducts() {
    let allProducts = []
    let page = 1
    let hasMore = true

    console.log('Fetching all products...')

    while (hasMore) {
      try {
        const products = await this.makeRequest(`/products?per_page=100&page=${page}&status=publish`)
        
        if (products.length === 0) {
          hasMore = false
        } else {
          allProducts = allProducts.concat(products)
          console.log(`Fetched page ${page}: ${products.length} products (Total: ${allProducts.length})`)
          page++
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error.message)
        hasMore = false
      }
    }

    return allProducts
  }

  async updateProductInventory(productId, quantity) {
    const updateData = {
      manage_stock: true,
      stock_quantity: quantity,
      stock_status: 'instock'
    }

    try {
      const result = await this.makeRequest(`/products/${productId}`, 'PUT', updateData)
      return result
    } catch (error) {
      console.error(`Failed to update product ${productId}:`, error.message)
      return null
    }
  }

  async updateAllInventory() {
    console.log('🌿 Flora Distro Inventory Update Starting...\n')

    // Get all products
    const products = await this.getAllProducts()
    console.log(`\nFound ${products.length} total products\n`)

    // Filter products that need inventory updates
    const productsToUpdate = products.filter(product => {
      const currentStock = product.stock_quantity || 0
      return currentStock < 50
    })

    console.log(`Products needing inventory update: ${productsToUpdate.length}`)
    console.log(`Products already at 50+: ${products.length - productsToUpdate.length}\n`)

    if (productsToUpdate.length === 0) {
      console.log('✅ All products already have sufficient inventory!')
      return
    }

    // Update products in batches
    const batchSize = 5
    let updated = 0
    let failed = 0

    for (let i = 0; i < productsToUpdate.length; i += batchSize) {
      const batch = productsToUpdate.slice(i, i + batchSize)
      
      console.log(`\nProcessing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(productsToUpdate.length/batchSize)}`)
      
      const promises = batch.map(async (product) => {
        const currentStock = product.stock_quantity || 0
        const newStock = Math.max(50, currentStock)
        
        console.log(`  Updating "${product.name}" (ID: ${product.id}): ${currentStock} → ${newStock}`)
        
        const result = await this.updateProductInventory(product.id, newStock)
        
        if (result) {
          updated++
          console.log(`  ✅ Updated "${product.name}"`)
        } else {
          failed++
          console.log(`  ❌ Failed "${product.name}"`)
        }
        
        return result
      })

      await Promise.all(promises)
      
      // Add delay between batches
      if (i + batchSize < productsToUpdate.length) {
        console.log('  Waiting 2 seconds before next batch...')
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    console.log('\n🎉 Inventory Update Complete!')
    console.log(`✅ Successfully updated: ${updated} products`)
    console.log(`❌ Failed to update: ${failed} products`)
    console.log(`📦 Total products processed: ${productsToUpdate.length}`)
  }
}

// Run the inventory update
async function main() {
  const updater = new FloraInventoryUpdater()
  
  try {
    await updater.updateAllInventory()
  } catch (error) {
    console.error('❌ Script failed:', error.message)
    process.exit(1)
  }
}

// Check if running directly
if (require.main === module) {
  main()
}

module.exports = { FloraInventoryUpdater } 