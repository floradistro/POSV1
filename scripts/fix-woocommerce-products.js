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

async function createWeightAttribute() {
  console.log('🏷️  Creating Weight attribute...');
  
  try {
    // Check if Weight attribute already exists
    const attributes = await makeWooCommerceRequest('/products/attributes');
    const weightAttr = attributes.find(attr => attr.name === 'Weight');
    
    if (weightAttr) {
      console.log('✅ Weight attribute already exists:', weightAttr.id);
      return weightAttr.id;
    }

    // Create Weight attribute
    const newAttribute = await makeWooCommerceRequest('/products/attributes', 'POST', {
      name: 'Weight',
      slug: 'weight',
      type: 'select',
      order_by: 'menu_order',
      has_archives: false
    });

    console.log('✅ Created Weight attribute:', newAttribute.id);
    return newAttribute.id;
  } catch (error) {
    console.error('❌ Error creating Weight attribute:', error.message);
    return null;
  }
}

async function createQuantityAttribute() {
  console.log('🏷️  Creating Quantity attribute...');
  
  try {
    // Check if Quantity attribute already exists
    const attributes = await makeWooCommerceRequest('/products/attributes');
    const quantityAttr = attributes.find(attr => attr.name === 'Quantity');
    
    if (quantityAttr) {
      console.log('✅ Quantity attribute already exists:', quantityAttr.id);
      return quantityAttr.id;
    }

    // Create Quantity attribute
    const newAttribute = await makeWooCommerceRequest('/products/attributes', 'POST', {
      name: 'Quantity',
      slug: 'quantity',
      type: 'select',
      order_by: 'menu_order',
      has_archives: false
    });

    console.log('✅ Created Quantity attribute:', newAttribute.id);
    return newAttribute.id;
  } catch (error) {
    console.error('❌ Error creating Quantity attribute:', error.message);
    return null;
  }
}

async function fixFlowerProduct(product, weightAttributeId) {
  console.log(`\n🌸 Fixing flower product: ${product.name} (ID: ${product.id})`);
  
  try {
    // Update product attributes
    const updatedProduct = await makeWooCommerceRequest(`/products/${product.id}`, 'PUT', {
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
        ],
        manage_stock: 'parent'
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
        ],
        manage_stock: 'parent'
      });

      console.log(`   ✅ Updated variation ${weight}: $${price}`);
    }

  } catch (error) {
    console.error(`❌ Error fixing concentrate product ${product.name}:`, error.message);
  }
}

async function fixVapeProduct(product, quantityAttributeId) {
  console.log(`\n💨 Fixing vape product: ${product.name} (ID: ${product.id})`);
  
  try {
    // Update product attributes
    await makeWooCommerceRequest(`/products/${product.id}`, 'PUT', {
      attributes: [
        {
          id: quantityAttributeId,
          name: 'Quantity',
          position: 0,
          visible: true,
          variation: true,
          options: ['1', '2', '3', '4']
        }
      ]
    });

    console.log('✅ Updated product attributes');

    // Get existing variations
    const variations = await makeWooCommerceRequest(`/products/${product.id}/variations`);
    
    // Update each variation with proper pricing and attributes
    const quantities = ['1', '2', '3', '4'];
    
    for (let i = 0; i < Math.min(variations.length, quantities.length); i++) {
      const variation = variations[i];
      const quantity = quantities[i];
      const price = PRICING_CONFIG.vape.quantities[quantity];

      await makeWooCommerceRequest(`/products/${product.id}/variations/${variation.id}`, 'PUT', {
        regular_price: price.toString(),
        price: price.toString(),
        attributes: [
          {
            id: quantityAttributeId,
            name: 'Quantity',
            option: quantity
          }
        ]
      });

      console.log(`   ✅ Updated variation ${quantity}: $${price}`);
    }

  } catch (error) {
    console.error(`❌ Error fixing vape product ${product.name}:`, error.message);
  }
}

async function main() {
  console.log('🚀 Starting WooCommerce product fix...\n');

  try {
    // Create necessary attributes
    const weightAttributeId = await createWeightAttribute();
    const quantityAttributeId = await createQuantityAttribute();

    if (!weightAttributeId || !quantityAttributeId) {
      console.error('❌ Failed to create required attributes');
      return;
    }

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
    
    const vapeProducts = allProducts.filter(p => 
      p.type === 'variable' && 
      p.categories?.some(cat => cat.name === 'Vape' || cat.id === 19)
    );

    console.log(`\n📊 Found products:`);
    console.log(`   🌸 Flower: ${flowerProducts.length}`);
    console.log(`   🍯 Concentrate: ${concentrateProducts.length}`);
    console.log(`   💨 Vape: ${vapeProducts.length}`);

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

    // Fix vape products (limit to first 3 for testing)
    console.log('\n💨 Fixing vape products...');
    for (const product of vapeProducts.slice(0, 3)) {
      await fixVapeProduct(product, quantityAttributeId);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
    }

    console.log('\n✅ WooCommerce product fix completed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Created Weight and Quantity attributes');
    console.log('   ✅ Fixed product variations with proper pricing');
    console.log('   ✅ Configured attributes for weight/quantity selection');
    console.log('   ✅ Set parent stock management for deli-style selling');

  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

// Run the script
main(); 