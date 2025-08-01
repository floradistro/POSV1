import { MoonwaterProductCard } from './MoonwaterProductCard'
import { EdibleProductCard } from './EdibleProductCard'
import FloraDenseView from './FloraDenseView'
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

// Temporary category determination function
const determineProductCategory = (product: FloraProduct): string => {
  const categorySlug = product.categories?.[0]?.slug || ''
  if (categorySlug) return categorySlug
  
  const categoryName = product.categories?.[0]?.name.toLowerCase() || ''
  if (categoryName.includes('flower')) return 'flower'
  if (categoryName.includes('vape')) return 'vape'
  if (categoryName.includes('edible')) return 'edibles'
  if (categoryName.includes('concentrate')) return 'concentrate'
  if (categoryName.includes('moonwater')) return 'moonwater'
  
  return 'flower' // Default
}

interface SmartProductGridProps {
  products: FloraProduct[]
  selectedOptions?: Record<number, string>
  onAddToCart: (product: FloraProduct, selectedVariation?: string) => void
  onProductClick: (product: FloraProduct) => void
  onOptionSelect?: (productId: number, option: string) => void
  layoutMode?: 'grid' | 'single'
}

export function SmartProductGrid({ 
  products, 
  selectedOptions = {}, 
  onAddToCart, 
  onProductClick, 
  onOptionSelect,
  layoutMode = 'grid'
}: SmartProductGridProps) {
  
  // Separate products by category
  const moonwaterProducts: FloraProduct[] = []
  const edibleProducts: FloraProduct[] = []
  const otherProducts: FloraProduct[] = []

  products.forEach(product => {
    const category = determineProductCategory(product)
    if (category === 'moonwater') {
      moonwaterProducts.push(product)
    } else if (category === 'edible') {
      edibleProducts.push(product)
    } else {
      otherProducts.push(product)
    }
  })

  const handleAddToCart = (product: FloraProduct) => {
    // For moonwater products, get the selected variation (no defaults)
    const selectedOption = selectedOptions[product.id] || ''
    console.log(`🌙 SmartProductGrid: Adding to cart with option: ${selectedOption}`)
    onAddToCart(product, selectedOption)
  }

  const handleMoonwaterOptionSelect = (productId: number, option: string) => {
    console.log(`🌙 Option selected for product ${productId}: ${option}`)
    if (onOptionSelect) {
      onOptionSelect(productId, option)
    }
  }

  return (
    <section className="w-full relative bg-vscode-bgSecondary overflow-hidden -mt-px min-h-full border border-vscode-border" style={{ boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.3), 0 4px 6px rgba(0, 0, 0, 0.2)' }}>
      <div className="w-full relative z-10 min-h-full">
        
        {/* Moonwater Products - Always expanded */}
        {moonwaterProducts.length > 0 && (
          <div className={`w-full grid gap-0 ${
            layoutMode === 'single' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
          }`}>
            {moonwaterProducts.map(product => {
              const selectedOption = selectedOptions[product.id] || ''
              
              return (
                <MoonwaterProductCard
                  key={product.id}
                  product={product}
                  selectedOption={selectedOption}
                  isExpanded={true} // Always expanded
                  onAddToCart={handleAddToCart}
                  onToggleExpanded={() => {}} // No-op since always expanded
                  onOptionSelect={handleMoonwaterOptionSelect}
                />
              )
            })}
          </div>
        )}

        {/* Edible Products */}
        {edibleProducts.length > 0 && (
          <div className={`w-full grid gap-0 ${
            layoutMode === 'single' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
          }`}>
            {edibleProducts.map(product => (
              <EdibleProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}

        {/* Other Products (Flower, Vape, Concentrate, etc.) */}
        {otherProducts.length > 0 && (
          <FloraDenseView
            products={otherProducts}
            selectedOptions={selectedOptions}
            onAddToCart={onAddToCart}
            onProductClick={onProductClick}
            onOptionSelect={onOptionSelect || (() => {})}
          />
        )}
      </div>
    </section>
  )
} 