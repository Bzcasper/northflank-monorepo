// Cloudflare Worker to proxy/cache video generation requests
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Video generation endpoint
    if (url.pathname.startsWith('/api/short-video')) {
      return handleVideoRequest(request, env);
    }
    
    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', worker: 'active' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Not Found', { status: 404 });
  }
};

async function handleVideoRequest(request, env) {
  const northflankUrl = env.NORTHFLANK_SERVICE_URL || 'https://shirt-video-maker.app.northflank.com';
  
  // Forward request to Northflank service
  const response = await fetch(`${northflankUrl}${new URL(request.url).pathname}`, {
    method: request.method,
    headers: request.headers,
    body: request.body
  });
  
  // Add Cloudflare caching headers for completed videos
  if (request.method === 'GET' && response.ok) {
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Cache-Control', 'public, max-age=3600');
    newResponse.headers.set('CF-Cache-Status', 'HIT');
    return newResponse;
  }
  
  return response;
}