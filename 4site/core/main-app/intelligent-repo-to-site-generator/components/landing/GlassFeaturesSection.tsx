import React, { useState, useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';

// PHASE 2: Revolutionary Features with Glass Design Elements & Website Previews
const features = [
  {
    title: "Living Websites",
    description: "Your website automatically updates itself and creates blog posts at development checkpoints. Focus on building - we handle the marketing noise.",
    glassIcon: "⟲", // Custom glass symbol for auto-refresh
    previewType: "auto-update",
    gradient: "from-emerald-500/20 to-teal-500/20",
    accentColor: "rgba(16, 185, 129, 0.6)"
  },
  {
    title: "Network Visibility",
    description: "Professional recognition among curated industry leaders. Build your reputation through quality work, not financial promises.",
    glassIcon: "◈", // Diamond for premium network
    previewType: "network-graph",
    gradient: "from-blue-500/20 to-purple-500/20", 
    accentColor: "rgba(59, 130, 246, 0.6)"
  },
  {
    title: "Automated Content Creation",
    description: "Get online instantly while learning to build digitally. Your development milestones automatically become professional content.",
    glassIcon: "◯", // Circle for continuous creation
    previewType: "content-flow",
    gradient: "from-pink-500/20 to-rose-500/20",
    accentColor: "rgba(236, 72, 153, 0.6)"
  },
  {
    title: "Complement Not Complicate", 
    description: "Seamlessly integrates with your existing workflow. Works with GitHub, enhances what you're already building without adding complexity.",
    glassIcon: "⬡", // Hexagon for perfect integration
    previewType: "integration-demo",
    gradient: "from-amber-500/20 to-orange-500/20",
    accentColor: "rgba(245, 158, 11, 0.6)"
  },
  {
    title: "SEO Optimized",
    description: "Every generated site is optimized for search engines with proper meta tags and structure.",
    glassIcon: "◣", // Triangle for ranking up
    previewType: "seo-metrics",
    gradient: "from-indigo-500/20 to-blue-500/20",
    accentColor: "rgba(99, 102, 241, 0.6)"
  },
  {
    title: "One-Click Deploy",
    description: "Deploy your site instantly to multiple platforms with a single click.",
    glassIcon: "▲", // Arrow up for deployment
    previewType: "deploy-animation",
    gradient: "from-purple-500/20 to-pink-500/20",
    accentColor: "rgba(168, 85, 247, 0.6)"
  }
];

// PHASE 2: Website Preview Animation Components
const WebsitePreviewAnimation: React.FC<{ type: string; accentColor: string }> = ({ type, accentColor }) => {
  const [animationPhase, setAnimationPhase] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 4);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const renderPreview = () => {
    switch (type) {
      case "auto-update":
        return (
          <div className="relative w-full h-full flex flex-col">
            <div className="h-6 bg-gradient-to-r from-white/20 to-white/10 rounded mb-2 relative overflow-hidden">
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: animationPhase % 2 === 0 ? '-100%' : '100%' }}
                transition={{ duration: 1, ease: "easeInOut" }}
              />
            </div>
            <div className="flex-1 grid grid-cols-3 gap-1">
              {[0,1,2].map(i => (
                <motion.div 
                  key={i}
                  className="bg-gradient-to-b from-white/15 to-white/5 rounded"
                  animate={{ 
                    opacity: animationPhase === i ? 1 : 0.3,
                    scale: animationPhase === i ? 1.05 : 1
                  }}
                  transition={{ duration: 0.5 }}
                  style={{ background: animationPhase === i ? accentColor : undefined }}
                />
              ))}
            </div>
          </div>
        );
      
      case "network-graph":
        return (
          <div className="relative w-full h-full">
            <svg width="100%" height="100%" viewBox="0 0 120 120" className="absolute inset-0">
              {/* Network nodes */}
              {[
                { x: 20, y: 20, active: animationPhase >= 0 },
                { x: 100, y: 30, active: animationPhase >= 1 },
                { x: 60, y: 60, active: animationPhase >= 2 },
                { x: 20, y: 100, active: animationPhase >= 3 },
                { x: 100, y: 90, active: animationPhase >= 0 }
              ].map((node, i) => (
                <motion.circle
                  key={i}
                  cx={node.x}
                  cy={node.y}
                  r="4"
                  fill={node.active ? accentColor : "rgba(255,255,255,0.3)"}
                  animate={{ 
                    scale: node.active ? [1, 1.2, 1] : 1,
                    opacity: node.active ? 1 : 0.5
                  }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              ))}
              {/* Connection lines */}
              <motion.path
                d="M20,20 L100,30 L60,60 L20,100 L100,90 L60,60 L100,30"
                stroke={accentColor}
                strokeWidth="1"
                fill="none"
                strokeDasharray="2,2"
                animate={{ pathLength: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </svg>
          </div>
        );
      
      case "content-flow":
        return (
          <div className="relative w-full h-full flex flex-col gap-2">
            {[0,1,2,3].map(i => (
              <motion.div 
                key={i}
                className="h-4 bg-gradient-to-r from-white/10 to-transparent rounded"
                animate={{
                  width: animationPhase === i ? "100%" : "70%",
                  opacity: animationPhase >= i ? 1 : 0.3
                }}
                transition={{ duration: 0.5 }}
                style={{ 
                  background: animationPhase === i 
                    ? `linear-gradient(90deg, ${accentColor}, transparent)` 
                    : undefined 
                }}
              />
            ))}
          </div>
        );
      
      case "integration-demo":
        return (
          <div className="relative w-full h-full">
            <div className="absolute inset-0 grid grid-cols-2 gap-2">
              <motion.div 
                className="bg-white/10 rounded flex items-center justify-center text-xs text-white/70"
                animate={{ 
                  borderColor: animationPhase % 2 === 0 ? accentColor : "transparent"
                }}
                style={{ border: `1px solid ${animationPhase % 2 === 0 ? accentColor : 'transparent'}` }}
              >
                GitHub
              </motion.div>
              <motion.div 
                className="bg-white/10 rounded flex items-center justify-center text-xs text-white/70"
                animate={{ 
                  borderColor: animationPhase % 2 === 1 ? accentColor : "transparent"
                }}
                style={{ border: `1px solid ${animationPhase % 2 === 1 ? accentColor : 'transparent'}` }}
              >
                4site.pro
              </motion.div>
            </div>
            <motion.div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              style={{ color: accentColor }}
            >
              ⚡
            </motion.div>
          </div>
        );
      
      case "seo-metrics":
        return (
          <div className="relative w-full h-full flex items-end gap-1">
            {[40, 70, 55, 90, 65].map((height, i) => (
              <motion.div 
                key={i}
                className="flex-1 bg-gradient-to-t from-white/20 to-white/10 rounded-t"
                animate={{ 
                  height: `${animationPhase === i ? height + 10 : height}%`,
                  backgroundColor: animationPhase === i ? accentColor : undefined
                }}
                transition={{ duration: 0.5 }}
              />
            ))}
          </div>
        );
      
      case "deploy-animation":
        return (
          <div className="relative w-full h-full">
            <motion.div
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-xl"
              animate={{ 
                y: animationPhase === 0 ? 0 : -40,
                scale: animationPhase === 0 ? 1 : 0.5,
                opacity: animationPhase === 0 ? 1 : 0
              }}
              transition={{ duration: 1 }}
              style={{ color: accentColor }}
            >
              🚀
            </motion.div>
            {[0,1,2].map(i => (
              <motion.div
                key={i}
                className="absolute top-2 bg-white/20 rounded text-xs px-2 py-1 text-white/80"
                style={{ left: `${20 + i * 25}%` }}
                animate={{
                  opacity: animationPhase > i ? 1 : 0.3,
                  scale: animationPhase === i + 1 ? 1.1 : 1,
                  backgroundColor: animationPhase === i + 1 ? accentColor : undefined
                }}
                transition={{ duration: 0.3 }}
              >
                {['Vercel', 'Netlify', 'GitHub'][i]}
              </motion.div>
            ))}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="glass-preview-container">
      <div className="glass-preview-animation" />
      <div className="relative z-10 p-2 h-full">
        {renderPreview()}
      </div>
    </div>
  );
};

// PHASE 2: Revolutionary Glass Features Section
export const GlassFeaturesSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [hoveredTile, setHoveredTile] = useState<number | null>(null);

  return (
    <section 
      ref={containerRef}
      className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 relative"
    >
      {/* Pure pitch black foundation */}
      <div className="glass-foundation" />
      
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,215,0,0.03)_0%,transparent_70%)]" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* PHASE 2: Apple-esque Typography Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center glass-spacing-2xl"
        >
          <h2 className="glass-text-hero mb-6">
            Features That
            <span className="bg-gradient-to-r from-white via-yellow-200 to-white bg-clip-text text-transparent"> Transform</span>
          </h2>
          <p className="glass-text-body-large max-w-3xl mx-auto glass-spacing-lg">
            Revolutionary tools that seamlessly integrate with your workflow, 
            transforming every GitHub repository into a stunning professional presence.
          </p>
        </motion.div>

        {/* PHASE 2: Revolutionary Glass Tile Stacking System */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="glass-tiles-container glass-spacing-xl"
        >
          <div className="glass-tile-stack max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="glass-tile glass-animate-shimmer"
                onMouseEnter={() => setHoveredTile(index)}
                onMouseLeave={() => setHoveredTile(null)}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ 
                  duration: 0.6, 
                  delay: 0.1 * index,
                  ease: [0.16, 1, 0.3, 1]
                }}
                style={{
                  background: hoveredTile === index 
                    ? `linear-gradient(135deg, ${feature.accentColor}15, rgba(0,0,0,0.4))`
                    : undefined
                }}
              >
                <div className="glass-tile-content">
                  <div className="flex items-start justify-between glass-gap-lg">
                    {/* Left content */}
                    <div className="flex-1">
                      {/* Glass Design Element (replacing emoji) */}
                      <div className="glass-design-element glass-animate-glow">
                        <div className="glass-design-element-icon">
                          {feature.glassIcon}
                        </div>
                      </div>
                      
                      {/* Typography with perfect spacing */}
                      <h3 className="glass-text-title glass-spacing-sm">
                        {feature.title}
                      </h3>
                      <p className="glass-text-body glass-spacing-md">
                        {feature.description}
                      </p>
                    </div>
                    
                    {/* Right content - Website Preview Animation */}
                    <div className="w-48 h-32 flex-shrink-0">
                      <WebsitePreviewAnimation 
                        type={feature.previewType} 
                        accentColor={feature.accentColor}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* PHASE 2: Enhanced Bottom CTA with Glass Effects */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center glass-spacing-xl"
        >
          <div className="inline-flex items-center gap-3 glass-badge glass-animate-glow">
            <div className="glass-badge-content flex items-center glass-gap-sm">
              <motion.div 
                className="w-3 h-3 bg-emerald-400 rounded-full"
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="glass-text-caption font-semibold text-white/90">
                All features included in free tier
              </span>
              <motion.div
                className="text-yellow-400"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ✨
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};