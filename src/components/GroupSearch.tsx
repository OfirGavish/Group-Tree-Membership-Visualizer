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
    <div className="w-full space-y-4">
      {/* Search Input */}
      <div className="relative w-full max-w-md">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search for a group..."
            className="w-full px-4 py-3 text-sm bg-white/20 backdrop-blur-md border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-white placeholder-white/70"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg
              className="w-4 h-4 text-white/70"
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
        </div>

        {isOpen && searchTerm && (
          <div className="absolute z-10 w-full mt-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-xl max-h-60 overflow-y-auto">
            {filteredGroups.length > 0 ? (
              filteredGroups.slice(0, 10).map((group) => (
                <button
                  key={group.id}
                  onClick={() => handleGroupSelect(group)}
                  className="w-full px-4 py-3 text-left hover:bg-white/20 focus:bg-white/20 focus:outline-none border-b border-white/10 last:border-b-0 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-white flex items-center gap-2">
                        {group.displayName}
                        {group.isEmpty && (
                          <span className="px-2 py-1 text-xs bg-red-500/80 text-red-100 rounded-full">
                            Empty
                          </span>
                        )}
                      </div>
                      {group.description && (
                        <div className="text-sm text-white/70 truncate">{group.description}</div>
                      )}
                      <div className="text-xs text-white/60">
                        {group.memberCount} members • {group.groupTypes.join(', ') || 'Standard Group'}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-white/70 text-sm">No groups found</div>
            )}
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
        <label className="flex items-center gap-2 text-sm text-white/80 cursor-pointer">
          <input
            type="checkbox"
            checked={showEmptyOnly}
            onChange={(e) => setShowEmptyOnly(e.target.checked)}
            className="w-4 h-4 text-purple-600 bg-white/20 border-white/30 rounded focus:ring-purple-500/50 focus:ring-2"
          />
          Show only empty groups
        </label>
        
        {emptyGroupsCount > 0 && (
          <span className="text-sm text-red-200 bg-red-500/20 backdrop-blur-sm px-3 py-1 rounded-full border border-red-400/30">
            {emptyGroupsCount} empty group{emptyGroupsCount !== 1 ? 's' : ''} found
          </span>
        )}
      </div>

      {/* Summary */}
      <div className="text-sm text-white/60 mt-2">
        Showing {filteredGroups.length} of {groups.length} groups
        {showEmptyOnly && ` (empty only)`}
      </div>
    </div>
  )
}
