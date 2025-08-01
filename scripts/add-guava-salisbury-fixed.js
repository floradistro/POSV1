const STORE_URL = 'http://api.floradistro.com';
const WC_CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const WC_CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

console.log('🏪 ADDING GUAVA CANDY TO SALISBURY LOCATION');
console.log('==========================================\n');

// Find Guava Candy product
async function findGuavaCandyProduct() {
  try {
    console.log('🔍 Finding Guava Candy product...');
    
    const response = await fetch(`${STORE_URL}/wp-json/wc/v3/products?search=Guava Candy&consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to find product: ${response.status}`);
    }
    
    const products = await response.json();
    
    if (!products || products.length === 0) {
      throw new Error('Guava Candy product not found');
    }
    
    return products[0];
  } catch (error) {
    console.error('❌ Error finding Guava Candy:', error.message);
    throw error;
  }
}

// Find Salisbury location
async function findSalisburyLocation() {
  try {
    console.log('📍 Finding Salisbury location (slug: 28144)...');
    
    // Get all locations to find Salisbury
    const allResponse = await fetch(`${STORE_URL}/wp-json/wp/v2/mli_location?consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!allResponse.ok) {
      throw new Error(`Failed to get locations: ${allResponse.status}`);
    }
    
    const allLocations = await allResponse.json();
    console.log('📋 Available locations:');
    allLocations.forEach(loc => {
      console.log(`  - ${loc.name} (slug: ${loc.slug}, ID: ${loc.id})`);
    });
    
    // Find Salisbury by slug or name
    const salisbury = allLocations.find(loc => 
      loc.slug === '28144' || 
      loc.slug === 'salisbury' || 
      loc.name.toLowerCase().includes('salisbury')
    );
    
    if (!salisbury) {
      throw new Error('Salisbury location not found');
    }
    
    return salisbury;
  } catch (error) {
    console.error('❌ Error finding Salisbury location:', error.message);
    throw error;
  }
}

// Add Salisbury inventory to Guava Candy
async function addSalisburyInventory(product, salisburyLocation) {
  try {
    const productId = product.id;
    const salisburyLocationId = salisburyLocation.id;
    
    console.log(`📦 Adding Salisbury inventory to ${product.name} (ID: ${productId})`);
    console.log(`🏪 Salisbury Location: ${salisburyLocation.name} (ID: ${salisburyLocationId})`);
    
    // Get current product meta data
    const currentMetaData = product.meta_data || [];
    
    // Add new Salisbury inventory meta data
    const newMetaData = [
      ...currentMetaData,
      // Salisbury location stock
      { key: `af_mli_location_stock_${salisburyLocationId}`, value: '55' },
      { key: `af_mli_location_price_${salisburyLocationId}`, value: product.regular_price || '15' }
    ];
    
    // Update product via WooCommerce API
    const updateData = {
      meta_data: newMetaData
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
      throw new Error(`Failed to update product: ${response.status} - ${errorText.substring(0, 200)}`);
    }
    
    // Also try to assign via WordPress taxonomy
    try {
      const taxonomyResponse = await fetch(`${STORE_URL}/wp-json/wp/v2/product/${productId}?consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mli_location: [salisburyLocationId]
        })
      });
      
      if (taxonomyResponse.ok) {
        console.log('✅ Also assigned via WordPress taxonomy');
      }
    } catch (taxonomyError) {
      console.log('⚠️  Taxonomy assignment failed, but meta data was updated');
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to add Salisbury inventory: ${error.message}`);
  }
}

// Main execution function
async function main() {
  try {
    // Step 1: Find Guava Candy product
    const guavaProduct = await findGuavaCandyProduct();
    console.log(`✅ Found product: ${guavaProduct.name} (ID: ${guavaProduct.id})\n`);
    
    // Step 2: Find Salisbury location
    const salisburyLocation = await findSalisburyLocation();
    console.log(`✅ Found location: ${salisburyLocation.name} (ID: ${salisburyLocation.id}, slug: ${salisburyLocation.slug})\n`);
    
    // Step 3: Add Salisbury inventory
    const updatedProduct = await addSalisburyInventory(guavaProduct, salisburyLocation);
    
    console.log('🎉 SUCCESS! Guava Candy inventory added to Salisbury location!');
    console.log('===========================================================');
    console.log(`📦 Product: ${updatedProduct.name}`);
    console.log(`🏪 Location: ${salisburyLocation.name} (${salisburyLocation.slug})`);
    console.log(`📊 Stock Quantity: 55 units`);
    console.log(`💰 Price: ${updatedProduct.regular_price || '15'}`);
    
    console.log('\n📋 VERIFICATION STEPS:');
    console.log('1. Go to Products → Edit "Guava Candy"');
    console.log('2. Check the Multi Location Inventory section');
    console.log('3. You should see a new "Salisbury" inventory entry with 55 units');
    console.log('4. Go to WooCommerce → Multi Locations → Manage Stock');
    console.log('5. Filter by "Salisbury" to see the product listed there');
    
  } catch (error) {
    console.error('\n❌ FAILED TO ADD SALISBURY INVENTORY:', error.message);
    process.exit(1);
  }
}

// Run the script
main(); 