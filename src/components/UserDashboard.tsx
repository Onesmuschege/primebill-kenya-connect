
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PaymentForm } from './PaymentForm';
import { PaymentHistory } from './PaymentHistory';
import UsageStatistics from './UsageStatistics';
import PlanUpgrade from './PlanUpgrade';
import { UserStats } from './dashboard/UserStats';
import { PlanOverview } from './dashboard/PlanOverview';
import { QuickActions } from './dashboard/QuickActions';
import { AlertsSection } from './dashboard/AlertsSection';

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

  // Quick action handlers
  const handleRenewSubscription = useCallback(() => {
    // TODO: Implement renew subscription logic
    toast({
      title: "Renew Subscription",
      description: "Feature coming soon!",
    });
  }, [toast]);

  const handleUpgradePlan = useCallback(() => {
    // TODO: Navigate to plan upgrade section
    toast({
      title: "Upgrade Plan",
      description: "Feature coming soon!",
    });
  }, [toast]);

  const handleManageAutoRenewal = useCallback(() => {
    // TODO: Implement auto-renewal management
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
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
            <p className="text-muted-foreground">Manage your internet subscription</p>
          </div>
          <Button onClick={refreshData} disabled={refreshing} variant="outline">
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Alerts */}
        <AlertsSection subscription={subscription} daysRemaining={daysRemaining} />

        {/* Quick Stats */}
        <UserStats subscription={subscription} daysRemaining={daysRemaining} />

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<<<<<<< HEAD
              {/* Current Subscription Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Details</CardTitle>
                  <CardDescription>Your current plan information</CardDescription>
                </CardHeader>
                <CardContent>
                  {subscription ? (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Plan:</span>
                        <span className="font-medium">{subscription.plans.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Speed:</span>
                        <span className="font-medium">{subscription.plans.speed_limit_mbps} Mbps</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Started:</span>
                        <span className="font-medium">
                          {new Date(subscription.start_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Expires:</span>
                        <span className="font-medium">
                          {new Date(subscription.end_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Auto-renew:</span>
                        <Badge variant={subscription.auto_renew ? 'default' : 'secondary'}>
                          {subscription.auto_renew ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No active subscription</p>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Manage your subscription</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Added onClick handlers to implement subscription renewal and upgrade flows */}
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={async () => {
                      // Implement subscription renewal flow
                      if (!subscription) {
                        toast({
                          title: "No active subscription",
                          description: "You do not have an active subscription to renew.",
                          variant: "destructive",
                        });
                        return;
                      }
                      try {
                        // Example: Call a supabase function or API to initiate renewal
                        const { error } = await supabase.functions.invoke('subscription-renewal', {
                          body: JSON.stringify({ subscriptionId: subscription.id }),
                        });
                        if (error) throw error;
                        toast({
                          title: "Renewal initiated",
                          description: "Your subscription renewal has been initiated. Please check your email for confirmation.",
                          variant: "default",
                        });
                      } catch (error) {
                        toast({
                          title: "Renewal failed",
                          description: (error as Error).message || "Failed to initiate renewal.",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Renew Subscription
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // TODO: Implement plan upgrade flow
                      alert('Upgrade Plan flow to be implemented');
                    }}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Upgrade Plan
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // TODO: Implement auto-renewal management flow
                      alert('Manage Auto-renewal flow to be implemented');
                    }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Manage Auto-renewal
                  </Button>
                </CardContent>
              </Card>
=======
              <PlanOverview subscription={subscription} />
              <QuickActions 
                onRenewSubscription={handleRenewSubscription}
                onUpgradePlan={handleUpgradePlan}
                onManageAutoRenewal={handleManageAutoRenewal}
              />
>>>>>>> b341bd00c33c8a54f632767e643d4a6cb2101f34
            </div>
          </TabsContent>

          <TabsContent value="usage">
            <UsageStatistics />
          </TabsContent>

          <TabsContent value="plans">
            <PlanUpgrade />
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
    </div>
  );
});

UserDashboard.displayName = 'UserDashboard';

export default UserDashboard;
