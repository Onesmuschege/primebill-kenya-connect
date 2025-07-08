
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price_kes: number;
  speed_limit_mbps: number;
  validity_days: number;
  description: string | null;
}

export const PaymentForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');

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
      toast({
        title: "Error",
        description: "Failed to fetch plans",
        variant: "destructive",
      });
    }
  };

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

  const handlePayment = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to make a payment",
        variant: "destructive",
      });
      return;
    }

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

    setLoading(true);
    setPaymentStatus('processing');

    try {
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
      setLoading(false);
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
          // Refresh the page or redirect to dashboard
          window.location.reload();
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

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Purchase Internet Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plan Selection */}
        <div className="space-y-2">
          <Label>Select Plan</Label>
          <Select onValueChange={(value) => {
            const plan = plans.find(p => p.id === value);
            setSelectedPlan(plan || null);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Choose your internet plan" />
            </SelectTrigger>
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
        </div>

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
        <div className="space-y-2">
          <Label htmlFor="phone">M-Pesa Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+254700000000 or 0700000000"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={loading}
          />
          <p className="text-sm text-gray-600">
            Enter the phone number linked to your M-Pesa account
          </p>
        </div>

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

        {/* Pay Button */}
        <Button 
          onClick={handlePayment} 
          disabled={!selectedPlan || !phoneNumber || loading}
          className="w-full"
          size="lg"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Pay KES {selectedPlan?.price_kes.toLocaleString() || '0'}
        </Button>
      </CardContent>
    </Card>
  );
};
