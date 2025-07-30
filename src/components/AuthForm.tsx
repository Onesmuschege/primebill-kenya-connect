
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Shield, Terminal } from 'lucide-react';

export const AuthForm = () => {
  const [isLoading, setIsLoading] = useState(false);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
      {/* Cybersecurity background grid */}
      <div className="absolute inset-0 grid-bg opacity-20"></div>
      
      {/* Terminal scanlines effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent animate-pulse"></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Header with terminal aesthetic */}
        <div className="flex items-center justify-center mb-8 terminal-glow">
          <Terminal className="h-8 w-8 text-terminalGreen mr-3 animate-pulse" />
          <Shield className="h-8 w-8 text-neonBlue mr-3" />
          <h1 className="text-2xl font-mono font-bold text-neonBlue tracking-wider">
            PRIMEBILL<span className="text-terminalGreen animate-terminal-cursor">_</span>
          </h1>
        </div>
        
        {/* Terminal info line */}
        <div className="mb-6 p-3 bg-black/40 border border-terminalGreen/30 rounded font-mono text-xs text-terminalGreen">
          <div className="flex items-center">
            <span className="text-terminalGreen">root@cybersec:~$</span>
            <span className="ml-2 text-cyan-400">Secure Network Access Portal</span>
            <span className="ml-auto text-neonBlue">[ENCRYPTED]</span>
          </div>
        </div>
        
        <Card className="glass-morphism border-cyan-500/30 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-neonBlue font-futuristic text-xl">
              Network Access Control
            </CardTitle>
            <CardDescription className="text-gray-300 font-mono text-sm">
              Authenticate to access ISP management system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-[#1A1A2E] border border-cyan-500/20">
                <TabsTrigger 
                  value="signin"
                  className="data-[state=active]:bg-neonBlue data-[state=active]:text-black text-cyan-400 font-mono"
                >
                  SIGN IN
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="data-[state=active]:bg-neonBlue data-[state=active]:text-black text-cyan-400 font-mono"
                >
                  REGISTER
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="mt-6">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-cyan-400 font-mono text-sm">
                      EMAIL ADDRESS
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@primebill.network"
                      value={signInData.email}
                      onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                      required
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-cyan-400 font-mono text-sm">
                      PASSWORD
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••••••"
                      value={signInData.password}
                      onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                      required
                      className="font-mono"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full font-mono tracking-wider" 
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    AUTHENTICATE
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="mt-6">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-cyan-400 font-mono text-sm">
                      FULL NAME
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={signUpData.name}
                      onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                      required
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-cyan-400 font-mono text-sm">
                      PHONE NUMBER
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+254700000000"
                      value={signUpData.phone}
                      onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })}
                      required
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-cyan-400 font-mono text-sm">
                      EMAIL ADDRESS
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="user@primebill.network"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                      required
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-cyan-400 font-mono text-sm">
                      PASSWORD
                    </Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••••••"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                      required
                      className="font-mono"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full font-mono tracking-wider" 
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    CREATE ACCOUNT
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        {/* Footer terminal line */}
        <div className="mt-6 p-2 text-center font-mono text-xs text-gray-500">
          <span className="text-terminalGreen">[SECURE CONNECTION]</span>
          <span className="mx-2">•</span>
          <span className="text-cyan-400">TLS 1.3 ENCRYPTED</span>
          <span className="mx-2">•</span>
          <span className="text-neonBlue">PRIMEBILL SYSTEMS</span>
        </div>
      </div>
    </div>
  );
};
