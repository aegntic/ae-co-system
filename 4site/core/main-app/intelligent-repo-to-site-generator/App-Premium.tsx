import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import './index.css';
import './styles/premium-design-system.css';
import './styles/premium-animations.css';
import './styles/premium-complete.css';

// Premium Components
import { PremiumHero } from './components/premium/PremiumHero';
import { PremiumFeatures } from './components/premium/PremiumFeatures';
import { PremiumShowcase } from './components/premium/PremiumShowcase';
import { PremiumNavigation } from './components/premium/PremiumNavigation';
import { PremiumFooter } from './components/premium/PremiumFooter';
import { PremiumLoader } from './components/premium/PremiumLoader';
import { PremiumAuthModal } from './components/premium/PremiumAuthModal';
import { PremiumGeneratorModal } from './components/premium/PremiumGeneratorModal';
import { PremiumNotification } from './components/premium/PremiumNotification';
import { PremiumSitePreview } from './components/premium/PremiumSitePreview';
import { PremiumParticleField } from './components/premium/PremiumParticleField';
import { PremiumUserMenu } from './components/premium/PremiumUserMenu';

// Services
import { generateSiteWithRetry, GenerationProgress } from './services/multiModalOrchestrator';
import { DeepAnalysisOrchestrator } from './services/deepAnalysisOrchestrator';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { createWebsite, trackEvent } from './lib/supabase';

// Types
import { SiteData, AppState } from './types';

interface DeepSiteData extends SiteData {
  deepAnalysis?: any;
}

const PremiumAppContent: React.FC = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const { scrollY } = useScroll();
  
  // State Management
  const [appState, setAppState] = useState<AppState>(AppState.Idle);
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const [deepSiteData, setDeepSiteData] = useState<DeepSiteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  
  // Modal States
  const [showAuth, setShowAuth] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [pendingUrl, setPendingUrl] = useState('');
  
  // Progress Tracking
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
  
  // Animation Values
  const backgroundY = useTransform(scrollY, [0, 1000], [0, -200]);
  const contentScale = useTransform(scrollY, [0, 100], [1, 0.98]);
  
  // Mouse Tracking for Premium Effects
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height
        });
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  // Premium Notification System
  const showNotification = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  }, []);
  
  // Handle Generate Request
  const handleGenerateRequest = useCallback((url: string) => {
    if (!url.trim()) {
      showNotification('error', 'Please enter a valid GitHub repository URL');
      return;
    }
    
    // Check authentication for premium features
    if (!user && profile?.tier !== 'free') {
      setPendingUrl(url);
      setShowAuth(true);
      return;
    }
    
    setPendingUrl(url);
    setShowGenerator(true);
  }, [user, profile, showNotification]);
  
  // Handle Generation Mode Selection
  const handleGenerationStart = useCallback(async (mode: 'quick' | 'deep', options: any) => {
    setShowGenerator(false);
    setAppState(AppState.Loading);
    setError(null);
    setSiteData(null);
    setDeepSiteData(null);
    
    try {
      if (mode === 'quick') {
        const result = await generateSiteWithRetry(pendingUrl, (progress) => {
          setGenerationProgress(progress);
        });
        
        setSiteData(result);
        setAppState(AppState.Success);
        showNotification('success', 'Your premium site has been generated successfully!');
        
        // Track in database
        if (user) {
          await createWebsite({
            user_id: user.id,
            title: result.title,
            description: `Generated from ${pendingUrl}`,
            repo_url: pendingUrl,
            generation_mode: 'quick',
            template: result.template,
            tier: result.tier || 'premium',
            site_data: result,
            status: 'active'
          });
          
          await trackEvent({
            event_type: 'premium_site_created',
            event_data: { mode: 'quick', template: result.template }
          });
        }
      } else {
        // Deep analysis mode
        const deepAnalyzer = new DeepAnalysisOrchestrator(import.meta.env.VITE_GITHUB_TOKEN);
        const result = await deepAnalyzer.generateDeepSite(pendingUrl, (progress) => {
          setGenerationProgress({
            stage: progress.stage,
            progress: progress.progress,
            message: progress.message
          });
        });
        
        setDeepSiteData(result);
        setAppState(AppState.Success);
        showNotification('success', 'Deep analysis complete! Your enterprise-grade site is ready.');
      }
    } catch (err) {
      console.error('Generation failed:', err);
      setError(err instanceof Error ? err.message : 'Generation failed');
      setAppState(AppState.Error);
      showNotification('error', 'Failed to generate site. Please try again.');
    } finally {
      setGenerationProgress(null);
    }
  }, [pendingUrl, user, showNotification]);
  
  // Handle Auth Success
  const handleAuthSuccess = useCallback(() => {
    setShowAuth(false);
    if (pendingUrl) {
      setShowGenerator(true);
    }
    showNotification('success', 'Welcome to Project4Site Premium!');
  }, [pendingUrl, showNotification]);
  
  // Reset Application
  const handleReset = useCallback(() => {
    setAppState(AppState.Idle);
    setSiteData(null);
    setDeepSiteData(null);
    setError(null);
    setPendingUrl('');
    setGenerationProgress(null);
  }, []);
  
  return (
    <div ref={containerRef} className="premium-app-container">
      {/* Premium Background Effects */}
      <div className="premium-background-wrapper">
        <motion.div 
          className="premium-background-gradient"
          style={{ y: backgroundY }}
        />
        <PremiumParticleField mousePosition={mousePosition} />
        <div className="premium-noise-overlay" />
      </div>
      
      {/* Premium Navigation */}
      <PremiumNavigation user={user} profile={profile} />
      
      {/* Main Content */}
      <motion.main 
        className="premium-main-content"
        style={{ scale: contentScale }}
      >
        <AnimatePresence mode="wait">
          {appState === AppState.Idle && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            >
              <PremiumHero onGenerateRequest={handleGenerateRequest} />
              <PremiumFeatures />
              <PremiumShowcase />
            </motion.div>
          )}
          
          {appState === AppState.Loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="premium-loading-container"
            >
              <PremiumLoader progress={generationProgress} />
            </motion.div>
          )}
          
          {appState === AppState.Success && (siteData || deepSiteData) && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            >
              <PremiumSitePreview 
                siteData={siteData || deepSiteData}
                onReset={handleReset}
              />
            </motion.div>
          )}
          
          {appState === AppState.Error && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="premium-error-container"
            >
              <div className="premium-glass premium-error-card">
                <h2 className="premium-heading-2">Something went wrong</h2>
                <p className="premium-body premium-text-muted">{error}</p>
                <button 
                  onClick={handleReset}
                  className="premium-button premium-button-primary"
                >
                  Try Again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.main>
      
      {/* Premium Footer */}
      <PremiumFooter />
      
      {/* Premium Modals */}
      <AnimatePresence>
        {showAuth && (
          <PremiumAuthModal
            onClose={() => setShowAuth(false)}
            onSuccess={handleAuthSuccess}
          />
        )}
        
        {showGenerator && (
          <PremiumGeneratorModal
            url={pendingUrl}
            onClose={() => setShowGenerator(false)}
            onGenerate={handleGenerationStart}
            userTier={profile?.tier || 'free'}
          />
        )}
        
        {notification && (
          <PremiumNotification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const PremiumApp: React.FC = () => {
  return (
    <AuthProvider>
      <PremiumAppContent />
    </AuthProvider>
  );
};

export default PremiumApp;