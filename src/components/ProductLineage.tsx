import React from 'react'
import { useACFFields } from '../hooks/useACFFields'
import { FloraProduct } from '../lib/woocommerce'

interface ProductLineageProps {
  productId: number
  product?: FloraProduct
}

export function ProductLineage({ productId, product }: ProductLineageProps) {
  const { acfFields, loading } = useACFFields(productId)

  if (loading) {
    return null // Don't show loading state for lineage
  }

  // Find the lineage field first
  const lineageField = acfFields.find(field => field.key === 'lineage')
  
  // If lineage exists, show it
  if (lineageField && lineageField.value) {
    return (
      <p className="text-xs text-text-tertiary mt-0.5 line-clamp-1">
        {lineageField.value}
      </p>
    )
  }

  // If no lineage, look for category in ACF fields
  const categoryField = acfFields.find(field => field.key === 'category')
  
  if (categoryField && categoryField.value) {
    return (
      <p className="text-xs text-text-tertiary mt-0.5 line-clamp-1 capitalize">
        {categoryField.value}
      </p>
    )
  }

  // If no ACF category, check WooCommerce categories
  if (product && product.categories && product.categories.length > 0) {
    // Get the first category name (usually the most specific one)
    const categoryName = product.categories[0].name
    return (
      <p className="text-xs text-text-tertiary mt-0.5 line-clamp-1 capitalize">
        {categoryName}
      </p>
    )
  }

  return null
} 