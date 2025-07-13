/**
 * Jest test setup
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.SESSION_SECRET = 'test-session-secret';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Add custom matchers if needed
expect.extend({
  toBeValidUser(received: any) {
    const pass = 
      received && 
      typeof received.id === 'string' &&
      typeof received.login === 'string' &&
      typeof received.email === 'string' &&
      Array.isArray(received.roles);
    
    return {
      pass,
      message: () => 
        pass 
          ? `expected ${received} not to be a valid user`
          : `expected ${received} to be a valid user with id, login, email, and roles`,
    };
  },
});