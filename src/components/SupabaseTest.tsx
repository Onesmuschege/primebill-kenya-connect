import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const SupabaseTest = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runTests = async () => {
    setLoading(true);
    setTestResults([]);
    
    try {
      addResult('🔌 Starting Supabase connection tests...');
      
      // Test 0: Network connectivity
      addResult('🌐 Testing network connectivity...');
      try {
        const response = await fetch('https://ejyzldnrcgglcnpbxmda.supabase.co/rest/v1/plans?select=count&limit=1', {
          method: 'GET',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqeXpsZG5yY2dnbGNucGJ4bWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MzAwODksImV4cCI6MjA2NzUwNjA4OX0.nGe9iaFfQ3nl9WZGfI4gCW9qaNViIIamdVFnTyoIHjQ',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqeXpsZG5yY2dnbGNucGJ4bWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MzAwODksImV4cCI6MjA2NzUwNjA4OX0.nGe9iaFfQ3nl9WZGfI4gCW9qaNViIIamdVFnTyoIHjQ'
          }
        });
        
        if (response.ok) {
          addResult('✅ Network connectivity successful');
        } else {
          addResult(`❌ Network error: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        addResult(`❌ Network connectivity failed: ${error}`);
      }
      
      // Test 1: Basic connection
      addResult('📡 Testing basic connection...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        addResult(`❌ Auth error: ${authError.message}`);
      } else {
        addResult(`✅ Auth connection successful. User: ${user ? 'Authenticated' : 'Not authenticated'}`);
      }
      
      // Test 2: Database connection
      addResult('📊 Testing database connection...');
      const { data: plansData, error: plansError } = await supabase
        .from('plans')
        .select('*')
        .limit(1);
      
      if (plansError) {
        addResult(`❌ Database error: ${plansError.message}`);
        addResult(`❌ Error code: ${plansError.code}`);
        addResult(`❌ Error details: ${JSON.stringify(plansError)}`);
      } else {
        addResult(`✅ Database connection successful. Found ${plansData?.length || 0} plans`);
      }
      
      // Test 3: Check if plans table exists and has data
      addResult('📋 Testing plans table...');
      const { data: allPlans, error: allPlansError } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true);
      
      if (allPlansError) {
        addResult(`❌ Plans query error: ${allPlansError.message}`);
      } else {
        addResult(`✅ Plans table accessible. Active plans: ${allPlans?.length || 0}`);
        if (allPlans && allPlans.length > 0) {
          addResult(`📋 Sample plan: ${allPlans[0].name} - ${allPlans[0].price_kes} KES`);
        }
      }
      
      // Test 4: Check RLS policies
      addResult('🔐 Testing Row Level Security...');
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser) {
        addResult(`👤 User authenticated: ${currentUser.email}`);
        
        // Test subscription access
        const { data: subscriptions, error: subError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', currentUser.id);
        
        if (subError) {
          addResult(`❌ Subscriptions access error: ${subError.message}`);
        } else {
          addResult(`✅ Subscriptions accessible. User subscriptions: ${subscriptions?.length || 0}`);
        }
      } else {
        addResult('⚠️ No authenticated user - testing anonymous access');
      }
      
    } catch (error) {
      addResult(`💥 Unexpected error: ${error}`);
    } finally {
      setLoading(false);
      addResult('🏁 Tests completed');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Supabase Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runTests} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Running Tests...' : 'Run Connection Tests'}
        </Button>
        
        <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
          <h3 className="font-semibold mb-2">Test Results:</h3>
          {testResults.length === 0 ? (
            <p className="text-gray-500">No tests run yet. Click the button above to start testing.</p>
          ) : (
            <div className="space-y-1">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SupabaseTest;