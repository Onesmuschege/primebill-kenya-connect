import React from 'react';
import { usePlans } from '@/hooks/queries/usePlans';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const PlansTest = () => {
  const { data: plans, error, isLoading, refetch } = usePlans(true);

  console.log('🔍 PlansTest component render:', {
    plans: plans?.length || 0,
    error: error?.message,
    isLoading
  });

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Plans Loading Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={() => refetch()} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Refetch Plans'}
          </Button>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold">Status:</h3>
          <div className="text-sm space-y-1">
            <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
            <div>Error: {error ? error.message : 'None'}</div>
            <div>Plans count: {plans?.length || 0}</div>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 p-4 rounded-lg">
            <h3 className="font-semibold text-red-800">Error Details:</h3>
            <pre className="text-sm text-red-700 mt-2">{JSON.stringify(error, null, 2)}</pre>
          </div>
        )}
        
        {plans && plans.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Loaded Plans:</h3>
            <div className="space-y-1">
              {plans.map((plan) => (
                <div key={plan.id} className="text-sm p-2 bg-gray-100 rounded">
                  {plan.name} - {plan.price_kes} KES ({plan.speed_limit_mbps} Mbps)
                </div>
              ))}
            </div>
          </div>
        )}
        
        {!isLoading && !error && (!plans || plans.length === 0) && (
          <div className="bg-yellow-100 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-800">No Plans Found</h3>
            <p className="text-sm text-yellow-700">No active plans were returned from the database.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlansTest;