'use client'

import { useQuery } from '@tanstack/react-query'
import { floraAPI, FloraProduct } from '@/lib/woocommerce'
import { ProductCard } from './ProductCard'
import { Loader2 } from 'lucide-react'

interface ProductGridProps {
  category: string | null
  searchQuery: string
  onAddToCart: (product: FloraProduct) => void
}

export function ProductGrid({ category, searchQuery, onAddToCart }: ProductGridProps) {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', category, searchQuery],
    queryFn: () =>
      floraAPI.getProducts({
        category: category || undefined,
        search: searchQuery || undefined,
      }),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const filteredProducts = products.filter((product: FloraProduct) => {
    if (searchQuery) {
      return product.name.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  if (filteredProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">No products found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {filteredProducts.map((product: FloraProduct) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  )
} 