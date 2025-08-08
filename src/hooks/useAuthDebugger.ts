import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

interface DebugLog {
  timestamp: string;
  event: string;
  data: any;
  stack?: string;
}

export const useAuthDebugger = () => {
  const { user, session, loading } = useAuth();
  const logsRef = useRef<DebugLog[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const addDebugLog = (event: string, data: any) => {
    const log: DebugLog = {
      timestamp: new Date().toISOString(),
      event,
      data,
      stack: new Error().stack
    };
    
    logsRef.current.push(log);
    console.log(`[AUTH_DEBUG] ${event}:`, data);
    
    // Keep only last 50 logs
    if (logsRef.current.length > 50) {
      logsRef.current = logsRef.current.slice(-50);
    }
  };

  // Monitor auth state changes
  useEffect(() => {
    addDebugLog('AUTH_STATE_CHANGE', {
      hasUser: !!user,
      hasSession: !!session,
      loading,
      userRole: user?.role,
      userId: user?.id
    });
  }, [user, session, loading]);

  // Detect infinite loading
  useEffect(() => {
    if (loading) {
      timeoutRef.current = setTimeout(() => {
        addDebugLog('INFINITE_LOADING_DETECTED', {
          loadingDuration: '10+ seconds',
          logs: logsRef.current.slice(-10)
        });
        
        // Force a health check
        window.dispatchEvent(new CustomEvent('auth-health-check'));
      }, 10000);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [loading]);

  return {
    debugLogs: logsRef.current,
    addDebugLog,
    exportLogs: () => {
      const blob = new Blob([JSON.stringify(logsRef.current, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auth-debug-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };
};
