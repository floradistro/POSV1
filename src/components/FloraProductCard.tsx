'use client'

import { useState } from 'react'
import { FloraProduct, getProductPrice, getRegularPrice, isOnSale, getProductImage, getStockStatus, getDisplayPrice } from '../lib/woocommerce'

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
      case 'out-of-stock': return 'text-vscode-accent'
      case 'low-stock': return 'text-warning'
      default: return 'text-success'
    }
  }

  const getStockText = () => {
    switch (stockStatus) {
      case 'out-of-stock': return 'Out of Stock'
      case 'low-stock': return `${product.stock_quantity} left`
      default: return 'In Stock'
    }
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
              if (stockStatus !== 'out-of-stock') {
                if (isVariableProduct) {
                  // For variable products, open product details instead of adding to cart
                  onProductClick(product)
                } else {
                  onAddToCart(product)
                }
              }
            }}
            disabled={stockStatus === 'out-of-stock'}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
              stockStatus === 'out-of-stock'
                ? 'bg-vscode-panel text-vscode-textMuted cursor-not-allowed border border-vscode-border'
                : 'bg-vscode-accent hover:bg-vscode-accentHover text-white hover:scale-105 group-hover:scale-110 shadow-vscode hover:shadow-vscode-lg border border-vscode-accent'
            }`}
          >
            {stockStatus === 'out-of-stock' 
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