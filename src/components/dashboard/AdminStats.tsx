
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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 animate-fade-in">
      <Card className="hover:shadow-glow-cyan transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium font-mono text-cyan-400">TOTAL CLIENTS</CardTitle>
          <Shield className="h-4 w-4 text-neonBlue" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-neonGreen font-mono">{stats.totalClients}</div>
          <p className="text-xs text-gray-400 font-mono mt-1">Active users</p>
        </CardContent>
      </Card>
      
      <Card className="hover:shadow-glow-green transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium font-mono text-cyan-400">SUBSCRIPTIONS</CardTitle>
          <Activity className="h-4 w-4 text-neonGreen animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-neonBlue font-mono">{stats.activeSubscriptions}</div>
          <p className="text-xs text-gray-400 font-mono mt-1">Active plans</p>
        </CardContent>
      </Card>
      
      <Card className="hover:shadow-glow-purple transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium font-mono text-cyan-400">REVENUE</CardTitle>
          <DollarSign className="h-4 w-4 text-cyberPurple" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-cyberPurple font-mono">KES {stats.totalRevenue.toLocaleString()}</div>
          <p className="text-xs text-gray-400 font-mono mt-1">Total earned</p>
        </CardContent>
      </Card>
      
      <Card className="hover:shadow-glow-cyan transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium font-mono text-cyan-400">PENDING</CardTitle>
          <Database className="h-4 w-4 text-neonBlue" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-400 font-mono">{stats.pendingPayments}</div>
          <p className="text-xs text-gray-400 font-mono mt-1">Awaiting payment</p>
        </CardContent>
      </Card>
      
      <Card className="hover:shadow-glow-green transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium font-mono text-cyan-400">ROUTERS</CardTitle>
          <Network className="h-4 w-4 text-neonGreen" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-neonGreen font-mono">{stats.onlineRouters}</div>
          <p className="text-xs text-gray-400 font-mono mt-1">Online devices</p>
        </CardContent>
      </Card>
    </div>
  );
});

AdminStats.displayName = 'AdminStats';
