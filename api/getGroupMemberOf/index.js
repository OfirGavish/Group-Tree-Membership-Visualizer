// Microsoft Graph API endpoint for getting group memberOf (groups that this group belongs to)
const { callGraphAPI } = require('../shared/graphHelper');

module.exports = async function (context, req) {
    context.log('Get group memberOf request received');

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

        // Get group memberOf from Microsoft Graph using delegated permissions
        const graphUrl = `https://graph.microsoft.com/v1.0/groups/${groupId}/memberOf?$select=id,displayName,description,groupTypes`;
        const memberOfData = await callGraphAPI(graphUrl, req, context);

        const groups = memberOfData.value
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
        context.log('Error in getGroupMemberOf:', error);
        context.res = {
            status: 500,
            body: { 
                error: 'Failed to fetch group memberOf',
                details: error.message 
            }
        };
    }
};
