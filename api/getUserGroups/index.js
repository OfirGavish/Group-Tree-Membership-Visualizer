// Microsoft Graph API endpoint for getting user groups
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

        // Get user ID from query parameters
        const userId = req.query.userId;
        if (!userId) {
            context.res = {
                status: 400,
                body: { error: 'userId parameter is required' }
            };
            return;
        }

        // Get environment variables
        const clientId = process.env.AZURE_CLIENT_ID;
        const clientSecret = process.env.AZURE_CLIENT_SECRET;
        const tenantId = process.env.AZURE_TENANT_ID || 'df5c1b3a-b49f-406f-b067-a4a6fae72629';

        if (!clientId || !clientSecret) {
            context.log('Missing Azure app credentials');
            context.res = {
                status: 500,
                body: { error: 'Server configuration error' }
            };
            return;
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
            context.res = {
                status: 500,
                body: { error: 'Failed to authenticate with Microsoft Graph' }
            };
            return;
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Get user groups from Microsoft Graph
        const groupsResponse = await fetch(`https://graph.microsoft.com/v1.0/users/${userId}/memberOf?$select=id,displayName,description,groupTypes`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!groupsResponse.ok) {
            context.log('Failed to fetch user groups from Graph API');
            context.res = {
                status: 500,
                body: { error: 'Failed to fetch user groups from Microsoft Graph' }
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
