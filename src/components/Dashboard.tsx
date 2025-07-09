
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  CreditCard, 
  Wifi, 
  TrendingUp, 
  Settings, 
  LogOut,
  Phone,
  Mail,
  Calendar
} from 'lucide-react';
import { PlansManagement } from './PlansManagement';
import { ClientsManagement } from './ClientsManagement';
import { PaymentsManagement } from './PaymentsManagement';
import { RoutersManagement } from './RoutersManagement';
import UserDashboard from './UserDashboard';
import { ProfileManagement } from './ProfileManagement';

interface DashboardStats {
  totalClients: number;
  activeSubscriptions: number;
  totalRevenue: number;
  pendingPayments: number;
  onlineRouters: number;
}

export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    onlineRouters: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'subadmin') {
      fetchDashboardStats();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      const [clientsResult, subscriptionsResult, paymentsResult, routersResult] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }).eq('role', 'client'),
        supabase.from('subscriptions').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('payments').select('amount_kes').eq('status', 'success'),
        supabase.from('routers').select('id', { count: 'exact' }).eq('status', 'online'),
      ]);

      const totalRevenue = paymentsResult.data?.reduce((sum, payment) => sum + Number(payment.amount_kes), 0) || 0;
      const pendingPayments = await supabase.from('payments').select('id', { count: 'exact' }).eq('status', 'pending');

      setStats({
        totalClients: clientsResult.count || 0,
        activeSubscriptions: subscriptionsResult.count || 0,
        totalRevenue,
        pendingPayments: pendingPayments.count || 0,
        onlineRouters: routersResult.count || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: 'default',
      subadmin: 'secondary',
      client: 'outline',
    } as const;
    
    return (
      <Badge variant={variants[role as keyof typeof variants] || 'outline'}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Wifi className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">PrimeBill Solutions</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">Welcome back,</div>
                <div className="font-medium text-gray-900 flex items-center gap-2">
                  {user?.name || user?.email}
                  {user?.role && getRoleBadge(user.role)}
                </div>
              </div>
              <Button variant="outline" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Role Check */}
        {user?.role === 'client' ? (
          <ClientDashboard />
        ) : (
          <AdminDashboard stats={stats} userRole={user?.role} />
        )}
      </div>
    </div>
  );
};

const ClientDashboard = () => {
  return (
    <Tabs defaultValue="dashboard" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger value="profile">Profile</TabsTrigger>
      </TabsList>
      
      <TabsContent value="dashboard">
        <UserDashboard />
      </TabsContent>
      
      <TabsContent value="profile">
        <ProfileManagement />
      </TabsContent>
    </Tabs>
  );
};

const AdminDashboard = ({ stats, userRole }: { stats: DashboardStats; userRole?: string }) => {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {stats.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Routers</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.onlineRouters}</div>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="clients" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          {userRole === 'admin' && <TabsTrigger value="routers">Routers</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="clients">
          <ClientsManagement />
        </TabsContent>
        
        <TabsContent value="plans">
          <PlansManagement />
        </TabsContent>
        
        <TabsContent value="payments">
          <PaymentsManagement />
        </TabsContent>
        
        {userRole === 'admin' && (
          <TabsContent value="routers">
            <RoutersManagement />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
