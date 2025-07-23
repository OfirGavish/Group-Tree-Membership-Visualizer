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
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search for devices..."
          className="w-72 px-4 py-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition-all duration-200"
          style={{ maxWidth: '300px' }}
        />
        
        {/* Search Icon */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60">
          💻
        </div>
        
        {/* Clear Button */}
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
          >
            ×
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-2xl z-50 max-h-80 overflow-y-auto">
          {filteredDevices.map((device, index) => (
            <div
              key={device.id}
              onClick={() => handleDeviceSelect(device)}
              className={`p-4 cursor-pointer transition-all duration-200 ${
                index === selectedIndex
                  ? 'bg-white/20'
                  : 'hover:bg-white/10'
              } ${
                index === 0 ? 'rounded-t-xl' : ''
              } ${
                index === filteredDevices.length - 1 ? 'rounded-b-xl' : 'border-b border-white/10'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 min-w-0 flex-1">
                  <div className="text-xl flex-shrink-0 mt-0.5">
                    {getDeviceIcon(device.operatingSystem)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-white font-medium truncate">
                      {device.displayName}
                    </div>
                    <div className="text-white/70 text-sm truncate">
                      {device.deviceId}
                    </div>
                    {device.operatingSystem && (
                      <div className="text-white/50 text-xs mt-1">
                        {device.operatingSystem} {device.operatingSystemVersion}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 ml-2">
                  {getStatusBadge(device)}
                </div>
              </div>
            </div>
          ))}
          
          {filteredDevices.length === 0 && searchTerm && (
            <div className="p-4 text-white/60 text-center">
              No devices found matching &quot;{searchTerm}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  )
}
