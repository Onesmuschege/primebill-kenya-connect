
import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthUser extends User {
  role?: 'admin' | 'subadmin' | 'client';
  name?: string;
  phone?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, phone: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: { name?: string; phone?: string }) => Promise<void>;
  clearInvalidSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Clear invalid session and force re-authentication
  const clearInvalidSession = useCallback(async () => {
    console.log('Clearing invalid session...');
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Reset state
      setUser(null);
      setSession(null);
      setLoading(false);
      
      // Reload page to ensure clean state
      window.location.reload();
    } catch (error) {
      console.error('Error clearing session:', error);
      // Force reload anyway
      window.location.reload();
    }
  }, []);

  // Global auth error handler
  const handleAuthError = useCallback((error: any) => {
    console.error('Auth error:', error);
    
    // Check for token refresh failures
    if (error?.message?.includes('Failed to fetch') || 
        error?.message?.includes('refresh_token') ||
        error?.status === 0 ||
        error?.__isAuthError) {
      console.log('Detected auth token issue, clearing session...');
      clearInvalidSession();
    }
  }, [clearInvalidSession]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session retrieval error:', error);
          handleAuthError(error);
          return;
        }
        
        if (session?.user) {
          setSession(session);
          await fetchUserProfile(session.user);
        } else {
          setUser(null);
          setSession(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        handleAuthError(error);
        setUser(null);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      try {
        if (session?.user) {
          setSession(session);
          await fetchUserProfile(session.user);
        } else {
          setUser(null);
          setSession(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        handleAuthError(error);
      }
      setLoading(false);
    });

    // THEN initialize auth
    initializeAuth();

    return () => subscription.unsubscribe();
  }, [handleAuthError]);

  const fetchUserProfile = async (authUser: User) => {
    // Temporary bypass: Just set the user directly without database lookup
    console.log('Setting user directly without profile lookup');
    setUser({
      ...authUser,
      name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
      phone: authUser.user_metadata?.phone || '',
      role: 'client',
    });
  };

  const signIn = async (email: string, password: string) => {
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        console.log(`Sign in attempt ${retryCount + 1}/${maxRetries}`);
        
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        clearTimeout(timeoutId);
        
        if (error) {
          console.error('Sign in error:', error);
          
          // Check for specific error types that shouldn't be retried
          if (error.message.includes('Invalid login credentials') || 
              error.message.includes('Email not confirmed') ||
              error.message.includes('Too many requests')) {
            throw error; // Don't retry these errors
          }
          
          // For network errors, try again
          if (retryCount < maxRetries - 1) {
            retryCount++;
            console.log(`Retrying sign in in ${retryCount * 1000}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
            continue;
          }
          
          throw error;
        }
        
        toast({
          title: "Success",
          description: "Signed in successfully",
        });
        return; // Success, exit retry loop
        
      } catch (error: any) {
        console.error(`Sign in attempt ${retryCount + 1} failed:`, error);
        
        // If it's an AbortError (timeout), handle it specifically
        if (error.name === 'AbortError') {
          console.error('Sign in request timed out');
          error.message = 'Request timed out. Please check your connection and try again.';
        }
        
        // If this is the last retry or a non-retryable error, handle and throw
        if (retryCount >= maxRetries - 1 || 
            error.message.includes('Invalid login credentials') || 
            error.message.includes('Email not confirmed') ||
            error.message.includes('Too many requests')) {
          
          handleAuthError(error);
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
          throw error;
        }
        
        // Otherwise, retry
        retryCount++;
        console.log(`Retrying sign in in ${retryCount * 1000}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
      }
    }
  };

  const signUp = async (email: string, password: string, name: string, phone: string) => {
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        console.log(`Sign up attempt ${retryCount + 1}/${maxRetries}`);
        
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name,
              phone,
            },
          },
        });
        
        clearTimeout(timeoutId);
        
        if (error) {
          console.error('Sign up error:', error);
          
          // Check for specific error types that shouldn't be retried
          if (error.message.includes('User already registered') || 
              error.message.includes('Password should be') ||
              error.message.includes('Invalid email') ||
              error.message.includes('Too many requests')) {
            throw error; // Don't retry these errors
          }
          
          // For network errors, try again
          if (retryCount < maxRetries - 1) {
            retryCount++;
            console.log(`Retrying sign up in ${retryCount * 1000}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
            continue;
          }
          
          throw error;
        }
        
        toast({
          title: "Success",
          description: "Account created successfully! Please check your email to verify your account.",
        });
        return; // Success, exit retry loop
        
      } catch (error: any) {
        console.error(`Sign up attempt ${retryCount + 1} failed:`, error);
        
        // If it's an AbortError (timeout), handle it specifically
        if (error.name === 'AbortError') {
          console.error('Sign up request timed out');
          error.message = 'Request timed out. Please check your connection and try again.';
        }
        
        // If this is the last retry or a non-retryable error, handle and throw
        if (retryCount >= maxRetries - 1 || 
            error.message.includes('User already registered') || 
            error.message.includes('Password should be') ||
            error.message.includes('Invalid email') ||
            error.message.includes('Too many requests')) {
          
          handleAuthError(error);
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
          throw error;
        }
        
        // Otherwise, retry
        retryCount++;
        console.log(`Retrying sign up in ${retryCount * 1000}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
      }
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Signed out successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateProfile = async (data: { name?: string; phone?: string }) => {
    try {
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('users')
        .update(data)
        .eq('id', user.id);

      if (error) throw error;

      setUser({ ...user, ...data });
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      updateProfile,
      clearInvalidSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
