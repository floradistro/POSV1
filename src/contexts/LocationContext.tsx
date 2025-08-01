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
}

const defaultLocation: LocationInfo = {
  id: '30',
  name: 'Salisbury',
  address: '123 Main St, Salisbury, NC',
  terminalId: 'SAL-001'
}

const LocationContext = createContext<LocationContextType | undefined>(undefined)

export const availableLocations: LocationInfo[] = [
  {
    id: '30',
    name: 'Salisbury',
    address: '123 Main St, Salisbury, NC',
    terminalId: 'SAL-001'
  },
  {
    id: '31',
    name: 'Charlotte',
    address: '456 Trade St, Charlotte, NC',
    terminalId: 'CLT-001'
  },
  {
    id: '32',
    name: 'Warehouse',
    address: '789 Industrial Blvd, Charlotte, NC',
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
        availableLocations
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