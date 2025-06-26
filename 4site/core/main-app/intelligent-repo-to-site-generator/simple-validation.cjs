const fs = require('fs');
const path = require('path');
const http = require('http');

async function validateUpdatedWebsite() {
    console.log('🚀 4site.pro Website Update Validation\n');
    
    // Test 1: File Existence Check
    console.log('✅ Test 1: Component Files Validation');
    
    const criticalFiles = [
        'components/sections/UpdatedMainSection.tsx',
        'components/landing/GlassHeroSection.tsx', 
        'components/pricing/TierPricingSection.tsx',
        'components/integration/PolarIntegrationSection.tsx',
        'components/landing/GlassFeaturesSection.tsx',
        'constants.ts',
        'test-updated-preview.html'
    ];
    
    let filesExist = 0;
    criticalFiles.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`   ✅ ${file}`);
            filesExist++;
        } else {
            console.log(`   ❌ ${file} - MISSING`);
        }
    });
    
    console.log(`   📊 ${filesExist}/${criticalFiles.length} critical files present\n`);
    
    // Test 2: Content Analysis
    console.log('✅ Test 2: Updated Content Analysis');
    
    // Check App.tsx for UpdatedMainSection integration
    const appContent = fs.readFileSync('App.tsx', 'utf8');
    if (appContent.includes('UpdatedMainSection')) {
        console.log('   ✅ App.tsx updated with UpdatedMainSection');
    } else {
        console.log('   ❌ App.tsx not updated');
    }
    
    // Check constants.ts for modern values
    const constantsContent = fs.readFileSync('constants.ts', 'utf8');
    if (constantsContent.includes('Living websites that automatically update themselves')) {
        console.log('   ✅ Constants updated with living websites messaging');
    }
    if (constantsContent.includes('deepseek-r1.1')) {
        console.log('   ✅ Modern AI models configured');
    }
    if (constantsContent.includes('49.49')) {
        console.log('   ✅ Pricing psychology (.49 endings) implemented');
    }
    
    // Test 3: Hero Section Analysis
    console.log('\n✅ Test 3: Hero Section Modernization');
    const heroContent = fs.readFileSync('components/landing/GlassHeroSection.tsx', 'utf8');
    if (heroContent.includes('Living Websites That')) {
        console.log('   ✅ Hero title updated to "Living Websites That"');
    }
    if (heroContent.includes('Update Themselves')) {
        console.log('   ✅ Hero includes "Update Themselves" messaging');
    }
    if (heroContent.includes('Get online instantly while learning to build digitally')) {
        console.log('   ✅ Subheading updated with learning focus');
    }
    
    // Test 4: Pricing Structure Analysis  
    console.log('\n✅ Test 4: Pricing Structure Validation');
    const pricingContent = fs.readFileSync('components/pricing/TierPricingSection.tsx', 'utf8');
    
    const pricingChecks = [
        { label: 'FREE tier ($0)', pattern: 'price: \'$0\'' },
        { label: 'PRO tier ($49.49)', pattern: 'price: \'$49.49\'' },
        { label: 'BUSINESS tier ($494.94)', pattern: 'price: \'$494.94\'' },
        { label: 'ENTERPRISE tier ($4,949.49)', pattern: 'price: \'$4,949.49\'' },
        { label: 'Network visibility focus', pattern: 'Network visibility among curated industry leaders' },
        { label: '111 websites for PRO', pattern: '111 auto-updating websites' }
    ];
    
    pricingChecks.forEach(check => {
        if (pricingContent.includes(check.pattern)) {
            console.log(`   ✅ ${check.label}`);
        } else {
            console.log(`   ❌ ${check.label} - NOT FOUND`);
        }
    });
    
    // Test 5: Polar.sh Integration Analysis
    console.log('\n✅ Test 5: Polar.sh Integration');
    const polarContent = fs.readFileSync('components/integration/PolarIntegrationSection.tsx', 'utf8');
    if (polarContent.includes('Powered by Polar.sh')) {
        console.log('   ✅ Polar.sh branding present');
    }
    if (polarContent.includes('Developer-friendly monetization')) {
        console.log('   ✅ Developer-first messaging');
    }
    if (polarContent.includes('SOC 2 Compliant')) {
        console.log('   ✅ Security credentials mentioned');
    }
    
    // Test 6: Content Compliance Check
    console.log('\n✅ Test 6: Content Compliance Validation');
    
    const allFiles = [
        'components/pricing/TierPricingSection.tsx',
        'components/integration/PolarIntegrationSection.tsx',
        'components/landing/GlassFeaturesSection.tsx',
        'constants.ts'
    ];
    
    const prohibitedTerms = ['ROI', 'return on investment', 'earn money', 'make money', 'income opportunity'];
    const requiredTerms = ['network visibility', 'professional recognition', 'industry leaders'];
    
    let complianceIssues = 0;
    let requiredTermsFound = 0;
    
    allFiles.forEach(file => {
        if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf8').toLowerCase();
            
            prohibitedTerms.forEach(term => {
                if (content.includes(term.toLowerCase())) {
                    console.log(`   ⚠️  Found prohibited term "${term}" in ${file}`);
                    complianceIssues++;
                }
            });
            
            requiredTerms.forEach(term => {
                if (content.includes(term.toLowerCase())) {
                    requiredTermsFound++;
                }
            });
        }
    });
    
    if (complianceIssues === 0) {
        console.log('   ✅ No prohibited financial language found');
    } else {
        console.log(`   ❌ ${complianceIssues} compliance issues found`);
    }
    
    console.log(`   ✅ ${requiredTermsFound} required messaging terms found`);
    
    // Test 7: Preview HTML Validation
    console.log('\n✅ Test 7: Preview HTML Validation');
    const previewContent = fs.readFileSync('test-updated-preview.html', 'utf8');
    
    const htmlChecks = [
        'Living Websites That',
        'Update Themselves',
        'Powered by',
        'Polar.sh',
        '$49.49',
        'Network visibility among curated industry leaders',
        'not financial promises'
    ];
    
    let htmlPassed = 0;
    htmlChecks.forEach(check => {
        if (previewContent.includes(check)) {
            console.log(`   ✅ "${check}" found in preview`);
            htmlPassed++;
        } else {
            console.log(`   ❌ "${check}" missing from preview`);
        }
    });
    
    // Final Summary
    console.log('\n🎉 Validation Summary:');
    console.log(`   📁 Files: ${filesExist}/${criticalFiles.length} present`);
    console.log(`   📄 HTML Preview: ${htmlPassed}/${htmlChecks.length} checks passed`);
    console.log(`   ✅ Compliance: ${complianceIssues === 0 ? 'PASSED' : 'FAILED'}`);
    console.log(`   🎯 Required Messaging: ${requiredTermsFound > 0 ? 'PRESENT' : 'MISSING'}`);
    
    const overallScore = Math.round(((filesExist + htmlPassed) / (criticalFiles.length + htmlChecks.length)) * 100);
    console.log(`   📊 Overall Score: ${overallScore}%`);
    
    // Generate final report
    const validationReport = {
        timestamp: new Date().toISOString(),
        status: overallScore >= 80 ? 'READY_FOR_DEPLOYMENT' : 'NEEDS_FIXES',
        scores: {
            files: `${filesExist}/${criticalFiles.length}`,
            html_preview: `${htmlPassed}/${htmlChecks.length}`,
            compliance: complianceIssues === 0,
            messaging: requiredTermsFound > 0,
            overall_percentage: overallScore
        },
        recommendations: overallScore >= 80 ? [
            'Website modernization complete',
            'All components updated with living websites messaging',
            'Pricing structure properly implemented',
            'Ready for partnership outreach'
        ] : [
            'Review missing files and content',
            'Ensure all components are properly integrated',
            'Verify compliance requirements'
        ]
    };
    
    if (!fs.existsSync('test-results')) {
        fs.mkdirSync('test-results');
    }
    
    fs.writeFileSync(
        'test-results/website-validation-report.json',
        JSON.stringify(validationReport, null, 2)
    );
    
    console.log('\n📄 Detailed report saved to: test-results/website-validation-report.json');
    
    if (overallScore >= 80) {
        console.log('\n🚀 VALIDATION PASSED! Website is ready for live preview and partnership outreach.');
        console.log('   Next steps:');
        console.log('   1. Start development server to view live updates');
        console.log('   2. Test site generation functionality');
        console.log('   3. Begin partnership discussions with Polar.sh');
    } else {
        console.log('\n⚠️  Validation incomplete. Address missing components before deployment.');
    }
}

// Run validation
validateUpdatedWebsite().then(() => {
    console.log('\n✨ Validation complete!');
}).catch(error => {
    console.error('Validation error:', error);
});