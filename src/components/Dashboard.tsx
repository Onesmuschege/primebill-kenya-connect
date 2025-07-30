
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PlansManagement } from './PlansManagement';
import { ClientsManagementEnhanced } from './ClientsManagementEnhanced';
import { PaymentsManagement } from './PaymentsManagement';
import { RoutersManagement } from './RoutersManagement';
import UserDashboard from './UserDashboard';
import { ProfileManagement } from './ProfileManagement';
import { NotificationCenter } from './NotificationCenter';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useNotifications } from '@/hooks/useNotifications';
import { AdminStats } from './dashboard/AdminStats';
import { Header } from '@/components/ui/header';
import { Footer } from '@/components/ui/footer';

interface DashboardStats {
  totalClients: number;
  activeSubscriptions: number;
  totalRevenue: number;
  pendingPayments: number;
  onlineRouters: number;
}

export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { showError } = useNotifications();
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
      const [clientsRes, subscriptionsRes, paymentsRes, routersRes] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('payments').select('amount_kes').eq('status', 'completed'),
        supabase.from('routers').select('id, online_status', { count: 'exact' })
      ]);

      const totalRevenue = paymentsRes.data?.reduce((sum, payment) => sum + payment.amount_kes, 0) || 0;
      const onlineRouters = routersRes.data?.filter(router => router.online_status).length || 0;

      setStats({
        totalClients: clientsRes.count || 0,
        activeSubscriptions: subscriptionsRes.count || 0,
        totalRevenue,
        pendingPayments: 0, // You might want to add a query for pending payments
        onlineRouters,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      showError('Error loading dashboard', 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingSpinner size="xl" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header 
        user={user}
        onSignOut={signOut}
        onProfileClick={() => {
          // Handle profile click - could navigate to profile page
        }}
        onSettingsClick={() => {
          // Handle settings click - could navigate to settings page
        }}
      />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* User Role Check */}
          {user?.role === 'client' ? (
            <ClientDashboard />
          ) : (
            <AdminDashboard stats={stats} userRole={user?.role} />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

const ClientDashboard = () => {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600">
          Manage your internet subscription and account settings
        </p>
      </div>
      
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-white shadow-soft border">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-isp-blue-600 data-[state=active]:text-white">
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="profile" className="data-[state=active]:bg-isp-blue-600 data-[state=active]:text-white">
            Profile
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard">
          <UserDashboard />
        </TabsContent>
        
        <TabsContent value="profile">
          <ProfileManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const AdminDashboard = ({ stats, userRole }: { stats: DashboardStats; userRole?: string }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Manage users, plans, payments, and network infrastructure
        </p>
      </div>

      {/* Stats Grid - Now using the AdminStats component */}
      <AdminStats stats={stats} />

      {/* Management Tabs */}
      <Tabs defaultValue="clients" className="space-y-6">
        <TabsList className={`grid w-full bg-white shadow-soft border ${
          userRole === 'admin' ? 'grid-cols-4' : 'grid-cols-3'
        }`}>
          <TabsTrigger value="clients" className="data-[state=active]:bg-isp-blue-600 data-[state=active]:text-white">
            Clients
          </TabsTrigger>
          <TabsTrigger value="plans" className="data-[state=active]:bg-isp-blue-600 data-[state=active]:text-white">
            Plans
          </TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:bg-isp-blue-600 data-[state=active]:text-white">
            Payments
          </TabsTrigger>
          {userRole === 'admin' && (
            <TabsTrigger value="routers" className="data-[state=active]:bg-isp-blue-600 data-[state=active]:text-white">
              Routers
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="clients">
          <ClientsManagementEnhanced />
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
