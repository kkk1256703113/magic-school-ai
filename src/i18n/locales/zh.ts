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
    upgrade: '订阅',
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
    proBadge: '专业版',
    plans: {
      free: '免费版用户',
      monthly: '月费用户',
      yearly: '年费用户',
      default: '免费用户'
    },
    memberSince: '注册时间',
    registrationDate: '注册日期',
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
    inputPlaceholder: '向 MagicS 提问...',
    sendButton: '发送',
    cancelButton: '终止',
    uploadFile: '上传文件',
    sendMessage: '发送消息',
    cancelProcessing: '终止处理',
    supportedFormats: '支持 TXT, MD, PDF, CSV, JSON, HTML, Word, Excel · Enter 发送 · Shift+Enter 换行',
    dragDropHint: '拖拽文件到这里上传',
    processing: '处理中...',
    thinking: '✨ 正在分析您的内容...',
    generatingHTML: '🎨 正在为您创建交互式页面...',
    processCancelled: '✋ 处理已被您终止',
    processCancelling: '⏹️ 正在为您终止处理...',
    processCancelledBackup: '✋ AI处理已终止',
    cancelDebugSuccess: '取消反馈已更新',
    cancelDebugWarning: '消息引用为空，使用备用反馈',
    cancelling: '正在终止...',
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

  // API额度友好提示信息
  apiLimit: {
    noCreditsTitle: '🎉 免费次数已用完',
    noCreditsMessage: '您的免费AI分析次数已经用完啦！',
    noCreditsMessageWithRemaining: '您还剩余 {{remaining}} 次免费使用机会，要珍惜哦！',
    upgradePrompt: '💎 充值后立即解锁更多次数，继续您的AI创作之旅！',
    upgradeButton: '立即充值解锁',
    paymentError: '💳 支付处理暂时不可用，请稍后重试。',
    authError: '🔐 身份验证失败，请重新登录后继续。',
    networkError: '🌐 网络连接异常，请检查网络后重试。',
    serverError: '⚠️ AI服务暂时不可用，请稍后重试。',
    contactSupport: '💬 需要帮助？联系我们的客服团队获取协助。',
    processingFailed: '⚡ AI处理失败，这可能是临时问题，请重试。',
    configError: '⚙️ 服务配置错误，请刷新页面后重试。',
    retryPrompt: '您可以重试，或者充值更多次数来继续使用我们的AI功能。',
    helpText: '每次充值获得的额度可用于AI分析，永不过期，支持所有AI模型。'
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

  // 订阅模态框
  upgrade: {
    title: '选择订阅套餐',
    recommended: '推荐',
    choosePlan: '选择此套餐',
    paymentMethods: '支持支付宝、微信支付、银行卡 · 随时可取消订阅',
    kofi: {
      title: '支持我们，获得更多API调用次数',
      donationRewards: '捐赠奖励',
      reward1: '💰 每捐赠$1 = 2次永久API调用',
      reward2: '⭐ 积分永不过期',
      reward3: '🎁 大额捐赠享受额外奖励',
      newUserPolicy: '新用户福利',
      newUser1: '🆓 新用户免费5次调用',
      newUser2: '🎯 付费前测试所有功能',
      newUser3: '💎 随时升级获得更多次数',
      donation: '捐赠',
      apiCalls: 'API调用次数',
      bonus: '奖励',
      perCall: '次',
      supportButton: '支持',
      popular: '热门',
      bestValue: '最优惠',
      important: '重要',
      useEmail: '请使用注册邮箱',
      forAutoCredit: '以便自动到账',
      visitPage: '访问我们的Ko-fi页面',
      processingNote: '支付处理后积分将自动添加（通常1分钟内）'
    },
    plans: {
      monthly: {
        name: '月会员',
        price: '¥29',
        period: '/月',
        description: '按月订阅，灵活便捷',
        features: [
          '无限制对话次数',
          '优先访问新功能',
          '24/7 客户支持'
        ]
      },
      quarterly: {
        name: '季会员',
        price: '¥69',
        period: '/3个月',
        description: '3个月套餐，省20%',
        savings: '节省¥18',
        features: [
          '月会员所有功能',
          '专属客服通道',
          '高级模型优先体验'
        ]
      },
      yearly: {
        name: '年会员',
        price: '¥199',
        period: '/年',
        description: '12个月套餐，省40%',
        savings: '节省¥149',
        features: [
          '季会员所有功能',
          '专属定制服务',
          '年度功能路线图预览'
        ]
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
    userId: '用户ID',
    userIdTip: '用于技术支持和问题反馈',
    subscriptionInfo: '订阅信息',
    loginRequired: '请先登录查看个人资料',
    notAuthenticated: '用户未认证',
    updateSuccess: '个人资料更新成功',
    updateFailed: '个人资料更新失败'
  },

  // API使用量
  usage: {
    title: 'API使用量',
    available: '可用',
    apiCalls: '剩余API调用次数',
    welcomeBonus: '欢迎奖励！',
    newUserGift: '您有5次免费API调用机会来体验我们的服务',
    lowBalance: '余额不足',
    considerRecharge: '建议充值获得更多次数',
    noCredits: '没有积分',
    needRecharge: '充值以继续使用服务',
    addCredits: '充值'
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
    statusTitle: 'API使用统计',
    loginRequired: '请先登录查看订阅信息',
    currentPlan: '当前订阅',
    remainingCalls: '剩余调用次数',
    times: '次',
    addCredits: '充值更多次数',
    usageStats: '使用统计',
    dailyUsage: '今日使用量',
    todayUsed: '今日已用',
    totalUsage: '总使用量',
    totalUsed: '累计使用',
    accountInfo: '账户信息',
    userId: '用户ID',
    email: '邮箱',
    accountType: '账户类型',
    planType: '计划类型',
    newUser: '新用户',
    regularUser: '常规用户',
    lastUpdate: '最后更新',
    newUserTip: '新用户享有5次免费API调用，用完后可通过充值获得更多次数。',
    noCreditsWarning: '您的API调用次数已用完，请充值以继续使用服务。',
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
    // 历史记录相关
    rechargeHistory: '充值历史',
    usageHistory: '使用历史',
    currentAvailable: '当前可用额度',
    loading: '加载中...',
    noRechargeHistory: '暂无充值记录',
    noUsageHistory: '暂无使用记录',
    credits: '次',
    amount: '金额',
    date: '日期',
    action: '操作',
    model: '模型',
    consumed: '消耗',
    zeroBalanceWarning: '当前余额为0，请充值后继续使用AI功能',
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
  },

  // 宣传页
  landing: {
    hero: {
      description: 'AI 驱动的文档可视化平台，让复杂变简单',
      cta: '免费开始',
      ctaSubtitle: '新用户5次免费',
      demo: '查看演示',
      secure: '数据安全',
      fast: '快速处理',
      multilingual: '多语言支持'
    },
    features: {
      title: '核心优势',
      subtitle: '强大的 AI 技术，简单的使用体验',
      ai: {
        title: '双 AI 模型',
        description: 'GPT-5 + Claude 4 协同工作'
      },
      format: {
        title: '全格式支持',
        description: 'PDF、Word、Markdown 等主流格式'
      },
      output: {
        title: '专业输出',
        description: '一键生成精美 HTML 作品集'
      },
      quick: {
        title: '即刻使用',
        description: '30秒注册，立即体验'
      }
    },
    demo: {
      title: '看看 Magic School AI 能做什么',
      subtitle: '真实案例，真实效果',
      before: '原始文档',
      after: 'AI 转换后',
      academic: {
        title: '学术论文',
        description: '将复杂公式转为互动图表'
      },
      business: {
        title: '商业报告',
        description: '数据可视化，一目了然'
      },
      education: {
        title: '教学材料',
        description: '让知识更生动有趣'
      }
    },
    pricing: {
      title: '选择适合你的方案',
      subtitle: '透明定价，无隐藏费用',
      guarantee: '30 天退款保证 · 随时可以取消 · 安全支付',
      free: {
        name: '免费版',
        price: '¥0',
        feature1: '新用户5次尝试',
        feature2: '基础文档格式',
        feature3: '标准处理速度',
        feature4: '社区支持',
        cta: '立即体验'
      },
      monthly: {
        name: '月度会员',
        price: '¥29',
        period: '/月',
        badge: '最受欢迎',
        feature1: '无限次转换',
        feature2: '所有文档格式',
        feature3: '优先处理',
        feature4: '专属客服',
        feature5: '高级模板',
        cta: '开始免费试用'
      },
      yearly: {
        name: '年度会员',
        price: '¥199',
        period: '/年',
        badge: '省40%',
        feature1: '月度会员所有权益',
        feature2: 'API 访问权限',
        feature3: '批量处理',
        feature4: '定制服务',
        feature5: '优先体验新功能',
        cta: '开始免费试用'
      }
    },
    trust: {
      title: '为什么选择 Magic School AI',
      subtitle: '值得信赖的 AI 文档处理平台',
      security: {
        title: '数据安全',
        description: '端到端加密，您的文档绝对安全'
      },
      speed: {
        title: '处理速度',
        description: '平均 10 秒完成文档转换'
      },
      accuracy: {
        title: '精准转换',
        description: '98% 的用户满意度'
      },
      support: {
        title: '专业支持',
        description: '7×24 小时客服支持'
      },
      stats: {
        users: '活跃用户',
        documents: '文档已处理',
        satisfaction: '满意度'
      }
    },
    cta: {
      title: '准备好提升你的文档体验了吗？',
      subtitle: '加入数千位用户，让 AI 帮你把复杂变简单',
      button: '立即免费开始',
      feature1: '30秒快速注册',
      feature2: '新用户5次免费',
      feature3: '随时可以升级',
      feature4: '立即体验双 AI 能力'
    }
  }
}
