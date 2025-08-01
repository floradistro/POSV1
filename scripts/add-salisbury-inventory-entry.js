const STORE_URL = 'http://api.floradistro.com';
const WC_CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const WC_CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

console.log('📦 ADDING SALISBURY INVENTORY ENTRY TO GUAVA CANDY');
console.log('=================================================\n');

// Add Salisbury inventory entry to Guava Candy
async function addSalisburyInventoryEntry() {
  try {
    const productId = 764; // Guava Candy ID
    const salisburyLocationId = 34; // Salisbury location ID
    
    console.log('🔍 Getting current Guava Candy product data...');
    
    // Get current product
    const getResponse = await fetch(`${STORE_URL}/wp-json/wc/v3/products/${productId}?consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!getResponse.ok) {
      throw new Error(`Failed to get product: ${getResponse.status}`);
    }
    
    const product = await getResponse.json();
    console.log(`✅ Found product: ${product.name}`);
    
    // Get current meta data
    const currentMetaData = product.meta_data || [];
    
    // Create new inventory entry for Salisbury
    console.log('📝 Creating Salisbury inventory entry...');
    
    const newMetaData = [
      ...currentMetaData,
      // Salisbury inventory entry - this creates the inventory section
      { key: 'af_mli_inventory_name_salisbury', value: 'Salisbury' },
      { key: 'af_mli_inventory_location_salisbury', value: salisburyLocationId.toString() },
      { key: 'af_mli_inventory_priority_salisbury', value: '2' },
      { key: 'af_mli_inventory_stock_salisbury', value: '55' },
      { key: 'af_mli_inventory_price_salisbury', value: '15' },
      
      // Location-specific stock (Addify format)
      { key: `af_mli_location_stock_${salisburyLocationId}`, value: '55' },
      { key: `af_mli_location_price_${salisburyLocationId}`, value: '15' },
      
      // Additional inventory meta
      { key: 'af_mli_has_salisbury_inventory', value: 'yes' },
      { key: '_af_mli_has_salisbury_inventory', value: 'yes' },
      
      // Inventory list (to make it appear in the UI)
      { key: 'af_mli_inventory_list', value: 'warehouse,Charlotte (Monroe),Salisbury' },
      { key: '_af_mli_inventory_list', value: 'warehouse,Charlotte (Monroe),Salisbury' }
    ];
    
    // Update the product
    const updateData = {
      meta_data: newMetaData
    };
    
    console.log('💾 Updating product with Salisbury inventory entry...');
    
    const updateResponse = await fetch(`${STORE_URL}/wp-json/wc/v3/products/${productId}?consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Failed to update product: ${updateResponse.status} - ${errorText.substring(0, 300)}`);
    }
    
    const updatedProduct = await updateResponse.json();
    
    // Also ensure Salisbury is checked in the locations panel
    console.log('🏪 Assigning product to Salisbury location taxonomy...');
    
    try {
      const taxonomyResponse = await fetch(`${STORE_URL}/wp-json/wp/v2/product/${productId}?consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mli_location: [69, 30, salisburyLocationId] // Warehouse, Charlotte, Salisbury
        })
      });
      
      if (taxonomyResponse.ok) {
        console.log('✅ Product assigned to all locations via taxonomy');
      }
    } catch (taxonomyError) {
      console.log('⚠️  Taxonomy assignment failed, but inventory entry was created');
    }
    
    console.log('\n🎉 SUCCESS! Salisbury inventory entry created!');
    console.log('============================================');
    console.log(`📦 Product: ${updatedProduct.name}`);
    console.log(`🏪 New Inventory: Salisbury`);
    console.log(`📍 Location ID: ${salisburyLocationId}`);
    console.log(`📊 Stock Quantity: 55 units`);
    console.log(`💰 Price: $15`);
    
    console.log('\n📋 VERIFICATION STEPS:');
    console.log('1. Refresh the Guava Candy product edit page');
    console.log('2. Scroll down to Multi Location Inventory section');
    console.log('3. You should now see THREE inventory entries:');
    console.log('   - warehouse');
    console.log('   - Charlotte (Monroe)');
    console.log('   - Salisbury ← NEW!');
    console.log('4. The Salisbury entry should show:');
    console.log('   - Location: Salisbury');
    console.log('   - Stock Quantity: 55');
    console.log('   - Priority: 2');
    console.log('5. Check that Salisbury is also checked in the Locations panel on the right');
    
  } catch (error) {
    console.error('\n❌ FAILED TO CREATE SALISBURY INVENTORY ENTRY:', error.message);
    process.exit(1);
  }
}

// Run the script
addSalisburyInventoryEntry(); 