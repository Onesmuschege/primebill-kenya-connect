
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowUp, ArrowDown, Check, Zap, Wifi, Clock } from 'lucide-react';

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
  const [upgrading, setUpgrading] = useState<string | null>(null);
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

  const handlePlanChange = async (newPlanId: string, isUpgrade: boolean) => {
    try {
      setUpgrading(newPlanId);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to change your plan",
          variant: "destructive",
        });
        return;
      }

      if (isUpgrade) {
        // For upgrades, redirect to payment
        toast({
          title: "Payment Required",
          description: "You will be redirected to make payment for the upgrade",
        });
        // Here you would typically redirect to payment page or open payment dialog
        // For now, we'll show a placeholder
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
            new_plan_id: newPlanId,
            effective_date: currentSubscription?.end_date
          }
        });
      }
    } catch (error) {
      console.error('Error changing plan:', error);
      toast({
        title: "Error",
        description: "Failed to change plan",
        variant: "destructive",
      });
    } finally {
      setUpgrading(null);
    }
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
        <Card className="border-2 border-primary">
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
              <Badge variant="default">Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Speed: {currentPlan?.speed_limit_mbps} Mbps</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Validity: {currentPlan?.validity_days} days</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">KSh {currentPlan?.price_kes}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan?.id === plan.id;
            const isUpgrade = plan.speed_limit_mbps > currentSpeed;
            const isDowngrade = plan.speed_limit_mbps < currentSpeed && currentSpeed > 0;
            
            return (
              <Card key={plan.id} className={isCurrentPlan ? 'border-primary bg-primary/5' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    {isCurrentPlan && <Badge variant="default">Current</Badge>}
                    {isUpgrade && <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      Upgrade
                    </Badge>}
                    {isDowngrade && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <ArrowDown className="h-3 w-3 mr-1" />
                      Downgrade
                    </Badge>}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">KSh {plan.price_kes}</span>
                      <span className="text-sm text-muted-foreground">per {plan.validity_days} days</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{plan.speed_limit_mbps} Mbps</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{plan.validity_days} days validity</span>
                      </div>
                    </div>

                    {!isCurrentPlan && currentSubscription && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            className="w-full" 
                            variant={isUpgrade ? "default" : "outline"}
                            disabled={upgrading === plan.id}
                          >
                            {upgrading === plan.id ? "Processing..." : 
                             isUpgrade ? "Upgrade Now" : "Schedule Downgrade"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              {isUpgrade ? "Upgrade Plan" : "Downgrade Plan"}
                            </DialogTitle>
                            <DialogDescription>
                              {isUpgrade 
                                ? `Upgrade from ${currentPlan?.name} to ${plan.name}. You'll be charged the difference immediately.`
                                : `Downgrade from ${currentPlan?.name} to ${plan.name}. This will take effect at the end of your current billing cycle.`
                              }
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="border rounded-lg p-4">
                              <h4 className="font-medium mb-2">Plan Comparison</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Current</p>
                                  <p>{currentPlan?.name}</p>
                                  <p>{currentPlan?.speed_limit_mbps} Mbps</p>
                                  <p>KSh {currentPlan?.price_kes}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">New</p>
                                  <p>{plan.name}</p>
                                  <p>{plan.speed_limit_mbps} Mbps</p>
                                  <p>KSh {plan.price_kes}</p>
                                </div>
                              </div>
                            </div>
                            <Button 
                              className="w-full" 
                              onClick={() => handlePlanChange(plan.id, isUpgrade)}
                              disabled={upgrading === plan.id}
                            >
                              {upgrading === plan.id ? "Processing..." : 
                               isUpgrade ? "Proceed to Payment" : "Confirm Downgrade"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}

                    {!currentSubscription && (
                      <Button className="w-full" variant="default">
                        Select Plan
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PlanUpgrade;
