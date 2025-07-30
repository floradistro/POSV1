import { FloraProduct } from '@/lib/woocommerce'
import { Plus } from 'lucide-react'
import Image from 'next/image'

interface ProductCardProps {
  product: FloraProduct
  onAddToCart: (product: FloraProduct) => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const price = parseFloat(product.sale_price || product.price)
  const regularPrice = parseFloat(product.regular_price)
  const hasDiscount = product.on_sale && price < regularPrice

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
      </div>
      
      <h3 className="font-medium text-vscode-text text-sm mb-2 line-clamp-2 group-hover:text-white transition-colors">{product.name}</h3>
      
      <div className="flex items-center justify-between">
        <div>
          <p className="text-vscode-text font-bold">${price.toFixed(2)}</p>
          {hasDiscount && (
            <p className="text-vscode-textMuted text-sm line-through">${regularPrice.toFixed(2)}</p>
          )}
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation()
            onAddToCart(product)
          }}
          className="bg-vscode-accent hover:bg-vscode-accentHover text-white p-2 rounded-lg transition-all duration-300 group-hover:scale-110 shadow-vscode hover:shadow-vscode-lg"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
} 