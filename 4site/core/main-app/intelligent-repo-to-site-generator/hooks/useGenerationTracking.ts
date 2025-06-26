import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const STORAGE_KEY = 'anonymous_generations';
const CONVERSION_THRESHOLD = 3;

export const useGenerationTracking = () => {
  const [anonymousGenerations, setAnonymousGenerations] = useState(0);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const { user } = useAuth();

  // Load stored count on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const count = parseInt(stored, 10);
        if (!isNaN(count) && count >= 0) {
          setAnonymousGenerations(count);
        }
      }
    } catch (error) {
      console.warn('Failed to load generation count from localStorage:', error);
    }
  }, []);

  // Track a new generation (only for anonymous users)
  const trackGeneration = useCallback(() => {
    if (!user) {
      const newCount = anonymousGenerations + 1;
      setAnonymousGenerations(newCount);
      
      try {
        localStorage.setItem(STORAGE_KEY, newCount.toString());
      } catch (error) {
        console.warn('Failed to save generation count to localStorage:', error);
      }
      
      // Show prompt after reaching threshold
      if (newCount >= CONVERSION_THRESHOLD) {
        setShowSignupPrompt(true);
      }
    }
  }, [user, anonymousGenerations]);

  // Reset tracking (called when user signs up)
  const resetAnonymousTracking = useCallback(() => {
    setAnonymousGenerations(0);
    setShowSignupPrompt(false);
    
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear generation count from localStorage:', error);
    }
  }, []);

  // Auto-reset when user authenticates
  useEffect(() => {
    if (user) {
      resetAnonymousTracking();
    }
  }, [user, resetAnonymousTracking]);

  return {
    anonymousGenerations,
    showSignupPrompt,
    setShowSignupPrompt,
    trackGeneration,
    resetAnonymousTracking,
    isAtThreshold: anonymousGenerations >= CONVERSION_THRESHOLD
  };
};