import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircleIcon, XCircleIcon, AlertCircleIcon, WifiIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DiagnosticTest {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  details?: string;
}

export const NetworkDiagnostics: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [tests, setTests] = useState<DiagnosticTest[]>([
    { name: 'Internet Connectivity', status: 'pending', message: 'Not tested' },
    { name: 'Supabase Reachability', status: 'pending', message: 'Not tested' },
    { name: 'Authentication Service', status: 'pending', message: 'Not tested' },
    { name: 'Database Connection', status: 'pending', message: 'Not tested' },
    { name: 'DNS Resolution', status: 'pending', message: 'Not tested' }
  ]);

  const updateTest = (index: number, updates: Partial<DiagnosticTest>) => {
    setTests(prev => prev.map((test, i) => 
      i === index ? { ...test, ...updates } : test
    ));
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    
    // Test 1: Internet Connectivity
    updateTest(0, { status: 'running', message: 'Testing...' });
    try {
      const response = await fetch('https://httpbin.org/json', { 
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      if (response.ok) {
        updateTest(0, { 
          status: 'success', 
          message: 'Internet connection is working',
          details: `Response time: ${response.headers.get('date')}`
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      updateTest(0, { 
        status: 'error', 
        message: 'Internet connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 2: Supabase Reachability
    updateTest(1, { status: 'running', message: 'Testing...' });
    try {
      const response = await fetch('https://ejyzldnrcgglcnpbxmda.supabase.co/rest/v1/', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqeXpsZG5yY2dnbGNucGJ4bWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MzAwODksImV4cCI6MjA2NzUwNjA4OX0.nGe9iaFfQ3nl9WZGfI4gCW9qaNViIIamdVFnTyoIHjQ'
        }
      });
      updateTest(1, { 
        status: 'success', 
        message: 'Supabase is reachable',
        details: `Status: ${response.status}`
      });
    } catch (error) {
      updateTest(1, { 
        status: 'error', 
        message: 'Cannot reach Supabase',
        details: error instanceof Error ? error.message : 'Network error'
      });
    }

    // Test 3: Authentication Service
    updateTest(2, { status: 'running', message: 'Testing...' });
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      updateTest(2, { 
        status: 'success', 
        message: 'Authentication service is working',
        details: data.session ? 'Session found' : 'No active session'
      });
    } catch (error) {
      updateTest(2, { 
        status: 'error', 
        message: 'Authentication service failed',
        details: error instanceof Error ? error.message : 'Auth error'
      });
    }

    // Test 4: Database Connection
    updateTest(3, { status: 'running', message: 'Testing...' });
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      updateTest(3, { 
        status: 'success', 
        message: 'Database connection is working',
        details: 'Successfully queried users table'
      });
    } catch (error) {
      updateTest(3, { 
        status: 'error', 
        message: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Database error'
      });
    }

    // Test 5: DNS Resolution
    updateTest(4, { status: 'running', message: 'Testing...' });
    try {
      const start = Date.now();
      await fetch('https://8.8.8.8', { 
        method: 'HEAD', 
        mode: 'no-cors',
        signal: AbortSignal.timeout(3000)
      });
      const duration = Date.now() - start;
      updateTest(4, { 
        status: 'success', 
        message: 'DNS resolution is working',
        details: `Response time: ${duration}ms`
      });
    } catch (error) {
      updateTest(4, { 
        status: 'error', 
        message: 'DNS resolution may be slow',
        details: 'This could affect connection speed'
      });
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: DiagnosticTest['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-success" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-destructive" />;
      case 'running':
        return <AlertCircleIcon className="h-5 w-5 text-warning animate-pulse" />;
      default:
        return <div className="h-5 w-5 rounded-full bg-muted" />;
    }
  };

  const hasErrors = tests.some(test => test.status === 'error');
  const allTested = tests.every(test => test.status !== 'pending');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <WifiIcon className="h-5 w-5" />
          Network Diagnostics
        </CardTitle>
        <CardDescription>
          Test your network connection and Supabase connectivity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostics}
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? 'Running Tests...' : 'Run Diagnostics'}
        </Button>

        <div className="space-y-3">
          {tests.map((test, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
              {getStatusIcon(test.status)}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium">{test.name}</h4>
                <p className="text-sm text-muted-foreground">{test.message}</p>
                {test.details && (
                  <p className="text-xs text-muted-foreground mt-1">{test.details}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {allTested && hasErrors && (
          <Alert>
            <AlertCircleIcon className="h-4 w-4" />
            <AlertDescription>
              Some connectivity issues were detected. This may cause authentication problems.
              Try refreshing the page or checking your internet connection.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};