// Token debug endpoint to check what tokens we can access
const fetch = require('node-fetch');

module.exports = async function (context, req) {
    context.log('Token debug request received');

    try {
        // Get all the headers
        const allHeaders = Object.keys(req.headers).reduce((acc, key) => {
            if (key.startsWith('x-ms') || key === 'authorization') {
                acc[key] = req.headers[key] ? 'Present' : 'Not present';
            }
            return acc;
        }, {});

        // Try to get user info from /.auth/me
        let authMeInfo = 'Not available';
        try {
            // In Azure Functions, we can't make HTTP calls to the same host easily
            // So we'll just check the headers
            authMeInfo = 'Cannot call /.auth/me from API function';
        } catch (error) {
            authMeInfo = `Error: ${error.message}`;
        }

        // Check if we can use the client credentials flow to get an app token
        let appTokenTest = 'Not tested';
        const clientId = process.env.AZURE_CLIENT_ID;
        const clientSecret = process.env.AZURE_CLIENT_SECRET;
        const tenantId = process.env.AZURE_TENANT_ID;

        if (clientId && clientSecret && tenantId) {
            try {
                const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        grant_type: 'client_credentials',
                        client_id: clientId,
                        client_secret: clientSecret,
                        scope: 'https://graph.microsoft.com/.default'
                    })
                });

                if (tokenResponse.ok) {
                    const tokenData = await tokenResponse.json();
                    appTokenTest = 'Success - App token obtained';
                    
                    // Test the app token
                    try {
                        const usersResponse = await fetch('https://graph.microsoft.com/v1.0/users?$top=1', {
                            headers: {
                                'Authorization': `Bearer ${tokenData.access_token}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        if (usersResponse.ok) {
                            appTokenTest += ' - Can access Graph API';
                        } else {
                            const errorText = await usersResponse.text();
                            appTokenTest += ` - Graph API failed: ${usersResponse.status}`;
                        }
                    } catch (error) {
                        appTokenTest += ` - Graph test error: ${error.message}`;
                    }
                } else {
                    const errorText = await tokenResponse.text();
                    appTokenTest = `Failed to get app token: ${tokenResponse.status} - ${errorText}`;
                }
            } catch (error) {
                appTokenTest = `Error getting app token: ${error.message}`;
            }
        }

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                timestamp: new Date().toISOString(),
                headers: allHeaders,
                authMeInfo: authMeInfo,
                appTokenTest: appTokenTest,
                suggestion: "The issue might be that Easy Auth is not configured to pass Microsoft Graph tokens. You may need to use application permissions instead of delegated permissions, or configure Easy Auth differently."
            }, null, 2)
        };

    } catch (error) {
        context.log.error('Error in token debug:', error);
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                error: error.message,
                stack: error.stack
            })
        };
    }
};
