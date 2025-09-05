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
    
    try {
      // 直接连接到服务器，避免通过Cloudflare造成循环
      // 在生产环境使用HTTPS端口8443
      const BACKEND_URL = 'https://45.77.86.20:8443';
      
      // 构建后端URL
      const backendUrl = `${BACKEND_URL}${url.pathname}${url.search}`;
      
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
      
      // 转发请求到后端
      const backendResponse = await fetch(backendUrl, {
        method: context.request.method,
        headers: headers,
        body: body
      });
      
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
          message: error.message
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