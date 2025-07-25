'use client'

import { useState } from 'react'
import { TreeNode } from '@/types'

interface DragDropModalProps {
  isOpen: boolean
  onClose: () => void
  draggedNode: TreeNode | null
  targetNode: TreeNode | null
  onConfirm: (action: 'move' | 'add') => void
}

export default function DragDropModal({
  isOpen,
  onClose,
  draggedNode,
  targetNode,
  onConfirm
}: DragDropModalProps) {
  const [loading, setLoading] = useState(false)

  if (!isOpen || !draggedNode || !targetNode) {
    return null
  }

  const handleAction = async (action: 'move' | 'add') => {
    setLoading(true)
    try {
      await onConfirm(action)
    } finally {
      setLoading(false)
    }
  }

  const getNodeIcon = (node: TreeNode) => {
    switch (node.type) {
      case 'user':
        return '👤'
      case 'device':
        return '💻'
      case 'group':
        return '👥'
      default:
        return '❓'
    }
  }

  const getNodeTypeColor = (node: TreeNode) => {
    switch (node.type) {
      case 'user':
        return 'from-blue-500 to-cyan-500'
      case 'device':
        return 'from-green-500 to-emerald-500'
      case 'group':
        return 'from-purple-500 to-pink-500'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">
            Group Membership Action
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-white/60 hover:text-white/80 transition-colors text-xl font-bold w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-6">
          {/* Dragged Node */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <div className={`w-10 h-10 bg-gradient-to-r ${getNodeTypeColor(draggedNode)} rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
              {getNodeIcon(draggedNode)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white text-sm truncate">
                {draggedNode.name}
              </div>
              <div className="text-white/60 text-xs capitalize">
                {draggedNode.type}
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="text-white/40 text-2xl">↓</div>
          </div>

          {/* Target Node */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <div className={`w-10 h-10 bg-gradient-to-r ${getNodeTypeColor(targetNode)} rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
              {getNodeIcon(targetNode)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white text-sm truncate">
                {targetNode.name}
              </div>
              <div className="text-white/60 text-xs capitalize">
                {targetNode.type}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="text-center text-white/80 text-sm">
            What would you like to do with{' '}
            <span className="font-semibold text-white">
              {draggedNode.name}
            </span>
            ?
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => handleAction('add')}
            disabled={loading}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
            ) : (
              '➕'
            )}
            Add to Group
            <div className="text-xs opacity-80 ml-2">
              (Keep existing memberships)
            </div>
          </button>

          <button
            onClick={() => handleAction('move')}
            disabled={loading}
            className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
            ) : (
              '🔄'
            )}
            Move to Group
            <div className="text-xs opacity-80 ml-2">
              (Remove from current group)
            </div>
          </button>

          <button
            onClick={onClose}
            disabled={loading}
            className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all duration-200 border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
