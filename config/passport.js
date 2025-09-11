const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const { Pool } = require('pg');
require('dotenv').config();

// 数据库连接池
const pool = new Pool({
    user: process.env.DB_USER || 'eduvisualizer_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'eduvisualizer_db',
    password: process.env.DB_PASS || 'EduViz2025Secure',
    port: process.env.DB_PORT || 5432,
});

// Passport序列化/反序列化
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        done(null, result.rows[0]);
    } catch (error) {
        done(error, null);
    }
});

// Google OAuth策略
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/oauth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('Google OAuth 回调:', {
            id: profile.id,
            email: profile.emails?.[0]?.value,
            name: profile.displayName
        });

        const email = profile.emails?.[0]?.value;
        if (!email) {
            return done(new Error('无法获取Google账号邮箱'), null);
        }

        // 检查用户是否已存在
        let result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        let user;

        if (result.rows.length > 0) {
            // 用户已存在，更新登录时间
            user = result.rows[0];
            await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
        } else {
            // 创建新用户
            const createResult = await pool.query(
                `INSERT INTO users (email, username, plan_type, api_calls_today, created_at, oauth_provider, oauth_id) 
                 VALUES ($1, $2, $3, $4, NOW(), $5, $6) 
                 RETURNING id, email, username, plan_type, api_calls_today`,
                [email, profile.displayName || email.split('@')[0], 'free', 0, 'google', profile.id]
            );
            user = createResult.rows[0];
        }

        return done(null, user);
    } catch (error) {
        console.error('Google OAuth错误:', error);
        return done(error, null);
    }
}));

// GitHub OAuth策略
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "/api/auth/oauth/github/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('GitHub OAuth 回调:', {
            id: profile.id,
            username: profile.username,
            email: profile.emails?.[0]?.value
        });

        const email = profile.emails?.[0]?.value;
        if (!email) {
            return done(new Error('无法获取GitHub账号邮箱'), null);
        }

        // 检查用户是否已存在
        let result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        let user;

        if (result.rows.length > 0) {
            // 用户已存在，更新登录时间
            user = result.rows[0];
            await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
        } else {
            // 创建新用户
            const createResult = await pool.query(
                `INSERT INTO users (email, username, plan_type, api_calls_today, created_at, oauth_provider, oauth_id) 
                 VALUES ($1, $2, $3, $4, NOW(), $5, $6) 
                 RETURNING id, email, username, plan_type, api_calls_today`,
                [email, profile.username || profile.displayName || email.split('@')[0], 'free', 0, 'github', profile.id]
            );
            user = createResult.rows[0];
        }

        return done(null, user);
    } catch (error) {
        console.error('GitHub OAuth错误:', error);
        return done(error, null);
    }
}));

module.exports = passport;