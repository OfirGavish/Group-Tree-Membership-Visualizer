// Microsoft Graph API endpoint for getting user groups
const fetch = require('node-fetch');

module.exports = async function (context, req) {
    context.log('Get user groups request received');

    try {
        // Check if user is authenticated
        const clientPrincipal = req.headers['x-ms-client-principal'];
        if (!clientPrincipal) {
            context.res = {
                status: 401,
                body: { error: 'Not authenticated' }
            };
            return;
        }

        // Get user's delegated token from Easy Auth
        const userToken = req.headers['x-ms-token-aad-access-token'];
        if (!userToken) {
            context.log('No user access token found in headers');
            context.res = {
                status: 401,
                body: { error: 'User access token not available' }
            };
            return;
        }

        // Get user ID from query parameters
        const userId = req.query.userId;
        if (!userId) {
            context.res = {
                status: 400,
                body: { error: 'userId parameter is required' }
            };
            return;
        }

        // Get user groups from Microsoft Graph using user's delegated token
        const groupsResponse = await fetch(`https://graph.microsoft.com/v1.0/users/${userId}/memberOf?$select=id,displayName,description,groupTypes`, {
            headers: {
                'Authorization': `Bearer ${userToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!groupsResponse.ok) {
            const errorText = await groupsResponse.text();
            context.log('Failed to fetch user groups from Graph API:', groupsResponse.status, errorText);
            context.res = {
                status: groupsResponse.status,
                body: { 
                    error: 'Failed to fetch user groups from Microsoft Graph',
                    details: `HTTP ${groupsResponse.status}: ${errorText}`
                }
            };
            return;
        }

        const groupsData = await groupsResponse.json();
        const groups = groupsData.value
            .filter(item => item['@odata.type'] === '#microsoft.graph.group')
            .map(group => ({
                id: group.id,
                displayName: group.displayName,
                description: group.description,
                groupTypes: group.groupTypes || [],
            }));

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: groups
        };

    } catch (error) {
        context.log('Error in getUserGroups:', error);
        context.res = {
            status: 500,
            body: { 
                error: 'Failed to fetch user groups',
                details: error.message 
            }
        };
    }
};
