'use client'

import { useState, useEffect } from 'react'
import { StaticWebAppAuthService } from '@/lib/static-web-app-auth'
import { ApiGraphService } from '@/lib/api-graph-service'
import { User, Group, TreeNode, TreeData, GroupMember } from '@/types'
import UserSearch from '@/components/UserSearch'
import GroupSearch from '@/components/GroupSearch'
import TreeVisualization from '@/components/TreeVisualization'
import GroupDetails from '@/components/GroupDetails'

export default function SimpleHomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [users, setUsers] = useState<User[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [treeData, setTreeData] = useState<TreeData>({ nodes: [], links: [] })
  const [fullTreeData, setFullTreeData] = useState<TreeNode | null>(null)
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [searchType, setSearchType] = useState<'user' | 'group'>('user')

  const authService = new StaticWebAppAuthService()

  useEffect(() => {
    checkAuthStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array is intentional - we only want to run this once on mount

  const checkAuthStatus = async () => {
    try {
      const user = await authService.getCurrentUser()
      if (user) {
        setIsAuthenticated(true)
        setCurrentUser(user)
        await loadUsers()
        await loadGroups()
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    }
  }

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const graphService = new ApiGraphService()
      const allUsers = await graphService.getAllUsers()
      setUsers(allUsers)
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
    } catch (error) {
      console.error('Error loading groups:', error)
      setError('Failed to load groups. Please check your permissions.')
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
    
    // Handle user node selection - load their group memberships as new branches
    if (node.type === 'user') {
      const user = node.data as User
      const userId = (user as any).originalId || user.id // Use original ID for API calls
      console.log('User node selected, loading their group memberships:', user.displayName)
      
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
        
        // Add the group nodes as children of the user node
        const updateTreeData = (nodes: TreeNode[]): TreeNode[] => {
          return nodes.map(n => {
            if (n.id === node.id) {
              return {
                ...n,
                children: groupNodes
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
        
        if (treeData.nodes.length > 0) {
          const rootNode = treeData.nodes[0]
          const updateNode = (nodeToUpdate: TreeNode): TreeNode => {
            if (nodeToUpdate.id === node.id) {
              return {
                ...nodeToUpdate,
                children: groupNodes
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
          
          // Expand the user node to show their groups
          const newExpandedNodes = new Set(expandedNodes)
          newExpandedNodes.add(node.id)
          setExpandedNodes(newExpandedNodes)
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Error loading user groups:', error)
        setError('Failed to load user group memberships')
        setLoading(false)
      }
      return
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Group Tree Membership Visualizer</h1>
            <p className="text-gray-600 mb-6">
              Explore Entra ID group memberships and hierarchies with interactive visualizations
            </p>
            <a
              href={authService.getLoginUrl()}
              className="w-full inline-block bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
            >
              Sign in with Microsoft
            </a>
            <p className="text-xs text-gray-500 mt-4">
              Using Azure Static Web Apps built-in authentication
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-48 h-48 bg-pink-400/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute top-1/2 right-1/2 w-32 h-32 bg-indigo-400/10 rounded-full blur-2xl animate-pulse delay-3000"></div>
      </div>

      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md shadow-lg border-b border-white/20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-white">
              Group Tree Membership Visualizer
            </h1>
            <div className="flex items-center gap-4">
              {currentUser && (
                <span className="text-sm text-white/80">
                  {currentUser.displayName}
                </span>
              )}
              <a
                href={authService.getLogoutUrl()}
                className="text-sm text-white/80 hover:text-white px-3 py-1 rounded-md hover:bg-white/10 transition-colors"
              >
                Sign out
              </a>
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
              Select a {searchType === 'user' ? 'User' : 'Group'}
            </h2>
            <div className="flex bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setSearchType('user')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  searchType === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setSearchType('group')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  searchType === 'group'
                    ? 'bg-blue-500 text-white'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                Groups
              </button>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            {searchType === 'user' ? (
              <UserSearch users={users} onUserSelect={handleUserSelect} />
            ) : (
              <GroupSearch groups={groups} onGroupSelect={handleGroupSelect} />
            )}
            {loading && (
              <div className="mt-4 text-sm text-white/70 flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Loading...
              </div>
            )}
          </div>
        </div>

        {/* Visualization and Details */}
        {(selectedUser || selectedGroup) && (
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
              {/* Selected User/Group Info */}
              {selectedUser && (
                <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg p-6 border border-white/20">
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

              {selectedGroup && (
                <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg p-6 border border-white/20">
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
