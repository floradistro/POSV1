import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'

export interface TaxRate {
  name: string
  rate: number
  type: 'percentage' | 'fixed'
  compound: 'yes' | 'no'
}

export interface LocationTaxRates {
  location_id: number
  location_name: string
  tax_rates: TaxRate[]
  total_rate: number
}

export function useTaxRates() {
  const { user } = useAuth()
  const storeId = user?.storeId

  return useQuery<LocationTaxRates>({
    queryKey: ['taxRates', storeId],
    queryFn: async () => {
      if (!storeId) {
        throw new Error('No store ID available')
      }

      const response = await fetch(`/api/tax-rates/${storeId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch tax rates')
      }

      return response.json()
    },
    enabled: !!storeId,
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
  })
}

export function calculateTaxAmount(
  subtotal: number,
  taxRates: TaxRate[]
): { taxAmount: number; taxBreakdown: Array<{ name: string; amount: number }> } {
  let taxAmount = 0
  const taxBreakdown: Array<{ name: string; amount: number }> = []

  // Separate compound and non-compound taxes
  const nonCompoundTaxes = taxRates.filter(rate => rate.compound !== 'yes')
  const compoundTaxes = taxRates.filter(rate => rate.compound === 'yes')

  // Calculate non-compound taxes first
  nonCompoundTaxes.forEach(rate => {
    let amount = 0
    if (rate.type === 'percentage') {
      amount = (subtotal * rate.rate) / 100
    } else {
      amount = rate.rate
    }
    taxAmount += amount
    taxBreakdown.push({ name: rate.name, amount })
  })

  // Calculate compound taxes (on subtotal + non-compound taxes)
  const baseForCompound = subtotal + taxAmount
  compoundTaxes.forEach(rate => {
    let amount = 0
    if (rate.type === 'percentage') {
      amount = (baseForCompound * rate.rate) / 100
    } else {
      amount = rate.rate
    }
    taxAmount += amount
    taxBreakdown.push({ name: rate.name, amount })
  })

  return { taxAmount, taxBreakdown }
} 