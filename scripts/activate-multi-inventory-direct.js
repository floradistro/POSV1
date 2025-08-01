const STORE_URL = 'http://api.floradistro.com';
const WC_CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const WC_CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

const auth = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString('base64');

console.log('🏭 ACTIVATING MULTI-INVENTORY FOR ALL PRODUCTS');
console.log('==============================================\n');

// Find warehouse location by slug
async function findWarehouseLocation() {
  try {
    console.log('📍 Looking for warehouse location (slug: clt)...');
    
    // Try to get the location via WordPress REST API
    const response = await fetch(`${STORE_URL}/wp-json/wp/v2/mli_location?slug=clt`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.log(`⚠️  WordPress API failed (${response.status}), trying alternative method...`);
      
      // Try to get all locations to find the right one
      const allResponse = await fetch(`${STORE_URL}/wp-json/wp/v2/mli_location`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (allResponse.ok) {
        const allLocations = await allResponse.json();
        console.log('📋 Available locations:');
        allLocations.forEach(loc => {
          console.log(`  - ${loc.name} (slug: ${loc.slug}, ID: ${loc.id})`);
        });
        
        // Find by slug manually
        const warehouse = allLocations.find(loc => loc.slug === 'clt');
        if (warehouse) {
          return warehouse;
        }
      }
      
      throw new Error('Warehouse location with slug "clt" not found');
    }
    
    const locations = await response.json();
    
    if (!locations || locations.length === 0) {
      throw new Error('Warehouse location with slug "clt" not found');
    }
    
    return locations[0];
  } catch (error) {
    console.error('❌ Error finding warehouse location:', error.message);
    throw error;
  }
}

// Get all products
async function getAllProducts() {
  try {
    console.log('📦 Fetching all products...');
    let allProducts = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const response = await fetch(`${STORE_URL}/wp-json/wc/v3/products?per_page=100&page=${page}&status=publish&consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
      
      const products = await response.json();
      allProducts = [...allProducts, ...products];
      
      console.log(`📦 Fetched page ${page}: ${products.length} products (total: ${allProducts.length})`);
      
      // Check if there are more pages
      hasMore = products.length === 100;
      page++;
    }
    
    return allProducts;
  } catch (error) {
    console.error('❌ Error fetching products:', error.message);
    throw error;
  }
}

// Update product with multi-inventory settings
async function updateProductMultiInventory(product, warehouseLocationId) {
  try {
    const productId = product.id;
    const stockQty = product.stock_quantity && product.stock_quantity > 0 ? product.stock_quantity : 25;
    
    // Update via WooCommerce API with all necessary meta data
    const updateData = {
      manage_stock: true,
      stock_status: 'instock',
      stock_quantity: stockQty,
      meta_data: [
        // Remove any existing location meta data first
        ...product.meta_data.filter(meta => 
          !meta.key.includes('mli_location') && 
          !meta.key.includes('multi_inventory') &&
          !meta.key.includes('location')
        ),
        // Add multi-inventory flags
        { key: '_use_multi_inventory', value: 'yes' },
        { key: 'use_multi_inventory', value: 'yes' },
        { key: '_manage_stock', value: 'yes' },
        { key: '_stock_status', value: 'instock' },
        // Add location assignment
        { key: 'mli_location', value: warehouseLocationId.toString() },
        { key: '_mli_location', value: warehouseLocationId.toString() },
        { key: `af_mli_location_stock_${warehouseLocationId}`, value: stockQty.toString() },
        { key: `af_mli_location_price_${warehouseLocationId}`, value: product.regular_price || '0' },
        // Additional location meta that Addify might use
        { key: 'location_id', value: warehouseLocationId.toString() },
        { key: '_location_id', value: warehouseLocationId.toString() },
        { key: 'in_location', value: warehouseLocationId.toString() },
        { key: '_in_location', value: warehouseLocationId.toString() }
      ]
    };
    
    const response = await fetch(`${STORE_URL}/wp-json/wc/v3/products/${productId}?consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText.substring(0, 200)}`);
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to update product ${product.id} (${product.name}): ${error.message}`);
  }
}

// Main execution
async function activateMultiInventory() {
  try {
    // Step 1: Find warehouse location
    const warehouseLocation = await findWarehouseLocation();
    console.log(`✅ Found warehouse: ${warehouseLocation.name} (ID: ${warehouseLocation.id})\n`);
    
    // Step 2: Get all products
    const products = await getAllProducts();
    console.log(`📦 Found ${products.length} products to process\n`);
    
    // Step 3: Process products
    const results = {
      total: products.length,
      successful: 0,
      failed: 0,
      errors: []
    };
    
    console.log('🔄 Starting product processing...\n');
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      try {
        await updateProductMultiInventory(product, warehouseLocation.id);
        results.successful++;
        console.log(`✅ [${i+1}/${products.length}] Updated: ${product.name} (ID: ${product.id})`);
        
      } catch (error) {
        results.failed++;
        results.errors.push(error.message);
        console.log(`❌ [${i+1}/${products.length}] Failed: ${product.name} - ${error.message}`);
      }
      
      // Progress update every 25 products
      if ((i + 1) % 25 === 0) {
        console.log(`\n📊 Progress: ${i+1}/${products.length} processed (${results.successful} success, ${results.failed} failed)\n`);
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Final results
    console.log('\n🎉 MULTI-INVENTORY ACTIVATION COMPLETED!');
    console.log('==========================================');
    console.log(`📦 Total products: ${results.total}`);
    console.log(`✅ Successfully processed: ${results.successful}`);
    console.log(`❌ Failed to process: ${results.failed}`);
    console.log(`🏭 Assigned to: ${warehouseLocation.name} (slug: ${warehouseLocation.slug})`);
    
    if (results.failed > 0) {
      console.log('\n❌ Errors encountered:');
      results.errors.slice(0, 10).forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
      if (results.errors.length > 10) {
        console.log(`  ... and ${results.errors.length - 10} more errors`);
      }
    }
    
    console.log('\n📋 VERIFICATION STEPS:');
    console.log('1. Go to WooCommerce → Multi Locations → Manage Stock');
    console.log('2. Products should now show "Warehouse" instead of "Main Inventory"');
    console.log('3. Check a few product edit pages for multi-location options');
    console.log('4. Test your POS system to verify warehouse inventory access');
    
  } catch (error) {
    console.error('\n❌ ACTIVATION FAILED:', error.message);
    process.exit(1);
  }
}

// Run the activation
activateMultiInventory(); 