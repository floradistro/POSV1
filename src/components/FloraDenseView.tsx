'use client'

import React, { useState, useEffect, useRef } from 'react'

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
function getProductPrice(product: FloraProduct, selectedVariation?: string): number {
  if (selectedVariation && product.variationsData) {
    const variation = product.variationsData.find((v: any) => 
      v.attributes.some((attr: any) => attr.option === selectedVariation)
    )
    if (variation) {
      return parseFloat(variation.price || '0')
    }
  }
  return parseFloat(product.price || '0')
}

function getProductImage(product: FloraProduct): string {
  return product.images?.[0]?.src || '/flora_chip_optimized.webp'
}

function getStockStatus(product: FloraProduct): 'instock' | 'outofstock' | 'onbackorder' {
  return product.stock_status || 'instock'
}

function getProductSizes(product: FloraProduct): string[] {
  if (!product.attributes) return []
  
  const sizeAttribute = product.attributes.find(attr => 
    attr.name.toLowerCase() === 'size' || 
    attr.name.toLowerCase() === 'weight' ||
    attr.name.toLowerCase() === 'amount'
  )
  
  return sizeAttribute?.options || []
}

interface FloraDenseViewProps {
  products: FloraProduct[]
  selectedOptions: Record<number, string>
  onAddToCart: (product: FloraProduct) => void
  onProductClick: (product: FloraProduct) => void
  onOptionSelect: (productId: number, option: string) => void
}

// Product Image Component matching Flora's exact styling
const ProductImage = ({ product, isLoaded, onLoad, onClick }: {
  product: FloraProduct
  isLoaded: boolean
  onLoad: () => void
  onClick: (e: React.MouseEvent) => void
}) => {
  const productImage = getProductImage(product)
  const productCategory = product.categories?.[0]?.slug || ''

  return (
    <div
      className="relative w-25 h-25 md:w-24 md:h-24 flex-shrink-0 overflow-hidden cursor-pointer group/image bg-black/20"
      onClick={(e) => { e.stopPropagation(); onClick(e) }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 animate-shimmer"></div>
      )}
      <img
        src={productImage}
        alt={product.name}
        className={`w-full h-full object-cover transition-all duration-300 group-hover/image:scale-110 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        loading="lazy"
        onLoad={onLoad}
        onError={(e) => {
          const target = e.target as HTMLImageElement
          target.src = '/flora_chip_optimized.webp'
        }}
      />
      {productCategory === 'vape' && isLoaded && (
        <div className="absolute bottom-1 right-1 w-8 h-8 md:w-10 md:h-10 opacity-100 transition-all duration-300 transform group-hover/image:scale-110 shadow-lg flex items-center justify-center">
          <img src="/icons/vapeicon2.png" alt="Vape indicator" className="w-full h-full object-contain" />
        </div>
      )}
    </div>
  )
}

// Product Info Component matching Flora's styling
const ProductInfo = ({ product, isExpanded }: {
  product: FloraProduct
  isExpanded: boolean
}) => {
  // Extract product metadata
  const thcaValue = product.meta_data?.find(meta => meta.key === 'thca_%')?.value
  const noseValue = product.meta_data?.find(meta => meta.key === 'nose')?.value
  const strainTypeValue = product.meta_data?.find(meta => meta.key === 'strain_type')?.value
  const lineageValue = product.meta_data?.find(meta => meta.key === 'lineage')?.value

  const getCategoryColor = (category: string) => {
    const cat = category.toLowerCase()
    if (cat.includes('balance')) return 'text-blue-300 bg-blue-500/20'
    if (cat.includes('relax')) return 'text-purple-300 bg-purple-500/20'
    if (cat.includes('energize')) return 'text-green-300 bg-green-500/20'
    return 'text-emerald-300 bg-emerald-500/20'
  }

  const formatCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()
  }

  return (
    <div className="flex-1 min-w-0 relative">
      <div className="min-h-[3.5rem] flex flex-col">
        <h3 className="font-light text-white/95 text-sm md:text-base mb-1.5 leading-tight group-hover:text-white transition-colors duration-300">
          {product.name}
          {lineageValue && (
            <span className="block text-xs text-white/60 font-light mt-0.5 italic line-clamp-1 truncate">
              {lineageValue}
            </span>
          )}
        </h3>
      </div>

      {/* Compact field grid - Flora's exact layout */}
      <div className="flex gap-0.5 mb-1.5">
        {/* THC/Strength Container */}
        <div className="p-0.5 border border-white/[0.02] flex flex-col justify-between min-h-[2rem] flex-1" style={{ background: '#2a2a2a' }}>
          <span className="text-white/70 text-xs font-light tracking-wide block mb-0">
            {product.categories?.[0]?.slug === 'edible' ? 'MG' : product.categories?.[0]?.slug === 'vape' ? 'THC' : 'THCa'}
          </span>
          <span className="text-green-400 text-xs hover:text-green-300 transition-colors duration-300">
            {thcaValue ? `${thcaValue}%` : 'N/A'}
          </span>
        </div>

        {/* Type/Category Container */}
        <div className="p-0.5 border border-white/[0.02] flex flex-col justify-between min-h-[2rem] flex-1" style={{ background: '#2a2a2a' }}>
          <div className="flex-1">
            <span className="text-white/70 text-xs font-light tracking-wide block mb-0">Type</span>
            <span className="text-xs font-light tracking-wide text-white/90">
              {formatCategory(strainTypeValue || product.categories?.[0]?.name || 'Cannabis')}
            </span>
          </div>
        </div>

        {/* Nose Container */}
        {noseValue && (
          <div className="p-0.5 border border-white/[0.02] flex flex-col justify-between min-h-[2rem] flex-1" style={{ background: '#2a2a2a' }}>
            <span className="text-white/70 text-xs font-light tracking-wide block mb-0">Nose</span>
            <span className="text-white/90 text-xs hover:text-white transition-colors duration-300 capitalize truncate">
              {noseValue}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// Hooks
const useMobileDetection = () => {
  const [isMobile, setIsMobile] = React.useState(false)
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  return isMobile
}

export default function FloraDenseView({ products, onAddToCart, onProductClick, selectedOptions = {}, onOptionSelect }: FloraDenseViewProps) {
  // Initialize all products as expanded by default
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set())
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())
  const [localSelectedOptions, setLocalSelectedOptions] = useState<Record<number, string>>({})
  const productRefs = useRef<{[key: number]: HTMLDivElement | null}>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const isMobile = useMobileDetection()

  // Initialize all products as expanded but with NO default selections
  useEffect(() => {
    const allProductIds = new Set<number>()
    
    products.forEach(product => {
      // Add all products to expanded set
      allProductIds.add(product.id)
    })
    
    // Set all products as expanded
    setExpandedProducts(allProductIds)
  }, [products])

  // Handle clicking outside to deselect options
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // Clear all selections when clicking outside
        setLocalSelectedOptions({})
        // Also clear parent component selections if callback exists
        if (onOptionSelect) {
          Object.keys(localSelectedOptions).forEach(productId => {
            onOptionSelect(parseInt(productId), '')
          })
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [localSelectedOptions, onOptionSelect])

  const getFadeClass = (productId: number) => {
    // Remove fade effect since all cards are always expanded
    return ''
  }

  const getCardStyling = (productId: number) => {
    // Sharp rectangular cards with no rounding
    return 'transition-all duration-200'
  }

  // Remove toggle functionality - cards are always expanded
  const toggleExpanded = (productId: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Do nothing - cards stay expanded
  }

  const handleImageLoad = (productId: number) => {
    setLoadedImages(prev => new Set(Array.from(prev).concat([productId])))
  }

  const handleImageClick = (product: FloraProduct, e: React.MouseEvent) => {
    e.stopPropagation()
    onProductClick(product)
  }

  const handleOptionSelect = (productId: number, option: string) => {
    setLocalSelectedOptions(prev => ({
      ...prev,
      [productId]: option
    }))
    onOptionSelect?.(productId, option)
  }

  const getSelectedOption = (productId: number): string => {
    return selectedOptions[productId] || localSelectedOptions[productId] || ''
  }

  const productPrice = (product: FloraProduct) => {
    const selectedOption = getSelectedOption(product.id)
    if (!selectedOption) return 0
    return getProductPrice(product, selectedOption)
  }

  return (
    <section ref={containerRef} className="relative bg-[#1a1a1a] overflow-hidden -mt-px" style={{ boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.07)' }}>
      <div className="w-full relative z-10">
        <div className="w-full grid grid-cols-1 gap-0 md:grid-cols-2">
          {products.map((product, index) => {
            const isImageLoaded = loadedImages.has(product.id)
            const isExpanded = expandedProducts.has(product.id)
            const productStockStatus = getStockStatus(product)
            const selectedOption = getSelectedOption(product.id)
            const price = productPrice(product)
            const sizes = getProductSizes(product)
            const productCategory = product.categories?.[0]?.slug || ''

            return (
              <div
                key={product.id}
                ref={(el) => {
                  productRefs.current[product.id] = el
                }}
                className={`group relative transition-all duration-200 opacity-100 translate-y-0 border-r border-b border-white/[0.16] ${
                  isExpanded ? 'z-10' : 'z-0'
                } ${getFadeClass(product.id)} h-full`}
                style={{ transitionDelay: `${Math.min(index * 50, 600)}ms` }}
              >
                <div 
                  className={`${getCardStyling(product.id)} p-1.5 relative ${isExpanded ? 'pb-4' : ''} h-full flex flex-col`}
                  style={{
                    background: '#2a2a2a',
                    backdropFilter: 'blur(20px) saturate(120%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(120%)'
                  }}
                >
                  {isMobile && isExpanded && (
                    <div className="absolute top-0 left-0 h-full bg-gradient-to-b from-red-500 to-red-600" style={{ width: '1px' }}></div>
                  )}
                  
                  <div className="flex items-start gap-1.5 mb-3 md:mb-4">
                    <ProductImage
                      product={product}
                      isLoaded={isImageLoaded}
                      onLoad={() => handleImageLoad(product.id)}
                      onClick={(e) => handleImageClick(product, e)}
                    />

                    <ProductInfo
                      product={product}
                      isExpanded={isExpanded}
                    />
                  </div>

                  {/* Remove text indicator since options are always visible */}

                  <div className="flex justify-between items-end mb-2">
                    <div className="flex flex-col">
                      {/* Stock Status */}
                      <div className="text-xs mb-1">
                        <span className={`${
                          productStockStatus === 'outofstock' ? 'text-red-400' : 
                          productStockStatus === 'onbackorder' ? 'text-orange-400' : 
                          'text-green-400'
                        }`}>
                          {productStockStatus === 'outofstock' ? 'Out of Stock' : 
                           product.stock_quantity !== null ? `${product.stock_quantity} in stock` :
                           'In Stock'}
                        </span>
                      </div>
                    </div>
                    <div className="text-white/95 font-light text-lg md:text-xl group-hover:text-white transition-colors duration-300">
                      {selectedOption ? (
                        <>
                          <span className="text-green-400">$</span>
                          <span key={`${product.id}-${selectedOption}-${price}`}>
                            {price.toFixed(2)}
                          </span>
                          <span className="text-xs text-white/60">
                            /{productCategory === 'vape' ? (selectedOption === '1' ? 'vape' : 'vapes') : selectedOption}
                          </span>
                        </>
                      ) : (
                        <span className="text-white/50 text-sm">Select option</span>
                      )}
                    </div>
                  </div>

                  {/* Always Visible Options Section - Flex-grow to fill remaining space */}
                  <div className="overflow-visible max-h-none opacity-100 flex-1 flex flex-col">
                    <div className="flex flex-col gap-3 pt-2 translate-y-0 opacity-100 flex-1">
                      {/* Size/Weight/Quantity Selector - Show for all products */}
                      <div className="flex flex-col gap-2 flex-1">
                        <span className="text-white/70 text-sm font-medium">
                          {productCategory === 'vape' ? 'Quantity:' : 
                           productCategory === 'edible' ? 'Qty:' : 
                           productCategory === 'moonwater' ? 'Flavor:' :
                           'Weight:'}
                        </span>
                        {sizes.length > 0 ? (
                          <div className={`grid gap-0.5 w-full ${
                            sizes.length <= 4 ? 'grid-cols-4' : 
                            sizes.length <= 5 ? 'grid-cols-5' : 
                            'grid-cols-6'
                          }`}>
                            {sizes.map((size) => {
                              const isSelected = selectedOption === size
                              const sizePrice = getProductPrice(product, size)
                              
                              return (
                                <button
                                  key={size}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    // Toggle selection - if already selected, deselect it
                                    if (isSelected) {
                                      handleOptionSelect(product.id, '')
                                    } else {
                                      handleOptionSelect(product.id, size)
                                    }
                                  }}
                                  className={`px-1 py-2 text-xs font-light transition-all duration-150 hover:scale-105 active:scale-95 min-h-[40px] flex flex-col items-center justify-center ${
                                    isSelected
                                      ? 'bg-white/20 text-white border border-white/30'
                                      : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white/90'
                                  }`}
                                >
                                  <span className="text-xs font-medium">
                                    {size}
                                  </span>
                                  <span className="text-[10px] opacity-70">
                                    ${sizePrice.toFixed(0)}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-white/60 text-sm">
                            <p>Category: {productCategory}</p>
                            <p>Has Options: {product.has_options ? 'Yes' : 'No'}</p>
                            <p>Variations: {product.variationsData?.length || 0}</p>
                          </div>
                        )}
                      </div>

                      {/* Action Button - Always at bottom */}
                      <div className="flex gap-2 mt-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (selectedOption) {
                              onAddToCart(product)
                            }
                          }}
                          disabled={productStockStatus === 'outofstock' || !selectedOption}
                          className={`w-full px-4 py-2 border text-sm font-light transition-all duration-300 min-h-[40px] ${
                            productStockStatus === 'outofstock' || !selectedOption
                              ? 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
                              : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-white/80 hover:text-white hover:scale-[1.02] active:scale-95'
                          }`}
                        >
                          {productStockStatus === 'outofstock' 
                            ? 'Out of Stock' 
                            : !selectedOption 
                              ? 'Select Option First' 
                              : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {products.length === 0 && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-6xl mb-4">🌿</div>
            <p className="text-luxury-lg text-text-primary font-light">No products found</p>
            <p className="text-luxury-sm text-text-tertiary mt-2">Try selecting a different category</p>
          </div>
        </div>
      )}
    </section>
  )
} 