import { useState, useEffect, useCallback, useRef } from 'react';
import { AB_TEST_VARIANTS } from '../constants';

export interface JourneyEvent {
  type: 'page_view' | 'interaction' | 'milestone' | 'conversion' | 'exit_intent';
  timestamp: number;
  data: Record<string, any>;
  sessionId: string;
}

export interface UserJourneyMetrics {
  sessionDuration: number;
  interactionCount: number;
  scrollDepth: number;
  engagementScore: number;
  conversionProbability: number;
}

export interface UseUserJourneyOptions {
  enableTracking?: boolean;
  trackScrollDepth?: boolean;
  trackExitIntent?: boolean;
  sessionTimeoutMs?: number;
}

export const useUserJourney = (options: UseUserJourneyOptions = {}) => {
  const {
    enableTracking = true,
    trackScrollDepth = true,
    trackExitIntent = true,
    sessionTimeoutMs = 30 * 60 * 1000 // 30 minutes
  } = options;

  // Generate session ID
  const sessionId = useRef(
    `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  );

  // Core state
  const [events, setEvents] = useState<JourneyEvent[]>([]);
  const [metrics, setMetrics] = useState<UserJourneyMetrics>({
    sessionDuration: 0,
    interactionCount: 0,
    scrollDepth: 0,
    engagementScore: 0,
    conversionProbability: 0
  });

  // A/B test assignment
  const [abTestAssignments] = useState(() => ({
    messaging: AB_TEST_VARIANTS.MESSAGING[Math.floor(Math.random() * AB_TEST_VARIANTS.MESSAGING.length)],
    ctaStyle: AB_TEST_VARIANTS.CTA_STYLE[Math.floor(Math.random() * AB_TEST_VARIANTS.CTA_STYLE.length)],
    successFlow: AB_TEST_VARIANTS.SUCCESS_FLOW[Math.floor(Math.random() * AB_TEST_VARIANTS.SUCCESS_FLOW.length)]
  }));

  // Session start time
  const sessionStartTime = useRef(Date.now());

  // Track event
  const trackEvent = useCallback((type: JourneyEvent['type'], data: Record<string, any> = {}) => {
    if (!enableTracking) return;

    const event: JourneyEvent = {
      type,
      timestamp: Date.now(),
      data: {
        ...data,
        abTestAssignments,
        sessionDuration: Date.now() - sessionStartTime.current
      },
      sessionId: sessionId.current
    };

    setEvents(prev => [...prev, event]);

    // Update metrics
    setMetrics(prev => {
      const sessionDuration = Date.now() - sessionStartTime.current;
      const interactionCount = prev.interactionCount + (type === 'interaction' ? 1 : 0);
      
      // Calculate engagement score
      const engagementScore = calculateEngagementScore({
        sessionDuration,
        interactionCount,
        scrollDepth: prev.scrollDepth,
        eventCount: events.length + 1
      });

      // Calculate conversion probability
      const conversionProbability = calculateConversionProbability({
        engagementScore,
        sessionDuration,
        interactionCount,
        events: [...events, event]
      });

      return {
        sessionDuration,
        interactionCount,
        scrollDepth: prev.scrollDepth,
        engagementScore,
        conversionProbability
      };
    });

    // Log for analytics (in production, send to analytics service)
    console.log('[UserJourney] Event tracked:', event);
  }, [enableTracking, abTestAssignments, events]);

  // Scroll depth tracking
  useEffect(() => {
    if (!trackScrollDepth) return;

    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollDepth = Math.round((scrollTop / docHeight) * 100);

      setMetrics(prev => ({
        ...prev,
        scrollDepth: Math.max(prev.scrollDepth, scrollDepth)
      }));

      // Track scroll milestones
      if (scrollDepth >= 25 && scrollDepth < 50) {
        trackEvent('milestone', { type: 'scroll_25' });
      } else if (scrollDepth >= 50 && scrollDepth < 75) {
        trackEvent('milestone', { type: 'scroll_50' });
      } else if (scrollDepth >= 75) {
        trackEvent('milestone', { type: 'scroll_75' });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [trackScrollDepth, trackEvent]);

  // Exit intent tracking
  useEffect(() => {
    if (!trackExitIntent) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        trackEvent('exit_intent', { 
          position: { x: e.clientX, y: e.clientY },
          sessionDuration: Date.now() - sessionStartTime.current
        });
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [trackExitIntent, trackEvent]);

  // Page visibility tracking
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        trackEvent('interaction', { type: 'page_hidden' });
      } else {
        trackEvent('interaction', { type: 'page_visible' });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [trackEvent]);

  // Session timeout
  useEffect(() => {
    const timeout = setTimeout(() => {
      trackEvent('milestone', { type: 'session_timeout' });
    }, sessionTimeoutMs);

    return () => clearTimeout(timeout);
  }, [sessionTimeoutMs, trackEvent]);

  // Convenience methods for common tracking scenarios
  const trackPageView = useCallback((page: string) => {
    trackEvent('page_view', { page });
  }, [trackEvent]);

  const trackInteraction = useCallback((element: string, action: string, data?: Record<string, any>) => {
    trackEvent('interaction', { element, action, ...data });
  }, [trackEvent]);

  const trackMilestone = useCallback((milestone: string, data?: Record<string, any>) => {
    trackEvent('milestone', { milestone, ...data });
  }, [trackEvent]);

  const trackConversion = useCallback((type: string, value?: number, data?: Record<string, any>) => {
    trackEvent('conversion', { type, value, ...data });
  }, [trackEvent]);

  // Get session summary for analytics
  const getSessionSummary = useCallback(() => {
    const sessionDuration = Date.now() - sessionStartTime.current;
    const eventTypes = events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      sessionId: sessionId.current,
      sessionDuration,
      totalEvents: events.length,
      eventTypes,
      metrics,
      abTestAssignments,
      startTime: sessionStartTime.current,
      endTime: Date.now()
    };
  }, [events, metrics, abTestAssignments]);

  return {
    // State
    events,
    metrics,
    abTestAssignments,
    sessionId: sessionId.current,

    // Tracking methods
    trackEvent,
    trackPageView,
    trackInteraction,
    trackMilestone,
    trackConversion,

    // Analytics
    getSessionSummary,

    // Computed properties
    sessionDuration: metrics.sessionDuration,
    engagementScore: metrics.engagementScore,
    conversionProbability: metrics.conversionProbability,
    isHighEngagement: metrics.engagementScore > 70,
    isConversionReady: metrics.conversionProbability > 60
  };
};

// Helper function to calculate engagement score
function calculateEngagementScore({
  sessionDuration,
  interactionCount,
  scrollDepth,
  eventCount
}: {
  sessionDuration: number;
  interactionCount: number;
  scrollDepth: number;
  eventCount: number;
}): number {
  // Base scores
  const timeScore = Math.min(30, sessionDuration / 1000 / 60 * 10); // Max 30 points for 3+ minutes
  const interactionScore = Math.min(25, interactionCount * 2.5); // Max 25 points for 10+ interactions
  const scrollScore = Math.min(20, scrollDepth / 5); // Max 20 points for 100% scroll
  const activityScore = Math.min(25, eventCount * 1.25); // Max 25 points for 20+ events

  return Math.round(timeScore + interactionScore + scrollScore + activityScore);
}

// Helper function to calculate conversion probability
function calculateConversionProbability({
  engagementScore,
  sessionDuration,
  interactionCount,
  events
}: {
  engagementScore: number;
  sessionDuration: number;
  interactionCount: number;
  events: JourneyEvent[];
}): number {
  let probability = 0;

  // Base probability from engagement
  probability += engagementScore * 0.6; // 60% weight

  // Time on site bonus
  if (sessionDuration > 120000) probability += 15; // 2+ minutes
  if (sessionDuration > 300000) probability += 10; // 5+ minutes

  // Interaction depth bonus
  if (interactionCount > 5) probability += 10;
  if (interactionCount > 10) probability += 5;

  // Event pattern analysis
  const hasGenerationEvent = events.some(e => e.type === 'milestone' && e.data.type?.includes('generation'));
  const hasDeploymentEvent = events.some(e => e.type === 'milestone' && e.data.type?.includes('deployment'));
  const hasExitIntent = events.some(e => e.type === 'exit_intent');

  if (hasGenerationEvent) probability += 20;
  if (hasDeploymentEvent) probability += 25;
  if (hasExitIntent) probability -= 15; // Exit intent reduces probability

  return Math.min(100, Math.max(0, Math.round(probability)));
}