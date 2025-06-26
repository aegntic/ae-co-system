import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '../services/auth.service';
import { supabase } from '../services/supabase';

// Mock Supabase
vi.mock('../services/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      insert: vi.fn(),
      update: vi.fn()
    }))
  }
}));

// Mock Stripe
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({
    redirectToCheckout: vi.fn()
  }))
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('signUp', () => {
    it('should create a new user account', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' }
      };

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null
      });

      const result = await authService.signUp('test@example.com', 'password123', 'Test User');

      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeNull();
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: { name: 'Test User' }
        }
      });
    });

    it('should handle signup errors', async () => {
      const mockError = { message: 'Email already exists' };
      
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError
      });

      const result = await authService.signUp('test@example.com', 'password123', 'Test User');

      expect(result.user).toBeNull();
      expect(result.error).toEqual(mockError);
    });
  });

  describe('signIn', () => {
    it('should sign in existing user', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com'
      };

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null
      });

      const result = await authService.signIn('test@example.com', 'password123');

      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeNull();
    });
  });

  describe('subscription management', () => {
    it('should check subscription limits correctly', async () => {
      // Mock user with free tier
      const mockUser = {
        id: 'user123',
        email: 'test@example.com'
      };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      // Mock usage data
      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            subscription_tier: 'free',
            usage_data: {
              plans: 2,
              aiCalls: 50
            }
          },
          error: null
        })
      });

      const canGenerate = await authService.checkSubscriptionLimits('plans');
      expect(canGenerate).toBe(true); // 2 < 10 (free limit)
    });

    it('should identify Pro users correctly', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com'
      };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const mockFrom = vi.mocked(supabase.from);
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            subscription_tier: 'pro'
          },
          error: null
        })
      });

      const hasPro = await authService.hasProAccess();
      expect(hasPro).toBe(true);
    });
  });

  describe('usage tracking', () => {
    it('should track usage events', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com'
      };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const mockFrom = vi.mocked(supabase.from);
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockResolvedValue({ error: null });

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { usage_data: { plans: 1 } },
          error: null
        }),
        insert: mockInsert,
        update: mockUpdate
      });

      await authService.trackUsage('plans', { projectType: 'startup' });

      // Should have called insert for usage_events
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  describe('Stripe integration', () => {
    it('should create checkout session for Pro upgrade', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com'
      };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ sessionId: 'session123' })
      });

      const sessionId = await authService.createCheckoutSession('pro');
      expect(sessionId).toBe('session123');
    });
  });
});