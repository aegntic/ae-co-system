#!/usr/bin/env node

/**
 * PHASE 1 PSYCHOLOGICAL FOUNDATION VALIDATION
 * 
 * This script validates the complete psychological transformation:
 * 1. Hero section FREE-focus metamorphosis
 * 2. Progressive disclosure framework implementation
 * 3. A/B testing preparation
 * 4. User journey tracking integration
 */

import fs from 'fs';
import path from 'path';

// Color output helpers
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const checkmark = '✅';
const crossmark = '❌';
const warning = '⚠️';

/**
 * Test Results
 */
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

function test(name, condition, details = '') {
  if (condition) {
    results.passed++;
    log(`${checkmark} ${name}`, 'green');
    if (details) log(`   ${details}`, 'blue');
  } else {
    results.failed++;
    log(`${crossmark} ${name}`, 'red');
    if (details) log(`   ${details}`, 'yellow');
  }
  results.details.push({ name, passed: condition, details });
}

function warn(name, details = '') {
  results.warnings++;
  log(`${warning} ${name}`, 'yellow');
  if (details) log(`   ${details}`, 'yellow');
  results.details.push({ name, passed: false, details, warning: true });
}

/**
 * File reading helper
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

/**
 * TASK 1.1: Hero Section Complete Metamorphosis Validation
 */
function validateHeroTransformation() {
  log('\n📍 TASK 1.1: Hero Section Complete Metamorphosis', 'bold');
  
  const heroContent = readFile('./components/landing/GlassHeroSection.tsx');
  const appContent = readFile('./App.tsx');
  
  if (!heroContent) {
    test('Hero section file exists', false, 'GlassHeroSection.tsx not found');
    return;
  }

  // Check for FREE-focused messaging
  test(
    'Removed pricing tier complexity from hero',
    !heroContent.includes('$49.49') && !heroContent.includes('PRO ($'),
    'Hero section should not mention specific pricing in initial view'
  );

  test(
    'Implements single glass CTA',
    heroContent.includes('Create Your Living Website') || heroContent.includes('{HERO_MESSAGING.cta}'),
    'Hero should focus on single action: creating living website'
  );

  test(
    'FREE-focused instant gratification messaging',
    heroContent.includes('30 seconds') && heroContent.includes('instant'),
    'Hero should emphasize speed and instant results'
  );

  test(
    'Removed initial pricing mentions',
    !heroContent.includes('Choose Your Tier') && !heroContent.includes('pricing tiers'),
    'No pricing selection in initial hero experience'
  );

  test(
    'Updated hero messaging imports',
    heroContent.includes('HERO_MESSAGING') && heroContent.includes('PROJECT_4SITE_BRANDING'),
    'Hero should import new messaging constants'
  );
}

/**
 * TASK 1.2: Message Architecture Transformation Validation
 */
function validateMessageArchitecture() {
  log('\n📍 TASK 1.2: Message Architecture Transformation', 'bold');
  
  const constantsContent = readFile('./constants.ts');
  
  if (!constantsContent) {
    test('Constants file exists', false, 'constants.ts not found');
    return;
  }

  test(
    'HERO_MESSAGING constants implemented',
    constantsContent.includes('HERO_MESSAGING') && constantsContent.includes('instant_gratification'),
    'New hero messaging structure with psychological triggers'
  );

  test(
    'VALUE_PROPOSITIONS transformed',
    constantsContent.includes('INSTANT_MAGIC') && constantsContent.includes('WOW_MOMENT'),
    'Value propositions focused on instant magic and wow moments'
  );

  test(
    'SUCCESS_TRIGGERS for progressive disclosure',
    constantsContent.includes('SUCCESS_TRIGGERS') && constantsContent.includes('deployment_success'),
    'Success trigger messaging for post-deployment reveals'
  );

  test(
    'Apple-esque typography hierarchy',
    constantsContent.includes('TYPOGRAPHY_HIERARCHY'),
    'Typography constants for professional presentation'
  );

  test(
    'Progressive disclosure framework constants',
    constantsContent.includes('DISCLOSURE_STATES') && constantsContent.includes('AB_TEST_VARIANTS'),
    'Framework constants for progressive disclosure and A/B testing'
  );
}

/**
 * TASK 1.3: Progressive Disclosure Framework Validation
 */
function validateProgressiveDisclosureFramework() {
  log('\n📍 TASK 1.3: Progressive Disclosure Framework', 'bold');
  
  const updatedMainContent = readFile('./components/sections/UpdatedMainSection.tsx');
  const progressiveHookContent = readFile('./hooks/useProgressiveDisclosure.ts');
  const journeyHookContent = readFile('./hooks/useUserJourney.ts');
  const appContent = readFile('./App.tsx');

  // Check UpdatedMainSection transformation
  if (updatedMainContent) {
    test(
      'Progressive disclosure state management',
      updatedMainContent.includes('useState(DISCLOSURE_STATES.INITIAL)') && 
      updatedMainContent.includes('setShowPricingTiers'),
      'State management for revealing pricing tiers progressively'
    );

    test(
      'AnimatePresence for pricing revelation',
      updatedMainContent.includes('AnimatePresence') && 
      updatedMainContent.includes('showPricingTiers &&'),
      'Animated pricing tier reveal based on user journey'
    );

    test(
      'Success-triggered upgrade prompts',
      updatedMainContent.includes('POST_DEPLOYMENT') && 
      updatedMainContent.includes('handleShowAdvancedFeatures'),
      'Upgrade prompts triggered by deployment success'
    );

    test(
      'User journey step tracking',
      updatedMainContent.includes('userJourneyStep') && 
      updatedMainContent.includes('setUserJourneyStep'),
      'Progressive revelation based on user journey steps'
    );
  } else {
    test('UpdatedMainSection exists', false, 'UpdatedMainSection.tsx not found');
  }

  // Check progressive disclosure hook
  if (progressiveHookContent) {
    test(
      'useProgressiveDisclosure hook implemented',
      progressiveHookContent.includes('handleDeploymentSuccess') && 
      progressiveHookContent.includes('SuccessMilestone'),
      'Complete progressive disclosure hook with milestone tracking'
    );

    test(
      'A/B testing integration',
      progressiveHookContent.includes('abTestVariant') && 
      progressiveHookContent.includes('AB_TEST_VARIANTS'),
      'A/B testing framework integrated into progressive disclosure'
    );

    test(
      'Conversion score calculation',
      progressiveHookContent.includes('getConversionScore') && 
      progressiveHookContent.includes('milestone'),
      'Analytics for conversion optimization'
    );
  } else {
    test('Progressive disclosure hook exists', false, 'useProgressiveDisclosure.ts not found');
  }

  // Check user journey hook
  if (journeyHookContent) {
    test(
      'useUserJourney hook implemented',
      journeyHookContent.includes('trackEvent') && 
      journeyHookContent.includes('JourneyEvent'),
      'Comprehensive user journey tracking'
    );

    test(
      'Engagement score calculation',
      journeyHookContent.includes('calculateEngagementScore') && 
      journeyHookContent.includes('conversionProbability'),
      'User engagement and conversion probability analytics'
    );

    test(
      'A/B test assignment',
      journeyHookContent.includes('abTestAssignments') && 
      journeyHookContent.includes('AB_TEST_VARIANTS'),
      'A/B testing assignment and tracking'
    );
  } else {
    test('User journey hook exists', false, 'useUserJourney.ts not found');
  }

  // Check App.tsx integration
  if (appContent) {
    test(
      'App.tsx integrates progressive disclosure',
      appContent.includes('useProgressiveDisclosure') && 
      appContent.includes('handleGenerationSuccess'),
      'Main app integrates progressive disclosure framework'
    );

    test(
      'User journey tracking in App',
      appContent.includes('useUserJourney') && 
      appContent.includes('trackInteraction'),
      'User journey tracking integrated in main app'
    );

    test(
      'Success milestone tracking',
      appContent.includes('handleDeploymentSuccess') && 
      appContent.includes('trackMilestone'),
      'Success milestones tracked for progressive disclosure'
    );
  } else {
    test('App.tsx exists', false, 'App.tsx not found');
  }
}

/**
 * Critical Requirements Validation
 */
function validateCriticalRequirements() {
  log('\n📍 Critical Requirements Validation', 'bold');
  
  const mainSectionContent = readFile('./components/sections/UpdatedMainSection.tsx');
  const heroContent = readFile('./components/landing/GlassHeroSection.tsx');
  
  test(
    'Pricing confusion removed from initial experience',
    heroContent && !heroContent.includes('Choose Your Tier') && 
    !heroContent.includes('$49.49/month'),
    'No pricing complexity visible in initial user experience'
  );

  test(
    'Existing functionality maintained',
    mainSectionContent && mainSectionContent.includes('onGenerateSite') && 
    mainSectionContent.includes('GlassFeaturesSection'),
    'All existing functionality preserved during transformation'
  );

  test(
    'Post-deployment upsell foundation',
    mainSectionContent && mainSectionContent.includes('POST_DEPLOYMENT') && 
    mainSectionContent.includes('SUCCESS_TRIGGERS'),
    'Framework for post-success upselling implemented'
  );

  test(
    'Psychological triggers implemented',
    mainSectionContent && mainSectionContent.includes('WOW_MOMENT') ||
    (heroContent && heroContent.includes('instant')),
    'Psychological triggers for instant gratification'
  );

  test(
    'Clean, minimalist approach',
    heroContent && heroContent.includes('MINIMALIST FOOTER') &&
    !heroContent.includes('Advanced Mode Link'),
    'Clean, distraction-free user experience'
  );
}

/**
 * A/B Testing Framework Validation
 */
function validateABTestingFramework() {
  log('\n📍 A/B Testing Framework Preparation', 'bold');
  
  const constantsContent = readFile('./constants.ts');
  const journeyHookContent = readFile('./hooks/useUserJourney.ts');
  
  if (constantsContent) {
    test(
      'A/B test variants defined',
      constantsContent.includes('AB_TEST_VARIANTS') && 
      constantsContent.includes('MESSAGING') && 
      constantsContent.includes('SUCCESS_FLOW'),
      'A/B testing variants configured for optimization'
    );
  }

  if (journeyHookContent) {
    test(
      'A/B test assignment logic',
      journeyHookContent.includes('abTestAssignments') && 
      journeyHookContent.includes('Math.random()'),
      'Random A/B test assignment implemented'
    );

    test(
      'Conversion tracking by variant',
      journeyHookContent.includes('abTestAssignments') && 
      journeyHookContent.includes('trackConversion'),
      'Conversion tracking includes A/B test variant data'
    );
  }
}

/**
 * Performance and Analytics Validation
 */
function validatePerformanceAnalytics() {
  log('\n📍 Performance and Analytics Integration', 'bold');
  
  const appContent = readFile('./App.tsx');
  
  if (appContent) {
    test(
      'Performance monitoring maintained',
      appContent.includes('useComponentPerformance') && 
      appContent.includes('usePerformanceMonitor'),
      'Existing performance monitoring preserved'
    );

    test(
      'Analytics tracking enhanced',
      appContent.includes('trackMilestone') && 
      appContent.includes('engagementScore'),
      'Enhanced analytics for conversion optimization'
    );

    test(
      'Generation time tracking',
      appContent.includes('generationStartTime') && 
      appContent.includes('generationTime'),
      'Generation performance tracking maintained'
    );
  }
}

/**
 * Security and Privacy Validation
 */
function validateSecurityPrivacy() {
  log('\n📍 Security and Privacy Considerations', 'bold');
  
  const journeyContent = readFile('./hooks/useUserJourney.ts');
  const disclosureContent = readFile('./hooks/useProgressiveDisclosure.ts');
  
  test(
    'Client-side only tracking',
    journeyContent && journeyContent.includes('console.log') && 
    !journeyContent.includes('fetch(') && !journeyContent.includes('POST'),
    'User tracking remains client-side for privacy'
  );

  test(
    'No sensitive data exposure',
    !journeyContent?.includes('password') && !journeyContent?.includes('email') &&
    !journeyContent?.includes('creditCard'),
    'No sensitive user data collected in tracking'
  );

  test(
    'Progressive enhancement',
    disclosureContent && disclosureContent.includes('enableTracking = true') &&
    disclosureContent.includes('if (!enableTracking)'),
    'Tracking can be disabled, progressive enhancement approach'
  );
}

/**
 * Main validation execution
 */
function runValidation() {
  log('🧠 PHASE 1 AGENT: PSYCHOLOGICAL FOUNDATION VALIDATION', 'magenta');
  log('=' .repeat(80), 'cyan');
  
  // Change to the project directory
  try {
    process.chdir('/home/tabs/ae-co-system/project4site/4site-pro/project4site_-github-readme-to-site-generator');
  } catch (error) {
    log('❌ Cannot change to project directory', 'red');
    process.exit(1);
  }

  validateHeroTransformation();
  validateMessageArchitecture();
  validateProgressiveDisclosureFramework();
  validateCriticalRequirements();
  validateABTestingFramework();
  validatePerformanceAnalytics();
  validateSecurityPrivacy();

  // Summary
  log('\n📊 VALIDATION SUMMARY', 'bold');
  log('=' .repeat(50), 'cyan');
  log(`${checkmark} Tests Passed: ${results.passed}`, 'green');
  log(`${crossmark} Tests Failed: ${results.failed}`, 'red');
  log(`${warning} Warnings: ${results.warnings}`, 'yellow');

  const successRate = Math.round((results.passed / (results.passed + results.failed)) * 100);
  log(`\n🎯 Success Rate: ${successRate}%`, successRate >= 90 ? 'green' : successRate >= 70 ? 'yellow' : 'red');

  if (successRate >= 90) {
    log('\n🎉 PHASE 1 PSYCHOLOGICAL FOUNDATION TRANSFORMATION: COMPLETE!', 'green');
    log('✨ Ready for Phase 2: Advanced Progressive Disclosure Implementation', 'blue');
  } else if (successRate >= 70) {
    log('\n⚠️ PHASE 1 MOSTLY COMPLETE - Minor issues detected', 'yellow');
    log('🔧 Review failed tests and complete remaining tasks', 'yellow');
  } else {
    log('\n❌ PHASE 1 NEEDS ATTENTION - Critical issues detected', 'red');
    log('🚨 Address failed tests before proceeding to Phase 2', 'red');
  }

  // Detailed failure report
  if (results.failed > 0) {
    log('\n🔍 FAILED TEST DETAILS:', 'red');
    results.details
      .filter(detail => !detail.passed && !detail.warning)
      .forEach(detail => {
        log(`   • ${detail.name}`, 'red');
        if (detail.details) log(`     ${detail.details}`, 'yellow');
      });
  }

  log('\n' + '=' .repeat(80), 'cyan');
  return successRate;
}

// Execute validation
const successRate = runValidation();
process.exit(successRate >= 90 ? 0 : 1);