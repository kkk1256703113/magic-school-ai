/**
 * Cloudflare Pages Functions - API Proxy Handler
 * 文件名 [[path]].js 会捕获 /api/* 下的所有路径
 * 
 * 这个文件专门处理 API 请求，避免与 _middleware.js 冲突
 */

// 处理 GET 请求
export async function onRequestGet(context) {
  return handleRequest(context);
}

// 处理 POST 请求
export async function onRequestPost(context) {
  return handleRequest(context);
}

// 处理 PUT 请求
export async function onRequestPut(context) {
  return handleRequest(context);
}

// 处理 DELETE 请求
export async function onRequestDelete(context) {
  return handleRequest(context);
}

// 处理 PATCH 请求
export async function onRequestPatch(context) {
  return handleRequest(context);
}

// 处理 OPTIONS 预检请求（CORS）
export async function onRequestOptions(context) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    }
  });
}

// 统一处理所有请求
async function handleRequest(context) {
  const url = new URL(context.request.url);
  
  // 获取路径参数（去掉 /api/ 前缀后的部分）
  // context.params.path 是一个数组，包含所有路径段
  const pathSegments = context.params.path || [];
  const apiPath = pathSegments.join('/');
  
  // 构建后端 URL
  const backendUrl = `http://45.77.86.20:3001/api/${apiPath}${url.search}`;
  
  console.log(`API Proxy: ${context.request.method} /api/${apiPath} -> ${backendUrl}`);
  
  try {
    // 准备请求头
    const headers = new Headers();
    
    // 复制必要的请求头
    const contentType = context.request.headers.get('Content-Type');
    const authorization = context.request.headers.get('Authorization');
    
    if (contentType) {
      headers.set('Content-Type', contentType);
    }
    if (authorization) {
      headers.set('Authorization', authorization);
    }
    
    // 添加真实 IP 信息
    const cfConnectingIP = context.request.headers.get('CF-Connecting-IP');
    if (cfConnectingIP) {
      headers.set('X-Forwarded-For', cfConnectingIP);
      headers.set('X-Real-IP', cfConnectingIP);
    }
    
    // 准备请求体
    let body = undefined;
    if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
      try {
        // 尝试读取请求体
        body = await context.request.text();
      } catch (e) {
        // 如果无法读取为文本，尝试作为二进制
        body = await context.request.arrayBuffer();
      }
    }
    
    // 发送请求到后端
    const backendResponse = await fetch(backendUrl, {
      method: context.request.method,
      headers: headers,
      body: body,
    });
    
    // 读取响应
    const responseData = await backendResponse.text();
    
    // 创建新响应
    const response = new Response(responseData, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
    });
    
    // 设置响应头
    const responseContentType = backendResponse.headers.get('Content-Type');
    if (responseContentType) {
      response.headers.set('Content-Type', responseContentType);
    } else {
      // 默认为 JSON
      response.headers.set('Content-Type', 'application/json');
    }
    
    // 添加 CORS 头
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    return response;
    
  } catch (error) {
    console.error('API Proxy Error:', error);
    
    // 返回错误响应
    return new Response(
      JSON.stringify({ 
        error: 'Backend connection failed',
        message: error.message,
        details: {
          method: context.request.method,
          path: `/api/${apiPath}`,
          backend: backendUrl,
        }
      }), 
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true',
        }
      }
    );
  }
}