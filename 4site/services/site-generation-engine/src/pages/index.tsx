
import React, { useState, useCallback } from 'react';
import Link from 'next/link'; // Import Link for navigation
import { HeroSection } from '@/components/landing/HeroSection'; 
import { FeaturesSection } from '@/components/landing/FeaturesSection'; 
import { DemoSection } from '@/components/landing/DemoSection'; 
import { Footer } from '@/components/landing/Footer'; 
import { LoadingIndicator } from '@/components/generator/LoadingIndicator'; 
import { Alert } from '@/components/ui/Alert'; 
import { motion, AnimatePresence } from 'framer-motion';


enum PortalState {
  Idle,
  Loading,
  Success, 
  Error,
}

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:4000';

export default function CreatorPortalPage() {
  const [portalState, setPortalState] = useState<PortalState>(PortalState.Idle);
  const [error, setError] = useState<string | null>(null);
  const [submittedRepoUrl, setSubmittedRepoUrl] = useState<string | null>(null);
  const [generatedProjectId, setGeneratedProjectId] = useState<string | null>(null);

  const handleGenerateSiteRequest = useCallback(async (url: string) => {
    if (!url.trim()) {
      setError("Please enter a valid GitHub repository URL.");
      setPortalState(PortalState.Error);
      return;
    }
    setSubmittedRepoUrl(url);
    setPortalState(PortalState.Loading);
    setError(null);
    setGeneratedProjectId(null);

    try {
      const response = await fetch(`${API_GATEWAY_URL}/api/initiate-generation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: url }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: "Failed to initiate generation. Server returned an invalid response." }));
        throw new Error(errData.message || errData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      setGeneratedProjectId(result.projectId);
      setPortalState(PortalState.Success);
    } catch (err) {
      console.error("Error submitting site generation request:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`Failed to submit request: ${errorMessage}`);
      setPortalState(PortalState.Error);
    }
  }, []);

  const handleReset = () => {
    setPortalState(PortalState.Idle);
    setError(null);
    setSubmittedRepoUrl(null);
    setGeneratedProjectId(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 text-slate-100">
      <AnimatePresence mode="wait">
        {portalState === PortalState.Idle && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-grow flex flex-col"
          >
            <HeroSection onGenerateSite={handleGenerateSiteRequest} />
            <FeaturesSection />
            <DemoSection />
          </motion.div>
        )}

        {portalState === PortalState.Loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-grow flex items-center justify-center p-4"
          >
            <LoadingIndicator message={`Submitting ${submittedRepoUrl || 'your project'} for processing... This might take a moment.`} />
          </motion.div>
        )}
        
        {portalState === PortalState.Success && generatedProjectId && ( // Ensure generatedProjectId is available
           <motion.div
            key="success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-grow flex flex-col items-center justify-center p-4 text-center"
          >
            <div className="max-w-md w-full bg-slate-800 p-8 rounded-xl shadow-2xl">
              <h2 className="text-2xl font-semibold text-sky-300 mb-3">Request Submitted!</h2>
              <p className="text-slate-300 mb-2">
                Your request for repository <strong className="text-teal-400">{submittedRepoUrl}</strong> has been successfully queued for processing.
              </p>
              <p className="text-slate-400 text-sm mb-4">Project ID: <code className="bg-slate-700 p-1 rounded text-sky-300">{generatedProjectId}</code></p>
              <p className="text-slate-400 text-sm mb-6">
                Your site preview will be available shortly. You can check its status or view it once ready:
              </p>
              <Link href={`/preview/${generatedProjectId}`} legacyBehavior>
                <a className="inline-block bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-150 mb-4">
                  View Preview (updates live)
                </a>
              </Link>
              <button
                onClick={handleReset}
                className="mt-4 w-full bg-primary hover:bg-primary-dark text-primary-foreground font-semibold py-2 px-4 rounded-lg transition-colors duration-150"
              >
                Generate Another Site
              </button>
            </div>
          </motion.div>
        )}
        
        {portalState === PortalState.Error && (
          <motion.div
            key="error_full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-grow flex flex-col items-center justify-center p-4"
          >
            <div className="max-w-md w-full">
              <Alert type="error" message={error || "An unexpected error occurred."} />
              <button
                onClick={handleReset}
                className="mt-4 w-full bg-primary hover:bg-primary-dark text-primary-foreground font-semibold py-2 px-4 rounded-lg transition-colors duration-150"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Footer />
    </div>
  );
}
    