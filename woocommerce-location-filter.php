<?php
/**
 * Plugin Name: WooCommerce Location-Based Product Filter
 * Description: Adds location-based filtering to WooCommerce REST API for multi-inventory
 * Version: 1.0
 * Author: Flora Distro Development Team
 */

// Add custom query parameter support for location filtering
add_filter('woocommerce_rest_product_object_query', 'flora_filter_products_by_location', 10, 2);

function flora_filter_products_by_location($args, $request) {
    // Check if location_id parameter is provided
    if (!isset($request['location_id'])) {
        return $args;
    }
    
    $location_id = intval($request['location_id']);
    
    // Map location IDs to location names (adjust these based on your actual locations)
    $location_names = array(
        30 => 'Charlotte Monroe',
        31 => 'Salisbury',
        32 => 'Charlotte',
        33 => 'Charlotte CBD',
        34 => 'Charlotte Warehouse'
    );
    
    if (!isset($location_names[$location_id])) {
        return $args;
    }
    
    $location_name = $location_names[$location_id];
    $location_key = strtolower(str_replace(' ', '_', $location_name));
    
    // Add meta query to filter products with inventory at this location
    $meta_query = array(
        'relation' => 'OR',
        array(
            'key' => 'af_mli_has_' . $location_key . '_inventory',
            'value' => 'yes',
            'compare' => '='
        ),
        array(
            'key' => 'af_mli_inventory_list',
            'value' => $location_name,
            'compare' => 'LIKE'
        )
    );
    
    if (isset($args['meta_query'])) {
        $args['meta_query']['relation'] = 'AND';
        $args['meta_query'][] = $meta_query;
    } else {
        $args['meta_query'] = $meta_query;
    }
    
    return $args;
}

// Add location_stock to product response
add_filter('woocommerce_rest_prepare_product_object', 'flora_add_location_stock_to_response', 10, 3);

function flora_add_location_stock_to_response($response, $product, $request) {
    if (!isset($request['location_id'])) {
        return $response;
    }
    
    $location_id = intval($request['location_id']);
    
    // Get location-specific stock from meta
    $location_stock_meta = get_post_meta($product->get_id(), 'af_mli_location_stock_' . $location_id, true);
    $location_stock = $location_stock_meta ? intval($location_stock_meta) : $product->get_stock_quantity();
    
    // Add location stock to response
    $response->data['location_stock'] = $location_stock;
    $response->data['available_at_location'] = true;
    
    // Override stock fields with location-specific values
    $response->data['stock_quantity'] = $location_stock;
    $response->data['stock_status'] = $location_stock > 0 ? 'instock' : 'outofstock';
    
    return $response;
}

// Register location_id as a valid REST API parameter
add_filter('woocommerce_rest_product_collection_params', 'flora_add_location_param', 10, 1);

function flora_add_location_param($params) {
    $params['location_id'] = array(
        'description' => 'Filter products by Addify multi-location inventory location ID',
        'type' => 'integer',
        'sanitize_callback' => 'absint',
        'validate_callback' => 'rest_validate_request_arg',
    );
    
    return $params;
} 