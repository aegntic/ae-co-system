const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function auditMVP() {
  console.log('🚀 4site.pro MVP Partnership Readiness Audit\n');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  
  const report = {
    issues: [],
    recommendations: [],
    scores: { overall: 100 }
  };
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Load the standalone HTML
    console.log('📄 Loading standalone application...');
    const htmlPath = path.join(__dirname, 'standalone-working.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    await page.setContent(htmlContent);
    console.log('✅ Application loaded successfully');
    
    // Basic functionality tests
    console.log('\n🔧 Testing Basic Functionality:');
    
    const title = await page.title();
    console.log(`  Title: "${title}"`);
    
    // Check form elements
    const formTests = await page.evaluate(() => {
      const form = document.querySelector('#repoForm');
      const input = document.querySelector('#repoInput');
      const button = document.querySelector('#generateBtn');
      
      return {
        formExists: !!form,
        inputExists: !!input,
        buttonExists: !!button,
        inputPlaceholder: input ? input.placeholder : null
      };
    });
    
    console.log(`  Form present: ${formTests.formExists ? '✅' : '❌'}`);
    console.log(`  Input field: ${formTests.inputExists ? '✅' : '❌'}`);
    console.log(`  Submit button: ${formTests.buttonExists ? '✅' : '❌'}`);
    
    if (formTests.inputPlaceholder) {
      console.log(`  Placeholder text: "${formTests.inputPlaceholder}"`);
    }
    
    // Visual elements check
    console.log('\n🎨 Visual Design Assessment:');
    
    const visualTests = await page.evaluate(() => {
      const logo = document.querySelector('.logo-image, .header-logo, .footer-logo');
      const cards = document.querySelectorAll('.card');
      const background = document.querySelector('.grid-background');
      const footer = document.querySelector('.footer');
      
      // Check for professional styling
      const hasGradients = document.body.innerHTML.includes('gradient');
      const hasAnimations = document.body.innerHTML.includes('animation');
      const hasGlassEffects = document.body.innerHTML.includes('backdrop') || 
                             document.body.innerHTML.includes('blur');
      
      return {
        hasLogo: !!logo,
        cardCount: cards.length,
        hasBackground: !!background,
        hasFooter: !!footer,
        hasGradients,
        hasAnimations,
        hasGlassEffects,
        logoSrc: logo ? logo.src : null
      };
    });
    
    console.log(`  Logo: ${visualTests.hasLogo ? '✅' : '❌'}`);
    console.log(`  Content cards: ${visualTests.cardCount}`);
    console.log(`  Grid background: ${visualTests.hasBackground ? '✅' : '❌'}`);
    console.log(`  Footer: ${visualTests.hasFooter ? '✅' : '❌'}`);
    console.log(`  Gradients: ${visualTests.hasGradients ? '✅' : '❌'}`);
    console.log(`  Animations: ${visualTests.hasAnimations ? '✅' : '❌'}`);
    console.log(`  Glass effects: ${visualTests.hasGlassEffects ? '✅' : '❌'}`);
    
    // Test user interaction
    console.log('\n⚙️ Testing User Interaction:');
    
    // Type in input field
    if (formTests.inputExists) {
      await page.type('#repoInput', 'facebook/react');
      const inputValue = await page.$eval('#repoInput', el => el.value);
      console.log(`  Input typing: ${inputValue === 'facebook/react' ? '✅' : '❌'}`);
    }
    
    // Test demo buttons
    const demoButtons = await page.$$('.demo-buttons .btn');
    console.log(`  Demo buttons: ${demoButtons.length} found`);
    
    // Test form submission
    if (formTests.buttonExists) {
      console.log('  Testing form submission...');
      await page.click('#generateBtn');
      
      // Wait a bit and check for response
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusCheck = await page.evaluate(() => {
        const status = document.querySelector('#statusDisplay');
        return {
          exists: !!status,
          visible: status ? status.style.display !== 'none' : false,
          content: status ? status.textContent.substring(0, 100) : null
        };
      });
      
      console.log(`  Form response: ${statusCheck.visible ? '✅' : '❌'}`);
      if (statusCheck.content) {
        console.log(`  Response preview: "${statusCheck.content}..."`);
      }
    }
    
    // Performance check
    console.log('\n⚡ Performance Assessment:');
    
    const perfMetrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      return nav ? {
        loadTime: Math.round(nav.loadEventEnd - nav.loadEventStart),
        domReady: Math.round(nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart)
      } : { loadTime: 0, domReady: 0 };
    });
    
    console.log(`  Load time: ${perfMetrics.loadTime}ms`);
    console.log(`  DOM ready: ${perfMetrics.domReady}ms`);
    
    // Mobile responsiveness
    console.log('\n📱 Mobile Responsiveness:');
    
    await page.setViewport({ width: 375, height: 667 });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mobileTest = await page.evaluate(() => {
      const form = document.querySelector('#repoForm');
      const buttons = document.querySelectorAll('button');
      
      return {
        formVisible: form ? form.getBoundingClientRect().width > 0 : false,
        buttonCount: buttons.length,
        buttonsAccessible: Array.from(buttons).filter(btn => {
          const rect = btn.getBoundingClientRect();
          return rect.width >= 44 && rect.height >= 44;
        }).length
      };
    });
    
    console.log(`  Form visibility: ${mobileTest.formVisible ? '✅' : '❌'}`);
    console.log(`  Button accessibility: ${mobileTest.buttonsAccessible}/${mobileTest.buttonCount} buttons`);
    
    // Calculate issues and score
    if (!formTests.formExists || !formTests.inputExists || !formTests.buttonExists) {
      report.issues.push('Critical form elements missing');
      report.scores.overall -= 25;
    }
    
    if (!visualTests.hasLogo) {
      report.issues.push('Logo not displaying properly');
      report.scores.overall -= 20;
    }
    
    if (visualTests.cardCount < 3) {
      report.issues.push('Insufficient content for professional appearance');
      report.scores.overall -= 15;
    }
    
    if (perfMetrics.loadTime > 3000) {
      report.issues.push('Page load time exceeds 3 seconds');
      report.scores.overall -= 10;
    }
    
    if (!mobileTest.formVisible) {
      report.issues.push('Poor mobile responsiveness');
      report.scores.overall -= 15;
    }
    
    if (!visualTests.hasGlassEffects) {
      report.recommendations.push('Implement glass morphism effects for modern appeal');
    }
    
    if (!visualTests.hasAnimations) {
      report.recommendations.push('Add animations for better user experience');
    }
    
    // Partnership readiness assessment
    console.log('\n💼 Partnership Readiness Assessment:');
    
    const partnershipFeatures = await page.evaluate(() => {
      const content = document.body.innerHTML.toLowerCase();
      
      return {
        hasDomainFeatures: content.includes('domain') || content.includes('deploy'),
        hasPaymentTerms: content.includes('payment') || content.includes('subscription') || content.includes('pricing'),
        hasBranding: content.includes('4site') || content.includes('project4site'),
        hasIntegrationMentions: content.includes('github') || content.includes('api'),
        hasProfessionalFooter: !!document.querySelector('.footer'),
        hasContactInfo: content.includes('contact') || content.includes('support')
      };
    });
    
    console.log(`  Domain/deployment features: ${partnershipFeatures.hasDomainFeatures ? '✅' : '❌'}`);
    console.log(`  Payment/pricing mentions: ${partnershipFeatures.hasPaymentTerms ? '✅' : '❌'}`);
    console.log(`  Strong branding: ${partnershipFeatures.hasBranding ? '✅' : '❌'}`);
    console.log(`  Integration capabilities: ${partnershipFeatures.hasIntegrationMentions ? '✅' : '❌'}`);
    console.log(`  Professional footer: ${partnershipFeatures.hasProfessionalFooter ? '✅' : '❌'}`);
    console.log(`  Contact information: ${partnershipFeatures.hasContactInfo ? '✅' : '❌'}`);
    
    // Partnership-specific scores
    const porkbunScore = (partnershipFeatures.hasDomainFeatures ? 40 : 0) + 
                        (partnershipFeatures.hasBranding ? 30 : 0) + 
                        (partnershipFeatures.hasProfessionalFooter ? 30 : 0);
    
    const polarScore = (partnershipFeatures.hasPaymentTerms ? 35 : 0) + 
                      (visualTests.hasGlassEffects ? 25 : 0) + 
                      (perfMetrics.loadTime < 3000 ? 25 : 0) + 
                      (mobileTest.formVisible ? 15 : 0);
    
    console.log(`\n🌐 Porkbun Partnership Readiness: ${porkbunScore}/100`);
    console.log(`💳 Polar.sh Partnership Readiness: ${polarScore}/100`);
    
  } catch (error) {
    console.error('❌ Audit failed:', error.message);
    report.issues.push(`Critical error: ${error.message}`);
    report.scores.overall = 0;
  } finally {
    await browser.close();
  }
  
  // Final report
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL AUDIT REPORT');
  console.log('='.repeat(60));
  
  const grade = report.scores.overall >= 90 ? 'A' : 
                report.scores.overall >= 80 ? 'B' : 
                report.scores.overall >= 70 ? 'C' : 
                report.scores.overall >= 60 ? 'D' : 'F';
  
  console.log(`\n🏆 Overall Score: ${report.scores.overall}/100 (Grade: ${grade})`);
  
  const status = report.scores.overall >= 80 ? '🟢 READY FOR PARTNERSHIPS' :
                 report.scores.overall >= 60 ? '🟡 NEEDS IMPROVEMENTS' :
                 '🔴 REQUIRES SIGNIFICANT WORK';
  
  console.log(`📈 Partnership Status: ${status}`);
  
  if (report.issues.length > 0) {
    console.log('\n❌ Issues Found:');
    report.issues.forEach((issue, i) => console.log(`  ${i + 1}. ${issue}`));
  } else {
    console.log('\n✅ No critical issues found!');
  }
  
  if (report.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    report.recommendations.forEach((rec, i) => console.log(`  ${i + 1}. ${rec}`));
  }
  
  console.log('\n🎯 Partnership Strategy:');
  if (report.scores.overall >= 70) {
    console.log('  ✅ Application shows good potential for partnerships');
    console.log('  ✅ Focus on demonstrating unique value proposition');
    console.log('  ✅ Prepare integration documentation for partners');
  } else {
    console.log('  🔧 Address core functionality issues first');
    console.log('  📈 Improve user experience and visual design');
    console.log('  🔄 Re-audit after implementing fixes');
  }
  
  console.log('\n✅ Audit completed successfully!');
}

auditMVP().catch(console.error);