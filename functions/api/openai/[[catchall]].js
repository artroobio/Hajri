export async function onRequest(context) {
    const { request, params, env } = context;
    const path = params.catchall; // e.g., ["chat", "completions"]

    // Get API key from Cloudflare environment variables
    const apiKey = env.OPENAI_API_KEY;

    if (!apiKey) {
        return new Response(JSON.stringify({
            error: 'OpenAI API key not configured in Cloudflare Worker environment variables'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Reconstruct the path (handle array or single string)
    const urlPath = Array.isArray(path) ? path.join('/') : path;
    const targetUrl = `https://api.openai.com/v1/${urlPath}`;

    // Clone the request headers and inject the API key
    const headers = new Headers(request.headers);
    headers.set('Authorization', `Bearer ${apiKey}`);

    // Remove any client-provided authorization header (extra security)
    // headers.delete('Authorization') would happen above before we set it

    // Create a new request to OpenAI with the server-side API key
    const proxyRequest = new Request(targetUrl, {
        method: request.method,
        headers: headers,
        body: request.body,
        redirect: 'follow'
    });

    try {
        const response = await fetch(proxyRequest);

        // Return the OpenAI response as-is
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
        });
    } catch (err) {
        return new Response(JSON.stringify({
            error: 'Failed to connect to OpenAI',
            message: err.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
