'use client'

import { useState, useEffect } from 'react'
import { Loader2, Store, Monitor, Mail, Lock, Eye, EyeOff, Building2, LogIn } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { AuthDebugger } from '../lib/debug-auth'
import toast from 'react-hot-toast'

interface Store {
  id: number
  name: string
  slug: string
  description: string
}

interface Terminal {
  id: string
  name: string
  storeId: string
  isActive: boolean
}

export function LoginForm() {
  const { login, isLoading } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    storeId: '',
    terminalId: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [stores, setStores] = useState<Store[]>([])
  const [loadingStores, setLoadingStores] = useState(true)

  // Predefined terminals for each store (no API call needed)
  const terminals: Terminal[] = [
    { id: 'terminal-1', name: 'Register 1', storeId: '', isActive: true },
    { id: 'terminal-2', name: 'Register 2', storeId: '', isActive: true },
    { id: 'terminal-3', name: 'Mobile Terminal', storeId: '', isActive: true },
  ]

  useEffect(() => {
    loadStores()
  }, [])

  const loadStores = async () => {
    try {
      setLoadingStores(true)
      console.log('🔍 Loading stores from Flora POS API...')
      
      const response = await fetch('/api/stores/public', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Stores loaded successfully:', data.length || 0)
        
        // API returns stores directly as an array, not wrapped in data.stores
        if (Array.isArray(data) && data.length > 0) {
          setStores(data)
        } else {
          console.error('❌ No stores found in API response')
          setStores([])
          toast.error('No stores available. Please contact administrator.')
        }
      } else {
        console.error('❌ Failed to load stores from API:', response.status, response.statusText)
        setStores([])
        toast.error('Failed to load stores. Please check your connection.')
      }
    } catch (error) {
      console.error('❌ Error loading stores:', error)
      setStores([])
      toast.error('Unable to connect to store API. Please try again.')
    } finally {
      setLoadingStores(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset terminal when store changes
      ...(name === 'storeId' ? { terminalId: '' } : {})
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.email || !formData.password || !formData.storeId || !formData.terminalId) {
      toast.error('Please fill in all fields')
      return
    }

    // Validate email format
    if (!formData.email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    try {
      console.log('🔐 Attempting login with Flora POS...')
      
      // Debug logging
      AuthDebugger.logEnvironment()
      await AuthDebugger.testConnection()
      
      await login({
        email: formData.email,
        password: formData.password,
        storeId: formData.storeId,
        terminalId: formData.terminalId,
      })
      
      toast.success('Login successful!')
      console.log('✅ Login completed successfully')
    } catch (error) {
      console.error('❌ Login failed:', error)
      
      // Additional debug info on failure
      console.log('🔍 Running additional auth debug...')
      await AuthDebugger.testAuth(formData.email, formData.password, formData.storeId, formData.terminalId)
      
      toast.error(error instanceof Error ? error.message : 'Login failed. Please try again.')
    }
  }

  const selectedStore = stores.find(store => store.id.toString() === formData.storeId)

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-background-secondary border border-border-default mb-6">
            <img
              src="/logo.png"
              alt="Flora Distro"
              className="w-12 h-12 object-contain"
            />
          </div>
          <h2 className="text-4xl font-graffiti text-text-primary mb-2">Flora Distro</h2>
          <p className="text-sm text-text-secondary">Sign in to your store terminal</p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-text-tertiary" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-border-default placeholder-text-tertiary text-text-primary bg-background-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent sm:text-sm transition-colors duration-200"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-text-tertiary" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full pl-10 pr-10 py-3 border border-border-default placeholder-text-tertiary text-text-primary bg-background-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent sm:text-sm transition-colors duration-200"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-text-tertiary hover:text-text-secondary transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-text-tertiary hover:text-text-secondary transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Store Selection */}
            <div>
              <label htmlFor="storeId" className="block text-sm font-medium text-text-secondary mb-2">
                Store Location
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-text-tertiary" />
                </div>
                <select
                  id="storeId"
                  name="storeId"
                  required
                  value={formData.storeId}
                  onChange={handleInputChange}
                  disabled={loadingStores || stores.length === 0}
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-border-default text-text-primary bg-background-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent sm:text-sm disabled:opacity-50 transition-colors duration-200"
                >
                  <option value="">
                    {loadingStores 
                      ? 'Loading stores from API...' 
                      : stores.length === 0 
                      ? 'No stores available - Check API connection'
                      : 'Select a store'
                    }
                  </option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name} ({store.description})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Terminal Selection */}
            <div>
              <label htmlFor="terminalId" className="block text-sm font-medium text-text-secondary mb-2">
                Terminal
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Monitor className="h-5 w-5 text-text-tertiary" />
                </div>
                <select
                  id="terminalId"
                  name="terminalId"
                  required
                  value={formData.terminalId}
                  onChange={handleInputChange}
                  disabled={!formData.storeId}
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-border-default text-text-primary bg-background-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent sm:text-sm disabled:opacity-50 transition-colors duration-200"
                >
                  <option value="">
                    {!formData.storeId ? 'Select a store first' : 'Select a terminal'}
                  </option>
                  {formData.storeId && terminals.map((terminal) => (
                    <option key={terminal.id} value={terminal.id}>
                      {terminal.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading || stores.length === 0 || !formData.email || !formData.password || !formData.storeId || !formData.terminalId}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-secondary hover:bg-secondary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LogIn className="h-5 w-5 text-white/80 group-hover:text-white" />
              </span>
              {isLoading ? 'Signing in...' : stores.length === 0 ? 'No stores available' : 'Sign in to POS'}
            </button>
          </div>

          {/* Store Info */}
          {selectedStore && (
            <div className="mt-4 p-4 bg-background-secondary rounded-lg border border-border-default">
              <div className="text-sm text-text-secondary">
                <div className="font-medium text-text-primary mb-1">Selected Store:</div>
                <div>{selectedStore.name}</div>
                <div className="text-text-tertiary">{selectedStore.description}</div>
              </div>
            </div>
          )}

          {/* API Status */}
          {stores.length === 0 && !loadingStores && (
            <div className="mt-4 p-4 bg-error/10 rounded-lg border border-error/30">
              <div className="text-sm text-error">
                <div className="font-medium">⚠️ API Connection Issue</div>
                <div className="text-xs mt-1 text-error/80">Unable to load stores from Flora POS API. Please check your connection or contact administrator.</div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
} 