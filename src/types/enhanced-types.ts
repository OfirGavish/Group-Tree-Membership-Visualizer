import { User, Group, Device } from '@/types'

// Additional interfaces for enhanced user information
export interface AssignedLicense {
  skuId: string
  servicePlans?: ServicePlan[]
  skuPartNumber?: string
  disabledPlans?: string[]
}

export interface ServicePlan {
  servicePlanId: string
  servicePlanName: string
  provisioningStatus: string
  appliesTo: string
}

export interface SignInActivity {
  lastSignInDateTime?: string
  lastSignInRequestId?: string
  lastNonInteractiveSignInDateTime?: string
  lastNonInteractiveSignInRequestId?: string
}

// Additional interfaces for enhanced device information
export interface DeviceRegistrationInfo {
  joinType?: string // AzureADJoined, Hybrid, AzureADRegistered
  owner?: string
  mdmEnrollmentStatus?: string
  managementType?: string
  deviceVersion?: string
  osVersion?: string
  lastSeenDateTime?: string
  approximateLastSignInDateTime?: string
}

// Extended types for the new functionality
export interface EntraRoleAssignment {
  id: string
  roleDefinitionId: string
  roleDefinitionName: string
  principalId: string
  principalType: string
  directoryScopeId: string
  resourceScope: string
  assignmentType: 'Eligible' | 'Active'
  startDateTime?: string
  endDateTime?: string
}

export interface AzureRoleAssignment {
  id: string
  name: string
  type: string
  roleDefinitionId: string
  roleDefinitionName: string
  principalId: string
  principalType: string
  scope: string
  condition?: string
  description?: string
  createdOn: string
  updatedOn: string
  createdBy: string
  updatedBy: string
}

export interface IntuneConfigProfile {
  id: string
  displayName: string
  description?: string
  platformType: string
  profileType: string
  createdDateTime: string
  lastModifiedDateTime: string
  version: number
  assignmentSummary?: {
    applicableDeviceCount: number
    notApplicableDeviceCount: number
    pendingDeviceCount: number
    errorDeviceCount: number
    conflictDeviceCount: number
  }
  assignmentFilters?: {
    id: string
    displayName: string
    rule: string
    platform: string
  }[]
}

export interface CompliancePolicy {
  id: string
  displayName: string
  description?: string
  platformType: string
  createdDateTime: string
  lastModifiedDateTime: string
  version: number
  scheduledActionsForRule?: any[]
  deviceStatuses?: {
    compliantDeviceCount: number
    nonCompliantDeviceCount: number
    errorDeviceCount: number
    conflictDeviceCount: number
  }
}

export interface AppProtectionPolicy {
  id: string
  displayName: string
  description?: string
  targetedAppManagementLevels: string
  appGroupType: string
  platformType: string
  createdDateTime: string
  lastModifiedDateTime: string
  version: number
  isAssigned: boolean
  deploymentSummary?: {
    successfulDeviceCount: number
    errorDeviceCount: number
    pendingInstallDeviceCount: number
    notApplicableDeviceCount: number
  }
}

export interface EnhancedUserInfo extends User {
  entraRoles?: EntraRoleAssignment[]
  azureRoles?: AzureRoleAssignment[]
  assignedIntuneProfiles?: IntuneConfigProfile[]
  assignedCompliancePolicies?: CompliancePolicy[]
  assignedAppProtectionPolicies?: AppProtectionPolicy[]
  managedDevices?: Device[]
  ownedDevices?: Device[]
  registeredDevices?: Device[]
  // Additional user properties from Entra portal
  accountEnabled?: boolean
  createdDateTime?: string
  lastSignInDateTime?: string
  userType?: string // Member or Guest
  assignedLicenses?: AssignedLicense[]
  signInActivity?: SignInActivity
}

export interface EnhancedGroupInfo extends Group {
  entraRoles?: EntraRoleAssignment[]
  azureRoles?: AzureRoleAssignment[]
  assignedIntuneProfiles?: IntuneConfigProfile[]
  assignedCompliancePolicies?: CompliancePolicy[]
  assignedAppProtectionPolicies?: AppProtectionPolicy[]
  assignmentTarget?: {
    targetType: 'Include' | 'Exclude'
    groupId: string
    filterMode?: 'Include' | 'Exclude'
    filterId?: string
  }
}

export interface EnhancedDeviceInfo extends Device {
  entraRoles?: EntraRoleAssignment[]
  azureRoles?: AzureRoleAssignment[]
  assignedIntuneProfiles?: IntuneConfigProfile[]
  assignedCompliancePolicies?: CompliancePolicy[]
  assignedAppProtectionPolicies?: AppProtectionPolicy[]
  // Additional device properties from Entra portal
  joinType?: string // AzureADJoined, Hybrid, AzureADRegistered
  owner?: string
  mdmEnrollmentStatus?: string
  managementType?: string
  approximateLastSignInDateTime?: string
  registrationDateTime?: string
  complianceState?: {
    status: 'Compliant' | 'NonCompliant' | 'InGracePeriod' | 'Error' | 'Unknown'
    lastReportedDateTime: string
    details?: {
      settingName: string
      complianceState: string
      errorCode?: string
      errorDescription?: string
    }[]
  }
  configurationStates?: {
    profileId: string
    profileName: string
    state: 'Success' | 'Error' | 'Pending' | 'NotApplicable'
    lastReportedDateTime: string
    errorCode?: string
    errorDescription?: string
  }[]
}

// API Response types for the new endpoints
export interface EntraRoleAssignmentsResponse {
  value: EntraRoleAssignment[]
  '@odata.count'?: number
  '@odata.nextLink'?: string
}

export interface AzureRoleAssignmentsResponse {
  value: AzureRoleAssignment[]
  count?: number
  nextLink?: string
}

export interface IntuneConfigProfilesResponse {
  value: IntuneConfigProfile[]
  '@odata.count'?: number
  '@odata.nextLink'?: string
}

export interface CompliancePoliciesResponse {
  value: CompliancePolicy[]
  '@odata.count'?: number
  '@odata.nextLink'?: string
}

export interface AppProtectionPoliciesResponse {
  value: AppProtectionPolicy[]
  '@odata.count'?: number
  '@odata.nextLink'?: string
}
