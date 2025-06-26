import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../ui/Icon';

interface TierPricingSectionProps {
  onSelectTier?: (tier: string) => void;
}

export const TierPricingSection: React.FC<TierPricingSectionProps> = ({ onSelectTier }) => {
  const tiers = [
    {
      id: 'free',
      name: 'FREE',
      price: '$0',
      period: 'forever',
      popular: false,
      description: 'Get online instantly while learning to build digitally',
      features: [
        '5 auto-updating websites',
        'Automated blog posts at development checkpoints',
        '8 professional templates',
        'No ads - elegant PRO member featuring only',
        '2-minute generation with standard AI processing',
        'Custom domains: $4.94 tip OR free via Porkbun affiliate'
      ],
      cta: 'Start Building',
      ctaStyle: 'glass-button-secondary'
    },
    {
      id: 'pro',
      name: 'PRO',
      price: '$49.49',
      period: '/month',
      popular: true,
      description: 'Network visibility among curated industry leaders',
      features: [
        '111 auto-updating websites (vs 5 free)',
        '+11 "3-month trial gift websites" via GitHub pull request donations',
        'Advanced automated content creation and blog generation',
        'Network visibility among curated industry leaders',
        'Custom branding and easy edits',
        '50 professional templates',
        'Professional recognition - featured in network galleries',
        'Remove platform attribution completely',
        'Sub 1-minute generation with premium AI ensemble'
      ],
      cta: 'Join Network',
      ctaStyle: 'glass-button-primary'
    },
    {
      id: 'business',
      name: 'BUSINESS',
      price: '$494.94',
      period: '/month',
      popular: false,
      description: 'Team collaboration + advanced automation',
      features: [
        'Advanced team automation (development milestones → content)',
        'Team collaboration (5-10 users)',
        'Advanced integrations (Slack, Jira, Linear webhooks)',
        'Custom brand identity throughout all team sites',
        'Priority support (1-hour response)',
        'Advanced analytics (team content performance)',
        'API access (full REST/GraphQL)',
        'White-label for clients (reseller ready)',
        'Ultra-fast content generation (2x faster than PRO tier)'
      ],
      cta: 'Scale Team',
      ctaStyle: 'glass-button-business'
    },
    {
      id: 'enterprise',
      name: 'ENTERPRISE',
      price: '$4,949.49',
      period: '/month',
      popular: false,
      description: 'Fortune 500 enterprise-grade automation',
      features: [
        'Custom AI content training on your company\'s voice/style',
        'On-premise deployment with private content generation',
        'Unlimited users and automated websites',
        'Custom automation triggers (any development event → content)',
        'SLA guarantees (99.99% uptime)',
        'Dedicated account manager and content strategy team',
        '9-second generation (fastest in industry)',
        'Enterprise security (SOC2, HIPAA, custom compliance)'
      ],
      cta: 'Contact Sales',
      ctaStyle: 'glass-button-enterprise'
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-light text-white mb-4">
            Choose Your <span className="font-medium bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">Growth Path</span>
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            From learning builders to Fortune 500 enterprises. Every tier focuses on professional recognition and network visibility, not financial promises.
          </p>
        </motion.div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`glass-card relative ${tier.popular ? 'ring-2 ring-yellow-400/50' : ''}`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="glass-badge">
                    <span className="text-xs font-semibold text-white">MOST POPULAR</span>
                  </div>
                </div>
              )}

              <div className="glass-card-content p-8">
                {/* Tier Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-semibold text-white mb-2">{tier.name}</h3>
                  <div className="flex items-baseline justify-center mb-4">
                    <span className="text-4xl font-light text-white">{tier.price}</span>
                    <span className="text-lg text-white/60 ml-1">{tier.period}</span>
                  </div>
                  <p className="text-sm text-white/70">{tier.description}</p>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {tier.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start gap-3">
                      <Icon name="check" size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-white/80 leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => onSelectTier?.(tier.id)}
                  className={`w-full ${tier.ctaStyle} py-3 px-6 rounded-xl font-medium transition-all duration-200`}
                >
                  {tier.cta}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Info */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="glass-card max-w-4xl mx-auto">
            <div className="glass-card-content p-8">
              <h3 className="text-2xl font-medium text-white mb-4">The Real Value: Automated Content Creation</h3>
              <p className="text-white/80 leading-relaxed mb-6">
                The innovation isn't generation speed - it's continuous automated content creation. Your websites update themselves 
                and create blog posts at development checkpoints. Focus on building instead of creating "marketing noise."
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div className="text-center">
                  <div className="text-yellow-400 font-semibold mb-1">Network Visibility</div>
                  <div className="text-white/70">Professional recognition among industry leaders</div>
                </div>
                <div className="text-center">
                  <div className="text-yellow-400 font-semibold mb-1">Living Websites</div>
                  <div className="text-white/70">Automatic updates at development milestones</div>
                </div>
                <div className="text-center">
                  <div className="text-yellow-400 font-semibold mb-1">Focus on Building</div>
                  <div className="text-white/70">We handle content creation automatically</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};