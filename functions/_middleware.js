/**
 * Cloudflare Pages Functions Middleware
 * 1. 处理API请求代理到后端服务器
 * 2. 强制为所有CSS文件设置正确的MIME类型
 * 3. 解决www子域名的MIME类型问题
 */

export async function onRequest(context) {
  const url = new URL(context.request.url);
  
  // ===== API代理功能（新增）=====
  // 拦截所有 /api/* 请求并代理到后端服务器
  if (url.pathname.startsWith('/api/')) {
    // 处理CORS预检请求
    if (context.request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        }
      });
    }
    
    // 调试信息 - 确认函数被触发
    console.log(`[Middleware] API request intercepted: ${context.request.method} ${url.pathname}`);
    
    // 对于API请求，直接返回测试响应（先确认middleware在工作）
    // 这是临时测试代码，用于验证Functions是否运行
    if (url.pathname === '/api/test') {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Cloudflare Functions is working!',
          timestamp: new Date().toISOString(),
          path: url.pathname
        }), 
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'X-Powered-By': 'Cloudflare-Functions'
          }
        }
      );
    }
    
    try {
      // 使用临时域名来避免 Error 1003
      // 后端服务器需要配置为接受来自这个域名的请求
      const BACKEND_HOST = 'backend.magicschoolai.net';
      const BACKEND_IP = '45.77.86.20';
      const BACKEND_PORT = '3001';
      
      // 构建后端URL - 先尝试使用域名
      let backendUrl;
      let useDomainApproach = false; // 暂时禁用域名方式
      
      if (useDomainApproach) {
        backendUrl = `http://${BACKEND_HOST}:${BACKEND_PORT}${url.pathname}${url.search}`;
      } else {
        // 直接使用IP（会导致Error 1003，但我们会捕获并处理）
        backendUrl = `http://${BACKEND_IP}:${BACKEND_PORT}${url.pathname}${url.search}`;
      }
      
      // 准备请求头
      const headers = new Headers();
      
      // 只复制必要的请求头
      const contentType = context.request.headers.get('Content-Type');
      const authorization = context.request.headers.get('Authorization');
      
      if (contentType) {
        headers.set('Content-Type', contentType);
      }
      if (authorization) {
        headers.set('Authorization', authorization);
      }
      
      // 添加真实IP信息
      const cfConnectingIP = context.request.headers.get('CF-Connecting-IP');
      if (cfConnectingIP) {
        headers.set('X-Forwarded-For', cfConnectingIP);
        headers.set('X-Real-IP', cfConnectingIP);
      }
      
      // 准备请求体
      let body = undefined;
      if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
        try {
          body = await context.request.text();
        } catch (e) {
          console.error('Error reading request body:', e);
        }
      }
      
      console.log(`[Middleware] Attempting to forward to: ${backendUrl}`);
      
      // 尝试转发请求
      let backendResponse;
      try {
        backendResponse = await fetch(backendUrl, {
          method: context.request.method,
          headers: headers,
          body: body
        });
      } catch (fetchError) {
        // 如果fetch失败，返回详细错误信息
        console.error('Fetch failed:', fetchError);
        
        // 检查是否是Error 1003
        if (fetchError.message && fetchError.message.includes('1003')) {
          return new Response(
            JSON.stringify({ 
              error: 'Cloudflare Error 1003',
              message: 'Direct IP access is not allowed from Cloudflare Functions. A domain name is required for the backend server.',
              details: {
                attempted_url: backendUrl,
                suggestion: 'Backend server needs a domain name, or use Cloudflare Tunnel'
              }
            }), 
            {
              status: 503,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              }
            }
          );
        }
        
        throw fetchError;
      }
      
      // 创建响应并添加CORS头
      const response = new Response(backendResponse.body, backendResponse);
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      
      return response;
      
    } catch (error) {
      console.error('API Proxy Error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Backend connection failed',
          message: error.message,
          stack: error.stack
        }), 
        {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }
  }
  
  // ===== 原有的CSS/JS MIME类型修复（保留）=====
  // 获取原始响应
  const response = await context.next();
  
  // 克隆响应以修改头部
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
  
  // 添加调试头部（可以在浏览器中查看）
  newResponse.headers.set('X-Middleware-Applied', 'true');
  newResponse.headers.set('X-Original-URL', url.pathname);
  
  return newResponse;
}