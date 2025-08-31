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
    saving: '保存中...',
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
    welcomeGuest: '欢迎访客',
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
    openUserMenu: '打开用户菜单',
    todayUsage: '今日使用',
    times: '次',
    upgradeAvailable: '可升级',
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
    forgotPassword: '忘记密码？',
    resetPassword: '重置密码',
    sendResetEmail: '发送重置邮件',
    sendingResetEmail: '发送中...',
    resetEmailSent: '已发送',
    resetEmailDescription: '输入您的邮箱地址，我们将发送密码重置链接给您',
    resetEmailSuccess: '密码重置邮件已发送到您的邮箱，请查收！',
    resetEmailFailed: '发送重置邮件失败',
    backToLogin: '返回登录',
    clickToReset: '忘记密码？点击重置',
    errors: {
      emailPasswordWrong: '邮箱或密码错误',
      userNotFound: '用户不存在',
      serverError: '服务器错误，请稍后重试',
      networkError: '网络连接失败，请检查网络后重试',
      genericError: '{{action}}失败，请重试',
      emailRequired: '请输入邮箱地址'
    }
  },

  // 聊天输入
  chat: {
    inputPlaceholder: '输入消息或拖放文件...',
    sendButton: '发送',
    cancelButton: '终止',
    processing: '处理中...',
    thinking: '✨ 正在分析您的内容...',
    generatingHTML: '🎨 正在为您创建交互式页面...',
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
    englishName: 'English',
    promptVersion: {
      title: 'AI 提示词版本',
      stable: '稳定版本',
      enhanced: '增强版本',
      stableDescription: '快速稳定的基础功能',
      enhancedDescription: '详细全面的高级功能'
    }
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
  },

  // 密码重置
  passwordReset: {
    title: '重置密码',
    subtitle: '设置您的新密码',
    newPassword: '新密码',
    confirmPassword: '确认新密码',
    passwordMismatch: '两次输入的密码不一致',
    passwordTooShort: '密码至少需要6位',
    resetSuccess: '密码重置成功！',
    resetFailed: '密码重置失败',
    tokenExpired: '重置链接已过期，请重新申请',
    tokenInvalid: '重置链接无效',
    submit: '重置密码',
    submitting: '重置中...',
    backToLogin: '返回登录页面'
  },

  // 个人资料
  profile: {
    title: '个人资料',
    username: '用户名',
    usernamePlaceholder: '请输入用户名',
    email: '邮箱地址',
    emailCannotChange: '邮箱地址不可修改',
    joinDate: '注册时间',
    subscriptionInfo: '订阅信息',
    loginRequired: '请先登录查看个人资料',
    notAuthenticated: '用户未认证',
    updateSuccess: '个人资料更新成功',
    updateFailed: '个人资料更新失败'
  },

  // 账户管理
  account: {
    title: '账户管理',
    security: '安全设置',
    privacy: '隐私设置',
    loginRequired: '请先登录查看账户设置',
    notAuthenticated: '用户未认证',
    accountInfo: '账户信息',
    email: '邮箱',
    lastLogin: '最后登录',
    now: '刚刚',
    changePassword: '修改密码',
    currentPassword: '当前密码',
    newPassword: '新密码',
    confirmPassword: '确认密码',
    passwordMismatch: '两次输入的密码不一致',
    passwordTooShort: '密码长度至少8位',
    passwordMatch: '密码匹配',
    passwordWeak: '弱',
    passwordFair: '一般',
    passwordGood: '良好',
    passwordStrong: '强',
    updatePassword: '更新密码',
    updating: '更新中...',
    passwordUpdateSuccess: '密码更新成功',
    passwordUpdateFailed: '密码更新失败',
    privacySettings: '隐私设置',
    privacyDescription: '我们致力于保护您的隐私和数据安全',
    dataUsage: '数据使用',
    dataUsageDescription: '我们仅使用您的数据来提供AI服务，不会用于其他目的',
    dataProtected: '您的数据受到严格保护'
  },

  // HTML内容显示
  htmlContent: {
    generatedTitle: '✨ 为您生成的交互式页面',
    pageTitle: '智能可视化页面',
    pageDescription: '根据您的内容精心制作'
  },

  // 订阅管理
  subscription: {
    title: '订阅管理',
    loginRequired: '请先登录查看订阅信息',
    currentPlan: '当前订阅',
    dailyUsage: '今日使用量',
    totalUsage: '总使用量',
    unlimited: '无限制',
    unlimitedUsage: '无限制使用',
    dailyReset: '每日凌晨重置',
    monthlyReset: '每月重置',
    upgrade: '升级',
    upgradeTitle: '升级您的订阅',
    upgradeDescription: '解锁更多AI功能和使用次数',
    upgradeComingSoon: '升级功能即将上线',
    recommended: '推荐',
    history: '订阅历史',
    activeSince: '激活时间',
    unknown: '未知',
    plans: {
      free: {
        name: '免费版',
        price: '免费'
      },
      monthly: {
        name: '月费版',
        period: '/月',
        description: '适合个人用户'
      },
      quarterly: {
        name: '季费版',
        period: '/季',
        description: '最受欢迎的选择',
        savings: '节省20%'
      },
      yearly: {
        name: '年费版',
        period: '/年',
        description: '最大价值',
        savings: '节省40%'
      }
    }
  }
}