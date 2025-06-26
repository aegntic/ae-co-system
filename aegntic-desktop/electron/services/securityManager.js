const { session, ipcMain } = require('electron');

/**
 * Security manager for handling application security policies and validation
 */
class SecurityManager {
  constructor() {
    this.cspPolicies = {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-eval'"], // unsafe-eval needed for React dev mode
      'style-src': ["'self'", "'unsafe-inline'"], // unsafe-inline needed for React styles
      'img-src': ["'self'", 'data:', 'blob:', 'https:'],
      'font-src': ["'self'", 'data:'],
      'connect-src': ["'self'", 'https:', 'wss:', 'ws:', 'localhost:*'],
      'media-src': ["'self'", 'blob:'],
      'object-src': ["'none'"],
      'frame-src': ["'none'"],
      'worker-src': ["'self'", 'blob:'],
      'child-src': ["'self'"],
      'frame-ancestors': ["'none'"],
      'form-action': ["'self'"],
      'base-uri': ["'self'"]
    };

    this.validationRules = {
      prompt: {
        maxLength: 10000,
        allowedChars: /^[\s\S]*$/, // Allow all characters for prompts
        sanitize: true
      },
      obsidianPath: {
        maxLength: 500,
        allowedChars: /^[a-zA-Z0-9\-_./\\: ]*$/,
        sanitize: true
      },
      modelId: {
        maxLength: 50,
        allowedChars: /^[a-zA-Z0-9\-_]*$/,
        sanitize: false
      },
      conversationId: {
        maxLength: 100,
        allowedChars: /^[a-zA-Z0-9\-_]*$/,
        sanitize: false
      }
    };

    this.setupSecurityHeaders();
    this.setupInputValidation();
    this.setupIpcHandlers();
  }

  /**
   * Setup Content Security Policy headers
   */
  setupSecurityHeaders() {
    try {
      const defaultSession = session.defaultSession;
      
      // Set up CSP
      const cspString = Object.entries(this.cspPolicies)
        .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
        .join('; ');

      defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            'Content-Security-Policy': [cspString],
            'X-Content-Type-Options': ['nosniff'],
            'X-Frame-Options': ['DENY'],
            'X-XSS-Protection': ['1; mode=block'],
            'Strict-Transport-Security': ['max-age=31536000; includeSubDomains'],
            'Referrer-Policy': ['strict-origin-when-cross-origin']
          }
        });
      });

      // Block external navigation
      defaultSession.webRequest.onBeforeRequest((details, callback) => {
        const url = new URL(details.url);
        
        // Allow localhost and file:// for development
        if (url.protocol === 'file:' || 
            url.hostname === 'localhost' || 
            url.hostname === '127.0.0.1' ||
            url.hostname === '0.0.0.0') {
          callback({ cancel: false });
          return;
        }

        // Allow specific AI service domains for BrowserView
        const allowedDomains = [
          'claude.ai',
          'chat.openai.com',
          'grok.x.ai',
          'gemini.google.com',
          'accounts.google.com',
          'auth0.com',
          'x.com',
          'twitter.com'
        ];

        const isDomainAllowed = allowedDomains.some(domain => 
          url.hostname === domain || url.hostname.endsWith('.' + domain)
        );

        if (isDomainAllowed) {
          callback({ cancel: false });
        } else {
          console.warn(`[SecurityManager] Blocked request to: ${details.url}`);
          callback({ cancel: true });
        }
      });

      console.log('[SecurityManager] Security headers configured successfully');
    } catch (error) {
      console.error('[SecurityManager] Error setting up security headers:', error);
    }
  }

  /**
   * Setup input validation for IPC communications
   */
  setupInputValidation() {
    // Wrap original ipcMain.handle to add validation
    const originalHandle = ipcMain.handle.bind(ipcMain);
    
    ipcMain.handle = (channel, listener) => {
      const wrappedListener = async (event, ...args) => {
        try {
          // Validate inputs based on channel
          const validatedArgs = this.validateChannelInputs(channel, args);
          return await listener(event, ...validatedArgs);
        } catch (validationError) {
          console.error(`[SecurityManager] Validation failed for channel ${channel}:`, validationError);
          throw new Error(`Invalid input: ${validationError.message}`);
        }
      };
      
      return originalHandle(channel, wrappedListener);
    };

    console.log('[SecurityManager] Input validation configured successfully');
  }

  /**
   * Validate inputs for specific IPC channels
   */
  validateChannelInputs(channel, args) {
    const validatedArgs = [];

    switch (channel) {
      case 'send-prompt':
        validatedArgs.push(this.validateInput(args[0], 'prompt')); // prompt text
        validatedArgs.push(this.validateModelIds(args[1])); // selected models
        break;

      case 'set-obsidian-vault':
        validatedArgs.push(this.validateInput(args[0], 'obsidianPath'));
        break;

      case 'add-conversation':
        validatedArgs.push(this.validateInput(args[0], 'prompt')); // prompt
        validatedArgs.push(this.validateResponses(args[1])); // responses object
        break;

      case 'delete-conversation':
        validatedArgs.push(this.validateInput(args[0], 'conversationId'));
        break;

      case 'export-to-obsidian':
        if (args[0]) {
          validatedArgs.push(this.validateInput(args[0], 'conversationId'));
        } else {
          validatedArgs.push(null);
        }
        break;

      case 'login-to-service':
        validatedArgs.push(this.validateInput(args[0], 'modelId'));
        break;

      default:
        // For unknown channels, return args as-is but log for monitoring
        console.log(`[SecurityManager] Unknown channel: ${channel}`);
        return args;
    }

    return validatedArgs;
  }

  /**
   * Validate individual input against rules
   */
  validateInput(input, type) {
    if (input === null || input === undefined) {
      return input;
    }

    const rules = this.validationRules[type];
    if (!rules) {
      throw new Error(`No validation rules defined for type: ${type}`);
    }

    // Check type
    if (typeof input !== 'string') {
      throw new Error(`Expected string for ${type}, got ${typeof input}`);
    }

    // Check length
    if (input.length > rules.maxLength) {
      throw new Error(`Input too long for ${type}: ${input.length} > ${rules.maxLength}`);
    }

    // Check allowed characters
    if (!rules.allowedChars.test(input)) {
      throw new Error(`Invalid characters in ${type}`);
    }

    // Sanitize if required
    if (rules.sanitize) {
      return this.sanitizeInput(input);
    }

    return input;
  }

  /**
   * Validate array of model IDs
   */
  validateModelIds(modelIds) {
    if (!Array.isArray(modelIds)) {
      throw new Error('Model IDs must be an array');
    }

    if (modelIds.length === 0) {
      throw new Error('At least one model ID required');
    }

    if (modelIds.length > 10) {
      throw new Error('Too many model IDs (max 10)');
    }

    return modelIds.map(id => this.validateInput(id, 'modelId'));
  }

  /**
   * Validate responses object structure
   */
  validateResponses(responses) {
    if (typeof responses !== 'object' || responses === null) {
      throw new Error('Responses must be an object');
    }

    const validatedResponses = {};
    
    for (const [modelId, response] of Object.entries(responses)) {
      // Validate model ID
      const validModelId = this.validateInput(modelId, 'modelId');
      
      // Validate response structure
      if (typeof response !== 'object' || response === null) {
        throw new Error('Response must be an object');
      }

      // Validate response properties
      const validatedResponse = {
        modelId: this.validateInput(response.modelId, 'modelId'),
        modelName: this.validateInput(response.modelName || '', 'modelId'),
        content: this.validateInput(response.content || '', 'prompt'),
        timestamp: typeof response.timestamp === 'number' ? response.timestamp : Date.now(),
        isComplete: Boolean(response.isComplete),
        error: Boolean(response.error)
      };

      validatedResponses[validModelId] = validatedResponse;
    }

    return validatedResponses;
  }

  /**
   * Sanitize input to prevent XSS and injection attacks
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;

    return input
      .replace(/[<>]/g, '') // Remove potentially dangerous HTML chars
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/data:text\/html/gi, '') // Remove data URLs with HTML
      .trim();
  }

  /**
   * Add a new CSP directive
   */
  addCSPDirective(directive, sources) {
    if (this.cspPolicies[directive]) {
      this.cspPolicies[directive] = [...new Set([...this.cspPolicies[directive], ...sources])];
    } else {
      this.cspPolicies[directive] = sources;
    }
  }

  /**
   * Get current security status
   */
  getSecurityStatus() {
    return {
      cspEnabled: true,
      contextIsolation: true,
      nodeIntegration: false,
      validationEnabled: true,
      securityHeaders: [
        'Content-Security-Policy',
        'X-Content-Type-Options',
        'X-Frame-Options',
        'X-XSS-Protection',
        'Strict-Transport-Security',
        'Referrer-Policy'
      ]
    };
  }

  /**
   * Setup IPC handlers for security information
   */
  setupIpcHandlers() {
    ipcMain.handle('security:getStatus', () => {
      return this.getSecurityStatus();
    });

    ipcMain.handle('security:validateInput', (event, input, type) => {
      try {
        const validated = this.validateInput(input, type);
        return { success: true, validated };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('security:logEvent', (event, eventType, details) => {
      this.logSecurityEvent(eventType, details);
      return { success: true };
    });
  }

  /**
   * Log security event for monitoring
   */
  logSecurityEvent(event, details) {
    const timestamp = new Date().toISOString();
    console.log(`[SecurityManager] ${timestamp} - ${event}:`, details);
  }
}

module.exports = SecurityManager;