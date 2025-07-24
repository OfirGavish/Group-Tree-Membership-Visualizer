const { callGraphAPI } = require('../shared/graphHelper');

module.exports = async function (context, req) {
    context.log('GetGroups request received');

    try {
        // Get search parameter
        const search = req.query.search;
        
        // Build Graph API URL
        let url = 'https://graph.microsoft.com/v1.0/groups?$select=id,displayName,description,mail,groupTypes&$top=999';
        
        if (search) {
            // Add search filter
            const searchFilter = `startswith(displayName,'${search.replace(/'/g, "''")}') or startswith(mail,'${search.replace(/'/g, "''")}')`;
            url += `&$filter=${encodeURIComponent(searchFilter)}`;
        }

        // Call Microsoft Graph to get groups using delegated permissions
        const groups = await callGraphAPI(url, req, context);

        context.res = {
            status: 200,
            body: groups.value || []
        };

    } catch (error) {
        context.log('Error in getGroups:', error);
        context.res = {
            status: 500,
            body: { 
                error: 'Failed to retrieve groups', 
                details: error.message 
            }
        };
    }
};
