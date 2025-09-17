// Node.js v18+ has built-in fetch
const API_BASE = 'http://45.77.86.20:3001';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'testpassword123';

console.log('🚀 测试API端点修复情况...\n');

async function testEndpoints() {
    try {
        // 1. 测试健康检查
        console.log('1️⃣ 测试健康检查端点...');
        const healthRes = await fetch(`${API_BASE}/api/health`);
        console.log(`   GET /api/health: ${healthRes.status} ${healthRes.statusText}`);
        if (healthRes.ok) {
            const health = await healthRes.json();
            console.log(`   ✅ 服务状态: ${health.status}`);
        }
        
        // 2. 测试登录
        console.log('\n2️⃣ 测试登录端点...');
        const loginRes = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
        });
        console.log(`   POST /auth/login: ${loginRes.status} ${loginRes.statusText}`);
        
        let token = null;
        if (loginRes.ok) {
            const loginData = await loginRes.json();
            token = loginData.token;
            console.log(`   ✅ 登录成功，获得token`);
        } else {
            const error = await loginRes.json();
            console.log(`   ⚠️ 登录失败: ${error.message || error.error}`);
        }
        
        // 3. 测试认证状态
        console.log('\n3️⃣ 测试认证状态端点...');
        const statusRes = await fetch(`${API_BASE}/auth/status`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        console.log(`   GET /auth/status: ${statusRes.status} ${statusRes.statusText}`);
        if (statusRes.ok) {
            const status = await statusRes.json();
            console.log(`   ✅ 认证状态: ${status.authenticated ? '已认证' : '未认证'}`);
        }
        
        // 4. 测试使用量检查
        console.log('\n4️⃣ 测试使用量检查端点...');
        const usageRes = await fetch(`${API_BASE}/usage/check`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        console.log(`   GET /usage/check: ${usageRes.status} ${usageRes.statusText}`);
        if (usageRes.ok) {
            const usage = await usageRes.json();
            console.log(`   ✅ 剩余调用次数: ${usage.apiCallsRemaining}`);
        }
        
        // 5. 测试记录使用量
        console.log('\n5️⃣ 测试记录使用量端点...');
        const recordRes = await fetch(`${API_BASE}/usage/record`, {
            method: 'POST',
            headers: token ? { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            } : { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                endpoint: 'test',
                model: 'gpt-5',
                cost: 0.01,
                success: true
            })
        });
        console.log(`   POST /usage/record: ${recordRes.status} ${recordRes.statusText}`);
        if (recordRes.ok) {
            const record = await recordRes.json();
            console.log(`   ✅ ${record.message}`);
        }
        
        console.log('\n✨ API端点测试完成！');
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    }
}

testEndpoints();