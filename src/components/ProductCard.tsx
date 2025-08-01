import Image from 'next/image'
import { Plus } from 'lucide-react'
import { FloraProduct } from '../lib/woocommerce'

// Helper functions
function getStockStatus(product: FloraProduct): 'instock' | 'outofstock' | 'onbackorder' {
  // Use location-specific stock if available
  if (product.location_stock !== undefined) {
    return product.location_stock > 0 ? 'instock' : 'outofstock'
  }
  return product.in_stock ? 'instock' : 'outofstock'
}

interface ProductCardProps {
  product: FloraProduct
  onAddToCart: (product: FloraProduct) => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const price = parseFloat(product.sale_price || product.price)
  const regularPrice = parseFloat(product.regular_price)
  const hasDiscount = product.sale_price && price < regularPrice
  const stockStatus = getStockStatus(product)

  const getStockColor = () => {
    switch (stockStatus) {
      case 'outofstock': return 'text-red-400'
      case 'onbackorder': return 'text-orange-400'
      default: return 'text-green-400'
    }
  }

  const getStockText = () => {
    if (stockStatus === 'outofstock') return 'Out of Stock'
    
    // Use location-specific stock if available
    if (product.location_stock !== undefined) {
      return `${product.location_stock} at ${product.location_name || 'this location'}`
    }
    
    if (product.stock_quantity !== null && product.stock_quantity !== undefined) {
      return `${product.stock_quantity} in stock`
    }
    return 'In Stock'
  }

  const isOutOfStock = stockStatus === 'outofstock'

  return (
    <div className="bg-vscode-bgSecondary rounded-lg p-4 hover:bg-vscode-bgTertiary transition-all duration-300 cursor-pointer group border border-vscode-border hover:border-vscode-accent/30">
      <div className="relative aspect-square mb-3">
        {product.images?.[0] ? (
          <Image
            src={product.images[0].src}
            alt={product.images[0].alt || product.name}
            fill
            className="object-cover rounded-lg"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
          />
        ) : (
          <div className="w-full h-full bg-vscode-bgTertiary rounded-lg flex items-center justify-center border border-vscode-border">
            <span className="text-vscode-textMuted text-sm">No image</span>
          </div>
        )}
        {hasDiscount && (
          <div className="absolute top-2 right-2 bg-vscode-accent text-white px-2 py-1 rounded text-xs font-medium">
            Sale
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
            <span className="text-white font-medium">Out of Stock</span>
          </div>
        )}
      </div>
      
      <h3 className="font-medium text-vscode-text text-sm mb-2 line-clamp-2 group-hover:text-white transition-colors">{product.name}</h3>
      
      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-vscode-accent font-bold text-lg">${price.toFixed(2)}</span>
            {hasDiscount && (
              <span className="text-vscode-textMuted text-sm line-through">${regularPrice.toFixed(2)}</span>
            )}
          </div>
          <span className={`text-xs ${getStockColor()}`}>
            {getStockText()}
          </span>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation()
            onAddToCart(product)
          }}
          disabled={isOutOfStock}
          className={`p-2 rounded-lg transition-all duration-200 ${
            isOutOfStock 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-vscode-accent hover:bg-vscode-accent/80 text-white hover:scale-105'
          }`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
} 