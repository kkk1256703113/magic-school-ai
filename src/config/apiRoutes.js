// API路由配置文件
// 统一管理所有API端点，确保前后端路由一致性
// 
// 重要说明：
// 1. 所有API路由必须以 /api 开头
// 2. 新增路由时请在此文件中添加，避免硬编码
// 3. 前后端都应该引用此配置文件
// 
// 最后更新：2025-09-03

export const API_ROUTES = {
  // 基础路由
  BASE: '/api',
  HEALTH: '/api/health',
  STATUS: '/api/status',

  // 认证相关路由
  AUTH: {
    // 基本认证
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    STATUS: '/api/auth/status',
    LOGOUT: '/api/auth/logout',
    
    // 密码管理
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    
    // 验证码功能
    SEND_CODE: '/api/auth/send-code',
    VERIFY_CODE: '/api/auth/verify-code',
    
    // OAuth登录
    GOOGLE: '/api/auth/google',
  },

  // 使用量管理路由
  USAGE: {
    CHECK: '/api/usage/check',
    RECORD: '/api/usage/record',
    HISTORY: '/api/usage/history',
  },

  // Replicate API代理（如果需要）
  REPLICATE: {
    BASE: '/api/replicate',
  }
}

// 导出路由配置的TypeScript类型定义（如果需要）
export const API_ROUTE_TYPES = {
  AUTH: Object.keys(API_ROUTES.AUTH),
  USAGE: Object.keys(API_ROUTES.USAGE),
}

// 工具函数：根据环境获取完整URL
export const getFullApiUrl = (route, baseUrl = '') => {
  if (typeof window !== 'undefined' && !baseUrl) {
    // 浏览器环境，使用当前origin
    baseUrl = window.location.origin
  }
  return `${baseUrl}${route}`
}

// 工具函数：验证路由是否符合规范
export const validateRoute = (route) => {
  if (!route.startsWith('/api/')) {
    console.warn(`警告：路由 "${route}" 不符合规范，应以 '/api/' 开头`)
    return false
  }
  return true
}

// 开发时的路由检查（仅在开发环境生效）
if (process.env.NODE_ENV === 'development') {
  const allRoutes = [
    ...Object.values(API_ROUTES.AUTH),
    ...Object.values(API_ROUTES.USAGE),
    API_ROUTES.HEALTH,
    API_ROUTES.STATUS,
  ]
  
  allRoutes.forEach(route => {
    if (!validateRoute(route)) {
      console.error(`错误：发现不符合规范的路由 "${route}"`)
    }
  })
}