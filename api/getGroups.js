// Microsoft Graph API endpoint for getting groups
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

        // Get environment variables
        const clientId = process.env.AZURE_CLIENT_ID;
        const clientSecret = process.env.AZURE_CLIENT_SECRET;
        const tenantId = process.env.AZURE_TENANT_ID || 'df5c1b3a-b49f-406f-b067-a4a6fae72629';

        if (!clientId || !clientSecret) {
            context.log('Missing Azure app credentials');
            context.res = {
                status: 500,
                body: { error: 'Server configuration error' }
            };
            return;
        }

        // Get access token using client credentials flow
        const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                scope: 'https://graph.microsoft.com/.default',
                grant_type: 'client_credentials'
            })
        });

        if (!tokenResponse.ok) {
            context.log('Failed to get access token');
            context.res = {
                status: 500,
                body: { error: 'Failed to authenticate with Microsoft Graph' }
            };
            return;
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Get search parameter
        const search = req.query.search;
        let url = 'https://graph.microsoft.com/v1.0/groups?$select=id,displayName,description,groupTypes,members&$top=100';
        
        // Add search filter if provided
        if (search) {
            const encodedSearch = encodeURIComponent(search);
            url += `&$filter=startswith(displayName,'${encodedSearch}') or contains(displayName,'${encodedSearch}')`;
        }

        // Get groups from Microsoft Graph
        const groupsResponse = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!groupsResponse.ok) {
            context.log('Failed to fetch groups from Graph API');
            context.res = {
                status: 500,
                body: { error: 'Failed to fetch groups from Microsoft Graph' }
            };
            return;
        }

        const groupsData = await groupsResponse.json();
        
        // For each group, check if it has members to mark empty groups
        const groupsWithMemberCount = await Promise.all(
            groupsData.value.map(async (group) => {
                try {
                    // Get member count for each group
                    const membersResponse = await fetch(`https://graph.microsoft.com/v1.0/groups/${group.id}/members?$count=true&$top=1`, {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
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
