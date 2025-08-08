import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthDebugger } from '@/hooks/useAuthDebugger';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, CheckCircle, Download, RefreshCw } from 'lucide-react';

export const AuthHealthMonitor: React.FC = () => {
  const { user, session, loading } = useAuth();
  const { debugLogs, exportLogs } = useAuthDebugger();
  const [healthStatus, setHealthStatus] = useState<'checking' | 'healthy' | 'unhealthy'>('checking');
  const [connectionTest, setConnectionTest] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');

  const runHealthCheck = async () => {
    setHealthStatus('checking');
    setConnectionTest('testing');

    try {
      // Test Supabase connection
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Health check failed:', error);
        setHealthStatus('unhealthy');
        setConnectionTest('failed');
        return;
      }

      // Check if we have a valid session structure
      if (data && typeof data === 'object') {
        setConnectionTest('success');
        setHealthStatus('healthy');
      } else {
        setHealthStatus('unhealthy');
        setConnectionTest('failed');
      }
    } catch (error) {
      console.error('Health check error:', error);
      setHealthStatus('unhealthy');
      setConnectionTest('failed');
    }
  };

  useEffect(() => {
    runHealthCheck();
    
    // Listen for health check events
    const handleHealthCheck = () => runHealthCheck();
    window.addEventListener('auth-health-check', handleHealthCheck);
    
    return () => {
      window.removeEventListener('auth-health-check', handleHealthCheck);
    };
  }, []);

  const getStatusColor = () => {
    switch (healthStatus) {
      case 'healthy': return 'default';
      case 'unhealthy': return 'destructive';
      default: return 'secondary';
    }
  };

  const getConnectionColor = () => {
    switch (connectionTest) {
      case 'success': return 'default';
      case 'failed': return 'destructive';
      case 'testing': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {healthStatus === 'healthy' ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          )}
          Authentication Health Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Auth Status</p>
            <Badge variant={getStatusColor()}>
              {healthStatus.toUpperCase()}
            </Badge>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Loading</p>
            <Badge variant={loading ? 'destructive' : 'default'}>
              {loading ? 'YES' : 'NO'}
            </Badge>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Session</p>
            <Badge variant={session ? 'default' : 'secondary'}>
              {session ? 'ACTIVE' : 'NONE'}
            </Badge>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Connection</p>
            <Badge variant={getConnectionColor()}>
              {connectionTest.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* User Information */}
        {user && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium">User Info:</p>
            <p className="text-xs text-muted-foreground">
              ID: {user.id} | Role: {user.role} | Email: {user.email}
            </p>
          </div>
        )}

        {/* Alerts */}
        {loading && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Application is in loading state. If this persists, there may be an authentication issue.
            </AlertDescription>
          </Alert>
        )}

        {healthStatus === 'unhealthy' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Authentication health check failed. Check network connection and Supabase configuration.
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            onClick={runHealthCheck} 
            variant="outline" 
            size="sm"
            disabled={healthStatus === 'checking'}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Run Health Check
          </Button>
          <Button 
            onClick={exportLogs} 
            variant="outline" 
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Debug Logs
          </Button>
        </div>

        {/* Recent Logs */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Recent Debug Events:</p>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {debugLogs.slice(-5).map((log, index) => (
              <div key={index} className="text-xs p-2 bg-muted/30 rounded">
                <span className="font-mono text-xs text-muted-foreground">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className="ml-2 font-medium">{log.event}</span>
                <div className="text-muted-foreground">
                  {JSON.stringify(log.data, null, 2).slice(0, 100)}...
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};