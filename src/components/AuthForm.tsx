
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HeroSection } from '@/components/ui/hero-section';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Shield, Lock, ArrowRight } from 'lucide-react';

export const AuthForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const { signIn, signUp } = useAuth();

  const [signInData, setSignInData] = useState({
    email: '',
    password: '',
  });

  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(signInData.email, signInData.password);
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signUp(signUpData.email, signUpData.password, signUpData.name, signUpData.phone);
    } catch (error) {
      console.error('Sign up error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!showAuth) {
    return (
      <div className="min-h-screen">
        <HeroSection 
          onGetStarted={() => setShowAuth(true)}
          onLearnMore={() => {
            // Scroll to features or show modal
            console.log('Learn more clicked');
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-light-grey-500 to-white p-4 relative overflow-hidden">
      {/* Back to hero button */}
      <Button
        variant="ghost"
        onClick={() => setShowAuth(false)}
        className="absolute top-6 left-6 z-20 text-ocean-blue-600 hover:text-ocean-blue-700"
      >
        ← Back to Home
      </Button>

      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full bg-[linear-gradient(rgba(0,119,182,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,119,182,0.1)_1px,transparent_1px)]" style={{ backgroundSize: '40px 40px' }}></div>
      </div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Header with modern branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-ocean-blue-500 to-ocean-blue-600 rounded-2xl flex items-center justify-center shadow-glow mr-3">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-heading font-bold text-charcoal-grey-500">
              PrimeBill<span className="text-ocean-blue-500">Kenya</span>
            </h1>
          </div>
          <p className="text-charcoal-grey-400 text-sm">
            Secure access to your network management portal
          </p>
        </div>
        
        <Card className="shadow-cyber border-ocean-blue-100">
          <CardHeader className="text-center">
            <CardTitle className="text-charcoal-grey-500 font-heading text-xl flex items-center justify-center">
              <Lock className="h-5 w-5 mr-2 text-ocean-blue-500" />
              Account Access
            </CardTitle>
            <CardDescription className="text-charcoal-grey-400">
              Sign in to your account or create a new one to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-light-grey-100 border border-ocean-blue-100">
                <TabsTrigger 
                  value="signin"
                  className="data-[state=active]:bg-ocean-blue-500 data-[state=active]:text-white text-charcoal-grey-500 font-medium transition-all duration-200"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="data-[state=active]:bg-ocean-blue-500 data-[state=active]:text-white text-charcoal-grey-500 font-medium transition-all duration-200"
                >
                  Create Account
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="mt-6">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-charcoal-grey-500 font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={signInData.email}
                      onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                      required
                      className="border-ocean-blue-200 focus:ring-ocean-blue-400 focus:border-ocean-blue-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-charcoal-grey-500 font-medium">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={signInData.password}
                      onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                      required
                      className="border-ocean-blue-200 focus:ring-ocean-blue-400 focus:border-ocean-blue-400"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full group" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="mt-6">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-charcoal-grey-500 font-medium">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={signUpData.name}
                      onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                      required
                      className="border-ocean-blue-200 focus:ring-ocean-blue-400 focus:border-ocean-blue-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-charcoal-grey-500 font-medium">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+254 700 000 000"
                      value={signUpData.phone}
                      onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })}
                      required
                      className="border-ocean-blue-200 focus:ring-ocean-blue-400 focus:border-ocean-blue-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-charcoal-grey-500 font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                      required
                      className="border-ocean-blue-200 focus:ring-ocean-blue-400 focus:border-ocean-blue-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-charcoal-grey-500 font-medium">
                      Password
                    </Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a strong password"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                      required
                      className="border-ocean-blue-200 focus:ring-ocean-blue-400 focus:border-ocean-blue-400"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full group" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        {/* Trust indicators */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center space-x-4 text-xs text-charcoal-grey-400">
            <div className="flex items-center space-x-1">
              <Shield className="h-3 w-3 text-forest-green-500" />
              <span>256-bit SSL</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-1">
              <Lock className="h-3 w-3 text-ocean-blue-500" />
              <span>Bank-grade Security</span>
            </div>
            <span>•</span>
            <span className="text-sand-gold-600">ISO 27001</span>
          </div>
        </div>
      </div>
    </div>
  );
};
