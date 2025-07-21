// Microsoft Graph API endpoint for getting group members
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

        // Get group members from Microsoft Graph
        const membersResponse = await fetch(`https://graph.microsoft.com/v1.0/groups/${groupId}/members?$select=id,displayName,userPrincipalName,mail`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!membersResponse.ok) {
            context.log('Failed to fetch group members from Graph API');
            context.res = {
                status: 500,
                body: { error: 'Failed to fetch group members from Microsoft Graph' }
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
