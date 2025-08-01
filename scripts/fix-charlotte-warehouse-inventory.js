const STORE_URL = 'http://api.floradistro.com';
const WC_CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const WC_CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

console.log('🔧 FIXING CHARLOTTE (MONROE) WAREHOUSE INVENTORY');
console.log('===============================================\n');

async function fixCharlotteWarehouseInventory() {
  try {
    const productId = 764; // Guava Candy ID
    const charlotteLocationId = 30; // Charlotte (Monroe) - this is what shows as "Warehouse" in your UI
    const quantityToAdd = 10;
    
    console.log(`🔍 Adding ${quantityToAdd} qty to Charlotte (Monroe) location...`);
    console.log(`📍 Location ID: ${charlotteLocationId} (Charlotte Monroe - shows as "Warehouse" in UI)`);
    
    // Get current product data
    console.log('📊 Getting current product data...');
    const response = await fetch(`${STORE_URL}/wp-json/wc/v3/products/${productId}?consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get product: ${response.status}`);
    }
    
    const product = await response.json();
    console.log(`✅ Retrieved product: ${product.name}`);
    
    // Find current Charlotte stock
    const currentCharlotteStock = product.meta_data.find(meta => meta.key === `af_mli_location_stock_${charlotteLocationId}`);
    const currentStock = currentCharlotteStock ? parseInt(currentCharlotteStock.value) : 0;
    const newStock = currentStock + quantityToAdd;
    
    console.log(`📊 Current Charlotte stock: ${currentStock}`);
    console.log(`📈 New Charlotte stock will be: ${newStock}`);
    
    // Update the meta data
    const updatedMetaData = product.meta_data.map(meta => {
      if (meta.key === `af_mli_location_stock_${charlotteLocationId}`) {
        console.log(`🔄 Updating af_mli_location_stock_${charlotteLocationId} from ${meta.value} to ${newStock}`);
        return { ...meta, value: newStock.toString() };
      }
      
      // Also update any inventory entries that reference Charlotte location
      if (meta.key.includes('inventory') && meta.key.includes('stock') && meta.key.includes('_location') === false) {
        // Find the corresponding location meta for this inventory
        const inventoryIndex = meta.key.match(/af_mli_inventory_(\d+)_stock/);
        if (inventoryIndex) {
          const index = inventoryIndex[1];
          const locationMeta = product.meta_data.find(m => m.key === `af_mli_inventory_${index}_location`);
          if (locationMeta && locationMeta.value === charlotteLocationId.toString()) {
            console.log(`🔄 Updating inventory ${index} stock from ${meta.value} to ${newStock}`);
            return { ...meta, value: newStock.toString() };
          }
        }
      }
      
      return meta;
    });
    
    // Update the product
    console.log('🔄 Updating product with new Charlotte inventory...');
    const updateResponse = await fetch(`${STORE_URL}/wp-json/wc/v3/products/${productId}?consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        meta_data: updatedMetaData
      })
    });
    
    console.log(`📊 Update Status: ${updateResponse.status} ${updateResponse.statusText}`);
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.log(`❌ Update Error: ${errorText.substring(0, 300)}`);
      throw new Error(`Failed to update product: ${updateResponse.status}`);
    }
    
    console.log('✅ Product updated successfully!');
    
    console.log('\n🎉 SUCCESS! Charlotte (Monroe) inventory updated!');
    console.log('==============================================');
    console.log(`📦 Product: ${product.name}`);
    console.log(`🏪 Location: Charlotte (Monroe) - ID ${charlotteLocationId}`);
    console.log(`📊 Previous Stock: ${currentStock}`);
    console.log(`📈 New Stock: ${newStock}`);
    console.log(`➕ Added: ${quantityToAdd} units`);
    
    console.log('\n🔍 VERIFICATION:');
    console.log('================');
    console.log('1. Refresh the Manage Stock page');
    console.log('2. Look for "Guava Candy - Warehouse" entry');
    console.log(`3. It should now show ${newStock} qty instead of ${currentStock} qty`);
    console.log('4. This should match what you see in the UI as "Warehouse"');
    
    console.log('\n📋 LOCATION CLARIFICATION:');
    console.log('==========================');
    console.log('• Charlotte (Monroe) ID 30 = Shows as "Warehouse" in your UI');
    console.log('• Warehouse ID 69 = Separate actual warehouse location');
    console.log('• The UI seems to be mislabeling Charlotte as "Warehouse"');
    
  } catch (error) {
    console.error('\n❌ FAILED TO UPDATE CHARLOTTE INVENTORY:', error.message);
    process.exit(1);
  }
}

// Run the fix
fixCharlotteWarehouseInventory(); 