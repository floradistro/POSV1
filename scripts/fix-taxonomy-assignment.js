const STORE_URL = 'http://api.floradistro.com';
const WC_CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const WC_CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

const auth = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString('base64');

console.log('🔧 FIXING TAXONOMY ASSIGNMENT FOR ALL PRODUCTS');
console.log('==============================================\n');

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
      
      hasMore = products.length === 100;
      page++;
    }
    
    return allProducts;
  } catch (error) {
    console.error('❌ Error fetching products:', error.message);
    throw error;
  }
}

// Assign product to taxonomy via WordPress REST API
async function assignProductToTaxonomy(productId, warehouseLocationId) {
  try {
    // Method 1: Try WordPress REST API for taxonomy assignment
    const wpResponse = await fetch(`${STORE_URL}/wp-json/wp/v2/product/${productId}?consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mli_location: [warehouseLocationId]
      })
    });
    
    if (wpResponse.ok) {
      return { success: true, method: 'WordPress API' };
    }
    
    // Method 2: Try WooCommerce API with taxonomy in meta_data
    const wcResponse = await fetch(`${STORE_URL}/wp-json/wc/v3/products/${productId}?consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        meta_data: [
          { key: 'mli_location', value: warehouseLocationId.toString() },
          { key: '_mli_location', value: warehouseLocationId.toString() },
          { key: 'assigned_location', value: warehouseLocationId.toString() },
          { key: '_assigned_location', value: warehouseLocationId.toString() }
        ]
      })
    });
    
    if (wcResponse.ok) {
      return { success: true, method: 'WooCommerce API' };
    }
    
    // Method 3: Try direct taxonomy assignment via custom endpoint
    const customResponse = await fetch(`${STORE_URL}/wp-json/wp/v2/product/${productId}/mli_location?consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([warehouseLocationId])
    });
    
    if (customResponse.ok) {
      return { success: true, method: 'Custom taxonomy endpoint' };
    }
    
    return { success: false, error: 'All methods failed' };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Main execution
async function fixTaxonomyAssignment() {
  try {
    const warehouseLocationId = 69; // We know this from the previous script
    
    console.log(`🏭 Assigning all products to Warehouse (ID: ${warehouseLocationId})\n`);
    
    // Get all products
    const products = await getAllProducts();
    console.log(`📦 Found ${products.length} products to fix\n`);
    
    const results = {
      total: products.length,
      successful: 0,
      failed: 0,
      errors: []
    };
    
    console.log('🔄 Starting taxonomy assignment...\n');
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      try {
        const result = await assignProductToTaxonomy(product.id, warehouseLocationId);
        
        if (result.success) {
          results.successful++;
          console.log(`✅ [${i+1}/${products.length}] ${product.name} - Assigned via ${result.method}`);
        } else {
          results.failed++;
          results.errors.push(`${product.name}: ${result.error}`);
          console.log(`❌ [${i+1}/${products.length}] ${product.name} - Failed: ${result.error}`);
        }
        
      } catch (error) {
        results.failed++;
        results.errors.push(`${product.name}: ${error.message}`);
        console.log(`❌ [${i+1}/${products.length}] ${product.name} - Error: ${error.message}`);
      }
      
      // Progress update every 25 products
      if ((i + 1) % 25 === 0) {
        console.log(`\n📊 Progress: ${i+1}/${products.length} processed (${results.successful} success, ${results.failed} failed)\n`);
      }
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Final results
    console.log('\n🎉 TAXONOMY ASSIGNMENT COMPLETED!');
    console.log('==================================');
    console.log(`📦 Total products: ${results.total}`);
    console.log(`✅ Successfully assigned: ${results.successful}`);
    console.log(`❌ Failed assignments: ${results.failed}`);
    
    if (results.failed > 0) {
      console.log('\n❌ Failed products:');
      results.errors.slice(0, 10).forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
      if (results.errors.length > 10) {
        console.log(`  ... and ${results.errors.length - 10} more errors`);
      }
    }
    
    console.log('\n📋 VERIFICATION:');
    console.log('1. Refresh WooCommerce → Multi Locations → Manage Stock');
    console.log('2. Products should now show "Warehouse" instead of "Main Inventory"');
    console.log('3. If still showing "Main Inventory", we need to try a different approach');
    
  } catch (error) {
    console.error('\n❌ TAXONOMY ASSIGNMENT FAILED:', error.message);
    process.exit(1);
  }
}

// Run the fix
fixTaxonomyAssignment(); 