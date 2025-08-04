import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';

interface SessionManagerConfig {
  timeoutMinutes: number;
  warningMinutes: number;
  checkIntervalSeconds: number;
}

const DEFAULT_CONFIG: SessionManagerConfig = {
  timeoutMinutes: 30,
  warningMinutes: 5,
  checkIntervalSeconds: 60,
};

export const useSessionManager = (config: Partial<SessionManagerConfig> = {}) => {
  const { user, signOut } = useAuth();
  const { showWarning } = useNotifications();
  const [lastActivity, setLastActivity] = useState<Date>(new Date());
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const updateLastActivity = useCallback(() => {
    setLastActivity(new Date());
    setShowTimeoutWarning(false);
  }, []);

  const checkAccountStatus = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('check_account_status', {
        user_id: user.id
      });

      if (error) {
        console.error('Account status check failed:', error);
        return;
      }

      const result = data as { allowed: boolean; reason?: string; require_password_change?: boolean };
      
      if (!result?.allowed) {
        showWarning('Account Status', `Your account is ${result.reason}. Please contact support.`);
        await signOut();
        return;
      }

      if (result.require_password_change) {
        showWarning('Security Notice', 'You must change your password to continue.');
        // TODO: Redirect to password change page
      }
    } catch (error) {
      console.error('Account status check error:', error);
    }
  }, [user, showWarning, signOut]);

  const checkSessionTimeout = useCallback(() => {
    if (!user) return;

    const now = new Date();
    const timeSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60); // minutes

    const warningTime = finalConfig.timeoutMinutes - finalConfig.warningMinutes;
    const timeoutTime = finalConfig.timeoutMinutes;

    if (timeSinceActivity >= timeoutTime) {
      showWarning('Session Expired', 'Your session has expired. Please log in again.');
      signOut();
    } else if (timeSinceActivity >= warningTime && !showTimeoutWarning) {
      setShowTimeoutWarning(true);
      showWarning(
        'Session Warning', 
        `Your session will expire in ${Math.ceil(timeoutTime - timeSinceActivity)} minutes.`
      );
    }
  }, [user, lastActivity, finalConfig, showTimeoutWarning, showWarning, signOut]);

  const extendSession = useCallback(async () => {
    try {
      const { error } = await supabase.auth.refreshSession();
      if (!error) {
        updateLastActivity();
      }
    } catch (error) {
      console.error('Session extension failed:', error);
    }
  }, [updateLastActivity]);

  // Track user activity
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => updateLastActivity();
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [user, updateLastActivity]);

  // Periodic checks
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      checkSessionTimeout();
      checkAccountStatus();
    }, finalConfig.checkIntervalSeconds * 1000);

    return () => clearInterval(interval);
  }, [user, checkSessionTimeout, checkAccountStatus, finalConfig.checkIntervalSeconds]);

  return {
    lastActivity,
    showTimeoutWarning,
    extendSession,
    updateLastActivity,
    timeUntilTimeout: Math.max(0, finalConfig.timeoutMinutes - (new Date().getTime() - lastActivity.getTime()) / (1000 * 60))
  };
};