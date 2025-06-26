import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../ui/Icon';
import { useAuth } from '../../contexts/AuthContext';

interface PremiumAuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const PremiumAuthModal: React.FC<PremiumAuthModalProps> = ({ onClose, onSuccess }) => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="premium-modal-overlay active" onClick={onClose}>
      <motion.div 
        className="premium-modal premium-glass"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* Premium Close Button - Properly Positioned */}
        <button
          onClick={onClose}
          className="premium-modal-close"
          aria-label="Close modal"
        >
          <Icon name="x" size={20} />
        </button>
        
        <div className="premium-modal-content">
          {/* Modal Header */}
          <div className="premium-modal-header">
            <motion.div 
              className="premium-modal-logo"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <div className="premium-logo-gradient" />
            </motion.div>
            
            <h2 className="premium-heading-2 premium-text-center">
              {mode === 'signin' ? 'Welcome Back' : 'Join Project4Site'}
            </h2>
            
            <p className="premium-body premium-text-center premium-text-muted">
              {mode === 'signin' 
                ? 'Sign in to access your premium features' 
                : 'Create an account to unlock enterprise-grade capabilities'}
            </p>
          </div>
          
          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="premium-auth-form">
            <div className="premium-input-group">
              <label className="premium-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="premium-input"
                placeholder="you@company.com"
                required
                autoFocus
              />
            </div>
            
            <div className="premium-input-group">
              <label className="premium-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="premium-input"
                placeholder="••••••••"
                required
              />
            </div>
            
            {mode === 'signup' && (
              <motion.div 
                className="premium-input-group"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="premium-label">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="premium-input"
                  placeholder="••••••••"
                  required={mode === 'signup'}
                />
              </motion.div>
            )}
            
            {error && (
              <motion.div 
                className="premium-auth-error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Icon name="alert-circle" size={16} />
                <span>{error}</span>
              </motion.div>
            )}
            
            <button 
              type="submit" 
              className="premium-button premium-button-primary premium-auth-submit"
              disabled={loading}
            >
              {loading ? (
                <div className="premium-button-loader" />
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                  <Icon name="arrow-right" size={20} />
                </>
              )}
            </button>
          </form>
          
          {/* Mode Switch */}
          <div className="premium-auth-switch">
            <p className="premium-caption">
              {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
            </p>
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError(null);
              }}
              className="premium-link"
            >
              {mode === 'signin' ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
          
          {/* Premium Features */}
          <div className="premium-auth-features">
            <div className="premium-auth-feature">
              <Icon name="shield" size={16} className="premium-text-gold" />
              <span>Enterprise Security</span>
            </div>
            <div className="premium-auth-feature">
              <Icon name="zap" size={16} className="premium-text-gold" />
              <span>Instant Access</span>
            </div>
            <div className="premium-auth-feature">
              <Icon name="crown" size={16} className="premium-text-gold" />
              <span>Premium Features</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Premium Auth Modal Styles
const styles = `
.premium-modal-content {
  padding: var(--space-2xl);
  position: relative;
  z-index: 2;
}

.premium-modal-header {
  text-align: center;
  margin-bottom: var(--space-2xl);
}

.premium-modal-logo {
  width: 80px;
  height: 80px;
  margin: 0 auto var(--space-lg);
  position: relative;
}

.premium-logo-gradient {
  width: 100%;
  height: 100%;
  background: conic-gradient(
    from 0deg,
    var(--premium-gold) 0deg,
    var(--premium-gold-deep) 90deg,
    var(--premium-royal) 180deg,
    var(--premium-gold) 360deg
  );
  border-radius: 20px;
  filter: blur(20px);
  opacity: 0.8;
}

.premium-auth-form {
  max-width: 400px;
  margin: 0 auto;
}

.premium-auth-submit {
  width: 100%;
  margin-top: var(--space-lg);
}

.premium-button-loader {
  width: 20px;
  height: 20px;
  border: 2px solid var(--premium-black);
  border-top-color: transparent;
  border-radius: 50%;
  animation: premium-spin 0.8s linear infinite;
}

.premium-auth-error {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--space-sm);
  color: #ef4444;
  font-size: var(--scale-sm);
  margin-top: var(--space-md);
}

.premium-auth-switch {
  text-align: center;
  margin-top: var(--space-xl);
  padding-top: var(--space-xl);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.premium-auth-switch p {
  display: inline;
  margin-right: var(--space-xs);
}

.premium-auth-features {
  display: flex;
  justify-content: center;
  gap: var(--space-lg);
  margin-top: var(--space-2xl);
  padding-top: var(--space-xl);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.premium-auth-feature {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--scale-sm);
  color: rgba(255, 255, 255, 0.7);
}

/* Mobile Responsive */
@media (max-width: 640px) {
  .premium-modal {
    margin: var(--space-md);
    max-width: calc(100vw - var(--space-xl));
  }
  
  .premium-auth-features {
    flex-direction: column;
    gap: var(--space-sm);
    align-items: center;
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}