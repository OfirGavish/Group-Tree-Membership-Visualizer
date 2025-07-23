// Microsoft Graph API endpoint for getting group members
const fetch = require('node-fetch');

module.exports = async function (context, req) {
    context.log('Get group members request received');

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

        // Get group members from Microsoft Graph using user's delegated token
        const membersResponse = await fetch(`https://graph.microsoft.com/v1.0/groups/${groupId}/members?$select=id,displayName,userPrincipalName,mail`, {
            headers: {
                'Authorization': `Bearer ${userToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!membersResponse.ok) {
            const errorText = await membersResponse.text();
            context.log('Failed to fetch group members from Graph API:', membersResponse.status, errorText);
            context.res = {
                status: membersResponse.status,
                body: { 
                    error: 'Failed to fetch group members from Microsoft Graph',
                    details: `HTTP ${membersResponse.status}: ${errorText}`
                }
            };
            return;
        }

        const membersData = await membersResponse.json();
        const members = membersData.value.map(member => ({
            '@odata.type': member['@odata.type'],
            id: member.id,
            displayName: member.displayName,
            userPrincipalName: member.userPrincipalName,
            mail: member.mail,
        }));

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: members
        };

    } catch (error) {
        context.log('Error in getGroupMembers:', error);
        context.res = {
            status: 500,
            body: { 
                error: 'Failed to fetch group members',
                details: error.message 
            }
        };
    }
};
