// Microsoft Graph API endpoint for getting group members
const { callGraphAPI } = require('../shared/graphHelper');

module.exports = async function (context, req) {
    context.log('Get group members request received');
    context.log('Request headers:', Object.keys(req.headers));
    context.log('Has x-delegated-access-token:', !!req.headers['x-delegated-access-token']);

    try {
        // Get group ID from query parameters
        const groupId = req.query.groupId;
        if (!groupId) {
            context.res = {
                status: 400,
                body: { error: 'groupId parameter is required' }
            };
            return;
        }

        // Get group members from Microsoft Graph using delegated permissions
        // Note: We don't include device-specific fields in $select because they don't exist on users/groups
        // Microsoft Graph will return all available fields for each object type
        const graphUrl = `https://graph.microsoft.com/v1.0/groups/${groupId}/members?$select=@odata.type,id,displayName,userPrincipalName,mail`;
        const membersData = await callGraphAPI(graphUrl, req, context);

        const members = membersData.value.map(member => ({
            '@odata.type': member['@odata.type'],
            id: member.id,
            displayName: member.displayName,
            userPrincipalName: member.userPrincipalName,
            mail: member.mail,
            // Include device-specific fields when they exist (devices will have these, users/groups won't)
            deviceId: member.deviceId,
            operatingSystem: member.operatingSystem,
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
