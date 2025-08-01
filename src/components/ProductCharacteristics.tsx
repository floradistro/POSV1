import React from 'react'
import { useACFFields } from '../hooks/useACFFields'

interface ProductCharacteristicsProps {
  productId: number
}

export function ProductCharacteristics({ productId }: ProductCharacteristicsProps) {
  const { acfFields, loading } = useACFFields(productId)

  if (loading) {
    return null
  }

  // Define priority fields for different product types
  const priorityFields = [
    'nose', 'effects', 'terpene',           // Cannabis flower characteristics
    'strength_mg', 'acf_effects', 'effects', // Edibles characteristics  
    'flavor', 'potency', 'type',            // General product characteristics
    'brand', 'category', 'strength'         // Additional important fields
  ]

  // Find the top 3 most important fields that exist for this product
  const availableFields = acfFields.filter(field => 
    priorityFields.includes(field.key) && 
    field.value && 
    field.value.toString().trim() !== ''
  )

  // Sort by priority order and take first 3
  const topFields = priorityFields
    .map(key => availableFields.find(field => field.key === key))
    .filter((field): field is NonNullable<typeof field> => Boolean(field))
    .slice(0, 3)

  // Only show if we have at least one field
  if (topFields.length === 0) {
    return null
  }

  return (
    <div className="px-2 mb-2">
      <div className={`grid gap-2 text-xs ${
        topFields.length === 1 ? 'grid-cols-1' : 
        topFields.length === 2 ? 'grid-cols-2' : 
        'grid-cols-3'
      }`}>
        {topFields.map((field) => (
          <div key={field.key} className="bg-background-secondary/30 border border-white/[0.04] rounded-md p-2">
            <span className="text-text-tertiary block">{field.label}</span>
            <span className="text-text-primary font-medium">{field.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
} 