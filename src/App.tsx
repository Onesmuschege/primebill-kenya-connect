
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/AuthForm';
import { LazyDashboard } from '@/components/lazy/LazyDashboard';
import { LazyUserDashboard } from '@/components/lazy/LazyUserDashboard';
import { AuthErrorRecovery } from '@/components/AuthErrorRecovery';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SkipToContent } from '@/components/ui/skip-to-content';
import { AccessibilityProvider } from '@/components/accessibility/AccessibilityProvider';
import { AnalyticsProvider } from '@/components/analytics/BasicAnalytics';
import { FullPageLoader } from '@/components/ui/loading-states';

import './App.css';

// Debug component for development
const AuthDebugPanel = React.lazy(() => 
  import('@/components/debug/AuthHealthMonitor').then(module => ({
    default: module.AuthHealthMonitor
  }))
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error: unknown) => {
        // Don't retry on 4xx errors
        if (
          typeof error === 'object' &&
          error !== null &&
          'status' in error &&
          typeof (error as { status?: number }).status === 'number' &&
          (error as { status: number }).status >= 400 &&
          (error as { status: number }).status < 500
        ) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

function AppContent() {
  const { user, loading } = useAuth();
  const [showDebug, setShowDebug] = useState(false);

  // Show debug panel in development after 5 seconds of loading
  useEffect(() => {
    if (import.meta.env.DEV && loading) {
      const timer = setTimeout(() => setShowDebug(true), 5000);
      return () => clearTimeout(timer);
    } else {
      setShowDebug(false);
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <FullPageLoader message="Loading application..." />
        {showDebug && (
          <div className="mt-8 w-full max-w-2xl px-4">
            <React.Suspense fallback={<div>Loading debug panel...</div>}>
              <AuthDebugPanel />
            </React.Suspense>
          </div>
        )}
      </div>
    );
  }

  if (!user) {
    return (
      <main id="main-content" role="main">
        <AuthForm />
      </main>
    );
  }

  return (
    <main id="main-content" role="main">
      {user.role === 'admin' || user.role === 'subadmin' ? (
        <LazyDashboard />
      ) : (
        <LazyUserDashboard />
      )}
    </main>
  );
}

function App() {
  // Set up global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeydown = (event: KeyboardEvent) => {
      // Alt + M to skip to main content
      if (event.altKey && event.key === 'm') {
        event.preventDefault();
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
          mainContent.focus();
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeydown);
    return () => {
      document.removeEventListener('keydown', handleGlobalKeydown);
    };
  }, []);

  // CSP is handled in index.html, no need for duplicate setup

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AccessibilityProvider>
            <AnalyticsProvider trackingId="">{/* Remove env variable usage */}
              <AuthProvider>
                <div className="min-h-screen w-full">
                  <SkipToContent />
                  <AppContent />
                  <Toaster />
                </div>
              </AuthProvider>
            </AnalyticsProvider>
          </AccessibilityProvider>
        </Router>
        {import.meta.env.DEV && <ReactQueryDevtools />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}


export default App;
