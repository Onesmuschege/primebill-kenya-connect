
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  CreditCard, 
  Wifi, 
  TrendingUp, 
  Calendar,
  Shield,
  Network,
  Database,
  DollarSign,
  Activity
} from 'lucide-react';

interface DashboardStats {
  totalClients: number;
  activeSubscriptions: number;
  totalRevenue: number;
  pendingPayments: number;
  onlineRouters: number;
}

interface AdminStatsProps {
  stats: DashboardStats;
}

export const AdminStats = React.memo(({ stats }: AdminStatsProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 animate-fade-in">
      <Card className="professional-card border-l-4 border-isp-blue-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Total Clients</CardTitle>
          <Users className="h-5 w-5 text-isp-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">{stats.totalClients}</div>
          <p className="text-xs text-gray-500 mt-1">Registered users</p>
        </CardContent>
      </Card>
      
      <Card className="professional-card border-l-4 border-isp-teal-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Active Subscriptions</CardTitle>
          <Activity className="h-5 w-5 text-isp-teal-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">{stats.activeSubscriptions}</div>
          <p className="text-xs text-gray-500 mt-1">Active plans</p>
        </CardContent>
      </Card>
      
      <Card className="professional-card border-l-4 border-green-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          <DollarSign className="h-5 w-5 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">
            {formatCurrency(stats.totalRevenue)}
          </div>
          <p className="text-xs text-gray-500 mt-1">Total earnings</p>
        </CardContent>
      </Card>
      
      <Card className="professional-card border-l-4 border-isp-coral-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Pending Payments</CardTitle>
          <CreditCard className="h-5 w-5 text-isp-coral-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">{stats.pendingPayments}</div>
          <p className="text-xs text-gray-500 mt-1">Payments due</p>
        </CardContent>
      </Card>
      
      <Card className="professional-card border-l-4 border-purple-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Online Routers</CardTitle>
          <Wifi className="h-5 w-5 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">{stats.onlineRouters}</div>
          <p className="text-xs text-gray-500 mt-1">Network devices</p>
        </CardContent>
      </Card>
    </div>
  );
});

AdminStats.displayName = 'AdminStats';
