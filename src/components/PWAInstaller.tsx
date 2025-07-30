'use client'

import { usePWA } from '@/hooks/usePWA'

export default function PWAInstaller() {
  const { isInstallable, installPWA } = usePWA()

  if (!isInstallable) return null

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={installPWA}
        className="bg-accent-purple hover:bg-accent-purple/80 text-white px-4 py-2 rounded-lg shadow-lg transition-colors duration-200 flex items-center gap-2"
      >
        <svg 
          className="w-5 h-5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
          />
        </svg>
        Install App
      </button>
    </div>
  )
} 