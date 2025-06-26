#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n🔍 Project4Site Setup Validator\n');

let errors = 0;
let warnings = 0;

// Check for .env.local
console.log('1️⃣  Checking environment configuration...');
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  if (envContent.includes('VITE_GEMINI_API_KEY=')) {
    console.log('   ✅ VITE_GEMINI_API_KEY found');
  } else {
    console.log('   ❌ VITE_GEMINI_API_KEY not found');
    errors++;
  }
  
  if (envContent.includes('VITE_FAL_API_KEY=')) {
    console.log('   ✅ VITE_FAL_API_KEY found');
  } else {
    console.log('   ⚠️  VITE_FAL_API_KEY not found (optional for visual generation)');
    warnings++;
  }
} else {
  console.log('   ❌ .env.local file not found');
  errors++;
}

// Check for required services
console.log('\n2️⃣  Checking service files...');
const services = [
  'services/geminiService.ts',
  'services/enhancedGeminiService.ts',
  'services/falService.ts',
  'services/multiModalOrchestrator.ts'
];

services.forEach(service => {
  const servicePath = path.join(__dirname, service);
  if (fs.existsSync(servicePath)) {
    console.log(`   ✅ ${service}`);
  } else {
    console.log(`   ❌ ${service} not found`);
    errors++;
  }
});

// Check for enhanced components
console.log('\n3️⃣  Checking enhanced components...');
const components = [
  'components/generator/EnhancedSitePreview.tsx',
  'components/generator/LoadingIndicator.tsx',
  'components/generator/URLInputForm.tsx'
];

components.forEach(component => {
  const componentPath = path.join(__dirname, component);
  if (fs.existsSync(componentPath)) {
    console.log(`   ✅ ${component}`);
  } else {
    console.log(`   ❌ ${component} not found`);
    errors++;
  }
});

// Check package.json for dependencies
console.log('\n4️⃣  Checking dependencies...');
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const requiredDeps = [
    '@google/generative-ai',
    '@fal-ai/serverless-client',
    'react',
    'framer-motion'
  ];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`   ✅ ${dep}`);
    } else {
      console.log(`   ❌ ${dep} not found in dependencies`);
      errors++;
    }
  });
} else {
  console.log('   ❌ package.json not found');
  errors++;
}

// Summary
console.log('\n📊 Validation Summary:');
console.log(`   Errors: ${errors}`);
console.log(`   Warnings: ${warnings}`);

if (errors === 0) {
  console.log('\n✅ Setup validation passed! Your Project4Site is ready to use.');
  console.log('\n🚀 Start the development server with: bun run dev');
  console.log('   Or if running: Access at http://localhost:5174\n');
} else {
  console.log('\n❌ Setup validation failed. Please fix the errors above.');
  console.log('   Check SOLUTION_IMPLEMENTATION.md for detailed setup instructions.\n');
  process.exit(1);
}