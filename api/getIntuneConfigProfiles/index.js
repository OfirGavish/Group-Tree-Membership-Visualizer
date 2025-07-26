const { GraphHelper } = require('../shared/graphHelper');
const { AuthHelper } = require('../shared/auth-helper');

module.exports = async function (context, req) {
    context.log('HTTP trigger function processed getIntuneConfigProfiles request.');

    try {
        // Check for required parameters
        const { objectId, objectType } = req.query;
        
        if (!objectId) {
            context.res = {
                status: 400,
                body: { error: 'objectId parameter is required' }
            };
            return;
        }

        if (!objectType || !['user', 'group', 'device'].includes(objectType)) {
            context.res = {
                status: 400,
                body: { error: 'objectType parameter is required and must be user, group, or device' }
            };
            return;
        }

        // Get access token
        const accessToken = await AuthHelper.getAccessToken(req);
        if (!accessToken) {
            context.res = {
                status: 401,
                body: { error: 'Unauthorized' }
            };
            return;
        }

        const graphHelper = new GraphHelper(accessToken);
        
        // Get Intune profiles based on object type
        let profiles = {
            configurationProfiles: [],
            compliancePolicies: [],
            appProtectionPolicies: []
        };
        
        if (objectType === 'user') {
            profiles = await getUserIntuneProfiles(graphHelper, objectId);
        } else if (objectType === 'group') {
            profiles = await getGroupIntuneProfiles(graphHelper, objectId);
        } else if (objectType === 'device') {
            profiles = await getDeviceIntuneProfiles(graphHelper, objectId);
        }

        context.res = {
            status: 200,
            body: {
                objectId,
                objectType,
                ...profiles,
                timestamp: new Date().toISOString()
            }
        };

    } catch (error) {
        context.log.error('Error in getIntuneConfigProfiles:', error);
        context.res = {
            status: 500,
            body: { 
                error: 'Internal server error',
                details: error.message
            }
        };
    }
};

async function getUserIntuneProfiles(graphHelper, userId) {
    try {
        const profiles = {
            configurationProfiles: [],
            compliancePolicies: [],
            appProtectionPolicies: []
        };

        // Get user's managed devices first
        const userDevices = await graphHelper.makeGraphRequest(`/users/${userId}/managedDevices`);
        
        // Get configuration profiles assigned to user or their groups
        try {
            // Get all device configuration profiles
            const allConfigProfiles = await graphHelper.makeGraphRequest('/deviceManagement/deviceConfigurations');
            
            for (const profile of allConfigProfiles.value || []) {
                // Check if this profile is assigned to the user (directly or via group membership)
                const isAssigned = await isProfileAssignedToUser(graphHelper, profile.id, userId);
                if (isAssigned) {
                    const enhancedProfile = await getEnhancedProfileInfo(graphHelper, profile);
                    profiles.configurationProfiles.push(enhancedProfile);
                }
            }
        } catch (error) {
            console.log('Error getting configuration profiles:', error.message);
        }

        // Get compliance policies
        try {
            const compliancePolicies = await graphHelper.makeGraphRequest('/deviceManagement/deviceCompliancePolicies');
            
            for (const policy of compliancePolicies.value || []) {
                const isAssigned = await isPolicyAssignedToUser(graphHelper, policy.id, userId, 'compliance');
                if (isAssigned) {
                    const enhancedPolicy = await getEnhancedCompliancePolicyInfo(graphHelper, policy);
                    profiles.compliancePolicies.push(enhancedPolicy);
                }
            }
        } catch (error) {
            console.log('Error getting compliance policies:', error.message);
        }

        // Get app protection policies
        try {
            // Get iOS app protection policies
            const iosAppPolicies = await graphHelper.makeGraphRequest('/deviceAppManagement/iosManagedAppProtections');
            for (const policy of iosAppPolicies.value || []) {
                const isAssigned = await isAppProtectionPolicyAssignedToUser(graphHelper, policy.id, userId, 'ios');
                if (isAssigned) {
                    const enhancedPolicy = await getEnhancedAppProtectionPolicyInfo(graphHelper, policy, 'iOS');
                    profiles.appProtectionPolicies.push(enhancedPolicy);
                }
            }

            // Get Android app protection policies
            const androidAppPolicies = await graphHelper.makeGraphRequest('/deviceAppManagement/androidManagedAppProtections');
            for (const policy of androidAppPolicies.value || []) {
                const isAssigned = await isAppProtectionPolicyAssignedToUser(graphHelper, policy.id, userId, 'android');
                if (isAssigned) {
                    const enhancedPolicy = await getEnhancedAppProtectionPolicyInfo(graphHelper, policy, 'Android');
                    profiles.appProtectionPolicies.push(enhancedPolicy);
                }
            }
        } catch (error) {
            console.log('Error getting app protection policies:', error.message);
        }

        return profiles;
    } catch (error) {
        console.error('Error getting user Intune profiles:', error);
        return {
            configurationProfiles: [],
            compliancePolicies: [],
            appProtectionPolicies: []
        };
    }
}

async function getGroupIntuneProfiles(graphHelper, groupId) {
    try {
        const profiles = {
            configurationProfiles: [],
            compliancePolicies: [],
            appProtectionPolicies: []
        };

        // Get configuration profiles assigned to this group
        try {
            const allConfigProfiles = await graphHelper.makeGraphRequest('/deviceManagement/deviceConfigurations');
            
            for (const profile of allConfigProfiles.value || []) {
                const isAssigned = await isProfileAssignedToGroup(graphHelper, profile.id, groupId);
                if (isAssigned) {
                    const enhancedProfile = await getEnhancedProfileInfo(graphHelper, profile);
                    profiles.configurationProfiles.push(enhancedProfile);
                }
            }
        } catch (error) {
            console.log('Error getting group configuration profiles:', error.message);
        }

        return profiles;
    } catch (error) {
        console.error('Error getting group Intune profiles:', error);
        return {
            configurationProfiles: [],
            compliancePolicies: [],
            appProtectionPolicies: []
        };
    }
}

async function getDeviceIntuneProfiles(graphHelper, deviceId) {
    try {
        const profiles = {
            configurationProfiles: [],
            compliancePolicies: [],
            appProtectionPolicies: []
        };

        // Get device configuration profiles applied to this device
        try {
            const deviceConfigs = await graphHelper.makeGraphRequest(`/deviceManagement/managedDevices/${deviceId}/deviceConfigurationStates`);
            
            for (const config of deviceConfigs.value || []) {
                try {
                    const profile = await graphHelper.makeGraphRequest(`/deviceManagement/deviceConfigurations/${config.settingStates[0]?.sources[0]?.id}`);
                    const enhancedProfile = await getEnhancedProfileInfo(graphHelper, profile);
                    enhancedProfile.deviceStatus = {
                        state: config.state,
                        settingCount: config.settingCount,
                        complianceGracePeriodExpirationDateTime: config.complianceGracePeriodExpirationDateTime
                    };
                    profiles.configurationProfiles.push(enhancedProfile);
                } catch (profileError) {
                    console.log('Error getting individual profile:', profileError.message);
                }
            }
        } catch (error) {
            console.log('Error getting device configuration profiles:', error.message);
        }

        // Get device compliance policies
        try {
            const deviceCompliance = await graphHelper.makeGraphRequest(`/deviceManagement/managedDevices/${deviceId}/deviceCompliancePolicyStates`);
            
            for (const compliance of deviceCompliance.value || []) {
                try {
                    const policy = await graphHelper.makeGraphRequest(`/deviceManagement/deviceCompliancePolicies/${compliance.settingStates[0]?.sources[0]?.id}`);
                    const enhancedPolicy = await getEnhancedCompliancePolicyInfo(graphHelper, policy);
                    enhancedPolicy.deviceStatus = {
                        state: compliance.state,
                        settingCount: compliance.settingCount,
                        complianceGracePeriodExpirationDateTime: compliance.complianceGracePeriodExpirationDateTime
                    };
                    profiles.compliancePolicies.push(enhancedPolicy);
                } catch (policyError) {
                    console.log('Error getting individual compliance policy:', policyError.message);
                }
            }
        } catch (error) {
            console.log('Error getting device compliance policies:', error.message);
        }

        return profiles;
    } catch (error) {
        console.error('Error getting device Intune profiles:', error);
        return {
            configurationProfiles: [],
            compliancePolicies: [],
            appProtectionPolicies: []
        };
    }
}

// Helper functions
async function isProfileAssignedToUser(graphHelper, profileId, userId) {
    try {
        // Get profile assignments
        const assignments = await graphHelper.makeGraphRequest(`/deviceManagement/deviceConfigurations/${profileId}/assignments`);
        
        // Check if user is directly assigned or member of assigned group
        for (const assignment of assignments.value || []) {
            if (assignment.target && assignment.target['@odata.type'] === 'microsoft.graph.allLicensedUsersAssignmentTarget') {
                return true;
            }
            
            if (assignment.target && assignment.target['@odata.type'] === 'microsoft.graph.groupAssignmentTarget') {
                const isMember = await isUserMemberOfGroup(graphHelper, userId, assignment.target.groupId);
                if (isMember) return true;
            }
        }
        
        return false;
    } catch (error) {
        console.log('Error checking profile assignment:', error.message);
        return false;
    }
}

async function isProfileAssignedToGroup(graphHelper, profileId, groupId) {
    try {
        const assignments = await graphHelper.makeGraphRequest(`/deviceManagement/deviceConfigurations/${profileId}/assignments`);
        
        for (const assignment of assignments.value || []) {
            if (assignment.target && 
                assignment.target['@odata.type'] === 'microsoft.graph.groupAssignmentTarget' &&
                assignment.target.groupId === groupId) {
                return true;
            }
        }
        
        return false;
    } catch (error) {
        console.log('Error checking group profile assignment:', error.message);
        return false;
    }
}

async function isPolicyAssignedToUser(graphHelper, policyId, userId, policyType) {
    try {
        const endpoint = policyType === 'compliance' 
            ? `/deviceManagement/deviceCompliancePolicies/${policyId}/assignments`
            : `/deviceManagement/deviceConfigurations/${policyId}/assignments`;
            
        const assignments = await graphHelper.makeGraphRequest(endpoint);
        
        for (const assignment of assignments.value || []) {
            if (assignment.target && assignment.target['@odata.type'] === 'microsoft.graph.allLicensedUsersAssignmentTarget') {
                return true;
            }
            
            if (assignment.target && assignment.target['@odata.type'] === 'microsoft.graph.groupAssignmentTarget') {
                const isMember = await isUserMemberOfGroup(graphHelper, userId, assignment.target.groupId);
                if (isMember) return true;
            }
        }
        
        return false;
    } catch (error) {
        console.log('Error checking policy assignment:', error.message);
        return false;
    }
}

async function isAppProtectionPolicyAssignedToUser(graphHelper, policyId, userId, platform) {
    try {
        const endpoint = platform === 'ios' 
            ? `/deviceAppManagement/iosManagedAppProtections/${policyId}/assignments`
            : `/deviceAppManagement/androidManagedAppProtections/${policyId}/assignments`;
            
        const assignments = await graphHelper.makeGraphRequest(endpoint);
        
        for (const assignment of assignments.value || []) {
            if (assignment.target && assignment.target['@odata.type'] === 'microsoft.graph.allLicensedUsersAssignmentTarget') {
                return true;
            }
            
            if (assignment.target && assignment.target['@odata.type'] === 'microsoft.graph.groupAssignmentTarget') {
                const isMember = await isUserMemberOfGroup(graphHelper, userId, assignment.target.groupId);
                if (isMember) return true;
            }
        }
        
        return false;
    } catch (error) {
        console.log('Error checking app protection policy assignment:', error.message);
        return false;
    }
}

async function isUserMemberOfGroup(graphHelper, userId, groupId) {
    try {
        const response = await graphHelper.makeGraphRequest(`/groups/${groupId}/members/${userId}`);
        return !!response;
    } catch (error) {
        return false;
    }
}

async function getEnhancedProfileInfo(graphHelper, profile) {
    try {
        // Get assignment summary
        const assignmentSummary = await getProfileAssignmentSummary(graphHelper, profile.id);
        
        return {
            id: profile.id,
            displayName: profile.displayName,
            description: profile.description,
            platformType: profile['@odata.type']?.split('.').pop()?.replace('Configuration', '') || 'Unknown',
            profileType: profile['@odata.type'],
            version: profile.version || 1,
            createdDateTime: profile.createdDateTime,
            lastModifiedDateTime: profile.lastModifiedDateTime,
            assignmentSummary
        };
    } catch (error) {
        console.log('Error getting enhanced profile info:', error.message);
        return profile;
    }
}

async function getEnhancedCompliancePolicyInfo(graphHelper, policy) {
    try {
        const deviceStatuses = await getPolicyDeviceStatuses(graphHelper, policy.id, 'compliance');
        
        return {
            id: policy.id,
            displayName: policy.displayName,
            description: policy.description,
            platformType: policy['@odata.type']?.split('.').pop()?.replace('CompliancePolicy', '') || 'Unknown',
            version: policy.version || 1,
            createdDateTime: policy.createdDateTime,
            lastModifiedDateTime: policy.lastModifiedDateTime,
            deviceStatuses
        };
    } catch (error) {
        console.log('Error getting enhanced compliance policy info:', error.message);
        return policy;
    }
}

async function getEnhancedAppProtectionPolicyInfo(graphHelper, policy, platformType) {
    try {
        const deploymentSummary = await getAppProtectionPolicyDeploymentSummary(graphHelper, policy.id, platformType);
        
        return {
            id: policy.id,
            displayName: policy.displayName,
            description: policy.description,
            platformType,
            appGroupType: policy.appGroupType || 'AllApps',
            targetedAppManagementLevels: policy.targetedAppManagementLevels || 'Unspecified',
            version: policy.version || 1,
            isAssigned: policy.isAssigned || false,
            deploymentSummary
        };
    } catch (error) {
        console.log('Error getting enhanced app protection policy info:', error.message);
        return policy;
    }
}

async function getProfileAssignmentSummary(graphHelper, profileId) {
    try {
        const summary = await graphHelper.makeGraphRequest(`/deviceManagement/deviceConfigurations/${profileId}/deviceStatusOverview`);
        return {
            applicableDeviceCount: summary.pendingCount + summary.successCount + summary.errorCount + summary.failedCount + summary.conflictCount,
            successDeviceCount: summary.successCount,
            errorDeviceCount: summary.errorCount,
            failedDeviceCount: summary.failedCount,
            conflictDeviceCount: summary.conflictCount,
            pendingDeviceCount: summary.pendingCount
        };
    } catch (error) {
        return null;
    }
}

async function getPolicyDeviceStatuses(graphHelper, policyId, policyType) {
    try {
        const endpoint = `/deviceManagement/deviceCompliancePolicies/${policyId}/deviceStatusOverview`;
        const summary = await graphHelper.makeGraphRequest(endpoint);
        
        return {
            compliantDeviceCount: summary.successCount,
            nonCompliantDeviceCount: summary.errorCount + summary.failedCount,
            conflictDeviceCount: summary.conflictCount,
            pendingDeviceCount: summary.pendingCount
        };
    } catch (error) {
        return null;
    }
}

async function getAppProtectionPolicyDeploymentSummary(graphHelper, policyId, platformType) {
    try {
        // App protection policies have different summary endpoints
        return {
            successfulDeviceCount: 0,
            errorDeviceCount: 0,
            pendingDeviceCount: 0
        };
    } catch (error) {
        return null;
    }
}
