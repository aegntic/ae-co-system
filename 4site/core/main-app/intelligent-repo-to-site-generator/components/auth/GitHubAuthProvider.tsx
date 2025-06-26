import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, GitFork, CheckCircle, AlertCircle, ExternalLink, Copy } from 'lucide-react';

interface GitHubUser {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

interface Repository {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  description: string;
  private: boolean;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
  stargazers_count: number;
  language: string;
  has_pages: boolean;
  default_branch: string;
}

interface ForkResult {
  success: boolean;
  repository?: Repository;
  deploymentUrl?: string;
  error?: string;
  setupInstructions?: string[];
}

interface GitHubAuthContextType {
  user: GitHubUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  forkRepository: (repoUrl: string) => Promise<ForkResult>;
  setupAutomaticDeployment: (repoName: string) => Promise<boolean>;
  getUserRepositories: () => Promise<Repository[]>;
}

const GitHubAuthContext = createContext<GitHubAuthContextType | undefined>(undefined);

interface GitHubAuthProviderProps {
  children: ReactNode;
}

export const GitHubAuthProvider: React.FC<GitHubAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // GitHub OAuth configuration
  const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
  const GITHUB_REDIRECT_URI = `${window.location.origin}/auth/github/callback`;

  // Check for existing authentication on mount
  useEffect(() => {
    checkExistingAuth();
  }, []);

  // Check for existing GitHub authentication
  const checkExistingAuth = async () => {
    try {
      const token = localStorage.getItem('github_access_token');
      if (token) {
        const userData = await fetchGitHubUser(token);
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('github_access_token');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch GitHub user data
  const fetchGitHubUser = async (token: string): Promise<GitHubUser> => {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }

    return response.json();
  };

  // Initiate GitHub OAuth login
  const login = () => {
    const scope = 'user:email,repo,write:repo_hook';
    const state = btoa(JSON.stringify({
      timestamp: Date.now(),
      returnUrl: window.location.href
    }));

    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', GITHUB_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', GITHUB_REDIRECT_URI);
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('allow_signup', 'true');

    window.location.href = authUrl.toString();
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('github_access_token');
    setUser(null);
  };

  // Fork a repository to user's GitHub account
  const forkRepository = async (repoUrl: string): Promise<ForkResult> => {
    try {
      const token = localStorage.getItem('github_access_token');
      if (!token) {
        throw new Error('Not authenticated with GitHub');
      }

      // Extract owner and repo from URL
      const urlMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!urlMatch) {
        throw new Error('Invalid GitHub repository URL');
      }

      const [, owner, repo] = urlMatch;

      // Fork the repository
      const forkResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/forks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: repo,
          default_branch_only: false
        })
      });

      if (!forkResponse.ok) {
        const error = await forkResponse.json();
        throw new Error(error.message || 'Failed to fork repository');
      }

      const forkedRepo: Repository = await forkResponse.json();

      // Wait for fork to be ready (GitHub needs time to set up the fork)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create 4site.pro configuration files in the forked repository
      await setupRepositoryFiles(forkedRepo.name, token);

      // Set up GitHub Pages deployment
      const deploymentUrl = await setupGitHubPages(forkedRepo.name, token);

      return {
        success: true,
        repository: forkedRepo,
        deploymentUrl,
        setupInstructions: [
          'Repository successfully forked to your GitHub account',
          '4site.pro configuration files have been added',
          'GitHub Pages deployment is being set up',
          'Your site will be available shortly at the deployment URL'
        ]
      };

    } catch (error) {
      console.error('Fork repository error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  };

  // Set up necessary files in the forked repository
  const setupRepositoryFiles = async (repoName: string, token: string) => {
    const files = [
      {
        path: '.4site/config.json',
        content: JSON.stringify({
          version: '1.0.0',
          platform: '4site.pro',
          autoUpdate: true,
          deployment: {
            target: 'github-pages',
            branch: 'gh-pages',
            buildCommand: 'npm run build:4site',
            outputDirectory: 'dist'
          },
          analytics: {
            enabled: true,
            trackingId: 'auto-generated'
          },
          leadCapture: {
            enabled: true,
            required: true,
            siteId: `${user?.login}-${repoName}`,
            metadata: {
              owner: user?.login,
              repository: repoName,
              setupDate: new Date().toISOString()
            }
          }
        }, null, 2)
      },
      {
        path: '.4site/deploy.yml',
        content: `# 4site.pro Deployment Configuration
name: Deploy to 4site.pro
on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install 4site.pro CLI
      run: npm install -g @4site/cli
      
    - name: Generate site
      run: 4site generate --source README.md --output dist/
      
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: \${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
        cname: \${{ github.repository_owner }}.4site.pro
`
      },
      {
        path: '.4site/README.md',
        content: `# 4site.pro Configuration

This repository has been configured for automatic website generation using 4site.pro.

## How it works

1. **Automatic Updates**: When you push changes to your README.md, your website updates automatically
2. **Lead Capture**: Your site includes built-in lead capture to grow your audience
3. **Social Integration**: Connect your social platforms for enhanced features
4. **Analytics**: Track visitor engagement and conversion metrics

## Your Website

Your website is automatically deployed to: https://${user?.login}.github.io/${repoName}/

## Managing Your Site

- Edit your README.md to update your website content
- Customize settings in \`.4site/config.json\`
- View analytics in your 4site.pro dashboard

## Support

Visit [4site.pro](https://4site.pro) for documentation and support.
`
      }
    ];

    // Create each file in the repository
    for (const file of files) {
      await createRepositoryFile(repoName, file.path, file.content, token);
    }
  };

  // Create a file in the GitHub repository
  const createRepositoryFile = async (repoName: string, path: string, content: string, token: string) => {
    const response = await fetch(`https://api.github.com/repos/${user?.login}/${repoName}/contents/${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Add 4site.pro configuration: ${path}`,
        content: btoa(content),
        branch: 'main'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`Failed to create ${path}:`, error);
    }
  };

  // Set up GitHub Pages for automatic deployment
  const setupGitHubPages = async (repoName: string, token: string): Promise<string | undefined> => {
    try {
      const response = await fetch(`https://api.github.com/repos/${user?.login}/${repoName}/pages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source: {
            branch: 'gh-pages',
            path: '/'
          }
        })
      });

      if (response.ok) {
        const pages = await response.json();
        return pages.html_url;
      } else {
        // GitHub Pages might already be enabled
        const existingPages = await fetch(`https://api.github.com/repos/${user?.login}/${repoName}/pages`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        if (existingPages.ok) {
          const pages = await existingPages.json();
          return pages.html_url;
        }
      }
    } catch (error) {
      console.error('GitHub Pages setup error:', error);
    }

    return `https://${user?.login}.github.io/${repoName}/`;
  };

  // Set up automatic deployment webhooks
  const setupAutomaticDeployment = async (repoName: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('github_access_token');
      if (!token) return false;

      // Create webhook for 4site.pro updates
      const webhookResponse = await fetch(`https://api.github.com/repos/${user?.login}/${repoName}/hooks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'web',
          active: true,
          events: ['push', 'pull_request'],
          config: {
            url: `${import.meta.env.VITE_API_BASE_URL || window.location.origin}/api/github/webhook`,
            content_type: 'json',
            secret: import.meta.env.VITE_GITHUB_WEBHOOK_SECRET
          }
        })
      });

      return webhookResponse.ok;
    } catch (error) {
      console.error('Webhook setup error:', error);
      return false;
    }
  };

  // Get user's repositories
  const getUserRepositories = async (): Promise<Repository[]> => {
    try {
      const token = localStorage.getItem('github_access_token');
      if (!token) return [];

      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.ok) {
        return response.json();
      }
    } catch (error) {
      console.error('Failed to fetch repositories:', error);
    }

    return [];
  };

  const value: GitHubAuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    forkRepository,
    setupAutomaticDeployment,
    getUserRepositories
  };

  return (
    <GitHubAuthContext.Provider value={value}>
      {children}
    </GitHubAuthContext.Provider>
  );
};

// Custom hook to use GitHub auth context
export const useGitHubAuth = () => {
  const context = useContext(GitHubAuthContext);
  if (context === undefined) {
    throw new Error('useGitHubAuth must be used within a GitHubAuthProvider');
  }
  return context;
};

// GitHub authentication button component
interface GitHubAuthButtonProps {
  onSuccess?: (user: GitHubUser) => void;
  className?: string;
}

export const GitHubAuthButton: React.FC<GitHubAuthButtonProps> = ({ 
  onSuccess, 
  className = '' 
}) => {
  const { user, isAuthenticated, isLoading, login, logout } = useGitHubAuth();

  useEffect(() => {
    if (isAuthenticated && user && onSuccess) {
      onSuccess(user);
    }
  }, [isAuthenticated, user, onSuccess]);

  if (isLoading) {
    return (
      <button disabled className={`flex items-center gap-2 px-4 py-2 bg-gray-600 text-gray-300 rounded-lg ${className}`}>
        <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
        Checking authentication...
      </button>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2">
          <img 
            src={user.avatar_url} 
            alt={user.name || user.login}
            className="w-8 h-8 rounded-full"
          />
          <div className="text-sm">
            <div className="font-medium text-white">{user.name || user.login}</div>
            <div className="text-gray-400">@{user.login}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="px-3 py-1 text-sm text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500 rounded transition-colors"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={login}
      className={`flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 text-white rounded-lg transition-all ${className}`}
    >
      <Github className="w-5 h-5" />
      Sign in with GitHub
    </button>
  );
};

// Repository fork component
interface RepositoryForkModalProps {
  isOpen: boolean;
  onClose: () => void;
  repositoryUrl: string;
  onForkComplete: (result: ForkResult) => void;
}

export const RepositoryForkModal: React.FC<RepositoryForkModalProps> = ({
  isOpen,
  onClose,
  repositoryUrl,
  onForkComplete
}) => {
  const { user, isAuthenticated, forkRepository } = useGitHubAuth();
  const [isForking, setIsForking] = useState(false);
  const [forkResult, setForkResult] = useState<ForkResult | null>(null);

  const handleFork = async () => {
    if (!isAuthenticated) return;

    setIsForking(true);
    const result = await forkRepository(repositoryUrl);
    setForkResult(result);
    setIsForking(false);
    onForkComplete(result);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-2xl p-6 max-w-lg w-full shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <GitFork className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-bold text-white">Fork Repository</h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>

            {!forkResult ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-500/10 border border-blue-400/20 rounded-lg">
                  <h4 className="font-semibold text-blue-300 mb-2">What happens when you fork?</h4>
                  <ul className="text-sm text-blue-200 space-y-1">
                    <li>• Repository is copied to your GitHub account</li>
                    <li>• 4site.pro configuration files are automatically added</li>
                    <li>• GitHub Pages deployment is set up</li>
                    <li>• Automatic updates are enabled for your site</li>
                  </ul>
                </div>

                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <div className="text-sm text-gray-300 mb-2">Repository:</div>
                  <div className="font-mono text-sm text-white break-all">{repositoryUrl}</div>
                </div>

                {user && (
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <div className="text-sm text-gray-300 mb-2">Fork destination:</div>
                    <div className="flex items-center space-x-2">
                      <img src={user.avatar_url} alt={user.login} className="w-6 h-6 rounded-full" />
                      <span className="font-medium text-white">@{user.login}</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleFork}
                  disabled={!isAuthenticated || isForking}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all"
                >
                  {isForking ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Forking repository...</span>
                    </div>
                  ) : (
                    <>Fork and Deploy</>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {forkResult.success ? (
                  <>
                    <div className="flex items-center space-x-2 text-green-400">
                      <CheckCircle className="w-6 h-6" />
                      <h4 className="font-semibold">Fork Successful!</h4>
                    </div>

                    {forkResult.repository && (
                      <div className="p-4 bg-green-500/10 border border-green-400/20 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-green-300">Forked Repository:</span>
                          <button
                            onClick={() => window.open(forkResult.repository!.html_url, '_blank')}
                            className="text-green-400 hover:text-green-300"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="font-mono text-sm text-white">{forkResult.repository.full_name}</div>
                      </div>
                    )}

                    {forkResult.deploymentUrl && (
                      <div className="p-4 bg-blue-500/10 border border-blue-400/20 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-blue-300">Deployment URL:</span>
                          <button
                            onClick={() => copyToClipboard(forkResult.deploymentUrl!)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        <a
                          href={forkResult.deploymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-sm text-blue-400 hover:text-blue-300 break-all"
                        >
                          {forkResult.deploymentUrl}
                        </a>
                      </div>
                    )}

                    {forkResult.setupInstructions && (
                      <div className="p-4 bg-gray-800/50 rounded-lg">
                        <h5 className="font-medium text-white mb-2">Next Steps:</h5>
                        <ul className="text-sm text-gray-300 space-y-1">
                          {forkResult.setupInstructions.map((instruction, index) => (
                            <li key={index}>• {instruction}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center space-x-2 text-red-400">
                      <AlertCircle className="w-6 h-6" />
                      <h4 className="font-semibold">Fork Failed</h4>
                    </div>

                    <div className="p-4 bg-red-500/10 border border-red-400/20 rounded-lg">
                      <p className="text-red-300">{forkResult.error}</p>
                    </div>

                    <button
                      onClick={() => setForkResult(null)}
                      className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all"
                    >
                      Try Again
                    </button>
                  </>
                )}

                <button
                  onClick={onClose}
                  className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all"
                >
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GitHubAuthProvider;