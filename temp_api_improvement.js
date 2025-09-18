// 改进的 /api/usage/check 接口
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

            // 🔧 获取用户基本信息
            const userResult = await pool.query(
                'SELECT email, bonus_api_calls, is_first_time_user, created_at FROM users WHERE id = $1',
                [decoded.id]
            );

            if (userResult.rows.length === 0) {
                return res.status(404).json({
                    error: 'User not found'
                });
            }

            const user = userResult.rows[0];
            const bonusCalls = user.bonus_api_calls || 0;

            // 🔧 获取充值历史（最近5条）
            const rechargeHistoryResult = await pool.query(`
                SELECT
                    amount,
                    bonus_calls_awarded,
                    processed_at,
                    message
                FROM kofi_payments
                WHERE user_id = $1
                ORDER BY processed_at DESC
                LIMIT 5
            `, [decoded.id]);

            // 🔧 获取消耗历史（最近10条）
            const usageHistoryResult = await pool.query(`
                SELECT
                    endpoint,
                    model,
                    created_at,
                    success
                FROM api_usage_logs
                WHERE user_id = $1 AND success = true
                ORDER BY created_at DESC
                LIMIT 10
            `, [decoded.id]);

            // 🔧 格式化充值历史
            const rechargeHistory = rechargeHistoryResult.rows.map(record => ({
                date: record.processed_at,
                amount: parseFloat(record.amount),
                calls: record.bonus_calls_awarded,
                message: record.message || ''
            }));

            // 🔧 格式化消耗历史
            const usageHistory = usageHistoryResult.rows.map(record => {
                // 格式化操作名称
                let action = '';
                switch(record.endpoint) {
                    case 'generateVisualization':
                        action = '生成可视化';
                        break;
                    case 'generateHTML':
                        action = 'HTML生成';
                        break;
                    case 'analyzeContentWithClaude':
                        action = '内容分析';
                        break;
                    default:
                        action = record.endpoint || '未知操作';
                }

                return {
                    date: record.created_at,
                    action: action,
                    model: record.model || 'unknown'
                };
            });

            // 🔧 返回增强的数据结构
            res.json({
                success: true,
                remaining: bonusCalls,
                breakdown: {
                    bonusCalls: bonusCalls,
                    isFirstTimeUser: user.is_first_time_user || false,
                    total: bonusCalls
                },
                rechargeHistory: rechargeHistory,
                usageHistory: usageHistory,
                needsPayment: bonusCalls <= 0,
                kofiUrl: 'https://ko-fi.com/blueli10830',
                email: user.email
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