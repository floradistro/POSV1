import { Plus } from 'lucide-react'
import Image from 'next/image'

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
function getACFValue(product: FloraProduct, key: string): string | undefined {
  const metaData = product.meta_data?.find(meta => meta.key === key)
  return metaData?.value?.toString()
}

function getStockStatus(product: FloraProduct): 'instock' | 'outofstock' | 'onbackorder' {
  return product.stock_status || 'instock'
}

interface EdibleProductCardProps {
  product: FloraProduct
  onAddToCart: (product: FloraProduct) => void
}

export function EdibleProductCard({ product, onAddToCart }: EdibleProductCardProps) {
  const price = parseFloat(product.sale_price || product.price)
  const regularPrice = parseFloat(product.regular_price)
  const hasDiscount = product.on_sale && price < regularPrice
  const stockStatus = getStockStatus(product)

  // Get ACF fields for edible products
  const strengthMg = getACFValue(product, 'strength_mg') || getACFValue(product, 'thca_%') || '10'
  const effects = getACFValue(product, 'effects') || 'Relaxing'

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
    <div className="group relative transition-all duration-300 opacity-100 translate-y-0 border-r border-b border-vscode-border hover:bg-vscode-bgSecondary/30">
      <div 
        className="p-1.5 relative transition-all duration-200"
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

            {/* Gummy indicator for gummy products */}
            {product.name.toLowerCase().includes('gummy') && (
              <div className="absolute bottom-1 right-1 w-8 h-8 md:w-10 md:h-10 opacity-100 transition-all duration-300 transform group-hover/image:scale-110 shadow-lg flex items-center justify-center">
                <img src="/icons/newGummy.webp" alt="Gummy indicator" className="w-full h-full object-contain" />
              </div>
            )}
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
                  <span className="text-vscode-accent font-medium text-sm">{strengthMg}</span>
                  <span className="text-vscode-accent/70 text-xs">mg</span>
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

            {/* Price, Stock and Add Button - VSCode style */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <div className="text-vscode-text font-light text-base">
                  <span className="text-vscode-accent">$</span>{price.toFixed(2)}
                  {hasDiscount && (
                    <span className="text-vscode-textMuted text-sm line-through ml-1">${regularPrice.toFixed(2)}</span>
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
                disabled={stockStatus === 'outofstock'}
                className={`p-1.5 rounded transition-all duration-200 ${
                  stockStatus === 'outofstock'
                    ? 'bg-vscode-bgTertiary text-vscode-textMuted cursor-not-allowed'
                    : 'bg-vscode-accent/20 hover:bg-vscode-accent border border-vscode-accent/30 hover:border-vscode-accent text-vscode-accent hover:text-white hover:scale-110 shadow-vscode'
                }`}
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 