// Microsoft Graph API endpoint for getting device group memberships
const fetch = require('node-fetch');

module.exports = async function (context, req) {
    context.log('Get device groups request received');

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

        // Get device ID from query parameters
        const deviceId = req.query.deviceId;
        if (!deviceId) {
            context.res = {
                status: 400,
                body: { error: 'Device ID is required' }
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

        // Get device's group memberships
        const graphUrl = `https://graph.microsoft.com/v1.0/devices/${encodeURIComponent(deviceId)}/memberOf?$select=id,displayName,description,groupTypes`;

        context.log('Fetching device groups from:', graphUrl);

        // Call Microsoft Graph API to get device group memberships
        const graphResponse = await fetch(graphUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!graphResponse.ok) {
            const errorText = await graphResponse.text();
            context.log('Graph API error:', graphResponse.status, errorText);
            
            // Handle specific errors
            if (graphResponse.status === 404) {
                context.res = {
                    status: 404,
                    body: { error: 'Device not found' }
                };
                return;
            }
            
            context.res = {
                status: graphResponse.status,
                body: { 
                    error: 'Failed to fetch device groups from Microsoft Graph',
                    details: errorText
                }
            };
            return;
        }

        const data = await graphResponse.json();
        const groups = data.value || [];

        context.log(`Found ${groups.length} groups for device ${deviceId}`);

        // Filter for security groups and distribution groups
        const relevantGroups = groups.filter(group => 
            group['@odata.type'] === '#microsoft.graph.group'
        );

        // Transform the data to match our Group interface
        const transformedGroups = relevantGroups.map(group => ({
            id: group.id,
            displayName: group.displayName || 'Unknown Group',
            description: group.description,
            groupTypes: group.groupTypes || []
        }));

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
            },
            body: transformedGroups
        };

    } catch (error) {
        context.log('Error in getDeviceGroups:', error);
        context.res = {
            status: 500,
            body: { 
                error: 'Internal server error',
                message: error.message 
            }
        };
    }
};
