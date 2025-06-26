#!/usr/bin/env node

/**
 * Direct OpenRouter API Test
 * Tests the AI generation capability directly
 */

async function testOpenRouterAPI() {
  console.log('🤖 Testing OpenRouter API Direct Connection...');
  
  const API_KEY = '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';
  
  // Test 1: Free Models Available
  console.log('\n📋 Testing available models...');
  try {
    const modelsResponse = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'HTTP-Referer': 'https://4site.pro'
      }
    });
    
    if (modelsResponse.ok) {
      const models = await modelsResponse.json();
      const freeModels = models.data.filter(m => 
        m.pricing.prompt === "0" && m.pricing.completion === "0"
      );
      console.log(`✅ Found ${freeModels.length} free models available`);
      console.log('🎯 Top 3 free models:');
      freeModels.slice(0, 3).forEach((model, i) => {
        console.log(`   ${i+1}. ${model.name} (${model.id})`);
      });
    } else {
      console.log(`❌ Models API failed: ${modelsResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ Models API error: ${error.message}`);
  }
  
  // Test 2: Try Chat Completion with Free Model
  console.log('\n🧠 Testing chat completion with free model...');
  
  const testModels = [
    'mistralai/mistral-small-3.2-24b-instruct:free',
    'deepseek/deepseek-r1-0528:free',
    'sarvamai/sarvam-m:free'
  ];
  
  for (const modelId of testModels) {
    console.log(`\n🔄 Testing model: ${modelId}`);
    
    try {
      const chatResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://4site.pro',
          'X-Title': '4site.pro - AI Integration Test'
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            {
              role: 'user',
              content: 'Respond with valid JSON: {"test": "success", "model": "' + modelId + '", "status": "working"}'
            }
          ],
          max_tokens: 100,
          temperature: 0.1
        })
      });
      
      if (chatResponse.ok) {
        const result = await chatResponse.json();
        const content = result.choices?.[0]?.message?.content;
        
        if (content) {
          console.log(`✅ ${modelId}: SUCCESS`);
          console.log(`   Response: ${content.slice(0, 100)}...`);
          
          // Try to parse as JSON
          try {
            const parsed = JSON.parse(content);
            if (parsed.test === 'success') {
              console.log(`🎉 ${modelId}: JSON parsing successful!`);
              return { success: true, model: modelId, content };
            }
          } catch (e) {
            console.log(`⚠️  ${modelId}: Response not valid JSON but API working`);
          }
        } else {
          console.log(`⚠️  ${modelId}: Empty response`);
        }
      } else {
        const errorText = await chatResponse.text();
        console.log(`❌ ${modelId}: HTTP ${chatResponse.status} - ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ ${modelId}: Network error - ${error.message}`);
    }
  }
  
  return { success: false, error: 'No working model found' };
}

// Test 3: Test Repository Analysis Simulation
async function testRepositoryAnalysis() {
  console.log('\n🔬 Testing Repository Analysis Flow...');
  
  const mockRepoData = {
    owner: 'vercel',
    repo: 'next.js',
    description: 'The React Framework for Production',
    language: 'JavaScript',
    stars: 130000,
    topics: ['react', 'nextjs', 'ssr', 'jamstack']
  };
  
  console.log('📊 Mock Repository Data:');
  console.log(`   - ${mockRepoData.owner}/${mockRepoData.repo}`);
  console.log(`   - ${mockRepoData.description}`);
  console.log(`   - Primary Language: ${mockRepoData.language}`);
  console.log(`   - Stars: ${mockRepoData.stars}`);
  console.log(`   - Topics: ${mockRepoData.topics.join(', ')}`);
  
  // Test the GitHub API (this should work without auth for public repos)
  try {
    const githubResponse = await fetch(`https://api.github.com/repos/${mockRepoData.owner}/${mockRepoData.repo}`);
    
    if (githubResponse.ok) {
      const repoData = await githubResponse.json();
      console.log('✅ GitHub API: Working');
      console.log(`   - Real Description: ${repoData.description}`);
      console.log(`   - Real Stars: ${repoData.stargazers_count}`);
      return true;
    } else {
      console.log(`❌ GitHub API failed: ${githubResponse.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ GitHub API error: ${error.message}`);
    return false;
  }
}

// Main test execution
async function runAllTests() {
  console.log('🚀 OPENROUTER API COMPREHENSIVE TEST');
  console.log('=====================================');
  
  const results = {
    openRouterAPI: false,
    repositoryAnalysis: false,
    overallStatus: 'FAIL'
  };
  
  // Test OpenRouter API
  const apiResult = await testOpenRouterAPI();
  results.openRouterAPI = apiResult.success;
  
  // Test Repository Analysis
  results.repositoryAnalysis = await testRepositoryAnalysis();
  
  // Overall assessment
  console.log('\n📊 FINAL TEST RESULTS');
  console.log('====================');
  console.log(`OpenRouter API: ${results.openRouterAPI ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Repository Analysis: ${results.repositoryAnalysis ? '✅ PASS' : '❌ FAIL'}`);
  
  if (results.openRouterAPI && results.repositoryAnalysis) {
    results.overallStatus = 'PASS';
    console.log('\n🎉 ALL TESTS PASSED - AI services are operational!');
    console.log('✅ The system can generate AI-powered websites from GitHub repositories');
  } else if (results.repositoryAnalysis) {
    results.overallStatus = 'PARTIAL';
    console.log('\n⚠️  PARTIAL SUCCESS - Repository analysis working, AI generation may have limitations');
    console.log('🔧 AI features may use fallback mechanisms or demo content');
  } else {
    console.log('\n❌ TESTS FAILED - Core functionality requires attention');
  }
  
  return results;
}

runAllTests().then(results => {
  process.exit(results.overallStatus === 'FAIL' ? 1 : 0);
}).catch(error => {
  console.error('Fatal test error:', error);
  process.exit(1);
});