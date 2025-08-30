#!/usr/bin/env node

import http from 'http';
import https from 'https';
import fs from 'fs';

// 健康检查配置
const HEALTH_CONFIG = {
  vpsServer: {
    host: '45.77.86.20',
    port: 3001,
    timeout: 10000
  },
  endpoints: [
    '/api/health',
    '/auth/status', 
    '/usage/check',
    '/api/status'
  ]
};

// 日志记录器
class Logger {
  static log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data
    };
    
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
    if (Object.keys(data).length > 0) {
      console.log('Data:', JSON.stringify(data, null, 2));
    }
  }
  
  static info(message, data) { this.log('info', message, data); }
  static warn(message, data) { this.log('warn', message, data); }
  static error(message, data) { this.log('error', message, data); }
  static success(message, data) { this.log('success', message, data); }
}

// HTTP请求工具
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const req = http.request(options, (res) => {
      const duration = Date.now() - startTime;
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedBody = body ? JSON.parse(body) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsedBody,
            duration,
            success: res.statusCode >= 200 && res.statusCode < 400
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            duration,
            success: res.statusCode >= 200 && res.statusCode < 400
          });
        }
      });
    });
    
    req.on('error', (error) => {
      const duration = Date.now() - startTime;
      reject({
        error: error.message,
        duration,
        success: false
      });
    });
    
    req.on('timeout', () => {
      const duration = Date.now() - startTime;
      req.destroy();
      reject({
        error: 'Request timeout',
        duration,
        success: false
      });
    });
    
    req.setTimeout(options.timeout || 10000);
    req.end();
  });
}

// 检查单个端点
async function checkEndpoint(host, port, path) {
  const options = {
    hostname: host,
    port: port,
    path: path,
    method: 'GET',
    timeout: HEALTH_CONFIG.vpsServer.timeout,
    headers: {
      'User-Agent': 'Magic-School-AI-Health-Check/1.0'
    }
  };
  
  try {
    Logger.info(`检查端点: ${host}:${port}${path}`);
    const result = await makeRequest(options);
    
    if (result.success) {
      Logger.success(`端点健康: ${path}`, {
        statusCode: result.statusCode,
        duration: `${result.duration}ms`
      });
    } else {
      Logger.warn(`端点异常: ${path}`, {
        statusCode: result.statusCode,
        duration: `${result.duration}ms`,
        body: result.body
      });
    }
    
    return result;
  } catch (error) {
    Logger.error(`端点失败: ${path}`, {
      error: error.error || error.message,
      duration: error.duration ? `${error.duration}ms` : 'N/A'
    });
    return error;
  }
}

// 检查服务器基本连通性
async function checkServerConnectivity() {
  Logger.info('=== 服务器连通性检查 ===');
  
  const { host, port } = HEALTH_CONFIG.vpsServer;
  
  try {
    const result = await checkEndpoint(host, port, '/');
    
    if (result.success || result.statusCode === 404) {
      Logger.success('服务器连通性正常', {
        host,
        port,
        statusCode: result.statusCode,
        duration: `${result.duration}ms`
      });
      return true;
    } else {
      Logger.error('服务器连通性异常', result);
      return false;
    }
  } catch (error) {
    Logger.error('服务器连通性检查失败', error);
    return false;
  }
}

// 检查API端点
async function checkAPIEndpoints() {
  Logger.info('=== API端点健康检查 ===');
  
  const { host, port } = HEALTH_CONFIG.vpsServer;
  const results = [];
  
  for (const endpoint of HEALTH_CONFIG.endpoints) {
    try {
      const result = await checkEndpoint(host, port, endpoint);
      results.push({
        endpoint,
        ...result
      });
      
      // 短暂延迟避免服务器压力
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      results.push({
        endpoint,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

// 检查安全配置
async function checkSecurityHeaders() {
  Logger.info('=== 安全配置检查 ===');
  
  const { host, port } = HEALTH_CONFIG.vpsServer;
  
  try {
    const result = await checkEndpoint(host, port, '/');
    const headers = result.headers || {};
    
    const securityHeaders = {
      'content-security-policy': 'CSP策略',
      'strict-transport-security': 'HSTS强制HTTPS',
      'x-frame-options': '防点击劫持',
      'x-content-type-options': '防MIME嗅探',
      'x-xss-protection': 'XSS保护'
    };
    
    Logger.info('安全头检查结果:');
    for (const [header, description] of Object.entries(securityHeaders)) {
      if (headers[header]) {
        Logger.success(`✅ ${description}: ${headers[header]}`);
      } else {
        Logger.warn(`⚠️  ${description}: 未配置`);
      }
    }
    
    return headers;
  } catch (error) {
    Logger.error('安全配置检查失败', error);
    return {};
  }
}

// 生成健康报告
function generateHealthReport(connectivityResult, apiResults, securityHeaders) {
  Logger.info('=== 健康检查报告 ===');
  
  const report = {
    timestamp: new Date().toISOString(),
    server: {
      host: HEALTH_CONFIG.vpsServer.host,
      port: HEALTH_CONFIG.vpsServer.port,
      connectivity: connectivityResult
    },
    endpoints: apiResults,
    security: {
      headersConfigured: Object.keys(securityHeaders).length,
      hasCSP: !!securityHeaders['content-security-policy'],
      hasHSTS: !!securityHeaders['strict-transport-security'],
      hasFrameOptions: !!securityHeaders['x-frame-options']
    },
    summary: {
      totalEndpoints: apiResults.length,
      healthyEndpoints: apiResults.filter(r => r.success).length,
      failedEndpoints: apiResults.filter(r => !r.success).length
    }
  };
  
  // 输出摘要
  Logger.info('检查摘要:', {
    服务器连通性: connectivityResult ? '✅ 正常' : '❌ 异常',
    健康端点: `${report.summary.healthyEndpoints}/${report.summary.totalEndpoints}`,
    安全配置: report.security.hasCSP ? '✅ 完善' : '⚠️ 需改进'
  });
  
  return report;
}

// 主健康检查函数
async function runHealthCheck() {
  Logger.info('开始 Magic School AI 系统健康检查...');
  
  try {
    // 1. 服务器连通性检查
    const connectivityResult = await checkServerConnectivity();
    
    // 2. API端点检查
    const apiResults = await checkAPIEndpoints();
    
    // 3. 安全配置检查
    const securityHeaders = await checkSecurityHeaders();
    
    // 4. 生成报告
    const report = generateHealthReport(connectivityResult, apiResults, securityHeaders);
    
    // 5. 保存报告
    fs.writeFileSync(
      'health-report.json',
      JSON.stringify(report, null, 2)
    );
    
    Logger.success('健康检查完成，报告已保存到 health-report.json');
    
    // 6. 返回退出码
    const hasIssues = !connectivityResult || report.summary.failedEndpoints > 0;
    process.exit(hasIssues ? 1 : 0);
    
  } catch (error) {
    Logger.error('健康检查执行失败', { error: error.message });
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (process.argv[1] === new URL(import.meta.url).pathname || process.argv[1].endsWith('health-check.js')) {
  runHealthCheck();
}

export {
  runHealthCheck,
  checkEndpoint,
  Logger
};