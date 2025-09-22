-- Ko-fi支付集成数据库迁移
-- 执行日期: 2025-01-16
-- 描述: 添加Ko-fi支付集成所需的数据库字段和表

BEGIN;

-- 1. 扩展用户表，添加支付相关字段
ALTER TABLE users
ADD COLUMN IF NOT EXISTS bonus_api_calls INTEGER DEFAULT 20,  -- 新用户初始20次免费调用
ADD COLUMN IF NOT EXISTS kofi_email VARCHAR(255),            -- Ko-fi支付邮箱
ADD COLUMN IF NOT EXISTS is_first_time_user BOOLEAN DEFAULT true;  -- 首次用户标识

-- 2. 创建Ko-fi支付记录表
CREATE TABLE IF NOT EXISTS kofi_payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    kofi_transaction_id VARCHAR(255) UNIQUE NOT NULL,
    message_id VARCHAR(255),
    donor_email VARCHAR(255) NOT NULL,
    donor_name VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    bonus_calls_awarded INTEGER NOT NULL,  -- 本次奖励的调用次数
    bonus_percentage INTEGER DEFAULT 0,    -- bonus百分比
    message TEXT,                          -- 捐赠留言
    is_public BOOLEAN DEFAULT true,
    processed_at TIMESTAMP DEFAULT NOW(),
    verification_token VARCHAR(255),
    raw_webhook_data JSONB,               -- 保存原始webhook数据

    CONSTRAINT unique_kofi_transaction UNIQUE (kofi_transaction_id)
);

-- 3. 创建API使用日志表（用于追踪详细使用情况）
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    endpoint VARCHAR(255),
    model VARCHAR(100),
    cost INTEGER DEFAULT 1,
    success BOOLEAN DEFAULT true,
    used_type VARCHAR(50),  -- 'bonus' or 'free'
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_users_kofi_email ON users(kofi_email);
CREATE INDEX IF NOT EXISTS idx_users_bonus_calls ON users(bonus_api_calls);
CREATE INDEX IF NOT EXISTS idx_kofi_payments_user_id ON kofi_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_kofi_payments_email ON kofi_payments(donor_email);
CREATE INDEX IF NOT EXISTS idx_kofi_payments_transaction ON kofi_payments(kofi_transaction_id);
CREATE INDEX IF NOT EXISTS idx_kofi_payments_processed_at ON kofi_payments(processed_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_id ON api_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON api_usage_logs(created_at);

-- 5. 更新现有用户的初始值
UPDATE users
SET bonus_api_calls = CASE
    WHEN api_calls_today > 0 THEN 0  -- 已使用过的用户不给免费次数
    ELSE 20                            -- 未使用过的用户给20次免费
END
WHERE bonus_api_calls IS NULL;

COMMIT;

-- 验证迁移结果
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
    AND column_name IN ('bonus_api_calls', 'kofi_email', 'is_first_time_user')
ORDER BY column_name;

SELECT COUNT(*) as kofi_payments_table_exists
FROM information_schema.tables
WHERE table_name = 'kofi_payments';

SELECT COUNT(*) as api_usage_logs_table_exists
FROM information_schema.tables
WHERE table_name = 'api_usage_logs';