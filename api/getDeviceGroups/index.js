// Microsoft Graph API endpoint for getting device group memberships
const { callGraphAPI } = require('../shared/graphHelper');

module.exports = async function (context, req) {
    context.log('GetDeviceGroups request received');

    try {
        // Get device ID from query parameters
        const deviceId = req.query.deviceId;
        if (!deviceId) {
            context.res = {
                status: 400,
                body: { error: 'Device ID is required' }
            };
            return;
        }

        // Get device's group memberships
        const graphUrl = `https://graph.microsoft.com/v1.0/devices/${encodeURIComponent(deviceId)}/memberOf?$select=id,displayName,description,groupTypes`;

        context.log('Fetching device groups from:', graphUrl);

        // Call Microsoft Graph to get device group memberships using delegated permissions
        const deviceGroups = await callGraphAPI(graphUrl, req, context);

        context.res = {
            status: 200,
            body: deviceGroups.value || []
        };

    } catch (error) {
        context.log('Error in getDeviceGroups:', error);
        context.res = {
            status: 500,
            body: { 
                error: 'Failed to retrieve device groups', 
                details: error.message 
            }
        };
    }
};
