export default {
  // 通用
  common: {
    appName: 'Magic School AI',
    loading: '加载中...',
    error: '错误',
    success: '成功',
    cancel: '取消',
    confirm: '确认',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    close: '关闭',
    back: '返回',
    next: '下一步',
    previous: '上一步',
    submit: '提交',
    search: '搜索',
    filter: '筛选',
    sort: '排序',
    more: '更多',
    less: '更少',
    all: '全部',
    none: '无',
    yes: '是',
    no: '否',
    ok: 'OK',
    language: '语言',
    theme: '主题',
    settings: '设置'
  },

  // 导航栏
  navbar: {
    title: 'Magic School AI',
    upgrade: '升级',
    models: {
      gpt5: 'GPT-5',
      claude4: 'Claude 4 Sonnet'
    }
  },

  // 用户菜单
  userMenu: {
    notLoggedIn: '未登录',
    loginToEnjoy: '登录以享受完整功能',
    loginOrRegister: '登录 / 注册',
    profile: '个人资料',
    accountManagement: '账户管理',
    subscriptionManagement: '订阅管理',
    language: '语言',
    logout: '退出登录',
    loggedOut: '已退出登录',
    logoutFailed: '退出登录失败',
    clickToLogin: '点击登录',
    featureInDevelopment: '{{feature}}功能开发中...',
    plans: {
      free: '免费版用户',
      monthly: '月费用户',
      yearly: '年费用户',
      default: '免费用户'
    },
    apiUsage: '今日已使用: {{count}} 次'
  },

  // 认证模态框
  auth: {
    loginTitle: '登录账号',
    registerTitle: '创建账号',
    email: '邮箱',
    emailPlaceholder: 'your@email.com',
    password: '密码',
    passwordPlaceholder: '••••••••',
    username: '用户名（可选）',
    usernamePlaceholder: '用户名',
    login: '登录',
    register: '注册',
    processing: '处理中...',
    noAccount: '还没有账号？',
    hasAccount: '已有账号？',
    signupNow: '立即注册',
    loginNow: '立即登录',
    fillEmailPassword: '请填写邮箱和密码',
    loginSuccess: '登录成功！',
    registerSuccess: '注册成功！',
    loginFailed: '登录失败',
    registerFailed: '注册失败',
    agreement: '注册即表示您同意我们的服务条款和隐私政策',
    errors: {
      emailPasswordWrong: '邮箱或密码错误',
      userNotFound: '用户不存在',
      serverError: '服务器错误，请稍后重试',
      networkError: '网络连接失败，请检查网络后重试',
      genericError: '{{action}}失败，请重试'
    }
  },

  // 聊天输入
  chat: {
    inputPlaceholder: '输入消息或拖放文件...',
    sendButton: '发送',
    cancelButton: '终止',
    processing: '处理中...',
    thinking: '正在分析中...',
    generatingHTML: '🎨 正在生成可视化HTML页面...',
    processCancelled: '处理已被终止',
    loginRequired: {
      title: '🔐 **需要登录才能使用AI功能**',
      description: '请先登录您的账号以使用AI分析功能：',
      existingUser: '✅ **已注册用户**: 点击右上角头像登录',
      newUser: '🆕 **新用户**: 点击右上角头像快速注册',
      featuresTitle: '登录后即可享受：',
      features: {
        ai: '🤖 GPT-5 和 Claude 4 智能分析',
        visualization: '📊 数据可视化生成',
        pdf: '📄 PDF文档解析',
        html: '🎨 HTML页面生成'
      }
    },
    apiMissing: {
      title: '❌ **API配置缺失**',
      description: '需要配置Replicate API Token才能使用AI功能：',
      step1: '**步骤1**: 在项目根目录创建 `.env.local` 文件',
      step2: '**步骤2**: 添加以下内容：',
      codeSnippet: 'VITE_REPLICATE_API_TOKEN=你的API密钥',
      getApiKey: '**获取API密钥**: 访问 https://replicate.com/account',
      completion: '配置完成后刷新页面即可使用完整功能！'
    },
    errors: {
      userNotLoggedIn: '用户未登录，无法使用API功能',
      apiLimitCheckerNotConfigured: 'API使用限制检查器未配置',
      apiLimitReached: 'API调用次数已达上限，剩余次数：{{remaining}}',
      processingError: '抱歉，处理过程中出现错误：{{error}}',
      unknownError: '未知错误'
    }
  },

  // 侧边栏
  sidebar: {
    newChat: '新建对话',
    chatHistory: '历史记录',
    noHistory: '暂无历史记录',
    settings: '设置',
    themeSettings: '主题设置',
    lightMode: '浅色模式',
    darkMode: '深色模式',
    languageSettings: '语言设置',
    chineseName: '简体中文',
    englishName: 'English'
  },

  // 升级模态框
  upgrade: {
    title: '升级您的账户',
    currentPlan: '当前计划',
    choosePlan: '选择一个计划以继续',
    monthly: '月付',
    yearly: '年付',
    save: '节省 {{percent}}%',
    features: '功能特性',
    unlimited: '无限制',
    limited: '{{count}} 次/天',
    choosePlanButton: '选择此计划',
    plans: {
      free: {
        name: '免费版',
        price: '￥0',
        features: {
          apiCalls: '10 次 API 调用/天',
          basicFeatures: '基础功能',
          communitySupport: '社区支持'
        }
      },
      pro: {
        name: '专业版',
        price: '￥99',
        priceYearly: '￥990',
        features: {
          apiCalls: '1000 次 API 调用/天',
          advancedFeatures: '高级功能',
          prioritySupport: '优先支持',
          customization: '自定义选项'
        }
      },
      enterprise: {
        name: '企业版',
        price: '联系销售',
        features: {
          apiCalls: '无限制 API 调用',
          allFeatures: '所有功能',
          dedicatedSupport: '专属支持团队',
          sla: 'SLA 保证',
          customIntegration: '定制集成'
        }
      }
    }
  },

  // PDF处理
  pdf: {
    processing: 'PDF处理中...',
    extracting: '正在提取PDF内容...',
    fileName: 'PDF文件: {{name}}',
    pageCount: '页数: {{count}}',
    title: '标题: {{title}}',
    author: '作者: {{author}}',
    processingMethod: '处理方式: {{method}}',
    processingMethods: {
      api: 'iLovePDF API (高精度)',
      local: 'PDF.js (快速处理)'
    },
    content: '内容:',
    attachmentContent: '附件内容：',
    analyzeContent: '请分析以下PDF内容：',
    processingFailed: 'PDF处理失败'
  },

  // 消息状态
  messageStatus: {
    sending: '发送中',
    sent: '已发送',
    thinking: '思考中',
    generating: '生成中',
    complete: '完成',
    error: '错误',
    cancelled: '已取消'
  }
}