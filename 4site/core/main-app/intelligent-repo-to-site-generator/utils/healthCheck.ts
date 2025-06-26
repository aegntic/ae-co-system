// Health Check System for project4site
// Monitors system components and API connectivity

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  error?: string;
  details?: Record<string, any>;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: HealthCheckResult[];
  version: string;
}

/**
 * Performs a comprehensive system health check
 */
export const performSystemHealthCheck = async (): Promise<SystemHealth> => {
  const checks: HealthCheckResult[] = [];
  
  // Check Gemini AI Service
  const geminiCheck = await checkGeminiService();
  checks.push(geminiCheck);
  
  // Check Supabase Service
  const supabaseCheck = await checkSupabaseService();
  checks.push(supabaseCheck);
  
  // Check GitHub API
  const githubCheck = await checkGitHubService();
  checks.push(githubCheck);
  
  // Check Browser Environment
  const browserCheck = checkBrowserEnvironment();
  checks.push(browserCheck);
  
  // Determine overall health
  const degradedCount = checks.filter(c => c.status === 'degraded').length;
  const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length;
  
  let overall: 'healthy' | 'degraded' | 'unhealthy';
  if (unhealthyCount > 0) {
    overall = 'unhealthy';
  } else if (degradedCount > 0) {
    overall = 'degraded';
  } else {
    overall = 'healthy';
  }
  
  return {
    overall,
    timestamp: new Date().toISOString(),
    checks,
    version: import.meta.env.VITE_APP_VERSION || '1.0.0'
  };
};

/**
 * Check Gemini AI Service health
 */
const checkGeminiService = async (): Promise<HealthCheckResult> => {
  const startTime = Date.now();
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'DEMO_KEY_FOR_TESTING') {
    return {
      service: 'gemini',
      status: 'degraded',
      error: 'API key not configured or using demo key',
      details: { configured: false, demo: true }
    };
  }
  
  try {
    // Simple ping to Gemini API (using a minimal request)
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models', {
      method: 'GET',
      headers: {
        'x-goog-api-key': apiKey,
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      return {
        service: 'gemini',
        status: 'healthy',
        responseTime,
        details: { apiVersion: 'v1', endpoint: 'generativelanguage.googleapis.com' }
      };
    } else {
      return {
        service: 'gemini',
        status: 'unhealthy',
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`,
        details: { status: response.status }
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      service: 'gemini',
      status: 'unhealthy',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: { type: 'network_error' }
    };
  }
};

/**
 * Check Supabase service health
 */
const checkSupabaseService = async (): Promise<HealthCheckResult> => {
  const startTime = Date.now();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('demo-project')) {
    return {
      service: 'supabase',
      status: 'degraded',
      error: 'Supabase not configured or using demo configuration',
      details: { configured: false, demo: true }
    };
  }
  
  try {
    // Check Supabase health endpoint
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      signal: AbortSignal.timeout(5000)
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      return {
        service: 'supabase',
        status: 'healthy',
        responseTime,
        details: { 
          region: supabaseUrl.includes('supabase.co') ? 'cloud' : 'self-hosted',
          version: response.headers.get('x-supabase-version') || 'unknown'
        }
      };
    } else {
      return {
        service: 'supabase',
        status: 'unhealthy',
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`,
        details: { status: response.status }
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      service: 'supabase',
      status: 'unhealthy',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: { type: 'network_error' }
    };
  }
};

/**
 * Check GitHub API service health
 */
const checkGitHubService = async (): Promise<HealthCheckResult> => {
  const startTime = Date.now();
  const githubToken = import.meta.env.VITE_GITHUB_TOKEN;
  
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'project4site/1.0'
    };
    
    if (githubToken) {
      headers['Authorization'] = `token ${githubToken}`;
    }
    
    const response = await fetch('https://api.github.com/rate_limit', {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(5000)
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      const rateLimitRemaining = data.resources?.core?.remaining || 0;
      const rateLimitTotal = data.resources?.core?.limit || 0;
      
      const status = rateLimitRemaining > rateLimitTotal * 0.1 ? 'healthy' : 'degraded';
      
      return {
        service: 'github',
        status,
        responseTime,
        details: {
          authenticated: !!githubToken,
          rateLimit: {
            remaining: rateLimitRemaining,
            total: rateLimitTotal,
            resetTime: new Date(data.resources?.core?.reset * 1000).toISOString()
          }
        }
      };
    } else {
      return {
        service: 'github',
        status: 'unhealthy',
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`,
        details: { status: response.status }
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      service: 'github',
      status: 'unhealthy',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: { type: 'network_error' }
    };
  }
};

/**
 * Check browser environment and capabilities
 */
const checkBrowserEnvironment = (): HealthCheckResult => {
  const checks = {
    localStorage: typeof Storage !== 'undefined',
    fetch: typeof fetch !== 'undefined',
    webgl: checkWebGLSupport(),
    modernJS: checkModernJSSupport()
  };
  
  const failedChecks = Object.entries(checks).filter(([_, supported]) => !supported);
  
  return {
    service: 'browser',
    status: failedChecks.length === 0 ? 'healthy' : failedChecks.length <= 1 ? 'degraded' : 'unhealthy',
    error: failedChecks.length > 0 ? `Unsupported features: ${failedChecks.map(([name]) => name).join(', ')}` : undefined,
    details: {
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      capabilities: checks
    }
  };
};

/**
 * Check WebGL support for neural background
 */
const checkWebGLSupport = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
  } catch {
    return false;
  }
};

/**
 * Check modern JavaScript support
 */
const checkModernJSSupport = (): boolean => {
  try {
    // Test for modern features we use
    return (
      typeof Promise !== 'undefined' &&
      typeof Array.prototype.includes !== 'undefined' &&
      typeof Object.assign !== 'undefined' &&
      typeof window.AbortController !== 'undefined'
    );
  } catch {
    return false;
  }
};

/**
 * Simple health check for quick status
 */
export const quickHealthCheck = async (): Promise<boolean> => {
  try {
    const health = await performSystemHealthCheck();
    return health.overall === 'healthy' || health.overall === 'degraded';
  } catch {
    return false;
  }
};

/**
 * Get health status as a simple string
 */
export const getHealthStatus = async (): Promise<string> => {
  const health = await performSystemHealthCheck();
  const healthyCounts = health.checks.filter(c => c.status === 'healthy').length;
  const totalCounts = health.checks.length;
  
  return `${healthyCounts}/${totalCounts} services healthy`;
};