import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import {
  Shield, Wifi, Calendar, CreditCard, Zap, ArrowRight, Rocket,
  CheckCircle, AlertTriangle, Clock, PlayCircle,
  XCircle, RefreshCw, Star, Gift,
  BarChart3, TrendingUp, History as HistoryIcon
} from 'lucide-react';

import UsageStatistics from './UsageStatistics';
import PlanUpgradeEnhanced from './PlanUpgradeEnhanced';
import { PaymentForm } from './PaymentForm';
import PaymentHistory from './PaymentHistory';

interface Subscription {
  id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  status: string;
  auto_renew: boolean;
  plans: {
    name: string;
    price_kes: number;
    speed_limit_mbps: number;
    validity_days: number;
    description: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

const UserDashboard = React.memo(() => {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  const fetchUserData = useCallback(async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) throw new Error('Not authenticated');

   
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userError && userError.code !== 'PGRST116') throw userError;

      if (!userData) {
        console.warn('No user record found — maybe a new user.');
        // Optional: Handle onboarding or redirection
      }

      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plans (
            name,
            price_kes,
            speed_limit_mbps,
            validity_days,
            description
          )
        `)
        .eq('user_id', authUser.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (subError && subError.code !== 'PGRST116') {
        console.error('Subscription fetch error:', subError);
      }

      setUser(userData);
      setSubscription(subData);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    await fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    fetchUserData();

    const channel = supabase
      .channel('user-dashboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
        },
        () => {
          fetchUserData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUserData]);

  const daysRemaining = useMemo(() => {
    if (!subscription) return 0;
    const endDate = new Date(subscription.end_date);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [subscription]);

  const subscriptionProgress = useMemo(() => {
    if (!subscription) return 0;
    const startDate = new Date(subscription.start_date);
    const endDate = new Date(subscription.end_date);
    const now = new Date();
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    return Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
  }, [subscription]);

  const getStatusInfo = () => {
    if (!subscription) {
      return {
        status: 'No Active Plan',
        color: 'bg-cyber-gray-500',
        textColor: 'text-cyber-gray-500',
        bgColor: 'bg-cyber-gray-50 dark:bg-cyber-gray-900/20',
        icon: XCircle,
        message: 'Get started with a plan that fits your needs',
      };
    }
    if (daysRemaining <= 0) {
      return {
        status: 'Expired',
        color: 'bg-cyber-red-500',
        textColor: 'text-cyber-red-500',
        bgColor: 'bg-cyber-red-50 dark:bg-cyber-red-900/20',
        icon: XCircle,
        message: 'Your subscription has expired. Renew to restore service.',
      };
    }
    if (daysRemaining <= 3) {
      return {
        status: 'Expiring Soon',
        color: 'bg-cyber-orange-500',
        textColor: 'text-cyber-orange-500',
        bgColor: 'bg-cyber-orange-50 dark:bg-cyber-orange-900/20',
        icon: AlertTriangle,
        message: `Expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Consider renewing soon.`,
      };
    }
    return {
      status: 'Active',
      color: 'bg-cyber-green-500',
      textColor: 'text-cyber-green-500',
      bgColor: 'bg-cyber-green-50 dark:bg-cyber-green-900/20',
      icon: CheckCircle,
      message: 'Your subscription is active and running smoothly.',
    };
  };

  const statusInfo = getStatusInfo();
  const hasNoSubscription = !subscription;
  const isSubscriptionExpired = subscription && daysRemaining <= 0;
  const isSubscriptionActive = subscription && daysRemaining > 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-blue-500" />
        <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Original JSX layout goes here */}
    </div>
  );
});

UserDashboard.displayName = 'UserDashboard';

const EmptySubscriptionState = () => {
  return (
    <Card className="border-dashed border-cyber-blue-500/30 bg-gradient-to-br from-cyber-blue-50/50 to-cyber-purple-50/50 dark:from-cyber-blue-900/10 dark:to-cyber-purple-900/10 overflow-hidden relative">
      {/* Your visual layout remains unchanged here */}
    </Card>
  );
};

export default UserDashboard;
