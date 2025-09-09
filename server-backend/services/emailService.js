const { Resend } = require('resend');

// 初始化Resend客户端
const resend = new Resend(process.env.RESEND_API_KEY || 're_95n2ArCA_MH6zSMB8rvL6u6HfdASXAvmm');

/**
 * 发送验证码邮件
 * @param {string} email - 接收邮件的地址
 * @param {string} code - 6位验证码
 * @returns {Promise<{success: boolean, messageId?: string, error?: any}>}
 */
async function sendVerificationCode(email, code) {
  try {
    console.log(`[EMAIL SERVICE] Preparing to send verification code to: ${email}`);
    
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Magic School AI <magics@magicschoolai.net>',
      to: email,
      subject: `【Magic School AI】您的验证码：${code}`,
      html: `
        <!DOCTYPE html>
        <html lang="zh-CN">
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
                  让复杂变简单，让学习更高效
                </p>
              </div>
              
              <!-- 主要内容 -->
              <div style="background-color: #F3F4F6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <p style="color: #374151; font-size: 16px; margin: 0 0 15px 0;">
                  您正在登录 Magic School AI，验证码为：
                </p>
                <div style="text-align: center; margin: 20px 0;">
                  <span style="display: inline-block; background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%); color: white; font-size: 36px; font-weight: bold; letter-spacing: 10px; padding: 15px 30px; border-radius: 8px; font-family: 'Courier New', monospace;">
                    ${code}
                  </span>
                </div>
                <p style="color: #6B7280; font-size: 14px; margin: 15px 0 0 0; text-align: center;">
                  验证码5分钟内有效，请勿泄露给他人
                </p>
              </div>
              
              <!-- 安全提示 -->
              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px 16px; margin-bottom: 20px; border-radius: 4px;">
                <p style="color: #92400E; font-size: 14px; margin: 0;">
                  <strong>安全提示：</strong>如果这不是您的操作，请忽略此邮件。您的账户仍然安全。
                </p>
              </div>
              
              <!-- 页脚 -->
              <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; margin-top: 30px;">
                <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin: 0;">
                  此邮件由 Magic School AI 系统自动发送，请勿直接回复
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
      text: `Magic School AI - 您的验证码是：${code}（5分钟内有效）`
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
  sendWelcomeEmail
};