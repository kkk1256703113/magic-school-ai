/**
 * API配置文件
 * 根据环境自动选择API基础URL
 */

// 获取API基础URL
export const getAPIBaseURL = (): string => {
  // 生产环境使用Functions代理（通过Nginx反向代理解决端口访问问题）
  if (import.meta.env.PROD) {
    // 使用空字符串，让API调用走当前域名的/api路径，通过Functions代理到后端
    return ''
  }
  
  // 开发环境使用本地代理
  return ''
}

// 构建完整的API URL
export const buildAPIURL = (path: string): string => {
  const baseURL = getAPIBaseURL()
  // 如果基础URL为空（开发环境），直接返回路径
  if (!baseURL) {
    return path
  }
  // 生产环境，拼接基础URL和路径
  return `${baseURL}${path}`
}

// 配置axios默认设置
export const configureAxios = (axios: any): void => {
  const baseURL = getAPIBaseURL()
  if (baseURL) {
    axios.defaults.baseURL = baseURL
  }
  
  // 设置通用请求头
  axios.defaults.headers.common['Content-Type'] = 'application/json'
  
  // 添加请求拦截器
  axios.interceptors.request.use(
    (config: any) => {
      // 添加时间戳防止缓存
      if (config.method === 'get') {
        config.params = {
          ...config.params,
          _t: Date.now()
        }
      }
      return config
    },
    (error: any) => {
      return Promise.reject(error)
    }
  )
  
  // 添加响应拦截器
  axios.interceptors.response.use(
    (response: any) => {
      return response
    },
    (error: any) => {
      // 统一错误处理
      if (error.response) {
        // 服务器返回错误
        console.error('API Error:', error.response.status, error.response.data)

        // 处理401认证错误
        if (error.response.status === 401) {
          // 清除无效的token
          localStorage.removeItem('token')
          delete axios.defaults.headers.common['Authorization']

          // 如果不是在登录页，跳转到首页让用户重新登录
          if (!window.location.pathname.includes('/welcome') &&
              !window.location.pathname.includes('/') &&
              !window.location.pathname.includes('/reset-password')) {
            // 发送自定义事件通知token失效
            window.dispatchEvent(new CustomEvent('tokenExpired', {
              detail: { message: 'Session expired. Please login again.' }
            }))
          }
        }
      } else if (error.request) {
        // 请求发送失败
        console.error('Network Error:', error.message)
      }
      return Promise.reject(error)
    }
  )
}