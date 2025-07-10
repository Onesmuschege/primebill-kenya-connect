
import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

const UserDashboard = React.lazy(() => import('@/components/UserDashboard'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen" role="status" aria-label="Loading user dashboard">
    <Loader2 className="h-8 w-8 animate-spin" />
    <span className="sr-only">Loading user dashboard...</span>
  </div>
);

export const LazyUserDashboard: React.FC = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <UserDashboard />
    </Suspense>
  );
};
