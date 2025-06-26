import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../ui/Icon';

const features = [
  {
    icon: 'zap' as const,
    title: 'Lightning Fast',
    description: 'Generate enterprise-grade sites in under 30 seconds with our advanced AI pipeline',
    gradient: 'from-yellow-400 to-orange-500'
  },
  {
    icon: 'sparkles' as const,
    title: 'AI-Powered Design',
    description: 'Cutting-edge AI creates stunning visuals and layouts tailored to your project',
    gradient: 'from-purple-400 to-pink-500'
  },
  {
    icon: 'shield-check' as const,
    title: 'Enterprise Security',
    description: 'Bank-level encryption and security standards protect your intellectual property',
    gradient: 'from-blue-400 to-cyan-500'
  },
  {
    icon: 'trending-up' as const,
    title: 'SEO Optimized',
    description: 'Built-in optimization ensures maximum visibility and search engine rankings',
    gradient: 'from-green-400 to-emerald-500'
  },
  {
    icon: 'code-2' as const,
    title: 'Developer Friendly',
    description: 'Clean, exportable code that integrates seamlessly with your workflow',
    gradient: 'from-red-400 to-rose-500'
  },
  {
    icon: 'globe' as const,
    title: 'Global CDN',
    description: 'Lightning-fast delivery worldwide with our premium content delivery network',
    gradient: 'from-indigo-400 to-purple-500'
  }
];

export const PremiumFeatures: React.FC = () => {
  return (
    <section className="premium-features-section">
      <div className="premium-features-container">
        <motion.div 
          className="premium-features-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="premium-heading-2 premium-text-center">
            Features That Define <span className="premium-text-gradient">Excellence</span>
          </h2>
          <p className="premium-body premium-text-center premium-text-muted">
            Every feature engineered to deliver $100 billion standards
          </p>
        </motion.div>
        
        <div className="premium-features-grid">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="premium-feature-card premium-glass premium-hover-lift"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className="premium-feature-icon-wrapper">
                <div className={`premium-feature-icon-bg ${feature.gradient}`} />
                <Icon name={feature.icon} size={32} className="premium-feature-icon" />
              </div>
              
              <h3 className="premium-heading-3">{feature.title}</h3>
              <p className="premium-body premium-text-muted">{feature.description}</p>
              
              <div className="premium-feature-glow" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Premium Features Styles
const styles = `
.premium-features-section {
  padding: calc(var(--space-3xl) * 2) var(--space-xl);
  position: relative;
}

.premium-features-container {
  max-width: 1200px;
  margin: 0 auto;
}

.premium-features-header {
  text-align: center;
  margin-bottom: calc(var(--space-3xl) * 1.5);
}

.premium-features-header h2 {
  margin-bottom: var(--space-lg);
}

.premium-features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: var(--space-xl);
}

.premium-feature-card {
  position: relative;
  padding: var(--space-2xl);
  text-align: center;
  overflow: hidden;
}

.premium-feature-icon-wrapper {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto var(--space-lg);
}

.premium-feature-icon-bg {
  position: absolute;
  inset: 0;
  border-radius: 20px;
  opacity: 0.2;
  filter: blur(20px);
  transform: scale(1.5);
}

.from-yellow-400 { background: linear-gradient(135deg, #FBBF24, #F59E0B); }
.from-purple-400 { background: linear-gradient(135deg, #A78BFA, #EC4899); }
.from-blue-400 { background: linear-gradient(135deg, #60A5FA, #06B6D4); }
.from-green-400 { background: linear-gradient(135deg, #34D399, #10B981); }
.from-red-400 { background: linear-gradient(135deg, #F87171, #FB7185); }
.from-indigo-400 { background: linear-gradient(135deg, #818CF8, #A78BFA); }

.premium-feature-icon {
  position: relative;
  z-index: 2;
  color: white;
  display: block;
  margin: auto;
  top: 50%;
  transform: translateY(-50%);
}

.premium-feature-card h3 {
  font-size: var(--scale-lg);
  margin-bottom: var(--space-md);
}

.premium-feature-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s var(--ease-premium);
  pointer-events: none;
}

.premium-feature-card:hover .premium-feature-glow {
  opacity: 1;
}

@media (max-width: 768px) {
  .premium-features-grid {
    grid-template-columns: 1fr;
    gap: var(--space-lg);
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}