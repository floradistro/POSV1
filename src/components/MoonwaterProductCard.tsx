import React from 'react'

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
function getStockStatus(product: FloraProduct): 'instock' | 'outofstock' | 'onbackorder' {
  return product.stock_status || 'instock'
}

function getACFValue(product: FloraProduct, key: string): string | undefined {
  const metaItem = product.meta_data?.find(item => item.key === key)
  return metaItem?.value
}

interface MoonwaterProductCardProps {
  product: FloraProduct
  selectedOption?: string
  isExpanded?: boolean
  onAddToCart: (product: FloraProduct) => void
  onToggleExpanded?: (productId: number, e: React.MouseEvent) => void
  onOptionSelect?: (productId: number, option: string) => void
}

export function MoonwaterProductCard({ 
  product, 
  selectedOption = '', 
  isExpanded = true, // Always expanded like other categories
  onAddToCart, 
  onToggleExpanded,
  onOptionSelect 
}: MoonwaterProductCardProps) {
  // Check if product has variations
  const hasVariations = product.type === 'variable' && product.variationsData && product.variationsData.length > 0

  // Get current price based on selected option
  const getCurrentPrice = () => {
    if (hasVariations && selectedOption) {
      // Parse combined selection (format: "flavor-Berry Twist|pack-Single")
      const selectedFlavor = selectedOption?.includes('flavor-') ? 
        selectedOption.split('flavor-')[1]?.split('|')[0] : null;
      const selectedPackSize = selectedOption?.includes('pack-') ? 
        selectedOption.split('pack-')[1]?.split('|')[0] : null;
      
      const matchingVariation = product.variationsData?.find((v: any) => 
        (!selectedFlavor || v.attributes.some((attr: any) => attr.name === 'Flavor' && attr.option === selectedFlavor)) &&
        (!selectedPackSize || v.attributes.some((attr: any) => attr.name === 'Pack Size' && attr.option === selectedPackSize))
      );
      
      if (matchingVariation) {
        return parseFloat(matchingVariation.price);
      }
    }
    return parseFloat(product.sale_price || product.price);
  };

  const price = getCurrentPrice();
  const regularPrice = parseFloat(product.regular_price)
  const hasDiscount = product.on_sale && price < regularPrice
  const stockStatus = getStockStatus(product)

  // Get ACF fields for moonwater products
  const strengthMg = getACFValue(product, 'strength_mg') || '10'
  const effects = getACFValue(product, 'effects') || 'Refreshing Hydrating'

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

  // Check if user has made selections (both flavor and pack size for products with flavors, or just pack size for Riptide)
  const hasRequiredSelections = () => {
    if (!hasVariations) return true; // Simple products don't need selections
    
    const hasFlavor = selectedOption?.includes('flavor-');
    const hasPackSize = selectedOption?.includes('pack-');
    
    // All moonwater products now need both flavor and pack size
    // Products without flavor variants will use "Original" as their flavor
    return hasFlavor && hasPackSize;
  };

  const showPrice = hasRequiredSelections();

  // Debug logging
  console.log(`🌙 Moonwater Product: ${product.name}`, {
    type: product.type,
    hasVariations,
    variationsCount: product.variationsData?.length || 0,
    variations: product.variationsData,
    attributes: product.attributes,
    selectedOption,
    currentPrice: price,
    showPrice
  })

  // Get available flavors and pack sizes from variations
  const flavors = hasVariations ? Array.from(new Set(product.variationsData!.map((v: any) => {
    // Check multiple possible attribute names for flavor
    const flavorAttr = v.attributes.find((attr: any) => 
      attr.name === 'Flavor' || 
      attr.name === 'flavor' || 
      attr.name === 'pa_flavor' ||
      attr.name.toLowerCase().includes('flavor')
    )
    const flavor = flavorAttr?.option || 'Original'
    console.log(`🌙 Found flavor: ${flavor} from attributes:`, v.attributes)
    return flavor
  }))) : []

  const packSizes = hasVariations ? Array.from(new Set(product.variationsData!.map((v: any) => {
    // Check multiple possible attribute names for pack size
    const packSizeAttr = v.attributes.find((attr: any) => 
      attr.name === 'Pack Size' || 
      attr.name === 'pack-size' || 
      attr.name === 'pa_pack-size' ||
      attr.name.toLowerCase().includes('pack')
    )
    const packSize = packSizeAttr?.option || 'Single'
    console.log(`🌙 Found pack size: ${packSize} from attributes:`, v.attributes)
    return packSize
  }))) : []

  console.log(`🌙 Extracted variations for ${product.name}:`, { 
    flavors, 
    packSizes,
    totalVariations: product.variationsData?.length || 0,
    allVariations: product.variationsData
  })

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log(`🌙 Adding to cart: ${product.name} with option: ${selectedOption}`)
    onAddToCart(product)
  }

  return (
    <div className="group relative transition-all duration-300 opacity-100 translate-y-0 border-r border-b border-vscode-border h-full hover:bg-vscode-bgSecondary/30">
      <div 
        className="p-1.5 relative transition-all duration-200 h-full flex flex-col"
        style={{
          background: 'var(--color-secondary-bg)',
          backdropFilter: 'blur(20px) saturate(120%)',
          WebkitBackdropFilter: 'blur(20px) saturate(120%)'
        }}
      >
        
        <div className="flex items-start gap-1.5 mb-3">
          {/* Product Image - VSCode style */}
          <div className="relative w-25 h-25 md:w-24 md:h-24 flex-shrink-0 overflow-hidden cursor-pointer group/image bg-vscode-bgTertiary border border-vscode-border rounded">
            {product.images?.[0] ? (
              <img
                src={product.images[0].src}
                alt={product.images[0].alt || product.name}
                className="w-full h-full object-cover transition-all duration-300 group-hover/image:scale-110"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/flora_chip_optimized.webp'
                }}
              />
            ) : (
              <div className="w-full h-full bg-vscode-panel flex items-center justify-center">
                <span className="text-vscode-textMuted text-xs">No image</span>
              </div>
            )}
            
            {hasDiscount && (
              <div className="absolute top-1 right-1 bg-vscode-accent text-white px-1 py-0.5 rounded text-xs font-medium">
                Sale
              </div>
            )}

            {/* Moonwater indicator */}
            <div className="absolute bottom-1 right-1 w-8 h-8 md:w-10 md:h-10 opacity-100 transition-all duration-300 transform group-hover/image:scale-110 shadow-lg flex items-center justify-center">
              <img src="/icons/Moonwater.png" alt="Moonwater indicator" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Product Info - VSCode style */}
          <div className="flex-1 min-w-0 relative">
            <h3 className="font-light text-vscode-text text-sm mb-2 leading-tight group-hover:text-white transition-colors">
              {product.name}
            </h3>

            {/* Strength and Effects - VSCode style */}
            <div className="space-y-1.5 mb-3">
              {/* Strength */}
              <div className="flex items-center gap-2">
                <span className="text-vscode-textSecondary text-xs font-light min-w-[45px]">Strength:</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-vscode-accent font-medium text-sm">
                    {strengthMg?.toLowerCase().includes('mg') ? strengthMg : `${strengthMg}mg`}
                  </span>
                </div>
              </div>
              
              {/* Effects */}
              <div className="flex items-start gap-2">
                <span className="text-vscode-textSecondary text-xs font-light min-w-[45px] mt-0.5">Effects:</span>
                <p className="text-vscode-textSecondary text-xs font-light leading-relaxed line-clamp-2 flex-1">
                  {effects}
                </p>
              </div>
            </div>

            {/* Price and Add Button - VSCode style */}
            <div className="flex items-center justify-between">
              <div className="text-vscode-text font-light text-base">
                {showPrice ? (
                  <>
                    <span className="text-vscode-accent">$</span>{price.toFixed(2)}
                    {hasDiscount && (
                      <span className="text-vscode-textMuted text-sm line-through ml-1">${regularPrice.toFixed(2)}</span>
                    )}
                    {selectedOption && (
                      <div className="text-xs text-vscode-textSecondary mt-0.5">
                        {selectedOption.includes('flavor-') && ` • ${selectedOption.split('flavor-')[1]?.split('|')[0]}`}
                        {selectedOption.includes('pack-') && ` • ${selectedOption.split('pack-')[1]?.split('|')[0]}`}
                      </div>
                    )}
                    <div className={`text-xs mt-1 ${getStockColor()}`}>
                      {getStockText()}
                    </div>
                  </>
                ) : (
                  <div className="text-vscode-textMuted text-sm">
                    Select options to see price
                  </div>
                )}
              </div>
            </div>

            {/* Stock Status - VSCode style */}
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-vscode-textSecondary text-xs font-light ${getStockColor()}`}>
                {getStockText()}
              </span>
            </div>
          </div>
        </div>

        {/* Variations Selection - Always visible for products with variations */}
        {hasVariations && (
          <div className="flex flex-col gap-2 pt-1 border-t border-vscode-border flex-1">
            <div className="flex flex-col gap-2 pt-2">
              
              {/* Flavor Selection - Fixed height container */}
              <div className="flex flex-col gap-1 flex-1">
                <span className="text-vscode-textSecondary text-sm font-medium">Flavor:</span>
                <div className="min-h-[84px] flex flex-col justify-start">
                  {flavors.length > 0 ? (
                    <div className="flex gap-1 w-full flex-wrap">
                      {flavors.map((flavor) => {
                        // Check if this flavor is selected in the combined selection
                        const isSelected = selectedOption?.includes(`flavor-${flavor}`);
                        return (
                          <button
                            key={flavor}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onOptionSelect) {
                                onOptionSelect(product.id, `flavor-${flavor}`);
                              }
                            }}
                            className={`flex-1 min-w-[calc(50%-0.125rem)] px-1 py-2 text-xs font-light transition-all duration-150 hover:scale-105 active:scale-95 min-h-[40px] flex flex-col items-center justify-center border rounded ${
                              isSelected
                                ? 'bg-vscode-accent text-white border-vscode-accent'
                                : 'bg-vscode-panel text-vscode-textSecondary hover:bg-vscode-bgTertiary hover:text-vscode-text border-vscode-border hover:border-vscode-accent/50'
                            }`}
                          >
                            <span className="text-xs font-medium text-center whitespace-nowrap">
                              {flavor}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    // For products without flavors (like Riptide), show "Original" as the only option
                    <div className="flex gap-1 w-full">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOptionSelect) {
                            onOptionSelect(product.id, 'flavor-Original');
                          }
                        }}
                        className={`flex-1 px-1 py-2 text-xs font-light transition-all duration-150 hover:scale-105 active:scale-95 min-h-[40px] flex flex-col items-center justify-center border rounded ${
                          selectedOption?.includes('flavor-Original')
                            ? 'bg-vscode-accent text-white border-vscode-accent'
                            : 'bg-vscode-panel text-vscode-textSecondary hover:bg-vscode-bgTertiary hover:text-vscode-text border-vscode-border hover:border-vscode-accent/50'
                        }`}
                      >
                        <span className="text-xs font-medium text-center whitespace-nowrap">
                          Original
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* For products without variations, add spacer to maintain some consistency */}
        {!hasVariations && (
          <div className="flex-1 min-h-[60px]"></div>
        )}

        {/* Pack Size Selection - Always directly above Add to Cart button */}
        {hasVariations && packSizes.length > 0 && (
          <div className="flex flex-col gap-1 pt-2 border-t border-vscode-border">
            <span className="text-vscode-textSecondary text-sm font-medium">Pack Size:</span>
            <div className="flex gap-1 w-full">
              {packSizes.map((packSize) => {
                // Check if this pack size is selected in the combined selection
                const isSelected = selectedOption?.includes(`pack-${packSize}`);
                return (
                  <button
                    key={packSize}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOptionSelect) {
                        onOptionSelect(product.id, `pack-${packSize}`);
                      }
                    }}
                    className={`flex-1 px-1 py-2 text-xs font-light transition-all duration-150 hover:scale-105 active:scale-95 min-h-[40px] flex flex-col items-center justify-center border rounded ${
                      isSelected
                        ? 'bg-vscode-accent text-white border-vscode-accent'
                        : 'bg-vscode-panel text-vscode-textSecondary hover:bg-vscode-bgTertiary hover:text-vscode-text border-vscode-border hover:border-vscode-accent/50'
                    }`}
                  >
                    <span className="text-xs font-medium text-center whitespace-nowrap">
                      {packSize}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Add to Cart Button - Fixed at bottom of card */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleAddToCart}
            disabled={!showPrice || stockStatus === 'outofstock'}
            className={`w-full px-4 py-2 border text-sm font-light transition-all duration-300 min-h-[40px] rounded ${
              !showPrice || stockStatus === 'outofstock'
                ? 'bg-vscode-panel border-vscode-border text-vscode-textMuted cursor-not-allowed'
                : 'bg-vscode-accent hover:bg-vscode-accentHover border-vscode-accent text-white hover:scale-[1.02] active:scale-95 shadow-vscode hover:shadow-vscode-lg'
            }`}
          >
            {stockStatus === 'outofstock'
              ? 'Out of Stock'
              : !showPrice 
                ? 'Select Options First' 
                : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  )
} 