-- 添加OAuth支持字段到用户表
-- 执行日期: 2025-01-09
-- 描述: 为Google和GitHub OAuth登录添加必要字段

-- 检查用户表是否存在OAuth字段，如果不存在则添加
DO $$
BEGIN
    -- 添加OAuth提供商字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'oauth_provider') THEN
        ALTER TABLE users ADD COLUMN oauth_provider VARCHAR(50);
        RAISE NOTICE 'Added oauth_provider column to users table';
    END IF;

    -- 添加OAuth ID字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'oauth_id') THEN
        ALTER TABLE users ADD COLUMN oauth_id VARCHAR(255);
        RAISE NOTICE 'Added oauth_id column to users table';
    END IF;

    -- 添加最后登录时间字段 (如果不存在)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'last_login') THEN
        ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
        RAISE NOTICE 'Added last_login column to users table';
    END IF;

    -- 添加总API调用次数字段 (如果不存在)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'api_calls_total') THEN
        ALTER TABLE users ADD COLUMN api_calls_total INTEGER DEFAULT 0;
        RAISE NOTICE 'Added api_calls_total column to users table';
    END IF;
END $$;

-- 为OAuth字段创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_oauth_provider_id 
ON users(oauth_provider, oauth_id);

-- 为邮箱创建唯一索引 (如果不存在)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique 
ON users(email);

-- 显示当前用户表结构
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;