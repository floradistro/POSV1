// Server-side WooCommerce functions for POSV1
// Based on the working implementation from woosite1

import { fetchWithRetry } from '../utils/fetchWithRetry';

// ACF Field Interfaces
export interface ACFFields {
  // Edible/Moonwater fields
  strength_mg?: string;
  // Flower/Vape/Concentrate fields
  'thca_%'?: string;
  strain_type?: string;
  nose?: string;
  effects?: string;
  dominent_terpene?: string;
  lineage?: string;
}

export interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  date_created: string;
  date_modified: string;
  type: string;
  status: string;
  featured: boolean;
  catalog_visibility: string;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  purchasable: boolean;
  total_sales: number;
  virtual: boolean;
  downloadable: boolean;
  downloads: any[];
  download_limit: number;
  download_expiry: number;
  external_url: string;
  button_text: string;
  tax_status: string;
  tax_class: string;
  manage_stock: boolean;
  stock_quantity: number | null;
  backorders: string;
  backorders_allowed: boolean;
  backordered: boolean;
  low_stock_amount: number | null;
  sold_individually: boolean;
  weight: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
  shipping_required: boolean;
  shipping_taxable: boolean;
  shipping_class: string;
  shipping_class_id: number;
  reviews_allowed: boolean;
  average_rating: string;
  rating_count: number;
  upsell_ids: number[];
  cross_sell_ids: number[];
  parent_id: number;
  purchase_note: string;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  tags: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  images: Array<{
    id: number;
    date_created: string;
    date_modified: string;
    src: string;
    name: string;
    alt: string;
    position: number;
  }>;
  attributes: Array<{
    id: number;
    name: string;
    position: number;
    visible: boolean;
    variation: boolean;
    options: string[];
  }>;
  default_attributes: Array<{
    id: number;
    name: string;
    option: string;
  }>;
  variations: number[];
  grouped_products: number[];
  menu_order: number;
  related_ids: number[];
  stock_status: string;
  has_options: boolean;
  post_password: string;
  global_unique_id: string;
  meta_data: Array<{
    id: number;
    key: string;
    value: any;
  }>;
  acf?: ACFFields;
}

// Simple cache implementation
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCacheKey(params?: any): string {
  return JSON.stringify(params || {});
}

function isValidCache(key: string): boolean {
  const cached = cache.get(key);
  if (!cached) return false;
  return Date.now() - cached.timestamp < CACHE_DURATION;
}

// Direct server-side API functions
export const wooCommerceServerAPI = {
  // Get products directly from WooCommerce API
  async getProducts(params?: {
    per_page?: number;
    page?: number;
    search?: string;
    category?: string;
    tag?: string;
    status?: string;
    featured?: boolean;
  }): Promise<WooCommerceProduct[]> {
    try {
      const storeUrl = 'https://api.floradistro.com';
      const consumerKey = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
      const consumerSecret = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

      if (!storeUrl || !consumerKey || !consumerSecret) {
        console.error('Missing WooCommerce credentials');
        return [];
      }

      // Check cache first
      const cacheKey = getCacheKey(params);
      if (isValidCache(cacheKey)) {
        const cached = cache.get(cacheKey);
        return cached!.data;
      }

      // Build URL with parameters
      const queryParams = new URLSearchParams();
      queryParams.append('consumer_key', consumerKey);
      queryParams.append('consumer_secret', consumerSecret);
      
      if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.category) queryParams.append('category', params.category);
      if (params?.tag) queryParams.append('tag', params.tag);
      if (params?.status) queryParams.append('status', params.status || 'publish');
      if (params?.featured !== undefined) queryParams.append('featured', params.featured.toString());

      const url = `${storeUrl}/wp-json/wc/v3/products?${queryParams.toString()}`;

      const response = await fetchWithRetry(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`WooCommerce API Error: ${response.status} ${response.statusText}`);
      }

      const products = await response.json();
      
      // Cache the result
      cache.set(cacheKey, { data: products, timestamp: Date.now() });
      
      return products;
    } catch (error: any) {
      console.error('Error fetching products from WooCommerce:', error.message || error);
      return [];
    }
  },

  // Get products by multiple categories
  async getProductsByCategories(categoryIds: number[]): Promise<WooCommerceProduct[]> {
    try {
      const allProducts: WooCommerceProduct[] = [];
      
      // Fetch products for each category
      for (const categoryId of categoryIds) {
        const products = await this.getProducts({
          category: categoryId.toString(),
          per_page: 100,
          status: 'publish'
        });
        allProducts.push(...products);
      }
      
      // Remove duplicates by ID
      const uniqueProducts = allProducts.filter((product, index, self) => 
        index === self.findIndex(p => p.id === product.id)
      );
      
      return uniqueProducts;
    } catch (error: any) {
      console.error('Error fetching products by categories:', error.message || error);
      return [];
    }
  },

  // Get product variations
  async getProductVariations(productId: number): Promise<any[]> {
    try {
      const storeUrl = 'https://api.floradistro.com';
      const consumerKey = 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5';
      const consumerSecret = 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678';

      const queryParams = new URLSearchParams();
      queryParams.append('consumer_key', consumerKey);
      queryParams.append('consumer_secret', consumerSecret);
      queryParams.append('per_page', '100');

      const url = `${storeUrl}/wp-json/wc/v3/products/${productId}/variations?${queryParams.toString()}`;

      const response = await fetchWithRetry(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`Failed to fetch variations for product ${productId}: ${response.status}`);
        return [];
      }

      const variations = await response.json();
      return variations || [];
    } catch (error: any) {
      console.error(`Error fetching variations for product ${productId}:`, error.message || error);
      return [];
    }
  }
}; 