const { GraphHelper } = require('../shared/graphHelper');
const { AuthHelper } = require('../shared/auth-helper');

module.exports = async function (context, req) {
    context.log('HTTP trigger function processed getEntraRoleAssignments request.');

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
        
        // Get role assignments based on object type
        let roleAssignments = [];
        
        if (objectType === 'user') {
            // Get user's Entra ID role assignments
            roleAssignments = await getUserEntraRoles(graphHelper, objectId);
        } else if (objectType === 'group') {
            // Get group's role assignments (if the group is used for role assignment)
            roleAssignments = await getGroupEntraRoles(graphHelper, objectId);
        }
        // Note: Devices typically don't have Entra ID role assignments

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
        context.log.error('Error in getEntraRoleAssignments:', error);
        context.res = {
            status: 500,
            body: { 
                error: 'Internal server error',
                details: error.message
            }
        };
    }
};

async function getUserEntraRoles(graphHelper, userId) {
    try {
        // Get user's directory role memberships
        const roleAssignments = [];
        
        // Get user's directory roles (built-in roles)
        const directoryRoles = await graphHelper.makeGraphRequest(`/users/${userId}/memberOf?$filter=@odata.type eq 'microsoft.graph.directoryRole'`);
        
        for (const role of directoryRoles.value || []) {
            roleAssignments.push({
                id: role.id,
                roleDefinitionId: role.roleTemplateId,
                roleDefinitionName: role.displayName,
                assignmentType: 'Active',
                resourceScope: '/',
                principalId: userId,
                principalType: 'User',
                startDateTime: null,
                endDateTime: null,
                description: role.description
            });
        }

        // Get user's PIM eligible role assignments
        try {
            const eligibleAssignments = await graphHelper.makeGraphRequest(`/roleManagement/directory/roleEligibilitySchedules?$filter=principalId eq '${userId}'&$expand=roleDefinition`);
            
            for (const assignment of eligibleAssignments.value || []) {
                roleAssignments.push({
                    id: assignment.id,
                    roleDefinitionId: assignment.roleDefinitionId,
                    roleDefinitionName: assignment.roleDefinition?.displayName || 'Unknown Role',
                    assignmentType: 'Eligible',
                    resourceScope: assignment.directoryScopeId || '/',
                    principalId: userId,
                    principalType: 'User',
                    startDateTime: assignment.startDateTime,
                    endDateTime: assignment.endDateTime,
                    description: assignment.roleDefinition?.description
                });
            }
        } catch (pimError) {
            // PIM API might not be available or user might not have access
            console.log('PIM eligible assignments not available:', pimError.message);
        }

        // Get user's active PIM role assignments
        try {
            const activeAssignments = await graphHelper.makeGraphRequest(`/roleManagement/directory/roleAssignmentSchedules?$filter=principalId eq '${userId}'&$expand=roleDefinition`);
            
            for (const assignment of activeAssignments.value || []) {
                // Check if this assignment is already included from directory roles
                const existingAssignment = roleAssignments.find(ra => 
                    ra.roleDefinitionId === assignment.roleDefinitionId && 
                    ra.assignmentType === 'Active'
                );
                
                if (!existingAssignment) {
                    roleAssignments.push({
                        id: assignment.id,
                        roleDefinitionId: assignment.roleDefinitionId,
                        roleDefinitionName: assignment.roleDefinition?.displayName || 'Unknown Role',
                        assignmentType: 'Active',
                        resourceScope: assignment.directoryScopeId || '/',
                        principalId: userId,
                        principalType: 'User',
                        startDateTime: assignment.startDateTime,
                        endDateTime: assignment.endDateTime,
                        description: assignment.roleDefinition?.description
                    });
                }
            }
        } catch (pimError) {
            // PIM API might not be available or user might not have access
            console.log('PIM active assignments not available:', pimError.message);
        }

        return roleAssignments;
    } catch (error) {
        console.error('Error getting user Entra roles:', error);
        return [];
    }
}

async function getGroupEntraRoles(graphHelper, groupId) {
    try {
        const roleAssignments = [];
        
        // Get role assignments where this group is assigned to a role
        try {
            const groupRoleAssignments = await graphHelper.makeGraphRequest(`/roleManagement/directory/roleAssignments?$filter=principalId eq '${groupId}'&$expand=roleDefinition`);
            
            for (const assignment of groupRoleAssignments.value || []) {
                roleAssignments.push({
                    id: assignment.id,
                    roleDefinitionId: assignment.roleDefinitionId,
                    roleDefinitionName: assignment.roleDefinition?.displayName || 'Unknown Role',
                    assignmentType: 'Active',
                    resourceScope: assignment.resourceScope || '/',
                    principalId: groupId,
                    principalType: 'Group',
                    startDateTime: null,
                    endDateTime: null,
                    description: assignment.roleDefinition?.description
                });
            }
        } catch (roleError) {
            console.log('Group role assignments not available:', roleError.message);
        }

        return roleAssignments;
    } catch (error) {
        console.error('Error getting group Entra roles:', error);
        return [];
    }
}
