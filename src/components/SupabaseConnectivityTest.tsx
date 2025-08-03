import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: string;
}

export const SupabaseConnectivityTest = () => {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateTest = (name: string, status: TestResult['status'], message: string, details?: string) => {
    setTests(prev => {
      const existing = prev.find(t => t.name === name);
      if (existing) {
        return prev.map(t => t.name === name ? { ...t, status, message, details } : t);
      }
      return [...prev, { name, status, message, details }];
    });
  };

  const runTests = async () => {
    setIsRunning(true);
    setTests([]);

    // Test 1: Basic URL reachability
    updateTest('URL Reachability', 'pending', 'Testing Supabase URL...');
    try {
      const SUPABASE_URL = "https://ejyzldnrcgglcnpbxmda.supabase.co";
      const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqeXpsZG5yY2dnbGNucGJ4bWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MzAwODksImV4cCI6MjA2NzUwNjA4OX0.nGe9iaFfQ3nl9WZGfI4gCW9qaNViIIamdVFnTyoIHjQ";
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': SUPABASE_KEY,
        },
      });
      
      if (response.ok) {
        updateTest('URL Reachability', 'success', 'Supabase URL is reachable');
      } else {
        updateTest('URL Reachability', 'error', `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      updateTest('URL Reachability', 'error', 'Network error', error.message);
    }

    // Test 2: Auth endpoint
    updateTest('Auth Endpoint', 'pending', 'Testing auth endpoint...');
    try {
      const SUPABASE_URL = "https://ejyzldnrcgglcnpbxmda.supabase.co";
      const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqeXpsZG5yY2dnbGNucGJ4bWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MzAwODksImV4cCI6MjA2NzUwNjA4OX0.nGe9iaFfQ3nl9WZGfI4gCW9qaNViIIamdVFnTyoIHjQ";
      
      const response = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
        headers: {
          'apikey': SUPABASE_KEY,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        updateTest('Auth Endpoint', 'success', 'Auth endpoint accessible', `External providers: ${Object.keys(data.external || {}).length}`);
      } else {
        updateTest('Auth Endpoint', 'error', `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      updateTest('Auth Endpoint', 'error', 'Auth endpoint failed', error.message);
    }

    // Test 3: Session check
    updateTest('Session Check', 'pending', 'Checking current session...');
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        updateTest('Session Check', 'error', 'Session error', error.message);
      } else if (data.session) {
        updateTest('Session Check', 'success', 'Valid session found', `User: ${data.session.user?.email}`);
      } else {
        updateTest('Session Check', 'success', 'No active session (normal for logged out user)');
      }
    } catch (error: any) {
      updateTest('Session Check', 'error', 'Session check failed', error.message);
    }

    // Test 4: Database connectivity
    updateTest('Database Query', 'pending', 'Testing database access...');
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (error) {
        updateTest('Database Query', 'error', 'Database query failed', error.message);
      } else {
        updateTest('Database Query', 'success', 'Database accessible');
      }
    } catch (error: any) {
      updateTest('Database Query', 'error', 'Database connection failed', error.message);
    }

    // Test 5: Auth signup attempt (with fake data to test endpoint)
    updateTest('Auth Signup Test', 'pending', 'Testing signup endpoint...');
    try {
      const { error } = await supabase.auth.signUp({
        email: 'test@connectivity-test.invalid',
        password: 'test123456',
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        if (error.message.includes('Invalid email')) {
          updateTest('Auth Signup Test', 'success', 'Signup endpoint reachable (invalid email as expected)');
        } else {
          updateTest('Auth Signup Test', 'error', 'Signup error', error.message);
        }
      } else {
        updateTest('Auth Signup Test', 'success', 'Signup endpoint working');
      }
    } catch (error: any) {
      updateTest('Auth Signup Test', 'error', 'Signup test failed', error.message);
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Supabase Connectivity Diagnostics
        </CardTitle>
        <CardDescription>
          Test your connection to Supabase services and identify potential issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runTests} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            'Run Connectivity Tests'
          )}
        </Button>

        {tests.length > 0 && (
          <div className="space-y-3">
            {tests.map((test) => (
              <div key={test.name} className="flex items-start gap-3 p-3 border rounded-lg">
                {getStatusIcon(test.status)}
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{test.name}</div>
                  <div className="text-sm text-muted-foreground">{test.message}</div>
                  {test.details && (
                    <div className="text-xs text-muted-foreground mt-1 opacity-75">
                      {test.details}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <strong>Next steps if tests fail:</strong>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Check Supabase project status in dashboard</li>
            <li>Verify Site URL and Redirect URLs in Auth settings</li>
            <li>Ensure this domain is whitelisted in CORS settings</li>
            <li>Check if "Confirm email" is disabled for testing</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};