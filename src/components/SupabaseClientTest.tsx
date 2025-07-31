import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const SupabaseClientTest = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runClientTests = async () => {
    setLoading(true);
    setTestResults([]);
    
    try {
      addResult('🔌 Testing Supabase client configuration...');
      
      // Test 1: Check client configuration
      addResult(`📡 Supabase URL: ${supabase.supabaseUrl}`);
      addResult(`🔑 Supabase Key length: ${supabase.supabaseKey?.length || 0}`);
      addResult(`🔑 Supabase Key starts with: ${supabase.supabaseKey?.substring(0, 20)}...`);
      
      // Test 2: Test basic auth
      addResult('👤 Testing authentication...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        addResult(`❌ Auth error: ${authError.message}`);
      } else {
        addResult(`✅ Auth working. User: ${user ? 'Authenticated' : 'Not authenticated'}`);
      }
      
      // Test 3: Test direct query
      addResult('📊 Testing direct query...');
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .limit(1);
      
      if (error) {
        addResult(`❌ Query error: ${error.message}`);
        addResult(`❌ Error code: ${error.code}`);
        addResult(`❌ Error details: ${JSON.stringify(error)}`);
      } else {
        addResult(`✅ Query successful. Found ${data?.length || 0} plans`);
        if (data && data.length > 0) {
          addResult(`📋 Sample plan: ${data[0].name} - ${data[0].price_kes} KES`);
        }
      }
      
      // Test 4: Test with different query
      addResult('📋 Testing count query...');
      const { count, error: countError } = await supabase
        .from('plans')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      
      if (countError) {
        addResult(`❌ Count query error: ${countError.message}`);
      } else {
        addResult(`✅ Count query successful. Total active plans: ${count}`);
      }
      
    } catch (error) {
      addResult(`💥 Unexpected error: ${error}`);
    } finally {
      setLoading(false);
      addResult('🏁 Client tests completed');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Supabase Client Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runClientTests} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Running Tests...' : 'Run Client Tests'}
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

export default SupabaseClientTest;