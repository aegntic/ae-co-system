
import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../ui/Icon'; // Adjusted path

export const DemoSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-transparent">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-sky-300 mb-4">See It In Action</h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Experience the magic. A placeholder for a cool demo video or interactive element showing the transformation.
          </p>
        </div>
        <motion.div
          className="bg-slate-700/30 rounded-xl shadow-2xl p-4 md:p-8 max-w-4xl mx-auto aspect-video flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          {/* Placeholder for an embedded video or interactive demo */}
          <div className="text-center">
            <Icon name="PlayCircle" size={80} className="text-accent opacity-80 mb-4" />
            <p className="text-slate-400 text-xl">Interactive Demo / Video Coming Soon!</p>
            <p className="text-slate-500 mt-2">Imagine your README transforming into a beautiful site right here.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
