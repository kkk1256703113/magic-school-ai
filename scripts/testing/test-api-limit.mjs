// 测试API限制检查修复
const API_BASE = 'http://45.77.86.20:3001';

console.log('🔍 测试API限制检查修复...\n');

async function testAPILimit() {
    try {
        // 1. 首先获取一个测试token（使用管理员账号）
        console.log('1️⃣ 尝试登录获取token...');
        // 注意：这里需要您提供实际的管理员账号
        // 如果您有测试账号，请替换这里的邮箱和密码
        const loginRes = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: 'admin@magicschool.ai',  // 请替换为实际管理员邮箱
                password: 'your_password_here'   // 请替换为实际密码
            })
        });
        
        if (!loginRes.ok) {
            console.log('❌ 登录失败，请检查账号密码');
            console.log('   请在test-api-limit.mjs中更新第13-14行的邮箱和密码');
            return;
        }
        
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('✅ 登录成功，获得token');
        console.log(`   用户: ${loginData.user.email}`);
        console.log(`   计划: ${loginData.user.plan}`);
        
        // 2. 测试/usage/check端点
        console.log('\n2️⃣ 测试API使用限制检查...');
        const usageRes = await fetch(`${API_BASE}/usage/check`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!usageRes.ok) {
            console.log(`❌ 使用量检查失败: ${usageRes.status} ${usageRes.statusText}`);
            return;
        }
        
        const usageData = await usageRes.json();
        console.log('✅ API使用量检查成功:');
        console.log(`   原始响应:`, usageData);
        console.log('\n📊 字段分析:');
        console.log(`   - apiCallsRemaining: ${usageData.apiCallsRemaining} (后端实际字段)`);
        console.log(`   - apiCallsToday: ${usageData.apiCallsToday}`);
        console.log(`   - plan: ${usageData.plan}`);
        console.log(`   - dailyLimit: ${usageData.dailyLimit}`);
        
        // 3. 模拟前端转换逻辑
        console.log('\n3️⃣ 模拟前端转换逻辑...');
        const frontendFormat = {
            canUse: usageData.apiCallsRemaining > 0,
            remaining: usageData.apiCallsRemaining
        };
        console.log('   前端格式化后:');
        console.log(`   - canUse: ${frontendFormat.canUse}`);
        console.log(`   - remaining: ${frontendFormat.remaining}`);
        
        // 4. 验证修复效果
        console.log('\n4️⃣ 验证修复效果...');
        if (frontendFormat.canUse === true && frontendFormat.remaining > 0) {
            console.log('✅ 修复成功！API限制检查正常工作');
            console.log(`   用户可以调用API，剩余次数: ${frontendFormat.remaining}`);
        } else if (frontendFormat.canUse === false && frontendFormat.remaining === 0) {
            console.log('⚠️ 用户已达到API调用限制');
            console.log('   这是正常的限制行为');
        } else {
            console.log('❌ 数据格式仍有问题');
        }
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    }
}

testAPILimit();