
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PlanOverviewProps {
  subscription: {
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
      description?: string;
    };
  } | null;
}

export const PlanOverview = React.memo(({ subscription }: PlanOverviewProps) => {
  return (
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
  );
});

PlanOverview.displayName = 'PlanOverview';
