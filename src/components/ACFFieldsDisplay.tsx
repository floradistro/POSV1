import React from 'react'
import Image from 'next/image'
import { useACFFields } from '../hooks/useACFFields'

interface ACFField {
  key: string
  label: string
  value: any
  type: string
}

interface ACFFieldsDisplayProps {
  productId: number
  productName: string
}

export function ACFFieldsDisplay({ productId, productName }: ACFFieldsDisplayProps) {
  const { acfFields, loading, error } = useACFFields(productId)

  if (loading) {
    return (
      <div className="mt-3 p-2 bg-background-secondary/50 rounded border border-white/[0.04]">
        <div className="text-xs text-text-tertiary animate-pulse">
          Loading product details...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-3 p-2 bg-red-500/10 rounded border border-red-500/20">
        <div className="text-xs text-red-400">
          Failed to load product details
        </div>
      </div>
    )
  }

  if (!acfFields || acfFields.length === 0) {
    return null
  }

  const renderFieldValue = (field: ACFField) => {
    switch (field.type) {
      case 'boolean':
        return (
          <span className={`px-2 py-1 rounded text-xs ${
            field.value === 'Yes' 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-red-500/20 text-red-400'
          }`}>
            {field.value}
          </span>
        )
      
      case 'image':
        if (field.value?.url) {
          return (
            <div className="relative w-16 h-16 rounded overflow-hidden">
              <Image
                src={field.value.url}
                alt={field.value.alt || field.label}
                fill
                className="object-cover"
              />
            </div>
          )
        }
        return <span className="text-text-tertiary text-xs">No image</span>
      
      case 'url':
        return (
          <a 
            href={field.value} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 text-xs underline"
          >
            View Link
          </a>
        )
      
      case 'array':
        return (
          <div className="flex flex-wrap gap-1">
            {field.value.split(', ').map((item: string, index: number) => (
              <span 
                key={index}
                className="px-2 py-1 bg-background-tertiary text-text-secondary rounded text-xs"
              >
                {item}
              </span>
            ))}
          </div>
        )
      
      case 'number':
        return (
          <span className="font-mono text-primary text-sm">
            {typeof field.value === 'number' ? field.value.toLocaleString() : field.value}
          </span>
        )
      
      case 'object':
        return (
          <details className="cursor-pointer">
            <summary className="text-xs text-text-tertiary hover:text-text-secondary">
              View Object
            </summary>
            <pre className="text-xs text-text-tertiary mt-1 p-2 bg-background-tertiary rounded overflow-auto max-h-20">
              {field.value}
            </pre>
          </details>
        )
      
      default:
        return (
          <span className="text-text-primary text-sm">
            {String(field.value)}
          </span>
        )
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="grid grid-cols-1 gap-2">
        {acfFields.filter((field: ACFField) => {
          // Fields shown in other components
          const excludedFields = [
            'lineage',           // Shown under product name
            'category',          // Shown under product name (when no lineage)
            'thca_%',           // Shown next to product name
            'strain_type',      // Shown next to product name
            // Priority fields shown in ProductCharacteristics
            'nose', 'effects', 'terpene',
            'strength_mg', 'acf_effects', 
            'flavor', 'potency', 'type',
            'brand', 'strength'
          ]
          return !excludedFields.includes(field.key)
        }).map((field: ACFField) => (
          <div 
            key={field.key}
            className="flex flex-col gap-1 p-2 bg-background-secondary/50 rounded border border-white/[0.04]"
          >
            <div className="text-xs text-text-secondary font-medium">
              {field.label}
            </div>
            <div className="flex-1">
              {renderFieldValue(field)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 