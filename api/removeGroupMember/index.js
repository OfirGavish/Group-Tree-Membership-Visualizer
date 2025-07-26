// Microsoft Graph API endpoint for removing a member from a group
const { callGraphAPI } = require('../shared/graphHelper');

module.exports = async function (context, req) {
    context.log('Remove group member request received');
    context.log('Request method:', req.method);
    context.log('Has x-delegated-access-token:', !!req.headers['x-delegated-access-token']);

    try {
        // Only allow DELETE requests
        if (req.method !== 'DELETE') {
            context.res = {
                status: 405,
                body: { error: 'Method not allowed. Use DELETE.' }
            };
            return;
        }

        // Get parameters from query string for DELETE requests
        const groupId = req.query.groupId;
        const memberId = req.query.memberId;
        
        if (!groupId || !memberId) {
            context.res = {
                status: 400,
                body: { error: 'groupId and memberId query parameters are required' }
            };
            return;
        }

        context.log(`Removing member ${memberId} from group ${groupId}`);

        // Remove member from group using Microsoft Graph API
        const graphUrl = `https://graph.microsoft.com/v1.0/groups/${groupId}/members/${memberId}/$ref`;
        
        await callGraphAPI(graphUrl, req, context, {
            method: 'DELETE'
        });

        context.log(`Successfully removed member ${memberId} from group ${groupId}`);

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: { 
                success: true, 
                message: 'Member removed from group successfully',
                groupId,
                memberId
            }
        };

    } catch (error) {
        context.log('Error in removeGroupMember:', error);
        
        // Handle specific Graph API errors
        let errorMessage = 'Failed to remove member from group';
        let statusCode = 500;
        
        if (error.message && error.message.includes('Bad Request')) {
            errorMessage = 'Invalid member/group ID or member not in group';
            statusCode = 400;
        } else if (error.message && error.message.includes('Forbidden')) {
            errorMessage = 'Insufficient permissions to modify group membership';
            statusCode = 403;
        } else if (error.message && error.message.includes('Not Found')) {
            errorMessage = 'Group, member not found, or member not in group';
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
