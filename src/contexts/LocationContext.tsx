'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface LocationInfo {
  id: string
  name: string
  address: string
  terminalId: string
}

interface LocationContextType {
  currentLocation: LocationInfo
  setCurrentLocation: (location: LocationInfo) => void
  availableLocations: LocationInfo[]
  syncWithStore: (storeId: string) => void
}

const defaultLocation: LocationInfo = {
  id: '32',
  name: 'Blowing Rock',
  address: '123 Main St, Blowing Rock, NC',
  terminalId: 'BR-001'
}

const LocationContext = createContext<LocationContextType | undefined>(undefined)

export const availableLocations: LocationInfo[] = [
  {
    id: '30',
    name: 'Charlotte Monroe',
    address: '456 Trade St, Charlotte, NC',
    terminalId: 'CLT-MON-001'
  },
  {
    id: '31',
    name: 'Charlotte Nations Ford',
    address: '789 Nations Ford Rd, Charlotte, NC',
    terminalId: 'CLT-NF-001'
  },
  {
    id: '32',
    name: 'Blowing Rock',
    address: '123 Main St, Blowing Rock, NC',
    terminalId: 'BR-001'
  },
  {
    id: '34',
    name: 'Salisbury',
    address: '456 Main St, Salisbury, NC',
    terminalId: 'SAL-001'
  },
  {
    id: '35',
    name: 'Elizabethton',
    address: '789 State St, Elizabethton, TN',
    terminalId: 'ELZ-001'
  },
  {
    id: '33',
    name: 'Flora Distro',
    address: '123 Business Blvd, Charlotte, NC',
    terminalId: 'FD-001'
  },
  {
    id: '69',
    name: 'Warehouse',
    address: '999 Industrial Blvd, Charlotte, NC',
    terminalId: 'WH-001'
  }
]

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [currentLocation, setCurrentLocation] = useState<LocationInfo>(defaultLocation)

  // Load location from localStorage on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem('pos_current_location')
    if (savedLocation) {
      try {
        const parsedLocation = JSON.parse(savedLocation)
        const foundLocation = availableLocations.find(loc => loc.id === parsedLocation.id)
        if (foundLocation) {
          setCurrentLocation(foundLocation)
        }
      } catch (error) {
        console.warn('Failed to parse saved location:', error)
      }
    }
  }, [])

  // Function to sync location with store ID
  const syncWithStore = (storeId: string) => {
    const matchingLocation = availableLocations.find(loc => loc.id === storeId)
    if (matchingLocation) {
      console.log(`🔄 Syncing location with store: ${matchingLocation.name}`)
      setCurrentLocation(matchingLocation)
      localStorage.setItem('pos_current_location', JSON.stringify(matchingLocation))
    }
  }

  // Save location to localStorage when it changes
  const handleSetCurrentLocation = (location: LocationInfo) => {
    setCurrentLocation(location)
    localStorage.setItem('pos_current_location', JSON.stringify(location))
    console.log(`📍 Location changed to: ${location.name} (${location.terminalId})`)
  }

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        setCurrentLocation: handleSetCurrentLocation,
        availableLocations,
        syncWithStore
      }}
    >
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const context = useContext(LocationContext)
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider')
  }
  return context
} 