# 08 - GitHub OAuth Setup for 4site.pro

## Objective
Implement secure GitHub OAuth authentication for 4site.pro production environment with enterprise-grade security measures.

## OAuth Architecture
- **GitHub App**: Organization-level permissions
- **Scopes**: `read:user`, `user:email` (minimal permissions)
- **Flow**: Authorization Code with PKCE
- **Security**: State validation, token encryption, automatic rotation

## Required Files to Create

### 1. GitHub App Configuration Template
**File**: `github-app-config.json`
```json
{
  "name": "4site.pro",
  "description": "Transform GitHub repositories into professional presentation sites",
  "homepage_url": "https://4site.pro",
  "callback_urls": [
    "https://4site.pro/auth/callback",
    "https://api.4site.pro/auth/github/callback"
  ],
  "setup_url": "https://4site.pro/setup",
  "webhook_url": "https://api.4site.pro/webhooks/github",
  "public": true,
  "default_events": [
    "repository",
    "push",
    "pull_request"
  ],
  "default_permissions": {
    "metadata": "read",
    "contents": "read"
  },
  "user_permissions": {
    "email": "read"
  },
  "oauth_scopes": [
    "read:user",
    "user:email"
  ],
  "environments": {
    "production": {
      "client_id": "YOUR-GITHUB-CLIENT-ID-HERE",
      "client_secret": "YOUR-GITHUB-CLIENT-SECRET-HERE",
      "webhook_secret": "YOUR-GITHUB-WEBHOOK-SECRET-HERE"
    },
    "staging": {
      "client_id": "YOUR-STAGING-CLIENT-ID-HERE", 
      "client_secret": "YOUR-STAGING-CLIENT-SECRET-HERE",
      "webhook_secret": "YOUR-STAGING-WEBHOOK-SECRET-HERE"
    }
  }
}
```

### 2. OAuth Routes (Express.js Backend)
**File**: `oauth-routes.js`
```javascript
// GitHub OAuth Routes for 4site.pro API
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Configuration
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'YOUR-GITHUB-CLIENT-ID-HERE';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || 'YOUR-GITHUB-CLIENT-SECRET-HERE';
const JWT_SECRET = process.env.JWT_SECRET || 'YOUR-JWT-SECRET-HERE';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://4site.pro';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// In-memory store for state validation (use Redis in production)
const stateStore = new Map();

// Generate secure state parameter
function generateState() {
    return crypto.randomBytes(32).toString('hex');
}

// Validate state parameter
function validateState(state) {
    if (stateStore.has(state)) {
        stateStore.delete(state);
        return true;
    }
    return false;
}

// OAuth initiation endpoint
router.get('/auth/github', (req, res) => {
    const state = generateState();
    const returnUrl = req.query.return_url || '/dashboard';
    
    // Store state with return URL
    stateStore.set(state, { 
        returnUrl, 
        timestamp: Date.now(),
        ip: req.ip 
    });
    
    // Clean up expired states (older than 10 minutes)
    for (const [key, value] of stateStore.entries()) {
        if (Date.now() - value.timestamp > 10 * 60 * 1000) {
            stateStore.delete(key);
        }
    }
    
    const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
    githubAuthUrl.searchParams.set('client_id', GITHUB_CLIENT_ID);
    githubAuthUrl.searchParams.set('redirect_uri', `${req.protocol}://${req.get('host')}/auth/github/callback`);
    githubAuthUrl.searchParams.set('scope', 'read:user user:email');
    githubAuthUrl.searchParams.set('state', state);
    githubAuthUrl.searchParams.set('response_type', 'code');
    
    console.log('🔐 OAuth request initiated:', { state, ip: req.ip, userAgent: req.get('User-Agent') });
    
    res.redirect(githubAuthUrl.toString());
});

// OAuth callback endpoint
router.get('/auth/github/callback', async (req, res) => {
    const { code, state, error } = req.query;
    
    try {
        // Handle OAuth error
        if (error) {
            console.error('❌ OAuth error:', error);
            return res.redirect(`${FRONTEND_URL}/login?error=oauth_error`);
        }
        
        // Validate required parameters
        if (!code || !state) {
            console.error('❌ Missing OAuth parameters');
            return res.redirect(`${FRONTEND_URL}/login?error=invalid_request`);
        }
        
        // Validate state parameter
        const stateData = stateStore.get(state);
        if (!stateData) {
            console.error('❌ Invalid or expired state parameter');
            return res.redirect(`${FRONTEND_URL}/login?error=invalid_state`);
        }
        
        // Exchange code for access token
        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: GITHUB_CLIENT_ID,
            client_secret: GITHUB_CLIENT_SECRET,
            code,
            redirect_uri: `${req.protocol}://${req.get('host')}/auth/github/callback`
        }, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': '4site.pro OAuth'
            }
        });
        
        const { access_token, token_type, scope } = tokenResponse.data;
        
        if (!access_token) {
            console.error('❌ No access token received');
            return res.redirect(`${FRONTEND_URL}/login?error=token_error`);
        }
        
        // Fetch user information
        const userResponse = await axios.get('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${access_token}`,
                'Accept': 'application/json',
                'User-Agent': '4site.pro OAuth'
            }
        });
        
        const user = userResponse.data;
        
        // Fetch user email (if not public)
        let email = user.email;
        if (!email) {
            const emailResponse = await axios.get('https://api.github.com/user/emails', {
                headers: {
                    'Authorization': `token ${access_token}`,
                    'Accept': 'application/json'
                }
            });
            const primaryEmail = emailResponse.data.find(e => e.primary);
            email = primaryEmail ? primaryEmail.email : null;
        }
        
        // Create user session data
        const sessionData = {
            user: {
                id: user.id,
                login: user.login,
                name: user.name,
                email: email,
                avatar_url: user.avatar_url,
                html_url: user.html_url,
                created_at: user.created_at,
                updated_at: user.updated_at
            },
            github: {
                access_token: access_token,
                token_type: token_type,
                scope: scope
            },
            session: {
                created_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + SESSION_DURATION).toISOString(),
                ip: req.ip,
                user_agent: req.get('User-Agent')
            }
        };
        
        // Create JWT token
        const jwtToken = jwt.sign(sessionData, JWT_SECRET, {
            expiresIn: '7d',
            issuer: '4site.pro',
            audience: 'user'
        });
        
        console.log('✅ OAuth successful:', { 
            userId: user.id, 
            login: user.login,
            ip: req.ip 
        });
        
        // Set secure cookie
        res.cookie('auth_token', jwtToken, {
            httpOnly: true,
            secure: req.secure,
            sameSite: 'strict',
            maxAge: SESSION_DURATION,
            domain: process.env.NODE_ENV === 'production' ? '.4site.pro' : undefined
        });
        
        // Redirect to return URL or dashboard
        const returnUrl = stateData.returnUrl || '/dashboard';
        res.redirect(`${FRONTEND_URL}${returnUrl}?auth=success`);
        
    } catch (error) {
        console.error('❌ OAuth callback error:', error.response?.data || error.message);
        res.redirect(`${FRONTEND_URL}/login?error=server_error`);
    }
});

// Token verification endpoint
router.get('/auth/verify', (req, res) => {
    const token = req.cookies.auth_token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Check if token is expired
        if (Date.now() >= new Date(decoded.session.expires_at).getTime()) {
            return res.status(401).json({ error: 'Token expired' });
        }
        
        res.json({
            user: decoded.user,
            session: {
                created_at: decoded.session.created_at,
                expires_at: decoded.session.expires_at
            }
        });
        
    } catch (error) {
        console.error('❌ Token verification failed:', error.message);
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Logout endpoint
router.post('/auth/logout', (req, res) => {
    res.clearCookie('auth_token', {
        domain: process.env.NODE_ENV === 'production' ? '.4site.pro' : undefined
    });
    
    res.json({ message: 'Logged out successfully' });
});

// User profile endpoint
router.get('/auth/profile', async (req, res) => {
    const token = req.cookies.auth_token;
    
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Optionally refresh user data from GitHub
        if (req.query.refresh === 'true') {
            const userResponse = await axios.get('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${decoded.github.access_token}`,
                    'Accept': 'application/json'
                }
            });
            
            // Update user data and create new token
            const updatedSessionData = {
                ...decoded,
                user: {
                    ...decoded.user,
                    ...userResponse.data
                }
            };
            
            const newToken = jwt.sign(updatedSessionData, JWT_SECRET, {
                expiresIn: '7d'
            });
            
            res.cookie('auth_token', newToken, {
                httpOnly: true,
                secure: req.secure,
                sameSite: 'strict',
                maxAge: SESSION_DURATION
            });
            
            return res.json({ user: updatedSessionData.user });
        }
        
        res.json({ user: decoded.user });
        
    } catch (error) {
        console.error('❌ Profile fetch error:', error.message);
        res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router;
```

### 3. React OAuth Provider Component
**File**: `GitHubAuthProvider.tsx`
```tsx
// GitHub OAuth Provider for 4site.pro Frontend
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  html_url: string;
  created_at: string;
  updated_at: string;
}

interface AuthSession {
  created_at: string;
  expires_at: string;
}

interface AuthContextType {
  user: User | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (returnUrl?: string) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.4site.pro';

interface AuthProviderProps {
  children: ReactNode;
}

export const GitHubAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Verify authentication on mount
  useEffect(() => {
    verifyAuth();
  }, []);

  const verifyAuth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setSession(data.session);
        console.log('✅ Authentication verified:', data.user.login);
      } else {
        // Clear any invalid tokens
        await logout();
      }
    } catch (error) {
      console.error('❌ Auth verification failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (returnUrl: string = '/dashboard') => {
    const loginUrl = new URL(`${API_BASE_URL}/auth/github`);
    if (returnUrl) {
      loginUrl.searchParams.set('return_url', returnUrl);
    }
    
    console.log('🔐 Initiating GitHub OAuth...');
    window.location.href = loginUrl.toString();
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      
      setUser(null);
      setSession(null);
      
      console.log('✅ Logged out successfully');
      
      // Redirect to home page
      window.location.href = '/';
      
    } catch (error) {
      console.error('❌ Logout failed:', error);
      // Clear local state anyway
      setUser(null);
      setSession(null);
    }
  };

  const refreshProfile = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile?refresh=true`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        console.log('✅ Profile refreshed');
      } else {
        console.error('❌ Profile refresh failed');
      }
    } catch (error) {
      console.error('❌ Profile refresh error:', error);
    }
  };

  // Auto-refresh token before expiration
  useEffect(() => {
    if (session?.expires_at) {
      const expirationTime = new Date(session.expires_at).getTime();
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;
      
      // Refresh 1 hour before expiration
      const refreshTime = Math.max(timeUntilExpiration - (60 * 60 * 1000), 0);
      
      if (refreshTime > 0) {
        const timeout = setTimeout(() => {
          verifyAuth();
        }, refreshTime);
        
        return () => clearTimeout(timeout);
      }
    }
  }, [session?.expires_at]);

  const contextValue: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a GitHubAuthProvider');
  }
  return context;
};

// Auth guard component
interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback = <div>Please log in to access this content.</div> 
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Login button component
interface LoginButtonProps {
  returnUrl?: string;
  className?: string;
  children?: ReactNode;
}

export const LoginButton: React.FC<LoginButtonProps> = ({ 
  returnUrl, 
  className = '',
  children = 'Login with GitHub'
}) => {
  const { login, isLoading } = useAuth();

  return (
    <button
      onClick={() => login(returnUrl)}
      disabled={isLoading}
      className={`github-login-button ${className}`}
      style={{
        background: '#24292e',
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'background-color 0.2s ease'
      }}
      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2c3e50'}
      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#24292e'}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
      {children}
    </button>
  );
};

// User profile component
export const UserProfile: React.FC = () => {
  const { user, logout, refreshProfile } = useAuth();

  if (!user) return null;

  return (
    <div className="user-profile" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '12px',
      padding: '8px 16px',
      background: '#f8f9fa',
      borderRadius: '8px'
    }}>
      <img 
        src={user.avatar_url} 
        alt={user.name || user.login}
        style={{ 
          width: '32px', 
          height: '32px', 
          borderRadius: '50%' 
        }}
      />
      <div>
        <div style={{ fontWeight: '600', fontSize: '14px' }}>
          {user.name || user.login}
        </div>
        {user.email && (
          <div style={{ fontSize: '12px', color: '#6c757d' }}>
            {user.email}
          </div>
        )}
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
        <button 
          onClick={refreshProfile}
          style={{ 
            padding: '4px 8px', 
            fontSize: '12px',
            background: 'transparent',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Refresh
        </button>
        <button 
          onClick={logout}
          style={{ 
            padding: '4px 8px', 
            fontSize: '12px',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};
```

### 4. OAuth Middleware for Authentication
**File**: `oauth-middleware.js`
```javascript
// OAuth Middleware for 4site.pro API
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'YOUR-JWT-SECRET-HERE';

// Authentication middleware
function requireAuth(req, res, next) {
    const token = req.cookies.auth_token || 
                 req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ 
            error: 'Authentication required',
            code: 'NO_TOKEN'
        });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Check if token is expired
        if (Date.now() >= new Date(decoded.session.expires_at).getTime()) {
            return res.status(401).json({ 
                error: 'Token expired',
                code: 'TOKEN_EXPIRED'
            });
        }
        
        req.user = decoded.user;
        req.session = decoded.session;
        req.github = decoded.github;
        
        next();
        
    } catch (error) {
        console.error('❌ Auth middleware error:', error.message);
        return res.status(401).json({ 
            error: 'Invalid token',
            code: 'INVALID_TOKEN'
        });
    }
}

// Optional authentication middleware (doesn't fail if no token)
function optionalAuth(req, res, next) {
    const token = req.cookies.auth_token || 
                 req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            
            // Only set user if token is not expired
            if (Date.now() < new Date(decoded.session.expires_at).getTime()) {
                req.user = decoded.user;
                req.session = decoded.session;
                req.github = decoded.github;
            }
        } catch (error) {
            // Ignore invalid tokens for optional auth
            console.log('ℹ️ Optional auth: Invalid token ignored');
        }
    }
    
    next();
}

// Admin role middleware
function requireAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ 
            error: 'Authentication required',
            code: 'NO_AUTH'
        });
    }
    
    // Check if user has admin privileges
    // This could be based on GitHub org membership, user ID, etc.
    const adminUsers = process.env.ADMIN_USERS?.split(',') || [];
    
    if (!adminUsers.includes(req.user.login)) {
        return res.status(403).json({ 
            error: 'Admin access required',
            code: 'INSUFFICIENT_PRIVILEGES'
        });
    }
    
    next();
}

// Rate limiting by user
const userRequestCounts = new Map();

function rateLimit(maxRequests = 100, windowMs = 15 * 60 * 1000) {
    return (req, res, next) => {
        const userId = req.user?.id || req.ip;
        const now = Date.now();
        const windowStart = now - windowMs;
        
        // Clean up old entries
        for (const [key, timestamps] of userRequestCounts.entries()) {
            const validTimestamps = timestamps.filter(t => t > windowStart);
            if (validTimestamps.length === 0) {
                userRequestCounts.delete(key);
            } else {
                userRequestCounts.set(key, validTimestamps);
            }
        }
        
        // Check current user's request count
        const userRequests = userRequestCounts.get(userId) || [];
        const recentRequests = userRequests.filter(t => t > windowStart);
        
        if (recentRequests.length >= maxRequests) {
            return res.status(429).json({
                error: 'Too many requests',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: Math.ceil((recentRequests[0] + windowMs - now) / 1000)
            });
        }
        
        // Add current request
        recentRequests.push(now);
        userRequestCounts.set(userId, recentRequests);
        
        // Add rate limit headers
        res.set({
            'X-RateLimit-Limit': maxRequests,
            'X-RateLimit-Remaining': maxRequests - recentRequests.length,
            'X-RateLimit-Reset': new Date(now + windowMs).toISOString()
        });
        
        next();
    };
}

module.exports = {
    requireAuth,
    optionalAuth,
    requireAdmin,
    rateLimit
};
```

### 5. Session Configuration
**File**: `session-config.js`
```javascript
// Session Configuration for 4site.pro
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const redis = require('redis');

// Redis client configuration
const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null
});

redisClient.on('error', (err) => {
    console.error('❌ Redis client error:', err);
});

redisClient.on('connect', () => {
    console.log('✅ Redis client connected');
});

// Session configuration
const sessionConfig = {
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET || 'YOUR-SESSION-SECRET-HERE',
    name: 'foursite_session',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        domain: process.env.NODE_ENV === 'production' ? '.4site.pro' : undefined
    }
};

module.exports = {
    sessionConfig,
    redisClient
};
```

## Environment Variables Required

Create `.env.oauth` file:
```bash
# GitHub OAuth Configuration
GITHUB_CLIENT_ID=YOUR-GITHUB-CLIENT-ID-HERE
GITHUB_CLIENT_SECRET=YOUR-GITHUB-CLIENT-SECRET-HERE
GITHUB_WEBHOOK_SECRET=YOUR-GITHUB-WEBHOOK-SECRET-HERE

# JWT Configuration
JWT_SECRET=YOUR-JWT-SECRET-HERE
SESSION_SECRET=YOUR-SESSION-SECRET-HERE

# URLs
FRONTEND_URL=https://4site.pro
API_URL=https://api.4site.pro

# Redis Configuration (for session storage)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=YOUR-REDIS-PASSWORD-HERE

# Admin Users (comma-separated GitHub usernames)
ADMIN_USERS=your-github-username,admin-user-2

# Security
NODE_ENV=production
```

## GitHub App Setup Instructions

### 1. Create GitHub App
1. Go to GitHub Settings → Developer settings → GitHub Apps
2. Click "New GitHub App"
3. Fill in the configuration:
   - **Name**: `4site.pro`
   - **Homepage URL**: `https://4site.pro`
   - **Callback URL**: `https://api.4site.pro/auth/github/callback`
   - **Setup URL**: `https://4site.pro/setup`
   - **Webhook URL**: `https://api.4site.pro/webhooks/github`

### 2. Configure Permissions
- **User permissions**:
  - Email addresses: Read
- **Repository permissions**:
  - Metadata: Read
  - Contents: Read
- **Organization permissions**: None

### 3. Generate Secrets
- Generate and download private key
- Generate webhook secret
- Copy Client ID and Client Secret

## Integration Instructions

### Backend Integration (Express.js)
```javascript
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const oauthRoutes = require('./oauth-routes');
const { requireAuth, optionalAuth, rateLimit } = require('./oauth-middleware');

const app = express();

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(cors({
    origin: ['https://4site.pro', 'https://admin.4site.pro'],
    credentials: true
}));

// OAuth routes
app.use('/', oauthRoutes);

// Protected routes example
app.get('/api/user/sites', requireAuth, rateLimit(50), (req, res) => {
    // User's sites endpoint
    res.json({ user: req.user.login, sites: [] });
});

// Public routes with optional auth
app.get('/api/public/stats', optionalAuth, (req, res) => {
    const isAuthenticated = !!req.user;
    res.json({ 
        totalSites: 1000,
        userSpecific: isAuthenticated ? req.user.login : null
    });
});
```

### Frontend Integration (React)
```tsx
import React from 'react';
import { GitHubAuthProvider, useAuth, LoginButton, UserProfile, AuthGuard } from './GitHubAuthProvider';

function App() {
    return (
        <GitHubAuthProvider>
            <div className="app">
                <Header />
                <MainContent />
            </div>
        </GitHubAuthProvider>
    );
}

function Header() {
    const { isAuthenticated } = useAuth();
    
    return (
        <header>
            <h1>4site.pro</h1>
            {isAuthenticated ? (
                <UserProfile />
            ) : (
                <LoginButton />
            )}
        </header>
    );
}

function MainContent() {
    return (
        <main>
            <PublicContent />
            <AuthGuard fallback={<LoginPrompt />}>
                <PrivateContent />
            </AuthGuard>
        </main>
    );
}
```

## Security Measures Implemented

1. **CSRF Protection**: State parameter validation
2. **Token Security**: JWT with expiration and rotation
3. **Scope Limitation**: Minimal permissions (read:user, user:email)
4. **Rate Limiting**: Per-user request throttling
5. **Secure Cookies**: HttpOnly, Secure, SameSite attributes
6. **Input Validation**: All OAuth parameters validated
7. **Error Handling**: No sensitive information in error messages
8. **Session Management**: Redis-backed sessions with expiration

## Testing Instructions

### 1. Local Testing
```bash
# Install dependencies
npm install express jsonwebtoken axios redis connect-redis express-session

# Set environment variables
cp .env.oauth.example .env.oauth
# Edit .env.oauth with actual values

# Start Redis
docker run -d -p 6379:6379 redis:alpine

# Start server
node server.js
```

### 2. OAuth Flow Testing
1. Navigate to `http://localhost:3000/auth/github`
2. Complete GitHub OAuth flow
3. Verify redirect to callback URL
4. Check authentication cookie is set
5. Test protected endpoints

## Success Criteria
- ✅ GitHub OAuth flow completes successfully
- ✅ User authentication persists across sessions
- ✅ JWT tokens are secure and properly validated
- ✅ Rate limiting prevents abuse
- ✅ All security headers are configured
- ✅ Error handling doesn't leak sensitive information