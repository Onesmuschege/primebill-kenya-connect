import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlanCard } from '@/components/ui/plan-card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Plan {
  id: string;
  name: string;
  price_kes: number;
  speed_limit_mbps: number;
  validity_days: number;
  description: string;
  features?: string[];
}

interface CurrentSubscription {
  id: string;
  plan_id: string;
  end_date: string;
  status: string;
  plans: Plan;
}

const PlanUpgradeEnhanced = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const { toast } = useToast();

  // Test Supabase connection on mount
  useEffect(() => {
    const testConnection = async () => {
      console.log('🔌 Testing Supabase connection...');
      
      try {
        // Test basic connection
        const { data: { user } } = await supabase.auth.getUser();
        console.log('👤 Auth status:', user ? 'Authenticated' : 'Not authenticated');
        console.log('👤 User:', user);
        
        // Test database connection
        const { data, error } = await supabase
          .from('plans')
          .select('count')
          .limit(1);
        
        console.log('📊 Database connection test:', { data, error });
        
        if (error) {
          console.error('❌ Database connection failed:', error);
        } else {
          console.log('✅ Database connection successful');
        }
      } catch (error) {
        console.error('💥 Connection test failed:', error);
      }
    };
    
    testConnection();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('🔍 PlanUpgradeEnhanced: Starting to fetch data...');

      // Fetch available plans
      console.log('📊 Fetching plans from Supabase...');
      const { data: plansData, error: plansError } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price_kes', { ascending: true });

      console.log('📡 Plans response:', { plansData, plansError });

      if (plansError) {
        console.error('❌ Plans fetch error:', plansError);
        throw plansError;
      }

      console.log('✅ Plans fetched successfully:', plansData?.length, 'plans found');

      // Fetch current subscription
      console.log('👤 Fetching current user...');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        console.log('👤 User found:', user.id);
        console.log('📊 Fetching current subscription...');
        
        const { data: subscription, error: subError } = await supabase
          .from('subscriptions')
          .select(`
            *,
            plans (*)
          `)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        console.log('📡 Subscription response:', { subscription, subError });

        if (subError && subError.code !== 'PGRST116') {
          console.error('❌ Subscription fetch error:', subError);
          throw subError;
        }

        setCurrentSubscription(subscription);
        console.log('✅ Current subscription set:', subscription);
      } else {
        console.log('⚠️ No user found');
      }

      // Add sample features for better UX
      const enhancedPlans = plansData?.map((plan, index) => ({
        ...plan,
        features: getDefaultFeatures(plan),
        popular: index === 1, // Mark middle plan as popular
        current: subscription?.plan_id === plan.id
      })) || [];

      console.log('🎨 Enhanced plans created:', enhancedPlans.length, 'plans');
      setPlans(enhancedPlans);
    } catch (error) {
      console.error('💥 Error in fetchData:', error);
      toast({
        title: "Error",
        description: "Failed to fetch plans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log('🏁 fetchData completed');
    }
  };

  const getDefaultFeatures = (plan: Plan) => {
    const baseFeatures = [
      'Unlimited data usage',
      '24/7 customer support',
      'Free installation',
    ];

    if (plan.speed_limit_mbps >= 100) {
      baseFeatures.push('HD video streaming');
      baseFeatures.push('Multiple device support');
    }

    if (plan.speed_limit_mbps >= 500) {
      baseFeatures.push('4K video streaming');
      baseFeatures.push('Gaming optimized');
      baseFeatures.push('Business-grade reliability');
    }

    if (plan.validity_days >= 365) {
      baseFeatures.push('Annual plan discount');
      baseFeatures.push('Priority customer support');
    }

    return baseFeatures;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePaymentSelection = async (planId: string, paymentMethod: string) => {
    try {
      setProcessingPayment(planId);

      // Here you would integrate with actual payment processors
      // For now, we'll simulate the process
      
      toast({
        title: "Payment Processing",
        description: `Redirecting to ${paymentMethod} payment gateway...`,
      });

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In a real implementation, you would:
      // 1. Create a payment intent with the selected payment method
      // 2. Redirect to payment gateway
      // 3. Handle payment callback
      // 4. Update subscription in database

      toast({
        title: "Payment Processing",
        description: "Please complete the payment in the new window",
      });

    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Payment Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading available plans..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-heading font-bold text-gray-900">
          Choose Your Internet Plan
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Select the perfect plan for your needs. Upgrade or downgrade anytime with no hidden fees.
        </p>
      </div>

      {/* Current Plan Info */}
      {currentSubscription && (
        <Card className="professional-card border-isp-blue-200 bg-isp-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-isp-blue-700">
                  Your Current Plan
                </CardTitle>
                <CardDescription className="text-isp-blue-600">
                  {currentSubscription.plans.name} - Active until{' '}
                  {new Date(currentSubscription.end_date).toLocaleDateString()}
                </CardDescription>
              </div>
              <Badge className="bg-isp-teal-100 text-isp-teal-800">
                Active
              </Badge>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onSelectPayment={handlePaymentSelection}
            loading={processingPayment === plan.id}
          />
        ))}
      </div>

      {/* Additional Information */}
      <div className="bg-isp-gray-50 rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Plan Change Policy
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Upgrades</h4>
            <p>
              Plan upgrades take effect immediately. You'll be charged the prorated 
              difference for the remaining period.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Downgrades</h4>
            <p>
              Plan downgrades take effect at the end of your current billing period. 
              No partial refunds are provided.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanUpgradeEnhanced;