
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowUp, ArrowDown, Check, Zap, Wifi, Clock, CreditCard, Loader2 } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price_kes: number;
  speed_limit_mbps: number;
  validity_days: number;
  description: string;
}

interface CurrentSubscription {
  id: string;
  plan_id: string;
  end_date: string;
  status: string;
  plans: Plan;
}

const PlanUpgrade = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<Plan | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch available plans
      const { data: plansData, error: plansError } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price_kes', { ascending: true });

      if (plansError) throw plansError;

      // Fetch current subscription
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
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

        if (subError && subError.code !== 'PGRST116') {
          throw subError;
        }

        setCurrentSubscription(subscription);
      }

      setPlans(plansData || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Error",
        description: "Failed to fetch plans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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

  const handleDirectPayment = async (plan: Plan) => {
    try {
      setProcessingPlan(plan.id);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to select a plan",
          variant: "destructive",
        });
        return;
      }

      // For users without subscription, directly open payment dialog
      if (!currentSubscription) {
        setSelectedPlanForPayment(plan);
        setPaymentDialogOpen(true);
        return;
      }

      // For upgrades, directly open payment dialog
      const isUpgrade = plan.speed_limit_mbps > (currentSubscription?.plans?.speed_limit_mbps || 0);
      if (isUpgrade) {
        setSelectedPlanForPayment(plan);
        setPaymentDialogOpen(true);
      } else {
        // For downgrades, schedule for next billing cycle
        toast({
          title: "Downgrade Scheduled",
          description: "Your plan will be downgraded at the end of your current billing cycle",
        });

        // Log the scheduled change
        await supabase.rpc('log_activity', {
          p_user_id: user.id,
          p_action: 'plan_downgrade_scheduled',
          p_details: {
            current_plan_id: currentSubscription?.plan_id,
            new_plan_id: plan.id,
            effective_date: currentSubscription?.end_date
          }
        });
      }
    } catch (error) {
      console.error('Error selecting plan:', error);
      toast({
        title: "Error",
        description: "Failed to select plan",
        variant: "destructive",
      });
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleSTKPushPayment = async () => {
    if (!selectedPlanForPayment) return;

    if (!validatePhoneNumber(phoneNumber)) {
      toast({
        title: "Error",
        description: "Please enter a valid Kenyan phone number",
        variant: "destructive",
      });
      return;
    }

    setPaymentStatus('processing');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
        body: {
          amount: selectedPlanForPayment.price_kes,
          phone: formattedPhone,
          account_reference: `PLAN_${selectedPlanForPayment.id}`,
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
          setPaymentDialogOpen(false);
          fetchData(); // Refresh data
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
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-32 bg-gray-200"></CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const currentPlan = currentSubscription?.plans;
  const currentSpeed = currentPlan?.speed_limit_mbps || 0;

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      {currentSubscription && (
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  Current Plan: {currentPlan?.name}
                </CardTitle>
                <CardDescription>
                  Expires on {new Date(currentSubscription.end_date).toLocaleDateString()}
                </CardDescription>
              </div>
              <Badge variant="default" className="bg-green-500 text-white">Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-primary" />
                <span className="text-sm">Speed: {currentPlan?.speed_limit_mbps} Mbps</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm">Validity: {currentPlan?.validity_days} days</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">KSh {currentPlan?.price_kes}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Available Plans
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan?.id === plan.id;
            const isUpgrade = plan.speed_limit_mbps > currentSpeed;
            const isDowngrade = plan.speed_limit_mbps < currentSpeed && currentSpeed > 0;
            
            return (
              <Card key={plan.id} className={`${
                isCurrentPlan 
                  ? 'border-primary/50 bg-gradient-to-br from-primary/10 to-accent/10 shadow-lg' 
                  : 'border-border hover:border-primary/30 hover:shadow-md transition-all duration-200'
              } glass-card`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      {plan.name}
                    </CardTitle>
                    {isCurrentPlan && <Badge variant="default" className="bg-primary">Current</Badge>}
                    {isUpgrade && <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      Upgrade
                    </Badge>}
                    {isDowngrade && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                      <ArrowDown className="h-3 w-3 mr-1" />
                      Downgrade
                    </Badge>}
                  </div>
                  <CardDescription className="text-muted-foreground">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        KSh {plan.price_kes}
                      </span>
                      <span className="text-sm text-muted-foreground">per {plan.validity_days} days</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-primary/5">
                        <Zap className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{plan.speed_limit_mbps} Mbps Speed</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-accent/5">
                        <Clock className="h-4 w-4 text-accent" />
                        <span className="text-sm font-medium">{plan.validity_days} days validity</span>
                      </div>
                    </div>

                    {!isCurrentPlan && (
                      <Button 
                        className="w-full gradient-primary text-white font-medium py-3 hover:shadow-lg transition-all duration-200" 
                        onClick={() => handleDirectPayment(plan)}
                        disabled={processingPlan === plan.id}
                      >
                        {processingPlan === plan.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            {isUpgrade ? "Upgrade Now" : currentSubscription ? "Schedule Downgrade" : "Select Plan"}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Complete Payment
            </DialogTitle>
            <DialogDescription>
              {selectedPlanForPayment && (
                `Pay KSh ${selectedPlanForPayment.price_kes} for ${selectedPlanForPayment.name} plan`
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlanForPayment && (
            <div className="space-y-4">
              {/* Plan Summary */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-4">
                  <h4 className="font-semibold text-lg">{selectedPlanForPayment.name}</h4>
                  <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                    <div>Speed: {selectedPlanForPayment.speed_limit_mbps} Mbps</div>
                    <div>Validity: {selectedPlanForPayment.validity_days} days</div>
                    <div className="col-span-2">
                      <span className="text-lg font-bold text-primary">
                        Total: KSh {selectedPlanForPayment.price_kes.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Phone Number Input */}
              <div className="space-y-2">
                <Label htmlFor="phone">M-Pesa Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+254700000000 or 0700000000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={paymentStatus === 'processing'}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the phone number linked to your M-Pesa account
                </p>
              </div>

              {/* Payment Status */}
              {paymentStatus === 'processing' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2 text-yellow-600" />
                    <span className="text-yellow-800">Payment processing... Check your phone for M-Pesa prompt</span>
                  </div>
                </div>
              )}

              {paymentStatus === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <span className="text-green-800">Payment successful! Your subscription is now active.</span>
                </div>
              )}

              {paymentStatus === 'failed' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <span className="text-red-800">Payment failed. Please try again.</span>
                </div>
              )}

              {/* Pay Button */}
              <Button 
                onClick={handleSTKPushPayment}
                disabled={!phoneNumber || paymentStatus === 'processing'}
                className="w-full gradient-primary text-white font-medium py-3"
                size="lg"
              >
                {paymentStatus === 'processing' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Pay KSh {selectedPlanForPayment.price_kes.toLocaleString()}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlanUpgrade;
