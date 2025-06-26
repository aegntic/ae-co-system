# 09 - Security Configuration for 4site.pro

## Objective
Implement comprehensive security hardening across all components of 4site.pro with enterprise-grade protection measures.

## Security Architecture
- **Application Layer**: CORS, CSP, HSTS, input validation
- **Infrastructure Layer**: WAF, DDoS protection, rate limiting
- **API Layer**: Authentication, authorization, secure endpoints
- **Data Layer**: Encryption at rest and in transit, secure storage

## Required Files to Create

### 1. Security Headers Middleware
**File**: `security-headers.js`
```javascript
// Comprehensive Security Headers for 4site.pro
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Content Security Policy configuration
const cspConfig = {
    defaultSrc: ["'self'"],
    scriptSrc: [
        "'self'",
        "'unsafe-inline'", // For Vite dev mode - remove in production
        "https://www.googletagmanager.com",
        "https://www.google-analytics.com",
        "https://cdn.jsdelivr.net"
    ],
    styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net"
    ],
    fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
    ],
    imgSrc: [
        "'self'",
        "data:",
        "https:",
        "https://avatars.githubusercontent.com",
        "https://github.com"
    ],
    mediaSrc: ["'self'"],
    objectSrc: ["'none'"],
    frameSrc: [
        "'self'",
        "https://www.youtube.com",
        "https://player.vimeo.com"
    ],
    connectSrc: [
        "'self'",
        "https://api.4site.pro",
        "https://api.github.com",
        "https://www.google-analytics.com"
    ],
    workerSrc: ["'self'"],
    upgradeInsecureRequests: []
};

// Security headers configuration
function configureSecurityHeaders(app) {
    // Helmet for basic security headers
    app.use(helmet({
        contentSecurityPolicy: {
            directives: cspConfig,
            reportOnly: false
        },
        hsts: {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true
        },
        referrerPolicy: {
            policy: "strict-origin-when-cross-origin"
        },
        crossOriginEmbedderPolicy: false, // Disable for GitHub OAuth
        crossOriginResourcePolicy: {
            policy: "cross-origin"
        }
    }));

    // Additional custom security headers
    app.use((req, res, next) => {
        // Prevent clickjacking
        res.setHeader('X-Frame-Options', 'DENY');
        
        // Prevent MIME type sniffing
        res.setHeader('X-Content-Type-Options', 'nosniff');
        
        // Enable XSS protection
        res.setHeader('X-XSS-Protection', '1; mode=block');
        
        // Hide server information
        res.removeHeader('X-Powered-By');
        res.setHeader('Server', '4site.pro');
        
        // Feature policy
        res.setHeader('Feature-Policy', [
            "geolocation 'none'",
            "microphone 'none'",
            "camera 'none'",
            "payment 'none'",
            "usb 'none'"
        ].join('; '));
        
        // Permissions policy (newer version of feature policy)
        res.setHeader('Permissions-Policy', [
            "geolocation=()",
            "microphone=()",
            "camera=()",
            "payment=()",
            "usb=()"
        ].join(', '));
        
        next();
    });

    console.log('✅ Security headers configured');
}

// Rate limiting configuration
const createRateLimiter = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            error: message,
            code: 'RATE_LIMIT_EXCEEDED'
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            console.warn(`🚨 Rate limit exceeded: ${req.ip} - ${req.path}`);
            res.status(429).json({
                error: message,
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: Math.round(windowMs / 1000)
            });
        }
    });
};

// Different rate limits for different endpoints
const rateLimiters = {
    // General API rate limiting
    general: createRateLimiter(
        15 * 60 * 1000, // 15 minutes
        100, // 100 requests per window
        'Too many requests from this IP'
    ),
    
    // Strict rate limiting for authentication endpoints
    auth: createRateLimiter(
        15 * 60 * 1000, // 15 minutes
        5, // 5 requests per window
        'Too many authentication attempts'
    ),
    
    // Site generation rate limiting
    generation: createRateLimiter(
        60 * 60 * 1000, // 1 hour
        10, // 10 generations per hour
        'Too many site generation requests'
    ),
    
    // Very strict rate limiting for sensitive operations
    sensitive: createRateLimiter(
        24 * 60 * 60 * 1000, // 24 hours
        3, // 3 requests per day
        'Daily limit exceeded for this operation'
    )
};

module.exports = {
    configureSecurityHeaders,
    rateLimiters,
    cspConfig
};
```

### 2. CORS Configuration
**File**: `cors-config.js`
```javascript
// CORS Configuration for 4site.pro
const cors = require('cors');

// Allowed origins configuration
const allowedOrigins = [
    'https://4site.pro',
    'https://www.4site.pro',
    'https://api.4site.pro',
    'https://cdn.4site.pro',
    'https://admin.4site.pro'
];

// Development origins (only in development)
if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.push(
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:8080',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173'
    );
}

// CORS configuration options
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`🚨 CORS blocked origin: ${origin}`);
            callback(new Error(`Origin ${origin} not allowed by CORS policy`));
        }
    },
    
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-API-Key',
        'X-Request-ID'
    ],
    
    exposedHeaders: [
        'X-Total-Count',
        'X-Page-Count',
        'X-Rate-Limit-Limit',
        'X-Rate-Limit-Remaining',
        'X-Rate-Limit-Reset'
    ],
    
    credentials: true, // Allow cookies and authentication
    
    maxAge: 86400, // 24 hours preflight cache
    
    optionsSuccessStatus: 200 // Support legacy browsers
};

// Enhanced CORS middleware with logging
function createCorsMiddleware() {
    const corsMiddleware = cors(corsOptions);
    
    return (req, res, next) => {
        // Log CORS requests in development
        if (process.env.NODE_ENV !== 'production') {
            console.log(`🌐 CORS request: ${req.method} ${req.path} from ${req.get('Origin') || 'unknown'}`);
        }
        
        corsMiddleware(req, res, next);
    };
}

// Preflight handler for complex requests
function handlePreflight(req, res, next) {
    if (req.method === 'OPTIONS') {
        console.log(`✈️ Preflight request: ${req.path} from ${req.get('Origin')}`);
        res.header('Access-Control-Allow-Origin', req.get('Origin'));
        res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
        res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(','));
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Max-Age', '86400');
        return res.sendStatus(200);
    }
    next();
}

module.exports = {
    corsOptions,
    createCorsMiddleware,
    handlePreflight,
    allowedOrigins
};
```

### 3. Input Validation and Sanitization
**File**: `input-validation.js`
```javascript
// Input Validation and Sanitization for 4site.pro
const validator = require('validator');
const DOMPurify = require('isomorphic-dompurify');

// Validation schemas
const schemas = {
    githubUrl: {
        pattern: /^https:\/\/github\.com\/[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+\/?$/,
        maxLength: 200
    },
    
    email: {
        validator: validator.isEmail,
        maxLength: 254
    },
    
    username: {
        pattern: /^[a-zA-Z0-9._-]{1,39}$/,
        maxLength: 39
    },
    
    siteName: {
        pattern: /^[a-zA-Z0-9\s._-]{1,100}$/,
        maxLength: 100
    },
    
    description: {
        maxLength: 1000,
        allowHtml: false
    }
};

// Input sanitization functions
const sanitizers = {
    // Remove potentially dangerous characters
    cleanString: (input) => {
        if (typeof input !== 'string') return '';
        return input
            .replace(/[<>'"&]/g, '') // Remove HTML/script chars
            .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Remove control chars
            .trim()
            .substring(0, 1000); // Limit length
    },
    
    // Sanitize HTML content
    cleanHtml: (input) => {
        if (typeof input !== 'string') return '';
        return DOMPurify.sanitize(input, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li'],
            ALLOWED_ATTR: ['href'],
            ALLOW_DATA_ATTR: false
        });
    },
    
    // Validate and clean GitHub URLs
    cleanGithubUrl: (input) => {
        if (typeof input !== 'string') return null;
        
        const cleaned = input.trim().toLowerCase();
        
        // Remove trailing slashes and fragments
        const url = cleaned.replace(/\/+$/, '').split('#')[0].split('?')[0];
        
        if (!schemas.githubUrl.pattern.test(url)) {
            return null;
        }
        
        return url;
    },
    
    // Sanitize email addresses
    cleanEmail: (input) => {
        if (typeof input !== 'string') return null;
        
        const email = input.trim().toLowerCase();
        
        if (!validator.isEmail(email)) {
            return null;
        }
        
        return email;
    }
};

// Validation middleware factory
function createValidator(schema) {
    return (req, res, next) => {
        const errors = [];
        
        for (const [field, rules] of Object.entries(schema)) {
            const value = req.body[field];
            
            // Check required fields
            if (rules.required && (!value || value.toString().trim() === '')) {
                errors.push(`${field} is required`);
                continue;
            }
            
            // Skip validation for empty optional fields
            if (!rules.required && (!value || value.toString().trim() === '')) {
                continue;
            }
            
            // Type validation
            if (rules.type && typeof value !== rules.type) {
                errors.push(`${field} must be of type ${rules.type}`);
                continue;
            }
            
            // Length validation
            if (rules.maxLength && value.toString().length > rules.maxLength) {
                errors.push(`${field} must be less than ${rules.maxLength} characters`);
                continue;
            }
            
            if (rules.minLength && value.toString().length < rules.minLength) {
                errors.push(`${field} must be at least ${rules.minLength} characters`);
                continue;
            }
            
            // Pattern validation
            if (rules.pattern && !rules.pattern.test(value.toString())) {
                errors.push(`${field} format is invalid`);
                continue;
            }
            
            // Custom validator function
            if (rules.validator && !rules.validator(value.toString())) {
                errors.push(`${field} is invalid`);
                continue;
            }
            
            // Sanitize the value
            if (rules.sanitizer) {
                req.body[field] = rules.sanitizer(value);
            }
        }
        
        if (errors.length > 0) {
            console.warn(`🚨 Validation failed for ${req.path}:`, errors);
            return res.status(400).json({
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: errors
            });
        }
        
        next();
    };
}

// Common validation schemas
const validationSchemas = {
    // Site generation request
    siteGeneration: {
        githubUrl: {
            required: true,
            type: 'string',
            maxLength: 200,
            pattern: schemas.githubUrl.pattern,
            sanitizer: sanitizers.cleanGithubUrl
        },
        siteName: {
            required: false,
            type: 'string',
            maxLength: 100,
            pattern: schemas.siteName.pattern,
            sanitizer: sanitizers.cleanString
        },
        description: {
            required: false,
            type: 'string',
            maxLength: 1000,
            sanitizer: sanitizers.cleanString
        }
    },
    
    // User profile update
    profileUpdate: {
        name: {
            required: false,
            type: 'string',
            maxLength: 100,
            sanitizer: sanitizers.cleanString
        },
        bio: {
            required: false,
            type: 'string',
            maxLength: 500,
            sanitizer: sanitizers.cleanString
        },
        website: {
            required: false,
            type: 'string',
            maxLength: 200,
            validator: (value) => !value || validator.isURL(value, { require_protocol: true })
        }
    },
    
    // Contact form
    contact: {
        name: {
            required: true,
            type: 'string',
            maxLength: 100,
            minLength: 2,
            sanitizer: sanitizers.cleanString
        },
        email: {
            required: true,
            type: 'string',
            maxLength: 254,
            validator: validator.isEmail,
            sanitizer: sanitizers.cleanEmail
        },
        message: {
            required: true,
            type: 'string',
            maxLength: 2000,
            minLength: 10,
            sanitizer: sanitizers.cleanString
        }
    }
};

// SQL injection prevention
function preventSqlInjection(req, res, next) {
    const sqlPatterns = [
        /('|(\\')|(;)|(\\;)|(SELECT|select)|(INSERT|insert)|(UPDATE|update)|(DELETE|delete)|(DROP|drop)|(CREATE|create)|(ALTER|alter)|(EXEC|exec)|(UNION|union)|(SCRIPT|script))/i
    ];
    
    const checkValue = (value) => {
        if (typeof value === 'string') {
            return sqlPatterns.some(pattern => pattern.test(value));
        }
        return false;
    };
    
    // Check request body
    if (req.body) {
        for (const [key, value] of Object.entries(req.body)) {
            if (checkValue(value)) {
                console.warn(`🚨 SQL injection attempt detected: ${key} = ${value}`);
                return res.status(400).json({
                    error: 'Invalid input detected',
                    code: 'INVALID_INPUT'
                });
            }
        }
    }
    
    // Check query parameters
    if (req.query) {
        for (const [key, value] of Object.entries(req.query)) {
            if (checkValue(value)) {
                console.warn(`🚨 SQL injection attempt in query: ${key} = ${value}`);
                return res.status(400).json({
                    error: 'Invalid query parameter',
                    code: 'INVALID_QUERY'
                });
            }
        }
    }
    
    next();
}

// XSS prevention middleware
function preventXss(req, res, next) {
    const xssPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi
    ];
    
    const checkValue = (value) => {
        if (typeof value === 'string') {
            return xssPatterns.some(pattern => pattern.test(value));
        }
        return false;
    };
    
    // Check request body
    if (req.body) {
        for (const [key, value] of Object.entries(req.body)) {
            if (checkValue(value)) {
                console.warn(`🚨 XSS attempt detected: ${key}`);
                return res.status(400).json({
                    error: 'Potentially dangerous content detected',
                    code: 'XSS_DETECTED'
                });
            }
        }
    }
    
    next();
}

module.exports = {
    schemas,
    sanitizers,
    createValidator,
    validationSchemas,
    preventSqlInjection,
    preventXss
};
```

### 4. WAF Configuration
**File**: `waf-config.json`
```json
{
  "name": "4site.pro Web Application Firewall",
  "version": "1.0",
  "description": "WAF rules for 4site.pro production environment",
  
  "global_settings": {
    "default_action": "ALLOW",
    "logging": true,
    "metrics": true,
    "rate_limiting": true
  },
  
  "ip_rules": {
    "whitelist": [
      "127.0.0.1/32",
      "10.0.0.0/8",
      "172.16.0.0/12",
      "192.168.0.0/16"
    ],
    "blacklist": [
      "YOUR-BLOCKED-IP-RANGES-HERE"
    ],
    "geo_blocking": {
      "enabled": false,
      "blocked_countries": []
    }
  },
  
  "rate_limiting": {
    "global": {
      "requests_per_minute": 1000,
      "burst_size": 2000
    },
    "per_ip": {
      "requests_per_minute": 100,
      "burst_size": 200
    },
    "endpoints": {
      "/api/generate": {
        "requests_per_minute": 10,
        "burst_size": 20
      },
      "/auth/*": {
        "requests_per_minute": 5,
        "burst_size": 10
      }
    }
  },
  
  "security_rules": [
    {
      "id": "SQL_INJECTION_DETECTION",
      "enabled": true,
      "action": "BLOCK",
      "description": "Detect and block SQL injection attempts",
      "conditions": {
        "body_contains": [
          "UNION SELECT",
          "DROP TABLE",
          "INSERT INTO",
          "DELETE FROM",
          "'; --",
          "' OR '1'='1"
        ],
        "query_contains": [
          "UNION SELECT",
          "DROP TABLE"
        ]
      }
    },
    {
      "id": "XSS_DETECTION",
      "enabled": true,
      "action": "BLOCK",
      "description": "Detect and block XSS attempts",
      "conditions": {
        "body_contains": [
          "<script",
          "javascript:",
          "onerror=",
          "onload=",
          "eval(",
          "document.cookie"
        ],
        "headers_contain": [
          "<script",
          "javascript:"
        ]
      }
    },
    {
      "id": "COMMAND_INJECTION",
      "enabled": true,
      "action": "BLOCK",
      "description": "Detect command injection attempts",
      "conditions": {
        "body_contains": [
          ";cat ",
          ";ls ",
          ";rm ",
          "$(cat",
          "`cat",
          "&& cat",
          "| cat"
        ]
      }
    },
    {
      "id": "PATH_TRAVERSAL",
      "enabled": true,
      "action": "BLOCK",
      "description": "Detect directory traversal attempts",
      "conditions": {
        "url_contains": [
          "../",
          "..\\",
          "/etc/passwd",
          "/etc/shadow",
          "\\windows\\system32"
        ]
      }
    },
    {
      "id": "BOT_DETECTION",
      "enabled": true,
      "action": "CHALLENGE",
      "description": "Detect and challenge suspicious bots",
      "conditions": {
        "user_agent_matches": [
          ".*bot.*",
          ".*crawler.*",
          ".*spider.*",
          ".*scraper.*"
        ],
        "exclude_user_agents": [
          "Googlebot",
          "Bingbot",
          "facebookexternalhit"
        ]
      }
    },
    {
      "id": "LARGE_REQUEST_BODY",
      "enabled": true,
      "action": "BLOCK",
      "description": "Block requests with large bodies",
      "conditions": {
        "body_size_greater_than": 10485760
      }
    },
    {
      "id": "SUSPICIOUS_HEADERS",
      "enabled": true,
      "action": "BLOCK",
      "description": "Block requests with suspicious headers",
      "conditions": {
        "headers_contain": [
          "X-Forwarded-For: <script",
          "User-Agent: <script",
          "Referer: javascript:"
        ]
      }
    }
  ],
  
  "ddos_protection": {
    "enabled": true,
    "threshold_requests_per_second": 100,
    "threshold_requests_per_minute": 1000,
    "auto_ban_duration_minutes": 60,
    "challenge_duration_minutes": 10
  },
  
  "logging": {
    "level": "INFO",
    "log_blocked_requests": true,
    "log_allowed_requests": false,
    "log_rate_limited_requests": true,
    "retention_days": 30
  }
}
```

### 5. Security Audit Script
**File**: `security-audit.sh`
```bash
#!/bin/bash

# Comprehensive Security Audit for 4site.pro
set -e

echo "🛡️  Starting security audit for 4site.pro..."

DOMAIN="${DOMAIN:-4site.pro}"
API_DOMAIN="${API_DOMAIN:-api.4site.pro}"
REPORT_FILE="security-audit-$(date +%Y%m%d-%H%M%S).json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Audit results storage
AUDIT_RESULTS=()

# Function to add audit result
add_result() {
    local test_name="$1"
    local status="$2"
    local details="$3"
    local severity="$4"
    
    AUDIT_RESULTS+=("{\"test\":\"$test_name\",\"status\":\"$status\",\"details\":\"$details\",\"severity\":\"$severity\"}")
    
    if [[ "$status" == "PASS" ]]; then
        echo -e "${GREEN}✅ $test_name: PASS${NC}"
    elif [[ "$status" == "WARN" ]]; then
        echo -e "${YELLOW}⚠️  $test_name: WARNING - $details${NC}"
    else
        echo -e "${RED}❌ $test_name: FAIL - $details${NC}"
    fi
}

# SSL/TLS Security Tests
echo "🔒 Testing SSL/TLS configuration..."

# Check SSL certificate
check_ssl_cert() {
    local domain="$1"
    
    if ssl_info=$(echo | openssl s_client -connect "$domain:443" -servername "$domain" 2>/dev/null | openssl x509 -noout -dates -subject -issuer 2>/dev/null); then
        
        # Check expiration
        expiry=$(echo "$ssl_info" | grep "notAfter" | cut -d= -f2)
        expiry_timestamp=$(date -d "$expiry" +%s 2>/dev/null || echo "0")
        current_timestamp=$(date +%s)
        days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
        
        if [[ $days_until_expiry -gt 30 ]]; then
            add_result "SSL Certificate Validity ($domain)" "PASS" "Valid for $days_until_expiry days" "LOW"
        elif [[ $days_until_expiry -gt 7 ]]; then
            add_result "SSL Certificate Validity ($domain)" "WARN" "Expires in $days_until_expiry days" "MEDIUM"
        else
            add_result "SSL Certificate Validity ($domain)" "FAIL" "Expires in $days_until_expiry days" "HIGH"
        fi
        
        # Check issuer
        if echo "$ssl_info" | grep -q "Let's Encrypt\|DigiCert\|Cloudflare"; then
            add_result "SSL Certificate Authority ($domain)" "PASS" "Trusted CA" "LOW"
        else
            add_result "SSL Certificate Authority ($domain)" "WARN" "Unknown CA" "MEDIUM"
        fi
        
    else
        add_result "SSL Certificate ($domain)" "FAIL" "Certificate not accessible" "HIGH"
    fi
}

check_ssl_cert "$DOMAIN"
check_ssl_cert "$API_DOMAIN"

# Test SSL configuration
if ssl_test=$(curl -s -I "https://$DOMAIN" 2>&1); then
    add_result "HTTPS Accessibility" "PASS" "Site accessible via HTTPS" "LOW"
else
    add_result "HTTPS Accessibility" "FAIL" "Site not accessible via HTTPS" "HIGH"
fi

# Security Headers Tests
echo "🛡️  Testing security headers..."

test_security_headers() {
    local domain="$1"
    local headers=$(curl -s -I "https://$domain" 2>/dev/null || echo "")
    
    # Test HSTS
    if echo "$headers" | grep -qi "strict-transport-security"; then
        hsts_value=$(echo "$headers" | grep -i "strict-transport-security" | cut -d: -f2 | tr -d ' \r\n')
        if echo "$hsts_value" | grep -q "max-age=31536000"; then
            add_result "HSTS Header ($domain)" "PASS" "Properly configured" "LOW"
        else
            add_result "HSTS Header ($domain)" "WARN" "Configured but weak: $hsts_value" "MEDIUM"
        fi
    else
        add_result "HSTS Header ($domain)" "FAIL" "Missing HSTS header" "MEDIUM"
    fi
    
    # Test CSP
    if echo "$headers" | grep -qi "content-security-policy"; then
        add_result "CSP Header ($domain)" "PASS" "CSP header present" "LOW"
    else
        add_result "CSP Header ($domain)" "FAIL" "Missing CSP header" "MEDIUM"
    fi
    
    # Test X-Frame-Options
    if echo "$headers" | grep -qi "x-frame-options"; then
        add_result "X-Frame-Options ($domain)" "PASS" "Clickjacking protection enabled" "LOW"
    else
        add_result "X-Frame-Options ($domain)" "FAIL" "Missing clickjacking protection" "MEDIUM"
    fi
    
    # Test X-Content-Type-Options
    if echo "$headers" | grep -qi "x-content-type-options.*nosniff"; then
        add_result "X-Content-Type-Options ($domain)" "PASS" "MIME sniffing protection enabled" "LOW"
    else
        add_result "X-Content-Type-Options ($domain)" "FAIL" "Missing MIME sniffing protection" "LOW"
    fi
    
    # Test X-XSS-Protection
    if echo "$headers" | grep -qi "x-xss-protection"; then
        add_result "X-XSS-Protection ($domain)" "PASS" "XSS protection enabled" "LOW"
    else
        add_result "X-XSS-Protection ($domain)" "WARN" "Missing XSS protection header" "LOW"
    fi
    
    # Test Referrer Policy
    if echo "$headers" | grep -qi "referrer-policy"; then
        add_result "Referrer-Policy ($domain)" "PASS" "Referrer policy configured" "LOW"
    else
        add_result "Referrer-Policy ($domain)" "WARN" "Missing referrer policy" "LOW"
    fi
}

test_security_headers "$DOMAIN"
test_security_headers "$API_DOMAIN"

# DNS Security Tests
echo "🌐 Testing DNS security..."

# Check DNSSEC
if dig +dnssec "$DOMAIN" | grep -q "ad"; then
    add_result "DNSSEC" "PASS" "DNSSEC enabled" "LOW"
else
    add_result "DNSSEC" "WARN" "DNSSEC not enabled" "MEDIUM"
fi

# Check for DNS over HTTPS
if dig @1.1.1.1 "$DOMAIN" >/dev/null 2>&1; then
    add_result "DNS Resolution" "PASS" "DNS resolving correctly" "LOW"
else
    add_result "DNS Resolution" "FAIL" "DNS resolution issues" "HIGH"
fi

# API Security Tests
echo "🔌 Testing API security..."

# Test API rate limiting
test_api_rate_limiting() {
    local api_url="https://$API_DOMAIN"
    local responses=()
    
    echo "Testing rate limiting on $api_url..."
    
    for i in {1..10}; do
        response=$(curl -s -w "%{http_code}" -o /dev/null "$api_url/api/public/health" 2>/dev/null || echo "000")
        responses+=($response)
        sleep 0.1
    done
    
    # Check if any requests were rate limited (429)
    if printf '%s\n' "${responses[@]}" | grep -q "429"; then
        add_result "API Rate Limiting" "PASS" "Rate limiting active" "LOW"
    else
        add_result "API Rate Limiting" "WARN" "Rate limiting not detected" "MEDIUM"
    fi
}

test_api_rate_limiting

# Test API authentication
if api_response=$(curl -s "https://$API_DOMAIN/api/user/profile" 2>/dev/null); then
    if echo "$api_response" | grep -q "401\|authentication"; then
        add_result "API Authentication" "PASS" "Protected endpoints require authentication" "LOW"
    else
        add_result "API Authentication" "WARN" "Protected endpoints may not require authentication" "MEDIUM"
    fi
else
    add_result "API Connectivity" "FAIL" "API not accessible" "HIGH"
fi

# Infrastructure Security Tests
echo "🏗️  Testing infrastructure security..."

# Check for server information disclosure
if headers=$(curl -s -I "https://$DOMAIN" 2>/dev/null); then
    if echo "$headers" | grep -qi "server:.*nginx\|apache\|iis"; then
        server_header=$(echo "$headers" | grep -i "server:" | cut -d: -f2 | tr -d ' \r\n')
        add_result "Server Header Disclosure" "WARN" "Server information disclosed: $server_header" "LOW"
    else
        add_result "Server Header Disclosure" "PASS" "Server information properly hidden" "LOW"
    fi
    
    if echo "$headers" | grep -qi "x-powered-by"; then
        powered_by=$(echo "$headers" | grep -i "x-powered-by" | cut -d: -f2 | tr -d ' \r\n')
        add_result "X-Powered-By Disclosure" "WARN" "Technology stack disclosed: $powered_by" "LOW"
    else
        add_result "X-Powered-By Disclosure" "PASS" "Technology stack properly hidden" "LOW"
    fi
fi

# Test for common vulnerabilities
echo "🔍 Testing for common vulnerabilities..."

# Test for directory traversal
if response=$(curl -s "https://$DOMAIN/../etc/passwd" 2>/dev/null); then
    if echo "$response" | grep -q "root:"; then
        add_result "Directory Traversal" "FAIL" "Directory traversal vulnerability detected" "HIGH"
    else
        add_result "Directory Traversal" "PASS" "No directory traversal vulnerability" "LOW"
    fi
fi

# Test for SQL injection (basic)
if response=$(curl -s "https://$API_DOMAIN/api/test?id=1'OR'1'='1" 2>/dev/null); then
    if echo "$response" | grep -qi "sql\|database\|mysql\|postgresql"; then
        add_result "SQL Injection Test" "FAIL" "Potential SQL injection vulnerability" "HIGH"
    else
        add_result "SQL Injection Test" "PASS" "No obvious SQL injection vulnerability" "LOW"
    fi
fi

# Generate final report
echo "📊 Generating security audit report..."

# Count results by severity
high_count=$(printf '%s\n' "${AUDIT_RESULTS[@]}" | grep -c "HIGH" || echo "0")
medium_count=$(printf '%s\n' "${AUDIT_RESULTS[@]}" | grep -c "MEDIUM" || echo "0")
low_count=$(printf '%s\n' "${AUDIT_RESULTS[@]}" | grep -c "LOW" || echo "0")

fail_count=$(printf '%s\n' "${AUDIT_RESULTS[@]}" | grep -c '"status":"FAIL"' || echo "0")
warn_count=$(printf '%s\n' "${AUDIT_RESULTS[@]}" | grep -c '"status":"WARN"' || echo "0")
pass_count=$(printf '%s\n' "${AUDIT_RESULTS[@]}" | grep -c '"status":"PASS"' || echo "0")

# Create JSON report
cat > "$REPORT_FILE" << EOF
{
  "audit_info": {
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "domain": "$DOMAIN",
    "api_domain": "$API_DOMAIN",
    "auditor": "4site.pro Security Audit Script v1.0"
  },
  "summary": {
    "total_tests": $((high_count + medium_count + low_count)),
    "passed": $pass_count,
    "warnings": $warn_count,
    "failed": $fail_count,
    "high_severity": $high_count,
    "medium_severity": $medium_count,
    "low_severity": $low_count
  },
  "results": [
    $(IFS=','; echo "${AUDIT_RESULTS[*]}")
  ],
  "recommendations": [
    "Ensure all HIGH severity issues are resolved immediately",
    "Address MEDIUM severity issues within 24 hours",
    "Monitor and improve LOW severity items during next maintenance window",
    "Schedule regular security audits (monthly recommended)",
    "Implement automated security monitoring",
    "Keep all dependencies and systems updated"
  ]
}
EOF

echo ""
echo "🎯 Security Audit Summary:"
echo "========================="
echo -e "Total Tests: $((high_count + medium_count + low_count))"
echo -e "${GREEN}Passed: $pass_count${NC}"
echo -e "${YELLOW}Warnings: $warn_count${NC}"
echo -e "${RED}Failed: $fail_count${NC}"
echo ""
echo "Severity Breakdown:"
echo -e "${RED}High: $high_count${NC}"
echo -e "${YELLOW}Medium: $medium_count${NC}"
echo -e "Low: $low_count"
echo ""
echo "📄 Detailed report saved to: $REPORT_FILE"

# Exit with appropriate code
if [[ $fail_count -gt 0 ]]; then
    echo -e "${RED}🚨 Security audit failed! Please address the issues above.${NC}"
    exit 1
elif [[ $warn_count -gt 0 ]]; then
    echo -e "${YELLOW}⚠️  Security audit completed with warnings.${NC}"
    exit 0
else
    echo -e "${GREEN}✅ Security audit passed!${NC}"
    exit 0
fi
```

### 6. Environment Security Configuration
**File**: `environment-security.js`
```javascript
// Environment Security Configuration for 4site.pro
const crypto = require('crypto');
const fs = require('fs');

// Required environment variables
const REQUIRED_ENV_VARS = [
    'NODE_ENV',
    'JWT_SECRET',
    'SESSION_SECRET',
    'GITHUB_CLIENT_SECRET',
    'CLOUDFLARE_API_TOKEN',
    'DATABASE_URL'
];

// Sensitive patterns to detect in environment variables
const SENSITIVE_PATTERNS = [
    /password/i,
    /secret/i,
    /key/i,
    /token/i,
    /credential/i
];

// Validate environment variables
function validateEnvironment() {
    const errors = [];
    const warnings = [];
    
    console.log('🔐 Validating environment security...');
    
    // Check required variables
    for (const envVar of REQUIRED_ENV_VARS) {
        if (!process.env[envVar]) {
            errors.push(`Missing required environment variable: ${envVar}`);
        } else if (process.env[envVar].includes('YOUR-') && process.env[envVar].includes('-HERE')) {
            errors.push(`Environment variable ${envVar} still contains placeholder value`);
        }
    }
    
    // Check for weak secrets
    const secretVars = ['JWT_SECRET', 'SESSION_SECRET'];
    for (const secretVar of secretVars) {
        const secret = process.env[secretVar];
        if (secret) {
            if (secret.length < 32) {
                warnings.push(`${secretVar} is too short (minimum 32 characters recommended)`);
            }
            if (!/[A-Z]/.test(secret) || !/[a-z]/.test(secret) || !/[0-9]/.test(secret)) {
                warnings.push(`${secretVar} should contain uppercase, lowercase, and numbers`);
            }
        }
    }
    
    // Check production environment
    if (process.env.NODE_ENV === 'production') {
        if (process.env.DEBUG === 'true') {
            warnings.push('DEBUG mode is enabled in production');
        }
        
        if (!process.env.HTTPS || process.env.HTTPS !== 'true') {
            errors.push('HTTPS must be enabled in production');
        }
    }
    
    // Check for sensitive data in logs
    const logLevel = process.env.LOG_LEVEL || 'info';
    if (logLevel === 'debug' && process.env.NODE_ENV === 'production') {
        warnings.push('Debug logging enabled in production - may expose sensitive data');
    }
    
    if (errors.length > 0) {
        console.error('❌ Environment validation failed:');
        errors.forEach(error => console.error(`  - ${error}`));
        process.exit(1);
    }
    
    if (warnings.length > 0) {
        console.warn('⚠️  Environment warnings:');
        warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
    
    console.log('✅ Environment validation passed');
}

// Generate secure random secrets
function generateSecureSecret(length = 64) {
    return crypto.randomBytes(length).toString('hex');
}

// Encrypt sensitive environment variables
function encryptEnvValue(value, key) {
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

// Decrypt sensitive environment variables
function decryptEnvValue(encryptedValue, key) {
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encryptedValue, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// Secure environment loader
function loadSecureEnvironment(envFile = '.env.secure') {
    if (!fs.existsSync(envFile)) {
        console.log(`ℹ️  Secure environment file ${envFile} not found, using regular environment`);
        return;
    }
    
    const masterKey = process.env.MASTER_KEY;
    if (!masterKey) {
        console.error('❌ MASTER_KEY required for secure environment loading');
        process.exit(1);
    }
    
    try {
        const encryptedData = fs.readFileSync(envFile, 'utf8');
        const decryptedData = decryptEnvValue(encryptedData, masterKey);
        
        // Parse and set environment variables
        const lines = decryptedData.split('\n');
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                const [key, ...valueParts] = trimmedLine.split('=');
                const value = valueParts.join('=');
                if (key && value) {
                    process.env[key.trim()] = value.trim();
                }
            }
        }
        
        console.log('✅ Secure environment loaded');
    } catch (error) {
        console.error('❌ Failed to load secure environment:', error.message);
        process.exit(1);
    }
}

// Environment security middleware
function createSecurityMiddleware() {
    return (req, res, next) => {
        // Remove sensitive headers
        res.removeHeader('X-Powered-By');
        res.removeHeader('Server');
        
        // Add security context to request
        req.security = {
            isProduction: process.env.NODE_ENV === 'production',
            isSecure: req.secure || req.headers['x-forwarded-proto'] === 'https',
            userAgent: req.get('User-Agent'),
            ip: req.ip || req.connection.remoteAddress
        };
        
        // Log security events in production
        if (req.security.isProduction) {
            const securityLog = {
                timestamp: new Date().toISOString(),
                ip: req.security.ip,
                userAgent: req.security.userAgent,
                method: req.method,
                path: req.path,
                secure: req.security.isSecure
            };
            
            // In production, you'd send this to a secure logging service
            if (process.env.LOG_SECURITY === 'true') {
                console.log('🔒 Security log:', JSON.stringify(securityLog));
            }
        }
        
        next();
    };
}

// Generate environment template
function generateEnvTemplate() {
    const template = `# 4site.pro Production Environment Configuration
# Generated on ${new Date().toISOString()}
# IMPORTANT: Replace all placeholder values before deployment

# Application Environment
NODE_ENV=production
PORT=3000
HTTPS=true

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/foursite_prod
REDIS_URL=redis://localhost:6379

# API Keys and Secrets
JWT_SECRET=${generateSecureSecret(64)}
SESSION_SECRET=${generateSecureSecret(64)}
MASTER_KEY=${generateSecureSecret(32)}

# GitHub OAuth
GITHUB_CLIENT_ID=YOUR-GITHUB-CLIENT-ID-HERE
GITHUB_CLIENT_SECRET=YOUR-GITHUB-CLIENT-SECRET-HERE
GITHUB_WEBHOOK_SECRET=${generateSecureSecret(32)}

# Google Services
GEMINI_API_KEY=YOUR-GEMINI-API-KEY-HERE

# Cloudflare
CLOUDFLARE_API_TOKEN=YOUR-CLOUDFLARE-API-TOKEN-HERE
CLOUDFLARE_ZONE_ID=YOUR-ZONE-ID-HERE

# Monitoring and Logging
LOG_LEVEL=info
LOG_SECURITY=true
SENTRY_DSN=YOUR-SENTRY-DSN-HERE

# URLs
FRONTEND_URL=https://4site.pro
API_URL=https://api.4site.pro
CDN_URL=https://cdn.4site.pro

# Security Settings
ALLOWED_ORIGINS=https://4site.pro,https://www.4site.pro
ADMIN_USERS=your-github-username
RATE_LIMIT_ENABLED=true

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_ERROR_REPORTING=true
ENABLE_MAINTENANCE_MODE=false
`;

    fs.writeFileSync('.env.template', template);
    console.log('✅ Environment template generated: .env.template');
}

module.exports = {
    validateEnvironment,
    generateSecureSecret,
    encryptEnvValue,
    decryptEnvValue,
    loadSecureEnvironment,
    createSecurityMiddleware,
    generateEnvTemplate
};

// CLI usage
if (require.main === module) {
    const command = process.argv[2];
    
    switch (command) {
        case 'validate':
            validateEnvironment();
            break;
        case 'generate-template':
            generateEnvTemplate();
            break;
        case 'generate-secret':
            const length = parseInt(process.argv[3]) || 64;
            console.log(generateSecureSecret(length));
            break;
        default:
            console.log('Usage: node environment-security.js [validate|generate-template|generate-secret]');
            process.exit(1);
    }
}
```

## Environment Variables Required

Create `.env.security` file:
```bash
# Security Configuration for 4site.pro
NODE_ENV=production
HTTPS=true

# Security Secrets
JWT_SECRET=YOUR-JWT-SECRET-HERE
SESSION_SECRET=YOUR-SESSION-SECRET-HERE
MASTER_KEY=YOUR-MASTER-KEY-HERE

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security Features
ENABLE_HELMET=true
ENABLE_CORS=true
ENABLE_CSP=true
ENABLE_HSTS=true

# Logging and Monitoring
LOG_SECURITY=true
LOG_LEVEL=info
SENTRY_DSN=YOUR-SENTRY-DSN-HERE

# WAF Configuration
WAF_ENABLED=true
WAF_STRICT_MODE=true
```

## Integration Instructions

### Express.js Application
```javascript
const express = require('express');
const { configureSecurityHeaders, rateLimiters } = require('./security-headers');
const { createCorsMiddleware } = require('./cors-config');
const { createValidator, validationSchemas, preventSqlInjection, preventXss } = require('./input-validation');
const { createSecurityMiddleware, validateEnvironment } = require('./environment-security');

const app = express();

// Validate environment on startup
validateEnvironment();

// Apply security middleware
app.use(createSecurityMiddleware());
configureSecurityHeaders(app);
app.use(createCorsMiddleware());

// Global security middleware
app.use(preventSqlInjection);
app.use(preventXss);

// Apply rate limiting
app.use('/api/', rateLimiters.general);
app.use('/auth/', rateLimiters.auth);
app.use('/api/generate', rateLimiters.generation);

// Apply input validation to specific endpoints
app.post('/api/generate', createValidator(validationSchemas.siteGeneration), (req, res) => {
    // Site generation logic
});

app.put('/api/profile', createValidator(validationSchemas.profileUpdate), (req, res) => {
    // Profile update logic
});
```

## Execution Instructions

1. **Install Dependencies**:
   ```bash
   npm install helmet express-rate-limit cors validator isomorphic-dompurify
   ```

2. **Configure Environment**:
   ```bash
   node environment-security.js generate-template
   cp .env.template .env.security
   # Edit .env.security with actual values
   ```

3. **Run Security Audit**:
   ```bash
   chmod +x security-audit.sh
   ./security-audit.sh
   ```

4. **Validate Configuration**:
   ```bash
   node environment-security.js validate
   ```

## Success Criteria
- ✅ All security headers properly configured
- ✅ Rate limiting active and tested
- ✅ Input validation prevents common attacks
- ✅ WAF rules block malicious requests
- ✅ Environment variables secured
- ✅ Security audit passes with no high-severity issues
- ✅ HTTPS enforced across all domains
- ✅ Comprehensive logging and monitoring active