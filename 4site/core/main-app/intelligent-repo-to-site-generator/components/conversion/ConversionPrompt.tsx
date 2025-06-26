import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConversionPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onSignUp: () => void;
  generationCount?: number;
}

export const ConversionPrompt: React.FC<ConversionPromptProps> = ({ 
  isOpen, 
  onClose, 
  onSignUp,
  generationCount = 3
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-8 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="text-6xl mb-4"
              >
                🎉
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-3">
                You've Generated {generationCount} Amazing Sites!
              </h2>
              <p className="text-white/70 text-lg">
                Join thousands of developers who trust project4site for their project websites
              </p>
            </div>

            {/* Feature Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {/* Free Account */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="backdrop-blur-xl bg-white/5 rounded-xl border border-white/10 p-6"
              >
                <div className="text-center">
                  <div className="text-lg font-semibold text-white mb-3">Free Account</div>
                  <div className="space-y-2 text-sm text-white/80">
                    <div>✅ 25 generations/month</div>
                    <div>✅ All basic templates</div>
                    <div>✅ Download sites</div>
                    <div>✅ GitHub integration</div>
                  </div>
                </div>
              </motion.div>

              {/* Pro Account */}
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="backdrop-blur-xl bg-gradient-to-br from-yellow-400/10 to-orange-500/10 rounded-xl border border-yellow-400/30 p-6 relative overflow-hidden"
              >
                <div className="absolute top-2 right-2">
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                    POPULAR
                  </span>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-3">
                    Pro Account
                  </div>
                  <div className="space-y-2 text-sm text-white/80">
                    <div>🚀 Unlimited generations</div>
                    <div>🎨 Premium templates</div>
                    <div>🌐 Custom domains</div>
                    <div>⚡ Priority support</div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Action Buttons */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <button
                onClick={onSignUp}
                className="flex-1 py-4 px-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold rounded-xl hover:shadow-lg hover:shadow-yellow-400/25 transition-all transform hover:scale-105"
              >
                Create Free Account
              </button>
              <button
                onClick={onClose}
                className="py-4 px-6 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors"
              >
                Continue as Guest
              </button>
            </motion.div>

            {/* Footer */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-xs text-white/50 text-center mt-6"
            >
              No credit card required • Upgrade anytime • Cancel anytime
            </motion.p>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/60 hover:text-white text-xl transition-colors"
            >
              ✕
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};