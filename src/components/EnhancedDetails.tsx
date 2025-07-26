'use client'

import { useState, useEffect, useCallback } from 'react'
import { TreeNode } from '@/types'
import { 
  EnhancedUserInfo, 
  EnhancedGroupInfo, 
  EnhancedDeviceInfo,
  EntraRoleAssignment,
  AzureRoleAssignment,
  IntuneConfigProfile,
  CompliancePolicy,
  AppProtectionPolicy
} from '@/types/enhanced-types'
import { enhancedApiService } from '@/lib/enhanced-api-service'

interface EnhancedDetailsProps {
  node: TreeNode
  isVisible: boolean
  onClose: () => void
}

interface LoadingState {
  entraRoles: boolean
  azureRoles: boolean
  intuneProfiles: boolean
  compliancePolicies: boolean
  appProtectionPolicies: boolean
}

export default function EnhancedDetails({ node, isVisible, onClose }: EnhancedDetailsProps) {
  const [enhancedData, setEnhancedData] = useState<EnhancedUserInfo | EnhancedGroupInfo | EnhancedDeviceInfo | null>(null)
  const [loading, setLoading] = useState<LoadingState>({
    entraRoles: false,
    azureRoles: false,
    intuneProfiles: false,
    compliancePolicies: false,
    appProtectionPolicies: false
  })
  const [activeTab, setActiveTab] = useState<'overview' | 'entra-roles' | 'azure-roles' | 'intune-profiles' | 'compliance' | 'licenses' | 'app-protection'>('overview')

  const loadEnhancedData = useCallback(async () => {
    if (!node) return

    try {
      // Set all loading states to true
      setLoading({
        entraRoles: true,
        azureRoles: true,
        intuneProfiles: true,
        compliancePolicies: true,
        appProtectionPolicies: true
      })

      let enhanced: EnhancedUserInfo | EnhancedGroupInfo | EnhancedDeviceInfo

      switch (node.type) {
        case 'user':
          enhanced = await enhancedApiService.getEnhancedUserInfo(node.data as any)
          break
        case 'group':
          enhanced = await enhancedApiService.getEnhancedGroupInfo(node.data as any)
          break
        case 'device':
          enhanced = await enhancedApiService.getEnhancedDeviceInfo(node.data as any)
          break
        default:
          enhanced = node.data as any
      }

      setEnhancedData(enhanced)
    } catch (error) {
      console.error('Error loading enhanced data:', error)
      // Set basic data if enhanced loading fails
      setEnhancedData(node.data)
    } finally {
      setLoading({
        entraRoles: false,
        azureRoles: false,
        intuneProfiles: false,
        compliancePolicies: false,
        appProtectionPolicies: false
      })
    }
  }, [node])

  useEffect(() => {
    if (isVisible && node) {
      loadEnhancedData()
    }
  }, [isVisible, node, loadEnhancedData])

  if (!isVisible || !node) return null

  const renderOverviewTab = () => {
    const userData = enhancedData as any
    
    return (
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white/10 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            {node.type === 'user' ? '👤' : node.type === 'group' ? '👥' : '💻'}
            Basic Information
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-white/70">Name:</span>
              <span className="text-white font-medium">{node.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">ID:</span>
              <span className="text-white font-mono text-sm">{node.data.id}</span>
            </div>
            {node.type === 'user' && 'userPrincipalName' in node.data && (
              <div className="flex justify-between">
                <span className="text-white/70">UPN:</span>
                <span className="text-white font-medium">{node.data.userPrincipalName}</span>
              </div>
            )}
            {node.type === 'user' && 'mail' in node.data && node.data.mail && (
              <div className="flex justify-between">
                <span className="text-white/70">Email:</span>
                <span className="text-white font-medium">{node.data.mail}</span>
              </div>
            )}
            {node.type === 'device' && 'operatingSystem' in node.data && node.data.operatingSystem && (
              <div className="flex justify-between">
                <span className="text-white/70">OS:</span>
                <span className="text-white font-medium">{node.data.operatingSystem}</span>
              </div>
            )}
            {node.type === 'device' && 'isManaged' in node.data && (
              <div className="flex justify-between">
                <span className="text-white/70">Managed:</span>
                <span className={`font-medium ${node.data.isManaged ? 'text-green-300' : 'text-red-300'}`}>
                  {node.data.isManaged ? 'Yes' : 'No'}
                </span>
              </div>
            )}
            {node.type === 'device' && 'isCompliant' in node.data && (
              <div className="flex justify-between">
                <span className="text-white/70">Compliant:</span>
                <span className={`font-medium ${node.data.isCompliant ? 'text-green-300' : 'text-red-300'}`}>
                  {node.data.isCompliant ? 'Yes' : 'No'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Additional User Information */}
        {node.type === 'user' && (
          <div className="bg-white/10 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              👤 User Details
            </h3>
            <div className="space-y-2">
              {userData?.accountEnabled !== undefined && (
                <div className="flex justify-between">
                  <span className="text-white/70">Status:</span>
                  <span className={`font-medium ${userData.accountEnabled ? 'text-green-300' : 'text-red-300'}`}>
                    {userData.accountEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              )}
              {userData?.userType && (
                <div className="flex justify-between">
                  <span className="text-white/70">User Type:</span>
                  <span className="text-white font-medium">{userData.userType}</span>
                </div>
              )}
              {userData?.createdDateTime && (
                <div className="flex justify-between">
                  <span className="text-white/70">Created:</span>
                  <span className="text-white font-medium">
                    {new Date(userData.createdDateTime).toLocaleDateString()}
                  </span>
                </div>
              )}
              {userData?.signInActivity?.lastSignInDateTime && (
                <div className="flex justify-between">
                  <span className="text-white/70">Last Sign-in:</span>
                  <span className="text-white font-medium">
                    {new Date(userData.signInActivity.lastSignInDateTime).toLocaleDateString()}
                  </span>
                </div>
              )}
              {userData?.assignedLicenses && userData.assignedLicenses.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-white/70">Licenses:</span>
                  <span className="text-white font-medium">
                    {userData.assignedLicenses.length} assigned
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Additional Device Information */}
        {node.type === 'device' && (
          <div className="bg-white/10 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              💻 Device Details
            </h3>
            <div className="space-y-2">
              {userData?.joinType && (
                <div className="flex justify-between">
                  <span className="text-white/70">Join Type:</span>
                  <span className="text-white font-medium">{userData.joinType}</span>
                </div>
              )}
              {userData?.owner && (
                <div className="flex justify-between">
                  <span className="text-white/70">Owner:</span>
                  <span className="text-white font-medium">{userData.owner}</span>
                </div>
              )}
              {userData?.mdmEnrollmentStatus && (
                <div className="flex justify-between">
                  <span className="text-white/70">MDM:</span>
                  <span className={`font-medium ${userData.mdmEnrollmentStatus.includes('Enrolled') ? 'text-green-300' : 'text-yellow-300'}`}>
                    {userData.mdmEnrollmentStatus}
                  </span>
                </div>
              )}
              {userData?.managementType && (
                <div className="flex justify-between">
                  <span className="text-white/70">Management:</span>
                  <span className="text-white font-medium">{userData.managementType}</span>
                </div>
              )}
              {userData?.approximateLastSignInDateTime && (
                <div className="flex justify-between">
                  <span className="text-white/70">Last Activity:</span>
                  <span className="text-white font-medium">
                    {new Date(userData.approximateLastSignInDateTime).toLocaleDateString()}
                  </span>
                </div>
              )}
              {userData?.registrationDateTime && (
                <div className="flex justify-between">
                  <span className="text-white/70">Registered:</span>
                  <span className="text-white font-medium">
                    {new Date(userData.registrationDateTime).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-blue-500/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-white">
              {enhancedData?.entraRoles?.length || 0}
            </div>
            <div className="text-sm text-white/70">Entra Roles</div>
          </div>
          <div className="bg-green-500/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-white">
              {enhancedData?.azureRoles?.length || 0}
            </div>
            <div className="text-sm text-white/70">Azure Roles</div>
          </div>
          <div className="bg-purple-500/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-white">
              {enhancedData?.assignedIntuneProfiles?.length || 0}
            </div>
            <div className="text-sm text-white/70">Config Profiles</div>
          </div>
        </div>
      </div>
    )
  }

  const renderEntraRolesTab = () => {
    const roles = enhancedData?.entraRoles || []
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">🏢 Entra ID Role Assignments</h3>
          {loading.entraRoles && <div className="animate-spin text-white">⟳</div>}
        </div>
        
        {roles.length === 0 ? (
          <div className="bg-white/10 rounded-lg p-6 text-center">
            <div className="text-white/70">No Entra ID role assignments found</div>
          </div>
        ) : (
          <div className="space-y-3">
            {roles.map((role) => (
              <div key={role.id} className="bg-white/10 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-white">{role.roleDefinitionName}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    role.assignmentType === 'Active' 
                      ? 'bg-green-500/20 text-green-300' 
                      : 'bg-yellow-500/20 text-yellow-300'
                  }`}>
                    {role.assignmentType}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-white/70">
                  <div>Scope: {role.resourceScope}</div>
                  {role.startDateTime && (
                    <div>Start: {new Date(role.startDateTime).toLocaleDateString()}</div>
                  )}
                  {role.endDateTime && (
                    <div>End: {new Date(role.endDateTime).toLocaleDateString()}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderAzureRolesTab = () => {
    const roles = enhancedData?.azureRoles || []
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">☁️ Azure Resource Role Assignments</h3>
          {loading.azureRoles && <div className="animate-spin text-white">⟳</div>}
        </div>
        
        {roles.length === 0 ? (
          <div className="bg-white/10 rounded-lg p-6 text-center">
            <div className="text-white/70">No Azure resource role assignments found</div>
          </div>
        ) : (
          <div className="space-y-3">
            {roles.map((role) => (
              <div key={role.id} className="bg-white/10 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-white">{role.roleDefinitionName}</h4>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs font-medium">
                    {role.principalType}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-white/70">
                  <div>Scope: {role.scope}</div>
                  {role.description && <div>Description: {role.description}</div>}
                  <div>Created: {new Date(role.createdOn).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderIntuneProfilesTab = () => {
    const profiles = enhancedData?.assignedIntuneProfiles || []
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">📱 Intune Configuration Profiles</h3>
          {loading.intuneProfiles && <div className="animate-spin text-white">⟳</div>}
        </div>
        
        {profiles.length === 0 ? (
          <div className="bg-white/10 rounded-lg p-6 text-center">
            <div className="text-white/70">No Intune configuration profiles assigned</div>
          </div>
        ) : (
          <div className="space-y-3">
            {profiles.map((profile) => (
              <div key={profile.id} className="bg-white/10 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-white">{profile.displayName}</h4>
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs font-medium">
                    {profile.platformType}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-white/70">
                  {profile.description && <div>Description: {profile.description}</div>}
                  <div>Type: {profile.profileType}</div>
                  <div>Version: {profile.version}</div>
                  <div>Created: {new Date(profile.createdDateTime).toLocaleDateString()}</div>
                  <div>Modified: {new Date(profile.lastModifiedDateTime).toLocaleDateString()}</div>
                </div>
                {profile.assignmentSummary && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-green-500/20 text-green-300 p-2 rounded">
                      ✅ Applicable: {profile.assignmentSummary.applicableDeviceCount}
                    </div>
                    <div className="bg-red-500/20 text-red-300 p-2 rounded">
                      ❌ Error: {profile.assignmentSummary.errorDeviceCount}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderComplianceTab = () => {
    const policies = enhancedData?.assignedCompliancePolicies || []
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">🛡️ Compliance Policies</h3>
          {loading.compliancePolicies && <div className="animate-spin text-white">⟳</div>}
        </div>
        
        {policies.length === 0 ? (
          <div className="bg-white/10 rounded-lg p-6 text-center">
            <div className="text-white/70">No compliance policies assigned</div>
          </div>
        ) : (
          <div className="space-y-3">
            {policies.map((policy) => (
              <div key={policy.id} className="bg-white/10 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-white">{policy.displayName}</h4>
                  <span className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded text-xs font-medium">
                    {policy.platformType}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-white/70">
                  {policy.description && <div>Description: {policy.description}</div>}
                  <div>Version: {policy.version}</div>
                  <div>Created: {new Date(policy.createdDateTime).toLocaleDateString()}</div>
                  <div>Modified: {new Date(policy.lastModifiedDateTime).toLocaleDateString()}</div>
                </div>
                {policy.deviceStatuses && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-green-500/20 text-green-300 p-2 rounded">
                      ✅ Compliant: {policy.deviceStatuses.compliantDeviceCount}
                    </div>
                    <div className="bg-red-500/20 text-red-300 p-2 rounded">
                      ❌ Non-Compliant: {policy.deviceStatuses.nonCompliantDeviceCount}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderAppProtectionTab = () => {
    if (node.type === 'device') {
      return (
        <div className="bg-white/10 rounded-lg p-6 text-center">
          <div className="text-white/70">App protection policies are not applicable to devices</div>
        </div>
      )
    }

    const policies = enhancedData?.assignedAppProtectionPolicies || []
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">📱 App Protection Policies</h3>
          {loading.appProtectionPolicies && <div className="animate-spin text-white">⟳</div>}
        </div>
        
        {policies.length === 0 ? (
          <div className="bg-white/10 rounded-lg p-6 text-center">
            <div className="text-white/70">No app protection policies assigned</div>
          </div>
        ) : (
          <div className="space-y-3">
            {policies.map((policy) => (
              <div key={policy.id} className="bg-white/10 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-white">{policy.displayName}</h4>
                  <span className="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded text-xs font-medium">
                    {policy.platformType}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-white/70">
                  {policy.description && <div>Description: {policy.description}</div>}
                  <div>App Group: {policy.appGroupType}</div>
                  <div>Management Level: {policy.targetedAppManagementLevels}</div>
                  <div>Version: {policy.version}</div>
                  <div>Assigned: {policy.isAssigned ? 'Yes' : 'No'}</div>
                </div>
                {policy.deploymentSummary && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-green-500/20 text-green-300 p-2 rounded">
                      ✅ Success: {policy.deploymentSummary.successfulDeviceCount}
                    </div>
                    <div className="bg-red-500/20 text-red-300 p-2 rounded">
                      ❌ Error: {policy.deploymentSummary.errorDeviceCount}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderLicensesTab = () => {
    if (node.type !== 'user') {
      return (
        <div className="bg-white/10 rounded-lg p-6 text-center">
          <div className="text-white/70">Licenses are only applicable to users</div>
        </div>
      )
    }

    const userData = enhancedData as any
    const licenses = userData?.assignedLicenses || []
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">📄 Assigned Licenses</h3>
        </div>
        
        {licenses.length === 0 ? (
          <div className="bg-white/10 rounded-lg p-6 text-center">
            <div className="text-white/70">No licenses assigned to this user</div>
          </div>
        ) : (
          <div className="space-y-3">
            {licenses.map((license: any, index: number) => (
              <div key={license.skuId || index} className="bg-white/10 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-white">
                    {license.skuPartNumber || `License ${index + 1}`}
                  </h4>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs font-medium">
                    SKU: {license.skuId}
                  </span>
                </div>
                
                {license.servicePlans && license.servicePlans.length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-white/80 mb-2">Service Plans:</h5>
                    <div className="grid grid-cols-1 gap-2">
                      {license.servicePlans.map((plan: any, planIndex: number) => (
                        <div key={plan.servicePlanId || planIndex} className="flex justify-between items-center p-2 bg-white/5 rounded">
                          <span className="text-sm text-white">{plan.servicePlanName || plan.servicePlanId}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            plan.provisioningStatus === 'Success' 
                              ? 'bg-green-500/20 text-green-300'
                              : plan.provisioningStatus === 'Disabled'
                              ? 'bg-gray-500/20 text-gray-300'
                              : 'bg-yellow-500/20 text-yellow-300'
                          }`}>
                            {plan.provisioningStatus}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {license.disabledPlans && license.disabledPlans.length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-white/80 mb-2">Disabled Plans:</h5>
                    <div className="flex flex-wrap gap-1">
                      {license.disabledPlans.map((planId: string, planIndex: number) => (
                        <span key={planId || planIndex} className="text-xs px-2 py-1 bg-red-500/20 text-red-300 rounded">
                          {planId}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: '📋 Overview', component: renderOverviewTab },
    { id: 'entra-roles', label: '🏢 Entra Roles', component: renderEntraRolesTab },
    { id: 'azure-roles', label: '☁️ Azure Roles', component: renderAzureRolesTab },
    { id: 'intune-profiles', label: '📱 Config Profiles', component: renderIntuneProfilesTab },
    { id: 'compliance', label: '🛡️ Compliance', component: renderComplianceTab },
    ...(node.type === 'user' ? [{ id: 'licenses', label: '📄 Licenses', component: renderLicensesTab }] : []),
    ...(node.type !== 'device' ? [{ id: 'app-protection', label: '📱 App Protection', component: renderAppProtectionTab }] : [])
  ]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-blue-600/90 via-purple-600/90 to-blue-700/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/20">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                {node.type === 'user' ? '👤' : node.type === 'group' ? '👥' : '💻'}
                Enhanced Details
              </h2>
              <p className="text-white/70 mt-1">{node.name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-white/20">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-white text-white'
                  : 'border-transparent text-white/70 hover:text-white hover:border-white/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {tabs.find(tab => tab.id === activeTab)?.component()}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/20 bg-white/5">
          <div className="flex justify-between items-center text-sm text-white/70">
            <div>
              Data loaded: {new Date().toLocaleTimeString()}
            </div>
            <button
              onClick={loadEnhancedData}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded transition-colors text-white"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
