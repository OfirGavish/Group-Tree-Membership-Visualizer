import { 
  EntraRoleAssignment, 
  AzureRoleAssignment, 
  IntuneConfigProfile, 
  CompliancePolicy, 
  AppProtectionPolicy,
  EnhancedUserInfo,
  EnhancedGroupInfo,
  EnhancedDeviceInfo,
  EntraRoleAssignmentsResponse,
  AzureRoleAssignmentsResponse,
  IntuneConfigProfilesResponse,
  CompliancePoliciesResponse,
  AppProtectionPoliciesResponse
} from '@/types/enhanced-types'
import { User, Group, Device } from '@/types'
import { authService } from './msal-auth-service'
import { CacheService } from './cache-service'

export class EnhancedApiService {
  private baseUrl = ''

  /**
   * Get authorization headers with delegated access token
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    try {
      const token = await authService.getAccessToken()
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-delegated-access-token': token
      }
    } catch (error) {
      console.error('Error getting auth headers:', error)
      throw new Error('Authentication required')
    }
  }

  /**
   * Get Entra ID role assignments for a user, group, or device
   */
  async getEntraRoleAssignments(principalId: string, principalType: 'user' | 'group' | 'device'): Promise<EntraRoleAssignment[]> {
    try {
      const cacheKey = `cache:entra-roles:${principalId}`
      const cached = CacheService.get<EntraRoleAssignment[]>(cacheKey)
      if (cached) {
        return cached
      }

      const headers = await this.getAuthHeaders()
      const response = await fetch(`/api/getEntraRoleAssignments?principalId=${encodeURIComponent(principalId)}&principalType=${principalType}`, { headers })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Entra role assignments: ${response.status}`)
      }
      
      const data: EntraRoleAssignmentsResponse = await response.json()
      const roles = data.value || []
      
      // Cache for 15 minutes (role assignments don't change frequently)
      CacheService.set(cacheKey, roles, 'memberships')
      
      return roles
    } catch (error) {
      console.error('Error fetching Entra role assignments:', error)
      return [] // Return empty array instead of throwing to prevent breaking the UI
    }
  }

  /**
   * Get Azure resource role assignments for a user, group, or device
   */
  async getAzureRoleAssignments(principalId: string, principalType: 'user' | 'group' | 'device'): Promise<AzureRoleAssignment[]> {
    try {
      const cacheKey = `cache:azure-roles:${principalId}`
      const cached = CacheService.get<AzureRoleAssignment[]>(cacheKey)
      if (cached) {
        return cached
      }

      const headers = await this.getAuthHeaders()
      const response = await fetch(`/api/getAzureRoleAssignments?principalId=${encodeURIComponent(principalId)}&principalType=${principalType}`, { headers })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Azure role assignments: ${response.status}`)
      }
      
      const data: AzureRoleAssignmentsResponse = await response.json()
      const roles = data.value || []
      
      // Cache for 15 minutes
      CacheService.set(cacheKey, roles, 'memberships')
      
      return roles
    } catch (error) {
      console.error('Error fetching Azure role assignments:', error)
      return [] // Return empty array instead of throwing
    }
  }

  /**
   * Get Intune configuration profiles assigned to a user, group, or device
   */
  async getIntuneConfigProfiles(targetId: string, targetType: 'user' | 'group' | 'device'): Promise<IntuneConfigProfile[]> {
    try {
      const cacheKey = `cache:intune-profiles:${targetId}`
      const cached = CacheService.get<IntuneConfigProfile[]>(cacheKey)
      if (cached) {
        return cached
      }

      const headers = await this.getAuthHeaders()
      const response = await fetch(`/api/getIntuneConfigProfiles?targetId=${encodeURIComponent(targetId)}&targetType=${targetType}`, { headers })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Intune configuration profiles: ${response.status}`)
      }
      
      const data: IntuneConfigProfilesResponse = await response.json()
      const profiles = data.value || []
      
      // Cache for 10 minutes (configuration changes more frequently)
      CacheService.set(cacheKey, profiles, 'memberships')
      
      return profiles
    } catch (error) {
      console.error('Error fetching Intune configuration profiles:', error)
      return []
    }
  }

  /**
   * Get compliance policies assigned to a user, group, or device
   */
  async getCompliancePolicies(targetId: string, targetType: 'user' | 'group' | 'device'): Promise<CompliancePolicy[]> {
    try {
      const cacheKey = `cache:compliance-policies:${targetId}`
      const cached = CacheService.get<CompliancePolicy[]>(cacheKey)
      if (cached) {
        return cached
      }

      const headers = await this.getAuthHeaders()
      const response = await fetch(`/api/getCompliancePolicies?targetId=${encodeURIComponent(targetId)}&targetType=${targetType}`, { headers })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch compliance policies: ${response.status}`)
      }
      
      const data: CompliancePoliciesResponse = await response.json()
      const policies = data.value || []
      
      // Cache for 10 minutes
      CacheService.set(cacheKey, policies, 'memberships')
      
      return policies
    } catch (error) {
      console.error('Error fetching compliance policies:', error)
      return []
    }
  }

  /**
   * Get app protection policies assigned to a user or group
   */
  async getAppProtectionPolicies(targetId: string, targetType: 'user' | 'group'): Promise<AppProtectionPolicy[]> {
    try {
      const cacheKey = `cache:app-protection-policies:${targetId}`
      const cached = CacheService.get<AppProtectionPolicy[]>(cacheKey)
      if (cached) {
        return cached
      }

      const headers = await this.getAuthHeaders()
      const response = await fetch(`/api/getAppProtectionPolicies?targetId=${encodeURIComponent(targetId)}&targetType=${targetType}`, { headers })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch app protection policies: ${response.status}`)
      }
      
      const data: AppProtectionPoliciesResponse = await response.json()
      const policies = data.value || []
      
      // Cache for 10 minutes
      CacheService.set(cacheKey, policies, 'memberships')
      
      return policies
    } catch (error) {
      console.error('Error fetching app protection policies:', error)
      return []
    }
  }

  /**
   * Get additional user properties from Microsoft Graph
   */
  async getAdditionalUserInfo(userId: string): Promise<Partial<EnhancedUserInfo>> {
    try {
      const cacheKey = `cache:user-details:${userId}`
      const cached = CacheService.get<Partial<EnhancedUserInfo>>(cacheKey)
      if (cached) {
        return cached
      }

      const headers = await this.getAuthHeaders()
      
      // Get detailed user information including sign-in activity and licenses
      const response = await fetch(`https://graph.microsoft.com/v1.0/users/${userId}?$select=id,displayName,userPrincipalName,mail,accountEnabled,createdDateTime,userType,assignedLicenses,signInActivity`, {
        headers
      })

      if (!response.ok) {
        throw new Error(`Failed to get user details: ${response.status}`)
      }

      const userDetails = await response.json()
      
      const additionalInfo: Partial<EnhancedUserInfo> = {
        accountEnabled: userDetails.accountEnabled,
        createdDateTime: userDetails.createdDateTime,
        userType: userDetails.userType,
        assignedLicenses: userDetails.assignedLicenses,
        signInActivity: userDetails.signInActivity
      }

      // Get last sign-in information separately if not included
      if (!userDetails.signInActivity) {
        try {
          const signInResponse = await fetch(`https://graph.microsoft.com/beta/users/${userId}?$select=signInActivity`, {
            headers
          })
          if (signInResponse.ok) {
            const signInData = await signInResponse.json()
            additionalInfo.signInActivity = signInData.signInActivity
          }
        } catch (error) {
          console.log('Could not fetch sign-in activity:', error)
        }
      }

      CacheService.set(cacheKey, additionalInfo, 'users') // Cache for user details
      return additionalInfo
    } catch (error) {
      console.error('Error getting additional user info:', error)
      return {}
    }
  }

  /**
   * Get additional device properties from Microsoft Graph
   */
  async getAdditionalDeviceInfo(deviceId: string): Promise<Partial<EnhancedDeviceInfo>> {
    try {
      const cacheKey = `cache:device-details:${deviceId}`
      const cached = CacheService.get<Partial<EnhancedDeviceInfo>>(cacheKey)
      if (cached) {
        return cached
      }

      const headers = await this.getAuthHeaders()
      
      // Get detailed device information
      const response = await fetch(`https://graph.microsoft.com/v1.0/devices/${deviceId}?$select=id,displayName,deviceId,operatingSystem,operatingSystemVersion,isCompliant,isManaged,registrationDateTime,approximateLastSignInDateTime,managementType,joinType,deviceOwnership,enrollmentType`, {
        headers
      })

      if (!response.ok) {
        throw new Error(`Failed to get device details: ${response.status}`)
      }

      const deviceDetails = await response.json()
      
      // Get device owner information
      let owner = 'Unknown'
      try {
        const ownerResponse = await fetch(`https://graph.microsoft.com/v1.0/devices/${deviceId}/registeredOwners?$select=displayName,userPrincipalName`, {
          headers
        })
        if (ownerResponse.ok) {
          const ownerData = await ownerResponse.json()
          if (ownerData.value && ownerData.value.length > 0) {
            owner = ownerData.value[0].displayName || ownerData.value[0].userPrincipalName
          }
        }
      } catch (error) {
        console.log('Could not fetch device owner:', error)
      }

      const additionalInfo: Partial<EnhancedDeviceInfo> = {
        joinType: deviceDetails.joinType || deviceDetails.deviceOwnership,
        owner: owner,
        mdmEnrollmentStatus: deviceDetails.enrollmentType || (deviceDetails.isManaged ? 'Enrolled' : 'Not Enrolled'),
        managementType: deviceDetails.managementType,
        approximateLastSignInDateTime: deviceDetails.approximateLastSignInDateTime,
        registrationDateTime: deviceDetails.registrationDateTime
      }

      CacheService.set(cacheKey, additionalInfo, 'memberships') // Cache for device details
      return additionalInfo
    } catch (error) {
      console.error('Error getting additional device info:', error)
      return {}
    }
  }

  /**
   * Get enhanced information for a user (including role assignments and Intune policies)
   */
  async getEnhancedUserInfo(user: User): Promise<EnhancedUserInfo> {
    try {
      const [
        entraRoles,
        azureRoles,
        intuneProfiles,
        compliancePolicies,
        appProtectionPolicies,
        additionalUserInfo
      ] = await Promise.allSettled([
        this.getEntraRoleAssignments(user.id, 'user'),
        this.getAzureRoleAssignments(user.id, 'user'),
        this.getIntuneConfigProfiles(user.id, 'user'),
        this.getCompliancePolicies(user.id, 'user'),
        this.getAppProtectionPolicies(user.id, 'user'),
        this.getAdditionalUserInfo(user.id)
      ])

      const enhancedUser: EnhancedUserInfo = {
        ...user,
        entraRoles: entraRoles.status === 'fulfilled' ? entraRoles.value : [],
        azureRoles: azureRoles.status === 'fulfilled' ? azureRoles.value : [],
        assignedIntuneProfiles: intuneProfiles.status === 'fulfilled' ? intuneProfiles.value : [],
        assignedCompliancePolicies: compliancePolicies.status === 'fulfilled' ? compliancePolicies.value : [],
        assignedAppProtectionPolicies: appProtectionPolicies.status === 'fulfilled' ? appProtectionPolicies.value : [],
        ...(additionalUserInfo.status === 'fulfilled' ? additionalUserInfo.value : {})
      }

      return enhancedUser
    } catch (error) {
      console.error('Error getting enhanced user info:', error)
      // Return basic user info if enhanced info fails
      return { ...user }
    }
  }

  /**
   * Get enhanced information for a group
   */
  async getEnhancedGroupInfo(group: Group): Promise<EnhancedGroupInfo> {
    try {
      const [
        entraRoles,
        azureRoles,
        intuneProfiles,
        compliancePolicies,
        appProtectionPolicies
      ] = await Promise.allSettled([
        this.getEntraRoleAssignments(group.id, 'group'),
        this.getAzureRoleAssignments(group.id, 'group'),
        this.getIntuneConfigProfiles(group.id, 'group'),
        this.getCompliancePolicies(group.id, 'group'),
        this.getAppProtectionPolicies(group.id, 'group')
      ])

      const enhancedGroup: EnhancedGroupInfo = {
        ...group,
        entraRoles: entraRoles.status === 'fulfilled' ? entraRoles.value : [],
        azureRoles: azureRoles.status === 'fulfilled' ? azureRoles.value : [],
        assignedIntuneProfiles: intuneProfiles.status === 'fulfilled' ? intuneProfiles.value : [],
        assignedCompliancePolicies: compliancePolicies.status === 'fulfilled' ? compliancePolicies.value : [],
        assignedAppProtectionPolicies: appProtectionPolicies.status === 'fulfilled' ? appProtectionPolicies.value : []
      }

      return enhancedGroup
    } catch (error) {
      console.error('Error getting enhanced group info:', error)
      return { ...group }
    }
  }

  /**
   * Get enhanced information for a device
   */
  async getEnhancedDeviceInfo(device: Device): Promise<EnhancedDeviceInfo> {
    try {
      const [
        entraRoles,
        azureRoles,
        intuneProfiles,
        compliancePolicies,
        additionalDeviceInfo
      ] = await Promise.allSettled([
        this.getEntraRoleAssignments(device.id, 'device'),
        this.getAzureRoleAssignments(device.id, 'device'),
        this.getIntuneConfigProfiles(device.id, 'device'),
        this.getCompliancePolicies(device.id, 'device'),
        this.getAdditionalDeviceInfo(device.id)
      ])

      const enhancedDevice: EnhancedDeviceInfo = {
        ...device,
        entraRoles: entraRoles.status === 'fulfilled' ? entraRoles.value : [],
        azureRoles: azureRoles.status === 'fulfilled' ? azureRoles.value : [],
        assignedIntuneProfiles: intuneProfiles.status === 'fulfilled' ? intuneProfiles.value : [],
        assignedCompliancePolicies: compliancePolicies.status === 'fulfilled' ? compliancePolicies.value : [],
        ...(additionalDeviceInfo.status === 'fulfilled' ? additionalDeviceInfo.value : {})
      }

      return enhancedDevice
    } catch (error) {
      console.error('Error getting enhanced device info:', error)
      return { ...device }
    }
  }

  /**
   * Clear all enhanced data caches
   */
  clearEnhancedCaches(): void {
    // Clear role assignments caches
    CacheService.clear()
  }
}

// Export singleton instance
export const enhancedApiService = new EnhancedApiService()
