import { FloraProduct, determineProductCategory } from '@/lib/woocommerce'
import { MoonwaterProductCard } from './MoonwaterProductCard'
import { EdibleProductCard } from './EdibleProductCard'
import FloraDenseView from './FloraDenseView'
import { useState } from 'react'

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
            onOptionSelect={onOptionSelect}
          />
        )}
      </div>
    </section>
  )
} 