import React, { createContext, useContext } from 'react';

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
  user: any;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: any) => Promise<void>;
  signInWithProvider: (provider: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mockAuthValue: AuthContextType = {
    user: null,
    profile: null,
    loading: false,
    signIn: async () => console.log('Mock signIn'),
    signUp: async () => console.log('Mock signUp'),
    signInWithProvider: async () => console.log('Mock signInWithProvider'),
    signOut: async () => console.log('Mock signOut'),
    updateProfile: async () => console.log('Mock updateProfile')
  };

  return (
    <AuthContext.Provider value={mockAuthValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};