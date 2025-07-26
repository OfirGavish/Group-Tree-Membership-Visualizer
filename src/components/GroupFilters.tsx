'use client'

import { Group } from '@/types'

interface GroupFiltersProps {
  groups: Group[]
  showEmptyOnly: boolean
  onShowEmptyOnlyChange: (value: boolean) => void
  filteredCount: number
}

export default function GroupFilters({ 
  groups, 
  showEmptyOnly, 
  onShowEmptyOnlyChange, 
  filteredCount 
}: GroupFiltersProps) {
  const emptyGroupsCount = groups.filter(g => g.isEmpty).length

  return (
    <div className="flex items-start gap-2 flex-shrink-0">
      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-2 text-sm text-white/80 cursor-pointer group whitespace-nowrap">
          <input
            type="checkbox"
            checked={showEmptyOnly}
            onChange={(e) => onShowEmptyOnlyChange(e.target.checked)}
            className="w-4 h-4 text-purple-600 bg-purple-500/20 border-purple-300/30 rounded focus:ring-purple-400/50 focus:ring-2 backdrop-blur-sm transition-all duration-300"
          />
          <span className="group-hover:text-purple-200 transition-colors duration-300">Empty only</span>
        </label>
        
        {/* Summary */}
        <div className="text-xs text-purple-200/60 flex items-center gap-2 ml-6">
          <span className="w-1 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-60"></span>
          Showing {filteredCount} of {groups.length} groups
          {showEmptyOnly && ` (empty only)`}
        </div>
      </div>
      
      {emptyGroupsCount > 0 && showEmptyOnly && (
        <span className="text-xs text-red-200 bg-gradient-to-r from-red-500/25 to-pink-500/20 backdrop-blur-sm px-2 py-1 rounded-full border border-red-400/30 shadow-lg whitespace-nowrap">
          {emptyGroupsCount}
        </span>
      )}
    </div>
  )
}
