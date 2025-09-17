/**
 * OAuth数据库迁移脚本
 * 添加OAuth相关字段到users表
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'eduvisualizer_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'eduvisualizer_db',
    password: process.env.DB_PASS || 'EduViz2025Secure',
    port: process.env.DB_PORT || 5432,
});

async function migrate() {
    const client = await pool.connect();
    
    try {
        console.log('开始OAuth数据库迁移...');
        
        // 开始事务
        await client.query('BEGIN');
        
        // 添加OAuth相关字段
        const alterTableQueries = [
            // 添加OAuth提供商字段
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(20)`,
            
            // 添加OAuth ID字段
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(100)`,
            
            // 添加用户头像URL字段
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`,
            
            // 创建索引以加快OAuth查询
            `CREATE INDEX IF NOT EXISTS idx_oauth_provider ON users(oauth_provider, oauth_id)`
        ];
        
        for (const query of alterTableQueries) {
            console.log(`执行: ${query}`);
            await client.query(query);
        }
        
        // 检查现有用户表结构
        const checkResult = await client.query(`
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_name = 'users'
            ORDER BY ordinal_position
        `);
        
        console.log('\n当前users表结构:');
        console.table(checkResult.rows);
        
        // 提交事务
        await client.query('COMMIT');
        
        console.log('\n✅ OAuth数据库迁移成功完成！');
        
        // 显示统计信息
        const statsResult = await client.query(`
            SELECT 
                COUNT(*) as total_users,
                COUNT(oauth_provider) as oauth_users,
                COUNT(CASE WHEN oauth_provider = 'google' THEN 1 END) as google_users,
                COUNT(CASE WHEN oauth_provider = 'github' THEN 1 END) as github_users
            FROM users
        `);
        
        console.log('\n用户统计:');
        console.table(statsResult.rows[0]);
        
    } catch (error) {
        // 回滚事务
        await client.query('ROLLBACK');
        console.error('❌ 迁移失败:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// 执行迁移
if (require.main === module) {
    migrate()
        .then(() => {
            console.log('\n迁移脚本执行完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n迁移脚本执行失败:', error);
            process.exit(1);
        });
}

module.exports = migrate;