import Image from 'next/image'
import { Plus } from 'lucide-react'
import { FloraProduct } from '../lib/woocommerce'
import { useState } from 'react'

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
  onAddToCart: (product: FloraProduct, selectedVariation?: string) => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [selectedOption, setSelectedOption] = useState<string>('')

  // Handle pricing for weight-based products vs regular products
  const getDisplayPrice = () => {
    if (selectedOption && product.mli_product_type === 'weight' && product.pricing_tiers) {
      if (selectedOption.includes('preroll-')) {
        const count = selectedOption.replace('preroll-', '')
        return product.preroll_pricing_tiers?.[count] || 0
      } else if (selectedOption.includes('flower-')) {
        const grams = selectedOption.replace('flower-', '')
        return product.pricing_tiers[grams] || 0
      }
    }
    
    if (selectedOption && product.mli_product_type === 'quantity' && product.pricing_tiers) {
      const qty = selectedOption.replace('qty-', '')
      return product.pricing_tiers[qty] || 0
    }

    if (product.mli_product_type === 'weight' && product.pricing_tiers) {
      // For weight-based products, show the best per-gram rate (from largest quantity)
      const pricePerGramRates = Object.entries(product.pricing_tiers).map(([grams, totalPrice]) => 
        totalPrice / parseFloat(grams)
      )
      return Math.min(...pricePerGramRates)
    }
    return parseFloat(product.sale_price || product.price || '0')
  }

  const price = getDisplayPrice()
  const regularPrice = parseFloat(product.regular_price || '0')
  const hasDiscount = product.sale_price && price < regularPrice && product.mli_product_type !== 'weight'
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

  const handleAddToCart = () => {
    if (selectedOption) {
      onAddToCart(product, selectedOption)
    } else if (product.mli_product_type === 'weight' || product.mli_product_type === 'quantity') {
      // For products with options, require selection
      return
    } else {
      // For regular products, add without variation
      onAddToCart(product)
    }
  }

  const isAddToCartDisabled = isOutOfStock || 
    ((product.mli_product_type === 'weight' || product.mli_product_type === 'quantity') && !selectedOption)

  return (
    <div className="bg-vscode-bgSecondary px-0 py-1 hover:bg-vscode-bgTertiary transition-all duration-300 cursor-pointer group border border-vscode-border hover:border-vscode-accent/30">
      <div className="relative aspect-square mb-1">
        {product.images?.[0] ? (
          <Image
            src={product.images[0].src}
            alt={product.images[0].alt || product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
          />
        ) : (
          <div className="w-full h-full bg-vscode-bgTertiary flex items-center justify-center border border-vscode-border">
            <span className="text-vscode-textMuted text-sm">No image</span>
          </div>
        )}
        {hasDiscount && (
          <div className="absolute top-1 right-1 bg-vscode-accent text-white px-1 py-0.5 text-xs font-medium">
            Sale
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-medium">Out of Stock</span>
          </div>
        )}
      </div>
      
      <h3 className="font-medium text-vscode-text text-sm mb-1 line-clamp-2 group-hover:text-white transition-colors">{product.name}</h3>
      
      {/* Pricing Section */}
      <div className="flex flex-col mb-1">
        {product.mli_product_type === 'weight' && product.pricing_tiers ? (
          // Weight-based pricing tiers (flower with prerolls or concentrates)
          <div className="space-y-1">
            {/* Flower Pricing */}
            <div className="text-xs text-vscode-textMuted">
              {product.preroll_pricing_tiers ? 'Flower (grams)' : 'Weight Options (grams)'}
            </div>
            <div className={`grid gap-1 text-xs ${
              Object.keys(product.pricing_tiers).length <= 4 ? 'grid-cols-2' : 
              Object.keys(product.pricing_tiers).length === 5 ? 'grid-cols-2' : 'grid-cols-3'
            }`}>
              {Object.entries(product.pricing_tiers).map(([grams, totalPrice]) => {
                const optionKey = `flower-${grams}`
                const isSelected = selectedOption === optionKey
                return (
                  <button
                    key={grams}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedOption(isSelected ? '' : optionKey)
                    }}
                    className={`flex justify-between px-1 py-0.5 transition-all duration-200 hover:scale-105 ${
                      isSelected 
                        ? 'bg-vscode-accent text-white border border-vscode-accent' 
                        : 'bg-vscode-bgTertiary hover:bg-vscode-bgSecondary border border-transparent'
                    }`}
                  >
                    <span>{grams}g</span>
                    <span className={`font-medium ${isSelected ? 'text-white' : 'text-vscode-accent'}`}>
                      ${totalPrice.toFixed(2)}
                    </span>
                  </button>
                )
              })}
            </div>
            
            {/* Preroll Pricing (if available) */}
            {product.preroll_pricing_tiers && (
              <>
                <div className="text-xs text-vscode-textMuted mt-2">
                  Pre-rolls (count)
                </div>
                <div className={`grid gap-1 text-xs ${
                  Object.keys(product.preroll_pricing_tiers).length <= 4 ? 'grid-cols-2' : 'grid-cols-3'
                }`}>
                  {Object.entries(product.preroll_pricing_tiers).map(([count, totalPrice]) => {
                    const optionKey = `preroll-${count}`
                    const isSelected = selectedOption === optionKey
                    return (
                      <button
                        key={count}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedOption(isSelected ? '' : optionKey)
                        }}
                        className={`flex justify-between px-1 py-0.5 transition-all duration-200 hover:scale-105 ${
                          isSelected 
                            ? 'bg-vscode-accent text-white border border-vscode-accent' 
                            : 'bg-vscode-bgTertiary hover:bg-vscode-bgSecondary border border-transparent'
                        }`}
                      >
                        <span>{count}x</span>
                        <span className={`font-medium ${isSelected ? 'text-white' : 'text-vscode-accent'}`}>
                          ${totalPrice.toFixed(2)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
            
            {selectedOption ? (
              <div className="text-xs text-vscode-accent text-center font-medium">
                Selected: ${price.toFixed(2)}
              </div>
            ) : (
              <div className="text-xs text-vscode-textMuted text-center">
                Select an option above
              </div>
            )}
          </div>
        ) : product.mli_product_type === 'quantity' && product.pricing_tiers ? (
          // Quantity-based pricing tiers
          <div className="space-y-1">
            <div className="text-xs text-vscode-textMuted">Quantity Pricing</div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {Object.entries(product.pricing_tiers).slice(0, 4).map(([qty, pricePerUnit]) => {
                const optionKey = `qty-${qty}`
                const isSelected = selectedOption === optionKey
                return (
                  <button
                    key={qty}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedOption(isSelected ? '' : optionKey)
                    }}
                    className={`flex justify-between px-1 py-0.5 transition-all duration-200 hover:scale-105 ${
                      isSelected 
                        ? 'bg-vscode-accent text-white border border-vscode-accent' 
                        : 'bg-vscode-bgTertiary hover:bg-vscode-bgSecondary border border-transparent'
                    }`}
                  >
                    <span>{qty} units</span>
                    <span className={`font-medium ${isSelected ? 'text-white' : 'text-vscode-accent'}`}>
                      ${pricePerUnit.toFixed(2)} ea
                    </span>
                  </button>
                )
              })}
            </div>
            {selectedOption ? (
              <div className="text-xs text-vscode-accent text-center font-medium">
                Selected: ${price.toFixed(2)}
              </div>
            ) : (
              <div className="text-xs text-vscode-textMuted text-center">
                Select quantity above
              </div>
            )}
          </div>
        ) : (
          // Standard pricing
          <div className="flex items-center gap-2">
            <span className="text-vscode-accent font-bold text-lg">${price.toFixed(2)}</span>
            {hasDiscount && (
              <span className="text-vscode-textMuted text-sm line-through">${regularPrice.toFixed(2)}</span>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between mt-1">
          <span className={`text-xs ${getStockColor()}`}>
            {getStockText()}
          </span>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAddToCart()
            }}
            disabled={isAddToCartDisabled}
            className={`p-1 transition-all duration-200 ${
              isAddToCartDisabled
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-vscode-accent hover:bg-vscode-accent/80 text-white hover:scale-105'
            }`}
            title={
              isOutOfStock ? 'Out of stock' :
              ((product.mli_product_type === 'weight' || product.mli_product_type === 'quantity') && !selectedOption) ? 'Select an option first' :
              'Add to cart'
            }
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
} 