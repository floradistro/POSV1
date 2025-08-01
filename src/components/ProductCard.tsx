import Image from 'next/image'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { FloraProduct } from '../lib/woocommerce'
import { ACFFieldsDisplay } from './ACFFieldsDisplay'
import { ProductLineage } from './ProductLineage'
import { ProductNameSideInfo } from './ProductNameSideInfo'
import { ProductCharacteristics } from './ProductCharacteristics'

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
  globalSelectedProduct: { productId: number; variation: string } | null
  setGlobalSelectedProduct: (selection: { productId: number; variation: string } | null) => void
  isListView?: boolean
}

export function ProductCard({ product, onAddToCart, globalSelectedProduct, setGlobalSelectedProduct, isListView = false }: ProductCardProps) {
  // Use global selection state instead of local state
  const selectedVariation = globalSelectedProduct?.productId === product.id ? globalSelectedProduct.variation : 'default'

  // Handle pricing for weight-based products vs regular products
  const getDisplayPrice = () => {
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

  const handleVariationSelect = (variation: string) => {
    if (!isOutOfStock) {
      // If the same variation is clicked, unselect it
      if (selectedVariation === variation) {
        setGlobalSelectedProduct(null)
      } else {
        setGlobalSelectedProduct({ productId: product.id, variation })
      }
    }
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isOutOfStock) {
      onAddToCart(product, selectedVariation)
    }
  }

  // Get the price for the currently selected variation
  const getSelectedPrice = () => {
    if (selectedVariation === 'default') return null

    if (product.mli_product_type === 'weight' && product.pricing_tiers) {
      if (selectedVariation.startsWith('flower-')) {
        const grams = selectedVariation.replace('flower-', '')
        return product.pricing_tiers[grams]
      }
      if (selectedVariation.startsWith('preroll-') && product.preroll_pricing_tiers) {
        const count = selectedVariation.replace('preroll-', '')
        return product.preroll_pricing_tiers[count]
      }
    }

    if (product.mli_product_type === 'quantity' && product.pricing_tiers) {
      if (selectedVariation.startsWith('qty-')) {
        const qty = selectedVariation.replace('qty-', '')
        return product.pricing_tiers[qty]
      }
    }

    return null
  }

  const selectedPrice = getSelectedPrice()

  return (
    <div className={`relative bg-vscode-bgSecondary hover:bg-vscode-bgTertiary transition-all duration-300 cursor-pointer group border border-white/[0.04] hover:border-white/[0.12] ${
      isListView 
        ? 'flex items-center gap-2 px-3 py-1 min-h-[40px]' 
        : 'flex flex-col'
    }`}>
      {/* Main Content Area */}
      <div className={`${isListView ? 'flex items-center gap-2 flex-1' : 'flex gap-2 p-2'}`}>
        {/* Product Image */}
        <div className={`relative ${
          isListView 
            ? 'w-8 h-8 flex-shrink-0 mb-0' 
            : 'w-20 h-20 flex-shrink-0'
        }`}>
          {product.images?.[0] ? (
            <Image
              src={product.images[0].src}
              alt={product.images[0].alt || product.name}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
            />
          ) : (
            <div className="w-full h-full bg-vscode-bgTertiary flex items-center justify-center border border-white/[0.04]">
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
        
        {/* Product Information */}
        <div className={`${isListView ? 'flex-1' : 'flex-1 min-w-0'}`}>
          <div className={`flex items-start justify-between ${isListView ? 'mb-0' : 'mb-1'}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className={`font-medium text-vscode-text group-hover:text-white transition-colors flex-1 ${
                      isListView ? 'text-xs line-clamp-1' : 'text-sm line-clamp-1'
                    }`}>{product.name}</h3>
                    {(product.mli_product_type === 'weight' || product.mli_product_type === 'quantity') && selectedPrice && (
                      <span className={`text-vscode-accent font-bold ml-2 flex-shrink-0 ${
                        isListView ? 'text-xs' : 'text-sm'
                      }`}>${selectedPrice.toFixed(2)}</span>
                    )}
                  </div>
                  {!isListView && (
                    <div className="w-full overflow-visible">
                      <ProductLineage productId={product.id} product={product} />
                    </div>
                  )}
                </div>
                {!isListView && <ProductNameSideInfo productId={product.id} />}
              </div>
            </div>
          </div>
          
          {/* Product Characteristics */}
          {!isListView && <ProductCharacteristics productId={product.id} />}
          
          {/* Standard Pricing Section */}
          {!(product.mli_product_type === 'weight' && product.pricing_tiers) && !(product.mli_product_type === 'quantity' && product.pricing_tiers) && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-vscode-accent font-bold text-lg">${price.toFixed(2)}</span>
                {hasDiscount && (
                  <span className="text-vscode-textMuted text-sm line-through">${regularPrice.toFixed(2)}</span>
                )}
              </div>
              {!isListView && (
                <div className="flex items-start justify-between mt-1">
                  <span className={`text-xs ${getStockColor()}`}>
                    {getStockText()}
                  </span>
                </div>
              )}
            </>
          )}
          
          {/* ACF Fields Display - Hidden in list view */}
          {!isListView && (
            <div className={`relative ${
              (product.mli_product_type === 'weight' || product.mli_product_type === 'quantity') 
                ? 'pb-12' 
                : ''
            }`}>
              <ACFFieldsDisplay 
                productId={product.id}
                productName={product.name}
              />
            </div>
          )}
          
          {/* Compact Add Button for List View */}
          {isListView && (product.mli_product_type === 'weight' || product.mli_product_type === 'quantity') && selectedVariation !== 'default' && (
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`ml-auto px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                isOutOfStock 
                  ? 'bg-gray-400 cursor-not-allowed text-gray-600' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              <Plus className="w-2 h-2" />
              Add
            </button>
          )}
        </div>
      </div>
      
      {/* Weight/Quantity Selectors - Full Width Below Everything */}
      {!isListView && (product.mli_product_type === 'weight' && product.pricing_tiers) && (
        <div className="w-full space-y-2 mt-2 px-2 pb-12">
          {/* Flower Pricing */}
          <div className="text-xs text-vscode-textMuted">
            {product.preroll_pricing_tiers ? 'Flower (grams)' : 'Weight Options (grams)'}
          </div>
          <div className="flex gap-1 text-xs">
            {Object.entries(product.pricing_tiers || {}).map(([grams, totalPrice]) => {
              const variationKey = `flower-${grams}`
              const isSelected = selectedVariation === variationKey
              return (
                <button
                  key={grams}
                  onClick={() => handleVariationSelect(variationKey)}
                  disabled={isOutOfStock}
                  className={`flex-1 justify-center px-2 py-1 rounded text-sm font-medium transition-colors ${
                    isOutOfStock 
                      ? 'bg-gray-400 cursor-not-allowed text-gray-600' 
                      : isSelected
                      ? 'bg-primary text-white'
                      : 'bg-background-tertiary text-text-secondary hover:bg-background-tertiary/80'
                  }`}
                >
                  {grams}g
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
              <div className="flex gap-1 text-xs">
                {Object.entries(product.preroll_pricing_tiers || {}).map(([count, totalPrice]) => {
                  const variationKey = `preroll-${count}`
                  const isSelected = selectedVariation === variationKey
                  return (
                    <button
                      key={count}
                      onClick={() => handleVariationSelect(variationKey)}
                      disabled={isOutOfStock}
                      className={`flex-1 justify-center px-2 py-1 rounded text-sm font-medium transition-colors ${
                        isOutOfStock 
                          ? 'bg-gray-400 cursor-not-allowed text-gray-600' 
                          : isSelected
                          ? 'bg-primary text-white'
                          : 'bg-background-tertiary text-text-secondary hover:bg-background-tertiary/80'
                      }`}
                    >
                      {count}x
                    </button>
                  )
                })}
              </div>
            </>
          )}
          
          <div className="text-xs text-vscode-textMuted text-center">
            Best rate: ${price.toFixed(2)}/g
          </div>
          
          {/* Stock Information */}
          <div className="flex items-center justify-center mt-2">
            <span className={`text-xs ${getStockColor()}`}>
              {getStockText()}
            </span>
          </div>
        </div>
      )}
      
      {!isListView && (product.mli_product_type === 'quantity' && product.pricing_tiers) && (
        <div className="w-full space-y-2 mt-2 px-2 pb-12">
          <div className="text-xs text-vscode-textMuted">Quantity Pricing</div>
          <div className="flex gap-1 text-xs">
            {Object.entries(product.pricing_tiers || {}).slice(0, 4).map(([qty, pricePerUnit]) => {
              const variationKey = `qty-${qty}`
              const isSelected = selectedVariation === variationKey
              return (
                <button
                  key={qty}
                  onClick={() => handleVariationSelect(variationKey)}
                  disabled={isOutOfStock}
                  className={`flex-1 justify-center px-2 py-1 rounded text-sm font-medium transition-colors ${
                    isOutOfStock 
                      ? 'bg-gray-400 cursor-not-allowed text-gray-600' 
                      : isSelected
                      ? 'bg-primary text-white'
                      : 'bg-background-tertiary text-text-secondary hover:bg-background-tertiary/80'
                  }`}
                >
                  {qty} units
                </button>
              )
            })}
          </div>
          
          {/* Stock Information */}
          <div className="flex items-center justify-center mt-2">
            <span className={`text-xs ${getStockColor()}`}>
              {getStockText()}
            </span>
          </div>
        </div>
      )}
      
      {/* Add Button - Bottom Right Corner */}
      {!isListView && (product.mli_product_type === 'weight' || product.mli_product_type === 'quantity') && selectedVariation !== 'default' && (
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={`absolute bottom-2 right-2 px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
            isOutOfStock 
              ? 'bg-gray-400 cursor-not-allowed text-gray-600' 
              : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg'
          }`}
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      )}
    </div>
  )
} 