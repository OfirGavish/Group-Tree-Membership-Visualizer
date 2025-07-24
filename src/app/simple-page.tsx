'use client'

import { useState, useEffect } from 'react'
import { authService } from '@/lib/msal-auth-service'
import { ApiGraphService } from '@/lib/api-graph-service'
import { CacheService } from '@/lib/cache-service'
import { User, Group, TreeNode, TreeData, GroupMember, Device } from '@/types'
import UserSearch from '@/components/UserSearch'
import GroupSearch from '@/components/GroupSearch'
import DeviceSearch from '@/components/DeviceSearch'
import TreeVisualization from '@/components/TreeVisualization'
import GroupDetails from '@/components/GroupDetails'

export default function SimpleHomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [users, setUsers] = useState<User[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [treeData, setTreeData] = useState<TreeData>({ nodes: [], links: [] })
  const [fullTreeData, setFullTreeData] = useState<TreeNode | null>(null)
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [searchType, setSearchType] = useState<'user' | 'group' | 'device'>('user')
  const [cacheStats, setCacheStats] = useState({ totalItems: 0, totalSize: 0 })

  // Cache management functions
  const updateCacheStats = () => {
    const stats = CacheService.getStats()
    setCacheStats(stats)
  }

  const clearCache = () => {
    CacheService.clear()
    updateCacheStats()
    // Show a brief success message
    setError('Cache cleared successfully!')
    setTimeout(() => setError(null), 3000)
  }

  useEffect(() => {
    checkAuthStatus()
    updateCacheStats() // Update cache stats on page load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array is intentional - we only want to run this once on mount

  const checkAuthStatus = async () => {
    try {
      setAuthLoading(true)
      const user = await authService.getCurrentUser()
      if (user) {
        setIsAuthenticated(true)
        setCurrentUser(user)
        await loadUsers()
        await loadGroups()
        await loadDevices()
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setAuthLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const graphService = new ApiGraphService()
      const allUsers = await graphService.getAllUsers()
      setUsers(allUsers)
      updateCacheStats() // Update cache stats after loading data
    } catch (error) {
      console.error('Error loading users:', error)
      setError('Failed to load users. Please check your permissions.')
    } finally {
      setLoading(false)
    }
  }

  const loadGroups = async () => {
    try {
      setLoading(true)
      setError(null)
      const graphService = new ApiGraphService()
      const allGroups = await graphService.getAllGroups()
      setGroups(allGroups)
      updateCacheStats() // Update cache stats after loading data
    } catch (error) {
      console.error('Error loading groups:', error)
      setError('Failed to load groups. Please check your permissions.')
    } finally {
      setLoading(false)
    }
  }

  const loadDevices = async () => {
    try {
      setLoading(true)
      setError(null)
      const graphService = new ApiGraphService()
      const allDevices = await graphService.getAllDevices()
      setDevices(allDevices)
      updateCacheStats() // Update cache stats after loading data
    } catch (error) {
      console.error('Error loading devices:', error)
      setError('Failed to load devices. Please check your permissions.')
    } finally {
      setLoading(false)
    }
  }

  const buildTreeFromNode = (rootNode: TreeNode, expandedNodeIds: Set<string>): TreeNode => {
    const buildNode = (node: TreeNode): TreeNode => {
      const isExpanded = expandedNodeIds.has(node.id)
      
      console.log('Building node:', node.name, 'isExpanded:', isExpanded, 'hasChildren:', !!node.children?.length)
      
      if (!isExpanded || !node.children || node.children.length === 0) {
        return { 
          ...node, 
          children: [] // Always return empty children for non-expanded nodes
        }
      }

      return {
        ...node,
        children: node.children.map(buildNode)
      }
    }

    return buildNode(rootNode)
  }

  const handleUserSelect = async (user: User) => {
    if (!currentUser) return

    try {
      setLoading(true)
      setError(null)
      setSelectedUser(user)
      
      const graphService = new ApiGraphService()
      const rootNode = await graphService.buildGroupTree(user.id)
      
      console.log('Full tree loaded:', rootNode)
      
      // Start with the user's immediate groups visible (first level expanded)
      const initialTree = {
        ...rootNode,
        children: rootNode.children ? rootNode.children.map(child => ({
          ...child,
          children: [] // Collapse second level initially
        })) : []
      }
      
      // Set the root as expanded so we can see the user's groups
      const newExpandedNodes = new Set([rootNode.id])
      setExpandedNodes(newExpandedNodes)
      
      setTreeData({ nodes: [initialTree], links: [] })
      setSelectedNode(rootNode)
      setSelectedGroup(null)
      setFullTreeData(rootNode) // Store the full tree for reference
    } catch (error) {
      console.error('Error building group tree:', error)
      setError('Failed to load group memberships. Please check your permissions.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeviceSelect = async (device: Device) => {
    if (!currentUser) return

    try {
      setLoading(true)
      setError(null)
      setSelectedDevice(device)
      setSelectedUser(null) // Clear user selection
      
      const graphService = new ApiGraphService()
      const rootNode = await graphService.buildDeviceTree(device.id)
      
      console.log('Device tree loaded:', rootNode)
      
      // Start with the device's immediate groups visible (first level expanded)
      const initialTree = {
        ...rootNode,
        children: rootNode.children ? rootNode.children.map(child => ({
          ...child,
          children: [] // Collapse second level initially
        })) : []
      }
      
      // Set the root as expanded so we can see the device's groups
      const newExpandedNodes = new Set([rootNode.id])
      setExpandedNodes(newExpandedNodes)
      
      setTreeData({ nodes: [initialTree], links: [] })
      setSelectedNode(rootNode)
      setSelectedGroup(null)
      setFullTreeData(rootNode) // Store the full tree for reference
    } catch (error) {
      console.error('Error building device tree:', error)
      setError('Failed to load device group memberships. Please check your permissions.')
    } finally {
      setLoading(false)
    }
  }

  const handleGroupSelect = async (group: Group) => {
    try {
      setLoading(true)
      setError(null)
      setSelectedUser(null)
      setSelectedGroup(null)
      
      const graphService = new ApiGraphService()
      
      // Build a tree starting from the group
      const members = await graphService.getGroupMembers(group.id)
      const memberOf = await graphService.getGroupMemberOf(group.id)
      
      const rootNode: TreeNode = {
        id: `group-${group.id}`,
        name: group.displayName,
        type: 'group',
        data: { ...group, members, memberOf },
        children: members.map(member => {
          const isUser = member['@odata.type'].includes('user')
          return {
            id: `${group.id}-member-${member.id}`,
            name: member.displayName,
            type: isUser ? 'user' as const : 'group' as const,
            data: isUser 
              ? { 
                  ...member, 
                  userPrincipalName: member.userPrincipalName || '' 
                } as User
              : {
                  ...member,
                  groupTypes: [],
                  description: ''
                } as Group,
            children: []
          }
        })
      }
      
      setTreeData({ nodes: [rootNode], links: [] })
      setSelectedNode(rootNode)
      setSelectedGroup({ ...group, members, memberOf })
      setExpandedNodes(new Set([rootNode.id]))
    } catch (error) {
      console.error('Error building group tree:', error)
      setError('Failed to load group details. Please check your permissions.')
    } finally {
      setLoading(false)
    }
  }

  const handleNodeSelect = async (node: TreeNode) => {
    if (!currentUser) return

    console.log('Node selected:', node.name, node.type, 'Current expanded nodes:', Array.from(expandedNodes))
    setSelectedNode(node)
    
    // Handle user node selection - check if expanding or collapsing
    if (node.type === 'user') {
      const isUserExpanded = expandedNodes.has(node.id)
      
      if (isUserExpanded) {
        // Collapse the user node (hide their groups)
        console.log('Collapsing user node:', node.name)
        const newExpandedNodes = new Set(expandedNodes)
        newExpandedNodes.delete(node.id)
        setExpandedNodes(newExpandedNodes)
        
        // Remove the user's groups from the tree
        const updateTreeData = (nodeToUpdate: TreeNode): TreeNode => {
          if (nodeToUpdate.id === node.id) {
            return {
              ...nodeToUpdate,
              children: [] // Remove children when collapsed
            }
          }
          if (nodeToUpdate.children) {
            return {
              ...nodeToUpdate,
              children: nodeToUpdate.children.map(updateTreeData)
            }
          }
          return nodeToUpdate
        }
        
        if (treeData.nodes.length > 0) {
          const rootNode = treeData.nodes[0]
          const updatedRoot = updateTreeData(rootNode)
          setTreeData({ nodes: [updatedRoot], links: [] })
        }
        return
      } else {
        // Expand the user node (load and show their groups)
        const user = node.data as User
        const userId = (user as any).originalId || user.id // Use original ID for API calls
        console.log('Expanding user node, loading their group memberships:', user.displayName)
        
        try {
          setLoading(true)
          const graphService = new ApiGraphService()
          
          // Get user's group memberships using original ID
          const userGroups = await graphService.getUserGroups(userId)
          console.log('User groups found:', userGroups)
          
          // Create group nodes for the user's memberships with path-specific IDs
          const groupNodes: TreeNode[] = userGroups.map(group => ({
            id: `${node.id}-group-${group.id}`, // Create unique ID based on user path context
            name: group.displayName,
            type: 'group',
            data: { ...group, originalId: group.id }, // Store original ID for API calls
            children: [] // Will be populated when expanded
          }))
          
          // Update the tree with the user's groups
          const updateTreeData = (nodeToUpdate: TreeNode): TreeNode => {
            if (nodeToUpdate.id === node.id) {
              return {
                ...nodeToUpdate,
                children: groupNodes
              }
            }
            if (nodeToUpdate.children) {
              return {
                ...nodeToUpdate,
                children: nodeToUpdate.children.map(updateTreeData)
              }
            }
            return nodeToUpdate
          }
          
          if (treeData.nodes.length > 0) {
            const rootNode = treeData.nodes[0]
            const updatedRoot = updateTreeData(rootNode)
            setTreeData({ nodes: [updatedRoot], links: [] })
          }
          
          // Mark the user node as expanded
          const newExpandedNodes = new Set(expandedNodes)
          newExpandedNodes.add(node.id)
          setExpandedNodes(newExpandedNodes)
          
          setLoading(false)
        } catch (error) {
          console.error('Error loading user groups:', error)
          setError('Failed to load user group memberships')
          setLoading(false)
        }
        return
      }
    }
    
    // Handle device node selection - check if expanding or collapsing (similar to users)
    if (node.type === 'device') {
      const isDeviceExpanded = expandedNodes.has(node.id)
      
      if (isDeviceExpanded) {
        // Collapse the device node (hide their groups)
        console.log('Collapsing device node:', node.name)
        const newExpandedNodes = new Set(expandedNodes)
        newExpandedNodes.delete(node.id)
        setExpandedNodes(newExpandedNodes)
        
        // Remove the device's groups from the tree
        const updateTreeData = (nodeToUpdate: TreeNode): TreeNode => {
          if (nodeToUpdate.id === node.id) {
            return {
              ...nodeToUpdate,
              children: [] // Remove children when collapsed
            }
          }
          if (nodeToUpdate.children) {
            return {
              ...nodeToUpdate,
              children: nodeToUpdate.children.map(updateTreeData)
            }
          }
          return nodeToUpdate
        }
        
        if (treeData.nodes.length > 0) {
          const rootNode = treeData.nodes[0]
          const updatedRoot = updateTreeData(rootNode)
          setTreeData({ nodes: [updatedRoot], links: [] })
        }
        return
      } else {
        // Expand the device node (load and show their groups)
        const device = node.data as Device
        const deviceId = (device as any).originalId || device.id // Use original ID for API calls
        console.log('Expanding device node, loading their group memberships:', device.displayName)
        
        try {
          setLoading(true)
          const graphService = new ApiGraphService()
          
          // Get device's groups
          const deviceGroups = await graphService.getDeviceGroups(deviceId)
          console.log('Device groups loaded:', deviceGroups.length)
          
          // Update tree data to include the device's groups
          const updateTreeData = (nodeToUpdate: TreeNode): TreeNode => {
            if (nodeToUpdate.id === node.id) {
              return {
                ...nodeToUpdate,
                children: deviceGroups.map(group => ({
                  id: `group-${group.id}`,
                  name: group.displayName,
                  type: 'group' as const,
                  data: group,
                  children: []
                }))
              }
            }
            if (nodeToUpdate.children) {
              return {
                ...nodeToUpdate,
                children: nodeToUpdate.children.map(updateTreeData)
              }
            }
            return nodeToUpdate
          }
          
          if (treeData.nodes.length > 0) {
            const rootNode = treeData.nodes[0]
            const updatedRoot = updateTreeData(rootNode)
            setTreeData({ nodes: [updatedRoot], links: [] })
          }
          
          // Mark the device node as expanded
          const newExpandedNodes = new Set(expandedNodes)
          newExpandedNodes.add(node.id)
          setExpandedNodes(newExpandedNodes)
          
          setLoading(false)
        } catch (error) {
          console.error('Error loading device groups:', error)
          setError('Failed to load device group memberships')
          setLoading(false)
        }
        return
      }
    }
    
    // Handle group node expansion/collapse
    const isExpanded = expandedNodes.has(node.id)
    const newExpandedNodes = new Set(expandedNodes)
    
    console.log('Node', node.name, 'is currently', isExpanded ? 'expanded' : 'collapsed')
    
    if (isExpanded) {
      // Collapse this node and all its descendants
      console.log('Collapsing node:', node.name)
      const collapseDescendants = (nodeToCollapse: TreeNode) => {
        newExpandedNodes.delete(nodeToCollapse.id)
        if (nodeToCollapse.children) {
          nodeToCollapse.children.forEach(collapseDescendants)
        }
      }
      collapseDescendants(node)
    } else {
      // Expand this node
      console.log('Expanding node:', node.name)
      newExpandedNodes.add(node.id)
      
      // If it's a group, load additional data (members and parent groups)
      if (node.type === 'group') {
        try {
          setLoading(true)
          const graphService = new ApiGraphService()
          const group = node.data as Group
          const groupId = (group as any).originalId || group.id // Use original ID for API calls
          
          // Load group members
          const members = await graphService.getGroupMembers(groupId)
          
          // Load groups this group belongs to
          const memberOf = await graphService.getGroupMemberOf(groupId)
          
          // Create new child nodes for members with path-specific IDs
          const memberNodes: TreeNode[] = members.map(member => {
            if (member['@odata.type'].includes('user')) {
              const user: User = {
                id: member.id,
                displayName: member.displayName,
                userPrincipalName: member.userPrincipalName || '',
                mail: member.mail,
              }
              return {
                id: `${node.id}-user-${member.id}`, // Create unique ID based on group path
                name: member.displayName,
                type: 'user' as const,
                data: { ...user, originalId: user.id }, // Store original ID
                children: undefined
              }
            } else {
              const group: Group = {
                id: member.id,
                displayName: member.displayName,
                description: '',
                groupTypes: []
              }
              return {
                id: `${node.id}-group-${member.id}`, // Create unique ID based on parent path
                name: member.displayName,
                type: 'group' as const,
                data: { ...group, originalId: group.id }, // Store original ID
                children: []
              }
            }
          })
          
          // Create new parent nodes for groups this group belongs to with path-specific IDs
          const parentNodes: TreeNode[] = memberOf.map(parentGroup => ({
            id: `${node.id}-parent-${parentGroup.id}`, // Create unique ID based on path
            name: `${parentGroup.displayName} (parent)`,
            type: 'group',
            data: { ...parentGroup, originalId: parentGroup.id }, // Store original ID
            children: []
          }))
          
          // Update the node with new children
          const updateTreeData = (nodes: TreeNode[]): TreeNode[] => {
            return nodes.map(n => {
              if (n.id === node.id) {
                return {
                  ...n,
                  children: [...(memberNodes), ...(parentNodes)]
                }
              }
              if (n.children) {
                return {
                  ...n,
                  children: updateTreeData(n.children)
                }
              }
              return n
            })
          }
          
          // Find and update the root node
          if (treeData.nodes.length > 0) {
            const rootNode = treeData.nodes[0]
            const updateNode = (nodeToUpdate: TreeNode): TreeNode => {
              if (nodeToUpdate.id === node.id) {
                return {
                  ...nodeToUpdate,
                  children: [...memberNodes, ...parentNodes]
                }
              }
              if (nodeToUpdate.children) {
                return {
                  ...nodeToUpdate,
                  children: nodeToUpdate.children.map(updateNode)
                }
              }
              return nodeToUpdate
            }
            
            const updatedRoot = updateNode(rootNode)
            setTreeData({ nodes: [updatedRoot], links: [] })
          }
          
          // Set group details
          const enhancedGroup: Group = {
            ...group,
            members,
            memberOf,
          }
          setSelectedGroup(enhancedGroup)
          
        } catch (error) {
          console.error('Error loading group details:', error)
          setError(`Failed to load group details: ${error instanceof Error ? error.message : 'Unknown error'}`)
        } finally {
          setLoading(false)
        }
      }
    }
    
    console.log('New expanded nodes:', Array.from(newExpandedNodes))
    setExpandedNodes(newExpandedNodes)
  }

  const handleGroupMemberSelect = async (member: GroupMember) => {
    if (member['@odata.type'].includes('user')) {
      const user: User = {
        id: member.id,
        displayName: member.displayName,
        userPrincipalName: member.userPrincipalName || '',
        mail: member.mail,
      }
      await handleUserSelect(user)
    } else if (member['@odata.type'].includes('group')) {
      // Create a tree node for the group and select it
      const group: Group = {
        id: member.id,
        displayName: member.displayName,
        description: '',
        groupTypes: []
      }
      const groupNode: TreeNode = {
        id: member.id,
        name: member.displayName,
        type: 'group',
        data: group,
        children: []
      }
      await handleNodeSelect(groupNode)
    }
  }

  // Show loading screen during initial auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Loading...</h2>
          <p className="text-white/70">Checking authentication status</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center relative">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4 relative z-10">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 flex items-center justify-center mb-4">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-10 h-10 object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Group Tree Membership Visualizer</h1>
            <p className="text-gray-600 mb-6">
              Explore Entra ID group memberships and hierarchies with interactive visualizations
            </p>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            <div className="flex justify-center">
              <button
                onClick={async () => {
                  try {
                    setAuthLoading(true)
                    setError(null)
                    const account = await authService.signIn()
                    console.log('Sign in successful, account:', account)
                    
                    // Force a fresh auth check
                    const user = await authService.getCurrentUser()
                    if (user) {
                      console.log('User authenticated:', user)
                      setIsAuthenticated(true)
                      setCurrentUser(user)
                      // Load data after successful authentication
                      await loadUsers()
                      await loadGroups()
                      await loadDevices()
                    } else {
                      console.error('No user found after sign in')
                      setError('Authentication succeeded but user info not available. Please try refreshing.')
                    }
                  } catch (error) {
                    console.error('Sign in failed:', error)
                    const errorMessage = error instanceof Error ? error.message : 'Please try again.'
                    setError(`Sign in failed: ${errorMessage}`)
                  } finally {
                    setAuthLoading(false)
                  }
                }}
                disabled={authLoading}
                className="inline-block bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center disabled:opacity-50"
              >
                {authLoading ? 'Signing in...' : 'Sign in with Microsoft'}
              </button>
            </div>
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500 leading-relaxed">
                This application was made using Next.js and React<br/>
                by <span className="font-medium text-gray-600">Ofir Gavish</span> with ❤️ to the community
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-6 h-6 bg-blue-400/30 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-3/4 right-1/4 w-4 h-4 bg-purple-400/25 rounded-full blur-lg animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-pink-400/35 rounded-full blur-md animate-float-delayed"></div>
        <div className="absolute top-1/2 right-1/2 w-2 h-2 bg-indigo-400/40 rounded-full blur-sm animate-pulse delay-3000"></div>
        <div className="absolute top-1/6 right-1/3 w-5 h-5 bg-teal-400/25 rounded-full blur-lg animate-bounce"></div>
        <div className="absolute bottom-1/3 right-1/6 w-4 h-4 bg-cyan-400/30 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-2/3 left-1/6 w-3 h-3 bg-yellow-400/25 rounded-full blur-md animate-pulse delay-2000"></div>
        <div className="absolute bottom-1/6 left-2/3 w-2 h-2 bg-emerald-400/35 rounded-full blur-sm animate-float delay-4000"></div>
      </div>

      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md shadow-lg border-b border-white/20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-white">
              Group Tree Membership Visualizer
            </h1>
            <div className="flex items-center gap-4">
              {/* Cache Management */}
              <div className="flex items-center gap-2 text-sm text-white/80">
                <span>Cache: {cacheStats.totalItems} items</span>
                <button
                  onClick={clearCache}
                  className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded border border-white/20 hover:border-white/30 transition-colors"
                  title="Clear cache to force fresh data"
                >
                  Clear
                </button>
              </div>
              
              {currentUser && (
                <span className="text-sm text-white/80">
                  {currentUser.displayName}
                </span>
              )}
              <button
                onClick={async () => {
                  try {
                    await authService.signOut()
                    setIsAuthenticated(false)
                    setCurrentUser(null)
                    setUsers([])
                    setGroups([])
                    setDevices([])
                    setSelectedUser(null)
                    setSelectedDevice(null)
                    setTreeData({ nodes: [], links: [] })
                    setSelectedNode(null)
                    setSelectedGroup(null)
                  } catch (error) {
                    console.error('Sign out failed:', error)
                  }
                }}
                className="text-sm text-white/80 hover:text-white px-3 py-1 rounded-md hover:bg-white/10 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {error && (
          <div className="mb-6 bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-lg p-4">
            <div className="flex">
              <div className="text-red-100 text-sm">{error}</div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-300 hover:text-red-100"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Search Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-white">
              Select a {searchType === 'user' ? 'User' : searchType === 'group' ? 'Group' : 'Device'}
            </h2>
            <div className="flex bg-white/5 backdrop-blur-sm rounded-2xl p-1.5 shadow-lg">
              <button
                onClick={() => setSearchType('user')}
                className={`px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 relative overflow-hidden group ${
                  searchType === 'user'
                    ? 'bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 text-white shadow-xl transform scale-105 shadow-blue-500/25'
                    : 'text-white/70 hover:text-white hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-cyan-500/20'
                }`}
              >
                {/* Animated background for active state */}
                {searchType === 'user' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 via-cyan-400/30 to-blue-400/30 animate-pulse"></div>
                )}
                {/* Hover glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-cyan-400/20 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative flex items-center gap-2">
                  <span className="text-lg">👤</span>
                  Users
                </span>
              </button>
              <button
                onClick={() => setSearchType('group')}
                className={`px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 relative overflow-hidden group ${
                  searchType === 'group'
                    ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white shadow-xl transform scale-105 shadow-purple-500/25'
                    : 'text-white/70 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-pink-500/20'
                }`}
              >
                {/* Animated background for active state */}
                {searchType === 'group' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400/30 via-pink-400/30 to-purple-400/30 animate-pulse"></div>
                )}
                {/* Hover glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-pink-400/20 to-purple-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative flex items-center gap-2">
                  <span className="text-lg">👥</span>
                  Groups
                </span>
              </button>
              <button
                onClick={() => setSearchType('device')}
                className={`px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 relative overflow-hidden group ${
                  searchType === 'device'
                    ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 text-white shadow-xl transform scale-105 shadow-green-500/25'
                    : 'text-white/70 hover:text-white hover:bg-gradient-to-r hover:from-green-500/20 hover:to-emerald-500/20'
                }`}
              >
                {/* Animated background for active state */}
                {searchType === 'device' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400/30 via-emerald-400/30 to-green-400/30 animate-pulse"></div>
                )}
                {/* Hover glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-emerald-400/20 to-green-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative flex items-center gap-2">
                  <span className="text-lg">💻</span>
                  Devices
                </span>
              </button>
            </div>
          </div>
          <div className="flex justify-center p-6">
            <div className="w-full max-w-xs" style={{ maxWidth: '320px' }}>
              {searchType === 'user' ? (
                <UserSearch users={users} onUserSelect={handleUserSelect} />
              ) : searchType === 'group' ? (
                <GroupSearch groups={groups} onGroupSelect={handleGroupSelect} />
              ) : (
                <DeviceSearch devices={devices} onDeviceSelect={handleDeviceSelect} />
              )}
              {loading && (
                <div className="mt-4 text-sm text-white/70 flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Loading...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Visualization and Details */}
        {(selectedUser || selectedGroup || selectedDevice) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Tree Visualization */}
            <div className="lg:col-span-2">
              <TreeVisualization
                data={treeData}
                onNodeSelect={handleNodeSelect}
                selectedNode={selectedNode || undefined}
                expandedNodes={expandedNodes}
              />
            </div>

            {/* Details Panel */}
            <div className="space-y-6">
              {/* Selected User/Group/Device Info */}
              {selectedUser && (
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Selected User</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-medium">
                      {selectedUser.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-white">{selectedUser.displayName}</div>
                      <div className="text-sm text-white/70">{selectedUser.userPrincipalName}</div>
                      {selectedUser.jobTitle && (
                        <div className="text-xs text-white/60">{selectedUser.jobTitle}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {selectedDevice && (
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Selected Device</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-medium">
                      {selectedDevice.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-white">{selectedDevice.displayName}</div>
                      {selectedDevice.operatingSystem && (
                        <div className="text-sm text-white/70">{selectedDevice.operatingSystem}</div>
                      )}
                      {selectedDevice.deviceId && (
                        <div className="text-xs text-white/60">ID: {selectedDevice.deviceId}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {selectedGroup && (
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Selected Group</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                      {selectedGroup.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-white">{selectedGroup.displayName}</div>
                      {selectedGroup.description && (
                        <div className="text-sm text-white/70">{selectedGroup.description}</div>
                      )}
                      {selectedGroup.members && (
                        <div className="text-xs text-white/60">
                          {selectedGroup.members.length} member{selectedGroup.members.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Group Details */}
              {selectedGroup && (
                <GroupDetails
                  group={selectedGroup}
                  onMemberSelect={handleGroupMemberSelect}
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
