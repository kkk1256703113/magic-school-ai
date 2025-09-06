/**
 * Cloudflare Pages Functions Middleware
 * 双重功能：
 * 1. 强制为CSS和JS文件设置正确的MIME类型（解决www子域名问题）
 * 2. API请求代理到后端服务器（解决522端口连接问题）
 * 
 * 更新：重新启用API代理功能解决Cloudflare 522错误
 */

export async function onRequest(context) {
  const url = new URL(context.request.url);
  
  // API请求代理逻辑
  if (url.pathname.startsWith('/api/')) {
    console.log(`Proxying API request: ${url.pathname}`);
    
    // 构建后端URL - 直接连接到服务器IP和端口
    const backendUrl = `http://45.77.86.20:8080${url.pathname}${url.search}`;
    
    // 准备请求头
    const headers = new Headers(context.request.headers);
    headers.set('Host', '45.77.86.20:8080');
    headers.set('Origin', url.origin);
    
    try {
      // 代理请求到后端
      const backendResponse = await fetch(backendUrl, {
        method: context.request.method,
        headers: headers,
        body: context.request.body
      });
      
      // 创建新的响应并添加CORS头部
      const responseHeaders = new Headers(backendResponse.headers);
      responseHeaders.set('Access-Control-Allow-Origin', '*');
      responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      // 添加调试头部
      responseHeaders.set('X-API-Proxy', 'true');
      responseHeaders.set('X-Backend-URL', backendUrl);
      
      return new Response(backendResponse.body, {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        headers: responseHeaders
      });
      
    } catch (error) {
      console.error('API proxy error:', error);
      return new Response(JSON.stringify({
        error: 'API proxy failed',
        details: error.message
      }), {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Proxy-Error': 'true'
        }
      });
    }
  }
  
  // 非API请求：处理静态资源MIME类型
  const response = await context.next();
  const newResponse = new Response(response.body, response);
  
  // 为CSS文件设置正确的Content-Type
  if (url.pathname.endsWith('.css') || url.pathname.includes('.css')) {
    newResponse.headers.set('Content-Type', 'text/css; charset=UTF-8');
    console.log(`Fixed CSS MIME type for: ${url.pathname}`);
  }
  
  // 为JS文件设置正确的Content-Type
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.mjs')) {
    newResponse.headers.set('Content-Type', 'application/javascript; charset=UTF-8');
  }
  
  // 添加调试头部
  newResponse.headers.set('X-Middleware-Applied', 'true');
  newResponse.headers.set('X-Original-URL', url.pathname);
  
  return newResponse;
}