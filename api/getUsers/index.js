const { callGraphAPI } = require('../shared/graphHelper');

module.exports = async function (context, req) {
    context.log('GetUsers request received');

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
        context.res = {
            status: 500,
            body: { 
                error: 'Failed to retrieve users', 
                details: error.message 
            }
        };
    }
};
