
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  LogOut,
  Terminal,
  Network,
  Activity
} from 'lucide-react';
import { PlansManagement } from './PlansManagement';
import { ClientsManagement } from './ClientsManagement';
import { PaymentsManagement } from './PaymentsManagement';
import { RoutersManagement } from './RoutersManagement';
import UserDashboard from './UserDashboard';
import { ProfileManagement } from './ProfileManagement';
import { NotificationCenter } from './NotificationCenter';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useNotifications } from '@/hooks/useNotifications';
import { AdminStats } from './dashboard/AdminStats';

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
      <div className="flex items-center justify-center min-h-screen bg-[#0B0F1A]">
        <LoadingSpinner size="xl" text="Loading cybersecurity dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] grid-bg">
      {/* Cybersecurity Header */}
      <header className="bg-navy/90 backdrop-blur-md shadow-lg border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center terminal-glow">
              <Terminal className="h-8 w-8 text-terminalGreen mr-3 animate-pulse" />
              <Shield className="h-8 w-8 text-neonBlue mr-3" />
              <h1 className="text-2xl font-mono font-bold text-neonBlue tracking-wider">
                PRIMEBILL<span className="text-terminalGreen">_SYSTEMS</span>
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationCenter />
              <div className="text-right">
                <div className="text-sm text-gray-400 font-mono">AUTHENTICATED:</div>
                <div className="font-medium text-cyan-400 flex items-center gap-2 font-mono">
                  {user?.name || user?.email}
                  {user?.role && getRoleBadge(user.role)}
                </div>
              </div>
              <Button variant="outline" onClick={signOut} className="font-mono">
                <LogOut className="h-4 w-4 mr-2" />
                DISCONNECT
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Terminal status bar */}
      <div className="bg-black/40 border-b border-terminalGreen/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2 text-xs font-mono">
            <div className="flex items-center space-x-4">
              <span className="text-terminalGreen">root@cybersec:~$</span>
              <span className="text-cyan-400">Network Management Interface</span>
              <div className="flex items-center space-x-2">
                <Activity className="h-3 w-3 text-neonGreen animate-pulse" />
                <span className="text-neonGreen">ONLINE</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-400">TLS 1.3</span>
              <span className="text-neonBlue">ENCRYPTED</span>
              <Network className="h-3 w-3 text-cyan-400" />
            </div>
          </div>
        </div>
      </div>

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
    <div className="animate-fade-in">
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard" className="font-mono">DASHBOARD</TabsTrigger>
          <TabsTrigger value="profile" className="font-mono">PROFILE</TabsTrigger>
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
    <div className="space-y-6 animate-fade-in">
      {/* Stats Grid - Now using the AdminStats component */}
      <AdminStats stats={stats} />

      {/* Management Tabs */}
      <Tabs defaultValue="clients" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="clients" className="font-mono">CLIENTS</TabsTrigger>
          <TabsTrigger value="plans" className="font-mono">PLANS</TabsTrigger>
          <TabsTrigger value="payments" className="font-mono">PAYMENTS</TabsTrigger>
          {userRole === 'admin' && <TabsTrigger value="routers" className="font-mono">ROUTERS</TabsTrigger>}
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
