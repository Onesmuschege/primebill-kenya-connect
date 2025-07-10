
import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

const Dashboard = React.lazy(() => import('@/components/Dashboard').then(module => ({ default: module.Dashboard })));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen" role="status" aria-label="Loading dashboard">
    <Loader2 className="h-8 w-8 animate-spin" />
    <span className="sr-only">Loading dashboard...</span>
  </div>
);

export const LazyDashboard: React.FC = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Dashboard />
    </Suspense>
  );
};
