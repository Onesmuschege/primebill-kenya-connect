
import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

const PaymentHistory = React.lazy(() => import('@/components/PaymentHistory').then(module => ({ default: module.PaymentHistory })));

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8" role="status" aria-label="Loading payment history">
    <Loader2 className="h-6 w-6 animate-spin" />
    <span className="sr-only">Loading payment history...</span>
  </div>
);

export const LazyPaymentHistory: React.FC = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentHistory />
    </Suspense>
  );
};
