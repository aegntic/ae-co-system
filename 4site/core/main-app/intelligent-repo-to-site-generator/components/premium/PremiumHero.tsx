import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Icon } from '../ui/Icon';

interface PremiumHeroProps {
  onGenerateRequest: (url: string) => void;
}

export const PremiumHero: React.FC<PremiumHeroProps> = ({ onGenerateRequest }) => {
  const [url, setUrl] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const controls = useAnimation();
  
  // Animated text variations
  const headlines = [
    "Living Websites That Update Themselves",
    "Network Visibility Among Industry Leaders",
    "Professional Recognition Through Quality Work",
    "Automated Content Creation at Dev Checkpoints"
  ];
  
  const [currentHeadline, setCurrentHeadline] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeadline((prev) => (prev + 1) % headlines.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    controls.start({
      opacity: [0, 1],
      y: [20, 0],
      transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] }
    });
  }, [currentHeadline, controls]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onGenerateRequest(url);
    }
  };
  
  const examples = [
    { name: 'React', url: 'https://github.com/facebook/react', icon: 'code' as const },
    { name: 'Next.js', url: 'https://github.com/vercel/next.js', icon: 'layout' as const },
    { name: 'TensorFlow', url: 'https://github.com/tensorflow/tensorflow', icon: 'cpu' as const },
  ];
  
  return (
    <section className="premium-hero-section">
      <div className="premium-hero-container">
        {/* Premium Background Elements */}
        <div className="premium-hero-bg-elements">
          <div className="premium-glow-orb premium-glow-orb-1" />
          <div className="premium-glow-orb premium-glow-orb-2" />
          <div className="premium-liquid premium-liquid-shape" />
        </div>
        
        {/* Hero Content */}
        <div className="premium-hero-content">
          {/* Animated Headline */}
          <motion.h1 
            className="premium-heading-1 premium-hero-headline"
            animate={controls}
            key={currentHeadline}
          >
            {headlines[currentHeadline]}
          </motion.h1>
          
          {/* Subheadline */}
          <motion.p 
            className="premium-hero-subheadline"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Powered by cutting-edge AI to create stunning, professional websites that 
            <span className="premium-text-gradient"> impress at first sight</span>
          </motion.p>
          
          {/* Premium Input Form */}
          <motion.form 
            onSubmit={handleSubmit}
            className="premium-hero-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <div className="premium-hero-input-wrapper">
              <div className="premium-glass premium-hero-input-container">
                <Icon name="github" className="premium-hero-input-icon" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setIsTyping(true);
                    setTimeout(() => setIsTyping(false), 1000);
                  }}
                  placeholder="Enter your GitHub repository URL..."
                  className="premium-hero-input"
                  required
                />
                {isTyping && (
                  <div className="premium-hero-input-glow" />
                )}
              </div>
              
              <motion.button
                type="submit"
                className="premium-button premium-button-primary premium-hero-button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Generate My Site</span>
                <Icon name="sparkles" size={20} />
              </motion.button>
            </div>
          </motion.form>
          
          {/* Example Projects */}
          <motion.div 
            className="premium-hero-examples"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <p className="premium-caption">Try with popular projects:</p>
            <div className="premium-hero-examples-grid">
              {examples.map((example, index) => (
                <motion.button
                  key={example.name}
                  onClick={() => setUrl(example.url)}
                  className="premium-glass premium-hero-example"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon name={example.icon} size={16} />
                  <span>{example.name}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
          
          {/* Trust Indicators */}
          <motion.div 
            className="premium-hero-trust"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            <div className="premium-hero-trust-item">
              <Icon name="shield-check" size={16} />
              <span>Enterprise Security</span>
            </div>
            <div className="premium-hero-trust-item">
              <Icon name="zap" size={16} />
              <span>30s Generation</span>
            </div>
            <div className="premium-hero-trust-item">
              <Icon name="award" size={16} />
              <span>$100B Standards</span>
            </div>
          </motion.div>
        </div>
        
        {/* Premium Visual Elements */}
        <div className="premium-hero-visuals">
          <motion.div 
            className="premium-hero-visual-card"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 1 }}
          >
            <div className="premium-glass premium-morph">
              <div className="premium-hero-visual-content">
                <div className="premium-skeleton premium-skeleton-title" />
                <div className="premium-skeleton premium-skeleton-text" />
                <div className="premium-skeleton premium-skeleton-text" />
                <div className="premium-skeleton premium-skeleton-button" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// Premium Hero Styles (inline for now, will be moved to CSS)
const styles = `
.premium-hero-section {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: var(--space-3xl) var(--space-xl);
  overflow: hidden;
}

.premium-hero-container {
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3xl);
  align-items: center;
}

.premium-hero-bg-elements {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.premium-glow-orb-1 {
  top: 20%;
  left: -10%;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.2) 0%, transparent 70%);
}

.premium-glow-orb-2 {
  bottom: 20%;
  right: -10%;
  background: radial-gradient(circle, rgba(138, 43, 226, 0.2) 0%, transparent 70%);
}

.premium-liquid-shape {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.05) 0%, transparent 60%);
  filter: blur(100px);
}

.premium-hero-content {
  position: relative;
  z-index: 2;
}

.premium-hero-headline {
  margin-bottom: var(--space-lg);
  max-width: 800px;
}

.premium-hero-subheadline {
  font-size: var(--scale-lg);
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: var(--space-2xl);
  max-width: 600px;
  line-height: 1.6;
}

.premium-hero-form {
  margin-bottom: var(--space-xl);
}

.premium-hero-input-wrapper {
  display: flex;
  gap: var(--space-md);
  max-width: 600px;
}

.premium-hero-input-container {
  flex: 1;
  position: relative;
  padding: 4px;
}

.premium-hero-input-icon {
  position: absolute;
  left: var(--space-lg);
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.5);
  z-index: 2;
}

.premium-hero-input {
  width: 100%;
  padding: var(--space-md) var(--space-lg) var(--space-md) calc(var(--space-lg) * 2.5);
  background: transparent;
  border: none;
  color: white;
  font-size: var(--scale-md);
  outline: none;
  position: relative;
  z-index: 2;
}

.premium-hero-input-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(255, 215, 0, 0.2) 0%, transparent 70%);
  border-radius: inherit;
  opacity: 0;
  animation: premium-fade-in 0.3s forwards;
}

.premium-hero-button {
  white-space: nowrap;
}

.premium-hero-examples {
  margin-bottom: var(--space-xl);
}

.premium-hero-examples-grid {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

.premium-hero-example {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  font-size: var(--scale-sm);
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  border: none;
  background: transparent;
  transition: all 0.3s var(--ease-premium);
}

.premium-hero-trust {
  display: flex;
  gap: var(--space-lg);
  flex-wrap: wrap;
}

.premium-hero-trust-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  color: rgba(255, 215, 0, 0.8);
  font-size: var(--scale-sm);
  font-weight: 500;
}

.premium-hero-visuals {
  position: relative;
  z-index: 1;
}

.premium-hero-visual-card {
  position: relative;
  transform: perspective(1000px) rotateY(-10deg);
  transition: transform 0.6s var(--ease-premium);
}

.premium-hero-visual-card:hover {
  transform: perspective(1000px) rotateY(0deg);
}

.premium-hero-visual-content {
  padding: var(--space-xl);
}

.premium-skeleton-title {
  height: 40px;
  margin-bottom: var(--space-lg);
  border-radius: var(--space-sm);
}

.premium-skeleton-text {
  height: 20px;
  margin-bottom: var(--space-md);
  border-radius: var(--space-xs);
}

.premium-skeleton-text:last-of-type {
  width: 80%;
}

.premium-skeleton-button {
  height: 48px;
  width: 150px;
  margin-top: var(--space-lg);
  border-radius: var(--space-md);
}

@media (max-width: 1024px) {
  .premium-hero-container {
    grid-template-columns: 1fr;
  }
  
  .premium-hero-visuals {
    display: none;
  }
}

@media (max-width: 768px) {
  .premium-hero-input-wrapper {
    flex-direction: column;
  }
  
  .premium-hero-examples-grid {
    flex-direction: column;
  }
  
  .premium-hero-trust {
    justify-content: center;
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}