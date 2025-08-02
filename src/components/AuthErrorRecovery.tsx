import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface AuthErrorRecoveryProps {
  show: boolean;
  onRecover: () => void;
}

export const AuthErrorRecovery = ({ show, onRecover }: AuthErrorRecoveryProps) => {
  const { clearInvalidSession } = useAuth();

  if (!show) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Authentication Issue Detected</CardTitle>
          <CardDescription>
            We've detected an issue with your session. This usually happens when your login has expired or become corrupted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={clearInvalidSession} 
            className="w-full"
            variant="destructive"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Clear Session & Retry
          </Button>
          <Button 
            onClick={onRecover} 
            variant="outline" 
            className="w-full"
          >
            Try Again
          </Button>
          <div className="text-xs text-muted-foreground text-center">
            This will sign you out and clear your stored session data.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};