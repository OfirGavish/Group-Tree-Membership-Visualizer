// Debug endpoint to check environment variables and auth
const fetch = require('node-fetch');

module.exports = async function (context, req) {
    context.log('Debug request received');

    try {
        // Check environment variables
        const clientId = process.env.AZURE_CLIENT_ID;
        const clientSecret = process.env.AZURE_CLIENT_SECRET ? 'SET' : 'NOT SET';
        const tenantId = process.env.AZURE_TENANT_ID;

        // Check authentication
        const clientPrincipal = req.headers['x-ms-client-principal'];
        let authInfo = 'No client principal found';
        
        if (clientPrincipal) {
            try {
                const principal = JSON.parse(Buffer.from(clientPrincipal, 'base64').toString());
                authInfo = {
                    userId: principal.userId,
                    userDetails: principal.userDetails,
                    identityProvider: principal.identityProvider
                };
            } catch (e) {
                authInfo = 'Error decoding client principal';
            }
        }

        // Test token acquisition
        let tokenTestResult = 'Not tested';
        if (clientId && process.env.AZURE_CLIENT_SECRET && tenantId) {
            try {
                const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        client_id: clientId,
                        client_secret: process.env.AZURE_CLIENT_SECRET,
                        scope: 'https://graph.microsoft.com/.default',
                        grant_type: 'client_credentials'
                    })
                });

                if (tokenResponse.ok) {
                    const tokenData = await tokenResponse.json();
                    tokenTestResult = `Success - Token received with scope: ${tokenData.scope || 'Unknown'}`;
                } else {
                    const errorData = await tokenResponse.text();
                    tokenTestResult = `Failed - ${tokenResponse.status}: ${errorData}`;
                }
            } catch (error) {
                tokenTestResult = `Error - ${error.message}`;
            }
        } else {
            tokenTestResult = 'Missing required environment variables';
        }

        const debugInfo = {
            environment: {
                clientId: clientId || 'NOT SET',
                clientSecret: clientSecret,
                tenantId: tenantId || 'NOT SET'
            },
            authentication: authInfo,
            tokenTest: tokenTestResult,
            timestamp: new Date().toISOString()
        };

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: debugInfo
        };

    } catch (error) {
        context.log('Error in debug endpoint:', error);
        context.res = {
            status: 500,
            body: { 
                error: 'Debug endpoint failed',
                details: error.message 
            }
        };
    }
};
