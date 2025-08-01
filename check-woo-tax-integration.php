<?php
/**
 * Test script to verify WooCommerce tax integration
 * Upload this to your WordPress root and run it
 */

// Load WordPress
require_once('wp-load.php');

echo "<h2>WooCommerce Tax Integration Check</h2>";

// Check if the integration class exists
if (class_exists('Addify_MLI_Woo_Tax_Integration')) {
    echo "✅ Addify_MLI_Woo_Tax_Integration class is loaded<br><br>";
    
    // Test getting tax rates for location 32
    $location_id = 32;
    $tax_data = Addify_MLI_Woo_Tax_Integration::get_location_tax_rates($location_id);
    
    echo "<h3>Tax data for Blowing Rock (ID: 32):</h3>";
    echo "<pre>";
    print_r($tax_data);
    echo "</pre>";
    
    // Check what's stored in term meta
    echo "<h3>Raw term meta for location 32:</h3>";
    $assigned_rates = get_term_meta($location_id, 'af_mli_woo_tax_rates', true);
    echo "<pre>";
    print_r($assigned_rates);
    echo "</pre>";
    
    // Check WooCommerce tax rates
    global $wpdb;
    echo "<h3>Available WooCommerce tax rates:</h3>";
    $tax_rates = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}woocommerce_tax_rates ORDER BY tax_rate_id");
    echo "<pre>";
    print_r($tax_rates);
    echo "</pre>";
    
} else {
    echo "❌ Addify_MLI_Woo_Tax_Integration class NOT found<br>";
    echo "The modified plugin may not be active or the file isn't included.<br><br>";
    
    // Check if the file exists
    $plugin_dir = WP_PLUGIN_DIR . '/addify.modified/';
    $integration_file = $plugin_dir . 'includes/admin/class-addify-mli-woo-tax-integration.php';
    
    if (file_exists($integration_file)) {
        echo "✅ Integration file exists at: " . $integration_file . "<br>";
    } else {
        echo "❌ Integration file NOT found at: " . $integration_file . "<br>";
    }
    
    // Check if plugin is active
    if (is_plugin_active('addify.modified/class-addify-multi-inventory-management.php')) {
        echo "✅ Addify plugin is active<br>";
    } else {
        echo "❌ Addify plugin is NOT active<br>";
    }
} 