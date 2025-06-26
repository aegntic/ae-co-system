/**
 * Polar.sh Integration Service
 * Replaces Stripe for commission payouts and subscription management
 */

export interface PolarConfig {
  accessToken: string;
  orgId: string;
  webhookSecret: string;
  apiUrl?: string;
}

export interface PolarProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  type: 'subscription' | 'one_time';
  tier: 'pro' | 'business' | 'enterprise';
}

export interface PolarSubscription {
  id: string;
  userId: string;
  productId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface PolarCommissionPayout {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  description: string;
  scheduledDate: string;
  metadata: Record<string, any>;
}

class PolarService {
  private config: PolarConfig;
  private baseUrl: string;

  constructor(config: PolarConfig) {
    this.config = config;
    this.baseUrl = config.apiUrl || 'https://api.polar.sh';
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.config.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Polar API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // ================================================================================================
  // PRODUCT MANAGEMENT
  // ================================================================================================

  async createProduct(product: Omit<PolarProduct, 'id'>): Promise<PolarProduct> {
    return this.makeRequest('/v1/products', {
      method: 'POST',
      body: JSON.stringify({
        organization_id: this.config.orgId,
        name: product.name,
        description: product.description,
        prices: [{
          amount: product.price * 100, // Convert to cents
          currency: product.currency,
          type: product.type === 'subscription' ? 'recurring' : 'one_time',
          recurring_interval: product.type === 'subscription' ? 'month' : undefined,
        }],
        metadata: {
          tier: product.tier,
        },
      }),
    });
  }

  async getProducts(): Promise<PolarProduct[]> {
    const response = await this.makeRequest(`/v1/products?organization_id=${this.config.orgId}`);
    return response.data || [];
  }

  async getProduct(productId: string): Promise<PolarProduct> {
    return this.makeRequest(`/v1/products/${productId}`);
  }

  // ================================================================================================
  // SUBSCRIPTION MANAGEMENT
  // ================================================================================================

  async createSubscription(userId: string, productId: string, metadata?: Record<string, any>): Promise<PolarSubscription> {
    return this.makeRequest('/v1/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        organization_id: this.config.orgId,
        product_id: productId,
        customer_id: userId,
        metadata: {
          user_id: userId,
          source: '4site-pro',
          ...metadata,
        },
      }),
    });
  }

  async getSubscription(subscriptionId: string): Promise<PolarSubscription> {
    return this.makeRequest(`/v1/subscriptions/${subscriptionId}`);
  }

  async getSubscriptionsByUser(userId: string): Promise<PolarSubscription[]> {
    const response = await this.makeRequest(`/v1/subscriptions?customer_id=${userId}`);
    return response.data || [];
  }

  async cancelSubscription(subscriptionId: string, atPeriodEnd: boolean = true): Promise<PolarSubscription> {
    return this.makeRequest(`/v1/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        cancel_at_period_end: atPeriodEnd,
      }),
    });
  }

  // ================================================================================================
  // COMMISSION PAYOUT SYSTEM
  // ================================================================================================

  async createCommissionPayout(payout: Omit<PolarCommissionPayout, 'id' | 'status'>): Promise<PolarCommissionPayout> {
    // Note: Polar.sh doesn't have direct payout API, so we simulate this for now
    // In production, this would integrate with Polar's webhook system
    
    const payoutRequest = {
      organization_id: this.config.orgId,
      recipient_id: payout.userId,
      amount: Math.round(payout.amount * 100), // Convert to cents
      currency: payout.currency,
      description: payout.description,
      scheduled_date: payout.scheduledDate,
      metadata: {
        type: 'commission_payout',
        user_id: payout.userId,
        ...payout.metadata,
      },
    };

    // For now, we'll store this as a pending payout and process via webhook
    console.log('[Polar Service] Commission payout created:', payoutRequest);
    
    return {
      id: `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      ...payout,
    };
  }

  async getCommissionPayouts(userId: string): Promise<PolarCommissionPayout[]> {
    // Placeholder implementation - would fetch from Polar API or local database
    console.log('[Polar Service] Fetching commission payouts for user:', userId);
    
    return [
      {
        id: 'payout_demo_1',
        userId,
        amount: 150.00,
        currency: 'USD',
        status: 'paid',
        description: 'Commission payout for November 2024',
        scheduledDate: '2024-12-01',
        metadata: {
          referrals_count: 5,
          commission_tier: 'established',
        },
      },
      {
        id: 'payout_demo_2',
        userId,
        amount: 89.50,
        currency: 'USD',
        status: 'pending',
        description: 'Commission payout for December 2024',
        scheduledDate: '2025-01-01',
        metadata: {
          referrals_count: 3,
          commission_tier: 'established',
        },
      },
    ];
  }

  async processScheduledPayouts(): Promise<void> {
    console.log('[Polar Service] Processing scheduled commission payouts...');
    
    // This would be called by a cron job to process pending payouts
    // Implementation would:
    // 1. Query pending payouts from database
    // 2. Calculate final amounts based on current commission rates
    // 3. Create actual payouts via Polar API
    // 4. Update payout status in database
    // 5. Send notification emails to users
  }

  // ================================================================================================
  // WEBHOOK HANDLING
  // ================================================================================================

  verifyWebhook(payload: string, signature: string): boolean {
    // Verify webhook signature from Polar.sh
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(payload)
      .digest('hex');

    return signature === `sha256=${expectedSignature}`;
  }

  async handleWebhook(event: any): Promise<void> {
    console.log('[Polar Service] Handling webhook event:', event.type);

    switch (event.type) {
      case 'subscription.created':
        await this.handleSubscriptionCreated(event.data);
        break;
      
      case 'subscription.updated':
        await this.handleSubscriptionUpdated(event.data);
        break;
      
      case 'subscription.canceled':
        await this.handleSubscriptionCanceled(event.data);
        break;
      
      case 'payment.succeeded':
        await this.handlePaymentSucceeded(event.data);
        break;
      
      case 'payout.paid':
        await this.handlePayoutPaid(event.data);
        break;
      
      default:
        console.log('[Polar Service] Unhandled webhook event type:', event.type);
    }
  }

  private async handleSubscriptionCreated(subscription: any): Promise<void> {
    console.log('[Polar Service] Subscription created:', subscription.id);
    
    // Update user tier in database
    // Track conversion for referrer
    // Send welcome email
  }

  private async handleSubscriptionUpdated(subscription: any): Promise<void> {
    console.log('[Polar Service] Subscription updated:', subscription.id);
    
    // Update user tier and limits
    // Handle plan changes
  }

  private async handleSubscriptionCanceled(subscription: any): Promise<void> {
    console.log('[Polar Service] Subscription canceled:', subscription.id);
    
    // Downgrade user tier
    // Update access permissions
    // Send retention email
  }

  private async handlePaymentSucceeded(payment: any): Promise<void> {
    console.log('[Polar Service] Payment succeeded:', payment.id);
    
    // Process commission for referrer
    // Update user billing history
    // Send payment confirmation
  }

  private async handlePayoutPaid(payout: any): Promise<void> {
    console.log('[Polar Service] Payout completed:', payout.id);
    
    // Update payout status in database
    // Send payout confirmation email
    // Update user commission balance
  }

  // ================================================================================================
  // UTILITY METHODS
  // ================================================================================================

  async getOrganizationStats(): Promise<any> {
    return this.makeRequest(`/v1/organizations/${this.config.orgId}/stats`);
  }

  async createCheckoutSession(productId: string, userId: string, successUrl: string, cancelUrl: string): Promise<any> {
    return this.makeRequest('/v1/checkout/sessions', {
      method: 'POST',
      body: JSON.stringify({
        organization_id: this.config.orgId,
        product_id: productId,
        customer_id: userId,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          user_id: userId,
          source: '4site-pro',
        },
      }),
    });
  }
}

// ================================================================================================
// SINGLETON INSTANCE
// ================================================================================================

const createPolarService = () => {
  if (typeof window === 'undefined') {
    // Server-side: use actual environment variables
    return new PolarService({
      accessToken: process.env.POLAR_ACCESS_TOKEN || 'demo_token',
      orgId: process.env.POLAR_ORG_ID || '4site-pro',
      webhookSecret: process.env.POLAR_WEBHOOK_SECRET || 'demo_secret',
    });
  } else {
    // Client-side: use Vite environment variables
    return new PolarService({
      accessToken: import.meta.env.VITE_POLAR_ACCESS_TOKEN || 'demo_token',
      orgId: import.meta.env.VITE_POLAR_ORG_ID || '4site-pro',
      webhookSecret: import.meta.env.VITE_POLAR_WEBHOOK_SECRET || 'demo_secret',
    });
  }
};

export const polarService = createPolarService();
export default PolarService;