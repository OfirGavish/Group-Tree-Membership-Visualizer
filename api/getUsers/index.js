const { callGraphAPI } = require('../shared/graphHelper');

module.exports = async function (context, req) {
    context.log('GetUsers request received');
    context.log('Request headers:', Object.keys(req.headers));
    context.log('Has x-delegated-access-token:', !!req.headers['x-delegated-access-token']);

    try {
        // Call Microsoft Graph to get users using delegated permissions
        const users = await callGraphAPI(
            'https://graph.microsoft.com/v1.0/users?$select=id,displayName,userPrincipalName,mail,jobTitle,department&$top=999',
            req,
            context
        );

        context.res = {
            status: 200,
            body: users.value || []
        };

    } catch (error) {
        context.log('Error in getUsers:', error);
        context.log('Error details:', error.message);
        context.log('Error stack:', error.stack);
        context.res = {
            status: 401, // Change to 401 to see if this is where the error comes from
            body: { 
                error: 'Failed to retrieve users', 
                details: error.message 
            }
        };
    }
};
