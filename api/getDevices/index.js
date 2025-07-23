// Microsoft Graph API endpoint for getting devices
const fetch = require('node-fetch');

module.exports = async function (context, req) {
    context.log('Get devices request received');

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

        // Search parameter
        const search = req.query.search;
        let graphUrl = 'https://graph.microsoft.com/v1.0/devices';
        
        // Apply search filter if provided
        if (search) {
            // Search by display name or device ID
            const filter = `startswith(displayName,'${search}') or startswith(deviceId,'${search}')`;
            graphUrl += `?$filter=${encodeURIComponent(filter)}`;
        }
        
        // Select specific properties for better performance
        const selectProps = 'id,displayName,deviceId,operatingSystem,operatingSystemVersion,deviceVersion,trustType,isManaged,isCompliant,registrationDateTime';
        const separator = graphUrl.includes('?') ? '&' : '?';
        graphUrl += `${separator}$select=${selectProps}&$top=100`;

        context.log('Fetching devices from:', graphUrl);

        // Call Microsoft Graph API to get devices using user's delegated token
        const graphResponse = await fetch(graphUrl, {
            headers: {
                'Authorization': `Bearer ${userToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!graphResponse.ok) {
            const errorText = await graphResponse.text();
            context.log('Graph API error:', graphResponse.status, errorText);
            context.res = {
                status: graphResponse.status,
                body: { 
                    error: 'Failed to fetch devices from Microsoft Graph',
                    details: errorText
                }
            };
            return;
        }

        const data = await graphResponse.json();
        const devices = data.value || [];

        context.log(`Found ${devices.length} devices`);

        // Transform the data to match our Device interface
        const transformedDevices = devices.map(device => ({
            id: device.id,
            displayName: device.displayName || 'Unknown Device',
            deviceId: device.deviceId || '',
            operatingSystem: device.operatingSystem,
            operatingSystemVersion: device.operatingSystemVersion,
            deviceVersion: device.deviceVersion,
            trustType: device.trustType,
            isManaged: device.isManaged,
            isCompliant: device.isCompliant,
            registrationDateTime: device.registrationDateTime
        }));

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
            },
            body: transformedDevices
        };

    } catch (error) {
        context.log('Error in getDevices:', error);
        context.res = {
            status: 500,
            body: { 
                error: 'Internal server error',
                message: error.message 
            }
        };
    }
};
