'use client'

import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'

interface IDScannerProps {
  onScan: (data: any) => void
  onClose: () => void
}

export function IDScanner({ onScan, onClose }: IDScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const codeReader = useRef<BrowserMultiFormatReader | null>(null)

  useEffect(() => {
    codeReader.current = new BrowserMultiFormatReader()
    startScanning()

    return () => {
      stopScanning()
    }
  }, [])

  const startScanning = async () => {
    try {
      setIsScanning(true)
      setError(null)

      if (!codeReader.current || !videoRef.current) return

      // Start scanning
      await codeReader.current.decodeFromVideoDevice(null, videoRef.current, (result, error) => {
        if (result) {
          const scannedData = result.getText()
          console.log('Scanned data:', scannedData)
          
          // Parse driver license data (PDF417 format)
          const parsedData = parseDriverLicenseData(scannedData)
          onScan(parsedData)
          stopScanning()
        }
        
        if (error && !(error instanceof NotFoundException)) {
          console.error('Scanning error:', error)
        }
      })
    } catch (err) {
      console.error('Failed to start camera:', err)
      setError('Failed to access camera. Please check permissions.')
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    if (codeReader.current) {
      codeReader.current.reset()
    }
    setIsScanning(false)
  }

  const parseDriverLicenseData = (data: string) => {
    // Basic parsing for AAMVA standard driver license barcodes
    const lines = data.split('\n')
    const parsed: any = {}

    lines.forEach(line => {
      if (line.startsWith('DAA')) parsed.fullName = line.substring(3)
      if (line.startsWith('DAG')) parsed.streetAddress = line.substring(3)
      if (line.startsWith('DAI')) parsed.city = line.substring(3)
      if (line.startsWith('DAJ')) parsed.state = line.substring(3)
      if (line.startsWith('DAK')) parsed.zipCode = line.substring(3)
      if (line.startsWith('DAQ')) parsed.licenseNumber = line.substring(3)
      if (line.startsWith('DBB')) parsed.dateOfBirth = line.substring(3)
      if (line.startsWith('DBC')) parsed.gender = line.substring(3)
    })

    return parsed
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 w-full max-w-lg mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-text">Scan Driver License</h3>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {error ? (
            <div className="bg-error/10 border border-error/20 rounded-lg p-4 text-center">
              <p className="text-error text-sm">{error}</p>
              <button
                onClick={startScanning}
                className="mt-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-64 bg-black rounded-lg object-cover"
                playsInline
                muted
              />
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-primary rounded-lg w-3/4 h-3/4 opacity-50"></div>
                </div>
              )}
            </div>
          )}

          <div className="text-center">
            <p className="text-text-secondary text-sm mb-4">
              Position the barcode on the back of the driver's license within the frame
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 bg-background-tertiary hover:bg-background-tertiary/80 text-text py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              {!isScanning && !error && (
                <button
                  onClick={startScanning}
                  className="flex-1 bg-primary hover:bg-primary-dark text-white py-2 rounded-lg transition-colors"
                >
                  Start Scan
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 