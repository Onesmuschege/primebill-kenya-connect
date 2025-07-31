import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const ReactQueryTest = () => {
  // Test with a simple query
  const { data: testData, error: testError, isLoading: testLoading, refetch: testRefetch } = useQuery({
    queryKey: ['test'],
    queryFn: async () => {
      console.log('🧪 React Query test query executing...');
      return { message: 'React Query is working!', timestamp: new Date().toISOString() };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Test with Supabase query
  const { data: plansData, error: plansError, isLoading: plansLoading, refetch: plansRefetch } = useQuery({
    queryKey: ['plans-test'],
    queryFn: async () => {
      console.log('🧪 React Query plans test executing...');
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .limit(3);
      
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  console.log('🔍 ReactQueryTest render:', {
    testData,
    testError: testError?.message,
    testLoading,
    plansData: plansData?.length || 0,
    plansError: plansError?.message,
    plansLoading
  });

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>React Query Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Simple Query Test:</h3>
            <div className="text-sm space-y-1">
              <div>Loading: {testLoading ? 'Yes' : 'No'}</div>
              <div>Error: {testError ? testError.message : 'None'}</div>
              <div>Data: {testData ? 'Loaded' : 'None'}</div>
            </div>
            <Button onClick={() => testRefetch()} disabled={testLoading} size="sm">
              Refetch Test
            </Button>
            {testData && (
              <div className="text-sm bg-green-100 p-2 rounded">
                ✅ {testData.message}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Plans Query Test:</h3>
            <div className="text-sm space-y-1">
              <div>Loading: {plansLoading ? 'Yes' : 'No'}</div>
              <div>Error: {plansError ? plansError.message : 'None'}</div>
              <div>Plans: {plansData?.length || 0}</div>
            </div>
            <Button onClick={() => plansRefetch()} disabled={plansLoading} size="sm">
              Refetch Plans
            </Button>
            {plansData && plansData.length > 0 && (
              <div className="text-sm bg-green-100 p-2 rounded">
                ✅ Loaded {plansData.length} plans
              </div>
            )}
          </div>
        </div>
        
        {testError && (
          <div className="bg-red-100 p-4 rounded-lg">
            <h3 className="font-semibold text-red-800">Test Query Error:</h3>
            <pre className="text-sm text-red-700 mt-2">{JSON.stringify(testError, null, 2)}</pre>
          </div>
        )}
        
        {plansError && (
          <div className="bg-red-100 p-4 rounded-lg">
            <h3 className="font-semibold text-red-800">Plans Query Error:</h3>
            <pre className="text-sm text-red-700 mt-2">{JSON.stringify(plansError, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReactQueryTest;