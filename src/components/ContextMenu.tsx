'use client'

import { useEffect, useRef, useState } from 'react'
import { TreeNode } from '@/types'

interface ContextMenuProps {
  x: number
  y: number
  targetNode: TreeNode
  isVisible: boolean
  onClose: () => void
  onExpand?: (nodeId: string) => void
  onCollapse?: (nodeId: string) => void
  onShowDetails?: (node: TreeNode) => void
  expandedNodes: Set<string>
}

export default function ContextMenu({
  x,
  y,
  targetNode,
  isVisible,
  onClose,
  onExpand,
  onCollapse,
  onShowDetails,
  expandedNodes
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPosition, setMenuPosition] = useState({ x, y })

  useEffect(() => {
    if (!isVisible) return

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    // Adjust menu position to prevent overflow
    const adjustPosition = () => {
      if (!menuRef.current) return

      const menu = menuRef.current
      const rect = menu.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let adjustedX = x
      let adjustedY = y

      // Adjust X position if menu would overflow right edge
      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10
      }

      // Adjust Y position if menu would overflow bottom edge
      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10
      }

      // Ensure menu doesn't go off left or top edge
      adjustedX = Math.max(10, adjustedX)
      adjustedY = Math.max(10, adjustedY)

      setMenuPosition({ x: adjustedX, y: adjustedY })
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    
    // Use setTimeout to ensure menu is rendered before adjusting position
    setTimeout(adjustPosition, 0)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isVisible, x, y, onClose])

  if (!isVisible) return null

  const isExpanded = expandedNodes.has(targetNode.id)
  const canExpand = targetNode.children && targetNode.children.length > 0
  const canCollapse = isExpanded

  const handleAction = (action: () => void) => {
    action()
    onClose()
  }

  const menuItems = [
    // Expand/Collapse actions
    ...(canExpand && !isExpanded ? [{
      id: 'expand',
      label: '🔽 Expand',
      icon: '🔽',
      action: () => onExpand?.(targetNode.id),
      disabled: false
    }] : []),
    
    ...(canCollapse ? [{
      id: 'collapse',
      label: '🔼 Collapse',
      icon: '🔼',
      action: () => onCollapse?.(targetNode.id),
      disabled: false
    }] : []),

    // Separator if we have expand/collapse options
    ...((canExpand || canCollapse) ? [{
      id: 'separator-1',
      label: '',
      icon: '',
      action: () => {},
      disabled: true,
      isSeparator: true
    }] : []),

    // Show Details action
    {
      id: 'show-details',
      label: '📋 Show Details',
      icon: '📋',
      action: () => onShowDetails?.(targetNode),
      disabled: false
    },

    // Future actions can be added here
    {
      id: 'separator-2',
      label: '',
      icon: '',
      action: () => {},
      disabled: true,
      isSeparator: true
    },

    // More options to be added later
    {
      id: 'copy-info',
      label: '📋 Copy Name',
      icon: '📋',
      action: () => {
        navigator.clipboard.writeText(targetNode.name)
      },
      disabled: false
    },

    {
      id: 'copy-id',
      label: '🔗 Copy ID',
      icon: '🔗',
      action: () => {
        navigator.clipboard.writeText(targetNode.data.id)
      },
      disabled: false
    }
  ]

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-48 bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-white/20 py-2"
      style={{
        left: `${menuPosition.x}px`,
        top: `${menuPosition.y}px`,
      }}
    >
      <div className="px-3 py-2 border-b border-gray-200/30 mb-1">
        <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          {targetNode.type === 'user' ? '👤 User' : 
           targetNode.type === 'group' ? '👥 Group' : 
           '💻 Device'}
        </div>
        <div className="text-sm font-medium text-gray-800 truncate mt-0.5">
          {targetNode.name}
        </div>
      </div>

      {menuItems.map((item) => (
        item.isSeparator ? (
          <div key={item.id} className="border-t border-gray-200/30 my-1" />
        ) : (
          <button
            key={item.id}
            onClick={() => handleAction(item.action)}
            disabled={item.disabled}
            className={`
              w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors
              ${item.disabled 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer'
              }
            `}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        )
      ))}

      {/* Footer with keyboard hint */}
      <div className="border-t border-gray-200/30 mt-1 px-3 py-1">
        <div className="text-xs text-gray-500">
          Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Esc</kbd> to close
        </div>
      </div>
    </div>
  )
}
