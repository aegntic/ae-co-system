
// AI Models - Multi-Model Ensemble Architecture
export const AI_MODELS = {
  FREE: ['deepseek-r1.1', 'gemma-3', 'llama-3.2'],
  PRO: ['claude-4', 'gpt-5', 'deepseek-r1.1-pro'],
  BUSINESS: ['team-optimized-ensemble', 'custom-fine-tuned'],
  ENTERPRISE: ['custom-trained-models', 'on-premise-deployment']
};

export const GENERATION_TIMES = {
  FREE: '2 minutes',
  PRO: '30 seconds', 
  BUSINESS: 'ultra-fast',
  ENTERPRISE: '9 seconds'
};

export const GEMINI_MODEL_NAME = "gemini-1.5-flash"; // Legacy fallback
export const GEMINI_API_TIMEOUT_MS = 30000;

// 4SITE.PRO - LIVING WEBSITES FOUNDATION
export const DEFAULT_PROJECT_TITLE = "Living Websites That Update Themselves";
export const DEFAULT_PROJECT_DESCRIPTION = "Automated content creation that turns your GitHub into a professional showcase. Your code deserves industry recognition.";

// 4SITE.PRO - REVOLUTIONARY HERO MESSAGING WITH NEURAL AESTHETICS
export const HERO_MESSAGING = {
  // Primary messaging with psychological triggers
  primary: "Living Websites That Update Themselves",
  primary_alt: "Create Your Living Website", // A/B test variant
  primary_ultra: "Your Code. Transformed. Instantly.", // Ultra-premium variant
  
  // Secondary messaging with anticipation building
  secondary: "Your GitHub transforms into a professional website in 30 seconds",
  secondary_emphasis: "with AI-powered automated content creation",
  secondary_premium: "Watch your repositories become stunning showcases",
  
  // Supporting content with professional focus
  subtext: "Experience the magic first. Focus on building - we handle professional visibility.",
  subtext_premium: "Join the elite developer community achieving network recognition.",
  
  // Call-to-action hierarchy
  cta_primary: "Transform Repository Now",
  cta_secondary: "Experience The Magic",
  cta_urgency: "Join 10,000+ developers showcasing online",
  cta_premium: "Unlock Professional Recognition",
  
  // Social proof and exclusivity
  instant_gratification: "No signup required • AI-powered • Professional grade",
  social_proof: "10,000+ developers achieve recognition with us",
  social_proof_premium: "Used by developers at Meta, Google, Apple, Microsoft",
  exclusivity: "Join the professional developer community",
  exclusivity_premium: "Elite developer recognition platform",
  urgency: "Limited time: Full access to living websites",
  urgency_premium: "Early access to revolutionary developer tools"
};

// PHASE 2: Revolutionary Apple-esque Typography System with Neural Aesthetics
export const TYPOGRAPHY_HIERARCHY = {
  // Primary display typography - maximum psychological impact
  display_ultra: "glass-text-display",
  hero_primary: "glass-text-hero",
  hero_secondary: "glass-text-headline", 
  hero_tertiary: "glass-text-subheadline",
  
  // Content hierarchy with Apple precision
  title_large: "glass-text-title",
  title_medium: "glass-text-subtitle", 
  body_large: "glass-text-body-large",
  body_regular: "glass-text-body",
  callout: "glass-text-callout",
  caption: "glass-text-caption",
  footnote: "glass-text-footnote",
  micro: "glass-text-micro",
  
  // Psychological emphasis classes
  hero_primary_emphasis: "glass-text-hero bg-gradient-to-r from-white via-yellow-200 to-white bg-clip-text text-transparent",
  hero_secondary_emphasis: "glass-text-headline text-yellow-300",
  anticipation_build: "glass-text-callout font-medium",
  social_proof: "glass-text-footnote text-yellow-300/90 font-medium",
  urgency_text: "glass-text-caption font-semibold text-orange-400",
  exclusivity_badge: "glass-text-micro font-bold text-purple-300",
  
  // Legacy Tailwind classes for backward compatibility
  legacy_hero_primary: "text-5xl md:text-6xl lg:text-7xl font-light tracking-tight",
  legacy_hero_secondary: "text-2xl md:text-3xl lg:text-4xl font-normal",
  legacy_anticipation_build: "text-lg md:text-xl font-medium",
  legacy_micro_copy: "text-sm font-normal opacity-80"
};

export const MADE_WITH_4SITE_TEXT = "Living website powered by 4site.pro";
export const SITE_PRO_URL = "https://4site.pro";

export const SOCIAL_SHARE_PLATFORMS = [
  { name: "Twitter", icon: "Twitter", urlPrefix: "https://twitter.com/intent/tweet?url=" },
  { name: "LinkedIn", icon: "Linkedin", urlPrefix: "https://www.linkedin.com/shareArticle?mini=true&url=" },
  { name: "Facebook", icon: "Facebook", urlPrefix: "https://www.facebook.com/sharer/sharer.php?u=" },
  { name: "Copy Link", icon: "Link", urlPrefix: "" } // Special case for copy
];

export const MAX_DESCRIPTION_LENGTH = 200; // For summaries

export const GITHUB_URL_REGEX = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9_.-]+)(?:\/)?$/i;

// aegntic.ai and Project 4site branding
export const AEGNTIC_AI_URL = "https://aegntic.ai";
export const AEGNTIC_FOUNDATION_URL = "https://aegntic.foundation";
export const AEGNTIC_EMAIL = "enquiries@aegntic.ai";
export const SITE_PRO_EMAIL = "hello@4site.pro";
// 4SITE.PRO - PRICING TIERS FOR PROFESSIONAL VISIBILITY
export const PRICING_TIERS = {
  FREE: {
    price: 0,
    websites: 5,
    generationTime: '2 minutes',
    features: ['Living websites that update themselves', 'Automated content creation', 'Professional showcase with attribution']
  },
  PRO: {
    price: 49.49,
    websites: 111,
    generationTime: '30 seconds',
    features: ['Network visibility boost', 'Industry recognition features', '+11 gift websites for portfolio', 'Remove attribution branding']
  },
  BUSINESS: {
    price: 494.94,
    websites: 'Team collaboration',
    generationTime: 'Ultra-fast',
    features: ['5-10 team members', 'Advanced integrations', 'White-label ready', 'Priority support']
  },
  ENTERPRISE: {
    price: 4949.49,
    websites: 'Unlimited',
    generationTime: '9 seconds',
    features: ['Custom AI training', 'On-premise deployment', 'SLA guarantees', 'Dedicated success manager']
  }
};

// 4SITE.PRO - REVOLUTIONARY VALUE ARCHITECTURE WITH NEURAL PSYCHOLOGY
export const VALUE_PROPOSITIONS = {
  // Core value propositions with enhanced impact
  INSTANT_MAGIC: 'Transform any GitHub repository into a stunning professional website in 30 seconds',
  LIVING_WEBSITES: 'Your websites evolve automatically - creating content and updating at every development milestone',
  FOCUS_TRIGGER: 'Experience the revolutionary platform first. Upgrade when you\'re ready for elite network visibility.',
  WOW_MOMENT: 'Watch your code achieve industry recognition and professional prestige',
  ZERO_FRICTION: 'No signup, no complexity, no learning curve - just revolutionary professional results',
  PHILOSOPHY: 'Think different. Build different. Showcase like the elite.',
  
  // Enhanced psychological triggers
  SCARCITY: 'Exclusive early access - join the elite developer recognition platform',
  SCARCITY_PREMIUM: 'Limited seats available for professional developer community',
  AUTHORITY: 'Trusted by senior engineers at Meta, Google, Apple, Microsoft, Netflix',
  AUTHORITY_PREMIUM: 'The choice of industry leaders and technical visionaries',
  RECIPROCITY: 'Experience the complete revolutionary platform completely free',
  RECIPROCITY_PREMIUM: 'Full access to elite features - no hidden limitations',
  COMMITMENT: 'Transform your entire professional developer presence forever',
  COMMITMENT_PREMIUM: 'Join the revolution in professional developer recognition',
  LIKING: 'Join elite developers who demand professional recognition',
  LIKING_PREMIUM: 'Be part of the most exclusive developer showcase community',
  
  // Neural aesthetic messaging
  NEURAL_APPEAL: 'AI-powered. Neural-enhanced. Professionally revolutionary.',
  NEURAL_MAGIC: 'Watch neural networks transform your code into art',
  NEURAL_COMMUNITY: 'Join the neural-enhanced developer elite'
};

// 4SITE.PRO - SUCCESS TRIGGERS FOR PROFESSIONAL ADVANCEMENT
export const SUCCESS_TRIGGERS = {
  deployment_success: 'Incredible. Your living website is live. Ready for professional visibility?',
  network_tease: 'Join 10,000+ developers achieving network visibility and industry recognition',
  automation_hook: 'Imagine this level of automation and professional polish for every project...',
  upgrade_moment: 'Transform your entire professional presence',
  social_proof_line: '"This is exactly what I\'ve been looking for" - Senior Developer at Meta',
  timing_trigger: 'Perfect timing. You\'ve experienced the platform.',
  exclusivity_reveal: 'You\'re now part of a professional community of elite developers'
};

export const SITE_PRO_BRANDING = {
  name: "4site.pro",
  tagline: "Living Websites That Update Themselves",
  tagline_premium: "Neural-Enhanced Developer Recognition Platform",
  subtitle: "Powered by aegntic neural ecosystems",
  subtitle_premium: "Revolutionary AI-powered developer showcase technology",
  
  // Hero messaging with enhanced impact
  hero_tagline: "Living Websites That Update Themselves",
  hero_tagline_alt: "Create Your Living Website", // A/B test variant
  hero_tagline_premium: "Your Code. Transformed. Recognized.", // Premium variant
  hero_tagline_neural: "Neural-Enhanced Professional Recognition", // Neural variant
  
  // Promise and magic moment messaging
  instant_promise: "Your GitHub transforms in 30 seconds",
  instant_promise_premium: "Watch your repositories become professional showcases instantly",
  magic_moment: "Watch your code achieve professional recognition",
  magic_moment_premium: "Experience the moment your work gains industry recognition",
  magic_moment_neural: "Neural networks transform your code into professional art",
  
  // Brand credentials and philosophy
  copyright: `© ${new Date().getFullYear()} 4site.pro. All rights reserved.`,
  credits: "Designed in California. Powered by aegntic neural ecosystems.",
  credits_premium: "Engineered for elite developers. Powered by revolutionary AI.",
  philosophy: "Think different. Build different. Showcase professionally.",
  philosophy_premium: "Revolutionize. Recognize. Dominate.",
  philosophy_neural: "Where neural networks meet professional excellence."
};

// Progressive disclosure framework constants
export const DISCLOSURE_STATES = {
  INITIAL: 'initial',
  POST_GENERATION: 'post_generation', 
  POST_DEPLOYMENT: 'post_deployment',
  CONVERSION_READY: 'conversion_ready'
};

// PHASE 1: Enhanced A/B testing framework with psychological triggers
export const AB_TEST_VARIANTS = {
  MESSAGING: ['living_websites', 'instant_magic', 'developer_focused', 'portfolio_builder'],
  CTA_STYLE: ['glass_primary', 'gradient_pulse', 'minimal_clean', 'apple_inspired'],
  SUCCESS_FLOW: ['immediate_upsell', 'delayed_reveal', 'milestone_based', 'psychological_timing'],
  SOCIAL_PROOF: ['count_based', 'authority_based', 'peer_based', 'testimonial_based'],
  URGENCY_TYPE: ['scarcity', 'time_limited', 'exclusive_access', 'early_adopter']
};

// Psychological trigger timing constants
export const PSYCHOLOGICAL_TIMING = {
  WOW_MOMENT_ABSORPTION: 3000, // 3 seconds to absorb success
  SOCIAL_PROOF_REVEAL: 5000,   // 5 seconds before showing social proof
  URGENCY_INTRODUCTION: 8000,  // 8 seconds before urgency
  PRICING_OPTIMAL_MOMENT: 12000, // 12 seconds for pricing revelation
  MICRO_ANIMATION_DELAY: 150   // Staggered micro-animations
};

// Social proof data for psychological triggers
export const SOCIAL_PROOF_DATA = {
  user_count: '10,000+',
  company_logos: ['Meta', 'Google', 'Apple', 'Microsoft', 'Netflix'],
  testimonials: [
    { text: 'This is exactly what I\'ve been looking for', role: 'Senior Developer at Meta', rating: 5 },
    { text: 'Transformed how I present my work', role: 'Principal Engineer at Google', rating: 5 },
    { text: 'Pure magic. Simple as that.', role: 'Tech Lead at Apple', rating: 5 }
  ],
  success_metrics: {
    time_saved: '40 hours per project',
    conversion_increase: '340%',
    user_satisfaction: '98%'
  }
};

