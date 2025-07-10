
import { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/AuthForm';
import { LazyDashboard } from '@/components/lazy/LazyDashboard';
import { LazyUserDashboard } from '@/components/lazy/LazyUserDashboard';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SkipToContent } from '@/components/ui/skip-to-content';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" aria-hidden="true"></div>
        <span className="sr-only">Loading application...</span>
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

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthProvider>
            <div className="min-h-screen w-full">
              <SkipToContent />
              <AppContent />
              <Toaster />
            </div>
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
