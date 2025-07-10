
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from '@/hooks/useNotifications';
import { Loader2, CreditCard } from 'lucide-react';
import { paymentFormSchema, PaymentFormData } from '@/lib/validations';

interface Plan {
  id: string;
  name: string;
  price_kes: number;
  speed_limit_mbps: number;
  validity_days: number;
  description: string | null;
}

export const PaymentFormImproved = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      planId: '',
      phoneNumber: '',
    },
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price_kes', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      showError('Error loading plans', error.message);
    }
  };

  const formatPhoneNumber = (phone: string): string => {
    if (phone.startsWith('+254')) {
      return phone.slice(1);
    } else if (phone.startsWith('0')) {
      return `254${phone.slice(1)}`;
    } else if (phone.startsWith('254')) {
      return phone;
    }
    return phone;
  };

  const onSubmit = async (data: PaymentFormData) => {
    if (!user) {
      showError('Authentication required', 'Please log in to make a payment');
      return;
    }

    if (!selectedPlan) {
      showError('Plan required', 'Please select a plan');
      return;
    }

    setLoading(true);
    setPaymentStatus('processing');

    try {
      const formattedPhone = formatPhoneNumber(data.phoneNumber);
      
      const { data: response, error } = await supabase.functions.invoke('mpesa-stk-push', {
        body: {
          amount: selectedPlan.price_kes,
          phone: formattedPhone,
          account_reference: `PLAN_${selectedPlan.id}`,
          user_id: user.id,
          email: user.email
        }
      });

      if (error) throw error;

      if (response.success) {
        showSuccess('Payment initiated', 'Please check your phone for the M-Pesa prompt');
        pollPaymentStatus(response.payment_id);
      } else {
        throw new Error(response.error || 'Payment initiation failed');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentStatus('failed');
      showError('Payment failed', error.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = async (paymentId: string) => {
    const maxAttempts = 30;
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
          showSuccess('Payment successful', 'Your subscription has been activated!');
          form.reset();
          window.location.reload();
          return;
        } else if (data.status === 'failed') {
          setPaymentStatus('failed');
          showError('Payment failed', 'Payment was not completed. Please try again.');
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000);
        } else {
          setPaymentStatus('idle');
          showError('Payment timeout', 'Please check your payment history or contact support');
        }
      } catch (error) {
        console.error('Polling error:', error);
        setPaymentStatus('idle');
      }
    };

    poll();
  };

  const handlePlanSelect = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    setSelectedPlan(plan || null);
    form.setValue('planId', planId);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Purchase Internet Plan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Plan Selection */}
            <FormField
              control={form.control}
              name="planId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Plan</FormLabel>
                  <Select onValueChange={handlePlanSelect} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose your internet plan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          <div className="flex justify-between items-center w-full">
                            <span>{plan.name} - {plan.speed_limit_mbps}Mbps</span>
                            <span className="font-bold">KES {plan.price_kes}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Selected Plan Details */}
            {selectedPlan && (
              <Card className="bg-blue-50">
                <CardContent className="pt-4">
                  <h3 className="font-semibold text-lg">{selectedPlan.name}</h3>
                  <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                    <div>Speed: {selectedPlan.speed_limit_mbps} Mbps</div>
                    <div>Validity: {selectedPlan.validity_days} days</div>
                    <div>Price: KES {selectedPlan.price_kes.toLocaleString()}</div>
                  </div>
                  {selectedPlan.description && (
                    <p className="text-sm text-gray-600 mt-2">{selectedPlan.description}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Phone Number Input */}
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>M-Pesa Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+254700000000 or 0700000000"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <p className="text-sm text-gray-600">
                    Enter the phone number linked to your M-Pesa account
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Status */}
            {paymentStatus === 'processing' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Payment processing... Check your phone for M-Pesa prompt</span>
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

            {/* Submit Button */}
            <Button 
              type="submit"
              disabled={loading || !form.formState.isValid}
              className="w-full"
              size="lg"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Pay KES {selectedPlan?.price_kes.toLocaleString() || '0'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
