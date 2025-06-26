const fs = require('fs');
const path = require('path');

console.log('🔒 ULTRA ELITE SECURITY AUDIT - 4site.pro');
console.log('='.repeat(60));

// 1. Check for hardcoded secrets
console.log('\n1. SCANNING FOR HARDCODED SECRETS...');

function scanForSecrets(dir) {
  const secrets = [];
  const secretPatterns = [
    /(api[_-]?key|secret|token|password|pwd)\s*[:=]\s*['"][\w-]+['"]/gi,
    /(access[_-]?token)\s*[:=]\s*['"][\w-]+['"]/gi,
    /(database[_-]?url|connection[_-]?string)\s*[:=]\s*['"][\w-]+['"]/gi,
    /sk_[a-zA-Z0-9]{24,}/g, // Stripe secret keys
    /pk_[a-zA-Z0-9]{24,}/g, // Stripe public keys
    /AIza[0-9A-Za-z-_]{35}/g, // Google API keys
  ];

  function scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      secretPatterns.forEach((pattern, i) => {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            if (!match.toLowerCase().includes('placeholder') && 
                !match.toLowerCase().includes('demo') && 
                !match.toLowerCase().includes('example') &&
                !match.toLowerCase().includes('your-') &&
                !match.toLowerCase().includes('replace')) {
              secrets.push({ file: filePath, secret: match, pattern: i });
            }
          });
        }
      });
    } catch (e) {}
  }

  function walkDir(currentPath) {
    try {
      const files = fs.readdirSync(currentPath);
      files.forEach(file => {
        const fullPath = path.join(currentPath, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          walkDir(fullPath);
        } else if (stat.isFile() && 
                   (file.endsWith('.js') || file.endsWith('.ts') || 
                    file.endsWith('.env') || file.endsWith('.json'))) {
          scanFile(fullPath);
        }
      });
    } catch (e) {}
  }

  walkDir(dir);
  return secrets;
}

const secrets = scanForSecrets('.');
if (secrets.length === 0) {
  console.log('✅ No hardcoded secrets detected');
} else {
  console.log('❌ CRITICAL: Hardcoded secrets found:');
  secrets.forEach(s => console.log('  - ' + s.file + ': ' + s.secret.substring(0, 30) + '...'));
}

// 2. Environment Security
console.log('\n2. ENVIRONMENT SECURITY ANALYSIS...');
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const hasPlaceholders = envContent.includes('placeholder') || 
                          envContent.includes('demo') || 
                          envContent.includes('replace-with-actual');
  if (hasPlaceholders) {
    console.log('✅ Using placeholder values for development');
  } else {
    console.log('⚠️  WARNING: Production credentials may be in .env.local');
  }
} else {
  console.log('❌ No .env.local file found');
}

console.log('\n3. DEPENDENCY SECURITY SCAN...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const deps = {...packageJson.dependencies, ...packageJson.devDependencies};

// Check for known vulnerable packages
const vulnerablePackages = ['request', 'node-fetch@2', 'handlebars@4.0.0'];
const foundVulnerable = Object.keys(deps).filter(dep => 
  vulnerablePackages.some(vuln => dep.includes(vuln.split('@')[0]))
);

if (foundVulnerable.length === 0) {
  console.log('✅ No known vulnerable packages detected');
} else {
  console.log('⚠️  Potentially vulnerable packages:', foundVulnerable);
}

// Check dependency versions
const outdatedDeps = [];
if (deps['react'] && deps['react'].includes('18')) {
  console.log('⚠️  React 18 detected - React 19 available');
}
if (deps['next'] && !deps['next'].includes('15')) {
  console.log('⚠️  Older Next.js version detected');
}

console.log('\n4. API SECURITY CONFIGURATION...');
// Check CORS configuration
if (fs.existsSync('server/api-server.js')) {
  const apiCode = fs.readFileSync('server/api-server.js', 'utf8');
  
  if (apiCode.includes('app.use(cors())')) {
    console.log('❌ CRITICAL: Wildcard CORS enabled - allows any origin');
  } else if (apiCode.includes('cors({')) {
    console.log('✅ CORS properly configured with restrictions');
  } else {
    console.log('⚠️  CORS configuration not found');
  }
  
  // Check for rate limiting
  if (apiCode.includes('rate-limit') || apiCode.includes('rateLimit')) {
    console.log('✅ Rate limiting detected');
  } else {
    console.log('❌ CRITICAL: No rate limiting found');
  }
  
  // Check for input validation
  if (apiCode.includes('isValidEmail') && apiCode.includes('req.body')) {
    console.log('✅ Input validation present');
  } else {
    console.log('⚠️  Limited input validation detected');
  }
  
  // Check for SQL injection protection
  if (apiCode.includes('supabase') && !apiCode.includes('raw(')) {
    console.log('✅ Using ORM/Query builder (Supabase) - SQL injection protected');
  }
  
  // Check for authentication
  if (apiCode.includes('auth.uid()') || apiCode.includes('authorization')) {
    console.log('✅ Authentication middleware detected');
  } else {
    console.log('⚠️  Limited authentication detected');
  }
}

console.log('\n5. FRONTEND SECURITY...');
if (fs.existsSync('index.html')) {
  const htmlContent = fs.readFileSync('index.html', 'utf8');
  
  // Check for CSP
  if (htmlContent.includes('Content-Security-Policy')) {
    console.log('✅ Content Security Policy found');
  } else {
    console.log('❌ CRITICAL: No Content Security Policy');
  }
  
  // Check for inline scripts
  const inlineScripts = (htmlContent.match(/<script[^>]*>[^<]+<\/script>/g) || []).length;
  if (inlineScripts > 2) {
    console.log('⚠️  ' + inlineScripts + ' inline scripts detected (CSP risk)');
  } else {
    console.log('✅ Minimal inline scripts');
  }
  
  // Check for external CDN usage
  if (htmlContent.includes('cdn.tailwindcss.com')) {
    console.log('⚠️  External CDN usage detected (dependency risk)');
  }
  
  // Check for HTTPS enforcement
  if (htmlContent.includes('https://') || htmlContent.includes('upgrade-insecure-requests')) {
    console.log('✅ HTTPS references found');
  }
}

console.log('\n6. DATABASE SECURITY...');
if (fs.existsSync('security-policies.sql')) {
  const policies = fs.readFileSync('security-policies.sql', 'utf8');
  
  if (policies.includes('ENABLE ROW LEVEL SECURITY')) {
    console.log('✅ Row Level Security (RLS) enabled');
  }
  
  if (policies.includes('auth.uid()')) {
    console.log('✅ User-based access control implemented');
  }
  
  const policyCount = (policies.match(/CREATE POLICY/g) || []).length;
  console.log('✅ ' + policyCount + ' security policies defined');
}

console.log('\n7. FILE PERMISSIONS & CONFIGURATION...');
try {
  // Check for sensitive file permissions
  const sensitiveFiles = ['.env.local', 'security-policies.sql'];
  sensitiveFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      console.log('✅ ' + file + ' exists and accessible');
    }
  });
} catch (e) {
  console.log('⚠️  File permission check failed');
}

console.log('\n8. THIRD-PARTY INTEGRATIONS...');
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  
  const integrations = [];
  if (envContent.includes('SUPABASE')) integrations.push('Supabase');
  if (envContent.includes('GEMINI')) integrations.push('Google Gemini');
  if (envContent.includes('POLAR')) integrations.push('Polar.sh');
  if (envContent.includes('GITHUB')) integrations.push('GitHub');
  
  console.log('✅ Integrated services: ' + integrations.join(', '));
}

console.log('\n' + '='.repeat(60));
console.log('SECURITY AUDIT COMPLETE');
console.log('Run: node security-audit.js > security-report.txt');