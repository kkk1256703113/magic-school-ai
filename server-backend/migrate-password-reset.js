const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 数据库连接配置
const pool = new Pool({
    user: process.env.DB_USER || 'eduvisualizer_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'eduvisualizer_db',
    password: process.env.DB_PASS || 'EduViz2025Secure',
    port: process.env.DB_PORT || 5432,
});

async function runMigration() {
    console.log('🚀 开始执行密码重置功能数据库迁移...\n');
    
    try {
        // 测试数据库连接
        console.log('1. 测试数据库连接...');
        const testResult = await pool.query('SELECT NOW()');
        console.log(`   ✅ 数据库连接成功 - ${testResult.rows[0].now}`);
        
        // 读取SQL迁移文件
        console.log('\n2. 读取迁移SQL文件...');
        const sqlFile = path.join(__dirname, 'add-password-reset-fields.sql');
        
        if (!fs.existsSync(sqlFile)) {
            throw new Error('SQL迁移文件不存在');
        }
        
        const sql = fs.readFileSync(sqlFile, 'utf8');
        console.log('   ✅ SQL文件读取成功');
        
        // 检查字段是否已存在
        console.log('\n3. 检查现有表结构...');
        const checkResult = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name IN ('reset_token', 'reset_token_expires')
        `);
        
        if (checkResult.rows.length > 0) {
            console.log('   ⚠️  检测到字段已存在，跳过创建步骤');
            const existingColumns = checkResult.rows.map(row => row.column_name);
            console.log(`   已存在字段: ${existingColumns.join(', ')}`);
        } else {
            // 执行迁移
            console.log('\n4. 执行数据库迁移...');
            
            // 添加 reset_token 字段
            await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(64)');
            console.log('   ✅ reset_token 字段添加成功');
            
            // 添加 reset_token_expires 字段
            await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP');
            console.log('   ✅ reset_token_expires 字段添加成功');
            
            // 创建索引
            await pool.query('CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token)');
            console.log('   ✅ reset_token 索引创建成功');
        }
        
        // 验证迁移结果
        console.log('\n5. 验证迁移结果...');
        const verifyResult = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name IN ('reset_token', 'reset_token_expires')
            ORDER BY column_name
        `);
        
        console.log('   表结构验证:');
        verifyResult.rows.forEach(row => {
            console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });
        
        // 检查索引
        const indexResult = await pool.query(`
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename = 'users' 
            AND indexname = 'idx_users_reset_token'
        `);
        
        if (indexResult.rows.length > 0) {
            console.log('   ✅ reset_token 索引验证成功');
        }
        
        console.log('\n🎉 密码重置功能数据库迁移完成！');
        console.log('\n📋 迁移摘要:');
        console.log('   - 添加了 reset_token 字段 (VARCHAR(64))');
        console.log('   - 添加了 reset_token_expires 字段 (TIMESTAMP)');
        console.log('   - 创建了 reset_token 索引');
        console.log('\n🚀 现在可以使用忘记密码功能了！');
        
    } catch (error) {
        console.error('\n❌ 迁移失败:', error.message);
        console.error('\n详细错误信息:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// 执行迁移
if (require.main === module) {
    runMigration().catch(console.error);
}

module.exports = { runMigration };