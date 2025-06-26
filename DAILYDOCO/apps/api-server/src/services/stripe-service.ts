import Stripe from 'stripe';
import { Subscription, SubscriptionEvent, OverageCharges, ChurnPrediction, ExpansionOpportunity } from '../../../../libs/shared-types/src/subscription';
import { PRICING_TIERS, REVENUE_TARGETS } from '../../../../libs/shared-types/src/pricing';

// Initialize Stripe with enhanced configuration for revenue optimization
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
  typescript: true,
  telemetry: false, // Disable for performance
  maxNetworkRetries: 3,
  timeout: 30000, // 30 second timeout for enterprise operations
});

export class StripeService {
  private webhookSecret: string;

  constructor() {
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  }

  /**
   * Create a new subscription with advanced revenue optimization
   */
  async createSubscription(params: {
    userId: string;
    email: string;
    tierId: string;
    billingCycle: 'monthly' | 'yearly';
    paymentMethodId?: string;
    trialDays?: number;
    acquisitionChannel?: string;
    conversionSource?: string;
  }): Promise<{ subscription: Stripe.Subscription; client_secret?: string }> {
    try {
      const tier = PRICING_TIERS[params.tierId.toUpperCase()];
      if (!tier) {
        throw new Error(`Invalid tier: ${params.tierId}`);
      }

      // Create or retrieve customer with enhanced metadata
      const customer = await this.createOrUpdateCustomer({
        email: params.email,
        userId: params.userId,
        metadata: {
          tier: params.tierId,
          acquisition_channel: params.acquisitionChannel || 'direct',
          conversion_source: params.conversionSource || 'pricing_page',
          signup_date: new Date().toISOString(),
          ltv_prediction: this.calculateLTVPrediction(params.tierId).toString(),
          churn_risk_score: '0' // Initial score
        }
      });

      // Determine price based on billing cycle
      const price = params.billingCycle === 'yearly' ? tier.priceYearly : tier.priceMonthly;
      const priceId = this.getPriceId(params.tierId, params.billingCycle);

      // Create subscription with revenue optimization features
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        trial_period_days: params.trialDays,
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          user_id: params.userId,
          tier: params.tierId,
          billing_cycle: params.billingCycle,
          acquisition_channel: params.acquisitionChannel || 'direct',
          conversion_source: params.conversionSource || 'pricing_page',
          revenue_target_contribution: this.calculateRevenueContribution(params.tierId, params.billingCycle).toString()
        },
        // Revenue optimization: Set up automatic tax and discounts
        automatic_tax: { enabled: true },
        collection_method: 'charge_automatically',
        // Dunning management for failed payments
        invoice_settings: {
          default_payment_method: params.paymentMethodId
        }
      });

      // Track subscription creation for revenue analytics
      await this.trackSubscriptionEvent({
        subscriptionId: subscription.id,
        type: 'subscription_created',
        data: {
          tier: params.tierId,
          billingCycle: params.billingCycle,
          acquisitionChannel: params.acquisitionChannel,
          conversionSource: params.conversionSource,
          trialDays: params.trialDays
        }
      });

      // Initialize churn prediction scoring
      await this.initializeChurnPrediction(subscription.id, params.userId);

      const client_secret = subscription.latest_invoice?.payment_intent?.client_secret;

      return {
        subscription,
        client_secret: client_secret || undefined
      };

    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Handle subscription upgrades with revenue optimization
   */
  async upgradeSubscription(subscriptionId: string, newTierId: string, billingCycle: 'monthly' | 'yearly'): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const newTier = PRICING_TIERS[newTierId.toUpperCase()];
      
      if (!newTier) {
        throw new Error(`Invalid tier: ${newTierId}`);
      }

      const newPriceId = this.getPriceId(newTierId, billingCycle);
      
      // Calculate prorated amount for immediate upgrade
      const upgradedSubscription = await stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: 'create_prorations',
        metadata: {
          ...subscription.metadata,
          tier: newTierId,
          billing_cycle: billingCycle,
          upgraded_at: new Date().toISOString(),
          upgrade_revenue_impact: this.calculateUpgradeRevenue(subscription.metadata.tier || '', newTierId, billingCycle).toString()
        }
      });

      // Track upgrade for revenue analytics
      await this.trackSubscriptionEvent({
        subscriptionId: subscriptionId,
        type: 'subscription_upgraded',
        data: {
          fromTier: subscription.metadata.tier,
          toTier: newTierId,
          billingCycle: billingCycle,
          revenueImpact: this.calculateUpgradeRevenue(subscription.metadata.tier || '', newTierId, billingCycle)
        }
      });

      // Update churn prediction (upgrades typically reduce churn risk)
      await this.updateChurnPrediction(subscriptionId, 'upgrade');

      return upgradedSubscription;

    } catch (error) {
      console.error('Error upgrading subscription:', error);
      throw error;
    }
  }

  /**
   * Implement usage-based overage billing
   */
  async processOverageCharges(subscriptionId: string, usage: {
    videosOverage?: number;
    storageOverageGB?: number;
    apiCallsOverage?: number;
    teamMembersOverage?: number;
  }): Promise<OverageCharges[]> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const charges: OverageCharges[] = [];

      // Calculate overage charges
      if (usage.videosOverage && usage.videosOverage > 0) {
        const amount = usage.videosOverage * 200; // $2.00 per video
        charges.push({
          id: `overage_${Date.now()}_videos`,
          subscriptionId,
          period: new Date().toISOString().slice(0, 7), // YYYY-MM
          type: 'videos',
          quantity: usage.videosOverage,
          unitPrice: 200,
          totalAmount: amount
        });
      }

      if (usage.storageOverageGB && usage.storageOverageGB > 0) {
        const amount = Math.ceil(usage.storageOverageGB) * 50; // $0.50 per GB
        charges.push({
          id: `overage_${Date.now()}_storage`,
          subscriptionId,
          period: new Date().toISOString().slice(0, 7),
          type: 'storage',
          quantity: usage.storageOverageGB,
          unitPrice: 50,
          totalAmount: amount
        });
      }

      if (usage.apiCallsOverage && usage.apiCallsOverage > 0) {
        const amount = Math.ceil(usage.apiCallsOverage / 1000) * 100; // $0.10 per 1000 calls
        charges.push({
          id: `overage_${Date.now()}_api`,
          subscriptionId,
          period: new Date().toISOString().slice(0, 7),
          type: 'api_calls',
          quantity: usage.apiCallsOverage,
          unitPrice: 10, // Per 100 calls for precision
          totalAmount: amount
        });
      }

      // Create invoice items for overage charges
      for (const charge of charges) {
        await stripe.invoiceItems.create({
          customer: subscription.customer as string,
          subscription: subscriptionId,
          amount: charge.totalAmount,
          currency: 'usd',
          description: `Overage charge: ${charge.quantity} additional ${charge.type}`,
          metadata: {
            overage_type: charge.type,
            quantity: charge.quantity.toString(),
            unit_price: charge.unitPrice.toString(),
            period: charge.period
          }
        });
      }

      // Track overage event for expansion opportunity detection
      if (charges.length > 0) {
        await this.trackSubscriptionEvent({
          subscriptionId,
          type: 'overage_charged',
          data: {
            charges,
            totalAmount: charges.reduce((sum, charge) => sum + charge.totalAmount, 0),
            period: new Date().toISOString().slice(0, 7)
          }
        });

        // Check for expansion opportunities
        await this.evaluateExpansionOpportunity(subscriptionId, charges);
      }

      return charges;

    } catch (error) {
      console.error('Error processing overage charges:', error);
      throw error;
    }
  }

  /**
   * Advanced churn prediction using subscription behavior
   */
  async predictChurn(subscriptionId: string): Promise<ChurnPrediction> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['customer', 'latest_invoice']
      });

      // Gather behavioral data
      const customer = subscription.customer as Stripe.Customer;
      const invoices = await stripe.invoices.list({
        customer: customer.id,
        limit: 12
      });

      const paymentMethods = await stripe.paymentMethods.list({
        customer: customer.id,
        limit: 10
      });

      // Calculate churn risk factors
      const riskFactors = [];
      let riskScore = 0;

      // Payment failures
      const failedPayments = invoices.data.filter(inv => inv.status === 'open' || inv.status === 'uncollectible').length;
      if (failedPayments > 0) {
        riskFactors.push({
          factor: 'payment_failures',
          weight: 25,
          description: `${failedPayments} failed payment(s) in last 12 months`,
          category: 'billing' as const
        });
        riskScore += 25;
      }

      // Subscription age (newer subscriptions have higher churn risk)
      const subscriptionAge = Date.now() - new Date(subscription.created * 1000).getTime();
      const ageInDays = subscriptionAge / (1000 * 60 * 60 * 24);
      if (ageInDays < 30) {
        riskFactors.push({
          factor: 'new_subscription',
          weight: 20,
          description: 'Subscription less than 30 days old',
          category: 'engagement' as const
        });
        riskScore += 20;
      }

      // Billing cycle (monthly subscriptions typically have higher churn)
      if (subscription.metadata.billing_cycle === 'monthly') {
        riskFactors.push({
          factor: 'monthly_billing',
          weight: 10,
          description: 'Monthly billing cycle has higher churn risk',
          category: 'billing' as const
        });
        riskScore += 10;
      }

      // Trial conversion (if applicable)
      if (subscription.trial_end && subscription.trial_end > Date.now() / 1000) {
        riskFactors.push({
          factor: 'trial_period',
          weight: 15,
          description: 'Currently in trial period',
          category: 'engagement' as const
        });
        riskScore += 15;
      }

      // Payment method reliability
      if (paymentMethods.data.length === 0) {
        riskFactors.push({
          factor: 'no_payment_method',
          weight: 30,
          description: 'No payment method on file',
          category: 'billing' as const
        });
        riskScore += 30;
      }

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' | 'critical';
      if (riskScore < 20) riskLevel = 'low';
      else if (riskScore < 40) riskLevel = 'medium';
      else if (riskScore < 60) riskLevel = 'high';
      else riskLevel = 'critical';

      // Predict churn date based on risk factors
      const baseChurnDays = subscription.metadata.billing_cycle === 'yearly' ? 365 : 30;
      const churnMultiplier = Math.max(0.1, 1 - (riskScore / 100));
      const predictedChurnDate = new Date(Date.now() + (baseChurnDays * churnMultiplier * 24 * 60 * 60 * 1000));

      // Generate prevention actions
      const preventionActions = this.generatePreventionActions(riskFactors, riskLevel);

      const churnPrediction: ChurnPrediction = {
        userId: subscription.metadata.user_id || '',
        subscriptionId: subscriptionId,
        riskScore,
        riskLevel,
        predictedChurnDate,
        confidenceScore: Math.min(95, 60 + (riskFactors.length * 5)), // Higher confidence with more data
        riskFactors,
        preventionActions
      };

      return churnPrediction;

    } catch (error) {
      console.error('Error predicting churn:', error);
      throw error;
    }
  }

  /**
   * Identify expansion opportunities based on usage patterns
   */
  async identifyExpansionOpportunities(subscriptionId: string): Promise<ExpansionOpportunity | null> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const currentTier = subscription.metadata.tier || '';
      
      // Get recent overage charges
      const invoiceItems = await stripe.invoiceItems.list({
        customer: subscription.customer as string,
        limit: 20
      });

      const overageItems = invoiceItems.data.filter(item => 
        item.description?.includes('Overage charge')
      );

      if (overageItems.length === 0) {
        return null; // No expansion opportunity if no overages
      }

      // Calculate expansion signals
      const expansionSignals = [];
      let expansionScore = 0;

      // Consistent overage usage
      if (overageItems.length > 3) {
        expansionSignals.push({
          signal: 'consistent_overages',
          strength: 80,
          description: `${overageItems.length} overage charges in recent periods`,
          detectedAt: new Date(),
          category: 'usage_limits' as const
        });
        expansionScore += 80;
      }

      // High overage amounts
      const totalOverageAmount = overageItems.reduce((sum, item) => sum + (item.amount || 0), 0);
      if (totalOverageAmount > 5000) { // $50+ in overages
        expansionSignals.push({
          signal: 'high_overage_costs',
          strength: 70,
          description: `$${totalOverageAmount / 100} in overage charges`,
          detectedAt: new Date(),
          category: 'usage_limits' as const
        });
        expansionScore += 70;
      }

      // Determine recommended tier
      const tierOrder = ['hobby', 'creator', 'studio', 'enterprise'];
      const currentTierIndex = tierOrder.indexOf(currentTier.toLowerCase());
      const recommendedTier = tierOrder[Math.min(currentTierIndex + 1, tierOrder.length - 1)];

      // Calculate potential MRR increase
      const currentTierPrice = PRICING_TIERS[currentTier.toUpperCase()]?.priceMonthly || 0;
      const recommendedTierPrice = PRICING_TIERS[recommendedTier.toUpperCase()]?.priceMonthly || 0;
      const potentialMRRIncrease = recommendedTierPrice - currentTierPrice;

      // Create expansion offer
      const expansionOffer = {
        offerType: 'tier_upgrade' as const,
        discount: 25, // 25% discount for first 3 months
        duration: 3,
        conditions: [
          'Upgrade to eliminate overage charges',
          '25% discount for first 3 months',
          'Unlock advanced features',
          'No long-term commitment'
        ],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        expectedConversionRate: 35 // 35% expected conversion rate
      };

      const expansionOpportunity: ExpansionOpportunity = {
        userId: subscription.metadata.user_id || '',
        subscriptionId: subscriptionId,
        currentTier: currentTier,
        recommendedTier: recommendedTier,
        expansionScore: Math.min(100, expansionScore),
        potentialMRRIncrease: potentialMRRIncrease,
        expansionSignals: expansionSignals,
        proposedOffer: expansionOffer
      };

      // Track expansion opportunity
      await this.trackSubscriptionEvent({
        subscriptionId: subscriptionId,
        type: 'expansion_opportunity_identified',
        data: expansionOpportunity
      });

      return expansionOpportunity;

    } catch (error) {
      console.error('Error identifying expansion opportunities:', error);
      return null;
    }
  }

  /**
   * Process Stripe webhooks for revenue optimization
   */
  async handleWebhook(payload: string, signature: string): Promise<any> {
    try {
      const event = stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);

      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        case 'customer.subscription.trial_will_end':
          await this.handleTrialWillEnd(event.data.object as Stripe.Subscription);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };

    } catch (error) {
      console.error('Webhook error:', error);
      throw error;
    }
  }

  // Private helper methods
  private async createOrUpdateCustomer(params: {
    email: string;
    userId: string;
    metadata: Record<string, string>;
  }): Promise<Stripe.Customer> {
    const customers = await stripe.customers.list({
      email: params.email,
      limit: 1
    });

    if (customers.data.length > 0) {
      return await stripe.customers.update(customers.data[0].id, {
        metadata: params.metadata
      });
    }

    return await stripe.customers.create({
      email: params.email,
      metadata: params.metadata
    });
  }

  private getPriceId(tierId: string, billingCycle: 'monthly' | 'yearly'): string {
    const tier = tierId.toUpperCase();
    const cycle = billingCycle.toUpperCase();
    
    // These would be configured in your Stripe dashboard
    const priceIds: Record<string, string> = {
      'HOBBY_MONTHLY': process.env.STRIPE_PRICE_HOBBY_MONTHLY || 'price_hobby_monthly',
      'HOBBY_YEARLY': process.env.STRIPE_PRICE_HOBBY_YEARLY || 'price_hobby_yearly',
      'CREATOR_MONTHLY': process.env.STRIPE_PRICE_CREATOR_MONTHLY || 'price_creator_monthly',
      'CREATOR_YEARLY': process.env.STRIPE_PRICE_CREATOR_YEARLY || 'price_creator_yearly',
      'STUDIO_MONTHLY': process.env.STRIPE_PRICE_STUDIO_MONTHLY || 'price_studio_monthly',
      'STUDIO_YEARLY': process.env.STRIPE_PRICE_STUDIO_YEARLY || 'price_studio_yearly',
      'ENTERPRISE_MONTHLY': process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise_monthly',
      'ENTERPRISE_YEARLY': process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || 'price_enterprise_yearly'
    };

    return priceIds[`${tier}_${cycle}`] || '';
  }

  private calculateLTVPrediction(tierId: string): number {
    const tier = PRICING_TIERS[tierId.toUpperCase()];
    if (!tier) return 0;

    // LTV = Average Monthly Revenue * Average Lifetime (months) * Gross Margin
    const monthlyRevenue = tier.priceMonthly;
    const averageLifetime = tier.targeting.churnRisk === 'low' ? 24 : 
                          tier.targeting.churnRisk === 'medium' ? 12 : 6;
    const grossMargin = 0.85; // 85% gross margin

    return monthlyRevenue * averageLifetime * grossMargin;
  }

  private calculateRevenueContribution(tierId: string, billingCycle: 'monthly' | 'yearly'): number {
    const tier = PRICING_TIERS[tierId.toUpperCase()];
    if (!tier) return 0;

    const monthlyRevenue = billingCycle === 'yearly' ? tier.priceYearly / 12 : tier.priceMonthly;
    const targetRevenue = REVENUE_TARGETS.MRR_18_MONTHS;
    
    return (monthlyRevenue / targetRevenue) * 100; // Percentage contribution to target
  }

  private calculateUpgradeRevenue(fromTier: string, toTier: string, billingCycle: 'monthly' | 'yearly'): number {
    const fromTierObj = PRICING_TIERS[fromTier.toUpperCase()];
    const toTierObj = PRICING_TIERS[toTier.toUpperCase()];
    
    if (!fromTierObj || !toTierObj) return 0;

    const fromPrice = billingCycle === 'yearly' ? fromTierObj.priceYearly / 12 : fromTierObj.priceMonthly;
    const toPrice = billingCycle === 'yearly' ? toTierObj.priceYearly / 12 : toTierObj.priceMonthly;

    return toPrice - fromPrice;
  }

  private async trackSubscriptionEvent(event: Omit<SubscriptionEvent, 'id' | 'occurredAt'>): Promise<void> {
    // This would integrate with your analytics/database system
    const subscriptionEvent: SubscriptionEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      occurredAt: new Date(),
      ...event
    };

    // Store in database or send to analytics service
    console.log('Subscription Event:', subscriptionEvent);
  }

  private async initializeChurnPrediction(subscriptionId: string, userId: string): Promise<void> {
    // Initialize churn prediction with baseline score
    const prediction = await this.predictChurn(subscriptionId);
    
    // Store prediction in database
    console.log('Initial Churn Prediction:', prediction);
  }

  private async updateChurnPrediction(subscriptionId: string, trigger: string): Promise<void> {
    // Update churn prediction based on events
    const prediction = await this.predictChurn(subscriptionId);
    
    // Store updated prediction
    console.log('Updated Churn Prediction:', prediction);
  }

  private async evaluateExpansionOpportunity(subscriptionId: string, charges: OverageCharges[]): Promise<void> {
    const opportunity = await this.identifyExpansionOpportunities(subscriptionId);
    
    if (opportunity && opportunity.expansionScore > 50) {
      // Trigger expansion campaign
      console.log('Expansion Opportunity Detected:', opportunity);
    }
  }

  private generatePreventionActions(riskFactors: any[], riskLevel: string): any[] {
    const actions = [];

    if (riskLevel === 'high' || riskLevel === 'critical') {
      actions.push({
        type: 'success_call',
        priority: 'high',
        description: 'Schedule success call to address concerns',
        expectedImpact: 30,
        cost: 50,
        automatable: false
      });
    }

    if (riskFactors.some(f => f.factor === 'payment_failures')) {
      actions.push({
        type: 'email_campaign',
        priority: 'high',
        description: 'Send payment failure recovery email sequence',
        expectedImpact: 25,
        cost: 5,
        automatable: true
      });
    }

    if (riskFactors.some(f => f.factor === 'new_subscription')) {
      actions.push({
        type: 'email_campaign',
        priority: 'medium',
        description: 'Send onboarding email sequence',
        expectedImpact: 20,
        cost: 3,
        automatable: true
      });
    }

    return actions;
  }

  // Webhook handlers
  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    await this.trackSubscriptionEvent({
      subscriptionId: subscription.id,
      type: 'subscription_created',
      data: subscription
    });
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    await this.trackSubscriptionEvent({
      subscriptionId: subscription.id,
      type: 'subscription_updated',
      data: subscription
    });
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    await this.trackSubscriptionEvent({
      subscriptionId: subscription.id,
      type: 'subscription_canceled',
      data: subscription
    });
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    if (invoice.subscription) {
      await this.trackSubscriptionEvent({
        subscriptionId: invoice.subscription as string,
        type: 'payment_succeeded',
        data: invoice
      });
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    if (invoice.subscription) {
      await this.trackSubscriptionEvent({
        subscriptionId: invoice.subscription as string,
        type: 'payment_failed',
        data: invoice
      });

      // Trigger churn risk update
      await this.updateChurnPrediction(invoice.subscription as string, 'payment_failure');
    }
  }

  private async handleTrialWillEnd(subscription: Stripe.Subscription): Promise<void> {
    await this.trackSubscriptionEvent({
      subscriptionId: subscription.id,
      type: 'trial_ended',
      data: subscription
    });

    // Trigger trial conversion campaign
    console.log('Trial ending soon:', subscription.id);
  }
}

export default StripeService;