module.exports = async function (context, req) {
    try {
        const headers = req.headers;
        
        // Get all authentication-related headers
        const authHeaders = {};
        Object.keys(headers).forEach(key => {
            if (key.toLowerCase().includes('ms-') || 
                key.toLowerCase().includes('auth') || 
                key.toLowerCase().includes('token') ||
                key.toLowerCase().includes('principal')) {
                authHeaders[key] = headers[key];
            }
        });
        
        // Parse client principal if available
        let clientPrincipal = null;
        let principalError = null;
        if (headers['x-ms-client-principal']) {
            try {
                const principalData = Buffer.from(headers['x-ms-client-principal'], 'base64').toString();
                clientPrincipal = JSON.parse(principalData);
            } catch (e) {
                principalError = e.message;
            }
        }
        
        // Check what tokens we have access to
        const tokenAnalysis = {
            idToken: !!headers['x-ms-token-aad-id-token'],
            accessToken: !!headers['x-ms-token-aad-access-token'],
            refreshToken: !!headers['x-ms-token-aad-refresh-token'],
            authToken: !!headers['x-ms-auth-token'],
            clientPrincipal: !!headers['x-ms-client-principal']
        };
        
        // If we have an ID token, let's examine it (decode but don't verify)
        let idTokenInfo = null;
        if (headers['x-ms-token-aad-id-token']) {
            try {
                const idToken = headers['x-ms-token-aad-id-token'];
                const parts = idToken.split('.');
                if (parts.length === 3) {
                    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
                    idTokenInfo = {
                        aud: payload.aud,
                        iss: payload.iss,
                        exp: payload.exp,
                        iat: payload.iat,
                        upn: payload.upn,
                        name: payload.name,
                        tid: payload.tid,
                        scopes: payload.scp || payload.scope
                    };
                }
            } catch (e) {
                idTokenInfo = { error: e.message };
            }
        }
        
        // If we have an access token, examine it too
        let accessTokenInfo = null;
        if (headers['x-ms-token-aad-access-token']) {
            try {
                const accessToken = headers['x-ms-token-aad-access-token'];
                const parts = accessToken.split('.');
                if (parts.length === 3) {
                    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
                    accessTokenInfo = {
                        aud: payload.aud,
                        iss: payload.iss,
                        exp: payload.exp,
                        iat: payload.iat,
                        upn: payload.upn,
                        scopes: payload.scp || payload.scope
                    };
                }
            } catch (e) {
                accessTokenInfo = { error: e.message };
            }
        }
        
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                timestamp: new Date().toISOString(),
                authHeaders: authHeaders,
                tokenAnalysis: tokenAnalysis,
                clientPrincipal: clientPrincipal,
                principalError: principalError,
                idTokenInfo: idTokenInfo,
                accessTokenInfo: accessTokenInfo,
                environment: {
                    clientId: process.env.AZURE_CLIENT_ID,
                    tenantId: process.env.AZURE_TENANT_ID,
                    clientSecretSet: !!process.env.AZURE_CLIENT_SECRET
                }
            }, null, 2)
        };
        
    } catch (error) {
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                error: error.message,
                stack: error.stack
            }, null, 2)
        };
    }
};
