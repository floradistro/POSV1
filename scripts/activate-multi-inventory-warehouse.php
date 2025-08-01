<?php
/**
 * Activate Multi-Inventory for All Products and Assign to Warehouse
 * This script enables multi-location inventory and assigns all products to Warehouse location
 */

// WordPress Bootstrap - adjust path as needed
require_once('../../../../wp-config.php');

echo "🏭 ACTIVATING MULTI-INVENTORY FOR ALL PRODUCTS\n";
echo "==============================================\n\n";

// Find the Warehouse location by slug
$warehouse_term = get_term_by('slug', 'clt', 'mli_location');

if (!$warehouse_term || is_wp_error($warehouse_term)) {
    echo "❌ ERROR: Warehouse location with slug 'clt' not found!\n";
    echo "Available locations:\n";
    
    $all_locations = get_terms(array(
        'taxonomy' => 'mli_location',
        'hide_empty' => false
    ));
    
    foreach ($all_locations as $location) {
        echo "  - {$location->name} (slug: {$location->slug}, ID: {$location->term_id})\n";
    }
    exit;
}

echo "✅ Found Warehouse location: {$warehouse_term->name} (ID: {$warehouse_term->term_id}, slug: {$warehouse_term->slug})\n\n";

// Get all published products
$args = array(
    'post_type' => 'product',
    'post_status' => 'publish',
    'posts_per_page' => -1,
    'fields' => 'ids'
);

$product_ids = get_posts($args);
$total_products = count($product_ids);

echo "📦 Found {$total_products} products to process\n\n";

$success_count = 0;
$error_count = 0;
$processed = 0;

foreach ($product_ids as $product_id) {
    $processed++;
    
    // Get product object
    $product = wc_get_product($product_id);
    if (!$product) {
        echo "❌ Product ID {$product_id}: Not found\n";
        $error_count++;
        continue;
    }
    
    echo "📦 [{$processed}/{$total_products}] Processing: {$product->get_name()} (ID: {$product_id})\n";
    
    try {
        // STEP 1: Enable stock management
        $product->set_manage_stock(true);
        
        // STEP 2: Set stock status
        $product->set_stock_status('instock');
        
        // STEP 3: Set default stock quantity if not set
        $current_stock = $product->get_stock_quantity();
        if (empty($current_stock) || $current_stock <= 0) {
            $product->set_stock_quantity(25); // Default stock
        }
        
        // STEP 4: Enable multi-inventory via meta
        update_post_meta($product_id, '_use_multi_inventory', 'yes');
        update_post_meta($product_id, 'use_multi_inventory', 'yes');
        
        // STEP 5: Assign to Warehouse location via taxonomy
        $taxonomy_result = wp_set_post_terms($product_id, array($warehouse_term->term_id), 'mli_location', false);
        
        if (is_wp_error($taxonomy_result)) {
            throw new Exception("Failed to assign taxonomy: " . $taxonomy_result->get_error_message());
        }
        
        // STEP 6: Set location-specific stock quantity
        $stock_qty = $product->get_stock_quantity() ?: 25;
        update_post_meta($product_id, "af_mli_location_stock_{$warehouse_term->term_id}", $stock_qty);
        update_post_meta($product_id, "af_mli_location_price_{$warehouse_term->term_id}", $product->get_regular_price());
        
        // STEP 7: Save the product
        $product->save();
        
        // STEP 8: Verify assignment
        $assigned_terms = wp_get_post_terms($product_id, 'mli_location');
        if (!is_wp_error($assigned_terms) && !empty($assigned_terms)) {
            echo "   ✅ Success: Assigned to {$warehouse_term->name} with {$stock_qty} units\n";
            $success_count++;
        } else {
            throw new Exception("Assignment verification failed");
        }
        
    } catch (Exception $e) {
        echo "   ❌ Error: " . $e->getMessage() . "\n";
        $error_count++;
    }
    
    // Progress indicator
    if ($processed % 50 == 0) {
        echo "\n📊 Progress: {$processed}/{$total_products} processed ({$success_count} success, {$error_count} errors)\n\n";
    }
    
    // Small delay to prevent overwhelming the system
    usleep(100000); // 0.1 second delay
}

// Clear caches
echo "\n🧹 Clearing caches...\n";
wp_cache_flush();
wc_delete_product_transients();
clean_term_cache(array($warehouse_term->term_id), 'mli_location');

// Update term counts
wp_update_term_count_now(array($warehouse_term->term_id), 'mli_location');

echo "\n📊 FINAL SUMMARY:\n";
echo "==================\n";
echo "✅ Successfully processed: {$success_count} products\n";
echo "❌ Failed to process: {$error_count} products\n";
echo "📦 Total products: {$total_products}\n";
echo "🏭 Assigned to: {$warehouse_term->name} (slug: {$warehouse_term->slug})\n\n";

if ($success_count > 0) {
    echo "🎉 SUCCESS! Multi-inventory has been activated for {$success_count} products!\n\n";
    echo "📋 VERIFICATION STEPS:\n";
    echo "1. Go to WooCommerce → Multi Locations → Manage Stock\n";
    echo "2. You should now see products assigned to '{$warehouse_term->name}' instead of 'Main Inventory'\n";
    echo "3. Check a few product edit pages - they should show multi-location inventory options\n";
    echo "4. Your POS should now see warehouse inventory\n\n";
    
    echo "🔍 NEXT STEPS:\n";
    echo "• Test your POS system to verify it can see warehouse inventory\n";
    echo "• Adjust stock quantities per location as needed\n";
    echo "• Create additional locations (stores) and assign products as needed\n";
} else {
    echo "❌ No products were successfully processed. Check the errors above.\n";
}

echo "\n✨ Script completed!\n";
?> 