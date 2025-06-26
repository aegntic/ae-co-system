import React from 'react';
import { motion } from 'framer-motion';

export const PremiumShowcase: React.FC = () => {
  return (
    <section className="premium-showcase-section">
      <div className="premium-showcase-container">
        <motion.h2 
          className="premium-heading-2 premium-text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Trusted by Industry Leaders
        </motion.h2>
        <div className="premium-showcase-logos">
          {/* Logo placeholders - in production these would be real company logos */}
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <motion.div
              key={i}
              className="premium-showcase-logo premium-glass"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};