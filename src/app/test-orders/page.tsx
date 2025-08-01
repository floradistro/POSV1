'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'
import { AppWrapper } from '@/components/AppWrapper'

export default function TestOrdersPage() {
  const { user, store, token, isLoading } = useAuth()
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testOrdersAPI = async () => {
    setLoading(true)
    try {
      console.log('Testing orders API...')
      console.log('User:', user)
      console.log('Store:', store)
      console.log('Token:', token ? 'Present' : 'Missing')

      const params = new URLSearchParams({
        store_id: 'Blowing Rock',
        per_page: '5'
      })

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`/api/orders?${params}`, { headers })
      
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response:', errorText)
        setTestResult({ error: errorText, status: response.status })
        return
      }

      const data = await response.json()
      console.log('Success! Orders:', data)
      setTestResult({ success: true, data, count: data.length })

    } catch (error) {
      console.error('Test failed:', error)
      setTestResult({ error: error instanceof Error ? error.message : String(error) })
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return <div className="p-8">Loading auth...</div>
  }

  return (
    <AppWrapper>
      <div className="min-h-screen bg-background-primary text-platinum p-8">
      <h1 className="text-2xl font-bold mb-6">Orders API Test</h1>
      
      <div className="space-y-4 mb-6">
        <div>
          <strong>Auth Status:</strong>
          <div className="ml-4">
            <div>User: {user ? `${user.firstName} ${user.lastName} (${user.email})` : 'Not logged in'}</div>
            <div>Store: {store ? `${store.name} (${store.id})` : 'No store'}</div>
            <div>Token: {token ? 'Present' : 'Missing'}</div>
          </div>
        </div>
      </div>

      <button
        onClick={testOrdersAPI}
        disabled={loading}
        className="bg-platinum text-background-primary px-4 py-2 rounded hover:bg-platinum/90 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Orders API'}
      </button>

      {testResult && (
        <div className="mt-6 p-4 bg-background-secondary rounded">
          <h3 className="font-bold mb-2">Test Result:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
    </AppWrapper>
  )
} 