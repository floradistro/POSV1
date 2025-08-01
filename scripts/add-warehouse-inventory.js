const STORE_URL = 'http://api.floradistro.com';
const WC_CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const WC_CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

console.log('📦 ADDING WAREHOUSE INVENTORY TO GUAVA CANDY');
console.log('==========================================\n');

async function addWarehouseInventory() {
  try {
    const productId = 764; // Guava Candy ID
    const warehouseLocationId = 69; // From our previous test, we saw location 69 in the taxonomy
    const inventoryName = 'Warehouse';
    const quantity = 10;
    
    console.log(`🔍 Adding ${quantity} qty to product ${productId} for Warehouse...`);
    
    // First, get the current product data
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
    
    // Check current inventory setup
    const currentInventoryCount = product.meta_data.find(meta => meta.key === 'af_mli_inventory_count');
    const currentInventoryNames = product.meta_data.find(meta => meta.key === 'af_mli_inventory_names');
    const currentWarehouseStock = product.meta_data.find(meta => meta.key === `af_mli_location_stock_${warehouseLocationId}`);
    
    console.log(`📋 Current inventory count: ${currentInventoryCount ? currentInventoryCount.value : 'None'}`);
    console.log(`📋 Current inventory names: ${currentInventoryNames ? currentInventoryNames.value : 'None'}`);
    console.log(`📋 Current warehouse stock: ${currentWarehouseStock ? currentWarehouseStock.value : 'None'}`);
    
    // Find the next inventory index
    let inventoryIndex = 0;
    if (currentInventoryCount) {
      inventoryIndex = parseInt(currentInventoryCount.value);
    }
    
    // Check if warehouse inventory already exists
    const existingWarehouseInventory = product.meta_data.find(meta => 
      meta.key.includes('inventory') && 
      meta.key.includes('name') && 
      meta.value.toLowerCase().includes('warehouse')
    );
    
    let updateData;
    
    if (existingWarehouseInventory) {
      console.log('📝 Warehouse inventory exists, updating quantity...');
      
      // Find the existing warehouse inventory index
      const warehouseIndexMatch = existingWarehouseInventory.key.match(/af_mli_inventory_(\d+)_name/) || 
                                 existingWarehouseInventory.key.match(/af_mli_inventory_name_(\d+)/);
      
      if (warehouseIndexMatch) {
        const existingIndex = warehouseIndexMatch[1];
        console.log(`🔍 Found existing warehouse inventory at index: ${existingIndex}`);
        
        // Update existing warehouse inventory
        const newMetaData = product.meta_data.map(meta => {
          if (meta.key === `af_mli_inventory_${existingIndex}_stock` || 
              meta.key === `af_mli_inventory_stock_${existingIndex}`) {
            const currentStock = parseInt(meta.value) || 0;
            const newStock = currentStock + quantity;
            console.log(`📈 Updating stock from ${currentStock} to ${newStock}`);
            return { ...meta, value: newStock.toString() };
          }
          if (meta.key === `af_mli_location_stock_${warehouseLocationId}`) {
            const currentStock = parseInt(meta.value) || 0;
            const newStock = currentStock + quantity;
            console.log(`📈 Updating location stock from ${currentStock} to ${newStock}`);
            return { ...meta, value: newStock.toString() };
          }
          return meta;
        });
        
        updateData = { meta_data: newMetaData };
      }
    } else {
      console.log('📝 Creating new warehouse inventory entry...');
      
      // Create new warehouse inventory entry
      const inventoryNames = currentInventoryNames ? currentInventoryNames.value.split(',') : [];
      inventoryNames.push(inventoryName);
      
      const newMetaData = [
        ...product.meta_data,
        // New inventory entry
        { key: `af_mli_inventory_name_${inventoryIndex}`, value: inventoryName },
        { key: `af_mli_inventory_${inventoryIndex}_name`, value: inventoryName },
        { key: `af_mli_inventory_${inventoryIndex}_location`, value: warehouseLocationId.toString() },
        { key: `af_mli_inventory_${inventoryIndex}_priority`, value: '1' },
        { key: `af_mli_inventory_${inventoryIndex}_stock`, value: quantity.toString() },
        { key: `af_mli_inventory_${inventoryIndex}_price`, value: product.regular_price || '15' },
        { key: `af_mli_inventory_${inventoryIndex}_sku`, value: '' },
        { key: `af_mli_inventory_${inventoryIndex}_date`, value: '07/01/2025' },
        { key: `af_mli_inventory_${inventoryIndex}_expiry_date`, value: '' },
        
        // Location-specific stock
        { key: `af_mli_location_stock_${warehouseLocationId}`, value: quantity.toString() },
        { key: `af_mli_location_price_${warehouseLocationId}`, value: product.regular_price || '15' },
        
        // Update counters
        { key: 'af_mli_inventory_count', value: (inventoryIndex + 1).toString() },
        { key: 'af_mli_inventory_names', value: inventoryNames.join(',') },
        
        // Flags
        { key: `af_mli_has_${inventoryName.toLowerCase()}_inventory`, value: 'yes' },
        { key: `_af_mli_has_${inventoryName.toLowerCase()}_inventory`, value: 'yes' },
        { key: 'af_mli_has_multi_inventory', value: 'yes' },
        { key: '_af_mli_has_multi_inventory', value: 'yes' }
      ];
      
      updateData = { meta_data: newMetaData };
    }
    
    // Update the product
    console.log('🔄 Updating product with new inventory data...');
    const updateResponse = await fetch(`${STORE_URL}/wp-json/wc/v3/products/${productId}?consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    console.log(`📊 Update Status: ${updateResponse.status} ${updateResponse.statusText}`);
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.log(`❌ Update Error: ${errorText.substring(0, 300)}`);
      throw new Error(`Failed to update product: ${updateResponse.status}`);
    }
    
    const updatedProduct = await updateResponse.json();
    console.log('✅ Product updated successfully!');
    
    // Also update the taxonomy assignment
    console.log('🏪 Updating location taxonomy...');
    try {
      const taxonomyResponse = await fetch(`${STORE_URL}/wp-json/wp/v2/product/${productId}?consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mli_location: [warehouseLocationId] // Ensure warehouse is in taxonomy
        })
      });
      
      if (taxonomyResponse.ok) {
        console.log('✅ Taxonomy updated successfully!');
      }
    } catch (taxonomyError) {
      console.log('⚠️  Taxonomy update failed, but product was updated');
    }
    
    console.log('\n🎉 SUCCESS! Warehouse inventory added!');
    console.log('=====================================');
    console.log(`📦 Product: ${product.name}`);
    console.log(`🏪 Location: Warehouse (ID: ${warehouseLocationId})`);
    console.log(`📊 Quantity Added: ${quantity}`);
    console.log(`💰 Price: $${product.regular_price}`);
    
    console.log('\n🔍 VERIFICATION STEPS:');
    console.log('1. Go to Guava Candy product edit page');
    console.log('2. Check if Warehouse inventory appears');
    console.log('3. Go to WooCommerce → Multi Locations → Manage Stock');
    console.log('4. Filter by Warehouse to see the inventory');
    console.log('5. Check if quantity shows correctly');
    
  } catch (error) {
    console.error('\n❌ FAILED TO ADD WAREHOUSE INVENTORY:', error.message);
    process.exit(1);
  }
}

// Run the script
addWarehouseInventory(); 