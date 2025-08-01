import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlanCard } from '@/components/ui/plan-card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CreditCard, Smartphone } from 'lucide-react';

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
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
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

  const validatePhoneNumber = (phone: string): boolean => {
    // Kenyan phone number validation
    const phoneRegex = /^(\+254|254|0)(7|1)[0-9]{8}$/;
    return phoneRegex.test(phone);
  };

  const formatPhoneNumber = (phone: string): string => {
    // Convert to 254XXXXXXXXX format
    if (phone.startsWith('+254')) {
      return phone.slice(1);
    } else if (phone.startsWith('0')) {
      return `254${phone.slice(1)}`;
    } else if (phone.startsWith('254')) {
      return phone;
    }
    return phone;
  };

  const handlePlanSelection = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowPaymentDialog(true);
    setPaymentStatus('idle');
    setPhoneNumber('');
  };

  const handlePayment = async () => {
    if (!selectedPlan) {
      toast({
        title: "Error",
        description: "Please select a plan",
        variant: "destructive",
      });
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      toast({
        title: "Error",
        description: "Please enter a valid Kenyan phone number",
        variant: "destructive",
      });
      return;
    }

    setProcessingPayment(selectedPlan.id);
    setPaymentStatus('processing');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
        body: {
          amount: selectedPlan.price_kes,
          phone: formattedPhone,
          account_reference: `PLAN_${selectedPlan.id}`,
          user_id: user.id,
          email: user.email
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Payment Initiated",
          description: "Please check your phone for the M-Pesa prompt",
        });
        
        // Poll for payment status
        pollPaymentStatus(data.payment_id);
      } else {
        throw new Error(data.error || 'Payment initiation failed');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentStatus('failed');
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to initiate payment",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(null);
    }
  };

  const pollPaymentStatus = async (paymentId: string) => {
    const maxAttempts = 30; // 5 minutes of polling
    let attempts = 0;

    const poll = async () => {
      try {
        const { data, error } = await supabase
          .from('payments')
          .select('status')
          .eq('id', paymentId)
          .single();

        if (error) throw error;

        if (data.status === 'success') {
          setPaymentStatus('success');
          toast({
            title: "Payment Successful",
            description: "Your subscription has been activated!",
          });
          setShowPaymentDialog(false);
          // Refresh the data
          await fetchData();
          return;
        } else if (data.status === 'failed') {
          setPaymentStatus('failed');
          toast({
            title: "Payment Failed",
            description: "Payment was not completed. Please try again.",
            variant: "destructive",
          });
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000); // Poll every 10 seconds
        } else {
          setPaymentStatus('idle');
          toast({
            title: "Payment Status Unknown",
            description: "Please check your payment history or contact support",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Polling error:', error);
        setPaymentStatus('idle');
      }
    };

    poll();
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
        <h2 className="text-3xl font-heading font-bold text-foreground">
          Choose Your Internet Plan
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Select the perfect plan for your needs. Upgrade or downgrade anytime with no hidden fees.
        </p>
      </div>

      {/* Current Plan Info */}
      {currentSubscription && (
        <Card className="professional-card border-cyber-blue-200 bg-cyber-blue-50/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-cyber-blue-700 dark:text-cyber-blue-300">
                  Your Current Plan
                </CardTitle>
                <CardDescription className="text-cyber-blue-600 dark:text-cyber-blue-400">
                  {currentSubscription.plans.name} - Active until{' '}
                  {new Date(currentSubscription.end_date).toLocaleDateString()}
                </CardDescription>
              </div>
              <Badge className="bg-cyber-green-100 text-cyber-green-800 dark:bg-cyber-green-900 dark:text-cyber-green-200">
                Active
              </Badge>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <Card key={plan.id} className="professional-card hover:shadow-cyber-glow transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-foreground">{plan.name}</CardTitle>
                {plan.popular && (
                  <Badge className="bg-cyber-purple-100 text-cyber-purple-800 dark:bg-cyber-purple-900 dark:text-cyber-purple-200">
                    Popular
                  </Badge>
                )}
              </div>
              <CardDescription className="text-muted-foreground">
                {plan.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-cyber-blue-600 dark:text-cyber-blue-400">
                  KES {plan.price_kes.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  for {plan.validity_days} days
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Speed</span>
                  <span className="font-semibold text-foreground">{plan.speed_limit_mbps} Mbps</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Validity</span>
                  <span className="font-semibold text-foreground">{plan.validity_days} days</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-foreground">Features:</h4>
                <ul className="space-y-1">
                  {plan.features?.slice(0, 3).map((feature, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-center">
                      <span className="w-1.5 h-1.5 bg-cyber-blue-500 rounded-full mr-2"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <Button 
                onClick={() => handlePlanSelection(plan)}
                className="w-full bg-cyber-blue-600 hover:bg-cyber-blue-700 text-white"
                disabled={plan.current}
              >
                {plan.current ? 'Current Plan' : 'Select Plan'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Complete Payment
            </DialogTitle>
            <DialogDescription>
              Enter your M-Pesa phone number to proceed with the payment for {selectedPlan?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedPlan && (
              <Card className="bg-cyber-blue-50/10 border-cyber-blue-200">
                <CardContent className="pt-4">
                  <h3 className="font-semibold text-lg text-foreground">{selectedPlan.name}</h3>
                  <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                    <div className="text-muted-foreground">Speed: {selectedPlan.speed_limit_mbps} Mbps</div>
                    <div className="text-muted-foreground">Validity: {selectedPlan.validity_days} days</div>
                    <div className="text-muted-foreground">Price: KES {selectedPlan.price_kes.toLocaleString()}</div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center">
                <Smartphone className="h-4 w-4 mr-2" />
                M-Pesa Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+254700000000 or 0700000000"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={paymentStatus === 'processing'}
                className="border-cyber-blue-200 focus:border-cyber-blue-500"
              />
              <p className="text-xs text-muted-foreground">
                Enter the phone number linked to your M-Pesa account
              </p>
            </div>

            {/* Payment Status */}
            {paymentStatus === 'processing' && (
              <div className="bg-cyber-orange-50 border border-cyber-orange-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-cyber-orange-800">Payment processing... Check your phone for M-Pesa prompt</span>
                </div>
              </div>
            )}

            {paymentStatus === 'success' && (
              <div className="bg-cyber-green-50 border border-cyber-green-200 rounded-lg p-4">
                <span className="text-cyber-green-800">Payment successful! Your subscription is now active.</span>
              </div>
            )}

            {paymentStatus === 'failed' && (
              <div className="bg-cyber-red-50 border border-cyber-red-200 rounded-lg p-4">
                <span className="text-cyber-red-800">Payment failed. Please try again.</span>
              </div>
            )}

            <div className="flex space-x-2">
              <Button 
                onClick={handlePayment} 
                disabled={!phoneNumber || paymentStatus === 'processing'}
                className="flex-1 bg-cyber-blue-600 hover:bg-cyber-blue-700 text-white"
              >
                {paymentStatus === 'processing' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Pay KES {selectedPlan?.price_kes.toLocaleString() || '0'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowPaymentDialog(false)}
                disabled={paymentStatus === 'processing'}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Additional Information */}
      <div className="bg-cyber-gray-50/10 rounded-xl p-6 space-y-4 border border-cyber-gray-200">
        <h3 className="text-lg font-semibold text-foreground">
          Plan Change Policy
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div>
            <h4 className="font-medium text-foreground mb-2">Upgrades</h4>
            <p>
              Plan upgrades take effect immediately. You'll be charged the prorated 
              difference for the remaining period.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">Downgrades</h4>
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