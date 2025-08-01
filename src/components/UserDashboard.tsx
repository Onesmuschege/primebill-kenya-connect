import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PaymentForm } from './PaymentForm';
import { PaymentHistory } from './PaymentHistory';
import UsageStatistics from './UsageStatistics';
import PlanUpgradeEnhanced from './PlanUpgradeEnhanced';
import { UserStats } from './dashboard/UserStats';
import { PlanOverview } from './dashboard/PlanOverview';
import { QuickActions } from './dashboard/QuickActions';
import { AlertsSection } from './dashboard/AlertsSection';
import SupabaseTest from './SupabaseTest';
import PlansTest from './PlansTest';
import SupabaseClientTest from './SupabaseClientTest';
import ReactQueryTest from './ReactQueryTest';

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
  const { toast } = useToast();

  const fetchUserData = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        throw new Error('Not authenticated');
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userError) throw userError;

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
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
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

  const handleRenewSubscription = useCallback(() => {
    toast({
      title: "Renew Subscription",
      description: "Feature coming soon!",
    });
  }, [toast]);

  const handleUpgradePlan = useCallback(() => {
    toast({
      title: "Upgrade Plan",
      description: "Feature coming soon!",
    });
  }, [toast]);

  const handleManageAutoRenewal = useCallback(() => {
    toast({
      title: "Manage Auto-renewal",
      description: "Feature coming soon!",
    });
  }, [toast]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-gray-900">
            Welcome, {user?.name}
          </h2>
          <p className="text-gray-600">Manage your internet subscription and account</p>
        </div>
        <Button 
          onClick={refreshData} 
          disabled={refreshing} 
          variant="outline"
          className="bg-white hover:bg-isp-gray-50"
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Alerts */}
      <AlertsSection subscription={subscription} daysRemaining={daysRemaining} />

      {/* Quick Stats */}
      <UserStats subscription={subscription} daysRemaining={daysRemaining} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-white shadow-soft border">
          <TabsTrigger value="overview" className="data-[state=active]:bg-cyber-blue-600 data-[state=active]:text-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="usage" className="data-[state=active]:bg-cyber-blue-600 data-[state=active]:text-white">
            Usage
          </TabsTrigger>
          <TabsTrigger value="plans" className="data-[state=active]:bg-cyber-blue-600 data-[state=active]:text-white">
            Plans
          </TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:bg-cyber-blue-600 data-[state=active]:text-white">
            Payments
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-cyber-blue-600 data-[state=active]:text-white">
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PlanOverview subscription={subscription} />
            <QuickActions 
              onRenewSubscription={handleRenewSubscription}
              onUpgradePlan={handleUpgradePlan}
              onManageAutoRenewal={handleManageAutoRenewal}
            />
          </div>
        </TabsContent>

        <TabsContent value="usage">
          <UsageStatistics />
        </TabsContent>

        <TabsContent value="plans">
          <PlanUpgradeEnhanced />
        </TabsContent>

        <TabsContent value="payments">
          <div className="space-y-6">
            <PaymentForm />
          </div>
        </TabsContent>

        <TabsContent value="history">
          <PaymentHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
});

UserDashboard.displayName = 'UserDashboard';

export default UserDashboard;
