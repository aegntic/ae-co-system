/**
 * Helper for Firebase authentication
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Helper to handle Firebase authentication
 */
class FirebaseAuthHelper {
  constructor() {
    this.configPath = path.join(process.env.HOME, '.firebase-auth.json');
    this.authState = this.loadAuthState();
  }

  /**
   * Load saved authentication state
   */
  loadAuthState() {
    try {
      if (fs.existsSync(this.configPath)) {
        return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      }
    } catch (error) {
      console.warn('Failed to load Firebase auth state:', error.message);
    }
    return { authenticated: false };
  }

  /**
   * Save authentication state
   */
  saveAuthState(state) {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(state, null, 2));
      this.authState = state;
    } catch (error) {
      console.error('Failed to save Firebase auth state:', error.message);
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return this.authState.authenticated;
  }

  /**
   * Login to Firebase
   */
  async login(options = {}) {
    try {
      // Execute Firebase login command
      const args = ['login'];
      
      if (options.ci) {
        args.push('--ci');
      }
      
      if (options.nonInteractive) {
        args.push('--no-localhost');
      }
      
      if (options.reauth) {
        args.push('--reauth');
      }
      
      // Execute login command
      const result = execSync(`firebase ${args.join(' ')}`, { 
        encoding: 'utf8', 
        stdio: 'pipe'
      });
      
      // Save successful auth
      this.saveAuthState({ 
        authenticated: true, 
        timestamp: new Date().toISOString() 
      });
      
      return { 
        success: true, 
        message: 'Successfully authenticated with Firebase'
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Failed to authenticate with Firebase' 
      };
    }
  }

  /**
   * Logout from Firebase
   */
  async logout() {
    try {
      // Execute Firebase logout
      execSync('firebase logout', { encoding: 'utf8', stdio: 'pipe' });
      
      // Update state
      this.saveAuthState({ authenticated: false });
      
      return { 
        success: true, 
        message: 'Successfully logged out from Firebase' 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Failed to logout from Firebase' 
      };
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser() {
    try {
      if (!this.isAuthenticated()) {
        return { 
          success: false, 
          error: 'Not authenticated with Firebase. Call login() first.'
        };
      }

      // Use firebase login:list to get current user
      const output = execSync('firebase login:list', { 
        encoding: 'utf8', 
        stdio: 'pipe' 
      });
      
      // Parse the output to extract email
      const emailMatch = output.match(/\* (.+@.+\..+)/);
      const email = emailMatch ? emailMatch[1].trim() : null;
      
      if (!email) {
        return {
          success: false,
          error: 'Failed to determine current user email'
        };
      }
      
      return {
        success: true,
        user: { email }
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Failed to get current user' 
      };
    }
  }
}

module.exports = new FirebaseAuthHelper();
