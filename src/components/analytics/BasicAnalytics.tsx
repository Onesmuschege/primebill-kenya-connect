
import React, { useEffect } from 'react';

interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

class Analytics {
  private static instance: Analytics;
  private isEnabled: boolean = false;

  private constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production';
  }

  static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  initialize(trackingId?: string) {
    if (!trackingId || !this.isEnabled) return;

    // Google Analytics 4 setup
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
    document.head.appendChild(script);

    const configScript = document.createElement('script');
    configScript.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${trackingId}');
    `;
    document.head.appendChild(configScript);
  }

  trackEvent({ action, category, label, value }: AnalyticsEvent) {
    if (!this.isEnabled) {
      console.log('Analytics Event:', { action, category, label, value });
      return;
    }

    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value
      });
    }
  }

  trackPageView(path: string) {
    if (!this.isEnabled) {
      console.log('Analytics Page View:', path);
      return;
    }

    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', 'GA_TRACKING_ID', {
        page_path: path
      });
    }
  }
}

export const analytics = Analytics.getInstance();

// React hook for easy analytics tracking
export const useAnalytics = () => {
  const trackEvent = (event: AnalyticsEvent) => {
    analytics.trackEvent(event);
  };

  const trackPageView = (path: string) => {
    analytics.trackPageView(path);
  };

  // Track user interactions
  const trackUserAction = (action: string, details?: Record<string, any>) => {
    analytics.trackEvent({
      action,
      category: 'User Interaction',
      label: JSON.stringify(details)
    });
  };

  // Track business events
  const trackBusinessEvent = (event: string, value?: number) => {
    analytics.trackEvent({
      action: event,
      category: 'Business',
      value
    });
  };

  return {
    trackEvent,
    trackPageView,
    trackUserAction,
    trackBusinessEvent
  };
};

// Component to initialize analytics
export const AnalyticsProvider: React.FC<{ trackingId?: string; children: React.ReactNode }> = ({
  trackingId,
  children
}) => {
  useEffect(() => {
    if (trackingId) {
      analytics.initialize(trackingId);
    }
  }, [trackingId]);

  return <>{children}</>;
};
