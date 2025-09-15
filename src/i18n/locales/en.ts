export default {
  // Common
  common: {
    appName: 'Magic School AI',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    saving: 'Saving...',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    submit: 'Submit',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    more: 'More',
    less: 'Less',
    all: 'All',
    none: 'None',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    language: 'Language',
    theme: 'Theme',
    settings: 'Settings'
  },

  // Navigation Bar
  navbar: {
    title: 'Magic School AI',
    upgrade: 'Subscribe',
    models: {
      gpt5: 'GPT-5',
      claude4: 'Claude 4 Sonnet'
    }
  },

  // User Menu
  userMenu: {
    notLoggedIn: 'Not Logged In',
    welcomeGuest: 'Welcome Guest',
    loginToEnjoy: 'Sign in to unlock all features',
    loginOrRegister: 'Sign In / Sign Up',
    profile: 'Profile',
    accountManagement: 'Account Settings',
    subscriptionManagement: 'Subscription',
    language: 'Language',
    logout: 'Sign Out',
    loggedOut: 'Successfully signed out',
    logoutFailed: 'Failed to sign out',
    clickToLogin: 'Click to sign in',
    openUserMenu: 'Open user menu',
    todayUsage: 'Today used',
    times: 'times',
    upgradeAvailable: 'Upgrade available',
    featureInDevelopment: '{{feature}} coming soon...',
    plans: {
      free: 'Free Plan',
      monthly: 'Monthly Plan',
      yearly: 'Annual Plan',
      default: 'Free User'
    },
    apiUsage: 'Used today: {{count}} calls'
  },

  // Authentication Modal
  auth: {
    loginTitle: 'Sign In',
    registerTitle: 'Create Account',
    email: 'Email',
    emailPlaceholder: 'your@email.com',
    password: 'Password',
    passwordPlaceholder: '••••••••',
    username: 'Username (optional)',
    usernamePlaceholder: 'Username',
    login: 'Sign In',
    register: 'Sign Up',
    processing: 'Processing...',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    signupNow: 'Sign up now',
    loginNow: 'Sign in now',
    fillEmailPassword: 'Please enter your email and password',
    loginSuccess: 'Welcome back!',
    registerSuccess: 'Account created successfully!',
    loginFailed: 'Sign in failed',
    registerFailed: 'Registration failed',
    agreement: 'By signing up, you agree to our Terms of Service and Privacy Policy',
    forgotPassword: 'Forgot password?',
    resetPassword: 'Reset Password',
    sendResetEmail: 'Send Reset Email',
    sendingResetEmail: 'Sending...',
    resetEmailSent: 'Sent',
    resetEmailDescription: 'Enter your email address and we will send you a password reset link',
    resetEmailSuccess: 'Password reset email has been sent to your inbox. Please check your email!',
    resetEmailFailed: 'Failed to send reset email',
    backToLogin: 'Back to Login',
    clickToReset: 'Forgot password? Click to reset',
    errors: {
      emailPasswordWrong: 'Invalid email or password',
      userNotFound: 'User not found',
      serverError: 'Server error. Please try again later',
      networkError: 'Connection failed. Please check your network',
      genericError: '{{action}} failed. Please try again',
      emailRequired: 'Please enter your email address'
    }
  },

  // Chat Input
  chat: {
    inputPlaceholder: 'Ask MagicS anything...',
    sendButton: 'Send',
    cancelButton: 'Stop',
    uploadFile: 'Upload file',
    sendMessage: 'Send message',
    cancelProcessing: 'Cancel processing',
    supportedFormats: 'Supports TXT, MD, PDF, CSV, JSON, HTML, Word, Excel · Enter to send · Shift+Enter for new line',
    dragDropHint: 'Drop files here to upload',
    processing: 'Processing...',
    thinking: '✨ Analyzing your content...',
    generatingHTML: '🎨 Creating interactive page for you...',
    processCancelled: '✋ Process cancelled by you',
    processCancelling: '⏹️ Stopping process for you...',
    processCancelledBackup: '✋ AI processing stopped',
    cancelDebugSuccess: 'Cancel feedback updated',
    cancelDebugWarning: 'Message ref is empty, using backup feedback',
    cancelling: 'Cancelling...',
    loginRequired: {
      title: '🔐 **Sign In Required**',
      description: 'Please sign in to use AI features:',
      existingUser: '✅ **Existing user**: Click the profile icon to sign in',
      newUser: '🆕 **New user**: Click the profile icon to create an account',
      featuresTitle: 'After signing in, enjoy:',
      features: {
        ai: '🤖 GPT-5 and Claude 4 AI analysis',
        visualization: '📊 Data visualization generation',
        pdf: '📄 PDF document parsing',
        html: '🎨 HTML page generation'
      }
    },
    apiMissing: {
      title: '❌ **API Configuration Missing**',
      description: 'Replicate API Token required for AI features:',
      step1: '**Step 1**: Create `.env.local` file in project root',
      step2: '**Step 2**: Add the following:',
      codeSnippet: 'VITE_REPLICATE_API_TOKEN=your-api-key',
      getApiKey: '**Get API Key**: Visit https://replicate.com/account',
      completion: 'Refresh the page after configuration!'
    },
    errors: {
      userNotLoggedIn: 'Please sign in to use API features',
      apiLimitCheckerNotConfigured: 'API limit checker not configured',
      apiLimitReached: 'API call limit reached. Remaining: {{remaining}}',
      processingError: 'Sorry, an error occurred: {{error}}',
      unknownError: 'Unknown error'
    }
  },

  // Sidebar
  sidebar: {
    newChat: 'New Chat',
    chatHistory: 'History',
    noHistory: 'No history yet',
    settings: 'Settings',
    themeSettings: 'Theme',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    languageSettings: 'Language',
    chineseName: '简体中文',
    englishName: 'English',
    promptVersion: {
      title: 'AI Prompt Version',
      stable: 'Stable',
      enhanced: 'Enhanced',
      stableDescription: 'Fast & stable basic features',
      enhancedDescription: 'Detailed & comprehensive advanced features'
    }
  },

  // Subscription Modal
  upgrade: {
    title: 'Choose Subscription Plan',
    recommended: 'Recommended',
    choosePlan: 'Choose This Plan',
    paymentMethods: 'Supports Alipay, WeChat Pay, Credit Card · Cancel anytime',
    kofi: {
      title: 'Support Us & Get More API Calls',
      donationRewards: 'Donation Rewards',
      reward1: '💰 Every $1 = 2 permanent API calls',
      reward2: '⭐ Credits never expire',
      reward3: '🎁 Bonus credits for larger donations',
      newUserPolicy: 'New User Benefits',
      newUser1: '🆓 5 free calls for new users',
      newUser2: '🎯 Test all features before paying',
      newUser3: '💎 Upgrade anytime for more calls',
      donation: 'Donation',
      apiCalls: 'API Calls',
      bonus: 'bonus',
      perCall: 'call',
      supportButton: 'Support',
      popular: 'Popular',
      bestValue: 'Best Value',
      important: 'Important',
      useEmail: 'Please use your registered email',
      forAutoCredit: 'for automatic credit',
      visitPage: 'Visit our Ko-fi page',
      processingNote: 'Credits are added automatically after payment processing (usually within 1 minute)'
    },
    plans: {
      monthly: {
        name: 'Monthly',
        price: '$4.99',
        period: '/month',
        description: 'Monthly subscription, flexible and convenient',
        features: [
          'Unlimited conversations',
          'Priority access to new features',
          '24/7 customer support'
        ]
      },
      quarterly: {
        name: 'Quarterly',
        price: '$11.99',
        period: '/3 months',
        description: '3-month plan, save 20%',
        savings: 'Save $3',
        features: [
          'All monthly features',
          'Dedicated support channel',
          'Priority access to advanced models'
        ]
      },
      yearly: {
        name: 'Yearly',
        price: '$34.99',
        period: '/year',
        description: '12-month plan, save 40%',
        savings: 'Save $25',
        features: [
          'All quarterly features',
          'Custom support services',
          'Annual feature roadmap preview'
        ]
      }
    }
  },

  // PDF Processing
  pdf: {
    processing: 'Processing PDF...',
    extracting: 'Extracting PDF content...',
    fileName: 'PDF File: {{name}}',
    pageCount: 'Pages: {{count}}',
    title: 'Title: {{title}}',
    author: 'Author: {{author}}',
    processingMethod: 'Processing: {{method}}',
    processingMethods: {
      api: 'iLovePDF API (High Precision)',
      local: 'PDF.js (Fast Processing)'
    },
    content: 'Content:',
    attachmentContent: 'Attachment content:',
    analyzeContent: 'Please analyze the following PDF content:',
    processingFailed: 'PDF processing failed'
  },

  // Message Status
  messageStatus: {
    sending: 'Sending',
    sent: 'Sent',
    thinking: 'Thinking',
    generating: 'Generating',
    complete: 'Complete',
    error: 'Error',
    cancelled: 'Cancelled'
  },

  // Password Reset
  passwordReset: {
    title: 'Reset Password',
    subtitle: 'Set your new password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm New Password',
    passwordMismatch: 'Passwords do not match',
    passwordTooShort: 'Password must be at least 6 characters',
    resetSuccess: 'Password reset successfully!',
    resetFailed: 'Password reset failed',
    tokenExpired: 'Reset link has expired. Please request a new one',
    tokenInvalid: 'Invalid reset link',
    submit: 'Reset Password',
    submitting: 'Resetting...',
    backToLogin: 'Back to Login'
  },

  // Profile
  profile: {
    title: 'Profile',
    username: 'Username',
    usernamePlaceholder: 'Enter username',
    email: 'Email Address',
    emailCannotChange: 'Email address cannot be changed',
    joinDate: 'Join Date',
    subscriptionInfo: 'Subscription Info',
    loginRequired: 'Please sign in to view your profile',
    notAuthenticated: 'User not authenticated',
    updateSuccess: 'Profile updated successfully',
    updateFailed: 'Failed to update profile'
  },

  // API Usage
  usage: {
    title: 'API Usage',
    available: 'Available',
    apiCalls: 'API calls remaining',
    welcomeBonus: 'Welcome Bonus!',
    newUserGift: 'You have 5 free API calls to try our service',
    lowBalance: 'Low Balance',
    considerRecharge: 'Consider adding more credits',
    noCredits: 'No Credits',
    needRecharge: 'Add credits to continue using the service',
    addCredits: 'Add Credits'
  },

  // Account Management
  account: {
    title: 'Account Management',
    security: 'Security',
    privacy: 'Privacy',
    loginRequired: 'Please sign in to view account settings',
    notAuthenticated: 'User not authenticated',
    accountInfo: 'Account Information',
    email: 'Email',
    lastLogin: 'Last Login',
    now: 'Just now',
    changePassword: 'Change Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    passwordMismatch: 'Passwords do not match',
    passwordTooShort: 'Password must be at least 8 characters',
    passwordMatch: 'Passwords match',
    passwordWeak: 'Weak',
    passwordFair: 'Fair',
    passwordGood: 'Good',
    passwordStrong: 'Strong',
    updatePassword: 'Update Password',
    updating: 'Updating...',
    passwordUpdateSuccess: 'Password updated successfully',
    passwordUpdateFailed: 'Failed to update password',
    privacySettings: 'Privacy Settings',
    privacyDescription: 'We are committed to protecting your privacy and data security',
    dataUsage: 'Data Usage',
    dataUsageDescription: 'We only use your data to provide AI services, not for other purposes',
    dataProtected: 'Your data is strictly protected'
  },

  // HTML Content Display
  htmlContent: {
    generatedTitle: '✨ Interactive page created for you',
    pageTitle: 'AI-Generated Visualization',
    pageDescription: 'Crafted based on your content'
  },

  // Subscription Management
  subscription: {
    title: 'Subscription Management',
    statusTitle: 'API Usage Statistics',
    loginRequired: 'Please sign in to view subscription information',
    currentPlan: 'Current Plan',
    remainingCalls: 'Remaining API Calls',
    times: 'calls',
    addCredits: 'Add More Credits',
    usageStats: 'Usage Statistics',
    dailyUsage: 'Daily Usage',
    todayUsed: 'Today Used',
    totalUsage: 'Total Usage',
    totalUsed: 'Total Used',
    accountInfo: 'Account Information',
    email: 'Email',
    accountType: 'Account Type',
    newUser: 'New User',
    regularUser: 'Regular User',
    lastUpdate: 'Last Update',
    newUserTip: 'New users get 5 free API calls to try our service. Top up for more calls after using them.',
    noCreditsWarning: 'Your API calls have been used up. Please top up to continue using the service.',
    unlimited: 'Unlimited',
    unlimitedUsage: 'Unlimited Usage',
    dailyReset: 'Resets daily at midnight',
    monthlyReset: 'Resets monthly',
    upgrade: 'Upgrade',
    upgradeTitle: 'Upgrade Your Subscription',
    upgradeDescription: 'Unlock more AI features and usage limits',
    upgradeComingSoon: 'Upgrade feature coming soon',
    recommended: 'Recommended',
    history: 'Subscription History',
    activeSince: 'Active Since',
    unknown: 'Unknown',
    plans: {
      free: {
        name: 'Free Plan',
        price: 'Free'
      },
      monthly: {
        name: 'Monthly Plan',
        period: '/month',
        description: 'Perfect for individuals'
      },
      quarterly: {
        name: 'Quarterly Plan',
        period: '/quarter',
        description: 'Most popular choice',
        savings: 'Save 20%'
      },
      yearly: {
        name: 'Yearly Plan',
        period: '/year',
        description: 'Best value',
        savings: 'Save 40%'
      }
    }
  },

  // Landing Page
  landing: {
    hero: {
      description: 'AI-powered document visualization platform that makes complexity simple',
      cta: 'Start Free',
      ctaSubtitle: 'Daily free quota',
      demo: 'View Demo',
      secure: 'Data Security',
      fast: 'Fast Processing',
      multilingual: 'Multi-language Support'
    },
    features: {
      title: 'Core Advantages',
      subtitle: 'Powerful AI technology, simple user experience',
      ai: {
        title: 'Dual AI Models',
        description: 'GPT-5 + Claude 4 working together'
      },
      format: {
        title: 'All Format Support',
        description: 'PDF, Word, Markdown and more'
      },
      output: {
        title: 'Professional Output',
        description: 'One-click beautiful HTML portfolio'
      },
      quick: {
        title: 'Instant Use',
        description: '30-second signup, immediate experience'
      }
    },
    demo: {
      title: 'See What Magic School AI Can Do',
      subtitle: 'Real cases, real results',
      before: 'Original Document',
      after: 'After AI Conversion',
      academic: {
        title: 'Academic Papers',
        description: 'Transform complex formulas into interactive charts'
      },
      business: {
        title: 'Business Reports',
        description: 'Data visualization at a glance'
      },
      education: {
        title: 'Teaching Materials',
        description: 'Make knowledge more engaging'
      }
    },
    pricing: {
      title: 'Choose Your Plan',
      subtitle: 'Transparent pricing, no hidden fees',
      guarantee: '30-day money back guarantee · Cancel anytime · Secure payment',
      free: {
        name: 'Free',
        price: '$0',
        feature1: '2 conversions per day',
        feature2: 'Basic document formats',
        feature3: 'Standard processing speed',
        feature4: 'Community support',
        cta: 'Get Started'
      },
      monthly: {
        name: 'Monthly',
        price: '$4.99',
        period: '/month',
        badge: 'Most Popular',
        feature1: 'Unlimited conversions',
        feature2: 'All document formats',
        feature3: 'Priority processing',
        feature4: 'Dedicated support',
        feature5: 'Premium templates',
        cta: 'Start Free Trial'
      },
      yearly: {
        name: 'Yearly',
        price: '$34.99',
        period: '/year',
        badge: 'Save 40%',
        feature1: 'All monthly features',
        feature2: 'API access',
        feature3: 'Batch processing',
        feature4: 'Custom services',
        feature5: 'Early access to new features',
        cta: 'Start Free Trial'
      }
    },
    trust: {
      title: 'Why Choose Magic School AI',
      subtitle: 'Trusted AI document processing platform',
      security: {
        title: 'Data Security',
        description: 'End-to-end encryption, your documents are absolutely safe'
      },
      speed: {
        title: 'Processing Speed',
        description: 'Average 10 seconds to complete conversion'
      },
      accuracy: {
        title: 'Accurate Conversion',
        description: '98% user satisfaction'
      },
      support: {
        title: 'Professional Support',
        description: '24/7 customer support'
      },
      stats: {
        users: 'Active Users',
        documents: 'Documents Processed',
        satisfaction: 'Satisfaction Rate'
      }
    },
    cta: {
      title: 'Ready to Transform Your Document Experience?',
      subtitle: 'Join thousands of users, let AI help you simplify complexity',
      button: 'Start Free Now',
      feature1: '30-second quick signup',
      feature2: 'Daily free quota',
      feature3: 'Upgrade anytime',
      feature4: 'Experience dual AI power now'
    }
  }
}