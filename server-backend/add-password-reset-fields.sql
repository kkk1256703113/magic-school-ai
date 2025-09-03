-- 添加密码重置相关字段到users表
-- 执行此脚本之前，请确保已经连接到正确的数据库

-- 添加重置令牌字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(64);

-- 添加重置令牌过期时间字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

-- 显示表结构以确认更改
\d users;

-- 插入测试说明
-- 这些字段的用途：
-- reset_token: 存储32字节的十六进制字符串（64个字符）
-- reset_token_expires: 存储令牌过期时间（通常为30分钟后）