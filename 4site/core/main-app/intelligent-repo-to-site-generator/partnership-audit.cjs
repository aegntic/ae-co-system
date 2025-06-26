const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function auditPartnershipReadiness() {
  console.log('🚀 Starting comprehensive audit of 4site.pro MVP for partnership readiness...\n');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  let report = {
    scores: {},
    issues: [],
    recommendations: [],
    partnershipsReadiness: {}
  };
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Load the standalone HTML file
    console.log('📄 Loading standalone HTML application...');
    const htmlPath = path.join(__dirname, 'standalone-working.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    await page.setContent(htmlContent);
    
    console.log('✅ Successfully loaded application\n');
    
    // === BASIC FUNCTIONALITY TESTS ===
    console.log('🔧 TESTING BASIC FUNCTIONALITY:');
    
    const title = await page.title();
    console.log(`  📄 Page title: "${title}"`);
    
    // Test form elements
    const formExists = await page.$('#repoForm') !== null;
    const inputExists = await page.$('#repoInput') !== null;
    const buttonExists = await page.$('#generateBtn') !== null;
    
    console.log('  🔍 Form elements:');
    console.log(`    - Form: ${formExists ? '✅' : '❌'}`);
    console.log(`    - Input: ${inputExists ? '✅' : '❌'}`);
    console.log(`    - Button: ${buttonExists ? '✅' : '❌'}`);
    
    if (!formExists || !inputExists || !buttonExists) {
      report.issues.push('Critical form elements missing');
    }
    
    // Test input functionality
    if (inputExists) {
      await page.type('#repoInput', 'facebook/react');
      const inputValue = await page.$eval('#repoInput', el => el.value);
      console.log(`  ✍️ Input functionality: ${inputValue === 'facebook/react' ? '✅' : '❌'}`);
      
      if (inputValue !== 'facebook/react') {
        report.issues.push('Input field not accepting user input correctly');
      }
    }
    
    // Test demo buttons
    const demoButtons = await page.$$('.demo-buttons .btn');
    console.log(`  🎯 Demo buttons found: ${demoButtons.length}`);
    
    if (demoButtons.length === 0) {
      report.issues.push('Demo buttons not found - important for user onboarding');
    }
    
    // === VISUAL DESIGN ASSESSMENT ===
    console.log('\n🎨 VISUAL DESIGN ASSESSMENT:');
    
    const visualElements = await page.evaluate(() => {
      return {
        gridBackground: !!document.querySelector('.grid-background'),
        logo: !!document.querySelector('.logo-image, .header-logo'),
        cards: document.querySelectorAll('.card').length,
        animations: !!document.querySelector('[class*="animation"], [style*="animation"]'),
        glassMorphism: !!document.querySelector('[class*="glass"], [class*="backdrop"], [style*="backdrop-filter"]')
      };
    });
    
    console.log('  🖼️ Visual elements:');
    console.log(`    - Grid background: ${visualElements.gridBackground ? '✅' : '❌'}`);
    console.log(`    - Logo present: ${visualElements.logo ? '✅' : '❌'}`);
    console.log(`    - Cards: ${visualElements.cards} found`);
    console.log(`    - Animations: ${visualElements.animations ? '✅' : '❌'}`);
    console.log(`    - Glass morphism: ${visualElements.glassMorphism ? '✅' : '❌'}`);
    
    if (!visualElements.logo) {
      report.issues.push('Logo not displaying - critical for brand recognition');
    }
    
    if (visualElements.cards < 3) {
      report.issues.push('Insufficient content cards for professional appearance');
    }
    
    // === FUNCTIONALITY TESTING ===
    console.log('\n⚙️ FUNCTIONALITY TESTING:');
    
    // Test form submission
    console.log('  🔄 Testing form submission...');
    await page.click('#generateBtn');
    await page.waitForTimeout(3000);
    
    const statusDisplay = await page.$('#statusDisplay');
    const statusVisible = statusDisplay ? await page.evaluate(el => {
      return el && el.style.display !== 'none';
    }, statusDisplay) : false;
    
    console.log(`    - Form submission response: ${statusVisible ? '✅' : '❌'}`);
    
    if (!statusVisible) {
      report.issues.push('Form submission not providing user feedback');
    }
    
    // Test JavaScript functionality
    const jsWorking = await page.evaluate(() => {
      return typeof window.testJS === 'function';
    });
    console.log(`  🔧 JavaScript execution: ${jsWorking ? '✅' : '❌'}`);
    
    if (!jsWorking) {
      report.issues.push('JavaScript functionality not fully operational');
    }
    
    // === PERFORMANCE TESTING ===
    console.log('\n⚡ PERFORMANCE ASSESSMENT:');
    
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        loadTime: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
        domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart)
      };
    });
    
    console.log(`  ⏱️ Load time: ${performanceMetrics.loadTime}ms`);
    console.log(`  🏗️ DOM ready: ${performanceMetrics.domContentLoaded}ms`);
    
    if (performanceMetrics.loadTime > 3000) {
      report.issues.push('Page load time exceeds 3 seconds - may impact user experience');
    }
    
    report.scores.performance = Math.max(0, 100 - Math.floor(performanceMetrics.loadTime / 100));
    
    // === MOBILE RESPONSIVENESS ===
    console.log('\n📱 MOBILE RESPONSIVENESS:');
    
    await page.setViewport({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const mobileElements = await page.evaluate(() => {
      const form = document.querySelector('.repo-form, #repoForm');
      const buttons = document.querySelectorAll('button');
      
      return {
        formVisible: form ? form.getBoundingClientRect().width > 0 : false,
        buttonsAccessible: Array.from(buttons).every(btn => {
          const rect = btn.getBoundingClientRect();
          return rect.width >= 44 && rect.height >= 44; // iOS accessibility guidelines
        })
      };
    });
    
    console.log(`  📝 Form visibility: ${mobileElements.formVisible ? '✅' : '❌'}`);
    console.log(`  👆 Button accessibility: ${mobileElements.buttonsAccessible ? '✅' : '❌'}`);
    
    if (!mobileElements.formVisible) {
      report.issues.push('Form not properly responsive on mobile devices');
    }
    
    // Reset to desktop
    await page.setViewport({ width: 1280, height: 800 });
    
    // === PARTNERSHIP READINESS ASSESSMENT ===
    console.log('\n💼 PARTNERSHIP READINESS ASSESSMENT:');
    
    // Check for integration points
    const integrationPoints = await page.evaluate(() => {
      const codeElements = document.querySelectorAll('code, pre, [class*="code"], [class*="syntax"]');
      const deploymentRefs = document.body.innerHTML.toLowerCase().includes('deploy') || 
                           document.body.innerHTML.toLowerCase().includes('github pages') ||
                           document.body.innerHTML.toLowerCase().includes('vercel');
      const domainRefs = document.body.innerHTML.toLowerCase().includes('domain') ||
                        document.body.innerHTML.toLowerCase().includes('dns');
      
      return {
        hasCodeElements: codeElements.length > 0,
        hasDeploymentFeatures: deploymentRefs,
        hasDomainFeatures: domainRefs,
        professionalFooter: !!document.querySelector('.footer, [class*="footer"]')
      };
    });
    
    console.log('  🔗 Integration readiness:');
    console.log(`    - Code/technical elements: ${integrationPoints.hasCodeElements ? '✅' : '❌'}`);
    console.log(`    - Deployment features: ${integrationPoints.hasDeploymentFeatures ? '✅' : '❌'}`);
    console.log(`    - Domain features: ${integrationPoints.hasDomainFeatures ? '✅' : '❌'}`);
    console.log(`    - Professional footer: ${integrationPoints.professionalFooter ? '✅' : '❌'}`);
    
    // Partnership-specific assessments
    report.partnershipsReadiness.porkbun = {
      score: 0,
      reasons: []
    };
    
    report.partnershipsReadiness.polar = {
      score: 0,
      reasons: []
    };
    
    // Porkbun readiness (domain management)
    if (integrationPoints.hasDomainFeatures) {
      report.partnershipsReadiness.porkbun.score += 30;
      report.partnershipsReadiness.porkbun.reasons.push('Domain functionality mentioned');
    }
    
    if (integrationPoints.hasDeploymentFeatures) {
      report.partnershipsReadiness.porkbun.score += 25;
      report.partnershipsReadiness.porkbun.reasons.push('Deployment features available');
    }
    
    if (integrationPoints.professionalFooter) {
      report.partnershipsReadiness.porkbun.score += 20;
      report.partnershipsReadiness.porkbun.reasons.push('Professional presentation');
    }
    
    if (visualElements.logo) {
      report.partnershipsReadiness.porkbun.score += 25;
      report.partnershipsReadiness.porkbun.reasons.push('Strong branding present');
    }
    
    // Polar.sh readiness (payment processing)
    if (statusVisible) {
      report.partnershipsReadiness.polar.score += 35;
      report.partnershipsReadiness.polar.reasons.push('User interaction flow working');
    }
    
    if (visualElements.glassMorphism) {
      report.partnershipsReadiness.polar.score += 20;
      report.partnershipsReadiness.polar.reasons.push('Modern, premium UI design');
    }
    
    if (performanceMetrics.loadTime < 3000) {
      report.partnershipsReadiness.polar.score += 25;
      report.partnershipsReadiness.polar.reasons.push('Good performance metrics');
    }
    
    if (mobileElements.formVisible) {
      report.partnershipsReadiness.polar.score += 20;
      report.partnershipsReadiness.polar.reasons.push('Mobile-friendly design');
    }
    
    // === CALCULATE OVERALL SCORES ===
    let overallScore = 100;
    overallScore -= report.issues.length * 8;
    overallScore -= (performanceMetrics.loadTime > 3000) ? 15 : 0;
    overallScore -= (!visualElements.logo) ? 20 : 0;
    overallScore -= (!statusVisible) ? 10 : 0;
    overallScore -= (!mobileElements.formVisible) ? 15 : 0;
    
    report.scores.overall = Math.max(0, overallScore);
    
    // === GENERATE RECOMMENDATIONS ===
    if (report.issues.length === 0) {
      report.recommendations.push('Application shows strong partnership readiness');
    }
    
    if (report.partnershipsReadiness.porkbun.score < 80) {
      report.recommendations.push('Add more explicit domain management features for Porkbun partnership');
    }
    
    if (report.partnershipsReadiness.polar.score < 80) {
      report.recommendations.push('Enhance premium features presentation for Polar.sh partnership');
    }
    
    if (performanceMetrics.loadTime > 2000) {
      report.recommendations.push('Optimize performance for better user experience');
    }
    
    if (!visualElements.glassMorphism) {
      report.recommendations.push('Implement glass morphism effects as planned for modern appeal');
    }
    
  } catch (error) {
    console.error('❌ Audit failed:', error.message);
    report.issues.push(`Critical error during testing: ${error.message}`);
  } finally {
    await browser.close();
  }
  
  // === GENERATE FINAL REPORT ===
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL PARTNERSHIP READINESS REPORT');
  console.log('='.repeat(60));
  
  const grade = report.scores.overall >= 90 ? 'A' : 
                report.scores.overall >= 80 ? 'B' : 
                report.scores.overall >= 70 ? 'C' : 
                report.scores.overall >= 60 ? 'D' : 'F';
  
  console.log(`\n🏆 OVERALL SCORE: ${report.scores.overall}/100 (Grade: ${grade})`);
  
  const readinessLevel = report.scores.overall >= 85 ? '🟢 READY FOR PARTNERSHIPS' :
                        report.scores.overall >= 70 ? '🟡 NEEDS MINOR IMPROVEMENTS' :
                        '🔴 REQUIRES SIGNIFICANT WORK';
  
  console.log(`📈 STATUS: ${readinessLevel}`);
  
  console.log('\n🤝 PARTNERSHIP SPECIFIC READINESS:');
  console.log(`  🌐 Porkbun (Domain Management): ${report.partnershipsReadiness.porkbun.score}/100`);
  report.partnershipsReadiness.porkbun.reasons.forEach(reason => {
    console.log(`    ✓ ${reason}`);
  });
  
  console.log(`  💳 Polar.sh (Payment Processing): ${report.partnershipsReadiness.polar.score}/100`);
  report.partnershipsReadiness.polar.reasons.forEach(reason => {
    console.log(`    ✓ ${reason}`);
  });
  
  if (report.issues.length > 0) {
    console.log('\n❌ ISSUES IDENTIFIED:');
    report.issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
  }
  
  if (report.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    report.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }
  
  console.log('\n🎯 NEXT STEPS FOR PARTNERSHIPS:');
  
  if (report.scores.overall >= 80) {
    console.log('  ✅ Application is ready for partnership discussions');
    console.log('  ✅ Consider preparing partnership demo materials');
    console.log('  ✅ Document integration capabilities for partners');
  } else {
    console.log('  🔧 Address identified issues before partnership outreach');
    console.log('  📈 Focus on improving user experience and functionality');
    console.log('  🔄 Re-run audit after improvements');
  }
  
  console.log('\n✅ Partnership readiness audit completed!');
  
  return report;
}

// Run the audit
auditPartnershipReadiness().catch(console.error);