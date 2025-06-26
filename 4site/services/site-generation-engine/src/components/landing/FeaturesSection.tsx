
import React from 'react';
import { Icon } from '../ui/Icon'; // Adjusted path
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
  return (
    <section className="py-16 md:py-24 bg-slate-800/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-sky-300 mb-4">Why Project4Site?</h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Stop letting your valuable READMEs gather dust. Turn them into dynamic, engaging project showcases effortlessly.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="bg-slate-700/50 p-6 rounded-xl shadow-lg hover:shadow-sky-500/30 transition-shadow duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="flex items-center mb-4">
                <Icon name={feature.icon} size={28} className="text-accent mr-3" />
                <h3 className="text-xl font-semibold text-sky-200">{feature.title}</h3>
              </div>
              <p className="text-slate-300 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
