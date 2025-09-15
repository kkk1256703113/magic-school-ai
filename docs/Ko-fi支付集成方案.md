# Ko-fi支付集成实现方案

> 创建日期: 2025-01-15
> 状态: 计划中 - 待明天实施
> 目的: 测试支付流程，为用户提供API调用次数增值服务

## 🎯 测试阶段规则

### 免费用户政策
- **首月特惠**: 每天2次免费API调用
- **重置机制**: 免费次数每日清零，不累积
- **时限**: 仅限注册后首月享受

### 捐赠奖励政策
- **兑换比例**: 每捐赠$1 = 2次永久API调用机会
- **永久有效**: 捐赠获得的次数永不过期，仅消耗时减少
- **不重置**: 永久次数不受每日清零影响

### 消耗优先级
1. 优先使用每日免费次数
2. 免费次数用完后消耗永久次数

---

## 🏗️ 数据库设计

### 1. 用户表扩展 (users)
```sql
-- 添加支付相关字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS bonus_api_calls INTEGER DEFAULT 0; -- 永久累积次数
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_free_calls INTEGER DEFAULT 2; -- 每日免费次数
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_free_reset DATE DEFAULT CURRENT_DATE; -- 上次重置日期
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_month_end DATE; -- 免费首月结束日期
ALTER TABLE users ADD COLUMN IF NOT EXISTS kofi_email VARCHAR(255); -- Ko-fi支付邮箱

-- 为新字段创建索引
CREATE INDEX IF NOT EXISTS idx_users_kofi_email ON users(kofi_email);
CREATE INDEX IF NOT EXISTS idx_users_last_reset ON users(last_free_reset);
```

### 2. 支付记录表 (kofi_payments)
```sql
CREATE TABLE IF NOT EXISTS kofi_payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    kofi_transaction_id VARCHAR(255) UNIQUE NOT NULL,
    donor_email VARCHAR(255) NOT NULL,
    donor_name VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    bonus_calls_awarded INTEGER NOT NULL, -- 本次奖励的调用次数
    processed_at TIMESTAMP DEFAULT NOW(),
    verification_token VARCHAR(255),
    raw_webhook_data JSONB, -- 保存原始webhook数据便于调试

    -- 索引优化
    CONSTRAINT unique_kofi_transaction UNIQUE (kofi_transaction_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_kofi_payments_user_id ON kofi_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_kofi_payments_email ON kofi_payments(donor_email);
CREATE INDEX IF NOT EXISTS idx_kofi_payments_processed_at ON kofi_payments(processed_at);
```

---

## 🔧 后端API实现

### 1. Ko-fi Webhook处理端点

**路径**: `POST /api/webhooks/kofi`

```javascript
app.post('/api/webhooks/kofi', async (req, res) => {
    try {
        const webhookData = req.body;
        console.log('[Ko-fi] Received webhook:', JSON.stringify(webhookData, null, 2));

        // 1. 验证webhook签名 (Ko-fi提供verification_token)
        const expectedToken = process.env.KOFI_WEBHOOK_TOKEN;
        if (webhookData.verification_token !== expectedToken) {
            console.error('[Ko-fi] Invalid webhook token');
            return res.status(400).json({ error: 'Invalid webhook signature' });
        }

        // 2. 解析支付数据
        const {
            kofi_transaction_id,
            amount,
            email,
            from_name,
            type,
            verification_token
        } = webhookData;

        // 3. 只处理捐赠类型
        if (type !== 'Donation') {
            console.log('[Ko-fi] Not a donation, ignored');
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

        // 5. 计算奖励次数（每$1 = 2次调用）
        const amountFloat = parseFloat(amount);
        const bonusCalls = Math.floor(amountFloat) * 2;

        console.log(`[Ko-fi] Processing $${amountFloat} donation = ${bonusCalls} bonus calls`);

        // 6. 查找用户（通过邮箱匹配）
        const userResult = await pool.query(
            'SELECT id, email, bonus_api_calls FROM users WHERE email = $1',
            [email]
        );

        if (userResult.rows.length === 0) {
            // 用户不存在，记录未匹配的支付
            console.log(`[Ko-fi] Payment from unregistered user: ${email}`);
            await pool.query(`
                INSERT INTO kofi_payments
                (user_id, kofi_transaction_id, donor_email, donor_name, amount, bonus_calls_awarded, verification_token, raw_webhook_data)
                VALUES (NULL, $1, $2, $3, $4, $5, $6, $7)
            `, [kofi_transaction_id, email, from_name, amountFloat, bonusCalls, verification_token, JSON.stringify(webhookData)]);

            return res.status(200).json({ message: 'User not found, payment logged for manual processing' });
        }

        const user = userResult.rows[0];

        // 7. 更新用户API调用次数
        await pool.query(
            'UPDATE users SET bonus_api_calls = bonus_api_calls + $1, kofi_email = $2 WHERE id = $3',
            [bonusCalls, email, user.id]
        );

        // 8. 记录支付
        await pool.query(`
            INSERT INTO kofi_payments
            (user_id, kofi_transaction_id, donor_email, donor_name, amount, bonus_calls_awarded, verification_token, raw_webhook_data)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [user.id, kofi_transaction_id, email, from_name, amountFloat, bonusCalls, verification_token, JSON.stringify(webhookData)]);

        // 9. 发送确认邮件（可选）
        // await sendPaymentConfirmationEmail(email, from_name, amountFloat, bonusCalls);

        console.log(`[Ko-fi] Payment processed successfully: ${email} +${bonusCalls} API calls`);
        res.status(200).json({
            message: 'Payment processed successfully',
            bonusCalls: bonusCalls,
            newTotal: user.bonus_api_calls + bonusCalls
        });

    } catch (error) {
        console.error('[Ko-fi] Webhook processing error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
```

### 2. 更新API限制检查逻辑

**路径**: `GET /api/usage/check`

```javascript
const checkAPILimit = async (req, res) => {
    try {
        const userId = req.user.id;

        // 获取用户信息
        const userResult = await pool.query(`
            SELECT bonus_api_calls, daily_free_calls, last_free_reset,
                   first_month_end, created_at, email
            FROM users WHERE id = $1
        `, [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userResult.rows[0];
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();

        // 检查是否需要重置每日免费次数
        let dailyFreeCalls = user.daily_free_calls;
        let isFirstMonth = false;

        if (user.last_free_reset !== today) {
            // 检查是否还在首月免费期
            const createdAt = new Date(user.created_at);
            const firstMonthEnd = user.first_month_end ?
                new Date(user.first_month_end) :
                new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000); // 30天后

            isFirstMonth = now <= firstMonthEnd;
            dailyFreeCalls = isFirstMonth ? 2 : 0; // 首月每天2次，否则0次

            // 重置每日免费次数
            await pool.query(`
                UPDATE users
                SET daily_free_calls = $1,
                    last_free_reset = $2,
                    first_month_end = $3
                WHERE id = $4
            `, [dailyFreeCalls, today, firstMonthEnd, userId]);
        } else {
            // 检查当前是否在首月
            if (user.first_month_end) {
                isFirstMonth = now <= new Date(user.first_month_end);
            }
        }

        // 计算总可用次数
        const totalAvailable = user.bonus_api_calls + dailyFreeCalls;

        res.json({
            success: true,
            apiCallsRemaining: totalAvailable,
            breakdown: {
                bonusCalls: user.bonus_api_calls, // 永久次数
                dailyFreeCalls: dailyFreeCalls, // 今日免费次数
                isFirstMonth: isFirstMonth,
                total: totalAvailable
            }
        });

    } catch (error) {
        console.error('[API] Check limit error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
```

### 3. 记录API使用

**路径**: `POST /api/usage/record`

```javascript
const recordAPIUsage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { endpoint, model, cost = 1, success = true } = req.body;

        // 开始事务
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // 获取当前用户状态
            const userResult = await client.query(`
                SELECT daily_free_calls, bonus_api_calls, email
                FROM users WHERE id = $1 FOR UPDATE
            `, [userId]);

            if (userResult.rows.length === 0) {
                throw new Error('User not found');
            }

            const user = userResult.rows[0];

            // 检查是否有可用次数
            if (user.daily_free_calls + user.bonus_api_calls <= 0) {
                throw new Error('No API calls remaining');
            }

            // 优先消耗每日免费次数，再消耗永久次数
            let newDailyFree = user.daily_free_calls;
            let newBonusCalls = user.bonus_api_calls;
            let usedType = '';

            if (user.daily_free_calls > 0) {
                newDailyFree = user.daily_free_calls - 1;
                usedType = 'daily_free';
            } else {
                newBonusCalls = Math.max(user.bonus_api_calls - 1, 0);
                usedType = 'bonus';
            }

            // 更新用户余额
            await client.query(`
                UPDATE users
                SET daily_free_calls = $1, bonus_api_calls = $2
                WHERE id = $3
            `, [newDailyFree, newBonusCalls, userId]);

            // 记录API使用日志（如果需要的话）
            // await client.query(`
            //     INSERT INTO api_usage_logs (user_id, endpoint, model, cost, success, used_type, created_at)
            //     VALUES ($1, $2, $3, $4, $5, $6, NOW())
            // `, [userId, endpoint, model, cost, success, usedType]);

            await client.query('COMMIT');

            res.json({
                success: true,
                remaining: {
                    dailyFree: newDailyFree,
                    bonus: newBonusCalls,
                    total: newDailyFree + newBonusCalls
                },
                usedType: usedType
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('[API] Record usage error:', error);

        if (error.message === 'No API calls remaining') {
            res.status(429).json({
                error: 'API调用次数已用完',
                code: 'NO_CALLS_REMAINING'
            });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};
```

---

## 🎨 前端界面调整

### 1. 升级模态框改为Ko-fi捐赠

**文件**: `src/components/UpgradeModal.tsx`

```typescript
import { X, ExternalLink, Gift, Zap } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from 'react-i18next'

interface UpgradeModalProps {
    isOpen: boolean
    onClose: () => void
}

export const UpgradeModal = ({ isOpen, onClose }: UpgradeModalProps) => {
    const { user } = useAuth()
    const { t } = useTranslation()

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                {/* 头部 */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        支持我们，获得更多调用机会！
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* 说明内容 */}
                <div className="space-y-4 mb-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                            <Gift className="h-5 w-5" />
                            捐赠奖励规则
                        </h3>
                        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                            <li>💰 每捐赠 $1 = 2次永久API调用机会</li>
                            <li>⭐ 捐赠获得的次数永不过期</li>
                            <li>🔄 消耗后才会减少，不受每日重置影响</li>
                        </ul>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                        <h3 className="font-medium text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
                            <Zap className="h-5 w-5" />
                            免费用户政策
                        </h3>
                        <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                            <li>🆓 首月每天免费2次调用</li>
                            <li>🕒 免费次数每日清零重置</li>
                            <li>📅 仅限注册后首月享受</li>
                        </ul>
                    </div>
                </div>

                {/* Ko-fi按钮 */}
                <div className="text-center space-y-3">
                    <a
                        href={`https://ko-fi.com/你的Ko-fi用户名`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-[#FF5E5B] hover:bg-[#FF4E4A] text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                        ☕ 在Ko-fi上支持我们
                        <ExternalLink className="h-4 w-4" />
                    </a>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        💡 请使用注册邮箱
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                            ({user?.email})
                        </span>
                        进行捐赠，以便自动增加调用次数
                    </p>
                </div>

                {/* 底部说明 */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        这是测试阶段，我们正在完善支付流程。感谢您的支持！
                    </p>
                </div>
            </div>
        </div>
    )
}
```

### 2. API使用量显示组件

**文件**: `src/components/APIUsageDisplay.tsx`

```typescript
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Zap, Gift, Clock, AlertCircle } from 'lucide-react'
import axios from 'axios'

interface UsageData {
    apiCallsRemaining: number
    breakdown: {
        bonusCalls: number
        dailyFreeCalls: number
        isFirstMonth: boolean
        total: number
    }
}

export const APIUsageDisplay = () => {
    const { token } = useAuth()
    const [usage, setUsage] = useState<UsageData | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchUsage = async () => {
        try {
            const response = await axios.get('/api/usage/check', {
                headers: { Authorization: `Bearer ${token}` }
            })
            setUsage(response.data)
        } catch (error) {
            console.error('获取使用量失败:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (token) {
            fetchUsage()
        }
    }, [token])

    if (loading || !usage) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                API调用次数
            </h3>

            <div className="space-y-3">
                {/* 总可用次数 */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                        <span className="text-blue-900 dark:text-blue-100 font-medium">
                            总可用次数
                        </span>
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {usage.breakdown.total}
                        </span>
                    </div>
                </div>

                {/* 详细分解 */}
                <div className="space-y-2">
                    {/* 今日免费次数 */}
                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-green-600" />
                            <span className="text-gray-700 dark:text-gray-300">
                                今日免费
                                {usage.breakdown.isFirstMonth && (
                                    <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200">
                                        首月特惠
                                    </span>
                                )}
                            </span>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                            {usage.breakdown.dailyFreeCalls}
                        </span>
                    </div>

                    {/* 永久次数 */}
                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2 text-sm">
                            <Gift className="h-4 w-4 text-purple-600" />
                            <span className="text-gray-700 dark:text-gray-300">永久次数</span>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                            {usage.breakdown.bonusCalls}
                        </span>
                    </div>
                </div>

                {/* 提示信息 */}
                {usage.breakdown.total <= 5 && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                            <p className="text-amber-800 dark:text-amber-200 font-medium">
                                调用次数即将用完
                            </p>
                            <p className="text-amber-700 dark:text-amber-300 mt-1">
                                考虑通过Ko-fi支持我们以获得更多调用机会
                            </p>
                        </div>
                    </div>
                )}

                {/* 说明文字 */}
                <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p>• 免费次数每日重置，永久次数消耗后才减少</p>
                    <p>• 系统优先使用免费次数，再使用永久次数</p>
                </div>
            </div>
        </div>
    )
}
```

### 3. 更新聊天容器显示

**文件**: `src/components/chat/ChatContainer.tsx` (添加使用量显示)

```typescript
// 在ChatContainer组件的侧边栏或者合适位置添加
import { APIUsageDisplay } from '@/components/APIUsageDisplay'

// 在返回的JSX中添加：
<div className="p-4">
    <APIUsageDisplay />
</div>
```

---

## 🚀 部署和配置步骤

### 1. Ko-fi配置

1. **登录Ko-fi后台**
   - 访问: `https://ko-fi.com/manage/webhooks`
   - 设置Webhook URL: `https://你的域名/api/webhooks/kofi`

2. **设置支付页面**
   - 访问: `https://ko-fi.com/manage/profile`
   - 设置建议捐赠金额: $1, $3, $5, $10
   - 编写页面描述，说明捐赠奖励规则

3. **获取验证Token**
   - 在webhook页面获取验证token
   - 保存到环境变量中

### 2. 环境变量配置

**文件**: `server-backend/.env`

```env
# Ko-fi集成配置
KOFI_WEBHOOK_TOKEN=你从Ko-fi获取的验证token
KOFI_PROFILE_URL=https://ko-fi.com/你的用户名

# 其他现有配置保持不变...
```

### 3. 数据库迁移

创建迁移脚本: `server-backend/migrations/002_add_kofi_integration.sql`

```sql
-- Ko-fi支付集成数据库迁移
-- 执行日期: 2025-01-16
-- 描述: 添加Ko-fi支付集成所需的数据库字段和表

BEGIN;

-- 1. 扩展用户表
ALTER TABLE users ADD COLUMN IF NOT EXISTS bonus_api_calls INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_free_calls INTEGER DEFAULT 2;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_free_reset DATE DEFAULT CURRENT_DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_month_end DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kofi_email VARCHAR(255);

-- 2. 创建Ko-fi支付记录表
CREATE TABLE IF NOT EXISTS kofi_payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    kofi_transaction_id VARCHAR(255) UNIQUE NOT NULL,
    donor_email VARCHAR(255) NOT NULL,
    donor_name VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    bonus_calls_awarded INTEGER NOT NULL,
    processed_at TIMESTAMP DEFAULT NOW(),
    verification_token VARCHAR(255),
    raw_webhook_data JSONB
);

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_users_kofi_email ON users(kofi_email);
CREATE INDEX IF NOT EXISTS idx_users_last_reset ON users(last_free_reset);
CREATE INDEX IF NOT EXISTS idx_kofi_payments_user_id ON kofi_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_kofi_payments_email ON kofi_payments(donor_email);
CREATE INDEX IF NOT EXISTS idx_kofi_payments_transaction ON kofi_payments(kofi_transaction_id);

-- 4. 初始化现有用户的首月结束时间
UPDATE users
SET first_month_end = created_at + INTERVAL '30 days'
WHERE first_month_end IS NULL;

COMMIT;

-- 验证迁移结果
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
    AND column_name IN ('bonus_api_calls', 'daily_free_calls', 'last_free_reset', 'first_month_end', 'kofi_email')
ORDER BY column_name;

SELECT COUNT(*) as kofi_payments_table_exists
FROM information_schema.tables
WHERE table_name = 'kofi_payments';
```

### 4. 测试流程

1. **Webhook测试**
   ```bash
   # 使用webhook.site测试Ko-fi数据格式
   curl -X POST https://webhook.site/你的测试URL \
        -H "Content-Type: application/json" \
        -d '{"verification_token":"test","type":"Donation","amount":"5.00","email":"test@example.com"}'
   ```

2. **本地测试**
   ```javascript
   // 在浏览器控制台测试API
   fetch('/api/usage/check', {
       headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
   }).then(r => r.json()).then(console.log);
   ```

3. **小额捐赠测试**
   - 使用真实Ko-fi账户进行$1测试捐赠
   - 验证webhook接收和处理
   - 确认用户API次数正确增加

---

## 📋 实施检查清单

### 开发前准备
- [ ] 确认Ko-fi账户已设置完成
- [ ] 获取Ko-fi webhook验证token
- [ ] 准备测试用的邮箱账户
- [ ] 备份当前数据库

### 数据库工作
- [ ] 执行用户表扩展SQL
- [ ] 创建kofi_payments表
- [ ] 创建必要索引
- [ ] 验证表结构正确

### 后端API开发
- [ ] 实现Ko-fi webhook处理端点
- [ ] 更新API限制检查逻辑
- [ ] 更新API使用记录逻辑
- [ ] 添加错误处理和日志

### 前端界面开发
- [ ] 修改UpgradeModal为Ko-fi捐赠页面
- [ ] 创建APIUsageDisplay组件
- [ ] 更新用户界面显示逻辑
- [ ] 添加适当的加载和错误状态

### 测试验证
- [ ] 测试webhook接收和处理
- [ ] 测试免费用户每日重置逻辑
- [ ] 测试捐赠后API次数增加
- [ ] 测试API调用扣费逻辑
- [ ] 测试边缘情况和错误处理

### 部署配置
- [ ] 更新生产环境环境变量
- [ ] 配置Ko-fi webhook URL
- [ ] 测试生产环境webhook接收
- [ ] 监控日志和错误

---

## 🐛 故障排除指南

### 常见问题

1. **Webhook收不到数据**
   - 检查Ko-fi后台webhook URL设置
   - 确认服务器防火墙允许Ko-fi IP访问
   - 查看服务器日志是否有请求记录

2. **用户匹配失败**
   - 确认用户使用的邮箱与注册邮箱一致
   - 检查数据库用户邮箱格式
   - 查看kofi_payments表中的未匹配记录

3. **API次数计算错误**
   - 检查金额解析是否正确
   - 验证Math.floor计算逻辑
   - 查看数据库更新是否成功

4. **免费次数重置问题**
   - 确认服务器时区设置正确
   - 检查last_free_reset字段更新
   - 验证首月结束时间计算

### 调试工具

```javascript
// 调试webhook数据
console.log('[Ko-fi Debug] Webhook data:', JSON.stringify(webhookData, null, 2));

// 调试用户查询
console.log('[Ko-fi Debug] User query result:', userResult.rows);

// 调试API次数计算
console.log('[Ko-fi Debug] Amount:', amountFloat, 'Bonus calls:', bonusCalls);
```

---

## 📈 未来优化计划

### 短期改进
- [ ] 添加支付确认邮件通知
- [ ] 实现管理员后台查看支付记录
- [ ] 添加支付统计和报表
- [ ] 优化错误处理和用户提示

### 长期规划
- [ ] 集成其他支付平台 (Stripe, PayPal)
- [ ] 实现订阅会员制度
- [ ] 添加推荐奖励系统
- [ ] 开发移动端友好的支付流程

---

**文档版本**: v1.0
**最后更新**: 2025-01-15
**状态**: 等待实施

> ⚠️ **重要提醒**: 实施前请仔细阅读所有步骤，确保理解每个环节的作用。建议在测试环境先完整测试一遍，再部署到生产环境。