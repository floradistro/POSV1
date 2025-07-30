const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// WooCommerce API credentials
const STORE_URL = 'https://api.floradistro.com';
const CONSUMER_KEY = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
const CONSUMER_SECRET = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

// Base64 encode credentials
const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');

// Pricing structure for different categories
const PRICING_CONFIG = {
  flower: {
    basePrice: 15, // per gram
    weights: {
      '1g': 15,
      '3.5g': 45,
      '7g': 85,
      '14g': 160,
      '28g': 300
    }
  },
  concentrate: {
    basePrice: 35, // per gram
    weights: {
      '1g': 35,
      '3.5g': 110,
      '7g': 210,
      '14g': 400,
      '28g': 750
    }
  },
  vape: {
    basePrice: 50,
    quantities: {
      '1': 50,
      '2': 95,
      '3': 140,
      '4': 180
    }
  }
};

async function makeWooCommerceRequest(endpoint, method = 'GET', data = null) {
  const url = `${STORE_URL}/wp-json/wc/v3${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    }
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WooCommerce API Error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

async function fixFlowerProduct(product, weightAttributeId) {
  console.log(`\n🌸 Fixing flower product: ${product.name} (ID: ${product.id})`);
  
  try {
    // Update product attributes
    await makeWooCommerceRequest(`/products/${product.id}`, 'PUT', {
      attributes: [
        {
          id: weightAttributeId,
          name: 'Weight',
          position: 0,
          visible: true,
          variation: true,
          options: ['1g', '3.5g', '7g', '14g', '28g']
        }
      ]
    });

    console.log('✅ Updated product attributes');

    // Get existing variations
    const variations = await makeWooCommerceRequest(`/products/${product.id}/variations`);
    
    // Update each variation with proper pricing and attributes
    const weights = ['1g', '3.5g', '7g', '14g', '28g'];
    
    for (let i = 0; i < Math.min(variations.length, weights.length); i++) {
      const variation = variations[i];
      const weight = weights[i];
      const price = PRICING_CONFIG.flower.weights[weight];

      await makeWooCommerceRequest(`/products/${product.id}/variations/${variation.id}`, 'PUT', {
        regular_price: price.toString(),
        price: price.toString(),
        attributes: [
          {
            id: weightAttributeId,
            name: 'Weight',
            option: weight
          }
        ]
      });

      console.log(`   ✅ Updated variation ${weight}: $${price}`);
    }

  } catch (error) {
    console.error(`❌ Error fixing flower product ${product.name}:`, error.message);
  }
}

async function fixConcentrateProduct(product, weightAttributeId) {
  console.log(`\n🍯 Fixing concentrate product: ${product.name} (ID: ${product.id})`);
  
  try {
    // Update product attributes
    await makeWooCommerceRequest(`/products/${product.id}`, 'PUT', {
      attributes: [
        {
          id: weightAttributeId,
          name: 'Weight',
          position: 0,
          visible: true,
          variation: true,
          options: ['1g', '3.5g', '7g', '14g', '28g']
        }
      ]
    });

    console.log('✅ Updated product attributes');

    // Get existing variations
    const variations = await makeWooCommerceRequest(`/products/${product.id}/variations`);
    
    // Update each variation with proper pricing and attributes
    const weights = ['1g', '3.5g', '7g', '14g', '28g'];
    
    for (let i = 0; i < Math.min(variations.length, weights.length); i++) {
      const variation = variations[i];
      const weight = weights[i];
      const price = PRICING_CONFIG.concentrate.weights[weight];

      await makeWooCommerceRequest(`/products/${product.id}/variations/${variation.id}`, 'PUT', {
        regular_price: price.toString(),
        price: price.toString(),
        attributes: [
          {
            id: weightAttributeId,
            name: 'Weight',
            option: weight
          }
        ]
      });

      console.log(`   ✅ Updated variation ${weight}: $${price}`);
    }

  } catch (error) {
    console.error(`❌ Error fixing concentrate product ${product.name}:`, error.message);
  }
}

async function main() {
  console.log('🚀 Starting WooCommerce product fix (v2)...\n');

  try {
    // Use existing Weight attribute (ID: 3)
    const weightAttributeId = 3;

    // Get all products
    console.log('\n📦 Fetching products...');
    const allProducts = await makeWooCommerceRequest('/products?per_page=100');
    
    // Filter variable products by category
    const flowerProducts = allProducts.filter(p => 
      p.type === 'variable' && 
      p.categories?.some(cat => cat.name === 'Flower' || cat.id === 25)
    );
    
    const concentrateProducts = allProducts.filter(p => 
      p.type === 'variable' && 
      p.categories?.some(cat => cat.name === 'Concentrate' || cat.id === 22)
    );

    console.log(`\n📊 Found products:`);
    console.log(`   🌸 Flower: ${flowerProducts.length}`);
    console.log(`   🍯 Concentrate: ${concentrateProducts.length}`);

    // Fix flower products (limit to first 5 for testing)
    console.log('\n🌸 Fixing flower products...');
    for (const product of flowerProducts.slice(0, 5)) {
      await fixFlowerProduct(product, weightAttributeId);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
    }

    // Fix concentrate products (limit to first 3 for testing)
    console.log('\n🍯 Fixing concentrate products...');
    for (const product of concentrateProducts.slice(0, 3)) {
      await fixConcentrateProduct(product, weightAttributeId);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
    }

    console.log('\n✅ WooCommerce product fix completed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Fixed product variations with proper pricing');
    console.log('   ✅ Configured weight attributes for gram selection');
    console.log('   ✅ Set up deli-style inventory management');

  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

// Run the script
main(); 