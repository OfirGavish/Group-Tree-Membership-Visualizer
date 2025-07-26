const { GraphHelper } = require('../shared/graphHelper');
const { AuthHelper } = require('../shared/auth-helper');

module.exports = async function (context, req) {
    context.log('HTTP trigger function processed getAzureRoleAssignments request.');

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

        // Get access token with Azure Resource Manager scope
        const accessToken = await AuthHelper.getAccessToken(req, 'https://management.azure.com/.default');
        if (!accessToken) {
            context.res = {
                status: 401,
                body: { error: 'Unauthorized - Azure Resource Manager access required' }
            };
            return;
        }

        // Get Azure role assignments
        const roleAssignments = await getAzureRoleAssignments(accessToken, objectId, objectType);

        context.res = {
            status: 200,
            body: {
                objectId,
                objectType,
                roleAssignments,
                timestamp: new Date().toISOString()
            }
        };

    } catch (error) {
        context.log.error('Error in getAzureRoleAssignments:', error);
        context.res = {
            status: 500,
            body: { 
                error: 'Internal server error',
                details: error.message
            }
        };
    }
};

async function getAzureRoleAssignments(accessToken, objectId, objectType) {
    try {
        const roleAssignments = [];
        
        // Get list of subscriptions the user has access to
        const subscriptions = await getAccessibleSubscriptions(accessToken);
        
        // For each subscription, get role assignments for the principal
        for (const subscription of subscriptions) {
            const subscriptionRoles = await getSubscriptionRoleAssignments(
                accessToken, 
                subscription.subscriptionId, 
                objectId
            );
            roleAssignments.push(...subscriptionRoles);
        }

        return roleAssignments;
    } catch (error) {
        console.error('Error getting Azure role assignments:', error);
        return [];
    }
}

async function getAccessibleSubscriptions(accessToken) {
    try {
        const response = await fetch('https://management.azure.com/subscriptions?api-version=2020-01-01', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to get subscriptions: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.value || [];
    } catch (error) {
        console.error('Error getting accessible subscriptions:', error);
        return [];
    }
}

async function getSubscriptionRoleAssignments(accessToken, subscriptionId, principalId) {
    try {
        const roleAssignments = [];
        
        // Get role assignments at subscription level
        const subscriptionScope = `/subscriptions/${subscriptionId}`;
        const subscriptionRoles = await getRoleAssignmentsForScope(accessToken, subscriptionScope, principalId);
        roleAssignments.push(...subscriptionRoles);
        
        // Get resource groups in this subscription
        const resourceGroups = await getResourceGroups(accessToken, subscriptionId);
        
        // Get role assignments at resource group level
        for (const rg of resourceGroups) {
            const rgScope = `/subscriptions/${subscriptionId}/resourceGroups/${rg.name}`;
            const rgRoles = await getRoleAssignmentsForScope(accessToken, rgScope, principalId);
            roleAssignments.push(...rgRoles);
        }
        
        // Note: We're limiting to subscription and resource group scopes for performance
        // In a production scenario, you might want to also check individual resources
        
        return roleAssignments;
    } catch (error) {
        console.error(`Error getting role assignments for subscription ${subscriptionId}:`, error);
        return [];
    }
}

async function getRoleAssignmentsForScope(accessToken, scope, principalId) {
    try {
        const encodedScope = encodeURIComponent(scope);
        const url = `https://management.azure.com${scope}/providers/Microsoft.Authorization/roleAssignments?api-version=2022-04-01&$filter=principalId eq '${principalId}'`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            // If we get 403, the user might not have access to this scope
            if (response.status === 403) {
                return [];
            }
            throw new Error(`Failed to get role assignments for ${scope}: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const assignments = [];
        
        for (const assignment of data.value || []) {
            // Get role definition details
            const roleDefinition = await getRoleDefinition(accessToken, assignment.properties.roleDefinitionId);
            
            assignments.push({
                id: assignment.id,
                roleDefinitionId: assignment.properties.roleDefinitionId,
                roleDefinitionName: roleDefinition?.properties?.roleName || 'Unknown Role',
                scope: assignment.properties.scope,
                principalId: assignment.properties.principalId,
                principalType: assignment.properties.principalType,
                createdOn: assignment.properties.createdOn,
                updatedOn: assignment.properties.updatedOn,
                createdBy: assignment.properties.createdBy,
                updatedBy: assignment.properties.updatedBy,
                description: roleDefinition?.properties?.description,
                permissions: roleDefinition?.properties?.permissions || []
            });
        }
        
        return assignments;
    } catch (error) {
        console.error(`Error getting role assignments for scope ${scope}:`, error);
        return [];
    }
}

async function getRoleDefinition(accessToken, roleDefinitionId) {
    try {
        const response = await fetch(`https://management.azure.com${roleDefinitionId}?api-version=2022-04-01`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Error getting role definition:', error);
        return null;
    }
}

async function getResourceGroups(accessToken, subscriptionId) {
    try {
        const response = await fetch(`https://management.azure.com/subscriptions/${subscriptionId}/resourcegroups?api-version=2021-04-01`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            return [];
        }

        const data = await response.json();
        return data.value || [];
    } catch (error) {
        console.error(`Error getting resource groups for subscription ${subscriptionId}:`, error);
        return [];
    }
}
