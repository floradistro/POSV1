'use client'

import { useState } from 'react'

// Temporary interface until new API is implemented
interface FloraProduct {
  id: number
  name: string
  slug: string
  description: string
  short_description: string
  price: string
  regular_price: string
  sale_price: string
  on_sale: boolean
  stock_status: 'instock' | 'outofstock' | 'onbackorder'
  stock_quantity: number | null
  categories: Array<{ id: number; name: string; slug: string }>
  images: Array<{ id: number; src: string; name: string; alt: string }>
  attributes: Array<{ id: number; name: string; options: string[] }>
  meta_data: Array<{ key: string; value: any }>
  variations?: number[]
  has_options?: boolean
  type: string
  variationsData?: any[]
}

// Helper functions
function getProductPrice(product: FloraProduct): number {
  return parseFloat(product.price || '0')
}

function getRegularPrice(product: FloraProduct): number {
  return parseFloat(product.regular_price || product.price || '0')
}

function isOnSale(product: FloraProduct): boolean {
  return product.on_sale || false
}

function getProductImage(product: FloraProduct): string {
  return product.images?.[0]?.src || '/flora_chip_optimized.webp'
}

function getStockStatus(product: FloraProduct): 'instock' | 'outofstock' | 'onbackorder' {
  return product.stock_status || 'instock'
}

function getDisplayPrice(product: FloraProduct): string {
  const price = getProductPrice(product)
  return price > 0 ? `$${price.toFixed(2)}` : 'Price on request'
}

interface FloraProductCardProps {
  product: FloraProduct
  onAddToCart: (product: FloraProduct) => void
  onProductClick: (product: FloraProduct) => void
}

export default function FloraProductCard({ product, onAddToCart, onProductClick }: FloraProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const price = getProductPrice(product)
  const regularPrice = getRegularPrice(product)
  const onSale = isOnSale(product)
  const stockStatus = getStockStatus(product)
  const productImage = getProductImage(product)
  
  // Handle variable products with real pricing data
  const isVariableProduct = product.has_options && product.variations && product.variations.length > 0
  const displayPrice = getDisplayPrice(product)

  const getStockColor = () => {
    switch (stockStatus) {
      case 'outofstock': return 'text-vscode-accent'
      case 'onbackorder': return 'text-orange-400'
      default: return 'text-green-400'
    }
  }

  const getStockText = () => {
    if (stockStatus === 'outofstock') return 'Out of Stock'
    if (product.stock_quantity !== null) {
      return `${product.stock_quantity} in stock`
    }
    return 'In Stock'
  }

  return (
    <div 
      className="bg-vscode-bgSecondary rounded-xl p-4 md:p-6 h-full backdrop-blur-sm border border-vscode-border hover:border-vscode-accent/50 transition-all duration-300 group cursor-pointer shadow-vscode hover:shadow-vscode-lg"
      onClick={() => onProductClick(product)}
    >
      {/* Product Image */}
      <div className="aspect-square mb-3 md:mb-4 rounded-lg overflow-hidden bg-vscode-bgTertiary relative group/image border border-vscode-border">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-vscode-panel/50 to-vscode-bgTertiary/50 animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-vscode-border to-transparent animate-shimmer"></div>
          </div>
        )}
        
        <img
          src={productImage}
          alt={product.name}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = '/placeholder-product.jpg'
            setImageLoaded(true)
          }}
        />
        
        {/* Sale Badge */}
        {onSale && !isVariableProduct && (
          <div className="absolute top-2 right-2 bg-vscode-accent text-white px-2 py-1 rounded text-xs font-medium">
            Sale
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-2 md:space-y-3">
        <h3 className="text-lg md:text-xl font-semibold text-vscode-text group-hover:text-vscode-accent transition-colors line-clamp-2">
          {product.name}
        </h3>
        
        {product.short_description && (
          <p className="text-vscode-textSecondary text-xs md:text-sm line-clamp-2" 
             dangerouslySetInnerHTML={{ __html: product.short_description }} />
        )}

        {/* Price and Stock Info */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-vscode-accent font-bold text-lg">
                {displayPrice}
              </span>
              {onSale && !isVariableProduct && (
                <span className="text-vscode-textMuted text-sm line-through">
                  ${regularPrice.toFixed(2)}
                </span>
              )}
            </div>
            <span className={`text-xs ${getStockColor()}`}>
              {getStockText()}
            </span>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (stockStatus !== 'outofstock') {
                if (isVariableProduct) {
                  // For variable products, open product details instead of adding to cart
                  onProductClick(product)
                } else {
                  onAddToCart(product)
                }
              }
            }}
            disabled={stockStatus === 'outofstock'}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
              stockStatus === 'outofstock'
                ? 'bg-vscode-panel text-vscode-textMuted cursor-not-allowed border border-vscode-border'
                : 'bg-vscode-accent hover:bg-vscode-accentHover text-white hover:scale-105 group-hover:scale-110 shadow-vscode hover:shadow-vscode-lg border border-vscode-accent'
            }`}
          >
            {stockStatus === 'outofstock' 
              ? 'Sold Out' 
              : isVariableProduct 
                ? 'View Options' 
                : 'Add to Cart'
            }
          </button>
        </div>
      </div>
    </div>
  )
} 