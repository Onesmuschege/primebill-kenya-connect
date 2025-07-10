
import { useCallback } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  context?: string;
}

export const useErrorHandler = () => {
  const { showError } = useNotifications();

  const handleError = useCallback((
    error: Error | unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      logError = true,
      context = 'Operation'
    } = options;

    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    if (logError) {
      console.error(`[${context}] Error:`, error);
    }

    if (showToast) {
      showError(`${context} failed`, errorMessage);
    }

    // In production, you might want to send this to an error reporting service
    // Example: Sentry.captureException(error, { tags: { context } });
  }, [showError]);

  return { handleError };
};
