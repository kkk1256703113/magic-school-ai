const { Resend } = require('resend');

// 初始化Resend客户端
const resend = new Resend(process.env.RESEND_API_KEY || 're_95n2ArCA_MH6zSMB8rvL6u6HfdASXAvmm');

/**
 * 发送验证码邮件
 * @param {string} email - 接收邮件的地址
 * @param {string} code - 6位验证码
 * @param {string} language - 邮件语言，默认英文 ('en' | 'zh')
 * @returns {Promise<{success: boolean, messageId?: string, error?: any}>}
 */
async function sendVerificationCode(email, code, language = 'en') {
  try {
    console.log(`[EMAIL SERVICE] Preparing to send verification code to: ${email} in language: ${language}`);

    // 邮件模板配置
    const templates = {
      en: {
        subject: '【Magic School AI】Your Verification Code: ${code}',
        subtitle: 'Turn Complex Into Clear',
        greeting: 'You are logging into Magic School AI, your verification code is:',
        expiry: 'The verification code is valid for 5 minutes, please do not share it with others',
        securityTitle: 'Security Reminder:',
        securityText: 'If this was not your action, please ignore this email. Your account is still secure.',
        footer: 'This email is sent automatically by the Magic School AI system, please do not reply directly'
      },
      zh: {
        subject: '【Magic School AI】您的验证码：${code}',
        subtitle: '让复杂变简单',
        greeting: '您正在登录 Magic School AI，验证码为：',
        expiry: '验证码5分钟内有效，请勿泄露给他人',
        securityTitle: '安全提示：',
        securityText: '如果这不是您的操作，请忽略此邮件。您的账户仍然安全。',
        footer: '此邮件由 Magic School AI 系统自动发送，请勿直接回复'
      }
    };

    const template = templates[language] || templates.en;
    
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Magic School AI <magics@magicschoolai.net>',
      to: email,
      subject: template.subject.replace('${code}', code),
      html: `
        <!DOCTYPE html>
        <html lang="${language === 'zh' ? 'zh-CN' : 'en'}">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f7f7f7;">
            <div style="background-color: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Logo和标题 -->
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #4F46E5; font-size: 28px; margin: 0; font-weight: 600;">
                  Magic School AI
                </h1>
                <p style="color: #6B7280; margin-top: 8px; font-size: 14px;">
                  ${template.subtitle}
                </p>
              </div>
              
              <!-- 主要内容 -->
              <div style="background-color: #F3F4F6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <p style="color: #374151; font-size: 16px; margin: 0 0 15px 0;">
                  ${template.greeting}
                </p>
                <div style="text-align: center; margin: 20px 0;">
                  <span style="display: inline-block; background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%); color: white; font-size: 36px; font-weight: bold; letter-spacing: 10px; padding: 15px 30px; border-radius: 8px; font-family: 'Courier New', monospace;">
                    ${code}
                  </span>
                </div>
                <p style="color: #6B7280; font-size: 14px; margin: 15px 0 0 0; text-align: center;">
                  ${template.expiry}
                </p>
              </div>
              
              <!-- 安全提示 -->
              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px 16px; margin-bottom: 20px; border-radius: 4px;">
                <p style="color: #92400E; font-size: 14px; margin: 0;">
                  <strong>${template.securityTitle}</strong>${template.securityText}
                </p>
              </div>
              
              <!-- 页脚 -->
              <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; margin-top: 30px;">
                <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin: 0;">
                  ${template.footer}
                </p>
                <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin: 8px 0 0 0;">
                  © 2025 Magic School AI. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: language === 'zh' ? `Magic School AI - 您的验证码是：${code}（5分钟内有效）` : `Magic School AI - Your verification code is: ${code} (valid for 5 minutes)`
    });
    
    if (error) {
      console.error(`[EMAIL ERROR] Failed to send to ${email}:`, error);
      throw error;
    }
    
    console.log(`[EMAIL SUCCESS] Verification code sent to ${email}, MessageID: ${data?.id}`);
    return { 
      success: true, 
      messageId: data?.id,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error(`[EMAIL SERVICE ERROR] Exception while sending to ${email}:`, error);
    throw error;
  }
}

/**
 * 发送密码重置邮件
 * @param {string} email - 接收邮件的地址
 * @param {string} resetUrl - 密码重置链接
 * @param {string} language - 邮件语言，默认英文 ('en' | 'zh')
 * @returns {Promise<{success: boolean, messageId?: string, error?: any}>}
 */
async function sendPasswordResetEmail(email, resetUrl, language = 'en') {
  try {
    console.log(`[EMAIL SERVICE] Preparing to send password reset email to: ${email} in language: ${language}`);

    // 密码重置邮件模板配置
    const templates = {
      en: {
        subject: '【Magic School AI】Password Reset Link',
        subtitle: 'Turn Complex Into Clear',
        greeting: 'Hello! We have received your password reset request. Click the button below to reset your password:',
        buttonText: 'Reset My Password',
        linkInstruction: 'If the button cannot be clicked, please copy the following link to your browser:',
        importantTitle: 'Important Notice:',
        important1: 'This link will expire in 30 minutes',
        important2: 'For your account security, please do not share this link with others',
        important3: 'If this was not your action, please ignore this email, your password will not be changed',
        securityTitle: 'Security Reminder:',
        securityText: 'Magic School AI will never ask you to provide passwords or sensitive information in emails.',
        footer: 'This email is sent automatically by the Magic School AI system, please do not reply directly'
      },
      zh: {
        subject: '【Magic School AI】密码重置链接',
        subtitle: '让复杂变简单',
        greeting: '您好！我们收到了您的密码重置请求。点击下面的按钮来重置您的密码：',
        buttonText: '重置我的密码',
        linkInstruction: '如果按钮无法点击，请复制以下链接到浏览器：',
        importantTitle: '重要提示：',
        important1: '此链接将在30分钟后失效',
        important2: '为了您的账户安全，请勿与他人分享此链接',
        important3: '如果这不是您的操作，请忽略此邮件，您的密码将不会更改',
        securityTitle: '安全提示：',
        securityText: 'Magic School AI 永远不会要求您在邮件中提供密码或敏感信息。',
        footer: '此邮件由 Magic School AI 系统自动发送，请勿直接回复'
      }
    };

    const template = templates[language] || templates.en;

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Magic School AI <magics@magicschoolai.net>',
      to: email,
      subject: template.subject,
      html: `
        <!DOCTYPE html>
        <html lang="${language === 'zh' ? 'zh-CN' : 'en'}">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f7f7f7;">
            <div style="background-color: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Logo和标题 -->
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #4F46E5; font-size: 28px; margin: 0; font-weight: 600;">
                  Magic School AI
                </h1>
                <p style="color: #6B7280; margin-top: 8px; font-size: 14px;">
                  ${template.subtitle}
                </p>
              </div>
              
              <!-- 主要内容 -->
              <div style="background-color: #F3F4F6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <p style="color: #374151; font-size: 16px; margin: 0 0 15px 0;">
                  ${template.greeting}
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" 
                     style="display: inline-block; background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                    ${template.buttonText}
                  </a>
                </div>
                <p style="color: #6B7280; font-size: 12px; margin: 15px 0 0 0; text-align: center;">
                  ${template.linkInstruction}<br>
                  <a href="${resetUrl}" style="color: #4F46E5; word-break: break-all;">${resetUrl}</a>
                </p>
              </div>
              
              <!-- 重要提示 -->
              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px 16px; margin-bottom: 20px; border-radius: 4px;">
                <p style="color: #92400E; font-size: 14px; margin: 0;">
                  <strong>${template.importantTitle}</strong>
                </p>
                <ul style="color: #92400E; font-size: 14px; margin: 8px 0 0 0; padding-left: 20px;">
                  <li>${template.important1}</li>
                  <li>${template.important2}</li>
                  <li>${template.important3}</li>
                </ul>
              </div>
              
              <!-- 安全提示 -->
              <div style="background-color: #DBEAFE; border-left: 4px solid #3B82F6; padding: 12px 16px; margin-bottom: 20px; border-radius: 4px;">
                <p style="color: #1E40AF; font-size: 14px; margin: 0;">
                  <strong>${template.securityTitle}</strong>${template.securityText}
                </p>
              </div>
              
              <!-- 页脚 -->
              <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; margin-top: 30px;">
                <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin: 0;">
                  ${template.footer}
                </p>
                <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin: 8px 0 0 0;">
                  © 2025 Magic School AI. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: language === 'zh' ? `Magic School AI - 密码重置链接：${resetUrl}（30分钟内有效）` : `Magic School AI - Password reset link: ${resetUrl} (valid for 30 minutes)`
    });
    
    if (error) {
      console.error(`[EMAIL ERROR] Failed to send password reset to ${email}:`, error);
      throw error;
    }
    
    console.log(`[EMAIL SUCCESS] Password reset email sent to ${email}, MessageID: ${data?.id}`);
    return { 
      success: true, 
      messageId: data?.id,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error(`[EMAIL SERVICE ERROR] Exception while sending password reset to ${email}:`, error);
    throw error;
  }
}

/**
 * 发送欢迎邮件（可选功能）
 */
async function sendWelcomeEmail(email, username) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Magic School AI <magics@magicschoolai.net>',
      to: email,
      subject: '欢迎使用 Magic School AI',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>欢迎您，${username || '用户'}！</h2>
          <p>感谢您注册 Magic School AI。</p>
          <p>我们将为您提供最先进的AI文档处理和可视化服务。</p>
        </div>
      `
    });
    
    return { success: !error, messageId: data?.id };
  } catch (error) {
    console.error('[WELCOME EMAIL ERROR]:', error);
    return { success: false, error };
  }
}

module.exports = {
  sendVerificationCode,
  sendPasswordResetEmail,
  sendWelcomeEmail
};