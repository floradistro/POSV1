<?php
/**
 * Clear old custom tax data and verify WooCommerce integration
 * Upload to WordPress root and access via browser
 */

require_once('wp-load.php');

// Must be admin
if (!current_user_can('manage_options')) {
    die('Access denied');
}

echo "<h1>Tax Data Cleanup & Verification</h1>";

// Location to check
$location_id = 32; // Blowing Rock

echo "<h2>Step 1: Check Current Data</h2>";

// Check old custom tax data
$old_tax_data = get_term_meta($location_id, 'af_mli_tax_rates', true);
echo "<h3>Old Custom Tax Data (af_mli_tax_rates):</h3>";
echo "<pre>";
if ($old_tax_data) {
    print_r($old_tax_data);
    echo "\n⚠️  OLD DATA EXISTS - This is causing the issue!";
} else {
    echo "✅ No old data found";
}
echo "</pre>";

// Check new WooCommerce tax data
$woo_tax_ids = get_term_meta($location_id, 'af_mli_woo_tax_rates', true);
echo "<h3>New WooCommerce Tax IDs (af_mli_woo_tax_rates):</h3>";
echo "<pre>";
if ($woo_tax_ids) {
    print_r($woo_tax_ids);
    echo "\n✅ WooCommerce tax rates are assigned";
} else {
    echo "❌ No WooCommerce tax rates assigned";
}
echo "</pre>";

echo "<h2>Step 2: Clear Old Data</h2>";

if ($old_tax_data) {
    // Clear the old custom tax data
    delete_term_meta($location_id, 'af_mli_tax_rates');
    echo "<p>✅ Old custom tax data has been DELETED!</p>";
} else {
    echo "<p>No old data to clear.</p>";
}

echo "<h2>Step 3: Test New Integration</h2>";

// Test if the integration class exists
if (class_exists('Addify_MLI_Woo_Tax_Integration')) {
    echo "<p>✅ WooCommerce Tax Integration class is loaded</p>";
    
    // Get tax data using the new integration
    $tax_data = Addify_MLI_Woo_Tax_Integration::get_location_tax_rates($location_id);
    
    echo "<h3>Tax data from WooCommerce Integration:</h3>";
    echo "<pre>";
    print_r($tax_data);
    echo "</pre>";
    
    if (!empty($tax_data['tax_rates'])) {
        echo "<p>✅ SUCCESS! WooCommerce tax rates are working!</p>";
    } else {
        echo "<p>⚠️  No tax rates returned. Make sure you've assigned WooCommerce tax rates to this location.</p>";
    }
} else {
    echo "<p>❌ WooCommerce Tax Integration class NOT found - Plugin may not be properly activated</p>";
}

echo "<h2>Step 4: Clear All Caches</h2>";
echo "<p>After running this script, please:</p>";
echo "<ol>";
echo "<li>Clear any WordPress object cache (Redis/Memcached)</li>";
echo "<li>Clear PHP OpCache if enabled</li>";
echo "<li>Clear CloudFlare or CDN cache</li>";
echo "<li>Test the POS again</li>";
echo "</ol>";

// Also clear for all other locations that might have old data
$all_locations = get_terms(array(
    'taxonomy' => 'mli_location',
    'hide_empty' => false,
));

if ($all_locations && !is_wp_error($all_locations)) {
    echo "<h2>Step 5: Clean All Locations</h2>";
    echo "<p>Cleaning old tax data from all locations...</p>";
    $cleaned = 0;
    foreach ($all_locations as $location) {
        if (get_term_meta($location->term_id, 'af_mli_tax_rates', true)) {
            delete_term_meta($location->term_id, 'af_mli_tax_rates');
            $cleaned++;
            echo "- Cleaned: {$location->name}<br>";
        }
    }
    echo "<p>✅ Cleaned $cleaned locations</p>";
}

echo "<hr>";
echo "<p><strong>DELETE THIS FILE after running it for security!</strong></p>"; 