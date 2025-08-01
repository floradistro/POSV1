'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Store, Terminal, AuthContextType, LoginRequest } from '../types/auth'
import { authService } from '../lib/auth'
import toast from 'react-hot-toast'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [store, setStore] = useState<Store | null>(null)
  const [terminal, setTerminal] = useState<Terminal | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize auth state from localStorage
    const initializeAuth = () => {
      const storedUser = authService.getStoredUser()
      const storedStore = authService.getStoredStore()
      const storedTerminal = authService.getStoredTerminal()
      const storedToken = authService.getToken()

      if (storedUser && storedStore && storedTerminal && storedToken) {
        setUser(storedUser)
        setStore(storedStore)
        setTerminal(storedTerminal)
        setToken(storedToken)
      }

      setIsLoading(false)
    }

    initializeAuth()
  }, [])

  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true)
      const response = await authService.login(credentials)
      
      setUser(response.user)
      setStore(response.store)
      setTerminal(response.terminal)
      setToken(response.token)
      
      toast.success(`Welcome back, ${response.user.firstName}!`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed'
      toast.error(message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
      setUser(null)
      setStore(null)
      setTerminal(null)
      setToken(null)
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
      // Clear state even if API call fails
      setUser(null)
      setStore(null)
      setTerminal(null)
      setToken(null)
    }
  }

  const refreshToken = async () => {
    try {
      const newToken = await authService.refreshToken()
      setToken(newToken)
    } catch (error) {
      console.error('Token refresh failed:', error)
      await logout()
    }
  }

  const value: AuthContextType = {
    user,
    store,
    terminal,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
    refreshToken,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Permission hook
export function usePermissions() {
  const { user } = useAuth()
  
  const hasPermission = (permission: { action: string; resource: string }) => {
    if (!user) return false
    return authService.hasPermission(user, permission)
  }

  const canAccessStore = (storeId: string) => {
    if (!user) return false
    return authService.canAccessStore(user, storeId)
  }

  return {
    hasPermission,
    canAccessStore,
  }
} 