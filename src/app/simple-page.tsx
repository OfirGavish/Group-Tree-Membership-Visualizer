'use client'

import { useState, useEffect } from 'react'
import { StaticWebAppAuthService } from '@/lib/static-web-app-auth'
import { ApiGraphService } from '@/lib/api-graph-service'
import { User, Group, TreeNode, TreeData, GroupMember } from '@/types'
import UserSearch from '@/components/UserSearch'
import TreeVisualization from '@/components/TreeVisualization'
import GroupDetails from '@/components/GroupDetails'

export default function SimpleHomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [treeData, setTreeData] = useState<TreeData>({ nodes: [], links: [] })
  const [fullTreeData, setFullTreeData] = useState<TreeNode | null>(null)
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

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
      
      // Start with only the root visible, hide all children initially
      const collapsedRoot = {
        ...rootNode,
        children: [] // Start completely collapsed
      }
      
      // Reset expanded nodes - none expanded initially
      const newExpandedNodes = new Set<string>()
      setExpandedNodes(newExpandedNodes)
      
      setTreeData({ nodes: [collapsedRoot], links: [] })
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

  const handleNodeSelect = async (node: TreeNode) => {
    if (!currentUser) return

    console.log('Node selected:', node.name, node.type, 'Current expanded nodes:', Array.from(expandedNodes))
    setSelectedNode(node)
    
    // Handle expanding/collapsing nodes
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
          
          // Load group members
          const members = await graphService.getGroupMembers(group.id)
          
          // Load groups this group belongs to
          const memberOf = await graphService.getGroupMemberOf(group.id)
          
          // Create new child nodes for members
          const memberNodes: TreeNode[] = members.map(member => {
            if (member['@odata.type'].includes('user')) {
              const user: User = {
                id: member.id,
                displayName: member.displayName,
                userPrincipalName: member.userPrincipalName || '',
                mail: member.mail,
              }
              return {
                id: member.id,
                name: member.displayName,
                type: 'user' as const,
                data: user,
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
                id: member.id,
                name: member.displayName,
                type: 'group' as const,
                data: group,
                children: []
              }
            }
          })
          
          // Create new parent nodes for groups this group belongs to
          const parentNodes: TreeNode[] = memberOf.map(parentGroup => ({
            id: `parent-${parentGroup.id}`,
            name: `${parentGroup.displayName} (parent)`,
            type: 'group',
            data: parentGroup,
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              Group Tree Membership Visualizer
            </h1>
            <div className="flex items-center gap-4">
              {currentUser && (
                <span className="text-sm text-gray-600">
                  {currentUser.displayName}
                </span>
              )}
              <a
                href={authService.getLogoutUrl()}
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded-md hover:bg-gray-100"
              >
                Sign out
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="text-red-800 text-sm">{error}</div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Search Section */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Select a User</h2>
          <UserSearch users={users} onUserSelect={handleUserSelect} />
          {loading && (
            <div className="mt-4 text-sm text-gray-600">Loading...</div>
          )}
        </div>

        {/* Visualization and Details */}
        {selectedUser && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Tree Visualization */}
            <div className="lg:col-span-2">
              <TreeVisualization
                data={treeData}
                onNodeSelect={handleNodeSelect}
                selectedNode={selectedNode || undefined}
              />
            </div>

            {/* Details Panel */}
            <div className="space-y-6">
              {/* Selected User Info */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Selected User</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-medium">
                    {selectedUser.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{selectedUser.displayName}</div>
                    <div className="text-sm text-gray-500">{selectedUser.userPrincipalName}</div>
                    {selectedUser.jobTitle && (
                      <div className="text-xs text-gray-400">{selectedUser.jobTitle}</div>
                    )}
                  </div>
                </div>
              </div>

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
