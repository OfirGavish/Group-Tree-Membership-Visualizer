// Microsoft Graph API endpoint for getting group members
const { callGraphAPI } = require('../shared/graphHelper');

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

        // Get group members from Microsoft Graph using delegated permissions
        const graphUrl = `https://graph.microsoft.com/v1.0/groups/${groupId}/members?$select=id,displayName,userPrincipalName,mail`;
        const membersData = await callGraphAPI(graphUrl, req, context);

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
