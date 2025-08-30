/**
 * 用户密码保护系统
 * 严格防止未授权的密码修改
 * 创建时间：2025-08-29
 * 
 * 重要：真实用户密码只能由用户本人修改！
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 数据库连接
const pool = new Pool({
    user: process.env.DB_USER || 'eduvisualizer_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'eduvisualizer_db',
    password: process.env.DB_PASS || 'EduViz2025Secure',
    port: process.env.DB_PORT || 5432,
});

// 测试账户白名单（只有这些账户可以被管理员重置）
const TEST_ACCOUNTS = [
    'admin@eduvisualizer.com',
    'free@test.com',
    'monthly@test.com',
    'yearly@test.com',
    'test@example.com'
];

// 审计日志目录
const AUDIT_LOG_DIR = path.join(__dirname, 'audit-logs');
if (!fs.existsSync(AUDIT_LOG_DIR)) {
    fs.mkdirSync(AUDIT_LOG_DIR, { recursive: true });
}

class UserProtectionService {
    /**
     * 检查是否为测试账户
     */
    static isTestAccount(email) {
        return TEST_ACCOUNTS.includes(email.toLowerCase());
    }

    /**
     * 记录审计日志
     */
    static async logAudit(action, details) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            action,
            ...details,
            severity: details.severity || 'INFO'
        };

        // 写入审计日志文件
        const logFile = path.join(AUDIT_LOG_DIR, `audit-${new Date().toISOString().split('T')[0]}.log`);
        fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');

        // 如果是严重事件，同时记录到数据库
        if (details.severity === 'CRITICAL' || details.severity === 'WARNING') {
            try {
                await pool.query(
                    `INSERT INTO audit_logs (action, email, operator, details, severity, created_at) 
                     VALUES ($1, $2, $3, $4, $5, NOW())`,
                    [action, details.email, details.operator || 'SYSTEM', JSON.stringify(details), details.severity]
                );
            } catch (error) {
                console.error('Failed to log to database:', error);
            }
        }

        console.log(`[AUDIT] ${timestamp} - ${action}:`, details);
    }

    /**
     * 安全的密码重置功能
     * @param {string} email - 用户邮箱
     * @param {string} newPassword - 新密码
     * @param {object} operator - 操作者信息
     * @returns {Promise<object>} 操作结果
     */
    static async resetPassword(email, newPassword, operator = {}) {
        try {
            // 1. 检查用户是否存在
            const userResult = await pool.query(
                'SELECT id, email, username, plan_type FROM users WHERE email = $1',
                [email]
            );

            if (userResult.rows.length === 0) {
                await this.logAudit('PASSWORD_RESET_FAILED', {
                    email,
                    reason: 'User not found',
                    operator: operator.email || 'UNKNOWN',
                    severity: 'WARNING'
                });
                return { success: false, error: '用户不存在' };
            }

            const user = userResult.rows[0];

            // 2. 检查是否为真实用户
            if (!this.isTestAccount(email)) {
                // 真实用户密码不能被管理员重置
                if (operator.role !== 'SELF' && operator.email !== email) {
                    await this.logAudit('PASSWORD_RESET_BLOCKED', {
                        email,
                        operator: operator.email || 'ADMIN',
                        reason: 'Cannot reset real user password',
                        severity: 'CRITICAL'
                    });
                    return { 
                        success: false, 
                        error: '安全限制：真实用户密码只能由用户本人重置' 
                    };
                }
            }

            // 3. 验证新密码强度
            if (newPassword.length < 6) {
                return { success: false, error: '密码长度至少6位' };
            }

            // 4. 加密新密码
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(newPassword, salt);

            // 5. 更新密码
            const updateResult = await pool.query(
                `UPDATE users 
                 SET password_hash = $1, 
                     password_updated_at = NOW(),
                     password_update_count = COALESCE(password_update_count, 0) + 1
                 WHERE email = $2 
                 RETURNING id, email`,
                [passwordHash, email]
            );

            if (updateResult.rows.length > 0) {
                // 6. 记录成功的审计日志
                await this.logAudit('PASSWORD_RESET_SUCCESS', {
                    email,
                    userId: user.id,
                    operator: operator.email || 'SYSTEM',
                    isTestAccount: this.isTestAccount(email),
                    severity: 'INFO'
                });

                // 7. 如果是真实用户，发送通知（这里只是模拟）
                if (!this.isTestAccount(email)) {
                    await this.sendPasswordChangeNotification(email, operator);
                }

                return { 
                    success: true, 
                    message: '密码重置成功',
                    isTestAccount: this.isTestAccount(email)
                };
            }

            return { success: false, error: '密码更新失败' };

        } catch (error) {
            await this.logAudit('PASSWORD_RESET_ERROR', {
                email,
                error: error.message,
                operator: operator.email || 'UNKNOWN',
                severity: 'ERROR'
            });
            throw error;
        }
    }

    /**
     * 发送密码变更通知
     */
    static async sendPasswordChangeNotification(email, operator) {
        const notification = {
            to: email,
            subject: '您的密码已被修改',
            message: `您的账户密码已于 ${new Date().toLocaleString('zh-CN')} 被修改。
                     操作者: ${operator.email === email ? '您本人' : '管理员'}
                     如果这不是您的操作，请立即联系管理员。`,
            timestamp: new Date().toISOString()
        };

        // 记录通知（实际应发送邮件）
        await this.logAudit('PASSWORD_CHANGE_NOTIFICATION', {
            email,
            notificationType: 'EMAIL',
            severity: 'INFO'
        });

        console.log('Password change notification:', notification);
        return notification;
    }

    /**
     * 获取用户密码修改历史
     */
    static async getPasswordHistory(email) {
        try {
            const result = await pool.query(
                `SELECT password_updated_at, password_update_count 
                 FROM users WHERE email = $1`,
                [email]
            );

            if (result.rows.length > 0) {
                return {
                    lastUpdated: result.rows[0].password_updated_at,
                    updateCount: result.rows[0].password_update_count || 0
                };
            }
            return null;
        } catch (error) {
            console.error('Failed to get password history:', error);
            return null;
        }
    }

    /**
     * 批量重置测试账户密码
     */
    static async resetTestAccountsPasswords(newPassword = 'Test123456', operator = {}) {
        const results = [];
        
        for (const email of TEST_ACCOUNTS) {
            const result = await this.resetPassword(email, newPassword, operator);
            results.push({
                email,
                ...result
            });
        }

        await this.logAudit('BATCH_PASSWORD_RESET', {
            accounts: TEST_ACCOUNTS,
            operator: operator.email || 'ADMIN',
            results,
            severity: 'INFO'
        });

        return results;
    }

    /**
     * 创建数据库审计表（如果不存在）
     */
    static async createAuditTable() {
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id SERIAL PRIMARY KEY,
                    action VARCHAR(100) NOT NULL,
                    email VARCHAR(255),
                    operator VARCHAR(255),
                    details JSONB,
                    severity VARCHAR(20),
                    created_at TIMESTAMP DEFAULT NOW()
                );
                
                CREATE INDEX IF NOT EXISTS idx_audit_logs_email ON audit_logs(email);
                CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
            `);

            // 添加密码更新字段到users表
            await pool.query(`
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMP,
                ADD COLUMN IF NOT EXISTS password_update_count INTEGER DEFAULT 0;
            `);

            console.log('Audit system initialized successfully');
        } catch (error) {
            console.error('Failed to create audit table:', error);
        }
    }
}

// 导出服务
module.exports = UserProtectionService;

// 如果直接运行此文件，初始化审计系统
if (require.main === module) {
    (async () => {
        console.log('Initializing User Protection System...');
        await UserProtectionService.createAuditTable();
        
        // 仅重置测试账户密码
        console.log('\n重置测试账户密码...');
        const results = await UserProtectionService.resetTestAccountsPasswords('Test123456', {
            email: 'ADMIN',
            role: 'ADMIN'
        });
        
        console.log('\n重置结果:');
        results.forEach(r => {
            console.log(`- ${r.email}: ${r.success ? '✅ 成功' : '❌ 失败'} ${r.error || ''}`);
        });

        console.log('\n⚠️  重要提醒：真实用户密码未被修改，需要用户自行重置');
        
        await pool.end();
    })();
}