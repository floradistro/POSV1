# Tax Configuration in WooCommerce for POS System

## The Issue

WooCommerce doesn't record arbitrary tax lines sent via API. It expects taxes to be:
1. Pre-configured as tax rates in WooCommerce settings
2. Automatically calculated based on product tax classes and customer location

## Solution 1: Configure Tax Rates in WooCommerce (Recommended)

### Step 1: Enable Taxes in WooCommerce
1. Go to **WooCommerce → Settings → General**
2. Check "Enable taxes"
3. Save changes

### Step 2: Create Tax Rates for Each Location
1. Go to **WooCommerce → Settings → Tax**
2. Click on "Standard rates" tab
3. Add tax rates for each store location:

Example for Blowing Rock (Store ID 32):
- **Country code**: US
- **State code**: NC  
- **Postcode**: (leave blank or use specific postcodes)
- **City**: Blowing Rock
- **Rate %**: 4.75
- **Tax name**: NC State Tax
- **Priority**: 1
- **Compound**: Unchecked
- **Shipping**: Check if taxing shipping

Add additional rows for each tax (County Tax, Cannabis Tax, etc.)

### Step 3: Update POS to Use Tax Classes

Instead of sending tax_lines, let WooCommerce calculate taxes based on:
- Customer billing address (set to store location)
- Product tax class
- Pre-configured tax rates

## Solution 2: Include Tax in Line Item Prices (Workaround)

If you can't configure tax rates in WooCommerce:

1. Calculate total including tax in the POS
2. Send the tax-inclusive price as the line item price
3. Store tax details in order meta_data for reporting
4. Set prices_include_tax to true in WooCommerce settings

## Solution 3: Use Fee Lines for Taxes (Alternative)

Add taxes as fee lines instead of tax lines:

```javascript
fee_lines: [
  {
    name: "NC State Tax (4.75%)",
    total: "0.95",
    tax_status: "none" // Don't tax the tax
  },
  {
    name: "County Tax (2.5%)", 
    total: "0.50",
    tax_status: "none"
  }
]
```

## Current Implementation Status

The POS system currently:
- ✅ Calculates taxes correctly
- ✅ Displays tax breakdown to customers
- ✅ Saves tax data in order meta_data
- ❌ Doesn't create WooCommerce tax lines that show in admin

To see tax data for orders created by POS:
1. View order in WooCommerce admin
2. Check "Custom Fields" metabox
3. Look for: _tax_total, _tax_breakdown, _location_tax_rates 