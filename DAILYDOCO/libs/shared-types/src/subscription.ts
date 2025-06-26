// DailyDoco Pro - Subscription Management & Billing System
// Integration with Stripe for payment processing and subscription lifecycle

export interface Subscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  tier: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Billing
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  
  // Usage tracking
  usage: UsageMetrics;
  limits: UsageLimits;
  overages: OverageCharges[];
  
  // Revenue optimization
  acquisitionChannel: string;
  conversionSource: string;
  trialStartedAt?: Date;
  trialEndedAt?: Date;
  churnPredictionScore?: number;
  expansionScore?: number;
}

export type SubscriptionStatus = 
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired';

export interface UsageMetrics {
  period: string; // YYYY-MM format
  videosCreated: number;
  storageUsedGB: number;
  apiCallsMade: number;
  teamMembersActive: number;
  exportsMade: number;
  
  // Advanced metrics for optimization
  activeMinutes: number;
  featuresUsed: string[];
  integrationsCalled: string[];
  lastActivityAt: Date;
}

export interface UsageLimits {
  videosPerMonth: number | 'unlimited';
  storageGB: number | 'unlimited';
  teamMembers: number | 'unlimited';
  apiCallsPerMonth: number | 'unlimited';
  exportFormats: string[];
}

export interface OverageCharges {
  id: string;
  subscriptionId: string;
  period: string;
  type: 'videos' | 'storage' | 'api_calls';
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  stripeInvoiceId?: string;
  chargedAt?: Date;
}

// Stripe Webhook Events
export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: any;
  processedAt?: Date;
  retryCount: number;
  lastError?: string;
}

// Revenue Analytics
export interface RevenueAnalytics {
  period: string;
  totalRevenue: number;
  recurringRevenue: number;
  oneTimeRevenue: number;
  revenueByTier: Record<string, number>;
  revenueByChannel: Record<string, number>;
  
  // Customer metrics
  newCustomers: number;
  churnedCustomers: number;
  expandedCustomers: number;
  contractedCustomers: number;
  
  // Financial metrics
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  averageRevenuePerUser: number;
  customerLifetimeValue: number;
  customerAcquisitionCost: number;
  
  // Cohort analysis
  cohortRetention: CohortRetention[];
  cohortRevenue: CohortRevenue[];
}

export interface CohortRetention {
  cohort: string; // YYYY-MM
  month0: number;
  month1: number;
  month3: number;
  month6: number;
  month12: number;
  month24: number;
}

export interface CohortRevenue {
  cohort: string;
  month0: number;
  month1: number;
  month3: number;
  month6: number;
  month12: number;
  month24: number;
  totalRevenue: number;
}

// Churn Prediction
export interface ChurnPrediction {
  userId: string;
  subscriptionId: string;
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  predictedChurnDate: Date;
  confidenceScore: number;
  riskFactors: ChurnRiskFactor[];
  preventionActions: PreventionAction[];
}

export interface ChurnRiskFactor {
  factor: string;
  weight: number;
  description: string;
  category: 'usage' | 'engagement' | 'support' | 'billing' | 'feature';
}

export interface PreventionAction {
  type: 'email_campaign' | 'feature_unlock' | 'discount_offer' | 'success_call' | 'upgrade_incentive';
  priority: 'low' | 'medium' | 'high';
  description: string;
  expectedImpact: number; // Percentage points reduction in churn risk
  cost: number;
  automatable: boolean;
}

// Expansion Opportunity
export interface ExpansionOpportunity {
  userId: string;
  subscriptionId: string;
  currentTier: string;
  recommendedTier: string;
  expansionScore: number; // 0-100
  potentialMRRIncrease: number;
  expansionSignals: ExpansionSignal[];
  proposedOffer: ExpansionOffer;
}

export interface ExpansionSignal {
  signal: string;
  strength: number; // 0-100
  description: string;
  detectedAt: Date;
  category: 'usage_limits' | 'feature_requests' | 'team_growth' | 'success_metrics';
}

export interface ExpansionOffer {
  offerType: 'tier_upgrade' | 'feature_unlock' | 'usage_increase' | 'team_expansion';
  discount?: number;
  duration?: number; // months
  conditions: string[];
  expiresAt: Date;
  expectedConversionRate: number;
}

// Billing Configuration
export const BILLING_CONFIG = {
  OVERAGE_RATES: {
    videos: 2.00, // $2 per video over limit
    storage: 0.50, // $0.50 per GB over limit
    api_calls: 0.001, // $0.001 per API call over limit
    team_members: 15.00 // $15 per additional team member
  },
  
  TRIAL_PERIODS: {
    hobby: 14, // 14 days
    creator: 14, // 14 days
    studio: 14, // 14 days
    enterprise: 30 // 30 days
  },
  
  GRACE_PERIODS: {
    past_due: 7, // 7 days grace period for failed payments
    cancellation: 30, // 30 days to reactivate canceled subscription
    downgrade: 1 // 1 day to reverse downgrades
  },
  
  DUNNING_SCHEDULE: [
    { days: 1, action: 'email_reminder' },
    { days: 3, action: 'email_urgent' },
    { days: 5, action: 'email_final_notice' },
    { days: 7, action: 'suspend_service' },
    { days: 14, action: 'cancel_subscription' }
  ]
} as const;

// Stripe Product IDs (to be configured in Stripe Dashboard)
export const STRIPE_PRODUCTS = {
  HOBBY_MONTHLY: 'price_hobby_monthly',
  HOBBY_YEARLY: 'price_hobby_yearly',
  CREATOR_MONTHLY: 'price_creator_monthly',
  CREATOR_YEARLY: 'price_creator_yearly',
  STUDIO_MONTHLY: 'price_studio_monthly',
  STUDIO_YEARLY: 'price_studio_yearly',
  ENTERPRISE_MONTHLY: 'price_enterprise_monthly',
  ENTERPRISE_YEARLY: 'price_enterprise_yearly'
} as const;

// Subscription Lifecycle Events
export interface SubscriptionEvent {
  id: string;
  subscriptionId: string;
  type: SubscriptionEventType;
  data: any;
  occurredAt: Date;
  processedAt?: Date;
  automationTriggered?: boolean;
}

export type SubscriptionEventType =
  | 'subscription_created'
  | 'subscription_activated'
  | 'subscription_canceled'
  | 'subscription_upgraded'
  | 'subscription_downgraded'
  | 'payment_succeeded'
  | 'payment_failed'
  | 'invoice_created'
  | 'invoice_paid'
  | 'invoice_payment_failed'
  | 'trial_started'
  | 'trial_ended'
  | 'usage_limit_reached'
  | 'overage_charged'
  | 'churn_risk_detected'
  | 'expansion_opportunity_identified';

// Revenue Optimization Strategies
export interface RevenueStrategy {
  id: string;
  name: string;
  type: 'pricing' | 'feature' | 'marketing' | 'retention' | 'expansion';
  description: string;
  targetSegment: string[];
  expectedImpact: {
    mrrIncrease: number;
    churnReduction: number;
    conversionImprovement: number;
    ltv_increase: number;
  };
  implementationCost: number;
  timeline: number; // weeks
  riskLevel: 'low' | 'medium' | 'high';
  prerequisites: string[];
  kpis: string[];
}

export const REVENUE_STRATEGIES: RevenueStrategy[] = [
  {
    id: 'decoy_pricing',
    name: 'Decoy Pricing Optimization',
    type: 'pricing',
    description: 'Position Creator tier as the optimal choice through strategic pricing anchoring',
    targetSegment: ['hobby', 'creator'],
    expectedImpact: {
      mrrIncrease: 25,
      churnReduction: 0,
      conversionImprovement: 40,
      ltv_increase: 15
    },
    implementationCost: 5000,
    timeline: 2,
    riskLevel: 'low',
    prerequisites: ['A/B testing infrastructure'],
    kpis: ['conversion_rate', 'tier_distribution', 'revenue_per_visitor']
  },
  {
    id: 'usage_based_expansion',
    name: 'Usage-Based Expansion Revenue',
    type: 'expansion',
    description: 'Implement smart overage charges that encourage tier upgrades',
    targetSegment: ['hobby', 'creator'],
    expectedImpact: {
      mrrIncrease: 30,
      churnReduction: 5,
      conversionImprovement: 0,
      ltv_increase: 45
    },
    implementationCost: 15000,
    timeline: 6,
    riskLevel: 'medium',
    prerequisites: ['Usage tracking', 'Billing automation'],
    kpis: ['expansion_mrr', 'overage_revenue', 'upgrade_rate']
  },
  {
    id: 'viral_referral_program',
    name: 'Viral Referral Program',
    type: 'marketing',
    description: 'Incentivize users to refer others through content collaboration features',
    targetSegment: ['creator', 'studio'],
    expectedImpact: {
      mrrIncrease: 50,
      churnReduction: 10,
      conversionImprovement: 25,
      ltv_increase: 20
    },
    implementationCost: 25000,
    timeline: 8,
    riskLevel: 'medium',
    prerequisites: ['Social features', 'Attribution tracking'],
    kpis: ['viral_coefficient', 'referral_signups', 'cac_reduction']
  }
];