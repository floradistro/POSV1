'use client'

import { X } from 'lucide-react'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      
      {/* Settings Panel */}
      <div className={`
        fixed top-0 left-0 h-full w-80 bg-background-secondary border-r border-white/[0.08] z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
<div className="py-1 flex items-center justify-end px-6 border-b border-white/[0.08]">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-background-tertiary transition-colors duration-200"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Store Settings */}
          <div>
            <h3 className="text-sm font-medium text-white mb-3">Store Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">Tax Rate</span>
                <input 
                  type="text" 
                  defaultValue="8.25%"
                  className="w-20 px-2 py-1 bg-background-tertiary border border-white/10 rounded text-sm text-white text-right"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">Currency</span>
                <select className="px-2 py-1 bg-background-tertiary border border-white/10 rounded text-sm text-white">
                  <option>USD</option>
                  <option>EUR</option>
                  <option>CAD</option>
                </select>
              </div>
            </div>
          </div>

          {/* Display Settings */}
          <div>
            <h3 className="text-sm font-medium text-white mb-3">Display</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">Theme</span>
                <select className="px-2 py-1 bg-background-tertiary border border-white/10 rounded text-sm text-white">
                  <option>Dark</option>
                  <option>Light</option>
                  <option>Auto</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">Compact View</span>
                <button className="w-10 h-6 bg-background-tertiary rounded-full relative border border-white/10">
                  <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform duration-200"></div>
                </button>
              </div>
            </div>
          </div>

          {/* Integration Settings */}
          <div>
            <h3 className="text-sm font-medium text-white mb-3">Integrations</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">WooCommerce API</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-white/50">Connected</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70">Payment Gateway</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-white/50">Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* System Info */}
          <div>
            <h3 className="text-sm font-medium text-white mb-3">System</h3>
            <div className="space-y-2 text-xs text-white/50">
              <div>Version: 1.0.0</div>
              <div>API Status: Connected</div>
              <div>Last Sync: 2 minutes ago</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 