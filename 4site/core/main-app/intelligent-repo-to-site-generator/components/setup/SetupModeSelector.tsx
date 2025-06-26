import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../ui/Icon';
import { SetupMode, SetupModeOption } from '../../types';
import { Button } from '../ui/Button';

interface SetupModeSelectorProps {
  onModeSelect: (mode: SetupMode) => void;
  onSkipToClassic: () => void;
}

const setupModeOptions: SetupModeOption[] = [
  {
    id: SetupMode.Auto,
    title: 'Auto Mode',
    subtitle: 'One-Click Magic',
    description: 'Just enter your repository and get an instant professional site. Perfect for quick launches.',
    features: [
      'Enter repository, get site instantly',
      'Automatic template selection',
      'AI-powered content optimization',
      'Instant deployment ready',
      'Basic analytics dashboard'
    ],
    pricing: {
      price: 'Free',
      features: ['Up to 3 sites per month', 'Standard templates', 'Community support'],
      limitations: ['project4site branding included', 'Basic customization only']
    },
    icon: 'Zap',
    gradient: 'from-yellow-400 to-orange-500'
  },
  {
    id: SetupMode.SelectStyle,
    title: 'Select Style',
    subtitle: 'Enhanced Intelligence',
    description: 'Deep repository analysis with crawl4ai and aurachat.io integration. Custom MCP server generation.',
    features: [
      'Deep repo analysis with crawl4ai',
      'Enhanced mapping via aurachat.io',
      'Custom MCP server generation',
      'Advanced template selection',
      'Process visibility',
      'Remove ads option',
      'Custom domain support'
    ],
    pricing: {
      price: '$29',
      period: '/month',
      features: ['Unlimited sites', 'Premium templates', 'Priority support', 'Analytics pro'],
      limitations: ['Requires subscription to publish', 'Requires subscription to remove ads']
    },
    icon: 'Sparkles',
    gradient: 'from-blue-500 to-purple-600',
    popular: true
  },
  {
    id: SetupMode.CustomDesign,
    title: 'Custom Design',
    subtitle: 'Enterprise Excellence',
    description: 'Full enterprise customization with direct designer collaboration and white-label options.',
    features: [
      'Full enterprise customization',
      'Direct designer collaboration',
      'White-label solutions',
      'Custom domain from start',
      'Priority support',
      'Advanced integrations',
      'Custom workflows'
    ],
    pricing: {
      price: '$299',
      period: '/month',
      features: ['Unlimited everything', 'Dedicated support', 'Custom integrations', 'White-label'],
      limitations: []
    },
    icon: 'Crown',
    gradient: 'from-purple-600 to-pink-600'
  }
];

export const SetupModeSelector: React.FC<SetupModeSelectorProps> = ({
  onModeSelect,
  onSkipToClassic
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 text-slate-100 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-sky-300 to-emerald-400">
            Choose Your Experience
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Select the perfect level of customization and intelligence for your project site generation
          </p>
        </motion.div>

        {/* Mode Options */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {setupModeOptions.map((option, index) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 hover:border-slate-600 transition-all duration-300 ${
                option.popular ? 'ring-2 ring-blue-500/50' : ''
              }`}
            >
              {/* Popular Badge */}
              {option.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Icon */}
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${option.gradient} flex items-center justify-center mb-6`}>
                <Icon name={option.icon} size={32} className="text-white" />
              </div>

              {/* Title & Subtitle */}
              <h3 className="text-2xl font-bold mb-2">{option.title}</h3>
              <p className="text-slate-400 font-medium mb-4">{option.subtitle}</p>
              
              {/* Description */}
              <p className="text-slate-300 mb-6 leading-relaxed">{option.description}</p>

              {/* Pricing */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold">{option.pricing.price}</span>
                  {option.pricing.period && (
                    <span className="text-slate-400">{option.pricing.period}</span>
                  )}
                </div>
                <div className="space-y-1">
                  {option.pricing.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                      <Icon name="Check" size={16} className="text-green-400" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                {option.pricing.limitations && option.pricing.limitations.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {option.pricing.limitations.map((limitation, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-slate-400">
                        <Icon name="X" size={16} className="text-red-400" />
                        <span>{limitation}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="mb-8">
                <h4 className="font-semibold mb-3 text-slate-200">Key Features:</h4>
                <div className="space-y-2">
                  {option.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                      <Icon name="ArrowRight" size={16} className="text-slate-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <Button
                onClick={() => onModeSelect(option.id)}
                className={`w-full bg-gradient-to-r ${option.gradient} hover:opacity-90 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105`}
              >
                Get Started
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Classic Mode Option */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold mb-2 text-slate-200">
              Just want the basic generator?
            </h3>
            <p className="text-slate-400 mb-4">
              Use our original simple GitHub README to site generator without the enhanced features
            </p>
            <Button
              onClick={onSkipToClassic}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Use Classic Mode
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};