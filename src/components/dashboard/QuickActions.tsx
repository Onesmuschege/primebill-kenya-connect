
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, TrendingUp, Settings } from 'lucide-react';

interface QuickActionsProps {
  onRenewSubscription?: () => void;
  onUpgradePlan?: () => void;
  onManageAutoRenewal?: () => void;
}

export const QuickActions = React.memo(({ 
  onRenewSubscription, 
  onUpgradePlan, 
  onManageAutoRenewal 
}: QuickActionsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Manage your subscription</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          className="w-full" 
          size="sm"
          onClick={onRenewSubscription}
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Renew Subscription
        </Button>
        <Button 
          className="w-full" 
          variant="outline" 
          size="sm"
          onClick={onUpgradePlan}
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          Upgrade Plan
        </Button>
        <Button 
          className="w-full" 
          variant="outline" 
          size="sm"
          onClick={onManageAutoRenewal}
        >
          <Settings className="mr-2 h-4 w-4" />
          Manage Auto-renewal
        </Button>
      </CardContent>
    </Card>
  );
});

QuickActions.displayName = 'QuickActions';
