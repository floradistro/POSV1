<?php
/**
 * Quick diagnostic script to check tax data for location 32
 * Upload this to your WordPress root and run it
 */

require_once('wp-load.php');

echo "<h2>Checking Tax Data for Location 32 (Blowing Rock)</h2>";

// 1. Check the raw meta data
$location_id = 32;
$raw_meta = get_term_meta($location_id, 'af_mli_woo_tax_rates', true);
echo "<h3>1. Raw Meta Data:</h3>";
echo "<pre>";
var_dump($raw_meta);
echo "</pre>";

// 2. Check if the tax integration class exists
echo "<h3>2. Tax Integration Class:</h3>";
if (class_exists('Addify_MLI_Woo_Tax_Integration')) {
    echo "✅ Class exists<br>";
    
    // Try to get tax rates using the class method
    $tax_data = Addify_MLI_Woo_Tax_Integration::get_location_tax_rates($location_id);
    echo "<h4>Tax data from class:</h4>";
    echo "<pre>";
    print_r($tax_data);
    echo "</pre>";
} else {
    echo "❌ Class does NOT exist<br>";
}

// 3. Check the actual WooCommerce tax rates table
echo "<h3>3. WooCommerce Tax Rates (First 10):</h3>";
global $wpdb;
$tax_rates = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}woocommerce_tax_rates LIMIT 10");
echo "<pre>";
print_r($tax_rates);
echo "</pre>";

// 4. Check if specific tax rate ID exists (from your screenshot it looks like ID might be related to the checkbox)
echo "<h3>4. Checking Specific Tax Rate IDs:</h3>";
if (is_array($raw_meta) && !empty($raw_meta)) {
    foreach ($raw_meta as $rate_id) {
        $rate = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}woocommerce_tax_rates WHERE tax_rate_id = %d",
            $rate_id
        ));
        echo "Rate ID $rate_id: ";
        if ($rate) {
            echo $rate->tax_rate_name . " (" . $rate->tax_rate . "%)<br>";
        } else {
            echo "NOT FOUND in database<br>";
        }
    }
}

// 5. Check all term meta for this location
echo "<h3>5. All Term Meta for Location 32:</h3>";
$all_meta = get_term_meta($location_id);
echo "<pre>";
print_r($all_meta);
echo "</pre>"; 