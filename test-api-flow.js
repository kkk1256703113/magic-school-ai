// 测试API调用流程
// 用于验证从前端到Replicate API的完整链路

const testAPIFlow = async () => {
  console.log('🧪 开始测试API调用流程...\n');
  
  // 测试配置
  const apiToken = process.env.REPLICATE_API_TOKEN || 'YOUR_API_TOKEN_HERE';
  const testContent = '七彩吞天莽';
  
  // Step 1: 测试直接调用Replicate API
  console.log('📍 Step 1: 直接调用Replicate API');
  try {
    const directResponse = await fetch('https://api.replicate.com/v1/models/openai/gpt-5/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: {
          prompt: `生成关于"${testContent}"的HTML可视化页面`
        }
      })
    });
    
    const directResult = await directResponse.json();
    console.log('✅ 直接调用成功:', directResult.id || '成功');
  } catch (error) {
    console.log('❌ 直接调用失败:', error.message);
  }
  
  // Step 2: 测试通过Functions代理
  console.log('\n📍 Step 2: 通过Functions代理调用');
  const proxyUrl = 'https://magicschoolai.net/api/replicate/v1/models/openai/gpt-5/predictions';
  
  try {
    const proxyResponse = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: {
          prompt: `生成关于"${testContent}"的HTML可视化页面`
        }
      })
    });
    
    console.log('响应状态:', proxyResponse.status);
    const proxyResult = await proxyResponse.json();
    console.log('✅ 代理调用成功:', proxyResult.id || '成功');
  } catch (error) {
    console.log('❌ 代理调用失败:', error.message);
  }
  
  // Step 3: 测试前端环境变量
  console.log('\n📍 Step 3: 环境变量检查');
  if (typeof window !== 'undefined') {
    console.log('VITE_REPLICATE_API_TOKEN:', import.meta.env.VITE_REPLICATE_API_TOKEN ? '已配置' : '未配置');
    console.log('生产环境:', import.meta.env.PROD ? '是' : '否');
    console.log('当前域名:', window.location.hostname);
  }
  
  console.log('\n🧪 测试完成！');
};

// 运行测试
if (typeof window !== 'undefined') {
  // 浏览器环境
  window.testAPIFlow = testAPIFlow;
  console.log('🎯 在控制台运行 testAPIFlow() 开始测试');
} else {
  // Node.js环境
  testAPIFlow();
}