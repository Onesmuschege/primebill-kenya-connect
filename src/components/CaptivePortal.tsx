import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wifi, CreditCard, User, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { PaymentForm } from './PaymentForm';

interface Plan {
  id: string;
  name: string;
  price_kes: number;
  speed_limit_mbps: number;
  validity_days: number;
  description: string | null;
}

interface UserSession {
  id: string;
  user_id: string;
  router_id: string;
  ip_address: string | unknown;
  mac_address: string;
  session_start: string;
  connection_start?: string;
  subscription?: {
    id: string;
    plans?: {
      name: string;
      speed_limit_mbps: number;
    };
    end_date: string;
    status: string;
  };
}

export const CaptivePortal = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<unknown>(null);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  
  // Login form
  const [loginData, setLoginData] = useState({
    phone: '',
    password: ''
  });
  
  // Registration form
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  // Get client IP and MAC from URL parameters (set by router)
  const urlParams = new URLSearchParams(window.location.search);
  const clientIp = urlParams.get('ip') || 'unknown';
  const clientMac = urlParams.get('mac') || 'unknown';
  const routerId = urlParams.get('router_id') || '';

  useEffect(() => {
    fetchPlans();
    checkExistingSession();
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
    } catch (error: unknown) {
      console.error('Error fetching plans:', error);
    }
  };

  const checkExistingSession = async () => {
    try {
      // Check if there's an existing session for this IP/MAC
      const { data: session, error } = await supabase
        .from('user_connections')
        .select(`
          *,
          users (
            id, name, email, phone,
            subscriptions!inner (
              id, end_date, status,
              plans (name, speed_limit_mbps)
            )
          )
        `)
        .eq('ip_address', clientIp)
        .eq('status', 'active')
        .single();

      if (!error && session) {
        setUserSession({
          ...session,
          session_start: session.connection_start || new Date().toISOString()
        });
        setCurrentUser(session.users as any);
      }
    } catch (error: unknown) {
      console.error('Error checking session:', error);
    }
  };

  const handleLogin = async () => {
    if (!loginData.phone || !loginData.password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // First authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginData.phone.includes('@') ? loginData.phone : `${loginData.phone}@temp.local`,
        password: loginData.password
      });

      if (authError) {
        // Try phone number authentication
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('phone', formatKenyanPhone(loginData.phone))
          .single();

        if (userError || !user) {
          throw new Error('Invalid phone number or password');
        }

        setCurrentUser(user);
      } else {
        setCurrentUser(authData.user);
      }

      // Check if user has active subscription
      await checkUserSubscription();
      
      toast({
        title: "Success",
        description: "Logged in successfully",
      });

    } catch (error: unknown) {
      toast({
        title: "Error",
        description: (error as any)?.message || "Login failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!registerData.name || !registerData.email || !registerData.phone || !registerData.password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          data: {
            name: registerData.name,
            phone: formatKenyanPhone(registerData.phone),
            role: 'client'
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Account created successfully! Please choose a plan to get started.",
      });

      setCurrentUser(data.user);

    } catch (error: unknown) {
      toast({
        title: "Error",
        description: (error as any)?.message || "Registration failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkUserSubscription = async () => {
    if (!currentUser) return;

    try {
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plans (*)
        `)
        .eq('user_id', (currentUser as any)?.id)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString().split('T')[0])
        .single();

      if (!error && subscription) {
        // User has active subscription, create network session
        await createNetworkSession(subscription);
      }
    } catch (error: any) {
      console.error('Error checking subscription:', error);
    }
  };

  const createNetworkSession = async (subscription: any) => {
    try {
      // Create user connection record
      const { data: connection, error: connectionError } = await supabase
        .from('user_connections')
        .insert([{
          user_id: (currentUser as any)?.id,
          router_id: routerId,
          ip_address: clientIp,
          mac_address: clientMac,
          status: 'active'
        }])
        .select()
        .single();

      if (connectionError) throw connectionError;

      // Call router control to create user on MikroTik
      const { error: routerError } = await supabase.functions.invoke('router-control', {
        body: {
          action: 'create_user',
          user_id: (currentUser as any)?.id,
          router_id: routerId,
          username: (currentUser as any)?.phone || (currentUser as any)?.email,
          profile: `Plan_${subscription.plans.speed_limit_mbps}M`
        }
      });

      if (routerError) {
        console.error('Router control error:', routerError);
      }

      // Redirect to success page or allow internet access
      window.location.href = '/portal/success';

    } catch (error: any) {
      console.error('Error creating network session:', error);
      toast({
        title: "Error",
        description: "Failed to create network session",
        variant: "destructive",
      });
    }
  };

  const handlePlanSelection = (plan: Plan) => {
    setSelectedPlan(plan);
  };

  const formatKenyanPhone = (phone: string): string => {
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    if (cleaned.startsWith('+254')) {
      return cleaned;
    } else if (cleaned.startsWith('254')) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('0')) {
      return `+254${cleaned.slice(1)}`;
    }
    
    return `+254${cleaned}`;
  };

  // If user is already connected and has active session
  if (userSession && currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Connected</CardTitle>
            <CardDescription>
              You are connected to the internet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p><strong>User:</strong> {(currentUser as any)?.name}</p>
              <p><strong>Plan:</strong> {userSession.subscription?.plans?.name}</p>
              <p><strong>Speed:</strong> {userSession.subscription?.plans?.speed_limit_mbps}Mbps</p>
              <p><strong>Valid Until:</strong> {new Date(userSession.subscription?.end_date || '').toLocaleDateString()}</p>
            </div>
            <Button 
              onClick={() => window.location.href = 'http://google.com'} 
              className="w-full"
            >
              Continue Browsing
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is logged in but needs to select a plan
  if (currentUser && !userSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {(currentUser as any)?.name || (currentUser as any)?.email}!</h1>
            <p className="text-gray-600">Choose a plan to get connected</p>
          </div>

          {selectedPlan ? (
            <PaymentForm />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <Card key={plan.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                        <CardDescription className="mt-2">
                          {plan.description}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          KES {plan.price_kes}
                        </div>
                        <div className="text-sm text-gray-500">
                          {plan.validity_days} days
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm">
                        <Wifi className="h-4 w-4 mr-2 text-blue-500" />
                        <span>{plan.speed_limit_mbps}Mbps Speed</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-2 text-green-500" />
                        <span>Valid for {plan.validity_days} days</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handlePlanSelection(plan)}
                      className="w-full"
                    >
                      Select Plan
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main portal login/register interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Wifi className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">PrimeBill Solutions</CardTitle>
          <CardDescription>
            Connect to high-speed internet
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="login" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+254700000000"
                  value={loginData.phone}
                  onChange={(e) => setLoginData({ ...loginData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                />
              </div>
              <Button 
                onClick={handleLogin} 
                className="w-full" 
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <User className="h-4 w-4 mr-2" />}
                Login
              </Button>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-phone">Phone Number</Label>
                <Input
                  id="reg-phone"
                  placeholder="+254700000000"
                  value={registerData.phone}
                  onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">Password</Label>
                <Input
                  id="reg-password"
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                />
              </div>
              <Button 
                onClick={handleRegister} 
                className="w-full" 
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <User className="h-4 w-4 mr-2" />}
                Create Account
              </Button>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Need help? Contact support at:</p>
            <p>📞 +254700000000 | support@primebill.co.ke</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};