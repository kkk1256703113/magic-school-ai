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
  
  // API请求代理逻辑 - 区分Replicate API和后端API
  if (url.pathname.startsWith('/api/')) {
    console.log(`Proxying API request: ${url.pathname}`);
    
    // Replicate API代理到api.replicate.com
    if (url.pathname.startsWith('/api/replicate/')) {
      const replicateUrl = `https://api.replicate.com${url.pathname.replace('/api/replicate', '')}${url.search}`;
      console.log(`Proxying to Replicate: ${replicateUrl}`);
      
      // 准备Replicate API请求头
      const replicateHeaders = new Headers(context.request.headers);
      replicateHeaders.delete('cf-ray');
      replicateHeaders.delete('cf-visitor');
      replicateHeaders.delete('cf-connecting-ip');
      replicateHeaders.set('Host', 'api.replicate.com');
      replicateHeaders.set('Origin', 'https://api.replicate.com');
      
      try {
        const replicateResponse = await fetch(replicateUrl, {
          method: context.request.method,
          headers: replicateHeaders,
          body: context.request.body
        });
        
        const responseHeaders = new Headers(replicateResponse.headers);
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        responseHeaders.set('X-Replicate-Proxy', 'true');
        
        return new Response(replicateResponse.body, {
          status: replicateResponse.status,
          statusText: replicateResponse.statusText,
          headers: responseHeaders
        });
      } catch (error) {
        console.error('Replicate proxy error:', error);
        return new Response(JSON.stringify({
          error: 'Replicate API proxy failed',
          details: error.message
        }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // 后端API代理到后端服务器 - 通过Nginx反向代理访问80端口
    const backendUrl = `http://api.magicschoolai.net${url.pathname}${url.search}`;
    
    // 准备请求头 - 设置正确的Host头部避免1003错误
    const headers = new Headers(context.request.headers);
    headers.delete('cf-ray');
    headers.delete('cf-visitor');
    headers.delete('cf-connecting-ip');
    headers.set('Host', 'api.magicschoolai.net');  // 关键：设置正确Host头部
    headers.set('Origin', url.origin);
    headers.set('X-Real-IP', context.request.headers.get('CF-Connecting-IP') || 'unknown');
    
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