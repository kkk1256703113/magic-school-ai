const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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
        endpoints: {
            health: '/api/health',
            auth: {
                login: '/auth/login',
                register: '/auth/register',
                status: '/auth/status',
                logout: '/auth/logout'
            },
            usage: {
                check: '/usage/check',
                history: '/usage/history'
            }
        }
    });
});

// ==================== 认证路由 ====================

// 登录
app.post('/auth/login', async (req, res) => {
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
app.post('/auth/register', async (req, res) => {
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
app.get('/auth/status', async (req, res) => {
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
app.post('/auth/logout', (req, res) => {
    // JWT是无状态的，客户端只需删除token即可
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// ==================== 使用量路由 ====================

// 检查使用量
app.get('/usage/check', async (req, res) => {
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
app.get('/usage/history', async (req, res) => {
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
app.post('/usage/record', async (req, res) => {
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