<?php
/**
 * Plugin Name: WooCommerce Order Source & Analytics Tracker
 * Description: Comprehensive order tracking with source, location, financial analytics, and reporting for WooCommerce
 * Version: 2.0.0
 * Author: Flora Cannabis
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class WC_Order_Source_Tracker {
    
    public function __construct() {
        add_action('init', array($this, 'init'));
    }
    
    public function init() {
        // Add custom column to orders list
        add_filter('manage_woocommerce_page_wc-orders_columns', array($this, 'add_order_source_column'));
        add_filter('manage_shop_order_posts_columns', array($this, 'add_order_source_column'));
        
        // Populate the custom column
        add_action('manage_woocommerce_page_wc-orders_custom_column', array($this, 'populate_order_source_column'), 10, 2);
        add_action('manage_shop_order_posts_custom_column', array($this, 'populate_order_source_column'), 10, 2);
        
        // Add order source info to order details page
        add_action('woocommerce_admin_order_data_after_order_details', array($this, 'display_order_source_details'));
        
        // Make the column sortable
        add_filter('manage_edit-shop_order_sortable_columns', array($this, 'make_order_source_column_sortable'));
    }
    
    /**
     * Add Order Source column to orders list
     */
    public function add_order_source_column($columns) {
        // Insert the new column after the order status column
        $new_columns = array();
        foreach ($columns as $key => $column) {
            $new_columns[$key] = $column;
            if ($key === 'order_status') {
                $new_columns['order_source'] = __('Source', 'woocommerce');
            }
        }
        return $new_columns;
    }
    
    /**
     * Populate the Order Source column
     */
    public function populate_order_source_column($column, $order_id) {
        if ($column !== 'order_source') {
            return;
        }
        
        $order = wc_get_order($order_id);
        if (!$order) {
            echo '<span style="color: #999;">Unknown</span>';
            return;
        }
        
        // Get order source information
        $platform = $order->get_meta('_order_source_platform');
        $location = $order->get_meta('_order_source_location');
        $details = $order->get_meta('_order_source_details');
        $created_via = $order->get_created_via();
        
        // Determine the display text and styling
        $source_text = 'Unknown';
        $source_color = '#999';
        $source_icon = '❓';
        
        if ($created_via === 'pos' || $platform === 'POS System') {
            $source_text = $details ?: ($location ? "POS {$location}" : 'POS System');
            $source_color = '#2271b1';
            $source_icon = '🏪';
        } elseif ($created_via === 'checkout' || $created_via === 'woocommerce') {
            $source_text = 'E-commerce';
            $source_color = '#00a32a';
            $source_icon = '🛒';
        } elseif ($created_via === 'admin') {
            $source_text = 'Admin';
            $source_color = '#d63638';
            $source_icon = '👤';
        } elseif ($platform) {
            $source_text = $platform;
            $source_color = '#2271b1';
            $source_icon = '📱';
        }
        
        echo sprintf(
            '<span style="color: %s; font-weight: 500;">%s %s</span>',
            esc_attr($source_color),
            $source_icon,
            esc_html($source_text)
        );
    }
    
    /**
     * Display detailed order source information on order details page
     */
    public function display_order_source_details($order) {
        $platform = $order->get_meta('_order_source_platform');
        $location = $order->get_meta('_order_source_location');
        $device = $order->get_meta('_order_source_device');
        $terminal_id = $order->get_meta('_pos_terminal_id');
        $source_timestamp = $order->get_meta('_order_source_timestamp');
        $created_via = $order->get_created_via();
        
        if (!$platform && !$location && !$created_via) {
            return;
        }
        ?>
        <div class="order-source-details" style="margin-top: 20px;">
            <h3><?php _e('Order Source Information', 'woocommerce'); ?></h3>
            <table class="wp-list-table widefat fixed striped">
                <tbody>
                    <?php if ($created_via): ?>
                    <tr>
                        <td><strong><?php _e('Created Via:', 'woocommerce'); ?></strong></td>
                        <td><?php echo esc_html(ucfirst($created_via)); ?></td>
                    </tr>
                    <?php endif; ?>
                    
                    <?php if ($platform): ?>
                    <tr>
                        <td><strong><?php _e('Platform:', 'woocommerce'); ?></strong></td>
                        <td><?php echo esc_html($platform); ?></td>
                    </tr>
                    <?php endif; ?>
                    
                    <?php if ($location): ?>
                    <tr>
                        <td><strong><?php _e('Location:', 'woocommerce'); ?></strong></td>
                        <td><?php echo esc_html($location); ?></td>
                    </tr>
                    <?php endif; ?>
                    
                    <?php if ($device): ?>
                    <tr>
                        <td><strong><?php _e('Device:', 'woocommerce'); ?></strong></td>
                        <td><?php echo esc_html($device); ?></td>
                    </tr>
                    <?php endif; ?>
                    
                    <?php if ($terminal_id): ?>
                    <tr>
                        <td><strong><?php _e('Terminal ID:', 'woocommerce'); ?></strong></td>
                        <td><?php echo esc_html($terminal_id); ?></td>
                    </tr>
                    <?php endif; ?>
                    
                    <?php if ($source_timestamp): ?>
                    <tr>
                        <td><strong><?php _e('Source Timestamp:', 'woocommerce'); ?></strong></td>
                        <td><?php echo esc_html(date('Y-m-d H:i:s', strtotime($source_timestamp))); ?></td>
                    </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
        <style>
        .order-source-details table {
            max-width: 500px;
        }
        .order-source-details td:first-child {
            width: 150px;
            font-weight: 500;
        }
        </style>
        <?php
    }
    
    /**
     * Make the order source column sortable
     */
    public function make_order_source_column_sortable($columns) {
        $columns['order_source'] = 'order_source';
        return $columns;
    }
}

// Initialize the plugin
new WC_Order_Source_Tracker();

/**
 * Additional financial tracking meta fields
 */
class WC_Order_Financial_Tracker {
    
    public function __construct() {
        // Add financial tracking when order is created
        add_action('woocommerce_checkout_order_created', array($this, 'add_financial_tracking'), 10, 1);
        add_action('woocommerce_new_order', array($this, 'add_financial_tracking'), 10, 1);
        
        // Track refunds and adjustments
        add_action('woocommerce_order_refunded', array($this, 'track_refund'), 10, 2);
        
        // Add financial summary to order details
        add_action('woocommerce_admin_order_data_after_billing_address', array($this, 'display_financial_summary'));
        
        // Track payment method changes
        add_action('woocommerce_order_status_changed', array($this, 'track_status_changes'), 10, 4);
    }
    
    /**
     * Add comprehensive financial tracking to orders
     */
    public function add_financial_tracking($order) {
        if (!$order) return;
        
        // Calculate financial metrics
        $subtotal = $order->get_subtotal();
        $total = $order->get_total();
        $tax = $order->get_total_tax();
        $shipping = $order->get_shipping_total();
        $discount = $order->get_discount_total();
        $fees = $order->get_total_fees();
        
        // Calculate margins (you can adjust these percentages based on your business)
        $cost_of_goods = $subtotal * 0.4; // Assume 40% COGS
        $gross_profit = $subtotal - $cost_of_goods;
        $gross_margin = $subtotal > 0 ? ($gross_profit / $subtotal) * 100 : 0;
        
        // Store financial data
        $order->update_meta_data('_financial_subtotal', $subtotal);
        $order->update_meta_data('_financial_total', $total);
        $order->update_meta_data('_financial_tax', $tax);
        $order->update_meta_data('_financial_shipping', $shipping);
        $order->update_meta_data('_financial_discount', $discount);
        $order->update_meta_data('_financial_fees', $fees);
        $order->update_meta_data('_financial_cost_of_goods', $cost_of_goods);
        $order->update_meta_data('_financial_gross_profit', $gross_profit);
        $order->update_meta_data('_financial_gross_margin', $gross_margin);
        
        // Track payment processing fees (estimates)
        $payment_method = $order->get_payment_method();
        $processing_fee = 0;
        if ($payment_method === 'card' || $payment_method === 'stripe') {
            $processing_fee = $total * 0.029 + 0.30; // 2.9% + $0.30
        }
        $order->update_meta_data('_financial_processing_fee', $processing_fee);
        $order->update_meta_data('_financial_net_revenue', $total - $processing_fee);
        
        // Time-based tracking
        $order->update_meta_data('_financial_hour_of_day', date('H'));
        $order->update_meta_data('_financial_day_of_week', date('N'));
        $order->update_meta_data('_financial_week_of_year', date('W'));
        $order->update_meta_data('_financial_month', date('n'));
        $order->update_meta_data('_financial_quarter', ceil(date('n') / 3));
        $order->update_meta_data('_financial_year', date('Y'));
        
        // Employee/cashier tracking (if available)
        $current_user = wp_get_current_user();
        if ($current_user->ID > 0) {
            $order->update_meta_data('_cashier_id', $current_user->ID);
            $order->update_meta_data('_cashier_name', $current_user->display_name);
            $order->update_meta_data('_cashier_email', $current_user->user_email);
        }
        
        $order->save();
    }
    
    /**
     * Track refunds
     */
    public function track_refund($order_id, $refund_id) {
        $order = wc_get_order($order_id);
        $refund = wc_get_order($refund_id);
        
        if ($order && $refund) {
            $refund_amount = $refund->get_total();
            $refund_reason = $refund->get_reason();
            
            // Update order meta with refund tracking
            $total_refunded = $order->get_total_refunded();
            $order->update_meta_data('_financial_total_refunded', $total_refunded);
            $order->update_meta_data('_financial_last_refund_date', current_time('mysql'));
            $order->update_meta_data('_financial_last_refund_amount', $refund_amount);
            $order->update_meta_data('_financial_last_refund_reason', $refund_reason);
            
            // Track refund in separate meta for analytics
            $refund_count = (int) $order->get_meta('_financial_refund_count') + 1;
            $order->update_meta_data('_financial_refund_count', $refund_count);
            
            $order->save();
        }
    }
    
    /**
     * Track status changes for financial reporting
     */
    public function track_status_changes($order_id, $old_status, $new_status, $order) {
        // Track cancellations
        if ($new_status === 'cancelled') {
            $order->update_meta_data('_financial_cancelled_date', current_time('mysql'));
            $order->update_meta_data('_financial_cancelled_from_status', $old_status);
        }
        
        // Track completions
        if ($new_status === 'completed' && $old_status !== 'completed') {
            $order->update_meta_data('_financial_completed_date', current_time('mysql'));
            
            // Calculate fulfillment time
            $created_date = $order->get_date_created();
            $completed_date = new DateTime(current_time('mysql'));
            $fulfillment_time = $completed_date->diff($created_date);
            $order->update_meta_data('_financial_fulfillment_hours', $fulfillment_time->h + ($fulfillment_time->days * 24));
        }
        
        $order->save();
    }
    
    /**
     * Display financial summary in order details
     */
    public function display_financial_summary($order) {
        $gross_profit = $order->get_meta('_financial_gross_profit');
        $gross_margin = $order->get_meta('_financial_gross_margin');
        $processing_fee = $order->get_meta('_financial_processing_fee');
        $net_revenue = $order->get_meta('_financial_net_revenue');
        ?>
        <div class="order-financial-summary" style="margin-top: 20px;">
            <h3><?php _e('Financial Summary', 'woocommerce'); ?></h3>
            <table class="wp-list-table widefat fixed striped">
                <tbody>
                    <tr>
                        <td><strong><?php _e('Gross Profit:', 'woocommerce'); ?></strong></td>
                        <td><?php echo wc_price($gross_profit); ?> (<?php echo number_format($gross_margin, 2); ?>%)</td>
                    </tr>
                    <tr>
                        <td><strong><?php _e('Processing Fee:', 'woocommerce'); ?></strong></td>
                        <td><?php echo wc_price($processing_fee); ?></td>
                    </tr>
                    <tr>
                        <td><strong><?php _e('Net Revenue:', 'woocommerce'); ?></strong></td>
                        <td><?php echo wc_price($net_revenue); ?></td>
                    </tr>
                </tbody>
            </table>
        </div>
        <?php
    }
}

// Initialize financial tracking
new WC_Order_Financial_Tracker();

/**
 * Register comprehensive REST API endpoints
 */
add_action('rest_api_init', function() {
    $namespace = 'wc-analytics/v1';
    
    // Update order source endpoint
    register_rest_route('wc/v3', '/orders/(?P<id>\d+)/source', array(
        'methods' => 'POST',
        'callback' => 'update_order_source_info',
        'permission_callback' => function() {
            return current_user_can('manage_woocommerce');
        },
        'args' => array(
            'id' => array(
                'required' => true,
                'validate_callback' => function($param) {
                    return is_numeric($param);
                }
            ),
            'platform' => array(
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field'
            ),
            'location' => array(
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field'
            ),
            'terminal_id' => array(
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field'
            )
        )
    ));
    
    // Analytics endpoints
    register_rest_route($namespace, '/sales/summary', array(
        'methods' => 'GET',
        'callback' => 'get_sales_summary',
        'permission_callback' => function() {
            return current_user_can('view_woocommerce_reports');
        },
        'args' => array(
            'date_from' => array(
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field'
            ),
            'date_to' => array(
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field'
            ),
            'location' => array(
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field'
            ),
            'platform' => array(
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field'
            )
        )
    ));
    
    register_rest_route($namespace, '/sales/by-location', array(
        'methods' => 'GET',
        'callback' => 'get_sales_by_location',
        'permission_callback' => function() {
            return current_user_can('view_woocommerce_reports');
        },
        'args' => array(
            'date_from' => array(
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field'
            ),
            'date_to' => array(
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field'
            )
        )
    ));
    
    register_rest_route($namespace, '/sales/by-hour', array(
        'methods' => 'GET',
        'callback' => 'get_sales_by_hour',
        'permission_callback' => function() {
            return current_user_can('view_woocommerce_reports');
        },
        'args' => array(
            'date' => array(
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field'
            ),
            'location' => array(
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field'
            )
        )
    ));
    
    register_rest_route($namespace, '/sales/by-cashier', array(
        'methods' => 'GET',
        'callback' => 'get_sales_by_cashier',
        'permission_callback' => function() {
            return current_user_can('view_woocommerce_reports');
        },
        'args' => array(
            'date_from' => array(
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field'
            ),
            'date_to' => array(
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field'
            ),
            'location' => array(
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field'
            )
        )
    ));
    
    register_rest_route($namespace, '/products/performance', array(
        'methods' => 'GET',
        'callback' => 'get_product_performance',
        'permission_callback' => function() {
            return current_user_can('view_woocommerce_reports');
        },
        'args' => array(
            'date_from' => array(
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field'
            ),
            'date_to' => array(
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field'
            ),
            'location' => array(
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field'
            ),
            'limit' => array(
                'required' => false,
                'default' => 20,
                'validate_callback' => function($param) {
                    return is_numeric($param);
                }
            )
        )
    ));
    
    register_rest_route($namespace, '/financial/summary', array(
        'methods' => 'GET',
        'callback' => 'get_financial_summary',
        'permission_callback' => function() {
            return current_user_can('view_woocommerce_reports');
        },
        'args' => array(
            'date_from' => array(
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field'
            ),
            'date_to' => array(
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field'
            ),
            'location' => array(
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field'
            )
        )
    ));
    
    register_rest_route($namespace, '/cash/reconciliation', array(
        'methods' => 'GET',
        'callback' => 'get_cash_reconciliation',
        'permission_callback' => function() {
            return current_user_can('view_woocommerce_reports');
        },
        'args' => array(
            'date' => array(
                'required' => false,
                'default' => date('Y-m-d'),
                'sanitize_callback' => 'sanitize_text_field'
            ),
            'location' => array(
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field'
            ),
            'terminal_id' => array(
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field'
            )
        )
    ));
    
    register_rest_route($namespace, '/export/daily-report', array(
        'methods' => 'GET',
        'callback' => 'export_daily_report',
        'permission_callback' => function() {
            return current_user_can('view_woocommerce_reports');
        },
        'args' => array(
            'date' => array(
                'required' => false,
                'default' => date('Y-m-d'),
                'sanitize_callback' => 'sanitize_text_field'
            ),
            'location' => array(
                'required' => false,
                'sanitize_callback' => 'sanitize_text_field'
            ),
            'format' => array(
                'required' => false,
                'default' => 'json',
                'sanitize_callback' => 'sanitize_text_field'
            )
        )
    ));
});

function update_order_source_info($request) {
    $order_id = $request->get_param('id');
    $platform = $request->get_param('platform');
    $location = $request->get_param('location');
    $terminal_id = $request->get_param('terminal_id');
    
    $order = wc_get_order($order_id);
    if (!$order) {
        return new WP_Error('order_not_found', 'Order not found', array('status' => 404));
    }
    
    if ($platform) {
        $order->update_meta_data('_order_source_platform', $platform);
    }
    if ($location) {
        $order->update_meta_data('_order_source_location', $location);
        $order->update_meta_data('_order_source_details', "POS {$location}");
    }
    if ($terminal_id) {
        $order->update_meta_data('_pos_terminal_id', $terminal_id);
    }
    
    $order->save();
    
    return rest_ensure_response(array(
        'success' => true,
        'message' => 'Order source updated successfully',
        'order_id' => $order_id
    ));
}

/**
 * Get sales summary
 */
function get_sales_summary($request) {
    global $wpdb;
    
    $date_from = $request->get_param('date_from') ?: date('Y-m-d', strtotime('-30 days'));
    $date_to = $request->get_param('date_to') ?: date('Y-m-d');
    $location = $request->get_param('location');
    $platform = $request->get_param('platform');
    
    $args = array(
        'type' => 'shop_order',
        'status' => array('wc-completed', 'wc-processing'),
        'date_created' => $date_from . '...' . $date_to,
        'limit' => -1,
    );
    
    if ($location) {
        $args['meta_key'] = '_order_source_location';
        $args['meta_value'] = $location;
    }
    
    $orders = wc_get_orders($args);
    
    $summary = array(
        'total_sales' => 0,
        'total_orders' => 0,
        'total_items' => 0,
        'total_customers' => array(),
        'total_tax' => 0,
        'total_shipping' => 0,
        'total_discount' => 0,
        'gross_profit' => 0,
        'net_revenue' => 0,
        'average_order_value' => 0,
        'refunds' => 0,
        'refund_count' => 0,
    );
    
    foreach ($orders as $order) {
        if ($platform) {
            $order_platform = $order->get_meta('_order_source_platform');
            if ($order_platform !== $platform) continue;
        }
        
        $summary['total_sales'] += $order->get_total();
        $summary['total_orders']++;
        $summary['total_items'] += $order->get_item_count();
        $summary['total_tax'] += $order->get_total_tax();
        $summary['total_shipping'] += $order->get_shipping_total();
        $summary['total_discount'] += $order->get_discount_total();
        
        $gross_profit = $order->get_meta('_financial_gross_profit');
        $net_revenue = $order->get_meta('_financial_net_revenue');
        
        $summary['gross_profit'] += $gross_profit ?: 0;
        $summary['net_revenue'] += $net_revenue ?: 0;
        
        $customer_id = $order->get_customer_id();
        if ($customer_id) {
            $summary['total_customers'][$customer_id] = true;
        }
        
        $summary['refunds'] += $order->get_total_refunded();
        $refund_count = $order->get_meta('_financial_refund_count');
        $summary['refund_count'] += $refund_count ?: 0;
    }
    
    $summary['total_customers'] = count($summary['total_customers']);
    $summary['average_order_value'] = $summary['total_orders'] > 0 ? 
        $summary['total_sales'] / $summary['total_orders'] : 0;
    
    return rest_ensure_response($summary);
}

/**
 * Get sales by location
 */
function get_sales_by_location($request) {
    $date_from = $request->get_param('date_from') ?: date('Y-m-d', strtotime('-30 days'));
    $date_to = $request->get_param('date_to') ?: date('Y-m-d');
    
    $args = array(
        'type' => 'shop_order',
        'status' => array('wc-completed', 'wc-processing'),
        'date_created' => $date_from . '...' . $date_to,
        'limit' => -1,
    );
    
    $orders = wc_get_orders($args);
    $locations = array();
    
    foreach ($orders as $order) {
        $location = $order->get_meta('_order_source_location') ?: 'Unknown';
        
        if (!isset($locations[$location])) {
            $locations[$location] = array(
                'location' => $location,
                'total_sales' => 0,
                'order_count' => 0,
                'average_order_value' => 0,
                'gross_profit' => 0,
                'top_products' => array(),
            );
        }
        
        $locations[$location]['total_sales'] += $order->get_total();
        $locations[$location]['order_count']++;
        $locations[$location]['gross_profit'] += $order->get_meta('_financial_gross_profit') ?: 0;
        
        // Track products
        foreach ($order->get_items() as $item) {
            $product_id = $item->get_product_id();
            $product_name = $item->get_name();
            
            if (!isset($locations[$location]['top_products'][$product_id])) {
                $locations[$location]['top_products'][$product_id] = array(
                    'name' => $product_name,
                    'quantity' => 0,
                    'revenue' => 0,
                );
            }
            
            $locations[$location]['top_products'][$product_id]['quantity'] += $item->get_quantity();
            $locations[$location]['top_products'][$product_id]['revenue'] += $item->get_total();
        }
    }
    
    // Calculate averages and sort products
    foreach ($locations as &$location_data) {
        $location_data['average_order_value'] = $location_data['order_count'] > 0 ?
            $location_data['total_sales'] / $location_data['order_count'] : 0;
        
        // Sort and limit top products
        usort($location_data['top_products'], function($a, $b) {
            return $b['revenue'] - $a['revenue'];
        });
        $location_data['top_products'] = array_slice($location_data['top_products'], 0, 5);
    }
    
    return rest_ensure_response(array_values($locations));
}

/**
 * Get sales by hour
 */
function get_sales_by_hour($request) {
    $date = $request->get_param('date') ?: date('Y-m-d');
    $location = $request->get_param('location');
    
    $args = array(
        'type' => 'shop_order',
        'status' => array('wc-completed', 'wc-processing'),
        'date_created' => $date . '...' . $date,
        'limit' => -1,
    );
    
    if ($location) {
        $args['meta_key'] = '_order_source_location';
        $args['meta_value'] = $location;
    }
    
    $orders = wc_get_orders($args);
    $hourly_sales = array();
    
    // Initialize all hours
    for ($hour = 0; $hour < 24; $hour++) {
        $hourly_sales[$hour] = array(
            'hour' => $hour,
            'hour_label' => sprintf('%02d:00', $hour),
            'total_sales' => 0,
            'order_count' => 0,
            'average_order_value' => 0,
        );
    }
    
    foreach ($orders as $order) {
        $order_hour = (int) $order->get_meta('_financial_hour_of_day');
        
        $hourly_sales[$order_hour]['total_sales'] += $order->get_total();
        $hourly_sales[$order_hour]['order_count']++;
    }
    
    // Calculate averages
    foreach ($hourly_sales as &$hour_data) {
        $hour_data['average_order_value'] = $hour_data['order_count'] > 0 ?
            $hour_data['total_sales'] / $hour_data['order_count'] : 0;
    }
    
    return rest_ensure_response(array_values($hourly_sales));
}

/**
 * Get sales by cashier
 */
function get_sales_by_cashier($request) {
    $date_from = $request->get_param('date_from') ?: date('Y-m-d', strtotime('-7 days'));
    $date_to = $request->get_param('date_to') ?: date('Y-m-d');
    $location = $request->get_param('location');
    
    $args = array(
        'type' => 'shop_order',
        'status' => array('wc-completed', 'wc-processing'),
        'date_created' => $date_from . '...' . $date_to,
        'limit' => -1,
    );
    
    if ($location) {
        $args['meta_key'] = '_order_source_location';
        $args['meta_value'] = $location;
    }
    
    $orders = wc_get_orders($args);
    $cashiers = array();
    
    foreach ($orders as $order) {
        $cashier_id = $order->get_meta('_cashier_id') ?: 0;
        $cashier_name = $order->get_meta('_cashier_name') ?: 'Unknown';
        $cashier_email = $order->get_meta('_cashier_email') ?: '';
        
        $key = $cashier_id ?: $cashier_name;
        
        if (!isset($cashiers[$key])) {
            $cashiers[$key] = array(
                'cashier_id' => $cashier_id,
                'cashier_name' => $cashier_name,
                'cashier_email' => $cashier_email,
                'total_sales' => 0,
                'order_count' => 0,
                'average_order_value' => 0,
                'items_sold' => 0,
                'refunds' => 0,
            );
        }
        
        $cashiers[$key]['total_sales'] += $order->get_total();
        $cashiers[$key]['order_count']++;
        $cashiers[$key]['items_sold'] += $order->get_item_count();
        $cashiers[$key]['refunds'] += $order->get_total_refunded();
    }
    
    // Calculate averages
    foreach ($cashiers as &$cashier_data) {
        $cashier_data['average_order_value'] = $cashier_data['order_count'] > 0 ?
            $cashier_data['total_sales'] / $cashier_data['order_count'] : 0;
    }
    
    // Sort by total sales
    usort($cashiers, function($a, $b) {
        return $b['total_sales'] - $a['total_sales'];
    });
    
    return rest_ensure_response(array_values($cashiers));
}

/**
 * Get product performance
 */
function get_product_performance($request) {
    global $wpdb;
    
    $date_from = $request->get_param('date_from') ?: date('Y-m-d', strtotime('-30 days'));
    $date_to = $request->get_param('date_to') ?: date('Y-m-d');
    $location = $request->get_param('location');
    $limit = $request->get_param('limit');
    
    $args = array(
        'type' => 'shop_order',
        'status' => array('wc-completed', 'wc-processing'),
        'date_created' => $date_from . '...' . $date_to,
        'limit' => -1,
    );
    
    if ($location) {
        $args['meta_key'] = '_order_source_location';
        $args['meta_value'] = $location;
    }
    
    $orders = wc_get_orders($args);
    $products = array();
    
    foreach ($orders as $order) {
        foreach ($order->get_items() as $item) {
            $product_id = $item->get_product_id();
            $product = wc_get_product($product_id);
            
            if (!$product) continue;
            
            if (!isset($products[$product_id])) {
                $products[$product_id] = array(
                    'product_id' => $product_id,
                    'name' => $product->get_name(),
                    'sku' => $product->get_sku(),
                    'category' => wp_get_post_terms($product_id, 'product_cat', array('fields' => 'names')),
                    'quantity_sold' => 0,
                    'total_revenue' => 0,
                    'total_cost' => 0,
                    'gross_profit' => 0,
                    'order_count' => 0,
                    'customers' => array(),
                );
            }
            
            $products[$product_id]['quantity_sold'] += $item->get_quantity();
            $products[$product_id]['total_revenue'] += $item->get_total();
            $products[$product_id]['order_count']++;
            
            // Estimate cost (40% of revenue)
            $products[$product_id]['total_cost'] += $item->get_total() * 0.4;
            $products[$product_id]['gross_profit'] += $item->get_total() * 0.6;
            
            $customer_id = $order->get_customer_id();
            if ($customer_id) {
                $products[$product_id]['customers'][$customer_id] = true;
            }
        }
    }
    
    // Calculate unique customers and sort
    foreach ($products as &$product_data) {
        $product_data['unique_customers'] = count($product_data['customers']);
        unset($product_data['customers']); // Remove customer array from response
        
        $product_data['average_order_value'] = $product_data['order_count'] > 0 ?
            $product_data['total_revenue'] / $product_data['order_count'] : 0;
    }
    
    // Sort by revenue
    usort($products, function($a, $b) {
        return $b['total_revenue'] - $a['total_revenue'];
    });
    
    // Apply limit
    if ($limit) {
        $products = array_slice($products, 0, $limit);
    }
    
    return rest_ensure_response(array_values($products));
}

/**
 * Get financial summary
 */
function get_financial_summary($request) {
    $date_from = $request->get_param('date_from') ?: date('Y-m-d', strtotime('-30 days'));
    $date_to = $request->get_param('date_to') ?: date('Y-m-d');
    $location = $request->get_param('location');
    
    $args = array(
        'type' => 'shop_order',
        'status' => array('wc-completed', 'wc-processing', 'wc-refunded'),
        'date_created' => $date_from . '...' . $date_to,
        'limit' => -1,
    );
    
    if ($location) {
        $args['meta_key'] = '_order_source_location';
        $args['meta_value'] = $location;
    }
    
    $orders = wc_get_orders($args);
    
    $summary = array(
        'revenue' => array(
            'gross_sales' => 0,
            'discounts' => 0,
            'net_sales' => 0,
            'tax' => 0,
            'shipping' => 0,
            'total_revenue' => 0,
        ),
        'costs' => array(
            'cost_of_goods' => 0,
            'processing_fees' => 0,
            'refunds' => 0,
            'total_costs' => 0,
        ),
        'profit' => array(
            'gross_profit' => 0,
            'gross_margin' => 0,
            'net_profit' => 0,
            'net_margin' => 0,
        ),
        'payment_methods' => array(
            'cash' => 0,
            'card' => 0,
            'other' => 0,
        ),
        'order_stats' => array(
            'total_orders' => 0,
            'completed_orders' => 0,
            'refunded_orders' => 0,
            'average_order_value' => 0,
        ),
    );
    
    foreach ($orders as $order) {
        $order_total = $order->get_total();
        $order_status = $order->get_status();
        
        $summary['order_stats']['total_orders']++;
        
        if ($order_status === 'completed' || $order_status === 'processing') {
            $summary['revenue']['gross_sales'] += $order->get_subtotal();
            $summary['revenue']['discounts'] += $order->get_discount_total();
            $summary['revenue']['net_sales'] += $order->get_subtotal() - $order->get_discount_total();
            $summary['revenue']['tax'] += $order->get_total_tax();
            $summary['revenue']['shipping'] += $order->get_shipping_total();
            $summary['revenue']['total_revenue'] += $order_total;
            
            $summary['costs']['cost_of_goods'] += $order->get_meta('_financial_cost_of_goods') ?: ($order->get_subtotal() * 0.4);
            $summary['costs']['processing_fees'] += $order->get_meta('_financial_processing_fee') ?: 0;
            
            $summary['profit']['gross_profit'] += $order->get_meta('_financial_gross_profit') ?: 0;
            
            $payment_method = $order->get_payment_method();
            if ($payment_method === 'cash') {
                $summary['payment_methods']['cash'] += $order_total;
            } elseif (in_array($payment_method, array('card', 'stripe', 'square'))) {
                $summary['payment_methods']['card'] += $order_total;
            } else {
                $summary['payment_methods']['other'] += $order_total;
            }
            
            $summary['order_stats']['completed_orders']++;
        }
        
        if ($order_status === 'refunded') {
            $summary['order_stats']['refunded_orders']++;
            $summary['costs']['refunds'] += abs($order_total);
        }
    }
    
    // Calculate totals and margins
    $summary['costs']['total_costs'] = $summary['costs']['cost_of_goods'] + 
                                      $summary['costs']['processing_fees'] + 
                                      $summary['costs']['refunds'];
    
    $summary['profit']['net_profit'] = $summary['revenue']['total_revenue'] - $summary['costs']['total_costs'];
    
    if ($summary['revenue']['total_revenue'] > 0) {
        $summary['profit']['gross_margin'] = ($summary['profit']['gross_profit'] / $summary['revenue']['gross_sales']) * 100;
        $summary['profit']['net_margin'] = ($summary['profit']['net_profit'] / $summary['revenue']['total_revenue']) * 100;
    }
    
    if ($summary['order_stats']['completed_orders'] > 0) {
        $summary['order_stats']['average_order_value'] = $summary['revenue']['total_revenue'] / $summary['order_stats']['completed_orders'];
    }
    
    return rest_ensure_response($summary);
}

/**
 * Get cash reconciliation report
 */
function get_cash_reconciliation($request) {
    $date = $request->get_param('date');
    $location = $request->get_param('location');
    $terminal_id = $request->get_param('terminal_id');
    
    $args = array(
        'type' => 'shop_order',
        'status' => array('wc-completed', 'wc-processing'),
        'date_created' => $date . '...' . $date,
        'limit' => -1,
        'meta_query' => array(
            array(
                'key' => 'payment_method',
                'value' => 'cash',
            ),
        ),
    );
    
    if ($location) {
        $args['meta_query'][] = array(
            'key' => '_order_source_location',
            'value' => $location,
        );
    }
    
    if ($terminal_id) {
        $args['meta_query'][] = array(
            'key' => '_pos_terminal_id',
            'value' => $terminal_id,
        );
    }
    
    $orders = wc_get_orders($args);
    
    $reconciliation = array(
        'date' => $date,
        'location' => $location ?: 'All Locations',
        'terminal_id' => $terminal_id ?: 'All Terminals',
        'opening_balance' => 0, // This would need to be set by the business
        'cash_sales' => array(
            'count' => 0,
            'total' => 0,
            'orders' => array(),
        ),
        'cash_refunds' => array(
            'count' => 0,
            'total' => 0,
            'orders' => array(),
        ),
        'expected_closing_balance' => 0,
        'cashiers' => array(),
    );
    
    foreach ($orders as $order) {
        $order_data = array(
            'order_id' => $order->get_id(),
            'time' => $order->get_date_created()->format('H:i:s'),
            'amount' => $order->get_total(),
            'cashier' => $order->get_meta('_cashier_name') ?: 'Unknown',
        );
        
        $reconciliation['cash_sales']['count']++;
        $reconciliation['cash_sales']['total'] += $order->get_total();
        $reconciliation['cash_sales']['orders'][] = $order_data;
        
        // Track by cashier
        $cashier = $order_data['cashier'];
        if (!isset($reconciliation['cashiers'][$cashier])) {
            $reconciliation['cashiers'][$cashier] = array(
                'name' => $cashier,
                'sales_count' => 0,
                'sales_total' => 0,
            );
        }
        $reconciliation['cashiers'][$cashier]['sales_count']++;
        $reconciliation['cashiers'][$cashier]['sales_total'] += $order->get_total();
        
        // Check for refunds
        $refunded = $order->get_total_refunded();
        if ($refunded > 0) {
            $reconciliation['cash_refunds']['count']++;
            $reconciliation['cash_refunds']['total'] += $refunded;
            $reconciliation['cash_refunds']['orders'][] = array(
                'order_id' => $order->get_id(),
                'amount' => $refunded,
            );
        }
    }
    
    $reconciliation['expected_closing_balance'] = $reconciliation['opening_balance'] + 
                                                  $reconciliation['cash_sales']['total'] - 
                                                  $reconciliation['cash_refunds']['total'];
    
    $reconciliation['cashiers'] = array_values($reconciliation['cashiers']);
    
    return rest_ensure_response($reconciliation);
}

/**
 * Export daily report
 */
function export_daily_report($request) {
    $date = $request->get_param('date');
    $location = $request->get_param('location');
    $format = $request->get_param('format');
    
    // Get all the data
    $sales_summary = get_sales_summary($request);
    $hourly_sales = get_sales_by_hour($request);
    $cashier_performance = get_sales_by_cashier($request);
    $product_performance = get_product_performance($request);
    $financial_summary = get_financial_summary($request);
    $cash_reconciliation = get_cash_reconciliation($request);
    
    $report = array(
        'report_date' => $date,
        'location' => $location ?: 'All Locations',
        'generated_at' => current_time('mysql'),
        'sales_summary' => $sales_summary->data,
        'hourly_sales' => $hourly_sales->data,
        'cashier_performance' => $cashier_performance->data,
        'top_products' => array_slice($product_performance->data, 0, 10),
        'financial_summary' => $financial_summary->data,
        'cash_reconciliation' => $cash_reconciliation->data,
    );
    
    if ($format === 'csv') {
        // Convert to CSV format
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="daily-report-' . $date . '.csv"');
        
        $output = fopen('php://output', 'w');
        
        // Sales Summary
        fputcsv($output, array('DAILY REPORT - ' . $date));
        fputcsv($output, array(''));
        fputcsv($output, array('SALES SUMMARY'));
        fputcsv($output, array('Total Sales', $report['sales_summary']['total_sales']));
        fputcsv($output, array('Total Orders', $report['sales_summary']['total_orders']));
        fputcsv($output, array('Average Order Value', $report['sales_summary']['average_order_value']));
        
        fclose($output);
        exit;
    }
    
    return rest_ensure_response($report);
} 