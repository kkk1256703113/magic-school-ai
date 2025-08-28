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
    upgrade: 'Upgrade',
    models: {
      gpt5: 'GPT-5',
      claude4: 'Claude 4 Sonnet'
    }
  },

  // User Menu
  userMenu: {
    notLoggedIn: 'Not Logged In',
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
    errors: {
      emailPasswordWrong: 'Invalid email or password',
      userNotFound: 'User not found',
      serverError: 'Server error. Please try again later',
      networkError: 'Connection failed. Please check your network',
      genericError: '{{action}} failed. Please try again'
    }
  },

  // Chat Input
  chat: {
    inputPlaceholder: 'Type a message or drop files here...',
    sendButton: 'Send',
    cancelButton: 'Stop',
    processing: 'Processing...',
    thinking: 'Analyzing...',
    generatingHTML: '🎨 Creating visualization...',
    processCancelled: 'Process stopped',
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
    englishName: 'English'
  },

  // Upgrade Modal
  upgrade: {
    title: 'Upgrade Your Account',
    currentPlan: 'Current Plan',
    choosePlan: 'Choose a plan to continue',
    monthly: 'Monthly',
    yearly: 'Yearly',
    save: 'Save {{percent}}%',
    features: 'Features',
    unlimited: 'Unlimited',
    limited: '{{count}}/day',
    choosePlanButton: 'Choose This Plan',
    plans: {
      free: {
        name: 'Free',
        price: '$0',
        features: {
          apiCalls: '10 API calls/day',
          basicFeatures: 'Basic features',
          communitySupport: 'Community support'
        }
      },
      pro: {
        name: 'Pro',
        price: '$14.99',
        priceYearly: '$149.90',
        features: {
          apiCalls: '1,000 API calls/day',
          advancedFeatures: 'Advanced features',
          prioritySupport: 'Priority support',
          customization: 'Customization options'
        }
      },
      enterprise: {
        name: 'Enterprise',
        price: 'Contact Sales',
        features: {
          apiCalls: 'Unlimited API calls',
          allFeatures: 'All features',
          dedicatedSupport: 'Dedicated support team',
          sla: 'SLA guarantee',
          customIntegration: 'Custom integrations'
        }
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
  }
}