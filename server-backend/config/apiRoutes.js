// 后端API路由配置文件
// 与前端保持完全一致，确保路由统一性
// 
// 重要说明：
// 1. 此文件与前端 src/config/apiRoutes.js 保持同步
// 2. 所有API路由必须以 /api 开头
// 3. 修改时需要同时更新前后端配置文件
// 
// 最后更新：2025-09-03

const API_ROUTES = {
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

// 工具函数：获取路由文档
const getRouteDocumentation = () => {
  return {
    health: API_ROUTES.HEALTH,
    auth: {
      login: API_ROUTES.AUTH.LOGIN,
      register: API_ROUTES.AUTH.REGISTER,
      status: API_ROUTES.AUTH.STATUS,
      logout: API_ROUTES.AUTH.LOGOUT,
      forgotPassword: API_ROUTES.AUTH.FORGOT_PASSWORD,
      resetPassword: API_ROUTES.AUTH.RESET_PASSWORD,
      sendCode: API_ROUTES.AUTH.SEND_CODE,
      verifyCode: API_ROUTES.AUTH.VERIFY_CODE,
      google: API_ROUTES.AUTH.GOOGLE
    },
    usage: {
      check: API_ROUTES.USAGE.CHECK,
      history: API_ROUTES.USAGE.HISTORY,
      record: API_ROUTES.USAGE.RECORD
    }
  }
}

// 工具函数：验证路由是否符合规范
const validateRoute = (route) => {
  if (!route.startsWith('/api/')) {
    console.warn(`警告：路由 "${route}" 不符合规范，应以 '/api/' 开头`)
    return false
  }
  return true
}

// 开发时的路由检查
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
  
  console.log('✅ 后端路由配置检查完成')
}

module.exports = {
  API_ROUTES,
  getRouteDocumentation,
  validateRoute
}