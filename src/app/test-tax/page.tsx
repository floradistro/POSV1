'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function TestTaxPage() {
  const { user, store } = useAuth()
  const [taxData, setTaxData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [directApiResponse, setDirectApiResponse] = useState<any>(null)

  const testEndpoint = async () => {
    if (!user?.storeId) {
      setError('No store ID available. Please log in first.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Test through Next.js API route
      console.log('Testing through Next.js API route...')
      const response = await fetch(`/api/tax-rates/${user.storeId}`)
      const data = await response.json()
      setTaxData(data)
      console.log('Next.js API response:', data)

      // Test direct API call
      console.log('Testing direct WordPress API call...')
      const directUrl = `http://api.floradistro.com/wp-json/wc/v3/addify_headless_inventory/location/${user.storeId}/tax-rates`
      const directResponse = await fetch(directUrl, {
        headers: {
          'Authorization': 'Basic ' + btoa('ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5:cs_38194e74c7ddc5d72b6c32c70485728e7e529678')
        }
      })
      const directData = await directResponse.json()
      setDirectApiResponse(directData)
      console.log('Direct API response:', directData)

    } catch (err) {
      console.error('Error testing tax endpoint:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Tax Endpoint Test</h1>
        
        <div className="mb-6 p-4 bg-gray-900 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Current User Info</h2>
          {user ? (
            <div>
              <p>Email: {user.email}</p>
              <p>Store ID: {user.storeId}</p>
              <p>Store Name: {store?.name || 'Unknown'}</p>
            </div>
          ) : (
            <p className="text-red-500">Not logged in</p>
          )}
        </div>

        <button
          onClick={testEndpoint}
          disabled={loading || !user}
          className="mb-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded-lg font-semibold"
        >
          {loading ? 'Testing...' : 'Test Tax Endpoint'}
        </button>

        {error && (
          <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Error</h3>
            <p>{error}</p>
          </div>
        )}

        {taxData && (
          <div className="mb-6 p-4 bg-gray-900 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Next.js API Response</h3>
            <pre className="text-sm overflow-auto">{JSON.stringify(taxData, null, 2)}</pre>
          </div>
        )}

        {directApiResponse && (
          <div className="mb-6 p-4 bg-gray-900 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Direct WordPress API Response</h3>
            <pre className="text-sm overflow-auto">{JSON.stringify(directApiResponse, null, 2)}</pre>
          </div>
        )}

        <div className="mt-8 p-4 bg-gray-900 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">Endpoint URLs</h3>
          <p className="text-sm mb-2">
            Next.js API: <code className="bg-gray-800 px-2 py-1 rounded">/api/tax-rates/{user?.storeId || '{storeId}'}</code>
          </p>
          <p className="text-sm">
            WordPress API: <code className="bg-gray-800 px-2 py-1 rounded">http://api.floradistro.com/wp-json/wc/v3/addify_headless_inventory/location/{user?.storeId || '{storeId}'}/tax-rates</code>
          </p>
        </div>
      </div>
    </div>
  )
} 