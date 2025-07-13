/**
 * Aegntic MCP Standard - GitHub OAuth Provider
 * 
 * Implements GitHub OAuth 2.0 authentication with organization
 * and team membership verification
 */

// Note: @octokit/rest is a peer dependency
// Users should install it separately: npm install @octokit/rest
// For TypeScript, also install @types/octokit__rest
type Octokit = any; // Simplified for framework distribution
import { 
  IAuthProvider, 
  AuthProvider, 
  AuthContext, 
  AuthResult,
  AuthUser,
  OAuthRequest,
  GitHubOAuthConfig,
  GitHubOAuthConfigSchema
} from './types';

/**
 * OAuth state data
 */
interface OAuthState {
  request: OAuthRequest;
  createdAt: Date;
  nonce: string;
}

/**
 * GitHub OAuth Provider Implementation
 */
export class GitHubOAuthProvider implements IAuthProvider {
  name = 'GitHub OAuth';
  type = AuthProvider.GITHUB;
  
  private config!: GitHubOAuthConfig;
  private stateStore: Map<string, OAuthState> = new Map();

  /**
   * Initialize with configuration
   */
  async initialize(config: any): Promise<void> {
    this.config = GitHubOAuthConfigSchema.parse(config);
    
    // Set default scope if not provided
    if (!this.config.scope) {
      this.config.scope = 'read:user';
      
      // Add org scope if checking org membership
      if (this.config.requireOrgMembership || this.config.allowedOrgs) {
        this.config.scope += ' read:org';
      }
    }
    
    // Clean up old state entries periodically
    setInterval(() => this.cleanupState(), 60000); // Every minute
  }

  /**
   * Authenticate a request
   */
  async authenticate(context: AuthContext): Promise<AuthResult> {
    // Check for GitHub access token in Authorization header
    const authHeader = context.headers.get('Authorization');
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      return await this.authenticateWithToken(token);
    }
    
    // Check for access token in cookie (from OAuth flow)
    if (context.cookies?.['github-token']) {
      return await this.authenticateWithToken(context.cookies['github-token']);
    }
    
    return {
      success: false,
      error: 'No GitHub authentication token found'
    };
  }

  /**
   * Authenticate with an access token
   */
  private async authenticateWithToken(token: string): Promise<AuthResult> {
    try {
      // Note: This is a simplified implementation for framework distribution
      // In production, use @octokit/rest: npm install @octokit/rest
      const octokit = this.createSimplifiedOctokit(token);
      
      // Get user information
      const { data: user } = await octokit.users.getAuthenticated();
      
      // Check organization membership if required
      if (this.config.requireOrgMembership || this.config.allowedOrgs) {
        const hasOrgAccess = await this.checkOrgMembership(octokit, user.login);
        if (!hasOrgAccess) {
          return {
            success: false,
            error: 'User is not a member of required organizations'
          };
        }
      }
      
      // Check team membership if required
      if (this.config.allowedTeams && this.config.allowedTeams.length > 0) {
        const hasTeamAccess = await this.checkTeamMembership(octokit, user.login);
        if (!hasTeamAccess) {
          return {
            success: false,
            error: 'User is not a member of required teams'
          };
        }
      }
      
      // Get user's primary email
      const { data: emails } = await octokit.users.listEmailsForAuthenticatedUser();
      const primaryEmail = emails.find(e => e.primary)?.email || user.email || '';
      
      // Determine roles based on GitHub data
      const roles = await this.determineRoles(octokit, user);
      
      const authUser: AuthUser = {
        id: user.id.toString(),
        login: user.login,
        name: user.name || user.login,
        email: primaryEmail,
        roles,
        provider: AuthProvider.GITHUB,
        accessToken: token,
        metadata: {
          avatarUrl: user.avatar_url,
          htmlUrl: user.html_url,
          company: user.company,
          location: user.location,
          bio: user.bio,
        }
      };
      
      return {
        success: true,
        user: authUser
      };
    } catch (error) {
      console.error('GitHub authentication error:', error);
      
      // Check for specific error types
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          return {
            success: false,
            error: 'Invalid or expired GitHub token',
            code: 'INVALID_TOKEN'
          };
        }
        
        if (error.message.includes('403')) {
          return {
            success: false,
            error: 'Insufficient GitHub permissions',
            code: 'INSUFFICIENT_PERMISSIONS'
          };
        }
      }
      
      return {
        success: false,
        error: 'GitHub authentication failed'
      };
    }
  }

  /**
   * Check organization membership
   */
  private async checkOrgMembership(octokit: Octokit, username: string): Promise<boolean> {
    if (!this.config.allowedOrgs || this.config.allowedOrgs.length === 0) {
      return true;
    }
    
    try {
      // Get user's organizations
      const { data: orgs } = await octokit.orgs.listForAuthenticatedUser();
      const userOrgLogins = orgs.map(org => org.login);
      
      // Check if user is member of any allowed org
      return this.config.allowedOrgs.some(allowedOrg => 
        userOrgLogins.includes(allowedOrg)
      );
    } catch (error) {
      console.error('Error checking org membership:', error);
      return false;
    }
  }

  /**
   * Check team membership
   */
  private async checkTeamMembership(octokit: Octokit, username: string): Promise<boolean> {
    if (!this.config.allowedTeams || this.config.allowedTeams.length === 0) {
      return true;
    }
    
    try {
      // Get user's teams
      const { data: teams } = await octokit.teams.listForAuthenticatedUser();
      
      // Check if user is member of any allowed team
      // Team format: "org/team-slug"
      const userTeams = teams.map(team => `${team.organization.login}/${team.slug}`);
      
      return this.config.allowedTeams.some(allowedTeam =>
        userTeams.includes(allowedTeam)
      );
    } catch (error) {
      console.error('Error checking team membership:', error);
      return false;
    }
  }

  /**
   * Determine user roles based on GitHub data
   */
  private async determineRoles(octokit: Octokit, user: any): Promise<string[]> {
    const roles: string[] = ['user'];
    
    try {
      // Check if user is a site admin (GitHub Enterprise)
      if (user.site_admin) {
        roles.push('admin');
      }
      
      // Check organization roles if configured
      if (this.config.allowedOrgs) {
        for (const org of this.config.allowedOrgs) {
          try {
            const { data: membership } = await octokit.orgs.getMembershipForAuthenticatedUser({ org });
            
            if (membership.role === 'admin') {
              roles.push(`${org}:admin`);
            } else if (membership.role === 'member') {
              roles.push(`${org}:member`);
            }
          } catch (error) {
            // User might not be a member of this org
          }
        }
      }
    } catch (error) {
      console.error('Error determining roles:', error);
    }
    
    return [...new Set(roles)]; // Remove duplicates
  }

  /**
   * Get OAuth authorization URL
   */
  getAuthorizationUrl(request: OAuthRequest): string {
    // Generate secure state
    const state = this.generateState();
    const nonce = this.generateNonce();
    
    // Store state for verification
    this.stateStore.set(state, {
      request,
      createdAt: new Date(),
      nonce
    });
    
    // Build authorization URL
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: request.redirectUri,
      scope: this.config.scope || 'read:user',
      state,
      response_type: 'code'
    });
    
    // Add optional parameters
    if (request.state) {
      // Encode original state in our state
      const encodedState = btoa(JSON.stringify({
        nonce,
        originalState: request.state
      }));
      params.set('state', encodedState);
    }
    
    return `https://github.com/login/oauth/authorize?${params}`;
  }

  /**
   * Handle OAuth callback
   */
  async handleCallback(code: string, state: string): Promise<AuthResult> {
    try {
      // Decode and verify state
      let stateData: any;
      try {
        stateData = JSON.parse(atob(state));
      } catch {
        // State might be plain
        stateData = { nonce: state };
      }
      
      const storedState = this.stateStore.get(stateData.nonce);
      if (!storedState) {
        return {
          success: false,
          error: 'Invalid or expired state'
        };
      }
      
      // Clean up state
      this.stateStore.delete(stateData.nonce);
      
      // Exchange code for access token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          redirect_uri: storedState.request.redirectUri
        })
      });
      
      if (!tokenResponse.ok) {
        return {
          success: false,
          error: 'Failed to exchange code for token'
        };
      }
      
      const tokenData = await tokenResponse.json();
      
      if (tokenData.error) {
        return {
          success: false,
          error: tokenData.error_description || tokenData.error
        };
      }
      
      // Authenticate with the token
      const authResult = await this.authenticateWithToken(tokenData.access_token);
      
      // Add refresh token if provided
      if (authResult.user && tokenData.refresh_token) {
        authResult.user.refreshToken = tokenData.refresh_token;
      }
      
      return authResult;
    } catch (error) {
      console.error('OAuth callback error:', error);
      return {
        success: false,
        error: 'OAuth callback failed'
      };
    }
  }

  /**
   * Refresh authentication token
   */
  async refresh(refreshToken: string): Promise<AuthResult> {
    try {
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret
        })
      });
      
      if (!response.ok) {
        return {
          success: false,
          error: 'Failed to refresh token'
        };
      }
      
      const data = await response.json();
      
      if (data.error) {
        return {
          success: false,
          error: data.error_description || data.error
        };
      }
      
      // Authenticate with new token
      return await this.authenticateWithToken(data.access_token);
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: 'Token refresh failed'
      };
    }
  }

  /**
   * Logout (revoke token)
   */
  async logout(session: any): Promise<void> {
    if (!session.user.accessToken) return;
    
    try {
      // GitHub doesn't have a token revocation endpoint for OAuth apps
      // For GitHub Apps, you would use: DELETE /installation/token
      // For now, we just rely on client-side token removal
      console.log('GitHub OAuth tokens cannot be revoked programmatically');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  /**
   * Generate secure random state
   */
  private generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Generate nonce
   */
  private generateNonce(): string {
    return this.generateState();
  }

  /**
   * Clean up expired state entries
   */
  private cleanupState(): void {
    const now = new Date();
    const expiry = 10 * 60 * 1000; // 10 minutes
    
    for (const [key, value] of this.stateStore.entries()) {
      if (now.getTime() - value.createdAt.getTime() > expiry) {
        this.stateStore.delete(key);
      }
    }
  }
  
  /**
   * Create simplified Octokit client for framework distribution
   */
  private createSimplifiedOctokit(token: string): any {
    const apiBase = 'https://api.github.com';
    
    const makeRequest = async (path: string, options?: any) => {
      const response = await fetch(`${apiBase}${path}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          ...options?.headers
        },
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return { data };
    };
    
    return {
      users: {
        getAuthenticated: () => makeRequest('/user'),
        listEmailsForAuthenticatedUser: () => makeRequest('/user/emails')
      },
      orgs: {
        listForAuthenticatedUser: () => makeRequest('/user/orgs'),
        getMembershipForAuthenticatedUser: ({ org }: { org: string }) => 
          makeRequest(`/user/memberships/orgs/${org}`)
      },
      teams: {
        listForAuthenticatedUser: () => makeRequest('/user/teams')
      }
    };
  }
}