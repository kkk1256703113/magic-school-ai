/**
 * Cloudflare Pages Functions Middleware
 * 主要功能：强制为CSS和JS文件设置正确的MIME类型
 * 解决www子域名的MIME类型问题
 * 
 * 注意：API请求现在直接由前端发送到api.magicschoolai.net
 * 不再通过Functions代理，避免403和522错误
 */

export async function onRequest(context) {
  const url = new URL(context.request.url);
  
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