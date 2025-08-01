import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PaymentForm } from './PaymentForm';
import { PaymentHistory } from './PaymentHistory';
import UsageStatistics from './UsageStatistics';
import PlanUpgradeEnhanced from './PlanUpgradeEnhanced';
import { 
  Shield, 
  Wifi, 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  Settings,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Users,
  ArrowRight,
  PlayCircle,
  Rocket,
  Star,
  Gift,
  Home,
  BarChart3,
  Package,
  History,
  ChevronRight,
  Menu,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
        message: 'Get started with a plan that fits your needs'
      };
    }
    
    if (daysRemaining <= 0) {
      return {
        status: 'Expired',
        color: 'bg-cyber-red-500',
        textColor: 'text-cyber-red-500',
        bgColor: 'bg-cyber-red-50 dark:bg-cyber-red-900/20',
        icon: XCircle,
        message: 'Your subscription has expired. Renew to restore service.'
      };
    }
    
    if (daysRemaining <= 3) {
      return {
        status: 'Expiring Soon',
        color: 'bg-cyber-orange-500',
        textColor: 'text-cyber-orange-500',
        bgColor: 'bg-cyber-orange-50 dark:bg-cyber-orange-900/20',
        icon: AlertTriangle,
        message: `Expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Consider renewing soon.`
      };
    }
    
    return {
      status: 'Active',
      color: 'bg-cyber-green-500',
      textColor: 'text-cyber-green-500',
      bgColor: 'bg-cyber-green-50 dark:bg-cyber-green-900/20',
      icon: CheckCircle,
      message: 'Your subscription is active and running smoothly.'
    };
  };

  const statusInfo = getStatusInfo();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-blue-500 mx-auto"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-cyber-black-500 via-cyber-gray-800 to-cyber-blue-900 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="space-y-2">
              <h1 className="text-3xl font-heading font-bold text-white">
                Welcome back, {user?.name || 'User'}
              </h1>
              <p className="text-cyber-blue-200">
                Manage your internet subscription and explore our services
              </p>
              {/* Breadcrumb */}
              <div className="flex items-center space-x-2 text-sm text-cyber-blue-300">
                <Home className="h-4 w-4" />
                <ChevronRight className="h-4 w-4" />
                <span>Dashboard</span>
                <ChevronRight className="h-4 w-4" />
                <span className="text-white">Overview</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={refreshData} 
                disabled={refreshing} 
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Badge className="bg-cyber-blue-500/20 text-cyber-blue-200 border-cyber-blue-500/30">
                <Shield className="h-3 w-3 mr-1" />
                Secure Connection
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Alert */}
        <div className={`rounded-xl p-6 mb-8 border ${statusInfo.bgColor} border-${statusInfo.color.replace('bg-', '')}/20`}>
          <div className="flex items-start space-x-4">
            <div className={`p-2 rounded-full ${statusInfo.color}/10`}>
              <statusInfo.icon className={`h-6 w-6 ${statusInfo.textColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-foreground">
                  Subscription Status: {statusInfo.status}
                </h3>
                <Badge className={`${statusInfo.color} text-white`}>
                  {statusInfo.status}
                </Badge>
              </div>
              <p className="text-muted-foreground mb-4">{statusInfo.message}</p>
              {!subscription && (
                <Button 
                  onClick={() => setActiveTab('plans')}
                  className="bg-cyber-blue-600 hover:bg-cyber-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 mobile-touch"
                >
                  <Rocket className="h-4 w-4 mr-2" />
                  Explore Plans
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
              {subscription && daysRemaining <= 3 && (
                <Button 
                  onClick={() => setActiveTab('payments')}
                  className="bg-cyber-orange-600 hover:bg-cyber-orange-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 mobile-touch"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Renew Now
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {/* Current Plan Card */}
          <Card className="cyber-card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Current Plan</CardTitle>
              <div className={`p-2 rounded-full ${subscription ? 'bg-cyber-blue-500/10' : 'bg-cyber-gray-500/10'}`}>
                <Wifi className={`h-4 w-4 ${subscription ? 'text-cyber-blue-500' : 'text-cyber-gray-500'}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1">
                {subscription ? subscription.plans.name : 'No Active Plan'}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {subscription 
                    ? `${subscription.plans.speed_limit_mbps} Mbps speed`
                    : 'Choose a plan to get started'
                  }
                </p>
                {!subscription && (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setActiveTab('plans')}
                    className="text-cyber-blue-500 hover:text-cyber-blue-600 p-0 h-auto"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Days Remaining Card */}
          <Card className="cyber-card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Days Remaining</CardTitle>
              <div className={`p-2 rounded-full ${daysRemaining > 3 ? 'bg-cyber-green-500/10' : daysRemaining > 0 ? 'bg-cyber-orange-500/10' : 'bg-cyber-red-500/10'}`}>
                <Calendar className={`h-4 w-4 ${daysRemaining > 3 ? 'text-cyber-green-500' : daysRemaining > 0 ? 'text-cyber-orange-500' : 'text-cyber-red-500'}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1">
                {subscription ? Math.max(0, daysRemaining) : '—'}
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {subscription 
                    ? `Expires ${new Date(subscription.end_date).toLocaleDateString()}`
                    : 'No active subscription'
                  }
                </p>
                {subscription && (
                  <Progress 
                    value={subscriptionProgress} 
                    className="h-1" 
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Cost Card */}
          <Card className="cyber-card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Cost</CardTitle>
              <div className={`p-2 rounded-full ${subscription ? 'bg-cyber-purple-500/10' : 'bg-cyber-gray-500/10'}`}>
                <CreditCard className={`h-4 w-4 ${subscription ? 'text-cyber-purple-500' : 'text-cyber-gray-500'}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1">
                {subscription ? `KSh ${subscription.plans.price_kes.toLocaleString()}` : 'KSh 0'}
              </div>
              <p className="text-xs text-muted-foreground">
                {subscription ? 'Current plan pricing' : 'Select a plan to see pricing'}
              </p>
            </CardContent>
          </Card>

          {/* Quick Action Card */}
          <Card className="cyber-card-hover border-dashed border-cyber-blue-500/30 bg-cyber-blue-50/50 dark:bg-cyber-blue-900/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-cyber-blue-600">Quick Actions</CardTitle>
              <div className="p-2 rounded-full bg-cyber-blue-500/10">
                <Star className="h-4 w-4 text-cyber-blue-500" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {!subscription ? (
                <Button 
                  size="sm" 
                  onClick={() => setActiveTab('plans')}
                  className="w-full bg-cyber-blue-600 hover:bg-cyber-blue-700 text-white shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 mobile-touch"
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Get Started
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setActiveTab('payments')}
                    className="w-full border-cyber-blue-500/50 text-cyber-blue-600 hover:bg-cyber-blue-50 hover:border-cyber-blue-500 transform hover:scale-105 transition-all duration-200 mobile-touch"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Renew
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setActiveTab('plans')}
                    className="w-full border-cyber-purple-500/50 text-cyber-purple-600 hover:bg-cyber-purple-50 hover:border-cyber-purple-500 transform hover:scale-105 transition-all duration-200 mobile-touch"
                  >
                    <Gift className="h-4 w-4 mr-2" />
                    Upgrade
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-border">
            <nav className="-mb-px flex space-x-8 overflow-x-auto scrollbar-hide">
              {[
                { id: 'overview', label: 'Overview', icon: Home },
                { id: 'usage', label: 'Usage', icon: BarChart3 },
                { id: 'plans', label: 'Plans', icon: Package },
                { id: 'payments', label: 'Payments', icon: CreditCard },
                { id: 'history', label: 'History', icon: History },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors min-h-[44px] mobile-touch ${
                      activeTab === tab.id
                        ? 'border-cyber-blue-500 text-cyber-blue-600'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'overview' && (
            <OverviewTab subscription={subscription} user={user} />
          )}
          
          {activeTab === 'usage' && (
            <div>
              <UsageStatistics />
            </div>
          )}
          
          {activeTab === 'plans' && (
            <div>
              <PlanUpgradeEnhanced />
            </div>
          )}
          
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <PaymentForm />
            </div>
          )}
          
          {activeTab === 'history' && (
            <div>
              <PaymentHistory />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// Overview Tab Component
const OverviewTab = ({ subscription, user }: { subscription: Subscription | null; user: User | null }) => {
  const [isSubscriptionDetailsOpen, setIsSubscriptionDetailsOpen] = useState(true);
  const [isActivityOpen, setIsActivityOpen] = useState(true);
  const [isSecurityOpen, setIsSecurityOpen] = useState(true);
  const [isQuickLinksOpen, setIsQuickLinksOpen] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Subscription Details */}
        {subscription ? (
          <Collapsible open={isSubscriptionDetailsOpen} onOpenChange={setIsSubscriptionDetailsOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Wifi className="h-5 w-5 text-cyber-blue-500" />
                        <span>Active Subscription</span>
                        <span className="lg:hidden">
                          {isSubscriptionDetailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </span>
                      </CardTitle>
                      <CardDescription>Your current internet plan details</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-cyber-green-500 text-white">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                      <span className="hidden lg:inline">
                        {isSubscriptionDetailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </span>
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Plan Name</p>
                      <p className="font-semibold">{subscription.plans.name}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Speed</p>
                      <p className="font-semibold">{subscription.plans.speed_limit_mbps} Mbps</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Started</p>
                      <p className="font-semibold">{new Date(subscription.start_date).toLocaleDateString()}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Expires</p>
                      <p className="font-semibold">{new Date(subscription.end_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Auto-renewal</span>
                      <Badge variant={subscription.auto_renew ? 'default' : 'secondary'}>
                        {subscription.auto_renew ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ) : (
          <EmptySubscriptionState />
        )}

        {/* Recent Activity */}
        <Collapsible open={isActivityOpen} onOpenChange={setIsActivityOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-cyber-purple-500" />
                      <span>Recent Activity</span>
                      <span className="lg:hidden">
                        {isActivityOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </span>
                    </CardTitle>
                    <CardDescription>Your latest account activities</CardDescription>
                  </div>
                  <span className="hidden lg:inline">
                    {isActivityOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </span>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded-full bg-cyber-green-500/10">
                  <CheckCircle className="h-4 w-4 text-cyber-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Dashboard accessed</p>
                  <p className="text-xs text-muted-foreground">Just now</p>
                </div>
              </div>
              {subscription && (
                <div className="flex items-center space-x-4 p-3 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-full bg-cyber-blue-500/10">
                    <Wifi className="h-4 w-4 text-cyber-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Subscription active</p>
                    <p className="text-xs text-muted-foreground">
                      Since {new Date(subscription.start_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Security Status */}
        <Collapsible open={isSecurityOpen} onOpenChange={setIsSecurityOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-cyber-blue-500" />
                    <span>Security</span>
                  </CardTitle>
                  {isSecurityOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Account Security</span>
                  <Badge className="bg-cyber-green-500 text-white">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Secure
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Connection</span>
                  <Badge className="bg-cyber-green-500 text-white">
                    <Shield className="h-3 w-3 mr-1" />
                    Encrypted
                  </Badge>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Quick Links */}
        <Collapsible open={isQuickLinksOpen} onOpenChange={setIsQuickLinksOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle>Quick Links</CardTitle>
                  {isQuickLinksOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start mobile-touch">
                  <Settings className="h-4 w-4 mr-2" />
                  Account Settings
                </Button>
                <Button variant="ghost" className="w-full justify-start mobile-touch">
                  <Users className="h-4 w-4 mr-2" />
                  Support Center
                </Button>
                <Button variant="ghost" className="w-full justify-start mobile-touch">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Usage Reports
                </Button>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </div>
  );
};

// Empty Subscription State Component
const EmptySubscriptionState = () => {
  return (
    <Card className="border-dashed border-cyber-blue-500/30 bg-gradient-to-br from-cyber-blue-50/50 to-cyber-purple-50/50 dark:from-cyber-blue-900/10 dark:to-cyber-purple-900/10 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-4 left-4 w-20 h-20 bg-cyber-blue-500 rounded-full animate-pulse"></div>
        <div className="absolute bottom-4 right-4 w-16 h-16 bg-cyber-purple-500 rounded-full animate-pulse animation-delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-12 h-12 bg-cyber-orange-500 rounded-full animate-pulse animation-delay-700"></div>
      </div>
      
      <CardContent className="p-8 text-center relative z-10">
        <div className="max-w-md mx-auto space-y-6">
          {/* Animated icon */}
          <div className="relative">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-cyber-blue-500/20 to-cyber-purple-500/20 rounded-full flex items-center justify-center animate-bounce">
              <div className="w-16 h-16 bg-cyber-blue-500/10 rounded-full flex items-center justify-center">
                <Rocket className="h-10 w-10 text-cyber-blue-500 animate-pulse" />
              </div>
            </div>
            {/* Floating elements */}
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-cyber-orange-500/20 rounded-full animate-ping"></div>
            <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-cyber-purple-500/20 rounded-full animate-ping animation-delay-300"></div>
          </div>
          
          {/* Enhanced content */}
          <div className="space-y-3">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-cyber-blue-600 to-cyber-purple-600 bg-clip-text text-transparent">
              Ready to Get Connected?
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Looks like you haven't activated a plan yet—let's get you started with lightning-fast internet that powers your digital life!
            </p>
          </div>
          
          {/* Enhanced action buttons */}
          <div className="space-y-3">
            <Button className="w-full bg-gradient-to-r from-cyber-blue-600 to-cyber-blue-700 hover:from-cyber-blue-700 hover:to-cyber-blue-800 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 mobile-touch">
              <PlayCircle className="h-5 w-5 mr-2" />
              Explore Our Plans
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button variant="outline" className="w-full border-cyber-purple-500/50 text-cyber-purple-600 hover:bg-cyber-purple-50 hover:border-cyber-purple-500 transition-all duration-200 mobile-touch">
              <Users className="h-5 w-5 mr-2" />
              Get Expert Help
            </Button>
          </div>
          
          {/* Value proposition */}
          <div className="pt-4 border-t border-cyber-blue-200/50">
            <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Zap className="h-4 w-4 text-cyber-orange-500" />
                <span>Ultra-fast speeds</span>
              </div>
              <div className="flex items-center space-x-1">
                <Shield className="h-4 w-4 text-cyber-green-500" />
                <span>Secure connection</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

UserDashboard.displayName = 'UserDashboard';

export default UserDashboard;
