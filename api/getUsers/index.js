// Microsoft Graph API endpoint for getting users
const fetch = require('node-fetch');

module.exports = async function (context, req) {
    context.log('Get users request received');

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

        // Get users from Microsoft Graph using user's delegated token
        const usersResponse = await fetch('https://graph.microsoft.com/v1.0/users?$select=id,displayName,userPrincipalName,mail,jobTitle,department&$top=100', {
            headers: {
                'Authorization': `Bearer ${userToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!usersResponse.ok) {
            const errorText = await usersResponse.text();
            context.log('Failed to fetch users from Graph API:', usersResponse.status, errorText);
            context.res = {
                status: usersResponse.status,
                body: { 
                    error: 'Failed to fetch users from Microsoft Graph',
                    details: `HTTP ${usersResponse.status}: ${errorText}`
                }
            };
            return;
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

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: users
        };

    } catch (error) {
        context.log('Error in getUsers:', error);
        context.res = {
            status: 500,
            body: { 
                error: 'Failed to fetch users',
                details: error.message 
            }
        };
    }
};
