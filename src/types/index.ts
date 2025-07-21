// Types for Microsoft Graph API responses
export interface User {
  id: string
  displayName: string
  userPrincipalName: string
  mail?: string
  jobTitle?: string
  department?: string
}

export interface Group {
  id: string
  displayName: string
  description?: string
  groupTypes: string[]
  members?: GroupMember[]
  memberOf?: Group[]
  memberCount?: number
  isEmpty?: boolean
}

export interface GroupMember {
  '@odata.type': string
  id: string
  displayName: string
  userPrincipalName?: string
  mail?: string
}

// Tree visualization types
export interface TreeNode {
  id: string
  name: string
  type: 'user' | 'group'
  children?: TreeNode[]
  parent?: TreeNode
  data: User | Group
  x?: number
  y?: number
  depth?: number
}

export interface TreeData {
  nodes: TreeNode[]
  links: TreeLink[]
}

export interface TreeLink {
  source: TreeNode
  target: TreeNode
  type: 'membership' | 'nested'
}

// Component props
export interface TreeVisualizationProps {
  data: TreeData
  onNodeSelect: (node: TreeNode) => void
  selectedNode?: TreeNode
  expandedNodes: Set<string>
}

export interface UserSearchProps {
  onUserSelect: (user: User) => void
  users: User[]
}

export interface GroupDetailsProps {
  group: Group
  onMemberSelect: (member: GroupMember) => void
}

export interface GroupSearchProps {
  onGroupSelect: (group: Group) => void
  groups: Group[]
}
