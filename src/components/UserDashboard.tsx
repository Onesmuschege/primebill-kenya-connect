import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PaymentForm } from './PaymentForm';
import { PaymentHistory } from './PaymentHistory';
import UsageStatistics from './UsageStatistics';
import PlanUpgradeEnhanced from './PlanUpgradeEnhanced';
import { 
  Wifi, 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  Settings, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Zap,
  Users,
  Activity,
  BarChart3,
  FileText,
  HelpCircle,
  RefreshCw,
  ArrowRight,
  Play,
  Pause,
  Star
} from 'lucide-react';

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

  const handleActivatePlan = useCallback(() => {
    toast({
      title: "Activate Plan",
      description: "Let's get you connected!",
    });
  }, [toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
              <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
            
            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isSubscriptionActive = subscription && daysRemaining > 0;
  const isSubscriptionExpired = subscription && daysRemaining <= 0;
  const hasNoSubscription = !subscription;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your internet subscription and stay connected
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={refreshData} 
                disabled={refreshing} 
                variant="outline"
                size="sm"
                className="bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>

          {/* Status Alerts */}
          {hasNoSubscription && (
            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
              <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                <strong>No active subscription found.</strong> Choose a plan to get started and enjoy high-speed internet!
              </AlertDescription>
            </Alert>
          )}

          {isSubscriptionExpired && (
            <Alert variant="destructive" className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription>
                <strong>Your subscription has expired.</strong> Renew now to restore your internet service.
              </AlertDescription>
            </Alert>
          )}

          {isSubscriptionActive && daysRemaining <= 3 && (
            <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                <strong>Subscription expiring soon!</strong> Your plan expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}. 
                Renew now to avoid service interruption.
              </AlertDescription>
            </Alert>
          )}

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Current Plan Status */}
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 dark:bg-blue-800 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Current Plan
                  </CardTitle>
                  <Wifi className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {subscription ? subscription.plans.name : 'No Plan'}
                  </div>
                  <div className="flex items-center gap-2">
                    {subscription ? (
                      <>
                        <Badge variant="secondary" className="text-xs">
                          {subscription.plans.speed_limit_mbps} Mbps
                        </Badge>
                        <Badge variant={isSubscriptionActive ? "default" : "destructive"} className="text-xs">
                          {isSubscriptionActive ? 'Active' : 'Expired'}
                        </Badge>
                      </>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Select a plan
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Days Remaining */}
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-200 dark:bg-green-800 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
                    Days Remaining
                  </CardTitle>
                  <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {subscription ? Math.max(0, daysRemaining) : '—'}
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    {subscription 
                      ? `Expires ${new Date(subscription.end_date).toLocaleDateString()}`
                      : 'No active subscription'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Cost */}
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200 dark:bg-purple-800 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    Monthly Cost
                  </CardTitle>
                  <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {subscription ? `KSh ${subscription.plans.price_kes.toLocaleString()}` : 'KSh 0'}
                  </div>
                  <p className="text-xs text-purple-700 dark:text-purple-300">
                    {subscription ? 'Current plan cost' : 'No active plan'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Connection Status */}
            <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
              <div className="absolute top-0 right-0 w-20 h-20 bg-orange-200 dark:bg-orange-800 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
                    Connection
                  </CardTitle>
                  <Zap className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {isSubscriptionActive ? (
                      <>
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-lg font-bold text-orange-900 dark:text-orange-100">
                          Connected
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        <span className="text-lg font-bold text-orange-900 dark:text-orange-100">
                          Disconnected
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-orange-700 dark:text-orange-300">
                    {isSubscriptionActive ? 'Internet active' : 'No active subscription'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Empty State for No Subscription */}
          {hasNoSubscription && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <CardContent className="p-12 text-center">
                <div className="mx-auto w-24 h-24 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mb-6">
                  <Wifi className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Ready to get connected?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                  Looks like you haven't activated a plan yet. Choose from our high-speed internet packages and get started in minutes!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={handleActivatePlan}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Explore Plans
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20"
                  >
                    <HelpCircle className="h-5 w-5 mr-2" />
                    Learn More
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 bg-white dark:bg-slate-800 shadow-lg border-0">
              <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <BarChart3 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="usage" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Activity className="h-4 w-4 mr-2" />
                Usage
              </TabsTrigger>
              <TabsTrigger value="plans" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <TrendingUp className="h-4 w-4 mr-2" />
                Plans
              </TabsTrigger>
              <TabsTrigger value="payments" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <CreditCard className="h-4 w-4 mr-2" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <FileText className="h-4 w-4 mr-2" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Subscription Details */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-bold">Subscription Details</CardTitle>
                        <CardDescription>Your current plan information and settings</CardDescription>
                      </div>
                      <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {subscription ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Plan Name</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">{subscription.plans.name}</p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Speed</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">{subscription.plans.speed_limit_mbps} Mbps</p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Started</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {new Date(subscription.start_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Expires</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {new Date(subscription.end_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Auto-renewal</span>
                            <Badge variant={subscription.auto_renew ? "default" : "secondary"}>
                              {subscription.auto_renew ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Wifi className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No active subscription</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
                    <CardDescription>Manage your subscription and account</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      className="w-full justify-start h-12 text-left" 
                      variant="outline"
                      onClick={handleRenewSubscription}
                      disabled={!subscription}
                    >
                      <CreditCard className="mr-3 h-5 w-5" />
                      <div className="flex-1">
                        <div className="font-medium">Renew Subscription</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Extend your current plan</div>
                      </div>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      className="w-full justify-start h-12 text-left" 
                      variant="outline"
                      onClick={handleUpgradePlan}
                    >
                      <TrendingUp className="mr-3 h-5 w-5" />
                      <div className="flex-1">
                        <div className="font-medium">Upgrade Plan</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Get faster speeds</div>
                      </div>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      className="w-full justify-start h-12 text-left" 
                      variant="outline"
                      onClick={handleManageAutoRenewal}
                      disabled={!subscription}
                    >
                      <Settings className="mr-3 h-5 w-5" />
                      <div className="flex-1">
                        <div className="font-medium">Auto-renewal Settings</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Manage automatic payments</div>
                      </div>
                      <ArrowRight className="h-4 w-4" />
                    </Button>

                    {hasNoSubscription && (
                      <Button 
                        className="w-full justify-start h-12 text-left bg-blue-600 hover:bg-blue-700 text-white" 
                        onClick={handleActivatePlan}
                      >
                        <Play className="mr-3 h-5 w-5" />
                        <div className="flex-1">
                          <div className="font-medium">Activate Plan</div>
                          <div className="text-sm opacity-90">Get started with internet</div>
                        </div>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
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
      </div>
    </div>
  );
});

UserDashboard.displayName = 'UserDashboard';

export default UserDashboard;
