<?php
/**
 * Addify Tax Debug and Assignment Script
 * 
 * This script helps debug and assign WooCommerce tax rates to Addify locations
 * Place this file in your WordPress root and run it to check/fix tax assignments
 */

// Load WordPress
require_once('wp-load.php');

// Check if user is admin
if (!current_user_can('manage_options')) {
    die('Access denied. You must be an administrator to run this script.');
}

echo "<h1>Addify Tax Debug & Assignment Tool</h1>";

// Check if Addify plugin is active
if (!is_plugin_active('addify.modified/class-addify-multi-inventory-management.php')) {
    echo "<p style='color:red;'>❌ Addify Multi Inventory plugin is not active!</p>";
    echo "<p>Attempting to activate...</p>";
    
    $result = activate_plugin('addify.modified/class-addify-multi-inventory-management.php');
    if (is_wp_error($result)) {
        echo "<p style='color:red;'>Failed to activate: " . $result->get_error_message() . "</p>";
    } else {
        echo "<p style='color:green;'>✅ Plugin activated successfully!</p>";
    }
}

// Check if tax integration class exists
echo "<h2>1. Tax Integration Class Status</h2>";
if (class_exists('Addify_MLI_Woo_Tax_Integration')) {
    echo "<p style='color:green;'>✅ Tax integration class is loaded</p>";
} else {
    echo "<p style='color:red;'>❌ Tax integration class NOT loaded</p>";
    
    // Try to load it manually
    $integration_file = WP_PLUGIN_DIR . '/addify.modified/includes/admin/class-addify-mli-woo-tax-integration.php';
    if (file_exists($integration_file)) {
        include_once $integration_file;
        echo "<p>Attempted to load class manually...</p>";
        if (class_exists('Addify_MLI_Woo_Tax_Integration')) {
            echo "<p style='color:green;'>✅ Class loaded successfully!</p>";
        }
    }
}

// Get all locations
echo "<h2>2. Locations and Tax Assignments</h2>";
$locations = get_terms(array(
    'taxonomy' => 'mli_location',
    'hide_empty' => false,
));

if (empty($locations)) {
    echo "<p style='color:red;'>No locations found!</p>";
} else {
    foreach ($locations as $location) {
        echo "<div style='border:1px solid #ccc; padding:10px; margin:10px 0;'>";
        echo "<h3>📍 {$location->name} (ID: {$location->term_id})</h3>";
        
        // Get assigned tax rates
        $assigned_rates = get_term_meta($location->term_id, 'af_mli_woo_tax_rates', true);
        
        if (is_array($assigned_rates) && !empty($assigned_rates)) {
            echo "<p style='color:green;'>✅ Has " . count($assigned_rates) . " tax rates assigned</p>";
            echo "<p>Rate IDs: " . implode(', ', $assigned_rates) . "</p>";
            
            // Get tax details
            if (class_exists('Addify_MLI_Woo_Tax_Integration')) {
                $tax_data = Addify_MLI_Woo_Tax_Integration::get_location_tax_rates($location->term_id);
                if (!empty($tax_data['tax_rates'])) {
                    echo "<h4>Tax Rate Details:</h4>";
                    echo "<ul>";
                    foreach ($tax_data['tax_rates'] as $rate) {
                        echo "<li>{$rate['name']}: {$rate['rate']}%";
                        if ($rate['compound'] === 'yes') echo " (Compound)";
                        echo "</li>";
                    }
                    echo "</ul>";
                    echo "<p><strong>Total Rate: {$tax_data['total_rate']}%</strong></p>";
                }
            }
        } else {
            echo "<p style='color:orange;'>⚠️ No tax rates assigned</p>";
        }
        
        echo "</div>";
    }
}

// Get all WooCommerce tax rates
echo "<h2>3. Available WooCommerce Tax Rates</h2>";
global $wpdb;
$tax_rates = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}woocommerce_tax_rates ORDER BY tax_rate_order");

if (empty($tax_rates)) {
    echo "<p style='color:red;'>No WooCommerce tax rates found!</p>";
    echo "<p><a href='" . admin_url('admin.php?page=wc-settings&tab=tax') . "'>Configure tax rates in WooCommerce</a></p>";
} else {
    echo "<table border='1' cellpadding='5' style='border-collapse:collapse;'>";
    echo "<tr><th>ID</th><th>Name</th><th>Rate</th><th>Country</th><th>State</th><th>Class</th></tr>";
    foreach ($tax_rates as $rate) {
        echo "<tr>";
        echo "<td>{$rate->tax_rate_id}</td>";
        echo "<td>{$rate->tax_rate_name}</td>";
        echo "<td>{$rate->tax_rate}%</td>";
        echo "<td>{$rate->tax_rate_country}</td>";
        echo "<td>{$rate->tax_rate_state}</td>";
        echo "<td>" . ($rate->tax_rate_class ?: 'Standard') . "</td>";
        echo "</tr>";
    }
    echo "</table>";
}

// Quick assignment form
echo "<h2>4. Quick Tax Assignment</h2>";
if (!empty($locations) && !empty($tax_rates)) {
    ?>
    <form method="POST" action="">
        <p>
            <label>Select Location: 
                <select name="location_id">
                    <?php foreach ($locations as $location) : ?>
                        <option value="<?php echo $location->term_id; ?>"><?php echo $location->name; ?></option>
                    <?php endforeach; ?>
                </select>
            </label>
        </p>
        <p>
            <label>Select Tax Rates:<br>
                <?php foreach ($tax_rates as $rate) : ?>
                    <label style="display:block; margin:5px 0;">
                        <input type="checkbox" name="tax_rates[]" value="<?php echo $rate->tax_rate_id; ?>">
                        <?php echo $rate->tax_rate_name; ?> (<?php echo $rate->tax_rate; ?>%)
                    </label>
                <?php endforeach; ?>
            </label>
        </p>
        <p>
            <input type="submit" name="assign_taxes" value="Assign Tax Rates" class="button button-primary">
        </p>
    </form>
    <?php
    
    // Handle form submission
    if (isset($_POST['assign_taxes']) && isset($_POST['location_id'])) {
        $location_id = intval($_POST['location_id']);
        $tax_rates = isset($_POST['tax_rates']) ? array_map('intval', $_POST['tax_rates']) : array();
        
        update_term_meta($location_id, 'af_mli_woo_tax_rates', $tax_rates);
        
        echo "<p style='color:green; font-weight:bold;'>✅ Tax rates assigned successfully!</p>";
        echo "<script>setTimeout(function() { window.location.reload(); }, 2000);</script>";
    }
}

// Test API endpoint
echo "<h2>5. Test REST API Endpoint</h2>";
$test_location_id = !empty($locations) ? $locations[0]->term_id : 32;
$api_url = get_site_url() . "/wp-json/wc/v3/addify_headless_inventory/location/{$test_location_id}/tax-rates";
echo "<p>Test URL: <code>{$api_url}</code></p>";
echo "<p><button onclick='testApi()'>Test API</button></p>";
echo "<div id='api-result'></div>";

?>
<script>
function testApi() {
    const url = '<?php echo $api_url; ?>';
    const auth = btoa('ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5:cs_38194e74c7ddc5d72b6c32c70485728e7e529678');
    
    fetch(url, {
        headers: {
            'Authorization': 'Basic ' + auth
        }
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('api-result').innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
    })
    .catch(error => {
        document.getElementById('api-result').innerHTML = '<p style="color:red;">Error: ' + error + '</p>';
    });
}
</script> 