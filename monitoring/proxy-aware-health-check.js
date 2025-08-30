#!/usr/bin/env node

import http from 'http';
import https from 'https';
import fs from 'fs';

// 代理感知的健康检查配置
const HEALTH_CONFIG = {
  vpsServer: {
    host: '45.77.86.20',
    port: 3001,
    timeout: 15000
  },
  // 用户的代理配置
  proxy: {
    host: '127.0.0.1',
    port: 7890,
    enabled: true
  },
  endpoints: [
    '/api/health',
    '/auth/status', 
    '/usage/check',
    '/api/status',
    '/', // 测试根路径
    '/api', // 测试API基础路径
  ]
};

// 增强的日志记录器
class Logger {
  static log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      proxy: HEALTH_CONFIG.proxy,
      ...data
    };
    
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
    if (Object.keys(data).length > 0) {
      console.log('数据:', JSON.stringify(data, null, 2));
    }
  }
  
  static info(message, data) { this.log('info', message, data); }
  static warn(message, data) { this.log('warn', message, data); }
  static error(message, data) { this.log('error', message, data); }
  static success(message, data) { this.log('success', message, data); }
}

// 代理感知的HTTP请求工具
function makeProxyAwareRequest(options, useProxy = true) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    let requestOptions = { ...options };
    
    // 如果启用代理，修改请求配置
    if (useProxy && HEALTH_CONFIG.proxy.enabled) {
      requestOptions = {
        ...options,
        hostname: HEALTH_CONFIG.proxy.host,
        port: HEALTH_CONFIG.proxy.port,
        path: `http://${options.hostname}:${options.port}${options.path}`,
        headers: {
          ...options.headers,
          'Host': `${options.hostname}:${options.port}`,
          'Proxy-Connection': 'keep-alive'
        }
      };
    }
    
    const req = http.request(requestOptions, (res) => {
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
            success: res.statusCode >= 200 && res.statusCode < 400,
            proxyUsed: useProxy && HEALTH_CONFIG.proxy.enabled
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            duration,
            success: res.statusCode >= 200 && res.statusCode < 400,
            proxyUsed: useProxy && HEALTH_CONFIG.proxy.enabled
          });
        }
      });
    });
    
    req.on('error', (error) => {
      const duration = Date.now() - startTime;
      reject({
        error: error.message,
        duration,
        success: false,
        proxyUsed: useProxy && HEALTH_CONFIG.proxy.enabled
      });
    });
    
    req.on('timeout', () => {
      const duration = Date.now() - startTime;
      req.destroy();
      reject({
        error: 'Request timeout',
        duration,
        success: false,
        proxyUsed: useProxy && HEALTH_CONFIG.proxy.enabled
      });
    });
    
    req.setTimeout(options.timeout || 15000);
    req.end();
  });
}

// 对比测试：直连 vs 代理
async function compareDirectAndProxyAccess(host, port, path) {
  const options = {
    hostname: host,
    port: port,
    path: path,
    method: 'GET',
    timeout: HEALTH_CONFIG.vpsServer.timeout,
    headers: {
      'User-Agent': 'Magic-School-AI-Proxy-Aware-Health-Check/1.0'
    }
  };
  
  Logger.info(`对比测试端点: ${host}:${port}${path}`);
  
  const results = {
    direct: null,
    proxy: null
  };
  
  // 测试直连
  try {
    Logger.info('测试直连访问...');
    results.direct = await makeProxyAwareRequest(options, false);
    Logger.success('直连成功', {
      statusCode: results.direct.statusCode,
      duration: `${results.direct.duration}ms`
    });
  } catch (error) {
    Logger.error('直连失败', error);
    results.direct = error;
  }
  
  // 测试代理访问
  try {
    Logger.info('测试代理访问...');
    results.proxy = await makeProxyAwareRequest(options, true);
    Logger.success('代理访问成功', {
      statusCode: results.proxy.statusCode,
      duration: `${results.proxy.duration}ms`
    });
  } catch (error) {
    Logger.error('代理访问失败', error);
    results.proxy = error;
  }
  
  // 对比结果
  Logger.info('访问方式对比:', {
    直连状态: results.direct?.success ? '✅ 成功' : '❌ 失败',
    代理状态: results.proxy?.success ? '✅ 成功' : '❌ 失败',
    直连耗时: results.direct?.duration ? `${results.direct.duration}ms` : 'N/A',
    代理耗时: results.proxy?.duration ? `${results.proxy.duration}ms` : 'N/A'
  });
  
  return results;
}

// 主健康检查函数
async function runProxyAwareHealthCheck() {
  Logger.info('开始代理感知的 Magic School AI 系统健康检查...');
  Logger.info('代理配置:', HEALTH_CONFIG.proxy);
  
  const report = {
    timestamp: new Date().toISOString(),
    proxy: HEALTH_CONFIG.proxy,
    server: {
      host: HEALTH_CONFIG.vpsServer.host,
      port: HEALTH_CONFIG.vpsServer.port
    },
    endpoints: [],
    summary: {
      totalEndpoints: 0,
      directSuccessful: 0,
      proxySuccessful: 0,
      bothSuccessful: 0,
      bothFailed: 0
    }
  };
  
  try {
    // 测试所有端点
    for (const endpoint of HEALTH_CONFIG.endpoints) {
      Logger.info(`\n=== 测试端点: ${endpoint} ===`);
      
      const results = await compareDirectAndProxyAccess(
        HEALTH_CONFIG.vpsServer.host,
        HEALTH_CONFIG.vpsServer.port,
        endpoint
      );
      
      const endpointReport = {
        endpoint,
        direct: results.direct,
        proxy: results.proxy,
        comparison: {
          bothSuccessful: results.direct?.success && results.proxy?.success,
          bothFailed: !results.direct?.success && !results.proxy?.success,
          onlyDirectWorks: results.direct?.success && !results.proxy?.success,
          onlyProxyWorks: !results.direct?.success && results.proxy?.success
        }
      };
      
      report.endpoints.push(endpointReport);
      report.summary.totalEndpoints++;
      
      if (results.direct?.success) report.summary.directSuccessful++;
      if (results.proxy?.success) report.summary.proxySuccessful++;
      if (endpointReport.comparison.bothSuccessful) report.summary.bothSuccessful++;
      if (endpointReport.comparison.bothFailed) report.summary.bothFailed++;
      
      // 短暂延迟避免服务器压力
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 生成总结
    Logger.info('\n=== 检查总结 ===');
    Logger.info('访问统计:', {
      总端点数: report.summary.totalEndpoints,
      直连成功: `${report.summary.directSuccessful}/${report.summary.totalEndpoints}`,
      代理成功: `${report.summary.proxySuccessful}/${report.summary.totalEndpoints}`,
      双方成功: report.summary.bothSuccessful,
      双方失败: report.summary.bothFailed
    });
    
    // 诊断建议
    if (report.summary.bothFailed === report.summary.totalEndpoints) {
      Logger.error('🚨 严重问题：所有端点的直连和代理访问都失败！');
      Logger.error('建议：检查VPS服务器是否正在运行API服务');
    } else if (report.summary.directSuccessful > report.summary.proxySuccessful) {
      Logger.warn('⚠️  代理访问效果不如直连，可能是代理配置问题');
    } else if (report.summary.proxySuccessful > report.summary.directSuccessful) {
      Logger.info('✅ 代理访问效果更好，建议保持使用代理');
    }
    
    // 保存报告
    fs.writeFileSync(
      'proxy-aware-health-report.json',
      JSON.stringify(report, null, 2)
    );
    
    Logger.success('代理感知健康检查完成，报告已保存到 proxy-aware-health-report.json');
    
    return report;
    
  } catch (error) {
    Logger.error('代理感知健康检查执行失败', { error: error.message });
    throw error;
  }
}

// 如果直接运行此脚本
if (process.argv[1] === new URL(import.meta.url).pathname || process.argv[1].endsWith('proxy-aware-health-check.js')) {
  runProxyAwareHealthCheck()
    .then((report) => {
      // 根据结果设置退出码
      const hasIssues = report.summary.bothSuccessful === 0;
      process.exit(hasIssues ? 1 : 0);
    })
    .catch((error) => {
      console.error('健康检查失败:', error);
      process.exit(1);
    });
}

export {
  runProxyAwareHealthCheck,
  compareDirectAndProxyAccess,
  Logger
};