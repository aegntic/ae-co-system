import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UnifiedAuthService } from '../services/unified-auth.service';
import { 
  UnifiedUser, 
  UnifiedSession, 
  CrossPlatformProject,
  FlyWheelMetrics,
  AuthenticationConfig 
} from '../auth/unified-auth.types';

interface UnifiedAuthContextType {
  // State
  user: UnifiedUser | null;
  session: UnifiedSession | null;
  loading: boolean;
  isAuthenticated: boolean;
  
  // Authentication methods
  signIn: (email: string, password: string, platform: 'foursitepro' | 'dailydoco') => Promise<void>;
  signUp: (email: string, password: string, name: string, platform: 'foursitepro' | 'dailydoco', referralCode?: string) => Promise<void>;
  signOut: () => Promise<void>;
  
  // Cross-platform methods
  switchPlatform: (targetPlatform: 'foursitepro' | 'dailydoco') => Promise<boolean>;
  shareProject: (projectData: Omit<CrossPlatformProject, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<CrossPlatformProject>;
  getUserProjects: (platform?: 'foursitepro' | 'dailydoco') => Promise<CrossPlatformProject[]>;
  
  // Tutorial generation
  generateTutorial: (request: import('../auth/unified-auth.types').TutorialGenerationRequest) => Promise<string>;
  
  // Analytics
  getFlyWheelMetrics: (timeframe: '24h' | '7d' | '30d' | '90d') => Promise<FlyWheelMetrics>;
  
  // Permissions
  canAccessPlatform: (platform: 'foursitepro' | 'dailydoco') => boolean;
  canRemoveBranding: () => boolean;
  canUseAdvancedFeatures: () => boolean;
  hasActiveSubscription: () => boolean;
}

const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(undefined);

export const useUnifiedAuth = () => {
  const context = useContext(UnifiedAuthContext);
  if (!context) {
    throw new Error('useUnifiedAuth must be used within a UnifiedAuthProvider');
  }
  return context;
};

interface UnifiedAuthProviderProps {
  children: React.ReactNode;
  config: AuthenticationConfig;
  platform: 'foursitepro' | 'dailydoco';
}

export const UnifiedAuthProvider: React.FC<UnifiedAuthProviderProps> = ({ 
  children, 
  config, 
  platform 
}) => {
  const [user, setUser] = useState<UnifiedUser | null>(null);
  const [session, setSession] = useState<UnifiedSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [authService] = useState(() => new UnifiedAuthService(config));

  // Initialize authentication state
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      
      // Check for existing session
      const existingSession = getStoredSession();
      if (existingSession) {
        const validUser = await authService.validateCrossPlatformSession(
          existingSession.access_token, 
          platform
        );
        
        if (validUser && existingSession.expires_at > Date.now()) {
          setUser(validUser);
          setSession(existingSession);
        } else {
          // Session expired, clear storage
          clearStoredSession();
        }
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      clearStoredSession();
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string, loginPlatform: 'foursitepro' | 'dailydoco') => {
    try {
      setLoading(true);
      const newSession = await authService.createUnifiedSession(email, password, loginPlatform);
      
      setSession(newSession);
      setUser(newSession.user);
      storeSession(newSession);
      
      // Track cross-platform login
      await authService.trackConversionEvent({
        user_id: newSession.user.id,
        event_type: 'cross_platform_action',
        source_platform: loginPlatform,
        target_platform: platform,
        metadata: { action: 'login' },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    name: string, 
    signupPlatform: 'foursitepro' | 'dailydoco',
    referralCode?: string
  ) => {
    try {
      setLoading(true);
      const newSession = await authService.signUpUnified(
        email, 
        password, 
        name, 
        signupPlatform, 
        referralCode
      );
      
      setSession(newSession);
      setUser(newSession.user);
      storeSession(newSession);
    } catch (error) {
      console.error('Sign up failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      clearStoredSession();
      setUser(null);
      setSession(null);
      
      // Optional: Call server-side logout if needed
      // await authService.signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchPlatform = async (targetPlatform: 'foursitepro' | 'dailydoco'): Promise<boolean> => {
    if (!session) return false;
    
    try {
      const validUser = await authService.validateCrossPlatformSession(
        session.access_token,
        targetPlatform
      );
      
      if (validUser) {
        // Update session to reflect new platform access
        const updatedSession = {
          ...session,
          user: validUser
        };
        setSession(updatedSession);
        setUser(validUser);
        storeSession(updatedSession);
        
        // Track platform switch
        await authService.trackConversionEvent({
          user_id: validUser.id,
          event_type: 'cross_platform_action',
          source_platform: platform,
          target_platform: targetPlatform,
          metadata: { action: 'platform_switch' },
          timestamp: new Date().toISOString()
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Platform switch failed:', error);
      return false;
    }
  };

  const shareProject = async (
    projectData: Omit<CrossPlatformProject, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<CrossPlatformProject> => {
    if (!user) throw new Error('User must be authenticated');
    
    return await authService.shareProjectCrossPlatform(user.id, projectData);
  };

  const getUserProjects = async (filterPlatform?: 'foursitepro' | 'dailydoco'): Promise<CrossPlatformProject[]> => {
    if (!user) return [];
    
    return await authService.getUserProjects(user.id, filterPlatform);
  };

  const generateTutorial = async (request: import('../auth/unified-auth.types').TutorialGenerationRequest): Promise<string> => {
    if (!user) throw new Error('User must be authenticated');
    
    return await authService.triggerTutorialGeneration({
      ...request,
      user_id: user.id
    });
  };

  const getFlyWheelMetrics = async (timeframe: '24h' | '7d' | '30d' | '90d'): Promise<FlyWheelMetrics> => {
    if (!user) throw new Error('User must be authenticated');
    
    return await authService.getFlyWheelMetrics(user.id, timeframe);
  };

  // Permission helpers
  const canAccessPlatform = useCallback((targetPlatform: 'foursitepro' | 'dailydoco'): boolean => {
    return user?.platform_access[targetPlatform] ?? false;
  }, [user]);

  const canRemoveBranding = useCallback((): boolean => {
    return user?.subscription_tier !== 'free';
  }, [user]);

  const canUseAdvancedFeatures = useCallback((): boolean => {
    return ['business', 'enterprise'].includes(user?.subscription_tier || '');
  }, [user]);

  const hasActiveSubscription = useCallback((): boolean => {
    return user?.subscription_tier !== 'free';
  }, [user]);

  // Local storage helpers
  const storeSession = (sessionData: UnifiedSession) => {
    try {
      localStorage.setItem('unified_auth_session', JSON.stringify(sessionData));
    } catch (error) {
      console.error('Failed to store session:', error);
    }
  };

  const getStoredSession = (): UnifiedSession | null => {
    try {
      const stored = localStorage.getItem('unified_auth_session');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to get stored session:', error);
      return null;
    }
  };

  const clearStoredSession = () => {
    try {
      localStorage.removeItem('unified_auth_session');
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  };

  const value: UnifiedAuthContextType = {
    // State
    user,
    session,
    loading,
    isAuthenticated: !!user,
    
    // Authentication methods
    signIn,
    signUp,
    signOut,
    
    // Cross-platform methods
    switchPlatform,
    shareProject,
    getUserProjects,
    
    // Tutorial generation
    generateTutorial,
    
    // Analytics
    getFlyWheelMetrics,
    
    // Permissions
    canAccessPlatform,
    canRemoveBranding,
    canUseAdvancedFeatures,
    hasActiveSubscription
  };

  return (
    <UnifiedAuthContext.Provider value={value}>
      {children}
    </UnifiedAuthContext.Provider>
  );
};

// Higher-order component for protected routes
export const withUnifiedAuth = <P extends object>(
  Component: React.ComponentType<P>,
  requiredPlatforms?: ('foursitepro' | 'dailydoco')[]
) => {
  return (props: P) => {
    const { isAuthenticated, user, loading, canAccessPlatform } = useUnifiedAuth();
    
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      );
    }
    
    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
            <p className="text-gray-600">Please sign in to access this feature.</p>
          </div>
        </div>
      );
    }
    
    if (requiredPlatforms && requiredPlatforms.length > 0) {
      const hasAccess = requiredPlatforms.some(platform => canAccessPlatform(platform));
      if (!hasAccess) {
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-4">Access Denied</h2>
              <p className="text-gray-600">
                You need access to {requiredPlatforms.join(' or ')} to view this content.
              </p>
            </div>
          </div>
        );
      }
    }
    
    return <Component {...props} />;
  };
};

// Hook for cross-platform navigation
export const useCrossPlatformNavigation = () => {
  const { switchPlatform, canAccessPlatform } = useUnifiedAuth();
  
  const navigateToPlatform = async (
    targetPlatform: 'foursitepro' | 'dailydoco',
    path: string = '/'
  ) => {
    if (!canAccessPlatform(targetPlatform)) {
      throw new Error(`No access to ${targetPlatform}`);
    }
    
    const success = await switchPlatform(targetPlatform);
    if (success) {
      const baseUrls = {
        foursitepro: process.env.NEXT_PUBLIC_FOURSITEPRO_URL || 'http://localhost:3000',
        dailydoco: process.env.NEXT_PUBLIC_DAILYDOCO_URL || 'http://localhost:5173'
      };
      
      window.location.href = `${baseUrls[targetPlatform]}${path}`;
    } else {
      throw new Error('Platform switch failed');
    }
  };
  
  return { navigateToPlatform, canAccessPlatform };
};