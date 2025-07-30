
import { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/AuthForm';
import { LazyDashboard } from '@/components/lazy/LazyDashboard';
import { LazyUserDashboard } from '@/components/lazy/LazyUserDashboard';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SkipToContent } from '@/components/ui/skip-to-content';
import { AccessibilityProvider } from '@/components/accessibility/AccessibilityProvider';
import { AnalyticsProvider } from '@/components/analytics/BasicAnalytics';
import { FullPageLoader } from '@/components/ui/loading-states';
import { createCSPHeader } from '@/lib/security';
import './App.css';

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

  if (loading) {
    return <FullPageLoader message="Loading application..." />;
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

  // Set up security headers
  useEffect(() => {
    const cspHeader = createCSPHeader();
    const metaCSP = document.createElement('meta');
    metaCSP.httpEquiv = 'Content-Security-Policy';
    metaCSP.content = cspHeader;
    document.head.appendChild(metaCSP);
    return () => {
      document.head.removeChild(metaCSP);
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AccessibilityProvider>
            <AnalyticsProvider trackingId={import.meta.env.VITE_GA_TRACKING_ID}>
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
