'use client'

import { useQuery } from '@tanstack/react-query'
import { floraAPI } from '@/lib/woocommerce'
import { cn } from '@/lib/utils'

interface CategoryFilterProps {
  selectedCategory: string | null
  onSelectCategory: (category: string | null) => void
}

export function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: floraAPI.getCategories,
  })

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <button
        onClick={() => onSelectCategory(null)}
        className={cn(
          "px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap",
          selectedCategory === null
            ? "bg-primary text-white"
            : "bg-background-tertiary text-text-secondary hover:bg-background-tertiary/80"
        )}
      >
        All Products
      </button>
      {categories.map((category: any) => (
        <button
          key={category.id}
          onClick={() => onSelectCategory(category.slug)}
          className={cn(
            "px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap",
            selectedCategory === category.slug
              ? "bg-primary text-white"
              : "bg-background-tertiary text-text-secondary hover:bg-background-tertiary/80"
          )}
        >
          {category.name}
        </button>
      ))}
    </div>
  )
} 