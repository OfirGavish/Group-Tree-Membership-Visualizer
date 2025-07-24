// Microsoft Graph API endpoint for getting devices
const { callGraphAPI } = require('../shared/graphHelper');

module.exports = async function (context, req) {
    context.log('GetDevices request received');

    try {
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

        // Call Microsoft Graph to get devices using delegated permissions
        const devices = await callGraphAPI(graphUrl, req, context);

        context.res = {
            status: 200,
            body: devices.value || []
        };

    } catch (error) {
        context.log('Error in getDevices:', error);
        context.res = {
            status: 500,
            body: { 
                error: 'Failed to retrieve devices', 
                details: error.message 
            }
        };
    }
};
