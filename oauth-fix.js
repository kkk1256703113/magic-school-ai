const fs = require('fs');
const path = require('path');

// 读取server.js
const serverPath = process.argv[2] || './server.js';
let content = fs.readFileSync(serverPath, 'utf8');

// 替换Google OAuth回调的重定向
const googleRedirectPattern = /res\.status\(302\)\.redirect\(redirectUrl\);/;
if (googleRedirectPattern.test(content)) {
    content = content.replace(
        googleRedirectPattern,
        `// 使用客户端JavaScript重定向
        res.status(200).send(\`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
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
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <h2>Login Successful!</h2>
        <p>Redirecting to application...</p>
    </div>
    <script>
        // 立即重定向到应用
        setTimeout(() => {
            window.location.replace('\${redirectUrl}');
        }, 100);
    </script>
</body>
</html>
        \`);`
    );
    console.log('Fixed Google OAuth redirect');
}

// 替换GitHub OAuth回调的重定向
const githubRedirectPattern = /res\.status\(302\)\.redirect\(`\${process\.env\.OAUTH_CALLBACK_DOMAIN}\/app\?token=\${result\.token}&provider=github`\);/;
if (githubRedirectPattern.test(content)) {
    content = content.replace(
        githubRedirectPattern,
        `// 使用客户端JavaScript重定向
        const githubRedirectUrl = \`\${process.env.OAUTH_CALLBACK_DOMAIN}/app?token=\${result.token}&provider=github\`;
        res.status(200).send(\`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
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
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <h2>Login Successful!</h2>
        <p>Redirecting to application...</p>
    </div>
    <script>
        // 立即重定向到应用
        setTimeout(() => {
            window.location.replace('\${githubRedirectUrl}');
        }, 100);
    </script>
</body>
</html>
        \`);`
    );
    console.log('Fixed GitHub OAuth redirect');
}

// 写回文件
fs.writeFileSync(serverPath, content);
console.log('OAuth redirect fix applied successfully to:', serverPath);