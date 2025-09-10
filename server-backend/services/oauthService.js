/**
 * OAuth认证服务
 * 处理Google和GitHub的OAuth认证流程
 */

const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const jwt = require('jsonwebtoken');

class OAuthService {
    constructor(pool, jwtSecret) {
        this.pool = pool;
        this.jwtSecret = jwtSecret;
        
        // Google OAuth客户端
        this.googleClient = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            `${process.env.OAUTH_CALLBACK_DOMAIN}/api/auth/oauth/google/callback`
        );
        
        // GitHub OAuth配置
        this.githubConfig = {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackUrl: `${process.env.OAUTH_CALLBACK_DOMAIN}/api/auth/oauth/github/callback`
        };
    }

    /**
     * 处理Google OAuth登录
     */
    async handleGoogleAuth(idToken) {
        try {
            console.log('[OAuth] Starting Google authentication');
            
            // 验证Google ID Token
            const ticket = await this.googleClient.verifyIdToken({
                idToken: idToken,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            
            const payload = ticket.getPayload();
            const email = payload.email;
            const name = payload.name || email.split('@')[0];
            const googleId = payload.sub;
            const avatarUrl = payload.picture;
            
            console.log(`[OAuth] Google user verified: ${email}`);
            
            // 查找或创建用户
            const user = await this.findOrCreateUser({
                email,
                name,
                provider: 'google',
                providerId: googleId,
                avatarUrl
            });
            
            // 生成JWT
            const token = this.generateToken(user);
            
            return {
                success: true,
                token,
                user: this.sanitizeUser(user)
            };
        } catch (error) {
            console.error('[OAuth] Google authentication error:', error);
            throw new Error('Google认证失败: ' + error.message);
        }
    }

    /**
     * 获取Google OAuth URL
     */
    getGoogleAuthUrl() {
        const scopes = [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
        ];
        
        return this.googleClient.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'select_account'
        });
    }

    /**
     * 处理Google OAuth回调
     */
    async handleGoogleCallback(code) {
        try {
            console.log('[OAuth] Processing Google callback');
            
            // 交换授权码获取tokens
            const { tokens } = await this.googleClient.getToken(code);
            this.googleClient.setCredentials(tokens);
            
            // 获取用户信息
            const response = await axios.get(
                'https://www.googleapis.com/oauth2/v2/userinfo',
                {
                    headers: {
                        Authorization: `Bearer ${tokens.access_token}`
                    }
                }
            );
            
            const { email, name, id: googleId, picture: avatarUrl } = response.data;
            
            console.log(`[OAuth] Google user info retrieved: ${email}`);
            
            // 查找或创建用户
            const user = await this.findOrCreateUser({
                email,
                name: name || email.split('@')[0],
                provider: 'google',
                providerId: googleId,
                avatarUrl
            });
            
            // 生成JWT
            const token = this.generateToken(user);
            
            return {
                success: true,
                token,
                user: this.sanitizeUser(user)
            };
        } catch (error) {
            console.error('[OAuth] Google callback error:', error);
            throw new Error('Google回调处理失败: ' + error.message);
        }
    }

    /**
     * 获取GitHub OAuth URL
     */
    getGitHubAuthUrl() {
        const params = new URLSearchParams({
            client_id: this.githubConfig.clientId,
            redirect_uri: this.githubConfig.callbackUrl,
            scope: 'user:email',
            state: this.generateState()
        });
        
        return `https://github.com/login/oauth/authorize?${params.toString()}`;
    }

    /**
     * 处理GitHub OAuth回调
     */
    async handleGitHubCallback(code) {
        try {
            console.log('[OAuth] Processing GitHub callback');
            
            // 交换授权码获取access token
            const tokenResponse = await axios.post(
                'https://github.com/login/oauth/access_token',
                {
                    client_id: this.githubConfig.clientId,
                    client_secret: this.githubConfig.clientSecret,
                    code: code
                },
                {
                    headers: {
                        Accept: 'application/json'
                    }
                }
            );
            
            const accessToken = tokenResponse.data.access_token;
            
            if (!accessToken) {
                throw new Error('Failed to get GitHub access token');
            }
            
            // 获取用户信息
            const userResponse = await axios.get('https://api.github.com/user', {
                headers: {
                    Authorization: `token ${accessToken}`
                }
            });
            
            // 获取用户邮箱（如果用户设置为私有）
            let email = userResponse.data.email;
            if (!email) {
                const emailResponse = await axios.get('https://api.github.com/user/emails', {
                    headers: {
                        Authorization: `token ${accessToken}`
                    }
                });
                
                const primaryEmail = emailResponse.data.find(e => e.primary);
                email = primaryEmail ? primaryEmail.email : emailResponse.data[0]?.email;
            }
            
            if (!email) {
                throw new Error('无法获取GitHub用户邮箱');
            }
            
            const { login: username, id: githubId, avatar_url: avatarUrl, name } = userResponse.data;
            
            console.log(`[OAuth] GitHub user info retrieved: ${email}`);
            
            // 查找或创建用户
            const user = await this.findOrCreateUser({
                email,
                name: name || username || email.split('@')[0],
                provider: 'github',
                providerId: githubId.toString(),
                avatarUrl
            });
            
            // 生成JWT
            const token = this.generateToken(user);
            
            return {
                success: true,
                token,
                user: this.sanitizeUser(user)
            };
        } catch (error) {
            console.error('[OAuth] GitHub callback error:', error);
            throw new Error('GitHub回调处理失败: ' + error.message);
        }
    }

    /**
     * 查找或创建用户
     */
    async findOrCreateUser({ email, name, provider, providerId, avatarUrl }) {
        try {
            // 首先检查是否存在具有相同OAuth ID的用户
            let result = await this.pool.query(
                'SELECT * FROM users WHERE oauth_provider = $1 AND oauth_id = $2',
                [provider, providerId]
            );
            
            if (result.rows.length > 0) {
                console.log(`[OAuth] Found existing user with ${provider} ID: ${email}`);
                return result.rows[0];
            }
            
            // 检查是否存在相同邮箱的用户
            result = await this.pool.query(
                'SELECT * FROM users WHERE email = $1',
                [email]
            );
            
            if (result.rows.length > 0) {
                // 更新现有用户的OAuth信息
                console.log(`[OAuth] Linking ${provider} to existing user: ${email}`);
                const updateResult = await this.pool.query(
                    `UPDATE users 
                     SET oauth_provider = $1, oauth_id = $2, avatar_url = $3, last_login = NOW()
                     WHERE email = $4
                     RETURNING *`,
                    [provider, providerId, avatarUrl, email]
                );
                return updateResult.rows[0];
            }
            
            // 创建新用户
            console.log(`[OAuth] Creating new user from ${provider}: ${email}`);
            const insertResult = await this.pool.query(
                `INSERT INTO users (
                    email, username, oauth_provider, oauth_id, avatar_url, 
                    plan_type, api_calls_today, created_at, last_login
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
                RETURNING *`,
                [email, name, provider, providerId, avatarUrl, 'free', 0]
            );
            
            return insertResult.rows[0];
        } catch (error) {
            console.error('[OAuth] Error in findOrCreateUser:', error);
            throw error;
        }
    }

    /**
     * 生成JWT令牌
     */
    generateToken(user) {
        return jwt.sign(
            {
                id: user.id,
                email: user.email,
                plan: user.plan_type
            },
            this.jwtSecret,
            { expiresIn: '24h' }
        );
    }

    /**
     * 清理用户数据（移除敏感信息）
     */
    sanitizeUser(user) {
        return {
            id: user.id,
            email: user.email,
            username: user.username,
            plan_type: user.plan_type,
            api_calls_today: user.api_calls_today || 0,
            api_calls_remaining: user.plan_type === 'free' ? 10 - (user.api_calls_today || 0) : 1000,
            avatar_url: user.avatar_url,
            oauth_provider: user.oauth_provider
        };
    }

    /**
     * 生成随机状态值（用于CSRF保护）
     */
    generateState() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }
}

module.exports = OAuthService;