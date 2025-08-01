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
}

export function StatusBar({ store, user, cartItemCount = 0 }: StatusBarProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'syncing'>('online')

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleOnline = () => setConnectionStatus('online')
    const handleOffline = () => setConnectionStatus('offline')

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'online':
        return '●'
      case 'offline':
        return '●'
      case 'syncing':
        return '◐'
      default:
        return '●'
    }
  }

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'online':
        return 'text-green-400'
      case 'offline':
        return 'text-red-400'
      case 'syncing':
        return 'text-yellow-400'
      default:
        return 'text-text-secondary'
    }
  }

  return (
    <div className="bg-vscode-bgSecondary border-t border-border-light px-2 py-1 flex items-center justify-between text-xs text-text-secondary flex-shrink-0">
      {/* Left Section */}
      <div className="flex items-center space-x-2">
        {/* Connection Status */}
        <div className="flex items-center space-x-0.5">
          <span className={`${getConnectionColor()} text-xs`}>
            {getConnectionIcon()}
          </span>
          <span className="capitalize">{connectionStatus}</span>
        </div>

        {/* Store Info */}
        {store && (
          <div className="flex items-center">
            <span>{store.name}</span>
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