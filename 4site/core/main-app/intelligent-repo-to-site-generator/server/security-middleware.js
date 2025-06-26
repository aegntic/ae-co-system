import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import DOMPurify from 'isomorphic-dompurify';
import { body, validationResult } from 'express-validator';
import winston from 'winston';

// Security logger configuration
const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/security.log' }),
    new winston.transports.Console()
  ]
});

// Log security events
export const logSecurityEvent = (event, details, req) => {
  securityLogger.warn('Security Event', {
    event,
    details,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    url: req.originalUrl,
    method: req.method
  });
};

// CORS configuration
export const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://4site.pro', 
        'https://www.4site.pro', 
        'https://project4site.com',
        'https://*.4site.pro',
        'https://*.project4site.com'
      ]
    : [
        'http://localhost:5173', 
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:5173'
      ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'X-CSRF-Token',
    'X-API-Key'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining']
};

// Rate limiting configurations
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60 // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      limit: options.max,
      windowMs: options.windowMs
    }, req);
    res.status(429).json(options.message);
  }
});

export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // strict limit for sensitive endpoints
  message: {
    error: 'Rate limit exceeded for sensitive operations.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logSecurityEvent('STRICT_RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      limit: options.max,
      endpoint: req.originalUrl
    }, req);
    res.status(429).json(options.message);
  }
});

export const apiKeyRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // API key based limit
  keyGenerator: (req) => {
    return req.headers['x-api-key'] || req.ip;
  },
  message: {
    error: 'API rate limit exceeded. Upgrade your plan for higher limits.',
    retryAfter: 60 * 60
  }
});

// Helmet security headers configuration
export const helmetConfig = helmet({
  contentSecurityPolicy: false, // We'll use meta tag for better control
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { 
    policy: ['same-origin', 'strict-origin-when-cross-origin'] 
  },
  frameguard: { action: 'deny' },
  dnsPrefetchControl: true,
  ieNoOpen: true,
  permittedCrossDomainPolicies: false
});

// Additional security headers middleware
export const additionalSecurityHeaders = (req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Restrict permissions
  res.setHeader('Permissions-Policy', 
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  
  // Cross-Origin policies
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  
  next();
};

// Input validation and sanitization
export const validateAndSanitizeInput = [
  // Email validation
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('Invalid email format'),
  
  // UUID validation for IDs
  body('siteId')
    .optional()
    .isUUID()
    .withMessage('Invalid site ID format'),
  
  // String fields sanitization
  body(['projectType', 'template', 'title', 'description'])
    .optional()
    .trim()
    .escape()
    .isLength({ max: 500 })
    .withMessage('Field too long'),
  
  // URL validation
  body('repo_url')
    .optional()
    .isURL({
      protocols: ['http', 'https'],
      require_protocol: true,
      require_valid_protocol: true
    })
    .withMessage('Invalid repository URL'),
  
  // Custom validation middleware
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logSecurityEvent('INPUT_VALIDATION_FAILED', {
        errors: errors.array(),
        body: req.body
      }, req);
      
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid input data',
        details: errors.array()
      });
    }
    
    // Sanitize all string inputs with DOMPurify
    const sanitizeObject = (obj) => {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'string') {
          obj[key] = DOMPurify.sanitize(obj[key], {
            ALLOWED_TAGS: [], // No HTML tags allowed
            ALLOWED_ATTR: []
          });
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      });
    };
    
    if (req.body && typeof req.body === 'object') {
      sanitizeObject(req.body);
    }
    
    next();
  }
];

// API authentication middleware
export const authenticateAPI = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  const apiKey = req.header('X-API-Key');
  
  // For development, allow requests without authentication
  if (process.env.NODE_ENV === 'development' && !token && !apiKey) {
    return next();
  }
  
  if (!token && !apiKey) {
    logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', {
      endpoint: req.originalUrl,
      method: req.method
    }, req);
    
    return res.status(401).json({ 
      success: false,
      error: 'Access denied. Authentication required.' 
    });
  }
  
  // API Key authentication (for external integrations)
  if (apiKey) {
    if (isValidApiKey(apiKey)) {
      req.apiKey = apiKey;
      return next();
    } else {
      logSecurityEvent('INVALID_API_KEY', {
        apiKey: apiKey.substring(0, 8) + '...',
        endpoint: req.originalUrl
      }, req);
      
      return res.status(401).json({ 
        success: false,
        error: 'Invalid API key.' 
      });
    }
  }
  
  // JWT token authentication
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (ex) {
    logSecurityEvent('INVALID_JWT_TOKEN', { 
      token: token.substring(0, 20) + '...',
      error: ex.message 
    }, req);
    
    res.status(401).json({ 
      success: false,
      error: 'Invalid authentication token.' 
    });
  }
};

// API key validation (implement your logic)
const isValidApiKey = (apiKey) => {
  // In production, validate against database
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
  return validApiKeys.includes(apiKey);
};

// Security monitoring middleware
export const securityMonitoring = (req, res, next) => {
  const startTime = Date.now();
  
  // Monitor for suspicious patterns
  const suspiciousPatterns = [
    /\.\./,  // Path traversal
    /<script/i,  // XSS attempts
    /union.*select/i,  // SQL injection
    /javascript:/i,  // JavaScript protocol
    /data:text\/html/i  // Data URLs
  ];
  
  const fullUrl = req.originalUrl + JSON.stringify(req.body);
  const suspicious = suspiciousPatterns.some(pattern => pattern.test(fullUrl));
  
  if (suspicious) {
    logSecurityEvent('SUSPICIOUS_REQUEST_PATTERN', {
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      query: req.query
    }, req);
  }
  
  // Monitor response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log slow responses (potential DoS)
    if (duration > 5000) {
      logSecurityEvent('SLOW_RESPONSE', {
        duration,
        endpoint: req.originalUrl,
        statusCode: res.statusCode
      }, req);
    }
    
    // Log error responses
    if (res.statusCode >= 400) {
      logSecurityEvent('ERROR_RESPONSE', {
        statusCode: res.statusCode,
        endpoint: req.originalUrl,
        method: req.method
      }, req);
    }
  });
  
  next();
};

// IP reputation checking middleware
export const ipReputationCheck = (req, res, next) => {
  const clientIP = req.ip;
  
  // Check against known malicious IP ranges (implement your logic)
  const maliciousIPs = process.env.BLOCKED_IPS?.split(',') || [];
  
  if (maliciousIPs.includes(clientIP)) {
    logSecurityEvent('BLOCKED_IP_ACCESS_ATTEMPT', {
      ip: clientIP,
      endpoint: req.originalUrl
    }, req);
    
    return res.status(403).json({
      success: false,
      error: 'Access denied from this IP address.'
    });
  }
  
  next();
};

// Export all middleware for easy import
export default {
  corsOptions,
  generalRateLimit,
  strictRateLimit,
  apiKeyRateLimit,
  helmetConfig,
  additionalSecurityHeaders,
  validateAndSanitizeInput,
  authenticateAPI,
  securityMonitoring,
  ipReputationCheck,
  logSecurityEvent
};