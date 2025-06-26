import React from 'react';
import { motion } from 'framer-motion';

interface DataVisualizerProps {
  data: any;
  type: 'stats' | 'techStack' | 'features' | 'timeline' | 'comparison';
  interactive?: boolean;
  className?: string;
}

export const DataVisualizer: React.FC<DataVisualizerProps> = ({ 
  data, 
  type, 
  interactive = true, 
  className = '' 
}) => {
  const renderStats = (stats: Array<{ label: string; value: string | number; color?: string }>) => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={interactive ? { scale: 1.05 } : {}}
            className="relative group cursor-pointer"
          >
            <div className="bg-gh-bg-secondary rounded-xl p-6 border border-gh-border-default hover:border-wu-gold/50 transition-all duration-300">
              <motion.div
                className="text-3xl font-bold mb-2"
                style={{ color: stat.color || '#FFD700' }}
                animate={interactive ? {
                  textShadow: [
                    '0 0 0px rgba(255, 215, 0, 0)',
                    '0 0 20px rgba(255, 215, 0, 0.5)',
                    '0 0 0px rgba(255, 215, 0, 0)',
                  ]
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {stat.value}
              </motion.div>
              <div className="text-sm text-gh-text-secondary">{stat.label}</div>
              
              {/* Hover effect */}
              {interactive && (
                <div className="absolute inset-0 bg-gradient-to-br from-wu-gold/10 to-transparent opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300" />
              )}
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderTechStack = (techs: Array<{ name: string; icon?: string; color: string }>) => {
    return (
      <div className="flex flex-wrap gap-4 justify-center">
        {techs.map((tech, index) => (
          <motion.div
            key={tech.name}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              delay: index * 0.05,
              type: "spring",
              stiffness: 200 
            }}
            whileHover={interactive ? { 
              scale: 1.1,
              rotate: [0, -5, 5, 0],
              transition: { duration: 0.3 }
            } : {}}
            className="group"
          >
            <div 
              className="relative w-24 h-24 rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden"
              style={{ 
                background: `linear-gradient(135deg, ${tech.color}20, ${tech.color}40)`,
                border: `2px solid ${tech.color}50`
              }}
            >
              {/* Icon or letter */}
              <div className="text-3xl font-bold" style={{ color: tech.color }}>
                {tech.icon || tech.name.charAt(0)}
              </div>
              
              {/* Label */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm py-1 px-2 text-center">
                <span className="text-xs text-white font-medium">{tech.name}</span>
              </div>
              
              {/* Interactive glow */}
              {interactive && (
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(circle at center, ${tech.color}40, transparent)`,
                  }}
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                  }}
                />
              )}
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderFeatures = (features: Array<{ title: string; description: string; icon?: string }>) => {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group"
          >
            <div className="bg-gh-bg-secondary rounded-xl p-6 h-full border border-gh-border-default hover:border-wu-gold/50 transition-all duration-300 relative overflow-hidden">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: `repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 10px,
                    rgba(255, 215, 0, 0.1) 10px,
                    rgba(255, 215, 0, 0.1) 20px
                  )`
                }} />
              </div>
              
              {/* Content */}
              <div className="relative z-10">
                <div className="text-2xl mb-3 text-wu-gold">
                  {feature.icon || '✦'}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white group-hover:text-wu-gold transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-gh-text-secondary">
                  {feature.description}
                </p>
              </div>
              
              {/* Interactive hover effect */}
              {interactive && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-wu-gold to-wu-gold-muted"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                  style={{ transformOrigin: 'left' }}
                />
              )}
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderTimeline = (events: Array<{ date: string; title: string; description?: string }>) => {
    return (
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-wu-gold via-wu-gold-muted to-transparent" />
        
        <div className="space-y-8">
          {events.map((event, index) => (
            <motion.div
              key={`${event.date}-${index}`}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.15 }}
              className="relative flex items-start gap-6 group"
            >
              {/* Timeline dot */}
              <motion.div
                className="relative z-10 w-16 h-16 bg-gh-bg-secondary rounded-full border-4 border-wu-gold flex items-center justify-center flex-shrink-0"
                whileHover={interactive ? { scale: 1.2 } : {}}
              >
                <span className="text-xs font-bold text-wu-gold">{index + 1}</span>
                {interactive && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-wu-gold/20"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.2,
                    }}
                  />
                )}
              </motion.div>
              
              {/* Content */}
              <div className="flex-1 bg-gh-bg-secondary rounded-xl p-6 border border-gh-border-default group-hover:border-wu-gold/50 transition-all duration-300">
                <div className="text-sm text-wu-gold mb-1">{event.date}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{event.title}</h3>
                {event.description && (
                  <p className="text-sm text-gh-text-secondary">{event.description}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const renderComparison = (items: Array<{ label: string; value: number; max: number }>) => {
    return (
      <div className="space-y-4">
        {items.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gh-text-primary">{item.label}</span>
              <span className="text-sm font-bold text-wu-gold">{item.value}%</span>
            </div>
            <div className="relative h-6 bg-gh-bg-tertiary rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-wu-gold to-wu-gold-muted rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(item.value / item.max) * 100}%` }}
                transition={{ duration: 1, delay: index * 0.2 }}
              />
              {interactive && (
                <motion.div
                  className="absolute inset-y-0 left-0 bg-white/20 rounded-full opacity-0 group-hover:opacity-100"
                  style={{ width: `${(item.value / item.max) * 100}%` }}
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              )}
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    switch (type) {
      case 'stats':
        return renderStats(data);
      case 'techStack':
        return renderTechStack(data);
      case 'features':
        return renderFeatures(data);
      case 'timeline':
        return renderTimeline(data);
      case 'comparison':
        return renderComparison(data);
      default:
        return null;
    }
  };

  return (
    <div className={`data-visualizer ${className}`}>
      {renderContent()}
    </div>
  );
};