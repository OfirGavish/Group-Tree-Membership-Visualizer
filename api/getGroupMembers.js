const { app } = require('@azure/functions');

// Microsoft Graph API endpoint for getting group members
app.http('getGroupMembers', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('Get group members request received');

        try {
            // Check if user is authenticated
            const clientPrincipal = request.headers['x-ms-client-principal'];
            if (!clientPrincipal) {
                return {
                    status: 401,
                    body: JSON.stringify({ error: 'Not authenticated' })
                };
            }

            // Get group ID from query parameters
            const groupId = request.query.get('groupId');
            if (!groupId) {
                return {
                    status: 400,
                    body: JSON.stringify({ error: 'groupId parameter is required' })
                };
            }

            // Get environment variables
            const clientId = process.env.AZURE_CLIENT_ID;
            const clientSecret = process.env.AZURE_CLIENT_SECRET;
            const tenantId = process.env.AZURE_TENANT_ID || 'df5c1b3a-b49f-406f-b067-a4a6fae72629';

            if (!clientId || !clientSecret) {
                context.log('Missing Azure app credentials');
                return {
                    status: 500,
                    body: JSON.stringify({ error: 'Server configuration error' })
                };
            }

            // Get access token using client credentials flow
            const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    scope: 'https://graph.microsoft.com/.default',
                    grant_type: 'client_credentials'
                })
            });

            if (!tokenResponse.ok) {
                context.log('Failed to get access token');
                return {
                    status: 500,
                    body: JSON.stringify({ error: 'Failed to authenticate with Microsoft Graph' })
                };
            }

            const tokenData = await tokenResponse.json();
            const accessToken = tokenData.access_token;

            // Get group members from Microsoft Graph
            const membersResponse = await fetch(`https://graph.microsoft.com/v1.0/groups/${groupId}/members?$select=id,displayName,userPrincipalName,mail`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!membersResponse.ok) {
                context.log('Failed to fetch group members from Graph API');
                return {
                    status: 500,
                    body: JSON.stringify({ error: 'Failed to fetch group members from Microsoft Graph' })
                };
            }

            const membersData = await membersResponse.json();
            const members = membersData.value.map(member => ({
                '@odata.type': member['@odata.type'],
                id: member.id,
                displayName: member.displayName,
                userPrincipalName: member.userPrincipalName,
                mail: member.mail,
            }));

            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(members)
            };

        } catch (error) {
            context.log('Error in getGroupMembers:', error);
            return {
                status: 500,
                body: JSON.stringify({ 
                    error: 'Failed to fetch group members',
                    details: error.message 
                })
            };
        }
    }
});
