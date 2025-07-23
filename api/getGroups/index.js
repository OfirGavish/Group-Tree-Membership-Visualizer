// Microsoft Graph API endpoint for getting groups
const fetch = require('node-fetch');

module.exports = async function (context, req) {
    context.log('Get groups request received');

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

        // Get user's delegated token from Easy Auth
        const userToken = req.headers['x-ms-token-aad-access-token'];
        if (!userToken) {
            context.log('No user access token found in headers');
            context.res = {
                status: 401,
                body: { error: 'User access token not available' }
            };
            return;
        }

        // Get search parameter
        const search = req.query.search;
        let url = 'https://graph.microsoft.com/v1.0/groups?$select=id,displayName,description,groupTypes,members&$top=100';
        
        // Add search filter if provided
        if (search) {
            const encodedSearch = encodeURIComponent(search);
            url += `&$filter=startswith(displayName,'${encodedSearch}') or contains(displayName,'${encodedSearch}')`;
        }

        // Get groups from Microsoft Graph using user's delegated token
        const groupsResponse = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${userToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!groupsResponse.ok) {
            const errorText = await groupsResponse.text();
            context.log('Failed to fetch groups from Graph API:', groupsResponse.status, errorText);
            context.res = {
                status: groupsResponse.status,
                body: { 
                    error: 'Failed to fetch groups from Microsoft Graph',
                    details: `HTTP ${groupsResponse.status}: ${errorText}`
                }
            };
            return;
        }

        const groupsData = await groupsResponse.json();
        
        // For each group, check if it has members to mark empty groups
        const groupsWithMemberCount = await Promise.all(
            groupsData.value.map(async (group) => {
                try {
                    // Get member count for each group using user's delegated token
                    const membersResponse = await fetch(`https://graph.microsoft.com/v1.0/groups/${group.id}/members?$count=true&$top=1`, {
                        headers: {
                            'Authorization': `Bearer ${userToken}`,
                            'Content-Type': 'application/json',
                            'ConsistencyLevel': 'eventual'
                        }
                    });

                    let memberCount = 0;
                    if (membersResponse.ok) {
                        const membersData = await membersResponse.json();
                        memberCount = membersData['@odata.count'] || 0;
                    }

                    return {
                        id: group.id,
                        displayName: group.displayName,
                        description: group.description,
                        groupTypes: group.groupTypes || [],
                        memberCount: memberCount,
                        isEmpty: memberCount === 0
                    };
                } catch (error) {
                    context.log(`Error getting member count for group ${group.id}:`, error);
                    return {
                        id: group.id,
                        displayName: group.displayName,
                        description: group.description,
                        groupTypes: group.groupTypes || [],
                        memberCount: 0,
                        isEmpty: true
                    };
                }
            })
        );

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: groupsWithMemberCount
        };

    } catch (error) {
        context.log('Error in getGroups:', error);
        context.res = {
            status: 500,
            body: { 
                error: 'Failed to fetch groups',
                details: error.message 
            }
        };
    }
};
