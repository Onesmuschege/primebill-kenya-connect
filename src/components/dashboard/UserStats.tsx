
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Wifi } from 'lucide-react';

interface UserStatsProps {
  subscription: {
    plans: {
      name: string;
      price_kes: number;
      speed_limit_mbps: number;
    };
    end_date: string;
  } | null;
  daysRemaining: number;
}

export const UserStats = React.memo(({ subscription, daysRemaining }: UserStatsProps) => {
  const getStatusColor = () => {
    if (daysRemaining <= 0) return 'destructive';
    if (daysRemaining <= 3) return 'secondary';
    return 'default';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
          <Wifi className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {subscription ? subscription.plans.name : 'No Plan'}
          </div>
          <p className="text-xs text-muted-foreground">
            {subscription ? `${subscription.plans.speed_limit_mbps} Mbps` : 'Select a plan'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Days Remaining</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {subscription ? Math.max(0, daysRemaining) : 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {subscription 
              ? `Expires ${new Date(subscription.end_date).toLocaleDateString()}`
              : 'No active subscription'
            }
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Status</CardTitle>
          <div className="h-4 w-4">
            <Badge variant={getStatusColor()} className="h-4 px-2 py-0 text-xs">
              {subscription 
                ? (daysRemaining > 0 ? 'Active' : 'Expired')
                : 'Inactive'
              }
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {subscription ? `KSh ${subscription.plans.price_kes}` : 'KSh 0'}
          </div>
          <p className="text-xs text-muted-foreground">Monthly cost</p>
        </CardContent>
      </Card>
    </div>
  );
});

UserStats.displayName = 'UserStats';
