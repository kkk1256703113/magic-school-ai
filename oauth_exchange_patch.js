// OAuth Exchange端点 - 用于前端通过POST请求交换token
// 添加到server.js的OAuth路由部分

// OAuth token交换端点 - 统一处理Google和GitHub
app.post('/api/auth/oauth/exchange', express.json(), async (req, res) => {
  try {
    const { code, provider } = req.body;

    console.log(`[OAuth Exchange] Processing ${provider} with code:`, code?.substring(0, 10) + '...');

    if (!code || !provider) {
      return res.status(400).json({
        success: false,
        error: 'Missing code or provider'
      });
    }

    let result;

    if (provider === 'google') {
      result = await oauthService.handleGoogleCallback(code);
    } else if (provider === 'github') {
      result = await oauthService.handleGithubCallback(code);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid provider'
      });
    }

    if (result.success) {
      console.log(`✅ ${provider} OAuth exchange successful`);
      return res.json({
        success: true,
        token: result.token,
        user: result.user
      });
    } else {
      console.error(`❌ ${provider} OAuth exchange failed:`, result.error);
      return res.status(401).json({
        success: false,
        error: result.error || 'OAuth authentication failed'
      });
    }
  } catch (error) {
    console.error('❌ OAuth exchange error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});