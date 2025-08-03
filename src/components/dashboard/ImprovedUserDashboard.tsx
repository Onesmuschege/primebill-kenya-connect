
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PaymentForm } from '@/components/PaymentForm';
import PaymentHistory from '@/components/PaymentHistory';
import UsageStatistics from '@/components/UsageStatistics';
import PlanUpgrade from '@/components/PlanUpgrade';
import { UserStats } from '@/components/dashboard/UserStats';
import { PlanOverview } from '@/components/dashboard/PlanOverview';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { AlertsSection } from '@/components/dashboard/AlertsSection';
import { FullPageLoader, ComponentLoader } from '@/components/ui/loading-states';
import { useAnalytics } from '@/components/analytics/BasicAnalytics';
import { useErrorHandler } from '@/hooks/useErrorHandler';

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

const ImprovedUserDashboard = React.memo(() => {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  const { trackUserAction, trackPageView } = useAnalytics();
  const { handleError } = useErrorHandler();

  useEffect(() => {
    trackPageView('/dashboard');
  }, [trackPageView]);

  const fetchUserData = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        throw new Error('Not authenticated');
      }

      // Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userError) throw userError;

      // Fetch active subscription with plan details
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
        .maybeSingle();

      if (subError && subError.code !== 'PGRST116') {
        console.error('Subscription fetch error:', subError);
      }

      setUser(userData);
      setSubscription(subData);
      
      trackUserAction('dashboard_data_loaded', {
        hasSubscription: !!subData,
        subscriptionStatus: subData?.status
      });
    } catch (error) {
      handleError(error, { context: 'Dashboard data loading' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [handleError, trackUserAction]);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    trackUserAction('dashboard_refresh');
    await fetchUserData();
  }, [fetchUserData, trackUserAction]);

  useEffect(() => {
    fetchUserData();

    // Set up real-time subscription for subscription updates
    const channel = supabase
      .channel('user-dashboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions'
        },
        (payload) => {
          console.log('Subscription update:', payload);
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
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [subscription]);

  // Quick action handlers with analytics
  const handleRenewSubscription = useCallback(() => {
    trackUserAction('renew_subscription_clicked');
    setActiveTab('payments');
    toast({
      title: "Renew Subscription",
      description: "Navigate to the payments tab to renew your subscription.",
    });
  }, [trackUserAction, toast]);

  const handleUpgradePlan = useCallback(() => {
    trackUserAction('upgrade_plan_clicked');
    setActiveTab('plans');
    toast({
      title: "Upgrade Plan",
      description: "Navigate to the plans tab to upgrade your subscription.",
    });
  }, [trackUserAction, toast]);

  const handleManageAutoRenewal = useCallback(() => {
    trackUserAction('manage_auto_renewal_clicked');
    toast({
      title: "Manage Auto-renewal",
      description: "Auto-renewal management coming soon!",
    });
  }, [trackUserAction, toast]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    trackUserAction('tab_changed', { tab });
  }, [trackUserAction]);

  if (loading) {
    return <FullPageLoader message="Loading your dashboard..." />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
            <p className="text-muted-foreground">Manage your internet subscription</p>
          </div>
          <Button 
            onClick={refreshData} 
            disabled={refreshing} 
            variant="outline"
            aria-label="Refresh dashboard data"
          >
            {refreshing ? <ComponentLoader size="sm" /> : 'Refresh'}
          </Button>
        </div>

        {/* Alerts */}
        <AlertsSection subscription={subscription} daysRemaining={daysRemaining} />

        {/* Quick Stats */}
        <UserStats subscription={subscription} daysRemaining={daysRemaining} />

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5" role="tablist">
            <TabsTrigger value="overview" role="tab" aria-selected={activeTab === 'overview'}>
              Overview
            </TabsTrigger>
            <TabsTrigger value="usage" role="tab" aria-selected={activeTab === 'usage'}>
              Usage
            </TabsTrigger>
            <TabsTrigger value="plans" role="tab" aria-selected={activeTab === 'plans'}>
              Plans
            </TabsTrigger>
            <TabsTrigger value="payments" role="tab" aria-selected={activeTab === 'payments'}>
              Payments
            </TabsTrigger>
            <TabsTrigger value="history" role="tab" aria-selected={activeTab === 'history'}>
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4" role="tabpanel">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PlanOverview subscription={subscription} />
              <QuickActions 
                onRenewSubscription={handleRenewSubscription}
                onUpgradePlan={handleUpgradePlan}
                onManageAutoRenewal={handleManageAutoRenewal}
              />
            </div>
          </TabsContent>

          <TabsContent value="usage" role="tabpanel">
            <React.Suspense fallback={<ComponentLoader message="Loading usage statistics..." />}>
              <UsageStatistics />
            </React.Suspense>
          </TabsContent>

          <TabsContent value="plans" role="tabpanel">
            <React.Suspense fallback={<ComponentLoader message="Loading available plans..." />}>
              <PlanUpgrade />
            </React.Suspense>
          </TabsContent>

          <TabsContent value="payments" role="tabpanel">
            <div className="space-y-6">
              <React.Suspense fallback={<ComponentLoader message="Loading payment form..." />}>
                <PaymentForm />
              </React.Suspense>
            </div>
          </TabsContent>

          <TabsContent value="history" role="tabpanel">
            <React.Suspense fallback={<ComponentLoader message="Loading payment history..." />}>
              <PaymentHistory />
            </React.Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
});

ImprovedUserDashboard.displayName = 'ImprovedUserDashboard';

export default ImprovedUserDashboard;
