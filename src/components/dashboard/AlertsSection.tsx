
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface AlertsSectionProps {
  subscription: {
    end_date: string;
  } | null;
  daysRemaining: number;
}

export const AlertsSection = React.memo(({ subscription, daysRemaining }: AlertsSectionProps) => {
  if (!subscription) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <AlertTriangle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          You don't have an active subscription. Choose a plan to get started.
        </AlertDescription>
      </Alert>
    );
  }

  if (daysRemaining <= 0) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Your subscription has expired. Please renew to restore service.
        </AlertDescription>
      </Alert>
    );
  }

  if (daysRemaining <= 3) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          Your subscription expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}. 
          Consider renewing to avoid service interruption.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
});

AlertsSection.displayName = 'AlertsSection';
