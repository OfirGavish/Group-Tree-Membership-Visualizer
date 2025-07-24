// Shared authentication helper for Azure Functions
const fetch = require('node-fetch');

class AuthHelper {
    static async getApplicationToken() {
        const clientId = process.env.AZURE_CLIENT_ID;
        const clientSecret = process.env.AZURE_CLIENT_SECRET;
        const tenantId = process.env.AZURE_TENANT_ID;

        if (!clientId || !clientSecret || !tenantId) {
            throw new Error('Missing Azure AD configuration');
        }

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

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            throw new Error(`Failed to get application token: ${tokenResponse.status} - ${errorText}`);
        }

        const tokenData = await tokenResponse.json();
        return tokenData.access_token;
    }

    static async callGraphAPI(endpoint, accessToken, method = 'GET', body = null) {
        const options = {
            method: method,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        };

        if (body && method !== 'GET') {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`https://graph.microsoft.com/v1.0${endpoint}`, options);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Graph API call failed: ${response.status} - ${errorText}`);
        }

        return await response.json();
    }

    static checkAuthentication(req) {
        const clientPrincipal = req.headers['x-ms-client-principal'];
        if (!clientPrincipal) {
            throw new Error('Not authenticated');
        }
        return true;
    }
}

module.exports = { AuthHelper };
