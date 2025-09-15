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
const OAuthService = require('./services/oauthService');
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

// 初始化OAuth服务
let oauthService;
pool.connect().then(() => {
    oauthService = new OAuthService(pool, JWT_SECRET);
    console.log('[OAuth] Service initialized');
}).catch(err => {
    console.error('[OAuth] Failed to initialize service:', err);
});

// 开发模式
const DEV_MODE = process.env.DEV_MODE === 'true';
const MOCK_VERIFICATION_CODE = process.env.MOCK_VERIFICATION_CODE || '123456';
const MOCK_GOOGLE_EMAIL = process.env.MOCK_GOOGLE_EMAIL || 'test@gmail.com';
const MOCK_GOOGLE_USER = process.env.MOCK_GOOGLE_USER || '测试用户';

// 存储验证码（生产环境应使用Redis）
// 格式: email -> { code, timestamp, expires, lastSent }
const verificationCodes = new Map();

// 频率限制存储（生产环境应使用Redis）
// 格式: key -> timestamp
const rateLimitStore = {};

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
        
        // 创建用户 - 新用户获得5次免费调用
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, username, plan_type, api_calls_today, bonus_api_calls, is_first_time_user, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
             RETURNING id, email, username, plan_type, bonus_api_calls`,
            [email, passwordHash, username || email.split('@')[0], 'free', 0, 5, true]
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
        const { email, language = 'en' } = req.body;
        
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
            const emailResult = await sendVerificationCode(email, code, language);
            console.log(`[RESET CODE] Email sent successfully to ${email} in language: ${language}, MessageID: ${emailResult.messageId}`);
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
        const { email, type = 'register', language = 'en' } = req.body;
        
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
        
        // 根据类型确定存储键和频率限制键
        const storageKey = type === 'reset' ? `reset_${email}` : email;
        const rateLimitKey = `${type}_${email}`;
        
        // 频率限制检查（60秒内只能发送一次）
        if (rateLimitStore[rateLimitKey] && Date.now() - rateLimitStore[rateLimitKey] < 60000) {
            const waitTime = Math.ceil((60000 - (Date.now() - rateLimitStore[rateLimitKey])) / 1000);
            return res.status(429).json({
                error: 'Too many requests',
                message: `请等待 ${waitTime} 秒后再试`,
                waitTime
            });
        }
        
        // 生成6位随机验证码
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const timestamp = Date.now();
        const expires = timestamp + 5 * 60 * 1000; // 5分钟后过期
        
        // 发送真实邮件
        try {
            console.log(`[EMAIL] Sending ${type} verification code to ${email} in language: ${language}`);
            const emailResult = await sendVerificationCode(email, code, language);
            console.log(`[EMAIL] Send result:`, emailResult);
            
            // 存储验证码信息 - 使用正确的存储键
            verificationCodes.set(storageKey, {
                code,
                timestamp,
                expires,
                lastSent: timestamp,
                messageId: emailResult.messageId,
                type // 记录验证码类型
            });
            
            // 记录频率限制
            rateLimitStore[rateLimitKey] = timestamp;
            
            // 5分钟后自动删除
            setTimeout(() => {
                const stored = verificationCodes.get(storageKey);
                if (stored && stored.code === code) {
                    verificationCodes.delete(storageKey);
                    console.log(`[CLEANUP] ${type} verification code for ${email} expired and removed`);
                }
            }, 5 * 60 * 1000);
            
            console.log(`[SUCCESS] ${type} verification code sent to ${email}, expires at ${new Date(expires).toISOString()}`);
            
            res.json({
                success: true,
                message: '验证码已发送到您的邮箱，请注意查收',
                expiresIn: 300 // 5分钟（秒）
            });
            
        } catch (emailError) {
            console.error(`[EMAIL ERROR] Failed to send ${type} code to ${email}:`, emailError);
            
            // 邮件发送失败时的降级处理（仅在开发环境）
            if (process.env.NODE_ENV === 'development') {
                console.log(`[FALLBACK] ${type} verification code for ${email}: ${code}`);
                verificationCodes.set(storageKey, {
                    code,
                    timestamp,
                    expires,
                    lastSent: timestamp,
                    type
                });
                
                // 记录频率限制
                rateLimitStore[rateLimitKey] = timestamp;
                
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
        const { email, code, type = 'register' } = req.body;
        
        if (!email || !code) {
            return res.status(400).json({
                error: 'Missing fields',
                message: '请提供邮箱和验证码'
            });
        }
        
        // 根据类型确定存储键
        const storageKey = type === 'reset' ? `reset_${email}` : email;
        const storedData = verificationCodes.get(storageKey);
        
        if (!storedData) {
            console.log(`[VERIFY] No ${type} verification code found for ${email}`);
            return res.json({
                success: false,
                message: '验证码不存在，请重新发送'
            });
        }
        
        // 检查是否过期
        if (Date.now() > storedData.expires) {
            console.log(`[VERIFY] ${type} verification code expired for ${email}`);
            verificationCodes.delete(storageKey);
            return res.json({
                success: false,
                message: '验证码已过期，请重新发送'
            });
        }
        
        // 验证码匹配检查
        if (storedData.code === code) {
            console.log(`[VERIFY SUCCESS] ${type} verification successful for ${email}`);
            
            // 验证成功，删除验证码
            verificationCodes.delete(storageKey);
            
            // 只有注册验证码才需要生成JWT token进行自动登录
            // 密码重置验证码不需要自动登录
            if (type === 'register') {
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
            } else {
                // 密码重置验证码验证成功，不返回token
                return res.json({
                    success: true,
                    message: '验证成功'
                });
            }
        }
        
        console.log(`[VERIFY FAILED] Wrong ${type} code for ${email}: provided ${code}, expected ${storedData.code}`);
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
                // 创建新用户 - OAuth新用户也获得5次免费调用
                const createResult = await pool.query(
                    `INSERT INTO users (email, username, plan_type, api_calls_today, bonus_api_calls, is_first_time_user, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6, NOW())
                     RETURNING id, email, username, plan_type, api_calls_today, bonus_api_calls`,
                    [MOCK_GOOGLE_EMAIL, MOCK_GOOGLE_USER, 'free', 0, 5, true]
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
        if (!oauthService) {
            return res.status(503).json({
                error: 'Service unavailable',
                message: 'OAuth服务尚未初始化'
            });
        }
        
        const { idToken } = req.body;
        if (!idToken) {
            return res.status(400).json({
                error: 'Missing token',
                message: '缺少Google ID Token'
            });
        }
        
        const result = await oauthService.handleGoogleAuth(idToken);
        res.json(result);
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'Google登录失败'
        });
    }
});

// GitHub OAuth登录
app.post('/api/auth/github', async (req, res) => {
    try {
        if (!oauthService) {
            return res.status(503).json({
                error: 'Service unavailable',
                message: 'OAuth服务尚未初始化'
            });
        }
        
        // 返回GitHub OAuth URL供前端跳转
        const authUrl = oauthService.getGitHubAuthUrl();
        res.json({
            success: true,
            authUrl
        });
    } catch (error) {
        console.error('GitHub auth error:', error);
        res.status(500).json({
            error: 'Server error',
            message: 'GitHub登录失败'
        });
    }
});

// Google OAuth回调处理
app.get('/api/auth/oauth/google/callback', async (req, res) => {
    try {
        if (!oauthService) {
            return res.redirect(`${process.env.OAUTH_CALLBACK_DOMAIN}/?error=service_unavailable`);
        }
        
        const { code } = req.query;
        if (!code) {
            return res.redirect(`${process.env.OAUTH_CALLBACK_DOMAIN}/?error=missing_code`);
        }
        
        const result = await oauthService.handleGoogleCallback(code);
        
        // 重定向到前端，带上token
        const redirectUrl = `${process.env.OAUTH_CALLBACK_DOMAIN}/app?token=${result.token}&provider=google`;
        res.redirect(redirectUrl);
    } catch (error) {
        console.error('Google OAuth callback error:', error);
        res.redirect(`${process.env.OAUTH_CALLBACK_DOMAIN}/?error=auth_failed&message=${encodeURIComponent(error.message)}`);
    }
});

// GitHub OAuth回调处理
app.get('/api/auth/oauth/github/callback', async (req, res) => {
    try {
        if (!oauthService) {
            return res.redirect(`${process.env.OAUTH_CALLBACK_DOMAIN}/?error=service_unavailable`);
        }
        
        const { code } = req.query;
        if (!code) {
            return res.redirect(`${process.env.OAUTH_CALLBACK_DOMAIN}/?error=missing_code`);
        }
        
        const result = await oauthService.handleGitHubCallback(code);
        
        // 重定向到前端，带上token
        const redirectUrl = `${process.env.OAUTH_CALLBACK_DOMAIN}/app?token=${result.token}&provider=github`;
        res.redirect(redirectUrl);
    } catch (error) {
        console.error('GitHub OAuth callback error:', error);
        res.redirect(`${process.env.OAUTH_CALLBACK_DOMAIN}/?error=auth_failed&message=${encodeURIComponent(error.message)}`);
    }
});

// 获取OAuth URL（新的统一接口）
app.get('/api/auth/oauth/:provider/url', async (req, res) => {
    try {
        if (!oauthService) {
            return res.status(503).json({
                error: 'Service unavailable',
                message: 'OAuth服务尚未初始化'
            });
        }
        
        const { provider } = req.params;
        let authUrl;
        
        switch (provider) {
            case 'google':
                authUrl = oauthService.getGoogleAuthUrl();
                break;
            case 'github':
                authUrl = oauthService.getGitHubAuthUrl();
                break;
            default:
                return res.status(400).json({
                    error: 'Invalid provider',
                    message: '不支持的OAuth提供商'
                });
        }
        
        res.json({
            success: true,
            authUrl
        });
    } catch (error) {
        console.error(`${req.params.provider} OAuth URL error:`, error);
        res.status(500).json({
            error: 'Server error',
            message: '获取OAuth URL失败'
        });
    }
});

// ==================== Ko-fi支付集成 ====================

// Ko-fi Webhook处理端点
app.post('/api/webhooks/kofi', async (req, res) => {
    try {
        // Ko-fi发送的数据在data字段中，是JSON字符串
        const webhookData = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body;

        console.log('[Ko-fi] Received webhook:', JSON.stringify(webhookData, null, 2));

        // 1. 验证webhook token（暂时使用环境变量中的token验证）
        const expectedToken = process.env.KOFI_WEBHOOK_TOKEN || 'a17a9688-d731-4060-b338-45e503d0716c';
        if (webhookData.verification_token !== expectedToken) {
            console.error('[Ko-fi] Invalid webhook token');
            return res.status(400).json({ error: 'Invalid webhook signature' });
        }

        // 2. 解析支付数据
        const {
            kofi_transaction_id,
            message_id,
            amount,
            email,
            from_name,
            type,
            message,
            is_public,
            currency,
            verification_token
        } = webhookData;

        // 3. 只处理捐赠类型
        if (type !== 'Donation') {
            console.log('[Ko-fi] Not a donation, type:', type);
            return res.status(200).json({ message: 'Not a donation, ignored' });
        }

        // 4. 防重复处理
        const existingPayment = await pool.query(
            'SELECT id FROM kofi_payments WHERE kofi_transaction_id = $1',
            [kofi_transaction_id]
        );

        if (existingPayment.rows.length > 0) {
            console.log('[Ko-fi] Payment already processed');
            return res.status(200).json({ message: 'Payment already processed' });
        }

        // 5. 计算奖励次数（每$1 = 2次调用，包含bonus）
        const amountFloat = parseFloat(amount);
        const baseCalls = Math.floor(amountFloat) * 2;

        // Bonus计算
        let bonusPercentage = 0;
        if (amountFloat >= 20) bonusPercentage = 25;
        else if (amountFloat >= 10) bonusPercentage = 25;
        else if (amountFloat >= 5) bonusPercentage = 20;

        const bonusCalls = Math.floor(baseCalls * bonusPercentage / 100);
        const totalCalls = baseCalls + bonusCalls;

        console.log(`[Ko-fi] Processing $${amountFloat} donation = ${baseCalls} base + ${bonusCalls} bonus = ${totalCalls} total calls`);

        // 6. 查找用户（通过邮箱匹配）
        const userResult = await pool.query(
            'SELECT id, email, bonus_api_calls FROM users WHERE email = $1',
            [email]
        );

        let userId = null;
        let currentBonusCalls = 0;

        if (userResult.rows.length > 0) {
            const user = userResult.rows[0];
            userId = user.id;
            currentBonusCalls = user.bonus_api_calls || 0;

            // 7. 更新用户API调用次数
            await pool.query(
                'UPDATE users SET bonus_api_calls = bonus_api_calls + $1, kofi_email = $2, is_first_time_user = false WHERE id = $3',
                [totalCalls, email, userId]
            );

            console.log(`[Ko-fi] User ${email} updated: +${totalCalls} calls, new total: ${currentBonusCalls + totalCalls}`);
        } else {
            console.log(`[Ko-fi] Payment from unregistered user: ${email}`);
        }

        // 8. 记录支付（无论用户是否存在）
        await pool.query(`
            INSERT INTO kofi_payments
            (user_id, kofi_transaction_id, message_id, donor_email, donor_name, amount, currency,
             bonus_calls_awarded, bonus_percentage, message, is_public, verification_token, raw_webhook_data)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
            userId, kofi_transaction_id, message_id, email, from_name, amountFloat, currency || 'USD',
            totalCalls, bonusPercentage, message, is_public !== false, verification_token, JSON.stringify(webhookData)
        ]);

        console.log(`[Ko-fi] Payment processed successfully: ${email} +${totalCalls} API calls`);

        res.status(200).json({
            success: true,
            message: 'Payment processed successfully',
            bonusCalls: totalCalls,
            newTotal: userId ? currentBonusCalls + totalCalls : null
        });

    } catch (error) {
        console.error('[Ko-fi] Webhook processing error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==================== 使用量路由 ====================

// 检查使用量（改进版 - 支持Ko-fi充值系统）
app.get('/api/usage/check', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.json({
                apiCallsRemaining: 0,
                bonusCalls: 0,
                isFirstTimeUser: false,
                message: 'Authentication required'
            });
        }

        const token = authHeader.substring(7);

        try {
            const decoded = jwt.verify(token, JWT_SECRET);

            const result = await pool.query(
                'SELECT email, bonus_api_calls, is_first_time_user, created_at FROM users WHERE id = $1',
                [decoded.id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: 'User not found'
                });
            }

            const user = result.rows[0];
            const bonusCalls = user.bonus_api_calls || 0;

            res.json({
                success: true,
                apiCallsRemaining: bonusCalls,
                breakdown: {
                    bonusCalls: bonusCalls,
                    isFirstTimeUser: user.is_first_time_user || false,
                    total: bonusCalls
                },
                needsPayment: bonusCalls <= 0,
                kofiUrl: 'https://ko-fi.com/magicschoolai',  // 替换为你的Ko-fi URL
                email: user.email  // 用于提醒用户使用此邮箱支付
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

// 记录API使用（改进版 - 支持Ko-fi充值系统）
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
            const { endpoint, model, cost = 1, success = true } = req.body;

            // 开始事务
            const client = await pool.connect();

            try {
                await client.query('BEGIN');

                // 获取当前用户状态
                const userResult = await client.query(
                    'SELECT bonus_api_calls, email FROM users WHERE id = $1 FOR UPDATE',
                    [decoded.id]
                );

                if (userResult.rows.length === 0) {
                    throw new Error('User not found');
                }

                const user = userResult.rows[0];

                // 检查是否有可用次数
                if (user.bonus_api_calls <= 0) {
                    await client.query('ROLLBACK');
                    return res.status(429).json({
                        error: 'No API calls remaining',
                        code: 'NO_CALLS_REMAINING',
                        needsPayment: true,
                        kofiUrl: 'https://ko-fi.com/magicschoolai'
                    });
                }

                // 扣除API调用次数
                const newBonusCalls = Math.max(user.bonus_api_calls - cost, 0);

                await client.query(
                    'UPDATE users SET bonus_api_calls = $1, api_calls_total = COALESCE(api_calls_total, 0) + 1 WHERE id = $2',
                    [newBonusCalls, decoded.id]
                );

                // 记录API使用日志
                await client.query(
                    'INSERT INTO api_usage_logs (user_id, endpoint, model, cost, success, used_type, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
                    [decoded.id, endpoint, model, cost, success, 'bonus']
                );

                await client.query('COMMIT');

                res.json({
                    success: true,
                    remaining: newBonusCalls,
                    message: 'Usage recorded successfully'
                });

            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }

        } catch (error) {
            if (error.message === 'User not found') {
                res.status(404).json({ error: 'User not found' });
            } else if (error.code === 'INVALID_TOKEN') {
                res.status(401).json({
                    error: 'Invalid token',
                    message: 'Please login again'
                });
            } else {
                throw error;
            }
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