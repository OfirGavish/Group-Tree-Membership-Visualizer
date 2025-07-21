import { User, Group, GroupMember, TreeNode } from '@/types'

export class ApiGraphService {
  private baseUrl = ''

  async getAllUsers(): Promise<User[]> {
    try {
      const response = await fetch('/api/getUsers')
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  }

  async getAllGroups(search?: string): Promise<Group[]> {
    try {
      const url = search ? `/api/getGroups?search=${encodeURIComponent(search)}` : '/api/getGroups'
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch groups: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching groups:', error)
      throw error
    }
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    try {
      const response = await fetch(`/api/getUserGroups?userId=${encodeURIComponent(userId)}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch user groups: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching user groups:', error)
      throw error
    }
  }

  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    try {
      const response = await fetch(`/api/getGroupMembers?groupId=${encodeURIComponent(groupId)}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch group members: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching group members:', error)
      throw error
    }
  }

  async getGroupMemberOf(groupId: string): Promise<Group[]> {
    try {
      const response = await fetch(`/api/getGroupMemberOf?groupId=${encodeURIComponent(groupId)}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch group memberOf: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching group memberOf:', error)
      throw error
    }
  }

  async buildGroupTree(userId: string): Promise<TreeNode> {
    try {
      // Get user info (we'll need to create this or get it differently)
      const users = await this.getAllUsers()
      const user = users.find(u => u.id === userId)
      
      if (!user) {
        throw new Error('User not found')
      }

      // Create root node for the user
      const rootNode: TreeNode = {
        id: `user-${user.id}`,
        name: user.displayName,
        type: 'user',
        data: user,
        children: []
      }

      // Get user's groups
      const groups = await this.getUserGroups(userId)
      
      // Add groups as children
      for (const group of groups) {
        const groupNode: TreeNode = {
          id: `group-${group.id}`,
          name: group.displayName,
          type: 'group',
          data: group,
          children: []
        }
        
        if (rootNode.children) {
          rootNode.children.push(groupNode)
        }
      }

      return rootNode
    } catch (error) {
      console.error('Error building group tree:', error)
      throw error
    }
  }
}
