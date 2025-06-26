const fs = require('fs');
const path = require('path');

console.log('🔍 4SITE.PRO DATABASE AND VIRAL SYSTEMS ANALYSIS');
console.log('='.repeat(60));

// Check environment configuration
console.log('\n📋 Environment Configuration:');
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  lines.forEach(line => {
    const [key] = line.split('=');
    if (key && key.includes('SUPABASE')) {
      console.log(`✅ ${key}: configured`);
    }
  });
} else {
  console.log('⚠️  No .env.local file found - running in demo mode');
}

// Check package.json dependencies
console.log('\n📦 Database Dependencies:');
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const deps = {...(pkg.dependencies || {}), ...(pkg.devDependencies || {})};
  
  const dbDeps = Object.keys(deps).filter(dep => 
    dep.includes('supabase') || 
    dep.includes('postgres') || 
    dep.includes('prisma') ||
    dep.includes('database')
  );
  
  if (dbDeps.length > 0) {
    dbDeps.forEach(dep => console.log(`✅ ${dep}: ${deps[dep]}`));
  } else {
    console.log('❌ No database dependencies found');
  }
} else {
  console.log('❌ No package.json found');
}

// Analyze database schema files
console.log('\n🗄️ Database Schema Files:');
const dbPath = path.join(__dirname, 'database');
if (fs.existsSync(dbPath)) {
  const schemaFiles = fs.readdirSync(dbPath).filter(file => file.endsWith('.sql'));
  
  schemaFiles.forEach(file => {
    const filePath = path.join(dbPath, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').length;
    const tables = (content.match(/CREATE TABLE/gi) || []).length;
    const functions = (content.match(/CREATE OR REPLACE FUNCTION/gi) || []).length;
    const indexes = (content.match(/CREATE INDEX/gi) || []).length;
    
    console.log(`📄 ${file}:`);
    console.log(`   Lines: ${lines}, Tables: ${tables}, Functions: ${functions}, Indexes: ${indexes}`);
  });
} else {
  console.log('❌ No database directory found');
}

// Analyze TypeScript type definitions
console.log('\n📝 TypeScript Type Definitions:');
const typesPath = path.join(__dirname, 'types', 'database.ts');
if (fs.existsSync(typesPath)) {
  const content = fs.readFileSync(typesPath, 'utf8');
  const interfaces = (content.match(/export interface/g) || []).length;
  console.log(`✅ database.ts: ${interfaces} interfaces defined`);
} else {
  console.log('❌ No database types found');
}

// Analyze Supabase configuration
console.log('\n⚡ Supabase Configuration:');
const supabasePath = path.join(__dirname, 'lib', 'supabase.ts');
if (fs.existsSync(supabasePath)) {
  const content = fs.readFileSync(supabasePath, 'utf8');
  const functions = (content.match(/export const \w+/g) || []).length;
  const hasViralHelpers = content.includes('showcaseHelpers');
  console.log(`✅ supabase.ts: ${functions} exported functions`);
  console.log(`${hasViralHelpers ? '✅' : '❌'} Viral mechanics helpers: ${hasViralHelpers ? 'present' : 'missing'}`);
} else {
  console.log('❌ No Supabase configuration found');
}

// Test key viral mechanics features
console.log('\n🚀 Viral Mechanics Features Analysis:');
const viralFeatures = [
  'viral_score calculation',
  'commission tier progression', 
  'share tracking',
  'auto-featuring',
  'pro showcase',
  'referral system',
  'commission earnings'
];

const enhancedSchemaPath = path.join(__dirname, 'database', 'enhanced-viral-schema.sql');
if (fs.existsSync(enhancedSchemaPath)) {
  const schemaContent = fs.readFileSync(enhancedSchemaPath, 'utf8');
  
  viralFeatures.forEach(feature => {
    const hasFeature = schemaContent.toLowerCase().includes(feature.replace(' ', '_'));
    console.log(`${hasFeature ? '✅' : '❌'} ${feature}: ${hasFeature ? 'implemented' : 'missing'}`);
  });
} else {
  console.log('❌ Enhanced viral schema not found');
}

console.log('\n' + '='.repeat(60));
console.log('📊 Analysis Complete - Ready for production optimization');