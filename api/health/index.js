// Simple health check endpoint
module.exports = async function (context, req) {
    context.log('Health check request received');

    // Set CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 200,
            headers: corsHeaders,
            body: ''
        };
        return;
    }

    try {
        const healthInfo = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            runtime: process.version,
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch
            }
        };

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
            },
            body: healthInfo
        };

    } catch (error) {
        context.log('Error in health check:', error);
        context.res = {
            status: 500,
            headers: corsHeaders,
            body: { 
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            }
        };
    }
};
