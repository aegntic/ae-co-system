// DailyDoco Pro - Revenue Model & Tiered Pricing System
// Target: $15M MRR in 18 months through strategic pricing optimization

export interface PricingTier {
  id: string;
  name: string;
  displayName: string;
  priceMonthly: number;
  priceYearly: number;
  yearlyDiscount: number;
  features: PricingFeature[];
  limits: UsageLimits;
  targeting: CustomerSegment;
  psychologyTriggers: PsychologyTrigger[];
  conversionOptimizers: ConversionOptimizer[];
}

export interface PricingFeature {
  id: string;
  name: string;
  description: string;
  category: FeatureCategory;
  valueProposition: string;
  competitiveDifferentiator?: string;
  stickinessScore: number; // 1-10, how much this feature locks in users
}

export interface UsageLimits {
  videosPerMonth: number | 'unlimited';
  storageGB: number | 'unlimited';
  teamMembers: number | 'unlimited';
  apiCallsPerMonth: number | 'unlimited';
  exportFormats: string[];
  customBranding: boolean;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
}

export interface CustomerSegment {
  primary: string;
  secondary: string[];
  painPoints: string[];
  valueDrivers: string[];
  priceElasticity: 'low' | 'medium' | 'high';
  churnRisk: 'low' | 'medium' | 'high';
  expansionPotential: 'low' | 'medium' | 'high';
}

export interface PsychologyTrigger {
  type: 'anchor' | 'decoy' | 'loss_aversion' | 'social_proof' | 'urgency' | 'reciprocity' | 'authority';
  message: string;
  placement: 'hero' | 'comparison' | 'checkout' | 'onboarding';
  effectiveness: number; // Conversion lift percentage
}

export interface ConversionOptimizer {
  type: 'free_trial' | 'money_back_guarantee' | 'setup_assistance' | 'migration_support' | 'success_guarantee';
  duration?: number;
  conditions: string[];
  impactOnCAC: number; // Percentage reduction in CAC
  impactOnLTV: number; // Percentage increase in LTV
}

export type FeatureCategory = 
  | 'core_capture'
  | 'ai_intelligence'
  | 'editing_automation'
  | 'collaboration'
  | 'distribution'
  | 'analytics_insights'
  | 'enterprise_security'
  | 'custom_integration';

// Revenue Optimization Constants
export const REVENUE_TARGETS = {
  MRR_18_MONTHS: 15_000_000, // $15M MRR target
  CUSTOMER_SEGMENTS: {
    HOBBY: { targetUsers: 100_000, averageRevenue: 19 },
    CREATOR: { targetUsers: 20_000, averageRevenue: 79 },
    STUDIO: { targetUsers: 2_000, averageRevenue: 299 },
    ENTERPRISE: { targetUsers: 100, averageRevenue: 1_999 }
  },
  CHURN_TARGETS: {
    HOBBY: 0.15, // 15% monthly churn acceptable for low-price tier
    CREATOR: 0.08, // 8% monthly churn target
    STUDIO: 0.05, // 5% monthly churn target
    ENTERPRISE: 0.02 // 2% monthly churn target
  },
  CAC_TARGETS: {
    HOBBY: 25, // $25 CAC target
    CREATOR: 120, // $120 CAC target
    STUDIO: 450, // $450 CAC target
    ENTERPRISE: 3000 // $3000 CAC target
  }
} as const;

// Pricing Tiers Definition
export const PRICING_TIERS: Record<string, PricingTier> = {
  HOBBY: {
    id: 'hobby',
    name: 'Hobby',
    displayName: 'Hobby Developer',
    priceMonthly: 19,
    priceYearly: 152, // 20% yearly discount
    yearlyDiscount: 20,
    features: [
      {
        id: 'basic_capture',
        name: 'Basic Screen Capture',
        description: 'Record your coding sessions with 1080p quality',
        category: 'core_capture',
        valueProposition: 'Never forget how you solved that tricky bug',
        stickinessScore: 6
      },
      {
        id: 'ai_thumbnails',
        name: 'AI-Generated Thumbnails',
        description: 'Automatically create eye-catching thumbnails',
        category: 'ai_intelligence',
        valueProposition: 'Professional thumbnails without design skills',
        stickinessScore: 4
      },
      {
        id: 'youtube_upload',
        name: 'Direct YouTube Upload',
        description: 'One-click publishing to your YouTube channel',
        category: 'distribution',
        valueProposition: 'Skip the manual upload process',
        stickinessScore: 7
      }
    ],
    limits: {
      videosPerMonth: 10,
      storageGB: 5,
      teamMembers: 1,
      apiCallsPerMonth: 1000,
      exportFormats: ['mp4', 'webm'],
      customBranding: false,
      advancedAnalytics: false,
      prioritySupport: false
    },
    targeting: {
      primary: 'Individual developers learning to create content',
      secondary: ['Coding bootcamp students', 'Open source contributors'],
      painPoints: ['Too expensive to start', 'Overwhelmed by complexity', 'Just want to try it out'],
      valueDrivers: ['Low commitment', 'Easy to use', 'Professional results'],
      priceElasticity: 'high',
      churnRisk: 'high',
      expansionPotential: 'high'
    },
    psychologyTriggers: [
      {
        type: 'anchor',
        message: 'Most popular for beginners',
        placement: 'comparison',
        effectiveness: 12
      },
      {
        type: 'social_proof',
        message: '10,000+ developers started here',
        placement: 'hero',
        effectiveness: 8
      }
    ],
    conversionOptimizers: [
      {
        type: 'free_trial',
        duration: 14,
        conditions: ['No credit card required', 'Full feature access'],
        impactOnCAC: -30,
        impactOnLTV: 15
      }
    ]
  },

  CREATOR: {
    id: 'creator',
    name: 'Creator',
    displayName: 'Content Creator',
    priceMonthly: 79,
    priceYearly: 632, // 20% yearly discount
    yearlyDiscount: 20,
    features: [
      {
        id: 'advanced_capture',
        name: 'Advanced Multi-Monitor Capture',
        description: 'Capture multiple screens with intelligent switching',
        category: 'core_capture',
        valueProposition: 'Professional multi-screen workflows',
        competitiveDifferentiator: 'Loom and others only do single screen well',
        stickinessScore: 8
      },
      {
        id: 'ai_editing',
        name: 'AI-Powered Smart Editing',
        description: 'Automatically cut dead air, enhance audio, add transitions',
        category: 'editing_automation',
        valueProposition: 'Save 3+ hours per video on editing',
        competitiveDifferentiator: 'No other tool has this level of AI editing',
        stickinessScore: 9
      },
      {
        id: 'ab_testing',
        name: 'Thumbnail & Title A/B Testing',
        description: 'Test multiple variants to maximize click-through rates',
        category: 'analytics_insights',
        valueProposition: 'Increase video views by 40% on average',
        stickinessScore: 8
      },
      {
        id: 'multi_platform',
        name: 'Multi-Platform Distribution',
        description: 'Publish to YouTube, TikTok, Twitter, LinkedIn simultaneously',
        category: 'distribution',
        valueProposition: 'Reach 5x more audience with same effort',
        stickinessScore: 9
      },
      {
        id: 'analytics_dashboard',
        name: 'Advanced Analytics Dashboard',
        description: 'Track performance across all platforms with AI insights',
        category: 'analytics_insights',
        valueProposition: 'Make data-driven content decisions',
        stickinessScore: 7
      }
    ],
    limits: {
      videosPerMonth: 100,
      storageGB: 100,
      teamMembers: 1,
      apiCallsPerMonth: 10000,
      exportFormats: ['mp4', 'webm', 'mov', 'avi'],
      customBranding: false,
      advancedAnalytics: true,
      prioritySupport: false
    },
    targeting: {
      primary: 'Individual content creators monetizing their knowledge',
      secondary: ['Tech YouTubers', 'Course creators', 'Developer advocates'],
      painPoints: ['Time-consuming editing', 'Low view counts', 'Inconsistent quality'],
      valueDrivers: ['Time savings', 'Higher engagement', 'Professional quality'],
      priceElasticity: 'medium',
      churnRisk: 'medium',
      expansionPotential: 'high'
    },
    psychologyTriggers: [
      {
        type: 'decoy',
        message: 'Most popular choice - saves you 10+ hours per week',
        placement: 'comparison',
        effectiveness: 25
      },
      {
        type: 'loss_aversion',
        message: 'Manual editing is costing you $2,000+ per month in opportunity cost',
        placement: 'hero',
        effectiveness: 18
      },
      {
        type: 'social_proof',
        message: 'Top tech YouTubers generate 3x more views with DailyDoco',
        placement: 'comparison',
        effectiveness: 15
      }
    ],
    conversionOptimizers: [
      {
        type: 'money_back_guarantee',
        duration: 30,
        conditions: ['If you don\'t save 10+ hours per month', 'No questions asked'],
        impactOnCAC: -20,
        impactOnLTV: 25
      },
      {
        type: 'setup_assistance',
        conditions: ['1-hour onboarding call', 'Custom workflow setup'],
        impactOnCAC: -15,
        impactOnLTV: 30
      }
    ]
  },

  STUDIO: {
    id: 'studio',
    name: 'Studio',
    displayName: 'Content Studio',
    priceMonthly: 299,
    priceYearly: 2392, // 20% yearly discount
    yearlyDiscount: 20,
    features: [
      {
        id: 'unlimited_videos',
        name: 'Unlimited Video Creation',
        description: 'No limits on video creation and storage',
        category: 'core_capture',
        valueProposition: 'Scale content production without constraints',
        stickinessScore: 9
      },
      {
        id: 'team_collaboration',
        name: 'Advanced Team Collaboration',
        description: 'Multi-user workflows with approval processes',
        category: 'collaboration',
        valueProposition: 'Coordinate content teams efficiently',
        stickinessScore: 10
      },
      {
        id: 'custom_branding',
        name: 'Custom Branding & White-Label',
        description: 'Full customization of player, thumbnails, and UI',
        category: 'enterprise_security',
        valueProposition: 'Maintain consistent brand identity',
        stickinessScore: 9
      },
      {
        id: 'api_access',
        name: 'Full API Access',
        description: 'Integrate DailyDoco into your existing workflows',
        category: 'custom_integration',
        valueProposition: 'Build custom integrations and automations',
        stickinessScore: 10
      },
      {
        id: 'priority_support',
        name: 'Priority Support & Success Manager',
        description: 'Dedicated support team and success manager',
        category: 'enterprise_security',
        valueProposition: 'Ensure your team\'s success',
        stickinessScore: 8
      }
    ],
    limits: {
      videosPerMonth: 'unlimited',
      storageGB: 'unlimited',
      teamMembers: 10,
      apiCallsPerMonth: 100000,
      exportFormats: ['mp4', 'webm', 'mov', 'avi', 'mkv', 'custom'],
      customBranding: true,
      advancedAnalytics: true,
      prioritySupport: true
    },
    targeting: {
      primary: 'Content studios and agencies with multiple creators',
      secondary: ['Education companies', 'Developer relations teams', 'Training organizations'],
      painPoints: ['Managing multiple creators', 'Brand consistency', 'Workflow complexity'],
      valueDrivers: ['Team efficiency', 'Brand control', 'Scalability'],
      priceElasticity: 'low',
      churnRisk: 'low',
      expansionPotential: 'medium'
    },
    psychologyTriggers: [
      {
        type: 'authority',
        message: 'The professional choice for content studios',
        placement: 'comparison',
        effectiveness: 20
      },
      {
        type: 'social_proof',
        message: 'Studios using DailyDoco produce 5x more content with same team size',
        placement: 'hero',
        effectiveness: 22
      }
    ],
    conversionOptimizers: [
      {
        type: 'migration_support',
        conditions: ['Free migration from existing tools', 'Data import assistance'],
        impactOnCAC: -25,
        impactOnLTV: 40
      },
      {
        type: 'success_guarantee',
        conditions: ['Guaranteed 3x content output increase', '90-day success program'],
        impactOnCAC: -30,
        impactOnLTV: 50
      }
    ]
  },

  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    displayName: 'Enterprise',
    priceMonthly: 1999,
    priceYearly: 19990, // 17% yearly discount (lower for enterprise)
    yearlyDiscount: 17,
    features: [
      {
        id: 'dedicated_infrastructure',
        name: 'Dedicated Infrastructure',
        description: 'Private cloud deployment with SLA guarantees',
        category: 'enterprise_security',
        valueProposition: 'Enterprise-grade reliability and performance',
        stickinessScore: 10
      },
      {
        id: 'custom_ai_training',
        name: 'Custom AI Model Training',
        description: 'Train AI models on your specific content and style',
        category: 'ai_intelligence',
        valueProposition: 'AI that understands your unique content style',
        stickinessScore: 10
      },
      {
        id: 'compliance_features',
        name: 'Advanced Compliance & Security',
        description: 'SOC2, HIPAA, GDPR compliance with audit trails',
        category: 'enterprise_security',
        valueProposition: 'Meet the strictest security requirements',
        stickinessScore: 10
      },
      {
        id: 'strategic_consulting',
        name: 'Strategic Content Consulting',
        description: 'Quarterly strategy sessions with content experts',
        category: 'enterprise_security',
        valueProposition: 'Expert guidance to maximize content ROI',
        stickinessScore: 8
      },
      {
        id: 'unlimited_everything',
        name: 'Unlimited Everything',
        description: 'No limits on any feature or usage',
        category: 'core_capture',
        valueProposition: 'Scale without constraints',
        stickinessScore: 9
      }
    ],
    limits: {
      videosPerMonth: 'unlimited',
      storageGB: 'unlimited',
      teamMembers: 'unlimited',
      apiCallsPerMonth: 'unlimited',
      exportFormats: ['all', 'custom'],
      customBranding: true,
      advancedAnalytics: true,
      prioritySupport: true
    },
    targeting: {
      primary: 'Large enterprises with significant content needs',
      secondary: ['Fortune 500 companies', 'Government agencies', 'Large universities'],
      painPoints: ['Security requirements', 'Scale challenges', 'Complex compliance needs'],
      valueDrivers: ['Security assurance', 'Unlimited scale', 'Strategic support'],
      priceElasticity: 'low',
      churnRisk: 'low',
      expansionPotential: 'low'
    },
    psychologyTriggers: [
      {
        type: 'authority',
        message: 'Trusted by Fortune 500 companies',
        placement: 'hero',
        effectiveness: 15
      },
      {
        type: 'reciprocity',
        message: 'Includes $50,000 value in consulting and setup',
        placement: 'comparison',
        effectiveness: 12
      }
    ],
    conversionOptimizers: [
      {
        type: 'setup_assistance',
        conditions: ['Dedicated implementation team', '90-day rollout plan'],
        impactOnCAC: -40,
        impactOnLTV: 80
      }
    ]
  }
} as const;

// Revenue Stream Definitions
export interface RevenueStream {
  id: string;
  name: string;
  type: 'recurring' | 'one_time' | 'revenue_share' | 'usage_based';
  projectedMonthlyRevenue: number;
  growthRate: number; // Monthly growth rate percentage
  marginPercent: number;
  dependsOnTier?: string[];
}

export const REVENUE_STREAMS: Record<string, RevenueStream> = {
  SAAS_SUBSCRIPTIONS: {
    id: 'saas_subscriptions',
    name: 'SaaS Subscriptions',
    type: 'recurring',
    projectedMonthlyRevenue: 12_000_000, // Primary revenue stream
    growthRate: 15, // 15% monthly growth target
    marginPercent: 85
  },
  YOUTUBE_ADSENSE_SHARE: {
    id: 'youtube_adsense_share',
    name: 'YouTube AdSense Revenue Sharing',
    type: 'revenue_share',
    projectedMonthlyRevenue: 1_500_000, // 10% share of user ad revenue
    growthRate: 25, // Higher growth as users create more content
    marginPercent: 95
  },
  ENTERPRISE_CONTRACTS: {
    id: 'enterprise_contracts',
    name: 'Enterprise Contracts & Consulting',
    type: 'one_time',
    projectedMonthlyRevenue: 800_000,
    growthRate: 8,
    marginPercent: 70,
    dependsOnTier: ['enterprise']
  },
  AFFILIATE_COMMISSIONS: {
    id: 'affiliate_commissions',
    name: 'Affiliate Network Commissions',
    type: 'revenue_share',
    projectedMonthlyRevenue: 400_000,
    growthRate: 20,
    marginPercent: 90
  },
  PREMIUM_COURSES: {
    id: 'premium_courses',
    name: 'Premium Course & Educational Content',
    type: 'one_time',
    projectedMonthlyRevenue: 300_000,
    growthRate: 12,
    marginPercent: 95
  },
  USAGE_OVERAGES: {
    id: 'usage_overages',
    name: 'Usage-Based Overage Charges',
    type: 'usage_based',
    projectedMonthlyRevenue: 200_000,
    growthRate: 30, // Grows as users hit limits
    marginPercent: 98
  }
} as const;

// Customer Acquisition & Retention Metrics
export interface CustomerMetrics {
  tier: string;
  monthlySignups: number;
  conversionRate: number; // Trial to paid
  churnRate: number; // Monthly churn
  averageLifetimeMonths: number;
  netRevenueRetention: number; // Account for upgrades/downgrades
  viralCoefficient: number; // How many new users each user brings
}

export const CUSTOMER_METRICS: Record<string, CustomerMetrics> = {
  HOBBY: {
    tier: 'hobby',
    monthlySignups: 8333, // To reach 100k users in 12 months
    conversionRate: 0.15, // 15% trial to paid conversion
    churnRate: 0.15, // 15% monthly churn
    averageLifetimeMonths: 6,
    netRevenueRetention: 1.1, // 10% growth from upgrades
    viralCoefficient: 0.3
  },
  CREATOR: {
    tier: 'creator',
    monthlySignups: 1667, // To reach 20k users in 12 months
    conversionRate: 0.25, // 25% trial to paid conversion
    churnRate: 0.08, // 8% monthly churn
    averageLifetimeMonths: 12,
    netRevenueRetention: 1.2, // 20% growth from upgrades
    viralCoefficient: 0.5
  },
  STUDIO: {
    tier: 'studio',
    monthlySignups: 167, // To reach 2k users in 12 months
    conversionRate: 0.40, // 40% trial to paid conversion
    churnRate: 0.05, // 5% monthly churn
    averageLifetimeMonths: 20,
    netRevenueRetention: 1.15, // 15% growth
    viralCoefficient: 0.2
  },
  ENTERPRISE: {
    tier: 'enterprise',
    monthlySignups: 8, // To reach 100 users in 12 months
    conversionRate: 0.60, // 60% demo to paid conversion
    churnRate: 0.02, // 2% monthly churn
    averageLifetimeMonths: 50,
    netRevenueRetention: 1.25, // 25% growth from expansion
    viralCoefficient: 0.1
  }
} as const;
