// Analytics service for tracking user interactions
interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
}

class AnalyticsService {
  private queue: AnalyticsEvent[] = [];
  private isEnabled = true;

  constructor() {
    // Check if analytics should be disabled (dev mode, user preference, etc.)
    this.isEnabled = !import.meta.env.DEV;
    
    // Batch send events every 5 seconds
    if (this.isEnabled) {
      setInterval(() => this.flush(), 5000);
    }
  }

  track(event: AnalyticsEvent) {
    if (!this.isEnabled) {
      console.log('[Analytics]', event);
      return;
    }

    this.queue.push({
      ...event,
      timestamp: Date.now(),
    });

    // Flush if queue is getting large
    if (this.queue.length >= 20) {
      this.flush();
    }
  }

  // Convenience methods
  pageView(page: string, metadata?: Record<string, any>) {
    this.track({
      category: 'Navigation',
      action: 'PageView',
      label: page,
      metadata,
    });
  }

  videoAction(action: string, videoId?: string, metadata?: Record<string, any>) {
    this.track({
      category: 'Video',
      action,
      label: videoId,
      metadata,
    });
  }

  userAction(action: string, label?: string, metadata?: Record<string, any>) {
    this.track({
      category: 'User',
      action,
      label,
      metadata,
    });
  }

  private async flush() {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      // In production, send to analytics endpoint
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });
    } catch (error) {
      // Re-queue events on failure
      this.queue = [...events, ...this.queue];
      console.error('Failed to send analytics:', error);
    }
  }
}

export const analytics = new AnalyticsService();