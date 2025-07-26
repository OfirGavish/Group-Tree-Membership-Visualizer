'use client'

import { useState, useEffect } from 'react'
import { TreeNode, Group } from '@/types'
import { ApiGraphService } from '@/lib/api-graph-service'

interface DragDropModalProps {
  isOpen: boolean
  onClose: () => void
  draggedNode: TreeNode | null
  targetNode: TreeNode | null
  onConfirm: (action: 'move' | 'add', additionalData?: { groupsToRemoveFrom?: string[] }) => void
}

interface MoveDetails {
  sourceGroupId: string | null
  sourceGroupName: string | null
  targetGroupId: string
  targetGroupName: string
  userGroups: Group[]
  loadingGroups: boolean
}

export default function DragDropModal({
  isOpen,
  onClose,
  draggedNode,
  targetNode,
  onConfirm
}: DragDropModalProps) {
  const [loading, setLoading] = useState(false)
  const [showMoveDetails, setShowMoveDetails] = useState(false)
  const [moveDetails, setMoveDetails] = useState<MoveDetails | null>(null)
  const [selectedGroupsToRemove, setSelectedGroupsToRemove] = useState<string[]>([])

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setShowMoveDetails(false)
      setMoveDetails(null)
      setSelectedGroupsToRemove([])
    }
  }, [isOpen])

  const getManageableGroups = (groups: Group[]): Group[] => {
    return groups.filter(group => {
      // Exclude distribution lists and dynamic membership groups
      const groupTypes = group.groupTypes || []
      const isDynamicMembership = groupTypes.includes('DynamicMembership')
      const isUnified = groupTypes.includes('Unified') // This includes Microsoft 365 groups
      
      // For now, let's include all groups but we can refine this logic
      // In a real implementation, you might want to check additional properties
      // or use Graph API to determine if the group is manageable
      return !isDynamicMembership
    })
  }

  const loadMoveDetails = async () => {
    if (!draggedNode || !targetNode) return

    setMoveDetails({
      sourceGroupId: null,
      sourceGroupName: null,
      targetGroupId: (targetNode.data as any).originalId || targetNode.data.id,
      targetGroupName: targetNode.name,
      userGroups: [],
      loadingGroups: true
    })

    try {
      const graphService = new ApiGraphService()
      const memberId = (draggedNode.data as any).originalId || draggedNode.data.id
      
      // Get all user's groups
      const userGroups = await graphService.getUserGroups(memberId)
      
      // Try to identify source group from node ID
      let sourceGroupId: string | null = null
      let sourceGroupName: string | null = null
      
      const guidPattern = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g
      const guids = draggedNode.id.match(guidPattern) || []
      
      if (draggedNode.id.includes('-user-') || draggedNode.id.includes('-device-')) {
        if (draggedNode.id.startsWith('group-') && guids.length >= 2) {
          sourceGroupId = guids[0] || null
        } else if (guids.length >= 2) {
          const userDeviceMatch = draggedNode.id.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})-(user|device)-([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/)
          if (userDeviceMatch) {
            sourceGroupId = userDeviceMatch[1] || null
          } else {
            sourceGroupId = guids[0] || null
          }
        }
      }

      // Find source group name
      if (sourceGroupId) {
        const sourceGroup = userGroups.find(g => g.id === sourceGroupId)
        sourceGroupName = sourceGroup?.displayName || null
      }

      setMoveDetails({
        sourceGroupId,
        sourceGroupName,
        targetGroupId: (targetNode.data as any).originalId || targetNode.data.id,
        targetGroupName: targetNode.name,
        userGroups,
        loadingGroups: false
      })

      // Pre-select the source group for removal
      if (sourceGroupId) {
        setSelectedGroupsToRemove([sourceGroupId])
      }

    } catch (error) {
      console.error('Error loading move details:', error)
      setMoveDetails({
        sourceGroupId: null,
        sourceGroupName: null,
        targetGroupId: (targetNode.data as any).originalId || targetNode.data.id,
        targetGroupName: targetNode.name,
        userGroups: [],
        loadingGroups: false
      })
    }
  }

  if (!isOpen || !draggedNode || !targetNode) {
    return null
  }

  const handleAction = async (action: 'move' | 'add') => {
    if (action === 'move') {
      await loadMoveDetails()
      setShowMoveDetails(true)
      return
    }

    setLoading(true)
    try {
      await onConfirm(action)
    } finally {
      setLoading(false)
    }
  }

  const handleMoveConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm('move', { groupsToRemoveFrom: selectedGroupsToRemove })
    } finally {
      setLoading(false)
    }
  }

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroupsToRemove(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  const handleBackToOptions = () => {
    setShowMoveDetails(false)
    setMoveDetails(null)
    setSelectedGroupsToRemove([])
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
      <div className="relative bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {!showMoveDetails ? (
          // Initial action selection view
          <>
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
                  (Configure removal options)
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
          </>
        ) : (
          // Move details view
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBackToOptions}
                  disabled={loading}
                  className="text-white/60 hover:text-white/80 transition-colors text-xl font-bold w-8 h-8 flex items-center justify-center"
                >
                  ←
                </button>
                <h3 className="text-lg font-bold text-white">
                  Confirm Move Operation
                </h3>
              </div>
              <button
                onClick={onClose}
                disabled={loading}
                className="text-white/60 hover:text-white/80 transition-colors text-xl font-bold w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            {/* Move Summary */}
            <div className="space-y-4 mb-6">
              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <span className="text-lg">🔄</span>
                  Move Summary
                </h4>
                
                <div className="space-y-3">
                  {/* User being moved */}
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 bg-gradient-to-r ${getNodeTypeColor(draggedNode)} rounded-lg flex items-center justify-center text-white text-sm shadow-lg`}>
                      {getNodeIcon(draggedNode)}
                    </div>
                    <span className="text-white font-medium">{draggedNode.name}</span>
                  </div>

                  {/* Target group */}
                  <div className="pl-4 border-l-2 border-green-400/50">
                    <div className="text-green-400 text-sm font-medium mb-1">➕ Will be added to:</div>
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 bg-gradient-to-r ${getNodeTypeColor(targetNode)} rounded flex items-center justify-center text-white text-xs`}>
                        {getNodeIcon(targetNode)}
                      </div>
                      <span className="text-white text-sm">{targetNode.name}</span>
                    </div>
                  </div>

                  {/* Source group removal */}
                  {moveDetails?.sourceGroupId && moveDetails?.sourceGroupName && (
                    <div className="pl-4 border-l-2 border-red-400/50">
                      <div className="text-red-400 text-sm font-medium mb-1">➖ Will be removed from:</div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded flex items-center justify-center text-white text-xs">
                          👥
                        </div>
                        <span className="text-white text-sm">{moveDetails.sourceGroupName}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* All user groups with removal options */}
              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <span className="text-lg">👥</span>
                  Current Group Memberships
                </h4>
                
                {moveDetails?.loadingGroups ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin h-6 w-6 border-2 border-white/30 border-t-white rounded-full" />
                    <span className="ml-2 text-white/60">Loading groups...</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {moveDetails?.userGroups && moveDetails.userGroups.length > 0 ? (
                      getManageableGroups(moveDetails.userGroups).map((group) => (
                        <div key={group.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                          <label className="flex items-center gap-3 flex-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedGroupsToRemove.includes(group.id)}
                              onChange={() => handleGroupToggle(group.id)}
                              className="w-4 h-4 text-red-500 bg-white/10 border-white/20 rounded focus:ring-red-500 focus:ring-2"
                            />
                            <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded flex items-center justify-center text-white text-xs">
                              👥
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-white text-sm truncate">{group.displayName}</div>
                              {group.description && (
                                <div className="text-white/60 text-xs truncate">{group.description}</div>
                              )}
                            </div>
                            {group.id === moveDetails?.sourceGroupId && (
                              <span className="text-orange-400 text-xs bg-orange-400/20 px-2 py-1 rounded">
                                Source
                              </span>
                            )}
                          </label>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-white/60 py-4">
                        No manageable groups found
                      </div>
                    )}
                  </div>
                )}
                
                <div className="mt-3 text-xs text-white/60">
                  Select groups to remove the user from. The user will be added to &ldquo;{targetNode.name}&rdquo; regardless.
                </div>
              </div>
            </div>

            {/* Confirmation Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleMoveConfirm}
                disabled={loading || moveDetails?.loadingGroups}
                className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                ) : (
                  '✅'
                )}
                Confirm Move ({selectedGroupsToRemove.length} removal{selectedGroupsToRemove.length !== 1 ? 's' : ''})
              </button>

              <button
                onClick={handleBackToOptions}
                disabled={loading}
                className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all duration-200 border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back to Options
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
