
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Footer } from '@/components/landing/Footer';
import { LoadingIndicator } from '@/components/generator/LoadingIndicator';
import { SitePreview } from '@/components/generator/SitePreview'; 
import { Alert } from '@/components/ui/Alert';
import { SiteData } from '@/types'; // Adjusted path if types are in src/types
import { motion } from 'framer-motion';

const POLLING_INTERVAL = 5000; // 5 seconds for polling

export default function SitePreviewPage() {
  const router = useRouter();
  const { siteId } = router.query;
  
  const [siteData, setSiteData] = useState<SiteData | null>(null);
  const [pageStatus, setPageStatus] = useState<'loading' | 'processing' | 'error' | 'success'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchSiteData = useCallback(async (currentSiteId: string) => {
    if (!currentSiteId) return;

    try {
      const response = await fetch(`/api/site-data/${currentSiteId}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404 && data.status === 'NOT_FOUND') {
          setErrorMessage(`Site with ID ${currentSiteId} not found. It might still be initializing.`);
          setPageStatus('error'); // Or 'processing' if we expect it to appear
        } else if (response.status === 202 && (data.status === 'PENDING_ANALYSIS' || data.status === 'ANALYSIS_IN_PROGRESS')) {
          setPageStatus('processing');
          setErrorMessage(data.error || 'Site analysis is in progress. Please wait...');
        } else if (data.status === 'ERROR') {
          setErrorMessage(data.error || 'An error occurred while processing this site.');
          setPageStatus('error');
        } else {
          setErrorMessage(data.error || `Failed to load site data (HTTP ${response.status})`);
          setPageStatus('error');
        }
        setSiteData(null); // Clear previous data on error/processing
      } else {
        setSiteData(data as SiteData);
        setPageStatus('success');
        setErrorMessage(null);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setErrorMessage(err instanceof Error ? err.message : "An unknown error occurred while fetching site data.");
      setPageStatus('error');
      setSiteData(null);
    }
  }, []);

  useEffect(() => {
    if (siteId && typeof siteId === 'string') {
      setPageStatus('loading'); // Initial load attempt
      fetchSiteData(siteId);
    } else if (router.isReady && !siteId) {
      setErrorMessage("No site ID provided in the URL.");
      setPageStatus('error');
    }
  }, [siteId, router.isReady, fetchSiteData]);

  useEffect(() => {
    let intervalId: number | null = null;
    if (siteId && typeof siteId === 'string' && (pageStatus === 'processing' || (pageStatus === 'error' && errorMessage?.includes('not found')))) {
      // Start polling if status is processing or if it's an initial "not found" error (might appear after github-app-service creates the row)
      intervalId = setInterval(() => {
        fetchSiteData(siteId as string);
      }, POLLING_INTERVAL);
    }
    
    // Clear interval if data is successfully loaded or a non-recoverable error occurs
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [siteId, pageStatus, fetchSiteData, errorMessage]);


  const handleResetAndGoHome = () => {
    router.push('/'); 
  };

  if (pageStatus === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 text-slate-100 p-4">
        <LoadingIndicator message={`Loading preview for site ${siteId}...`} />
        <Footer />
      </div>
    );
  }

  if (pageStatus === 'processing') {
     return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 text-slate-100 p-4">
        <LoadingIndicator message={errorMessage || `Site analysis for ${siteId} is in progress. The page will update automatically...`} />
         <p className="text-slate-400 mt-4 text-sm">This might take a few moments. Polling for updates...</p>
        <Footer />
      </div>
    );
  }

  if (pageStatus === 'error' || !siteData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 text-slate-100 p-4 text-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Alert type="error" message={errorMessage || "Could not load site data."} className="max-w-lg mx-auto"/>
          <button
              onClick={handleResetAndGoHome}
              className="mt-6 bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
              Back to Home
          </button>
        </motion.div>
        <Footer />
      </div>
    );
  }
  
  // pageStatus === 'success' and siteData is available
  return <SitePreview siteData={siteData} onReset={handleResetAndGoHome} error={null} />;
}