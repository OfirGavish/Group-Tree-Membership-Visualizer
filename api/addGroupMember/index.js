// Microsoft Graph API endpoint for adding a member to a group
const { callGraphAPI } = require('../shared/graphHelper');

module.exports = async function (context, req) {
    context.log('Add group member request received');
    context.log('Request method:', req.method);
    context.log('Has x-delegated-access-token:', !!req.headers['x-delegated-access-token']);

    try {
        // Only allow POST requests
        if (req.method !== 'POST') {
            context.res = {
                status: 405,
                body: { error: 'Method not allowed. Use POST.' }
            };
            return;
        }

        // Get parameters from request body
        const { groupId, memberId } = req.body;
        
        if (!groupId || !memberId) {
            context.res = {
                status: 400,
                body: { error: 'groupId and memberId are required in request body' }
            };
            return;
        }

        context.log(`Adding member ${memberId} to group ${groupId}`);

        // Prepare the request body for Graph API
        const requestBody = {
            "@odata.id": `https://graph.microsoft.com/v1.0/directoryObjects/${memberId}`
        };

        // Add member to group using Microsoft Graph API
        const graphUrl = `https://graph.microsoft.com/v1.0/groups/${groupId}/members/$ref`;
        
        await callGraphAPI(graphUrl, req, context, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        context.log(`Successfully added member ${memberId} to group ${groupId}`);

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: { 
                success: true, 
                message: 'Member added to group successfully',
                groupId,
                memberId
            }
        };

    } catch (error) {
        context.log('Error in addGroupMember:', error);
        
        // Handle specific Graph API errors
        let errorMessage = 'Failed to add member to group';
        let statusCode = 500;
        
        if (error.message && error.message.includes('Bad Request')) {
            errorMessage = 'Member is already in the group or invalid member/group ID';
            statusCode = 400;
        } else if (error.message && error.message.includes('Forbidden')) {
            errorMessage = 'Insufficient permissions to modify group membership';
            statusCode = 403;
        } else if (error.message && error.message.includes('Not Found')) {
            errorMessage = 'Group or member not found';
            statusCode = 404;
        }

        context.res = {
            status: statusCode,
            body: { 
                error: errorMessage,
                details: error.message 
            }
        };
    }
};
