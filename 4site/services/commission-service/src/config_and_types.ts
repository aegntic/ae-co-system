
// services/commission-service/src/config_and_types.ts

export interface PartnerConfig {
  id: string; // e.g., 'supabase', 'railway', 'figma'
  name: string; // Human-readable name
  apiUrl?: string; // Base API URL for the partner (if project4site needs to call them)
  apiKeyEnvVar?: string; // Environment variable name for project4site's API key to talk to partner
  referralParameter: string; // e.g., 'ref', 'via', 'utm_source=project4site&utm_campaign=partner&ref='
  landingPage: string; // Base landing page for referrals (we will append referral codes/params)
  // Defines how a successful conversion is tracked for this partner
  successEventDefinition: {
    type: 'API_POLL' | 'WEBHOOK' | 'MANUAL_RECONCILIATION';
    // For API_POLL:
    pollEndpoint?: string; // Relative to partner's apiUrl
    successCriteriaField?: string; // e.g., 'status'
    successCriteriaValue?: string | number | boolean; // e.g., 'active_subscription'
    // For WEBHOOK:
    webhookVerificationMethod?: 'HMAC_SHA256' | 'API_KEY_IN_HEADER' | 'NONE'; // How to verify webhook authenticity
    webhookSecretEnvVar?: string; // Env var for HMAC secret or API key
    payloadPathToStatus?: string; // JSON path to status field in webhook payload (e.g., 'data.subscription.status')
    payloadSuccessValue?: string | number | boolean; // Value indicating success
    payloadUserIdPath?: string; // JSON path to identify the user/account in partner system
  };
  commissionRate: number; // e.g., 0.10 for 10%
  valueMultiplierFormula?: string; // Optional: a string formula or reference to calculate valueMultiplier (e.g., based on subscription tier)
  notes?: string; // Any specific integration notes
}

// It's crucial to load API keys from environment variables and not hardcode them.
// The PARTNER_CONFIGS object references env var names. The service will load them at runtime.
export const PARTNER_CONFIGS: Record<string, PartnerConfig> = {
  supabase: {
    id: 'supabase',
    name: 'Supabase',
    apiUrl: 'https://api.supabase.com', // Example, adjust if needed for partner ops
    apiKeyEnvVar: 'SUPABASE_PARTNER_API_KEY', // project4site's key to interact with Supabase partner APIs
    referralParameter: 'ref=project4site', // Check Supabase's actual referral program details
    landingPage: 'https://supabase.com',
    successEventDefinition: {
        type: 'API_POLL', // This is an assumption, Supabase might have webhooks
        pollEndpoint: '/v1/projects', // Hypothetical endpoint
        successCriteriaField: 'status', // Hypothetical field
        successCriteriaValue: 'ACTIVE_FREE_PROJECT_LIMIT_EXCEEDED_OR_PAID', // Hypothetical
        // Or use webhooks if available
    },
    commissionRate: 0.15, // Example rate
    notes: "Verify Supabase's official partner program for referral link structure and tracking."
  },
  railway: {
    id: 'railway',
    name: 'Railway.app',
    apiUrl: 'https://backboard.railway.app/graphql/v2', // Example, adjust if needed
    apiKeyEnvVar: 'RAILWAY_PARTNER_API_KEY',
    referralParameter: 'via=project4site', // Check Railway's actual referral program details
    landingPage: 'https://railway.app',
    successEventDefinition: {
        type: 'WEBHOOK', // Assuming Railway can send webhooks for events like 'production deployment'
        webhookVerificationMethod: 'HMAC_SHA256',
        webhookSecretEnvVar: 'RAILWAY_WEBHOOK_SECRET',
        payloadPathToStatus: 'event.type', // e.g. if Railway sends 'deployment.succeeded'
        payloadSuccessValue: 'deployment.succeeded',
        payloadUserIdPath: 'user.id', // Path to railway user/project id
    },
    commissionRate: 0.20, // Example rate
    valueMultiplierFormula: "if (event.details.plan === 'pro') return 1.5 else return 1.0", // Example
    notes: "Verify Railway's official partner program for referral link structure and webhook capabilities for success events."
  },
  figma: {
    id: 'figma',
    name: 'Figma',
    apiUrl: 'https://api.figma.com/v1/', // Standard Figma API
    apiKeyEnvVar: 'FIGMA_PARTNER_API_KEY',
    referralParameter: 'r=project4site', // Check Figma's actual referral program details
    landingPage: 'https://figma.com',
    successEventDefinition: {
        type: 'API_POLL', // Assumption, check if Figma offers partner conversion tracking APIs/webhooks
        // Figma's success event might be a paid team upgrade, for example.
        // Details would depend on their partner program API.
    },
    commissionRate: 0.10, // Example rate
    notes: "Verify Figma's official partner program for referral link structure and conversion tracking mechanisms."
  }
  // Add Vercel, Sentry, Stripe from current MVP if they have referral programs
};

export interface AttributionData {
  id: string; // UUID
  userId?: string; // project4site user ID (optional if click is anonymous)
  generatedSiteId?: string; // If referral originated from a specific generated site
  projectId?: string; // Project that led to the click
  partnerId: string; // 'supabase', 'railway', etc.
  referralCodeUsed: string; // The part of the URL like 'project4site'
  fullReferralUrl: string;
  ipAddress?: string;
  userAgent?: string;
  clickTimestamp: Date;
  conversionTimestamp?: Date;
  conversionValue?: number; // Monetary value of the initial conversion
  commissionEarned?: number;
  status: 'clicked' | 'converted' | 'pending_verification' | 'commission_paid' | 'expired';
  attributionWindowEnds: Date; // When this click is no longer eligible for commission
  metadata?: Record<string, any>; // Extra data from query params or partner
}

export interface SuccessEvent {
  id: string; // UUID
  userId?: string; // project4site user ID
  partnerReferralId?: string; // Link to the initial referral if applicable
  partnerId: string;
  partnerUserIdentifier: string; // The User ID or Account ID on the Partner's platform
  eventType: string; // e.g., 'production_deployment', 'paid_subscription_started', 'monthly_active_user_threshold_met'
  eventTimestamp: Date;
  valueAssociated?: number; // Monetary value if directly applicable to this event
  valueMultiplierApplied?: number; // From PartnerConfig.valueMultiplierFormula
  commissionCalculated?: number; // Commission for this specific success event
  metadata?: Record<string, any>; // Full payload from webhook or API poll result
  isBillable: boolean; // Does this specific event trigger a commission payout
}

// This would be in your Drizzle schema, but for reference:
// Table: partner_referrals (stores AttributionData like records)
// Table: partner_success_events (stores SuccessEvent like records)
// Table: commission_payouts (tracks payouts made to project4site from partners)
