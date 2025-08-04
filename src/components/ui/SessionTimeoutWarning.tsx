import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Clock } from 'lucide-react';
import { useSessionManager } from '@/hooks/useSessionManager';

interface SessionTimeoutWarningProps {
  onExtend: () => void;
  onLogout: () => void;
  timeRemaining: number; // in minutes
}

export const SessionTimeoutWarning = ({ onExtend, onLogout, timeRemaining }: SessionTimeoutWarningProps) => {
  const [countdown, setCountdown] = useState(Math.ceil(timeRemaining));

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [onLogout]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Session Timeout Warning
          </CardTitle>
          <CardDescription>
            Your session will expire soon due to inactivity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-center">
            <Clock className="h-4 w-4" />
            <span>Time remaining: <strong>{countdown} minute{countdown !== 1 ? 's' : ''}</strong></span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Click "Stay Logged In" to extend your session or "Logout" to end your session now.
          </p>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button variant="outline" onClick={onLogout} className="flex-1">
            Logout
          </Button>
          <Button onClick={onExtend} className="flex-1">
            Stay Logged In
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};