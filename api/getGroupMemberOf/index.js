// Microsoft Graph API endpoint for getting group memberOf (groups that this group belongs to)
const fetch = require('node-fetch');

module.exports = async function (context, req) {
    context.log('Get group memberOf request received');

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

        // Get group ID from query parameters
        const groupId = req.query.groupId;
        if (!groupId) {
            context.res = {
                status: 400,
                body: { error: 'groupId parameter is required' }
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

        // Get group memberOf from Microsoft Graph using user's delegated token
        const memberOfResponse = await fetch(`https://graph.microsoft.com/v1.0/groups/${groupId}/memberOf?$select=id,displayName,description,groupTypes`, {
            headers: {
                'Authorization': `Bearer ${userToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!memberOfResponse.ok) {
            const errorText = await memberOfResponse.text();
            context.log('Failed to fetch group memberOf from Graph API:', memberOfResponse.status, errorText);
            context.res = {
                status: memberOfResponse.status,
                body: { 
                    error: 'Failed to fetch group memberOf from Microsoft Graph',
                    details: `HTTP ${memberOfResponse.status}: ${errorText}`
                }
            };
            return;
        }

        const memberOfData = await memberOfResponse.json();
        const groups = memberOfData.value
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
        context.log('Error in getGroupMemberOf:', error);
        context.res = {
            status: 500,
            body: { 
                error: 'Failed to fetch group memberOf',
                details: error.message 
            }
        };
    }
};
