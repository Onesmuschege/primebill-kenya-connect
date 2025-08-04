import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AuditEvent {
  action: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

export const useAuditLogger = () => {
  const { user } = useAuth();

  const logEvent = useCallback(async (event: AuditEvent) => {
    try {
      if (!user) return;

      await supabase.rpc('log_activity', {
        p_user_id: user.id,
        p_action: event.action,
        p_details: event.details ? JSON.stringify(event.details) : null,
        p_ip_address: event.ip_address || null,
        p_user_agent: event.user_agent || navigator.userAgent,
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }, [user]);

  const logLogin = useCallback(async (method: string = 'password') => {
    await logEvent({
      action: 'user_login',
      details: { method, timestamp: new Date().toISOString() }
    });
  }, [logEvent]);

  const logLogout = useCallback(async () => {
    await logEvent({
      action: 'user_logout',
      details: { timestamp: new Date().toISOString() }
    });
  }, [logEvent]);

  const logPasswordChange = useCallback(async () => {
    await logEvent({
      action: 'password_change',
      details: { timestamp: new Date().toISOString() }
    });
  }, [logEvent]);

  const logProfileUpdate = useCallback(async (updatedFields: string[]) => {
    await logEvent({
      action: 'profile_update',
      details: { fields: updatedFields, timestamp: new Date().toISOString() }
    });
  }, [logEvent]);

  const logPaymentAttempt = useCallback(async (planId: string, amount: number, status: 'success' | 'failed') => {
    await logEvent({
      action: 'payment_attempt',
      details: { planId, amount, status, timestamp: new Date().toISOString() }
    });
  }, [logEvent]);

  const logAccountAccess = useCallback(async (resource: string, action: 'view' | 'create' | 'update' | 'delete') => {
    await logEvent({
      action: 'account_access',
      details: { resource, action, timestamp: new Date().toISOString() }
    });
  }, [logEvent]);

  return {
    logEvent,
    logLogin,
    logLogout,
    logPasswordChange,
    logProfileUpdate,
    logPaymentAttempt,
    logAccountAccess,
  };
};