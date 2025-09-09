const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { API_ROUTES, getRouteDocumentation } = require('./config/apiRoutes');
const { sendVerificationCode, sendPasswordResetEmail } = require('./services/emailService');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// 数据库连接池
const pool = new Pool({
    user: process.env.DB_USER || 'eduvisualizer_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'eduvisualizer_db',
    password: process.env.DB_PASS || 'EduViz2025Secure',
    port: process.env.DB_PORT || 5432,
});

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 开发模式
const DEV_MODE = process.env.DEV_MODE === 'true';
const MOCK_VERIFICATION_CODE = process.env.MOCK_VERIFICATION_CODE || '123456';
const MOCK_GOOGLE_EMAIL = process.env.MOCK_GOOGLE_EMAIL || 'test@gmail.com';
const MOCK_GOOGLE_USER = process.env.MOCK_GOOGLE_USER || '测试用户';

// 存储验证码（生产环境应使用Redis）
// 格式: email -> { code, timestamp, expires, lastSent }
const verificationCodes = new Map();

// 中间件配置
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            baseSrc: ["'self'"],
            fontSrc: ["'self'", "https:", "data:"],
            formAction: ["'self'"],
            frameAncestors: ["'self'"],
            imgSrc: ["'self'", "data:"],
            objectSrc: ["'none'"],
            scriptSrc: ["'self'"],
            scriptSrcAttr: ["'none'"],
            styleSrc: ["'self'", "https:", "'unsafe-inline'"],
            upgradeInsecureRequests: []
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true
    }
}));

app.use(cors({
    origin: function(origin, callback) {
        // 允许的源列表
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://45.77.86.20',
            'https://eduvisualizer.com',
            'https://magic-school-ai.com'
        ];
        
        // 如果没有origin（比如Postman）或origin在允许列表中
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, true); // 暂时允许所有源，生产环境应该更严格
        }
    },
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 速率限制配置
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 限制100个请求
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            error: 'Too many requests',
            message: 'Please try again later'
        });
    }
});

app.use(limiter);

// 日志中间件
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ==================== API路由 ====================

// 健康检查
app.get('/api/health', async (req, res) => {
    try {
        // 测试数据库连接
        const dbCheck = await pool.query('SELECT NOW()');
        
        res.json({
            status: 'healthy',
            service: 'Magic School AI API',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: {
                connected: true,
                time: dbCheck.rows[0].now
            }
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            service: 'Magic School AI API',
            error: 'Database connection failed',
            message: error.message
        });
    }
});

// API状态
app.get('/api/status', (req, res) => {
    res.json({
        api: 'Magic School AI Backend',
        version: '1.0.0',
        status: 'operational',
        features: {
            authentication: true,
            database: true,
            rateLimit: true,
            cors: true
        },
        endpoints: getRouteDocumentation()
    });
});

// ==================== 认证路由 ====================

// 登录
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                error: 'Missing credentials',
                message: 'Email and password are required'
            });
        }
        
        // 查询用户
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: '邮箱或密码错误'
            });
        }
        
        const user = result.rows[0];
        
        // 验证密码
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: '邮箱或密码错误'
            });
        }
        
        // 生成JWT
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email,
                plan: user.plan_type 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        // 更新最后登录时间
        await pool.query(
            'UPDATE users SET last_login = NOW() WHERE id = $1',
            [user.id]
        );
        
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                plan: user.plan_type,
                apiCallsToday: user.api_calls_today || 0,
                apiCallsRemaining: user.plan_type === 'free' ? 10 - (user.api_calls_today || 0) : 1000
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Server error',
            message: '登录失败，请稍后再试'
        });
    }
});

// 注册
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, username } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Email and password are required'
            });
        }
        
        // 检查用户是否已存在
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );
        
        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                error: 'User exists',
                message: '该邮箱已被注册'
            });
        }
        
        // 哈希密码
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        
        // 创建用户
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, username, plan_type, api_calls_today, created_at) 
             VALUES ($1, $2, $3, $4, $5, NOW()) 
             RETURNING id, email, username, plan_type`,
            [email, passwordHash, username || email.split('@')[0], 'free', 0]
        );
        
        const newUser = result.rows[0];
        
        // 生成JWT
        const token = jwt.sign(
            { 
                id: newUser.id, 
                email: newUser.email,
                plan: newUser.plan_type 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.status(201).json({
            success: true,
            token,
            user: {
                id: newUser.id,
                email: newUser.email,
                username: newUser.username,
                plan: newUser.plan_type,
                apiCallsToday: 0,
                apiCallsRemaining: 10
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: 'Server error',
            message: '注册失败，请稍后再试'
        });
    }
});

// 认证状态
app.get('/api/auth/status', async (req, res) => {
    try {
        // 从header获取token
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.json({
                authenticated: false,
                message: 'No token provided'
            });
        }
        
        const token = authHeader.substring(7);
        
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            
            // 获取用户信息
            const result = await pool.query(
                'SELECT id, email, username, plan_type, api_calls_today FROM users WHERE id = $1',
                [decoded.id]
            );
            
            if (result.rows.length === 0) {
                return res.json({
                    authenticated: false,
                    message: 'User not found'
                });
            }
            
            const user = result.rows[0];
            
            res.json({
                authenticated: true,
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    plan: user.plan_type,
                    apiCallsToday: user.api_calls_today || 0,
                    apiCallsRemaining: user.plan_type === 'free' ? 10 - (user.api_calls_today || 0) : 1000
                }
            });
        } catch (error) {
            res.json({
                authenticated: false,
                message: 'Invalid token'
            });
        }
    } catch (error) {
        console.error('Auth status error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to check authentication status'
        });
    }
});

// 登出
app.post('/api/auth/logout', (req, res) => {
    // JWT是无状态的，客户端只需删除token即可
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// 忘记密码 - 发送验证码
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                error: 'Missing email',
                message: '请提供邮箱地址'
            });
        }
        
        // 邮箱格式验证
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email',
                message: '请提供有效的邮箱地址'
            });
        }
        
        // 检查用户是否存在
        const result = await pool.query(
            'SELECT id, email FROM users WHERE email = $1',
            [email]
        );
        
        // 无论用户是否存在，都返回成功（安全考虑，不透露用户是否存在）
        if (result.rows.length === 0) {
            console.log(`Password reset requested for non-existent user: ${email}`);
            return res.json({
                success: true,
                message: '如果该邮箱已注册，您将收到验证码'
            });
        }
        
        // 频率限制检查（60秒内只能发送一次）
        const rateLimitKey = `forgot_password_${email}`;
        if (rateLimitStore[rateLimitKey] && Date.now() - rateLimitStore[rateLimitKey] < 60000) {
            const waitTime = Math.ceil((60000 - (Date.now() - rateLimitStore[rateLimitKey])) / 1000);
            return res.status(429).json({
                error: 'Rate limit exceeded',
                message: `请等待 ${waitTime} 秒后再试`,
                waitTime
            });
        }
        
        // 生成6位验证码
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟后过期
        
        // 存储验证码（用于密码重置）
        const resetCodeKey = `reset_${email}`;
        verificationCodes.set(resetCodeKey, {
            code,
            email,
            expiresAt,
            attempts: 0
        });
        
        // 设置清理定时器
        setTimeout(() => {
            verificationCodes.delete(resetCodeKey);
            console.log(`[CLEANUP] Reset code for ${email} expired and removed`);
        }, 5 * 60 * 1000);
        
        // 记录频率限制
        rateLimitStore[rateLimitKey] = Date.now();
        
        // 发送验证码邮件
        try {
            const emailResult = await sendVerificationCode(email, code);
            console.log(`[RESET CODE] Email sent successfully to ${email}, MessageID: ${emailResult.messageId}`);
            console.log(`[SUCCESS] Reset code sent to ${email}, expires at ${expiresAt.toISOString()}`);
        } catch (emailError) {
            console.error(`[RESET CODE] Failed to send email to ${email}:`, emailError);
            // 即使邮件发送失败，也返回成功响应（安全考虑）
        }
        
        res.json({
            success: true,
            message: '验证码已发送到您的邮箱'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            error: 'Server error',
            message: '发送验证码失败，请稍后再试'
        });
    }
});

// 重置密码
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { email, code, password } = req.body;
        
        if (!email || !code || !password) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: '请填写所有必要字段'
            });
        }
        
        if (password.length < 6) {
            return res.status(400).json({
                error: 'Password too short',
                message: '密码至少需要6位'
            });
        }
        
        // 检查验证码
        const resetCodeKey = `reset_${email}`;
        const storedCodeInfo = verificationCodes.get(resetCodeKey);
        
        if (!storedCodeInfo) {
            return res.status(400).json({
                error: 'Code not found',
                message: '验证码不存在或已过期'
            });
        }
        
        // 检查验证码是否过期
        if (new Date() > storedCodeInfo.expiresAt) {
            verificationCodes.delete(resetCodeKey);
            return res.status(400).json({
                error: 'Code expired',
                message: '验证码已过期'
            });
        }
        
        // 检查尝试次数（最多5次）
        if (storedCodeInfo.attempts >= 5) {
            verificationCodes.delete(resetCodeKey);
            return res.status(400).json({
                error: 'Too many attempts',
                message: '验证次数过多，请重新获取验证码'
            });
        }
        
        // 验证码不正确
        if (storedCodeInfo.code !== code) {
            storedCodeInfo.attempts++;
            return res.status(400).json({
                error: 'Invalid code',
                message: '验证码不正确'
            });
        }
        
        // 检查用户是否存在
        const userResult = await pool.query(
            'SELECT id, email FROM users WHERE email = $1',
            [email]
        );
        
        if (userResult.rows.length === 0) {
            verificationCodes.delete(resetCodeKey);
            return res.status(400).json({
                error: 'User not found',
                message: '用户不存在'
            });
        }
        
        const user = userResult.rows[0];
        
        // 哈希新密码
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        
        // 更新密码
        await pool.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [passwordHash, user.id]
        );
        
        // 删除已使用的验证码
        verificationCodes.delete(resetCodeKey);
        
        console.log(`Password reset successful for user: ${user.email}`);
        
        res.json({
            success: true,
            message: '密码重置成功'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            error: 'Server error',
            message: '密码重置失败，请稍后再试'
        });
    }
});

// ==================== 验证码和OAuth API ====================

// 发送验证码
app.post('/api/auth/send-code', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                error: 'Missing email',
                message: '请提供邮箱地址'
            });
        }
        
        // 邮箱格式验证
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email',
                message: '请提供有效的邮箱地址'
            });
        }
        
        // 频率限制检查（60秒内只能发送一次）
        const existingCode = verificationCodes.get(email);
        if (existingCode && existingCode.lastSent) {
            const timeSinceLastSent = Date.now() - existingCode.lastSent;
            if (timeSinceLastSent < 60000) { // 60秒
                const waitTime = Math.ceil((60000 - timeSinceLastSent) / 1000);
                return res.status(429).json({
                    error: 'Too many requests',
                    message: `请等待 ${waitTime} 秒后再试`,
                    waitTime
                });
            }
        }
        
        // 生成6位随机验证码
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const timestamp = Date.now();
        const expires = timestamp + 5 * 60 * 1000; // 5分钟后过期
        
        // 发送真实邮件
        try {
            console.log(`[EMAIL] Sending verification code to ${email}`);
            const emailResult = await sendVerificationCode(email, code);
            console.log(`[EMAIL] Send result:`, emailResult);
            
            // 存储验证码信息
            verificationCodes.set(email, {
                code,
                timestamp,
                expires,
                lastSent: timestamp,
                messageId: emailResult.messageId
            });
            
            // 5分钟后自动删除
            setTimeout(() => {
                const stored = verificationCodes.get(email);
                if (stored && stored.code === code) {
                    verificationCodes.delete(email);
                    console.log(`[CLEANUP] Verification code for ${email} expired and removed`);
                }
            }, 5 * 60 * 1000);
            
            console.log(`[SUCCESS] Verification code sent to ${email}, expires at ${new Date(expires).toISOString()}`);
            
            res.json({
                success: true,
                message: '验证码已发送到您的邮箱，请注意查收',
                expiresIn: 300 // 5分钟（秒）
            });
            
        } catch (emailError) {
            console.error(`[EMAIL ERROR] Failed to send to ${email}:`, emailError);
            
            // 邮件发送失败时的降级处理（仅在开发环境）
            if (process.env.NODE_ENV === 'development') {
                console.log(`[FALLBACK] Verification code for ${email}: ${code}`);
                verificationCodes.set(email, {
                    code,
                    timestamp,
                    expires,
                    lastSent: timestamp
                });
                
                return res.json({
                    success: true,
                    message: '验证码发送失败，已在控制台输出（开发模式）',
                    devMode: true
                });
            }
            
            return res.status(500).json({
                error: 'Email service error',
                message: '邮件发送失败，请稍后重试'
            });
        }
        
    } catch (error) {
        console.error('[SEND CODE ERROR]:', error);
        res.status(500).json({
            error: 'Server error',
            message: '发送验证码失败'
        });
    }
});

// 验证验证码
app.post('/api/auth/verify-code', async (req, res) => {
    try {
        const { email, code } = req.body;
        
        if (!email || !code) {
            return res.status(400).json({
                error: 'Missing fields',
                message: '请提供邮箱和验证码'
            });
        }
        
        const storedData = verificationCodes.get(email);
        
        if (!storedData) {
            console.log(`[VERIFY] No verification code found for ${email}`);
            return res.json({
                success: false,
                message: '验证码不存在，请重新发送'
            });
        }
        
        // 检查是否过期
        if (Date.now() > storedData.expires) {
            console.log(`[VERIFY] Verification code expired for ${email}`);
            verificationCodes.delete(email);
            return res.json({
                success: false,
                message: '验证码已过期，请重新发送'
            });
        }
        
        // 验证码匹配检查
        if (storedData.code === code) {
            console.log(`[VERIFY SUCCESS] Verification successful for ${email}`);
            
            // 验证成功，删除验证码
            verificationCodes.delete(email);
            
            // 生成JWT token（如果需要自动登录）
            const token = jwt.sign(
                { email, type: 'email_verification' },
                JWT_SECRET,
                { expiresIn: '7d' }
            );
            
            return res.json({
                success: true,
                message: '验证成功',
                token, // 返回token以便前端自动登录
                user: { email }
            });
        }
        
        console.log(`[VERIFY FAILED] Wrong code for ${email}: provided ${code}, expected ${storedData.code}`);
        res.json({
            success: false,
            message: '验证码错误'
        });
    } catch (error) {
        console.error('[VERIFY CODE ERROR]:', error);
        res.status(500).json({
            error: 'Server error',
            message: '验证失败'
        });
    }
});

// Google OAuth登录
app.post('/api/auth/google', async (req, res) => {
    try {
        if (DEV_MODE) {
            // 开发模式：模拟Google登录
            console.log(`[DEV MODE] 模拟Google登录: ${MOCK_GOOGLE_EMAIL}`);
            
            // 检查用户是否存在
            let result = await pool.query(
                'SELECT * FROM users WHERE email = $1',
                [MOCK_GOOGLE_EMAIL]
            );
            
            let user;
            if (result.rows.length === 0) {
                // 创建新用户
                const createResult = await pool.query(
                    `INSERT INTO users (email, username, plan_type, api_calls_today, created_at) 
                     VALUES ($1, $2, $3, $4, NOW()) 
                     RETURNING id, email, username, plan_type, api_calls_today`,
                    [MOCK_GOOGLE_EMAIL, MOCK_GOOGLE_USER, 'free', 0]
                );
                user = createResult.rows[0];
            } else {
                user = result.rows[0];
            }
            
            // 生成JWT
            const token = jwt.sign(
                { 
                    id: user.id, 
                    email: user.email,
                    plan: user.plan_type 
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            return res.json({
                success: true,
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    plan: user.plan_type,
                    apiCallsToday: user.api_calls_today || 0,
                    apiCallsRemaining: user.plan_type === 'free' ? 10 - (user.api_calls_today || 0) : 1000
                }
            });
        }
        
        // 生产模式：真实Google OAuth验证
        // TODO: 实现真实的Google OAuth验证
        res.status(501).json({
            error: 'Not implemented',
            message: 'Google OAuth尚未在生产环境实现'
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Google登录失败'
        });
    }
});

// ==================== 使用量路由 ====================

// 检查使用量
app.get('/api/usage/check', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.json({
                apiCallsRemaining: 0,
                apiCallsToday: 0,
                plan: 'none',
                message: 'Authentication required'
            });
        }
        
        const token = authHeader.substring(7);
        
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            
            const result = await pool.query(
                'SELECT plan_type, api_calls_today FROM users WHERE id = $1',
                [decoded.id]
            );
            
            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: 'User not found'
                });
            }
            
            const user = result.rows[0];
            const limits = {
                free: 10,
                monthly: 1000,
                quarterly: 3000,
                yearly: 10000
            };
            
            const limit = limits[user.plan_type] || 10;
            const used = user.api_calls_today || 0;
            
            res.json({
                plan: user.plan_type,
                apiCallsToday: used,
                apiCallsRemaining: Math.max(0, limit - used),
                dailyLimit: limit,
                resetTime: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
            });
        } catch (error) {
            res.status(401).json({
                error: 'Invalid token',
                message: 'Please login again'
            });
        }
    } catch (error) {
        console.error('Usage check error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to check usage'
        });
    }
});

// 使用历史
app.get('/api/usage/history', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }
        
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // 这里应该有一个usage_history表，暂时返回模拟数据
        res.json({
            userId: decoded.id,
            history: [
                {
                    date: new Date().toISOString(),
                    calls: 5,
                    plan: 'free'
                }
            ]
        });
    } catch (error) {
        console.error('Usage history error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to get usage history'
        });
    }
});

// 记录API使用
app.post('/api/usage/record', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }
        
        const token = authHeader.substring(7);
        
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const { endpoint, model, cost, success } = req.body;
            
            // 更新用户的API调用次数
            await pool.query(
                'UPDATE users SET api_calls_today = api_calls_today + 1, api_calls_total = COALESCE(api_calls_total, 0) + 1 WHERE id = $1',
                [decoded.id]
            );
            
            // 可选：记录详细的使用日志到usage_history表（如果存在）
            // await pool.query(
            //     'INSERT INTO usage_history (user_id, endpoint, model, cost, success, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
            //     [decoded.id, endpoint, model, cost, success]
            // );
            
            res.json({
                success: true,
                message: 'Usage recorded successfully'
            });
        } catch (error) {
            res.status(401).json({
                error: 'Invalid token',
                message: 'Please login again'
            });
        }
    } catch (error) {
        console.error('Usage record error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Failed to record usage'
        });
    }
});

// ==================== Replicate API代理 ====================

// Replicate API代理中间件
app.all('/api/replicate/*', async (req, res) => {
    try {
        console.log('🔗 Replicate代理请求:', {
            method: req.method,
            path: req.path,
            hasAuth: !!process.env.REPLICATE_API_KEY
        });

        // 检查API Key配置
        if (!process.env.REPLICATE_API_KEY) {
            console.error('❌ Replicate API Key未配置');
            return res.status(500).json({
                error: 'Replicate API未配置',
                message: '服务器端Replicate API Key未设置'
            });
        }

        // 构建目标URL
        const targetPath = req.path.replace('/api/replicate', '');
        const targetUrl = `https://api.replicate.com${targetPath}`;
        
        console.log('📤 转发到:', targetUrl);

        // 准备请求头
        const headers = {
            'Authorization': `Bearer ${process.env.REPLICATE_API_KEY}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Magic-School-AI/1.0'
        };

        // 转发请求到Replicate API
        const response = await fetch(targetUrl, {
            method: req.method,
            headers: headers,
            body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
        });

        const result = await response.json();
        
        if (!response.ok) {
            console.error('❌ Replicate API错误:', {
                status: response.status,
                error: result
            });
            return res.status(response.status).json(result);
        }

        console.log('✅ Replicate代理成功');
        res.json(result);

    } catch (error) {
        console.error('❌ Replicate代理错误:', error);
        res.status(500).json({
            error: 'Replicate代理失败',
            message: error.message
        });
    }
});

// ==================== 根路径 ====================

app.get('/', (req, res) => {
    res.json({
        message: 'Magic School AI API Server',
        version: '1.0.0',
        documentation: '/api/status',
        health: '/api/health'
    });
});

// ==================== 错误处理 ====================

// 404处理
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found'
    });
});

// 全局错误处理
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// ==================== 启动服务器 ====================

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('========================================');
    console.log('   Magic School AI Backend Server');
    console.log('========================================');
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📍 API status: http://localhost:${PORT}/api/status`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('========================================');
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        pool.end(() => {
            console.log('Database pool closed');
            process.exit(0);
        });
    });
});

module.exports = app;