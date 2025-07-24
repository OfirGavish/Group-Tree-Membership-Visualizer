// Microsoft Graph API endpoint for getting user groups
const { callGraphAPI } = require('../shared/graphHelper');

module.exports = async function (context, req) {
    context.log('Get user groups request received');
    context.log('Request headers:', Object.keys(req.headers));
    context.log('Has x-delegated-access-token:', !!req.headers['x-delegated-access-token']);

    try {
        // Get user ID from query parameters
        const userId = req.query.userId;
        if (!userId) {
            context.res = {
                status: 400,
                body: { error: 'userId parameter is required' }
            };
            return;
        }

        // Get user groups from Microsoft Graph using delegated permissions
        const graphUrl = `https://graph.microsoft.com/v1.0/users/${userId}/memberOf?$select=id,displayName,description,groupTypes`;
        const groupsData = await callGraphAPI(graphUrl, req, context);

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
