import { supabase } from './supabase';
import { User, Subscription, SubscriptionTier } from '../../shared/types';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.REACT_APP_STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

interface AuthResponse {
  user: User | null;
  error: Error | null;
}

interface SubscriptionResponse {
  subscription: Subscription | null;
  error: Error | null;
}

export class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;
  private subscriptionCache: Map<string, Subscription> = new Map();

  private constructor() {
    this.initializeAuthListener();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private initializeAuthListener() {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await this.loadUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
        this.subscriptionCache.clear();
      }
    });
  }

  async signUp(email: string, password: string, name: string): Promise<AuthResponse> {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create user profile
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email,
            name,
            created_at: new Date().toISOString(),
            subscription_tier: 'free',
            subscription_status: 'active'
          })
          .select()
          .single();

        if (profileError) throw profileError;

        // Create free tier subscription
        await this.createFreeSubscription(authData.user.id);

        // Send welcome email with value-driven content
        await this.sendWelcomeEmail(email, name);

        this.currentUser = profile as User;
        return { user: this.currentUser, error: null };
      }

      return { user: null, error: new Error('User creation failed') };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.user) {
        await this.loadUserProfile(data.user.id);
        return { user: this.currentUser, error: null };
      }

      return { user: null, error: new Error('Sign in failed') };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  async signInWithGoogle(): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'email profile'
        }
      });

      if (error) throw error;

      // User will be loaded after redirect
      return { user: null, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
    this.currentUser = null;
    this.subscriptionCache.clear();
  }

  async loadUserProfile(userId: string): Promise<void> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      this.currentUser = data as User;
      
      // Load subscription details
      const subscription = await this.getSubscription(userId);
      if (subscription) {
        this.currentUser.subscription = subscription;
      }
    }
  }

  async getSubscription(userId: string): Promise<Subscription | null> {
    // Check cache first
    if (this.subscriptionCache.has(userId)) {
      return this.subscriptionCache.get(userId)!;
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!error && data) {
      const subscription = data as Subscription;
      this.subscriptionCache.set(userId, subscription);
      return subscription;
    }

    return null;
  }

  async createFreeSubscription(userId: string): Promise<SubscriptionResponse> {
    try {
      const subscription: Partial<Subscription> = {
        userId,
        tier: 'free',
        status: 'active',
        startDate: new Date(),
        limits: {
          plansPerMonth: 10,
          aiCallsPerMonth: 100,
          templatesAccess: false,
          prioritySupport: false,
          apiAccess: false
        }
      };

      const { data, error } = await supabase
        .from('subscriptions')
        .insert(subscription)
        .select()
        .single();

      if (error) throw error;

      return { subscription: data as Subscription, error: null };
    } catch (error) {
      return { subscription: null, error: error as Error };
    }
  }

  async upgradeToPro(userId: string): Promise<SubscriptionResponse> {
    try {
      if (!this.currentUser) throw new Error('User not authenticated');

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price: process.env.REACT_APP_STRIPE_PRO_PRICE_ID,
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: `${window.location.origin}/dashboard?subscription=success`,
        cancel_url: `${window.location.origin}/pricing?subscription=cancelled`,
        customer_email: this.currentUser.email,
        metadata: {
          userId,
          tier: 'pro'
        },
        subscription_data: {
          trial_period_days: 14, // 14-day free trial
          metadata: {
            userId,
            tier: 'pro'
          }
        }
      });

      // Redirect to Stripe
      window.location.href = session.url!;

      return { subscription: null, error: null };
    } catch (error) {
      return { subscription: null, error: error as Error };
    }
  }

  async upgradeToEnterprise(userId: string): Promise<void> {
    // Enterprise requires custom onboarding
    window.location.href = '/contact-sales?plan=enterprise';
  }

  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        await this.activateSubscription(
          session.metadata!.userId,
          session.metadata!.tier as SubscriptionTier,
          session.subscription as string
        );
        break;

      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        await this.updateSubscriptionStatus(
          subscription.metadata.userId,
          subscription.status
        );
        break;

      case 'customer.subscription.deleted':
        const deletedSub = event.data.object as Stripe.Subscription;
        await this.cancelSubscription(deletedSub.metadata.userId);
        break;
    }
  }

  private async activateSubscription(
    userId: string,
    tier: SubscriptionTier,
    stripeSubscriptionId: string
  ): Promise<void> {
    const limits = this.getSubscriptionLimits(tier);

    await supabase
      .from('subscriptions')
      .update({
        tier,
        status: 'active',
        stripeSubscriptionId,
        limits,
        updatedAt: new Date().toISOString()
      })
      .eq('user_id', userId);

    // Clear cache
    this.subscriptionCache.delete(userId);
  }

  private async updateSubscriptionStatus(
    userId: string,
    status: string
  ): Promise<void> {
    await supabase
      .from('subscriptions')
      .update({
        status,
        updatedAt: new Date().toISOString()
      })
      .eq('user_id', userId);

    // Clear cache
    this.subscriptionCache.delete(userId);
  }

  private async cancelSubscription(userId: string): Promise<void> {
    // Downgrade to free tier
    await this.createFreeSubscription(userId);
  }

  private getSubscriptionLimits(tier: SubscriptionTier): any {
    const limits = {
      free: {
        plansPerMonth: 10,
        aiCallsPerMonth: 100,
        templatesAccess: false,
        prioritySupport: false,
        apiAccess: false
      },
      pro: {
        plansPerMonth: 1000,
        aiCallsPerMonth: 10000,
        templatesAccess: true,
        prioritySupport: true,
        apiAccess: true,
        teamMembers: 5
      },
      enterprise: {
        plansPerMonth: -1, // Unlimited
        aiCallsPerMonth: -1, // Unlimited
        templatesAccess: true,
        prioritySupport: true,
        apiAccess: true,
        teamMembers: -1, // Unlimited
        customIntegrations: true,
        sla: true
      }
    };

    return limits[tier];
  }

  private async sendWelcomeEmail(email: string, name: string): Promise<void> {
    // Send value-driven welcome email
    // This would integrate with email service
    console.log(`Sending welcome email to ${email}`);
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  hasProAccess(): boolean {
    return this.currentUser?.subscription?.tier === 'pro' || 
           this.currentUser?.subscription?.tier === 'enterprise';
  }

  hasEnterpriseAccess(): boolean {
    return this.currentUser?.subscription?.tier === 'enterprise';
  }

  async checkSubscriptionLimits(feature: string): Promise<boolean> {
    if (!this.currentUser?.subscription) return false;

    const subscription = this.currentUser.subscription;
    const usage = await this.getFeatureUsage(this.currentUser.id, feature);

    switch (feature) {
      case 'plans':
        return subscription.limits.plansPerMonth === -1 || 
               usage < subscription.limits.plansPerMonth;
      
      case 'aiCalls':
        return subscription.limits.aiCallsPerMonth === -1 || 
               usage < subscription.limits.aiCallsPerMonth;
      
      case 'templates':
        return subscription.limits.templatesAccess;
      
      case 'api':
        return subscription.limits.apiAccess;
      
      default:
        return true;
    }
  }

  private async getFeatureUsage(userId: string, feature: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('feature', feature)
      .gte('created_at', startOfMonth.toISOString());

    return count || 0;
  }

  async trackUsage(feature: string, metadata?: any): Promise<void> {
    if (!this.currentUser) return;

    await supabase
      .from('usage_logs')
      .insert({
        user_id: this.currentUser.id,
        feature,
        metadata,
        created_at: new Date().toISOString()
      });
  }
}

export const authService = AuthService.getInstance();