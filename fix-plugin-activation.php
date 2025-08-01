<?php
/**
 * Fix plugin activation and check tax integration
 * Upload to WordPress root and run
 */

require_once('wp-admin/includes/plugin.php');
require_once('wp-load.php');

// Must be admin
if (!current_user_can('manage_options')) {
    die('Access denied');
}

echo "<h1>Plugin Activation Fix</h1>";

$plugin = 'addify.modified/class-addify-multi-inventory-management.php';

echo "<h2>Step 1: Deactivate Plugin</h2>";
deactivate_plugins($plugin);
echo "<p>✅ Plugin deactivated</p>";

echo "<h2>Step 2: Clear cache</h2>";
if (function_exists('wp_cache_flush')) {
    wp_cache_flush();
    echo "<p>✅ Object cache cleared</p>";
}

echo "<h2>Step 3: Reactivate Plugin</h2>";
$result = activate_plugin($plugin);
if (is_wp_error($result)) {
    echo "<p>❌ Error: " . $result->get_error_message() . "</p>";
} else {
    echo "<p>✅ Plugin activated successfully</p>";
}

echo "<h2>Step 4: Force include the integration class</h2>";
$integration_file = WP_PLUGIN_DIR . '/addify.modified/includes/admin/class-addify-mli-woo-tax-integration.php';
if (file_exists($integration_file)) {
    require_once($integration_file);
    echo "<p>✅ Integration file exists and loaded</p>";
} else {
    echo "<p>❌ Integration file NOT FOUND at: $integration_file</p>";
}

echo "<h2>Step 5: Check if class exists now</h2>";
if (class_exists('Addify_MLI_Woo_Tax_Integration')) {
    echo "<p>✅ SUCCESS! WooCommerce Tax Integration class is now loaded</p>";
    
    // Test it
    $tax_data = Addify_MLI_Woo_Tax_Integration::get_location_tax_rates(32);
    echo "<h3>Tax data for Blowing Rock:</h3>";
    echo "<pre>";
    print_r($tax_data);
    echo "</pre>";
} else {
    echo "<p>❌ Class still not found</p>";
}

echo "<hr>";
echo "<p><strong>DELETE THIS FILE after running!</strong></p>"; 