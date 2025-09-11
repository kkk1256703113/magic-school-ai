const fs = require('fs');
const path = require('path');

// 读取server.js
const serverPath = process.argv[2] || './server.js';
let content = fs.readFileSync(serverPath, 'utf8');

// 备份原文件
const backupPath = serverPath.replace('.js', '.backup-before-302.js');
fs.writeFileSync(backupPath, content);
console.log('Backup created:', backupPath);

// 查找Google OAuth回调路由
const googleCallbackPattern = /app\.get\('\/api\/auth\/oauth\/google\/callback'[\s\S]*?\}\);/;
const githubCallbackPattern = /app\.get\('\/api\/auth\/oauth\/github\/callback'[\s\S]*?\}\);/;

// 替换Google OAuth回调为纯302重定向
const newGoogleCallback = `app.get('/api/auth/oauth/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      console.error('❌ Google OAuth: No authorization code received');
      // 使用302重定向到错误页面
      return res.redirect(302, \`\${process.env.OAUTH_CALLBACK_DOMAIN}/?error=oauth_failed&message=No%20authorization%20code\`);
    }
    
    console.log('✅ Google OAuth: Processing callback with code:', code.substring(0, 10) + '...');
    
    const result = await oauthService.handleGoogleCallback(code);
    
    if (result.success) {
      console.log('✅ Google OAuth: Login successful, redirecting with token');
      // 直接使用302重定向到功能页面
      const redirectUrl = \`\${process.env.OAUTH_CALLBACK_DOMAIN}/app?token=\${result.token}&provider=google\`;
      console.log('Redirecting to:', redirectUrl);
      return res.redirect(302, redirectUrl);
    } else {
      console.error('❌ Google OAuth failed:', result.error);
      const errorMessage = encodeURIComponent(result.error || 'OAuth login failed');
      return res.redirect(302, \`\${process.env.OAUTH_CALLBACK_DOMAIN}/?error=oauth_failed&message=\${errorMessage}\`);
    }
  } catch (error) {
    console.error('❌ Google OAuth error:', error);
    const errorMessage = encodeURIComponent(error.message || 'OAuth processing error');
    return res.redirect(302, \`\${process.env.OAUTH_CALLBACK_DOMAIN}/?error=oauth_error&message=\${errorMessage}\`);
  }
});`;

// 替换GitHub OAuth回调为纯302重定向
const newGithubCallback = `app.get('/api/auth/oauth/github/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      console.error('❌ GitHub OAuth: No authorization code received');
      return res.redirect(302, \`\${process.env.OAUTH_CALLBACK_DOMAIN}/?error=oauth_failed&message=No%20authorization%20code\`);
    }
    
    console.log('✅ GitHub OAuth: Processing callback with code:', code.substring(0, 10) + '...');
    
    const result = await oauthService.handleGitHubCallback(code);
    
    if (result.success) {
      console.log('✅ GitHub OAuth: Login successful, redirecting with token');
      // 直接使用302重定向到功能页面
      const githubRedirectUrl = \`\${process.env.OAUTH_CALLBACK_DOMAIN}/app?token=\${result.token}&provider=github\`;
      console.log('Redirecting to:', githubRedirectUrl);
      return res.redirect(302, githubRedirectUrl);
    } else {
      console.error('❌ GitHub OAuth failed:', result.error);
      const errorMessage = encodeURIComponent(result.error || 'OAuth login failed');
      return res.redirect(302, \`\${process.env.OAUTH_CALLBACK_DOMAIN}/?error=oauth_failed&message=\${errorMessage}\`);
    }
  } catch (error) {
    console.error('❌ GitHub OAuth error:', error);
    const errorMessage = encodeURIComponent(error.message || 'OAuth processing error');
    return res.redirect(302, \`\${process.env.OAUTH_CALLBACK_DOMAIN}/?error=oauth_error&message=\${errorMessage}\`);
  }
});`;

// 替换Google OAuth回调
if (googleCallbackPattern.test(content)) {
  content = content.replace(googleCallbackPattern, newGoogleCallback);
  console.log('✅ Google OAuth callback updated to use 302 redirect');
} else {
  console.log('⚠️ Google OAuth callback pattern not found, trying alternative search...');
  // 尝试更宽松的模式
  const googleIndex = content.indexOf("app.get('/api/auth/oauth/google/callback'");
  if (googleIndex > -1) {
    // 找到结束位置
    let braceCount = 0;
    let inString = false;
    let stringChar = '';
    let endIndex = googleIndex;
    
    for (let i = googleIndex; i < content.length; i++) {
      const char = content[i];
      const prevChar = i > 0 ? content[i-1] : '';
      
      // 处理字符串
      if (!inString && (char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar && prevChar !== '\\') {
        inString = false;
      }
      
      // 计算大括号
      if (!inString) {
        if (char === '{') braceCount++;
        if (char === '}') {
          braceCount--;
          if (braceCount === 0 && i > googleIndex + 50) {
            // 找到了匹配的结束括号
            endIndex = i + 3; // 包括 });
            break;
          }
        }
      }
    }
    
    if (endIndex > googleIndex) {
      const oldCallback = content.substring(googleIndex, endIndex);
      content = content.substring(0, googleIndex) + newGoogleCallback + content.substring(endIndex);
      console.log('✅ Google OAuth callback replaced using alternative method');
    }
  }
}

// 替换GitHub OAuth回调
if (githubCallbackPattern.test(content)) {
  content = content.replace(githubCallbackPattern, newGithubCallback);
  console.log('✅ GitHub OAuth callback updated to use 302 redirect');
} else {
  console.log('⚠️ GitHub OAuth callback pattern not found, trying alternative search...');
  const githubIndex = content.indexOf("app.get('/api/auth/oauth/github/callback'");
  if (githubIndex > -1) {
    // 找到结束位置
    let braceCount = 0;
    let inString = false;
    let stringChar = '';
    let endIndex = githubIndex;
    
    for (let i = githubIndex; i < content.length; i++) {
      const char = content[i];
      const prevChar = i > 0 ? content[i-1] : '';
      
      // 处理字符串
      if (!inString && (char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar && prevChar !== '\\') {
        inString = false;
      }
      
      // 计算大括号
      if (!inString) {
        if (char === '{') braceCount++;
        if (char === '}') {
          braceCount--;
          if (braceCount === 0 && i > githubIndex + 50) {
            // 找到了匹配的结束括号
            endIndex = i + 3; // 包括 });
            break;
          }
        }
      }
    }
    
    if (endIndex > githubIndex) {
      const oldCallback = content.substring(githubIndex, endIndex);
      content = content.substring(0, githubIndex) + newGithubCallback + content.substring(endIndex);
      console.log('✅ GitHub OAuth callback replaced using alternative method');
    }
  }
}

// 写回文件
fs.writeFileSync(serverPath, content);
console.log('✅ OAuth 302 redirect fix applied successfully to:', serverPath);
console.log('\nChanges made:');
console.log('1. Google OAuth callback now uses res.redirect(302, ...) directly');
console.log('2. GitHub OAuth callback now uses res.redirect(302, ...) directly');
console.log('3. Both callbacks redirect directly to /app with token in URL');
console.log('4. No HTML or JavaScript needed - pure server-side redirect');
console.log('\nThis should bypass all CSP restrictions and automatically redirect users to /app');