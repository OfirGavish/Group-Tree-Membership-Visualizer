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

        // Get device's group memberships
        const graphUrl = `https://graph.microsoft.com/v1.0/devices/${encodeURIComponent(deviceId)}/memberOf?$select=id,displayName,description,groupTypes`;

        context.log('Fetching device groups from:', graphUrl);

        // Call Microsoft Graph API to get device group memberships using user's delegated token
        const graphResponse = await fetch(graphUrl, {
            headers: {
                'Authorization': `Bearer ${userToken}`,
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
