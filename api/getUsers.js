const { app } = require('@azure/functions');

// Microsoft Graph API endpoint for getting users
app.http('getUsers', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('Get users request received');

        try {
            // Check if user is authenticated
            const clientPrincipal = request.headers['x-ms-client-principal'];
            if (!clientPrincipal) {
                return {
                    status: 401,
                    body: JSON.stringify({ error: 'Not authenticated' })
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

            // Get users from Microsoft Graph
            const usersResponse = await fetch('https://graph.microsoft.com/v1.0/users?$select=id,displayName,userPrincipalName,mail,jobTitle,department&$top=100', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!usersResponse.ok) {
                context.log('Failed to fetch users from Graph API');
                return {
                    status: 500,
                    body: JSON.stringify({ error: 'Failed to fetch users from Microsoft Graph' })
                };
            }

            const usersData = await usersResponse.json();
            const users = usersData.value.map(user => ({
                id: user.id,
                displayName: user.displayName,
                userPrincipalName: user.userPrincipalName,
                mail: user.mail,
                jobTitle: user.jobTitle,
                department: user.department,
            }));

            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(users)
            };

        } catch (error) {
            context.log('Error in getUsers:', error);
            return {
                status: 500,
                body: JSON.stringify({ 
                    error: 'Failed to fetch users',
                    details: error.message 
                })
            };
        }
    }
});
