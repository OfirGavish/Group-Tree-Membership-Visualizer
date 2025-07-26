import { User, Group, GroupMember, TreeNode, Device } from '@/types'
import { CacheService } from './cache-service'
import { authService } from './msal-auth-service'

export class ApiGraphService {
  private baseUrl = ''

  /**
   * Get authorization headers with delegated access token
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    const accessToken = await authService.getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available. Please sign in.');
    }

    return {
      'Content-Type': 'application/json',
      'x-delegated-access-token': accessToken // Pass the delegated token to the API
    };
  }

  async getAllUsers(): Promise<User[]> {
    try {
      // Check cache first
      const cacheKey = CacheService.keys.allUsers()
      const cached = CacheService.get<User[]>(cacheKey)
      if (cached) {
        return cached
      }

      // Get delegated token headers
      const headers = await this.getAuthHeaders();

      // Fetch from API with delegated token
      const response = await fetch('/api/getUsers', { headers })
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`)
      }
      
      const users = await response.json()
      
      // Cache the result
      CacheService.set(cacheKey, users, 'users')
      
      return users
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  }

  async getAllGroups(search?: string): Promise<Group[]> {
    try {
      // For searches, we don't cache to get fresh results
      // For full group list (no search), we cache it
      const shouldCache = !search
      const cacheKey = CacheService.keys.allGroups()
      
      if (shouldCache) {
        const cached = CacheService.get<Group[]>(cacheKey)
        if (cached) {
          return cached
        }
      }

      // Get delegated token headers
      const headers = await this.getAuthHeaders();

      // Fetch from API with delegated token
      const url = search ? `/api/getGroups?search=${encodeURIComponent(search)}` : '/api/getGroups'
      const response = await fetch(url, { headers })
      if (!response.ok) {
        throw new Error(`Failed to fetch groups: ${response.status}`)
      }
      
      const groups = await response.json()
      
      // Cache only if it's the full list (no search)
      if (shouldCache) {
        CacheService.set(cacheKey, groups, 'groups')
      }
      
      return groups
    } catch (error) {
      console.error('Error fetching groups:', error)
      throw error
    }
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    try {
      // Check cache first
      const cacheKey = CacheService.keys.userGroups(userId)
      const cached = CacheService.get<Group[]>(cacheKey)
      if (cached) {
        return cached
      }

      // Get delegated token headers
      const headers = await this.getAuthHeaders();

      // Fetch from API with delegated token
      const response = await fetch(`/api/getUserGroups?userId=${encodeURIComponent(userId)}`, { headers })
      if (!response.ok) {
        throw new Error(`Failed to fetch user groups: ${response.status}`)
      }
      
      const groups = await response.json()
      
      // Cache the result
      CacheService.set(cacheKey, groups, 'memberships')
      
      return groups
    } catch (error) {
      console.error('Error fetching user groups:', error)
      throw error
    }
  }

  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    try {
      // Check cache first
      const cacheKey = CacheService.keys.groupMembers(groupId)
      const cached = CacheService.get<GroupMember[]>(cacheKey)
      if (cached) {
        return cached
      }

      // Get delegated token headers
      const headers = await this.getAuthHeaders();

      // Fetch from API with delegated token
      const response = await fetch(`/api/getGroupMembers?groupId=${encodeURIComponent(groupId)}`, { headers })
      if (!response.ok) {
        throw new Error(`Failed to fetch group members: ${response.status}`)
      }
      
      const members = await response.json()
      
      // Cache the result
      CacheService.set(cacheKey, members, 'memberships')
      
      return members
    } catch (error) {
      console.error('Error fetching group members:', error)
      throw error
    }
  }

  async getAllDevices(search?: string): Promise<Device[]> {
    try {
      // For searches, we don't cache to get fresh results
      // For full device list (no search), we cache it
      const shouldCache = !search
      const cacheKey = 'cache:devices:all'
      
      if (shouldCache) {
        const cached = CacheService.get<Device[]>(cacheKey)
        if (cached) {
          return cached
        }
      }

      // Get delegated token headers
      const headers = await this.getAuthHeaders();

      // Fetch from API with delegated token
      const url = search ? `/api/getDevices?search=${encodeURIComponent(search)}` : '/api/getDevices'
      const response = await fetch(url, { headers })
      if (!response.ok) {
        throw new Error(`Failed to fetch devices: ${response.status}`)
      }
      
      const devices = await response.json()
      
      // Cache only if it's the full list (no search)
      if (shouldCache) {
        CacheService.set(cacheKey, devices, 'users') // Use 'users' cache duration
      }
      
      return devices
    } catch (error) {
      console.error('Error fetching devices:', error)
      throw error
    }
  }

  async getDeviceGroups(deviceId: string): Promise<Group[]> {
    try {
      // Check cache first
      const cacheKey = `cache:device:groups:${deviceId}`
      const cached = CacheService.get<Group[]>(cacheKey)
      if (cached) {
        return cached
      }

      // Get delegated token headers
      const headers = await this.getAuthHeaders();

      // Fetch from API with delegated token
      const response = await fetch(`/api/getDeviceGroups?deviceId=${encodeURIComponent(deviceId)}`, { headers })
      if (!response.ok) {
        throw new Error(`Failed to fetch device groups: ${response.status}`)
      }
      
      const groups = await response.json()
      
      // Cache the result
      CacheService.set(cacheKey, groups, 'memberships')
      
      return groups
    } catch (error) {
      console.error('Error fetching device groups:', error)
      throw error
    }
  }

  async getGroupMemberOf(groupId: string): Promise<Group[]> {
    try {
      // Check cache first
      const cacheKey = CacheService.keys.groupMemberOf(groupId)
      const cached = CacheService.get<Group[]>(cacheKey)
      if (cached) {
        return cached
      }

      // Get delegated token headers
      const headers = await this.getAuthHeaders();

      // Fetch from API with delegated token
      const response = await fetch(`/api/getGroupMemberOf?groupId=${encodeURIComponent(groupId)}`, { headers })
      if (!response.ok) {
        throw new Error(`Failed to fetch group memberOf: ${response.status}`)
      }
      
      const groups = await response.json()
      
      // Cache the result
      CacheService.set(cacheKey, groups, 'memberships')
      
      return groups
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

  async buildDeviceTree(deviceId: string): Promise<TreeNode> {
    try {
      // Get device info
      const devices = await this.getAllDevices()
      const device = devices.find(d => d.id === deviceId)
      
      if (!device) {
        throw new Error('Device not found')
      }

      // Create root node for the device
      const rootNode: TreeNode = {
        id: `device-${device.id}`,
        name: device.displayName,
        type: 'device',
        data: device,
        children: []
      }

      // Get device's groups
      const groups = await this.getDeviceGroups(deviceId)
      
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
      console.error('Error building device tree:', error)
      throw error
    }
  }

  /**
   * Add a member to a group
   */
  async addGroupMember(groupId: string, memberId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();

      console.log('🔗 Making addGroupMember API call:', { groupId, memberId });

      const response = await fetch('/api/addGroupMember', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          groupId,
          memberId
        })
      })

      console.log('🔗 API Response status:', response.status, response.statusText);
      console.log('🔗 API Response headers:', Object.fromEntries(response.headers.entries()));

      // Read the response text first
      const responseText = await response.text();
      console.log('🔗 Raw response text:', responseText);
      console.log('🔗 Response text length:', responseText.length);

      if (!response.ok) {
        console.error('🔗 API Response not OK');
        
        // Try to parse error response as JSON if possible
        let errorData;
        try {
          errorData = responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {
          console.error('🔗 Failed to parse error response as JSON:', parseError);
          throw new Error(`API call failed: ${response.status} ${response.statusText}. Response: ${responseText || 'Empty response'}`)
        }
        
        throw new Error(errorData.error || `Failed to add member to group: ${response.status}`)
      }

      // Handle successful response
      if (responseText) {
        try {
          const result = JSON.parse(responseText);
          console.log('✅ Successfully added member to group:', result);
        } catch (parseError) {
          console.warn('⚠️ Success response is not valid JSON, but operation succeeded:', parseError);
          console.log('📄 Raw response:', responseText);
        }
      } else {
        console.log('✅ API call succeeded with empty response (this is normal for some Graph operations)');
      }

      // Clear related cache entries after successful operation
      CacheService.remove(CacheService.keys.groupMembers(groupId))
      CacheService.remove(CacheService.keys.userGroups(memberId))
      // Note: Devices would also be impacted, but we'll use userGroups cache key for now
      CacheService.remove(CacheService.keys.groupMemberOf(groupId))

    } catch (error) {
      console.error('❌ Error adding group member:', error)
      throw error
    }
  }

  /**
   * Check if a user/device is a member of a specific group
   */
  async isGroupMember(groupId: string, memberId: string): Promise<boolean> {
    try {
      // Get group members and check if the member is in the list
      const members = await this.getGroupMembers(groupId)
      return members.some(member => member.id === memberId)
    } catch (error) {
      console.error('Error checking group membership:', error)
      // If we can't check, assume false to be safe
      return false
    }
  }

  /**
   * Remove a member from a group
   */
  async removeGroupMember(groupId: string, memberId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`/api/removeGroupMember?groupId=${encodeURIComponent(groupId)}&memberId=${encodeURIComponent(memberId)}`, {
        method: 'DELETE',
        headers
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to remove member from group: ${response.status}`)
      }

      // Clear related cache entries after successful operation
      CacheService.remove(CacheService.keys.groupMembers(groupId))
      CacheService.remove(CacheService.keys.userGroups(memberId))
      // Note: Devices would also be impacted, but we'll use userGroups cache key for now
      CacheService.remove(CacheService.keys.groupMemberOf(groupId))

      return await response.json()
    } catch (error) {
      console.error('Error removing group member:', error)
      throw error
    }
  }
}
