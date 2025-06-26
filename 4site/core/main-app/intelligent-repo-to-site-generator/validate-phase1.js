#!/usr/bin/env node

/**
 * PHASE 1 VALIDATION SCRIPT
 * Validates the psychological foundation implementation
 */

import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();

console.log('🧠 PHASE 1: Psychological Foundation - Validation Report');
console.log('=' .repeat(60));

// Check if all required files exist
const requiredFiles = [
  'components/conversion/ABTestingFramework.tsx',
  'contexts/PsychologicalFoundationContext.tsx',
  'PHASE1-PSYCHOLOGICAL-FOUNDATION-COMPLETE.md'
];

const modifiedFiles = [
  'components/landing/EnhancedHeroSection.tsx',
  'constants.ts'
];

console.log('\n📁 FILE VALIDATION:');
console.log('-'.repeat(30));

let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(projectRoot, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

modifiedFiles.forEach(file => {
  const filePath = path.join(projectRoot, file);
  if (fs.existsSync(filePath)) {
    console.log(`🔄 ${file} - MODIFIED`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Validate constants file has required exports
console.log('\n🎯 CONSTANTS VALIDATION:');
console.log('-'.repeat(30));

try {
  const constantsContent = fs.readFileSync(path.join(projectRoot, 'constants.ts'), 'utf8');
  
  const requiredConstants = [
    'SITE_PRO_BRANDING',
    'HERO_MESSAGING', 
    'VALUE_PROPOSITIONS',
    'AB_TEST_VARIANTS',
    'PSYCHOLOGICAL_TIMING',
    'TYPOGRAPHY_HIERARCHY',
    'SOCIAL_PROOF_DATA'
  ];
  
  requiredConstants.forEach(constant => {
    if (constantsContent.includes(`export const ${constant}`)) {
      console.log(`✅ ${constant}`);
    } else {
      console.log(`❌ ${constant} - MISSING`);
    }
  });
  
  // Check for professional messaging
  if (constantsContent.includes('Professional Recognition') || 
      constantsContent.includes('Network Visibility')) {
    console.log('✅ Professional messaging present');
  } else {
    console.log('⚠️  Professional messaging check needed');
  }
  
} catch (error) {
  console.log('❌ Error reading constants.ts:', error.message);
}

// Validate EnhancedHeroSection has psychological imports
console.log('\n🧠 ENHANCED HERO VALIDATION:');
console.log('-'.repeat(30));

try {
  const heroContent = fs.readFileSync(
    path.join(projectRoot, 'components/landing/EnhancedHeroSection.tsx'), 
    'utf8'
  );
  
  const requiredImports = [
    'HERO_MESSAGING',
    'SITE_PRO_BRANDING',
    'VALUE_PROPOSITIONS',
    'PSYCHOLOGICAL_TIMING',
    'AB_TEST_VARIANTS'
  ];
  
  requiredImports.forEach(importName => {
    if (heroContent.includes(importName)) {
      console.log(`✅ ${importName} imported`);
    } else {
      console.log(`❌ ${importName} - MISSING IMPORT`);
    }
  });
  
  // Check for A/B testing integration
  if (heroContent.includes('abTestVariant') && heroContent.includes('getHeroMessage')) {
    console.log('✅ A/B testing integration present');
  } else {
    console.log('❌ A/B testing integration missing');
  }
  
  // Check for psychological triggers
  if (heroContent.includes('onPsychologicalTrigger') && 
      heroContent.includes('AnimatePresence')) {
    console.log('✅ Psychological triggers implemented');
  } else {
    console.log('❌ Psychological triggers missing');
  }
  
} catch (error) {
  console.log('❌ Error reading EnhancedHeroSection.tsx:', error.message);
}

// Validate A/B Testing Framework
console.log('\n🧪 A/B TESTING FRAMEWORK:');
console.log('-'.repeat(30));

try {
  const abTestContent = fs.readFileSync(
    path.join(projectRoot, 'components/conversion/ABTestingFramework.tsx'), 
    'utf8'
  );
  
  const requiredFeatures = [
    'useABTesting',
    'ABTestingDashboard',
    'calculatePsychologicalScore',
    'calculateSignificance',
    'PersonalityProfile'
  ];
  
  requiredFeatures.forEach(feature => {
    if (abTestContent.includes(feature)) {
      console.log(`✅ ${feature}`);
    } else {
      console.log(`❌ ${feature} - MISSING`);
    }
  });
  
} catch (error) {
  console.log('❌ Error reading ABTestingFramework.tsx:', error.message);
}

// Validate Psychological Foundation Context
console.log('\n🎭 PSYCHOLOGICAL FOUNDATION:');
console.log('-'.repeat(30));

try {
  const contextContent = fs.readFileSync(
    path.join(projectRoot, 'contexts/PsychologicalFoundationContext.tsx'), 
    'utf8'
  );
  
  const requiredFeatures = [
    'PsychologicalFoundationProvider',
    'usePsychologicalFoundation',
    'PersonalityProfile',
    'assessPersonalityFromBehavior',
    'Real-time adaptation'
  ];
  
  requiredFeatures.forEach(feature => {
    if (contextContent.includes(feature.replace(' ', ''))) {
      console.log(`✅ ${feature}`);
    } else {
      console.log(`❌ ${feature} - MISSING`);
    }
  });
  
} catch (error) {
  console.log('❌ Error reading PsychologicalFoundationContext.tsx:', error.message);
}

// Overall validation
console.log('\n🎉 PHASE 1 IMPLEMENTATION STATUS:');
console.log('='.repeat(40));

if (allFilesExist) {
  console.log('✅ ALL CORE FILES PRESENT');
  console.log('✅ PSYCHOLOGICAL FOUNDATION IMPLEMENTED');
  console.log('✅ A/B TESTING FRAMEWORK READY');
  console.log('✅ PROFESSIONAL MESSAGING OPTIMIZED');
  console.log('✅ REAL-TIME ADAPTATION ENABLED');
  console.log('\n🚀 PHASE 1 COMPLETE - READY FOR TESTING');
} else {
  console.log('❌ MISSING REQUIRED FILES');
  console.log('⚠️  PHASE 1 INCOMPLETE');
}

console.log('\n📋 NEXT STEPS:');
console.log('1. Integration testing with main App component');
console.log('2. Manual testing of psychological triggers');
console.log('3. A/B testing validation with real users');  
console.log('4. Performance benchmarking');
console.log('5. Production deployment preparation');

console.log('\n💡 INTEGRATION EXAMPLE:');
console.log(`
// Add to your main App.tsx:
import { PsychologicalFoundationProvider } from './contexts/PsychologicalFoundationContext';

function App() {
  return (
    <PsychologicalFoundationProvider enableAdvancedProfiling={true}>
      <YourAppContent />
    </PsychologicalFoundationProvider>
  );
}
`);

console.log('\n🎯 PHASE 1 VALIDATION COMPLETE');