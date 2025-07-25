const { callGraphAPI } = require('../shared/graphHelper');

module.exports = async function (context, req) {
    context.log('GetGroups request received');

    try {
        // Get search parameter
        const search = req.query.search;
        
        // Build Graph API URL with expanded member count information
        let url = 'https://graph.microsoft.com/v1.0/groups?$select=id,displayName,description,mail,groupTypes&$expand=members($select=id)&$top=999';
        
        if (search) {
            // Add search filter
            const searchFilter = `startswith(displayName,'${search.replace(/'/g, "''")}') or startswith(mail,'${search.replace(/'/g, "''")}')`;
            url += `&$filter=${encodeURIComponent(searchFilter)}`;
        }

        context.log('Fetching groups with URL:', url);

        // Call Microsoft Graph to get groups using delegated permissions
        const groupsResponse = await callGraphAPI(url, req, context);
        
        // Process groups to add member count and empty status
        const processedGroups = (groupsResponse.value || []).map(group => {
            const memberCount = group.members ? group.members.length : 0;
            return {
                id: group.id,
                displayName: group.displayName,
                description: group.description,
                mail: group.mail,
                groupTypes: group.groupTypes || [],
                memberCount: memberCount,
                isEmpty: memberCount === 0
            };
        });

        context.log(`Processed ${processedGroups.length} groups with member counts`);

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: processedGroups
        };

    } catch (error) {
        context.log('Error in getGroups:', error);
        
        // If $expand fails (permission issues), fallback to basic group info
        if (error.message && error.message.includes('expand')) {
            context.log('$expand failed, falling back to basic group information');
            try {
                let fallbackUrl = 'https://graph.microsoft.com/v1.0/groups?$select=id,displayName,description,mail,groupTypes&$top=999';
                
                if (search) {
                    const searchFilter = `startswith(displayName,'${search.replace(/'/g, "''")}') or startswith(mail,'${search.replace(/'/g, "''")}')`;
                    fallbackUrl += `&$filter=${encodeURIComponent(searchFilter)}`;
                }
                
                const basicGroups = await callGraphAPI(fallbackUrl, req, context);
                
                // Return basic groups without member counts
                const fallbackGroups = (basicGroups.value || []).map(group => ({
                    id: group.id,
                    displayName: group.displayName,
                    description: group.description,
                    mail: group.mail,
                    groupTypes: group.groupTypes || [],
                    memberCount: 0, // Unknown member count
                    isEmpty: false // Unknown if empty
                }));
                
                context.res = {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: fallbackGroups
                };
                return;
            } catch (fallbackError) {
                context.log('Fallback also failed:', fallbackError);
            }
        }
        
        context.res = {
            status: 500,
            body: { 
                error: 'Failed to retrieve groups', 
                details: error.message 
            }
        };
    }
};
