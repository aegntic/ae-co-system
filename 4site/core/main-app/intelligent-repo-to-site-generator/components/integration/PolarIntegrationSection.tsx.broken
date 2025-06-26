import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../ui/Icon';

interface PolarIntegrationSectionProps {
  onUpgrade?: (tier: string) => void;
}

export const PolarIntegrationSection: React.FC<PolarIntegrationSectionProps> = ({ onUpgrade }) => {
  const benefits = [
    {
      tier: 'FREE',
      price: '$0',
      sites: '5 websites',
      speed: '2 minutes',
      highlight: 'Perfect for learning builders',
      features: ['Auto-updating websites', 'Automated blog posts', 'No ads - elegant featuring']
    },
    {
      tier: 'PRO',
      price: '$49.49/month',
      sites: '111 websites',
      speed: '30 seconds',
      highlight: 'Network visibility among industry leaders',
      features: ['Professional recognition', 'Network galleries', 'Remove attribution', '+11 gift websites'],
      popular: true
    },
    {
      tier: 'BUSINESS',
      price: '$494.94/month',
      sites: 'Team collaboration',
      speed: 'Ultra-fast',
      highlight: 'Advanced team automation',
      features: ['5-10 users', 'Advanced integrations', 'White-label ready', 'Priority support']
    },
    {
      tier: 'ENTERPRISE',
      price: '$4,949.49/month',
      sites: 'Unlimited users',
      speed: '9 seconds',
      highlight: 'Fortune 500 custom AI training',
      features: ['On-premise deployment', 'Custom AI training', 'SLA guarantees', 'Dedicated manager']
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
          <div className=\"flex items-center justify-center gap-4 mb-6\">
            <img src=\"/4sitepro-logo.png\" alt=\"4site.pro\" className=\"w-12 h-12 rounded-lg\" />
            <span className=\"text-2xl text-white/60\">×</span>\n            <div className=\"flex items-center gap-2\">\n              <div className=\"w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center\">\n                <span className=\"text-white font-bold text-lg\">P</span>\n              </div>\n              <span className=\"text-xl font-semibold text-white\">Polar.sh</span>\n            </div>\n          </div>
          <h2 className="text-4xl md:text-5xl font-light text-white mb-4">
            Powered by <span className="font-medium bg-gradient-to-r from-blue-300 to-purple-400 bg-clip-text text-transparent">Polar.sh</span>
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Developer-friendly monetization that actually makes sense. Way cooler than traditional payment processors.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.tier}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`glass-card relative ${benefit.popular ? 'ring-2 ring-blue-400/50 scale-105' : ''}`}
            >
              {benefit.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="glass-badge bg-blue-500/20">
                    <span className="text-xs font-semibold text-blue-300">MOST POPULAR</span>
                  </div>
                </div>
              )}

              <div className="glass-card-content p-6">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-white mb-1">{benefit.tier}</h3>
                  <div className="text-2xl font-light text-white mb-2">{benefit.price}</div>
                  <div className="text-sm text-blue-300 font-medium mb-1">{benefit.sites}</div>
                  <div className="text-xs text-white/60 mb-3">{benefit.speed} generation</div>
                  <p className="text-xs text-white/80 italic">{benefit.highlight}</p>
                </div>

                <div className="space-y-2 mb-6">
                  {benefit.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start gap-2">
                      <Icon name="check" size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-white/80">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => onUpgrade?.(benefit.tier.toLowerCase())}
                  className={`w-full ${benefit.popular ? 'glass-button-primary' : 'glass-button-secondary'} py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200`}
                >
                  {benefit.tier === 'FREE' ? 'Start Building' : 
                   benefit.tier === 'ENTERPRISE' ? 'Contact Sales' : 
                   `Upgrade to ${benefit.tier}`}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Integration Benefits */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="glass-card"
        >
          <div className="glass-card-content p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-semibold text-white mb-4">Why Polar.sh Integration?</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Icon name="heart" size={20} className="text-red-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-white">Developer-First Experience</div>
                      <div className="text-sm text-white/70">Built by developers, for developers. No enterprise sales complexity.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="zap" size={20} className="text-yellow-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-white">Seamless Integration</div>
                      <div className="text-sm text-white/70">One-click upgrades, transparent pricing, no hidden fees.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Icon name="users" size={20} className="text-blue-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-white">Community-Driven</div>
                      <div className="text-sm text-white/70">Support the indie developer ecosystem through thoughtful monetization.</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="glass-card bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                  <div className="glass-card-content p-6">
                    <Icon name="credit-card" size={48} className="text-blue-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-white mb-2">Secure & Trusted</h4>
                    <p className="text-sm text-white/70 mb-4">
                      Polar.sh handles all payments securely with enterprise-grade infrastructure.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs text-white/60">
                      <Icon name="shield" size={16} />
                      <span>SOC 2 Compliant</span>
                      <span>•</span>
                      <span>PCI DSS</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <h3 className="text-2xl font-semibold text-white mb-4">Ready to Get Started?</h3>
          <p className="text-white/70 mb-8 max-w-2xl mx-auto">
            Start with our FREE tier and upgrade when you're ready for network visibility and advanced features.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onUpgrade?.('free')}
              className="glass-button-secondary px-8 py-3 rounded-xl font-medium"
            >
              Start Free (5 websites)
            </button>
            <button
              onClick={() => onUpgrade?.('pro')}
              className="glass-button-primary px-8 py-3 rounded-xl font-medium"
            >
              Go PRO ($49.49/month)
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};