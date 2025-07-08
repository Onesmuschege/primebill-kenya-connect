
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { PaymentForm } from './PaymentForm';
import { PaymentHistory } from './PaymentHistory';
import { Calendar, Wifi, CreditCard, User, Clock } from 'lucide-react';

interface Subscription {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  auto_renew: boolean;
  plans: {
    name: string;
    speed_limit_mbps: number;
    price_kes: number;
    validity_days: number;
  };
}

interface UserStats {
  activeSubscriptions: number;
  totalPayments: number;
  totalSpent: number;
}

export const UserDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<UserStats>({
    activeSubscriptions: 0,
    totalPayments: 0,
    totalSpent: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch subscriptions
      const { data: subscriptionsData, error: subsError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plans (
            name,
            speed_limit_mbps,
            price_kes,
            validity_days
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (subsError) throw subsError;
      setSubscriptions(subscriptionsData || []);

      // Fetch payment stats
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('amount_kes, status')
        .eq('user_id', user.id);

      if (paymentsError) throw paymentsError;

      const successfulPayments = paymentsData?.filter(p => p.status === 'success') || [];
      const totalSpent = successfulPayments.reduce((sum, payment) => sum + Number(payment.amount_kes), 0);

      setStats({
        activeSubscriptions: subscriptionsData?.filter(s => s.status === 'active').length || 0,
        totalPayments: successfulPayments.length,
        totalSpent,
      });
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      expired: 'destructive',
      suspended: 'secondary',
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name || user?.email}</h1>
          <p className="text-gray-600">Manage your internet subscriptions and payments</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPayments}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {stats.totalSpent.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Current Subscriptions */}
      {subscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Your Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subscriptions.map((subscription) => {
                const daysRemaining = getDaysRemaining(subscription.end_date);
                return (
                  <div key={subscription.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{subscription.plans.name}</h3>
                        <p className="text-sm text-gray-600">
                          {subscription.plans.speed_limit_mbps} Mbps • {subscription.plans.validity_days} days validity
                        </p>
                      </div>
                      {getStatusBadge(subscription.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Start Date:</span>
                        <div>{new Date(subscription.start_date).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">End Date:</span>
                        <div>{new Date(subscription.end_date).toLocaleDateString()}</div>
                      </div>
                      {subscription.status === 'active' && (
                        <div className="col-span-2">
                          <span className="text-gray-600">Days Remaining:</span>
                          <div className={`font-semibold ${daysRemaining <= 3 ? 'text-red-600' : 'text-green-600'}`}>
                            {daysRemaining > 0 ? `${daysRemaining} days` : 'Expired'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="purchase" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="purchase">Purchase Plan</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="purchase">
          <PaymentForm />
        </TabsContent>
        
        <TabsContent value="history">
          <PaymentHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};
