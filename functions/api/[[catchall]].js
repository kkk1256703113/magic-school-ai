/**
 * Cloudflare Pages Functions - API Proxy
 * 
 * 这个文件会自动处理所有 /api/* 的请求，并将它们代理到后端服务器
 * 文件名 [[catchall]].js 表示捕获所有 /api 下的路径
 */

export async function onRequest(context) {
  const { request, env, params } = context;
  
  // 获取原始请求的 URL
  const url = new URL(request.url);
  
  // 构建后端 API 的完整 URL
  // 将请求转发到你的 VPS 服务器
  const backendUrl = `http://45.77.86.20:3001${url.pathname}${url.search}`;
  
  console.log(`Proxying request: ${request.method} ${url.pathname} -> ${backendUrl}`);
  
  // 处理 OPTIONS 预检请求（用于 CORS）
  if (request.method === 'OPTIONS') {
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
    // 准备转发的请求头
    const headers = new Headers(request.headers);
    
    // 添加真实 IP 信息
    if (request.headers.get('CF-Connecting-IP')) {
      headers.set('X-Forwarded-For', request.headers.get('CF-Connecting-IP'));
      headers.set('X-Real-IP', request.headers.get('CF-Connecting-IP'));
    }
    
    // 移除 Cloudflare 特有的头部，避免后端混淆
    headers.delete('CF-Ray');
    headers.delete('CF-Visitor');
    headers.delete('CF-IPCountry');
    headers.delete('CF-Connecting-IP');
    
    // 准备请求配置
    const fetchOptions = {
      method: request.method,
      headers: headers,
    };
    
    // 只有非 GET 和非 HEAD 请求才需要 body
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      fetchOptions.body = request.body;
    }
    
    // 转发请求到后端服务器
    const backendResponse = await fetch(backendUrl, fetchOptions);
    
    // 获取响应内容
    const responseBody = await backendResponse.arrayBuffer();
    
    // 准备响应头
    const responseHeaders = new Headers(backendResponse.headers);
    
    // 添加 CORS 头部，确保前端可以访问
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Credentials', 'true');
    
    // 如果响应是 JSON，确保 Content-Type 正确
    const contentType = backendResponse.headers.get('Content-Type');
    if (!contentType && url.pathname.startsWith('/api/')) {
      responseHeaders.set('Content-Type', 'application/json');
    }
    
    // 返回代理的响应
    return new Response(responseBody, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });
    
  } catch (error) {
    // 错误处理
    console.error('Proxy error:', error);
    
    // 根据错误类型返回适当的错误响应
    let errorMessage = 'Unable to connect to backend API';
    let statusCode = 503;
    
    if (error.message.includes('fetch')) {
      errorMessage = 'Backend server is unreachable';
      statusCode = 502;
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Request timeout';
      statusCode = 504;
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        message: error.message,
        timestamp: new Date().toISOString()
      }), 
      {
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true',
        }
      }
    );
  }
}

// 导出 onRequestPost, onRequestGet 等方法，确保所有 HTTP 方法都被处理
export const onRequestPost = onRequest;
export const onRequestGet = onRequest;
export const onRequestPut = onRequest;
export const onRequestDelete = onRequest;
export const onRequestPatch = onRequest;
export const onRequestHead = onRequest;
export const onRequestOptions = onRequest;