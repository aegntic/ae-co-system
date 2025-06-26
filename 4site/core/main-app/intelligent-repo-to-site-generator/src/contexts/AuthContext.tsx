import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, authHelpers } from '../lib/supabase';
import type { UserProfile } from '../types/database';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, referralCode?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithProvider: (provider: 'github' | 'google') => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user profile
  const loadUserProfile = async (userId: string) => {
    try {
      const profile = await authHelpers.getUserProfile(userId);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setUserProfile(null);
      }

      // Handle referral tracking on sign up
      if (event === 'SIGNED_IN' && session?.user) {
        const referralCode = localStorage.getItem('referral_code');
        if (referralCode) {
          try {
            // Update user's referred_by field
            await supabase
              .from('user_profiles')
              .update({ referred_by: session.user.id })
              .eq('referral_code', referralCode);
            
            // Clear referral code
            localStorage.removeItem('referral_code');
          } catch (error) {
            console.error('Error processing referral:', error);
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auth methods
  const signUp = async (email: string, password: string, referralCode?: string) => {
    setLoading(true);
    try {
      const { user } = await authHelpers.signUp(email, password, referralCode);
      if (user) {
        await loadUserProfile(user.id);
      }
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { user } = await authHelpers.signIn(email, password);
      if (user) {
        await loadUserProfile(user.id);
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithProvider = async (provider: 'github' | 'google') => {
    setLoading(true);
    try {
      await authHelpers.signInWithProvider(provider);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authHelpers.signOut();
      setUser(null);
      setUserProfile(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('No user logged in');
    
    const updatedProfile = await authHelpers.updateUserProfile(user.id, updates);
    setUserProfile(updatedProfile);
  };

  const value: AuthContextType = {
    user,
    userProfile,
    session,
    loading,
    signUp,
    signIn,
    signInWithProvider,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook for checking permissions
export const usePermissions = () => {
  const { userProfile } = useAuth();

  const canRemoveBranding = () => {
    return userProfile?.subscription_tier !== 'free';
  };

  const canUseCustomDomain = () => {
    return userProfile?.subscription_tier !== 'free';
  };

  const canAccessAPI = () => {
    return ['pro', 'business', 'enterprise'].includes(userProfile?.subscription_tier || '');
  };

  const canUseWhiteLabel = () => {
    return ['business', 'enterprise'].includes(userProfile?.subscription_tier || '');
  };

  const getWebsiteLimit = () => {
    const limits = {
      free: 3,
      pro: -1, // unlimited
      business: -1,
      enterprise: -1,
    };
    return limits[userProfile?.subscription_tier || 'free'];
  };

  return {
    canRemoveBranding,
    canUseCustomDomain,
    canAccessAPI,
    canUseWhiteLabel,
    getWebsiteLimit,
    tier: userProfile?.subscription_tier || 'free',
  };
};

// Hook for protected routes
export const useRequireAuth = (redirectTo = '/') => {
  const { user, loading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to login or home
      window.location.href = redirectTo;
    } else if (user) {
      setIsAuthorized(true);
    }
  }, [user, loading, redirectTo]);

  return isAuthorized;
};