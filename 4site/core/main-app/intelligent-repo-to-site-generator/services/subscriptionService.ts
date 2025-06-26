import { SubscriptionTier, User, SetupMode } from '../types';

interface PaymentProvider {
  name: 'stripe' | 'paddle' | 'lemonsqueezy';
  apiKey: string;
  webhookSecret: string;
}

interface SubscriptionConfig {
  provider: PaymentProvider;
  trialDays: number;
  allowDowngrade: boolean;
  prorationMode: 'immediate' | 'next_cycle';
}

class SubscriptionService {
  private config: SubscriptionConfig;
  private tiers: SubscriptionTier[];

  constructor(config: SubscriptionConfig) {
    this.config = config;
    this.tiers = this.initializeSubscriptionTiers();
  }

  private initializeSubscriptionTiers(): SubscriptionTier[] {
    return [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        period: 'monthly',
        features: [
          'Up to 3 sites per month',
          'Basic templates',
          'project4site branding',
          'Community support',
          'Basic analytics'
        ],
        limits: {
          sites: 3,
          customDomains: 0,
          mcpServers: 0,
          storage: '100MB'
        }
      },
      {
        id: 'select',
        name: 'Select Style Pro',
        price: 29,
        period: 'monthly',
        features: [
          'Unlimited sites',
          'Premium templates',
          'Remove ads',
          'Custom domains',
          'Deep repository analysis',
          'crawl4ai integration',
          'aurachat.io mapping',
          'Custom MCP servers',
          'Priority support',
          'Advanced analytics',
          'SEO optimization'
        ],
        limits: {
          sites: -1, // unlimited
          customDomains: 10,
          mcpServers: 5,
          storage: '10GB'
        }
      },
      {
        id: 'custom',
        name: 'Enterprise Custom',
        price: 299,
        period: 'monthly',
        features: [
          'Everything in Select Style',
          'Unlimited everything',
          'White-label solutions',
          'Direct designer collaboration',
          'Custom integrations',
          'Dedicated support team',
          'SLA guarantees',
          'Advanced security features',
          'Custom workflows',
          'Enterprise SSO',
          'Custom reporting'
        ],
        limits: {
          sites: -1,
          customDomains: -1,
          mcpServers: -1,
          storage: 'Unlimited'
        }
      }
    ];
  }

  async getSubscriptionTiers(): Promise<SubscriptionTier[]> {
    return this.tiers;
  }

  async getTierByMode(mode: SetupMode): Promise<SubscriptionTier> {
    const tierMap = {
      [SetupMode.Auto]: 'free',
      [SetupMode.SelectStyle]: 'select',
      [SetupMode.CustomDesign]: 'custom'
    };

    const tierId = tierMap[mode];
    const tier = this.tiers.find(t => t.id === tierId);
    
    if (!tier) {
      throw new Error(`No subscription tier found for mode: ${mode}`);
    }

    return tier;
  }

  async createCheckoutSession(tierId: string, userId?: string): Promise<{
    sessionId: string;
    checkoutUrl: string;
    tier: SubscriptionTier;
  }> {
    const tier = this.tiers.find(t => t.id === tierId);
    if (!tier) {
      throw new Error(`Subscription tier not found: ${tierId}`);
    }

    if (tier.price === 0) {
      throw new Error('Cannot create checkout session for free tier');
    }

    try {
      // Simulate payment provider integration
      const sessionId = this.generateSessionId();
      const checkoutUrl = await this.createPaymentSession(tier, sessionId, userId);

      return {
        sessionId,
        checkoutUrl,
        tier
      };
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      throw new Error('Unable to create payment session. Please try again.');
    }
  }

  async verifySubscription(sessionId: string): Promise<{
    success: boolean;
    subscription?: {
      id: string;
      tierId: string;
      status: 'active' | 'cancelled' | 'past_due';
      currentPeriodEnd: string;
    };
  }> {
    try {
      // Simulate payment verification
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock successful verification
      return {
        success: true,
        subscription: {
          id: `sub_${Date.now()}`,
          tierId: 'select', // Mock tier
          status: 'active',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      };
    } catch (error) {
      console.error('Subscription verification failed:', error);
      return { success: false };
    }
  }

  async getUserSubscription(userId: string): Promise<SubscriptionTier | null> {
    try {
      // Mock user subscription lookup
      // In real implementation, query database for user's current subscription
      return this.tiers.find(t => t.id === 'free') || null;
    } catch (error) {
      console.error('Failed to get user subscription:', error);
      return null;
    }
  }

  async updateSubscription(userId: string, newTierId: string): Promise<{
    success: boolean;
    subscription?: SubscriptionTier;
    prorationAmount?: number;
  }> {
    const newTier = this.tiers.find(t => t.id === newTierId);
    if (!newTier) {
      throw new Error(`Subscription tier not found: ${newTierId}`);
    }

    try {
      // Calculate proration if applicable
      const currentTier = await this.getUserSubscription(userId);
      const prorationAmount = this.calculateProration(currentTier, newTier);

      // Update subscription with payment provider
      await this.updatePaymentSubscription(userId, newTier);

      return {
        success: true,
        subscription: newTier,
        prorationAmount
      };
    } catch (error) {
      console.error('Failed to update subscription:', error);
      return { success: false };
    }
  }

  async cancelSubscription(userId: string, immediate: boolean = false): Promise<{
    success: boolean;
    cancelledAt?: string;
    endsAt?: string;
  }> {
    try {
      const cancelledAt = new Date().toISOString();
      const endsAt = immediate 
        ? cancelledAt 
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      // Cancel with payment provider
      await this.cancelPaymentSubscription(userId, immediate);

      return {
        success: true,
        cancelledAt,
        endsAt
      };
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      return { success: false };
    }
  }

  async checkFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const userTier = await this.getUserSubscription(userId);
    if (!userTier) {
      return false;
    }

    // Check if feature is included in user's tier
    return userTier.features.some(f => 
      f.toLowerCase().includes(feature.toLowerCase())
    );
  }

  async checkUsageLimits(userId: string, resource: keyof SubscriptionTier['limits']): Promise<{
    allowed: boolean;
    current: number;
    limit: number;
    percentage: number;
  }> {
    const userTier = await this.getUserSubscription(userId);
    if (!userTier) {
      return { allowed: false, current: 0, limit: 0, percentage: 0 };
    }

    const limit = userTier.limits[resource];
    
    // Mock current usage - in real implementation, query actual usage
    const currentUsage = this.getMockUsage(userId, resource);
    
    const numericLimit = typeof limit === 'number' ? limit : Infinity;
    const allowed = numericLimit === -1 || currentUsage < numericLimit;
    const percentage = numericLimit === -1 ? 0 : (currentUsage / numericLimit) * 100;

    return {
      allowed,
      current: currentUsage,
      limit: numericLimit,
      percentage: Math.min(percentage, 100)
    };
  }

  async getUpgradeRecommendation(userId: string): Promise<{
    shouldUpgrade: boolean;
    recommendedTier?: SubscriptionTier;
    reason?: string;
  }> {
    const currentTier = await this.getUserSubscription(userId);
    if (!currentTier) {
      return { shouldUpgrade: false };
    }

    // Check usage against limits
    const siteUsage = await this.checkUsageLimits(userId, 'sites');
    const mcpUsage = await this.checkUsageLimits(userId, 'mcpServers');
    const domainUsage = await this.checkUsageLimits(userId, 'customDomains');

    if (siteUsage.percentage > 80 || mcpUsage.percentage > 80 || domainUsage.percentage > 80) {
      const nextTier = this.getNextTier(currentTier.id);
      if (nextTier) {
        return {
          shouldUpgrade: true,
          recommendedTier: nextTier,
          reason: 'You\'re approaching your usage limits. Upgrade for more capacity.'
        };
      }
    }

    return { shouldUpgrade: false };
  }

  private generateSessionId(): string {
    return `cs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async createPaymentSession(
    tier: SubscriptionTier,
    sessionId: string,
    userId?: string
  ): Promise<string> {
    // Mock payment provider integration
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://app.project4site.com' 
      : 'http://localhost:5173';

    const mockCheckoutUrl = `${baseUrl}/checkout?session=${sessionId}&tier=${tier.id}`;
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return mockCheckoutUrl;
  }

  private async updatePaymentSubscription(userId: string, newTier: SubscriptionTier): Promise<void> {
    // Mock payment provider subscription update
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async cancelPaymentSubscription(userId: string, immediate: boolean): Promise<void> {
    // Mock payment provider cancellation
    await new Promise(resolve => setTimeout(resolve, 800));
  }

  private calculateProration(currentTier: SubscriptionTier | null, newTier: SubscriptionTier): number {
    if (!currentTier || currentTier.price === 0) {
      return newTier.price;
    }

    // Simple proration calculation
    const priceDifference = newTier.price - currentTier.price;
    const daysRemaining = 20; // Mock days remaining in cycle
    const dailyRate = priceDifference / 30;
    
    return Math.round(dailyRate * daysRemaining * 100) / 100;
  }

  private getMockUsage(userId: string, resource: keyof SubscriptionTier['limits']): number {
    // Mock usage data - in real implementation, query database
    const mockUsage = {
      sites: Math.floor(Math.random() * 5),
      customDomains: Math.floor(Math.random() * 3),
      mcpServers: Math.floor(Math.random() * 2),
      storage: Math.floor(Math.random() * 500) // MB
    };

    return mockUsage[resource] || 0;
  }

  private getNextTier(currentTierId: string): SubscriptionTier | null {
    const currentIndex = this.tiers.findIndex(t => t.id === currentTierId);
    if (currentIndex === -1 || currentIndex === this.tiers.length - 1) {
      return null;
    }
    return this.tiers[currentIndex + 1];
  }
}

// Singleton instance
const subscriptionService = new SubscriptionService({
  provider: {
    name: 'stripe',
    apiKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || ''
  },
  trialDays: 7,
  allowDowngrade: true,
  prorationMode: 'immediate'
});

export { subscriptionService };
export type { SubscriptionTier, PaymentProvider };