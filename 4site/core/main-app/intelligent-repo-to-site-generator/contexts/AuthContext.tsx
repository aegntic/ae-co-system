import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { 
  supabase, 
  getCurrentUser, 
  getSession, 
  getUserProfile,
  signIn as supabaseSignIn,
  signUp as supabaseSignUp,
  signInWithProvider as supabaseSignInWithProvider,
  signOut as supabaseSignOut
} from '../lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  tier: 'free' | 'pro' | 'business' | 'enterprise';
  referral_code: string;
  websites_limit: number;
  custom_domains_limit: number;
  monthly_pageviews_limit: number;
  storage_limit_mb: number;
  total_websites_created: number;
  total_pageviews: number;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, referralCode?: string) => Promise<void>;
  signInWithProvider: (provider: 'github' | 'google') => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = async (userId: string) => {
    try {
      const userProfile = await getUserProfile(userId);
      setProfile(userProfile as UserProfile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user.id);
    }
  };

  useEffect(() => {
    // Check active session
    const initializeAuth = async () => {
      try {
        const currentSession = await getSession();
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          await loadUserProfile(currentSession.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes (only if supabase is available)
    if (!supabase) {
      setLoading(false);
      return () => {}; // Return empty cleanup function
    }
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (session) {
        setSession(session);
        setUser(session.user);
        await loadUserProfile(session.user.id);
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }

      // Handle specific auth events
      switch (event) {
        case 'SIGNED_IN':
          // Track sign in event
          await supabase.from('analytics_events').insert({
            user_id: session?.user.id,
            event_type: 'sign_in',
            event_data: { method: session?.user.app_metadata.provider || 'email' }
          });
          break;
        case 'SIGNED_OUT':
          // Clear local data
          break;
        case 'USER_UPDATED':
          // Refresh profile
          if (session?.user) {
            await loadUserProfile(session.user.id);
          }
          break;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { user } = await supabaseSignIn(email, password);
    if (user) {
      await loadUserProfile(user.id);
    }
  };

  const signUp = async (email: string, password: string, referralCode?: string) => {
    const { user } = await supabaseSignUp(email, password, referralCode);
    if (user) {
      await loadUserProfile(user.id);
    }
  };

  const signInWithProvider = async (provider: 'github' | 'google') => {
    await supabaseSignInWithProvider(provider);
    // Profile will be loaded after redirect
  };

  const signOut = async () => {
    await supabaseSignOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signInWithProvider,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook for requiring authentication
export const useRequireAuth = (redirectTo = '/login') => {
  const { user, loading } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to login
      window.location.href = redirectTo;
    } else if (!loading && user) {
      setIsAuthenticated(true);
    }
  }, [user, loading, redirectTo]);

  return { isAuthenticated, loading };
};

// Hook for checking user permissions
export const usePermissions = () => {
  const { profile } = useAuth();

  const canCreateWebsite = () => {
    if (!profile) return false;
    return profile.websites_limit === -1 || profile.total_websites_created < profile.websites_limit;
  };

  const canUseCustomDomain = () => {
    if (!profile) return false;
    return profile.custom_domains_limit > 0 || profile.custom_domains_limit === -1;
  };

  const canAccessFeature = (feature: string) => {
    if (!profile) return false;
    
    const tierFeatures: Record<string, string[]> = {
      free: ['basic_templates', 'subdomain', 'basic_analytics'],
      pro: ['all_templates', 'custom_domain', 'advanced_analytics', 'remove_branding', 'api_access'],
      business: ['team_collaboration', 'white_label', 'custom_integrations', 'ab_testing', 'priority_support'],
      enterprise: ['source_code', 'on_premise', 'custom_development', 'sla', 'training']
    };

    const userFeatures = tierFeatures[profile.tier] || [];
    return userFeatures.includes(feature);
  };

  return {
    canCreateWebsite,
    canUseCustomDomain,
    canAccessFeature,
    tier: profile?.tier || 'free'
  };
};