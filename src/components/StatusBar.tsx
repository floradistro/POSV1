'use client'

import { useState, useEffect } from 'react'

interface StatusBarProps {
  store?: {
    name: string
    address: string
  }
  user?: {
    name: string
    role: string
  }
  cartItemCount?: number
  productCount?: number
}

export function StatusBar({ store, user, cartItemCount = 0, productCount }: StatusBarProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }



  return (
    <div className="bg-vscode-bgSecondary border-t border-border-light px-2 py-1 flex items-center justify-between text-xs text-text-secondary flex-shrink-0">
      {/* Left Section */}
      <div className="flex items-center space-x-2">
        {/* Store Info */}
        {store && (
          <div className="flex items-center">
            <span>{store.name}</span>
          </div>
        )}

        {/* Product Count */}
        {productCount !== undefined && store && (
          <div className="flex items-center">
            <span>{productCount} products available</span>
          </div>
        )}

        {/* Cart Status */}
        {cartItemCount > 0 && (
          <div className="flex items-center">
            <span>{cartItemCount} items</span>
          </div>
        )}
      </div>

      {/* Center Section */}
      <div className="flex items-center space-x-2">
        {/* User Info */}
        {user && (
          <div className="flex items-center space-x-0.5">
            <span>{user.name}</span>
            <span className="text-text-tertiary">({user.role})</span>
          </div>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-2">
        {/* System Info */}
        <div className="flex items-center">
          <span>POS</span>
        </div>

        {/* Current Time */}
        <div className="flex items-center">
          <span className="font-mono">{formatTime(currentTime)}</span>
        </div>
      </div>
    </div>
  )
} 