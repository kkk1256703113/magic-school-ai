const fs = require('fs');
const path = require('path');

// 读取server.js
const serverPath = process.argv[2] || './server.js';
let content = fs.readFileSync(serverPath, 'utf8');

// 替换Google OAuth回调的重定向 - 使用meta标签而不是JavaScript
const googleRedirectPattern = /res\.status\(200\)\.send\(`[\s\S]*?`\);/g;

// 查找Google OAuth回调部分
const googleCallbackIndex = content.indexOf('app.get(\'/api/auth/oauth/google/callback\'');
const githubCallbackIndex = content.indexOf('app.get(\'/api/auth/oauth/github/callback\'');

if (googleCallbackIndex > -1) {
    // 找到Google OAuth回调的重定向部分
    const beforeGithub = content.substring(0, githubCallbackIndex);
    const afterGoogle = content.substring(googleCallbackIndex);
    
    // 替换Google重定向逻辑
    const updatedAfterGoogle = afterGoogle.replace(
        /res\.status\(200\)\.send\(`[\s\S]*?`\);/,
        `// 使用meta标签重定向，避免CSP问题
        res.status(200).send(\`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0;url=\${redirectUrl}">
    <title>Login Successful</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        h2 { color: #333; margin: 1rem 0; }
        p { color: #666; }
        a { color: #667eea; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <h2>Login Successful!</h2>
        <p>Redirecting to application...</p>
        <p>If you are not redirected, <a href="\${redirectUrl}">click here</a></p>
    </div>
</body>
</html>
        \`);`
    );
    
    content = beforeGithub + updatedAfterGoogle;
}

// 对GitHub OAuth回调做同样的修改
if (content.includes('app.get(\'/api/auth/oauth/github/callback\'')) {
    // 查找GitHub重定向部分
    const githubPattern = /const githubRedirectUrl = `[\s\S]*?res\.status\(200\)\.send\(`[\s\S]*?`\);/;
    
    content = content.replace(
        githubPattern,
        `// 使用meta标签重定向，避免CSP问题
        const githubRedirectUrl = \`\${process.env.OAUTH_CALLBACK_DOMAIN}/app?token=\${result.token}&provider=github\`;
        res.status(200).send(\`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0;url=\${githubRedirectUrl}">
    <title>Login Successful</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #333 0%, #000 100%);
        }
        .container {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #333;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        h2 { color: #333; margin: 1rem 0; }
        p { color: #666; }
        a { color: #333; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <h2>Login Successful!</h2>
        <p>Redirecting to application...</p>
        <p>If you are not redirected, <a href="\${githubRedirectUrl}">click here</a></p>
    </div>
</body>
</html>
        \`);`
    );
}

// 写回文件
fs.writeFileSync(serverPath, content);
console.log('OAuth CSP fix applied successfully to:', serverPath);