import { Client } from '@microsoft/microsoft-graph-client'
import { User, Group, GroupMember, TreeNode } from '@/types'

export class SimpleGraphService {
  private graphClient: Client | null = null

  constructor(accessToken: string) {
    if (accessToken) {
      this.graphClient = Client.init({
        authProvider: {
          getAccessToken: async () => {
            return accessToken
          }
        } as any
      })
    }
  }

  async getAllUsers(): Promise<User[]> {
    if (!this.graphClient) throw new Error('Not authenticated')

    try {
      const response = await this.graphClient
        .api('/users')
        .select('id,displayName,userPrincipalName,mail,jobTitle,department')
        .top(100)
        .get()

      return response.value.map((user: any) => ({
        id: user.id,
        displayName: user.displayName,
        userPrincipalName: user.userPrincipalName,
        mail: user.mail,
        jobTitle: user.jobTitle,
        department: user.department,
      }))
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    if (!this.graphClient) throw new Error('Not authenticated')

    try {
      const response = await this.graphClient
        .api(`/users/${userId}/memberOf`)
        .select('id,displayName,description,groupTypes')
        .get()

      return response.value
        .filter((item: any) => item['@odata.type'] === '#microsoft.graph.group')
        .map((group: any) => ({
          id: group.id,
          displayName: group.displayName,
          description: group.description,
          groupTypes: group.groupTypes || [],
        }))
    } catch (error) {
      console.error('Error fetching user groups:', error)
      throw error
    }
  }

  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    if (!this.graphClient) throw new Error('Not authenticated')

    try {
      const response = await this.graphClient
        .api(`/groups/${groupId}/members`)
        .select('id,displayName,userPrincipalName,mail')
        .get()

      return response.value.map((member: any) => ({
        '@odata.type': member['@odata.type'],
        id: member.id,
        displayName: member.displayName,
        userPrincipalName: member.userPrincipalName,
        mail: member.mail,
      }))
    } catch (error) {
      console.error('Error fetching group members:', error)
      throw error
    }
  }

  async getGroupMemberOf(groupId: string): Promise<Group[]> {
    if (!this.graphClient) throw new Error('Not authenticated')

    try {
      const response = await this.graphClient
        .api(`/groups/${groupId}/memberOf`)
        .select('id,displayName,description,groupTypes')
        .get()

      return response.value
        .filter((item: any) => item['@odata.type'] === '#microsoft.graph.group')
        .map((group: any) => ({
          id: group.id,
          displayName: group.displayName,
          description: group.description,
          groupTypes: group.groupTypes || [],
        }))
    } catch (error) {
      console.error('Error fetching group memberOf:', error)
      throw error
    }
  }

  async buildGroupTree(userId: string): Promise<TreeNode> {
    const user = await this.getUser(userId)
    const userGroups = await this.getUserGroups(userId)

    const rootNode: TreeNode = {
      id: user.id,
      name: user.displayName,
      type: 'user',
      data: user,
      children: userGroups.map(group => ({
        id: group.id,
        name: group.displayName,
        type: 'group' as const,
        data: group,
        children: [],
      })),
    }

    return rootNode
  }

  private async getUser(userId: string): Promise<User> {
    if (!this.graphClient) throw new Error('Not authenticated')

    try {
      const user = await this.graphClient
        .api(`/users/${userId}`)
        .select('id,displayName,userPrincipalName,mail,jobTitle,department')
        .get()

      return {
        id: user.id,
        displayName: user.displayName,
        userPrincipalName: user.userPrincipalName,
        mail: user.mail,
        jobTitle: user.jobTitle,
        department: user.department,
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      throw error
    }
  }
}
