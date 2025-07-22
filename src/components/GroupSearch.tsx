'use client'

import { useState } from 'react'
import { Group, GroupSearchProps } from '@/types'

export default function GroupSearch({ onGroupSelect, groups }: GroupSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [showEmptyOnly, setShowEmptyOnly] = useState(false)

  const filteredGroups = groups.filter(group => {
    const matchesSearch = 
      group.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesEmptyFilter = showEmptyOnly ? group.isEmpty : true
    
    return matchesSearch && matchesEmptyFilter
  })

  const handleGroupSelect = (group: Group) => {
    onGroupSelect(group)
    setSearchTerm(group.displayName)
    setIsOpen(false)
  }

  const emptyGroupsCount = groups.filter(g => g.isEmpty).length

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative w-96 mx-auto">
        <div className="relative group">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search for a group..."
            className="w-full px-6 py-4 pl-6 pr-14 text-base font-medium bg-gradient-to-r from-purple-500/20 via-pink-500/15 to-purple-500/20 backdrop-blur-md border border-purple-300/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 text-white placeholder-purple-200/70 shadow-lg hover:shadow-xl transition-all duration-300 hover:from-purple-500/25 hover:via-pink-500/20 hover:to-purple-500/25"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-5">
            <svg
              className="w-6 h-6 text-purple-200/80 group-hover:text-purple-100 transition-colors duration-300"
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
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        </div>

        {isOpen && searchTerm && (
          <div className="absolute z-10 w-full mt-3 bg-gradient-to-br from-purple-500/15 via-pink-500/10 to-purple-500/15 backdrop-blur-xl border border-purple-300/25 rounded-2xl shadow-2xl max-h-60 overflow-y-auto overflow-hidden">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-pink-600/10 animate-pulse"></div>
            
            <div className="relative">
              {filteredGroups.length > 0 ? (
                filteredGroups.slice(0, 10).map((group, index) => (
                  <button
                    key={group.id}
                    onClick={() => handleGroupSelect(group)}
                    className="w-full px-5 py-4 text-left hover:bg-gradient-to-r hover:from-purple-500/25 hover:to-pink-500/20 focus:bg-gradient-to-r focus:from-purple-500/25 focus:to-pink-500/20 focus:outline-none border-b border-purple-300/15 last:border-b-0 transition-all duration-300 group relative overflow-hidden"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Hover glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-pink-400/10 to-purple-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="relative">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-white group-hover:text-purple-100 transition-colors duration-300 flex items-center gap-2">
                            <span className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></span>
                            {group.displayName}
                            {group.isEmpty && (
                              <span className="px-2 py-1 text-xs bg-gradient-to-r from-red-500/80 to-pink-500/60 text-red-100 rounded-full shadow-lg border border-red-400/30">
                                Empty
                              </span>
                            )}
                          </div>
                          {group.description && (
                            <div className="text-sm text-purple-200/70 group-hover:text-purple-100/80 transition-colors duration-300 truncate ml-4">{group.description}</div>
                          )}
                          <div className="text-xs text-purple-200/60 group-hover:text-purple-100/70 transition-colors duration-300 ml-4">
                            {group.memberCount} members • {group.groupTypes.join(', ') || 'Standard Group'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-5 py-4 text-purple-200/70 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-300/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  No groups found
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

      {/* Filter Controls */}
      <div className="flex items-center gap-4 mt-4">
        <label className="flex items-center gap-2 text-sm text-white/80 cursor-pointer group">
          <input
            type="checkbox"
            checked={showEmptyOnly}
            onChange={(e) => setShowEmptyOnly(e.target.checked)}
            className="w-4 h-4 text-purple-600 bg-purple-500/20 border-purple-300/30 rounded focus:ring-purple-400/50 focus:ring-2 backdrop-blur-sm transition-all duration-300"
          />
          <span className="group-hover:text-purple-200 transition-colors duration-300">Show only empty groups</span>
        </label>
        
        {emptyGroupsCount > 0 && (
          <span className="text-sm text-red-200 bg-gradient-to-r from-red-500/25 to-pink-500/20 backdrop-blur-sm px-3 py-1 rounded-full border border-red-400/30 shadow-lg">
            {emptyGroupsCount} empty group{emptyGroupsCount !== 1 ? 's' : ''} found
          </span>
        )}
      </div>

      {/* Summary */}
      <div className="text-sm text-purple-200/60 mt-2 flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-60"></span>
        Showing {filteredGroups.length} of {groups.length} groups
        {showEmptyOnly && ` (empty only)`}
      </div>
    </div>
  )
}
