import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  CreditCard, 
  Smartphone, 
  Wifi, 
  Zap, 
  CheckCircle, 
  Star, 
  TrendingUp, 
  Shield, 
  Clock, 
  AlertTriangle,
  Play,
  ArrowRight,
  Crown,
  Sparkles,
  Users,
  Globe,
  Activity,
  RefreshCw
} from 'lucide-react';

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
  const [selectedTimeframe, setSelectedTimeframe] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
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
        console.log('📊 Fetching current subscription...');
        const { data: subData, error: subError } = await supabase
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

        console.log('📡 Subscription response:', { subData, subError });

        if (subError && subError.code !== 'PGRST116') {
          console.error('❌ Subscription fetch error:', subError);
        } else if (subData) {
          console.log('✅ Current subscription found:', subData);
          setCurrentSubscription(subData);
        }
      }

      setPlans(plansData || []);
    } catch (error) {
      console.error('💥 Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load plans. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getDefaultFeatures = (plan: Plan) => {
    const baseFeatures = [
      `${plan.speed_limit_mbps} Mbps download speed`,
      `${Math.round(plan.speed_limit_mbps * 0.1)} Mbps upload speed`,
      `${plan.validity_days} days validity`,
      '24/7 customer support',
      'Free installation'
    ];

    if (plan.speed_limit_mbps >= 100) {
      baseFeatures.push('4K streaming support');
      baseFeatures.push('Gaming optimized');
    }

    if (plan.speed_limit_mbps >= 50) {
      baseFeatures.push('HD streaming support');
    }

    return baseFeatures;
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^(\+254|0)?[17]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('254')) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('0')) {
      return `+254${cleaned.slice(1)}`;
    } else if (cleaned.length === 9) {
      return `+254${cleaned}`;
    }
    return phone;
  };

  const handlePlanSelection = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowPaymentDialog(true);
  };

  const handlePayment = async () => {
    if (!selectedPlan || !phoneNumber.trim()) {
      toast({
        title: "Error",
        description: "Please select a plan and enter your phone number.",
        variant: "destructive",
      });
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid Kenyan phone number.",
        variant: "destructive",
      });
      return;
    }

    try {
      setPaymentStatus('processing');
      setProcessingPayment(selectedPlan.id);

      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock payment success
      const paymentId = `pay_${Date.now()}`;
      
      // Create subscription record
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + selectedPlan.validity_days);

        const { error: subError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            plan_id: selectedPlan.id,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            status: 'active',
            auto_renew: false
          });

        if (subError) {
          console.error('Subscription creation error:', subError);
          throw subError;
        }
      }

      setPaymentStatus('success');
      toast({
        title: "Payment Successful!",
        description: `Your ${selectedPlan.name} plan has been activated.`,
      });

      // Refresh data
      await fetchData();
      
      // Close dialog after delay
      setTimeout(() => {
        setShowPaymentDialog(false);
        setPaymentStatus('idle');
        setProcessingPayment(null);
        setSelectedPlan(null);
        setPhoneNumber('');
      }, 2000);

    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('failed');
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const pollPaymentStatus = async (paymentId: string) => {
    const poll = async () => {
      try {
        // Simulate checking payment status
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock payment success
        setPaymentStatus('success');
        toast({
          title: "Payment Successful!",
          description: "Your plan has been activated successfully.",
        });
        
        await fetchData();
        setShowPaymentDialog(false);
        setPaymentStatus('idle');
        setProcessingPayment(null);
      } catch (error) {
        console.error('Payment polling error:', error);
        setPaymentStatus('failed');
      }
    };

    poll();
  };

  const getPlanTier = (plan: Plan) => {
    if (plan.speed_limit_mbps >= 100) return 'premium';
    if (plan.speed_limit_mbps >= 50) return 'standard';
    return 'basic';
  };

  const getPlanIcon = (plan: Plan) => {
    const tier = getPlanTier(plan);
    switch (tier) {
      case 'premium':
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 'standard':
        return <Star className="h-6 w-6 text-blue-500" />;
      default:
        return <Wifi className="h-6 w-6 text-green-500" />;
    }
  };

  const getPlanColor = (plan: Plan) => {
    const tier = getPlanTier(plan);
    switch (tier) {
      case 'premium':
        return 'from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20';
      case 'standard':
        return 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20';
      default:
        return 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Choose Your Plan
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Select the perfect internet plan for your needs
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={selectedTimeframe === 'monthly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeframe('monthly')}
            >
              Monthly
            </Button>
            <Button
              variant={selectedTimeframe === 'quarterly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeframe('quarterly')}
            >
              Quarterly
            </Button>
            <Button
              variant={selectedTimeframe === 'yearly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeframe('yearly')}
            >
              Yearly
            </Button>
          </div>
        </div>

        {/* Current Plan Alert */}
        {currentSubscription && (
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
            <Wifi className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <strong>Current Plan:</strong> {currentSubscription.plans.name} ({currentSubscription.plans.speed_limit_mbps} Mbps)
              {new Date(currentSubscription.end_date) > new Date() && (
                <span className="ml-2">• Expires {new Date(currentSubscription.end_date).toLocaleDateString()}</span>
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Plans Grid */}
      {plans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = currentSubscription?.plan_id === plan.id;
            const tier = getPlanTier(plan);
            
            return (
              <Card 
                key={plan.id} 
                className={`relative overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl ${
                  isCurrentPlan ? 'ring-2 ring-blue-500' : ''
                } bg-gradient-to-br ${getPlanColor(plan)}`}
              >
                {/* Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="default" className="bg-blue-600 text-white">
                      Current Plan
                    </Badge>
                  </div>
                )}
                
                {tier === 'premium' && (
                  <div className="absolute top-4 left-4">
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getPlanIcon(plan)}
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                          {plan.name}
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400">
                          {plan.description}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Price */}
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      KSh {plan.price_kes.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      per {selectedTimeframe === 'monthly' ? 'month' : selectedTimeframe === 'quarterly' ? 'quarter' : 'year'}
                    </div>
                  </div>

                  {/* Speed */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {plan.speed_limit_mbps} Mbps
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Download Speed
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white">What's included:</h4>
                    <ul className="space-y-2">
                      {getDefaultFeatures(plan).map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button */}
                  <Button 
                    className={`w-full ${
                      isCurrentPlan 
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                    disabled={isCurrentPlan}
                    onClick={() => handlePlanSelection(plan)}
                  >
                    {isCurrentPlan ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Current Plan
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Select Plan
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mb-6">
              <Wifi className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              No plans available
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              We're currently updating our plan offerings. Please check back later or contact support for assistance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
              >
                <Activity className="h-5 w-5 mr-2" />
                Contact Support
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Activate {selectedPlan?.name}
            </DialogTitle>
            <DialogDescription>
              Enter your phone number to receive payment instructions via SMS.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="e.g., 0712345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Enter a valid Kenyan phone number
              </p>
            </div>

            {selectedPlan && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold mb-2">Plan Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Plan:</span>
                    <span className="font-medium">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Speed:</span>
                    <span className="font-medium">{selectedPlan.speed_limit_mbps} Mbps</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-medium">{selectedPlan.validity_days} days</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>KSh {selectedPlan.price_kes.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPaymentDialog(false)}
                className="flex-1"
                disabled={paymentStatus === 'processing'}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePayment}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={!phoneNumber.trim() || paymentStatus === 'processing'}
              >
                {paymentStatus === 'processing' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay Now
                  </>
                )}
              </Button>
            </div>

            {paymentStatus === 'success' && (
              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Payment successful! Your plan has been activated.
                </AlertDescription>
              </Alert>
            )}

            {paymentStatus === 'failed' && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Payment failed. Please try again or contact support.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlanUpgradeEnhanced;