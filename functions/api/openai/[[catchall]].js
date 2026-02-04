export async function onRequest(context) {
    const { request, params } = context;
    const path = params.catchall; // e.g., ["chat", "completions"]

    // Reconstruct the path (handle array or single string)
    const urlPath = Array.isArray(path) ? path.join('/') : path;
    const targetUrl = `https://api.openai.com/v1/${urlPath}`;

    // Create a new request based on the original
    // We cannot pass the original request directly because the URL is immutable
    const proxyRequest = new Request(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        redirect: 'follow'
    });

    try {
        const response = await fetch(proxyRequest);
        return response;
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
