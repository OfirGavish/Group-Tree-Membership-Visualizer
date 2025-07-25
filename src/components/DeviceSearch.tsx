'use client'

import { useState, useEffect, useRef } from 'react'
import { Device, DeviceSearchProps } from '@/types'

export default function DeviceSearch({ onDeviceSelect, devices }: DeviceSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredDevices([])
      setIsOpen(false)
      return
    }

    const filtered = devices
      .filter(device => 
        device.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.deviceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (device.operatingSystem && device.operatingSystem.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .slice(0, 10) // Limit to 10 results

    setFilteredDevices(filtered)
    setIsOpen(filtered.length > 0)
    setSelectedIndex(-1)
  }, [searchTerm, devices])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, filteredDevices.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && filteredDevices[selectedIndex]) {
          handleDeviceSelect(filteredDevices[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleDeviceSelect = (device: Device) => {
    setSearchTerm(device.displayName)
    setIsOpen(false)
    setSelectedIndex(-1)
    onDeviceSelect(device)
  }

  const clearSearch = () => {
    setSearchTerm('')
    setFilteredDevices([])
    setIsOpen(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const getDeviceIcon = (operatingSystem?: string) => {
    if (!operatingSystem) return '💻'
    const os = operatingSystem.toLowerCase()
    if (os.includes('windows')) return '🖥️'
    if (os.includes('ios')) return '📱'
    if (os.includes('android')) return '📱'
    if (os.includes('mac')) return '🖥️'
    return '💻'
  }

  const getStatusBadge = (device: Device) => {
    if (device.isCompliant === true && device.isManaged === true) {
      return <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-300 rounded-full">✓ Managed & Compliant</span>
    }
    if (device.isManaged === true) {
      return <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full">📋 Managed</span>
    }
    if (device.isCompliant === true) {
      return <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-300 rounded-full">✓ Compliant</span>
    }
    return <span className="text-xs px-2 py-0.5 bg-gray-500/20 text-gray-300 rounded-full">❓ Unknown</span>
  }

  return (
    <div className="relative w-72 mx-auto" style={{ maxWidth: '300px' }} ref={dropdownRef}>
      <div className="relative group">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder="Search for a device..."
          className="w-full px-6 py-4 pl-6 pr-14 text-base font-medium bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 text-white placeholder-white/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/15"
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-5">
          <svg
            className="w-6 h-6 text-white/60 group-hover:text-white/80 transition-colors duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        {/* Floating gradient border animation */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-400/20 via-emerald-400/20 to-green-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </div>

      {isOpen && searchTerm && (
        <div className="absolute z-10 w-full mt-3 bg-gradient-to-br from-green-500/15 via-emerald-500/10 to-green-500/15 backdrop-blur-xl rounded-2xl shadow-2xl max-h-60 overflow-y-auto overflow-hidden border border-green-300/20">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 via-transparent to-emerald-600/10 animate-pulse"></div>
          
          <div className="relative">
            {filteredDevices.length > 0 ? (
              filteredDevices.map((device, index) => (
                <button
                  key={device.id}
                  onClick={() => handleDeviceSelect(device)}
                  className={`w-full px-5 py-4 text-left hover:bg-gradient-to-r hover:from-green-500/25 hover:to-emerald-500/20 focus:bg-gradient-to-r focus:from-green-500/25 focus:to-emerald-500/20 focus:outline-none border-b border-green-300/15 last:border-b-0 transition-all duration-300 group relative overflow-hidden ${
                    index === selectedIndex
                      ? 'bg-gradient-to-r from-green-500/25 to-emerald-500/20'
                      : ''
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-emerald-400/10 to-green-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 flex items-center">
                        <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full opacity-80 shadow-lg"></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white group-hover:text-green-100 transition-colors duration-300 flex items-center gap-2 mb-1">
                          <span className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></span>
                          <span className="truncate text-base">{device.displayName}</span>
                        </div>
                        <div className="text-sm text-green-200/70 group-hover:text-green-100/80 transition-colors duration-300 truncate">{device.deviceId}</div>
                        {device.operatingSystem && (
                          <div className="text-xs text-green-200/60 group-hover:text-green-100/70 transition-colors duration-300">{device.operatingSystem}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-5 py-6 text-center">
                <div className="flex flex-col items-center gap-2 text-green-200/70">
                  <svg className="w-8 h-8 text-green-300/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
                  </svg>
                  <span className="text-sm">No devices found</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
