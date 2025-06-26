
import React from 'react';
import { Icon } from '../ui/Icon';
import { motion } from 'framer-motion';

interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

const features: FeatureItem[] = [
  {
    icon: 'Zap',
    title: 'Instant Generation',
    description: 'Go from GitHub URL to live site in under 30 seconds. Seriously.',
  },
  {
    icon: 'BrainCircuit',
    title: 'AI-Powered Content',
    description: 'Our AI intelligently structures and enhances your README for maximum impact.',
  },
  {
    icon: 'Palette',
    title: 'Beautiful Templates',
    description: 'Choose from a selection of professional templates to match your project\'s vibe.',
  },
  {
    icon: 'Share2',
    title: 'Viral Sharing',
    description: 'Easily share your project site and track its engagement.',
  },
  {
    icon: 'Github',
    title: 'GitHub Native',
    description: 'Seamlessly works with any public GitHub repository. No complex setup.',
  },
  {
    icon: 'ShieldCheck',
    title: 'Secure & Private',
    description: 'We respect your data. No unnecessary permissions or storage of sensitive info.',
  },
];

export const FeaturesSection: React.FC = () => {
  const iconAccents = [true, false, true, false, true, false];

  return (
    <section className="py-20 md:py-32 bg-gh-bg-secondary/30 backdrop-blur-sm relative overflow-hidden">
      {/* Background grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,215,0,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,215,0,0.01)_1px,transparent_1px)] bg-[size:40px_40px]" />
      
      {/* Subtle floating orbs */}
      <motion.div
        className="absolute top-20 left-1/4 w-24 h-24 bg-wu-gold-subtle rounded-full filter blur-xl"
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-20 right-1/4 w-28 h-28 bg-white/5 rounded-full filter blur-2xl"
        animate={{
          x: [0, -20, 0],
          y: [0, 15, 0],
          scale: [1.1, 1, 1.1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 6,
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.h2 
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="text-gradient-wu">
              Why Project4Site?
            </span>
          </motion.h2>
          <motion.p
            className="text-xl text-gh-text-secondary max-w-3xl mx-auto font-mono leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Stop letting your valuable READMEs gather dust. Turn them into{' '}
            <span className="text-wu-gold font-semibold">dynamic</span>,{' '}
            <span className="text-wu-gold-muted font-semibold">engaging</span> project showcases{' '}
            <span className="text-text-primary font-semibold">effortlessly</span>.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="group relative bg-gh-bg-secondary/80 backdrop-blur-sm p-8 rounded-xl border border-gh-border-default hover:border-wu-gold/50 transition-all duration-300 hover:transform hover:-translate-y-1 overflow-hidden"
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ 
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
              }}
            >
              {/* Subtle background gradient */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${iconAccents[index % iconAccents.length] ? 'from-wu-gold-subtle' : 'from-white/5'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                initial={false}
              />
              
              {/* Minimal border effect */}
              <div className="absolute inset-0 rounded-xl bg-wu-gold-subtle opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-sm" />
              
              <div className="relative z-10">
                <motion.div 
                  className="flex items-center mb-6"
                  initial={{ x: -10 }}
                  whileInView={{ x: 0 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                >
                  <motion.div
                    className={`p-3 rounded-lg ${iconAccents[index % iconAccents.length] ? 'bg-wu-gold-subtle border-wu-gold/30' : 'bg-bg-tertiary border-border-default'} border mr-4`}
                    whileHover={{ 
                      scale: 1.05,
                      ...(iconAccents[index % iconAccents.length] && { boxShadow: '0 0 15px rgba(255, 215, 0, 0.2)' }),
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icon 
                      name={feature.icon} 
                      size={32} 
                      className={iconAccents[index % iconAccents.length] ? 'text-wu-gold' : 'text-text-secondary'} 
                    />
                  </motion.div>
                  <h3 className="text-xl font-bold text-gh-text-primary font-mono">
                    {feature.title}
                  </h3>
                </motion.div>
                
                <motion.p 
                  className="text-gh-text-secondary leading-relaxed font-mono"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.5 }}
                >
                  {feature.description}
                </motion.p>
              </div>

              {/* Minimal corner accent */}
              {iconAccents[index % iconAccents.length] && (
                <motion.div
                  className="absolute top-2 right-2 w-1 h-1 bg-wu-gold rounded-full opacity-0 group-hover:opacity-60"
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* Call to action section */}
        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <motion.p
            className="text-lg text-gh-text-secondary font-mono mb-8"
            animate={{
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            Ready to make your code shine?
          </motion.p>
          
          <motion.div
            className="flex justify-center items-center space-x-3 mt-4"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            {Array.from({ length: 3 }).map((_, index) => (
              <motion.div
                key={index}
                className="w-2 h-2 bg-wu-gold rounded-full"
                animate={{
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.3,
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
