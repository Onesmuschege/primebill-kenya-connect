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

  const clearInvalidSession = useCallback(async () => {
    console.log('Clearing invalid session...');
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      setUser(null);
      setSession(null);
      setLoading(false);
      window.location.reload();
    } catch (error) {
      console.error('Error clearing session:', error);
      window.location.reload();
    }
  }, []);

  const handleAuthError = useCallback((error: unknown) => {
    console.error('Auth error:', error);
    if (
      error?.message?.includes('Failed to fetch') ||
      error?.message?.includes('refresh_token') ||
      error?.status === 0 ||
      error?.__isAuthError
    ) {
      console.log('Detected auth token issue, clearing session...');
      clearInvalidSession();
    }
  }, [clearInvalidSession]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
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

    initializeAuth();

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

    return () => subscription.unsubscribe();
  }, [handleAuthError]);

  const fetchUserProfile = async (authUser: User) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('name, phone, role')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.warn('[Auth] Failed to fetch user profile from DB:', error.message);
        throw new Error('Could not retrieve user profile from database');
      }

      if (!profile) {
        console.warn('[Auth] User profile not found, falling back to user_metadata');
        setUser({
          ...authUser,
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          phone: authUser.user_metadata?.phone || '',
          role: 'client',
        });
        return;
      }

      setUser({
        ...authUser,
        name: profile.name,
        phone: profile.phone,
        role: profile.role,
      });
    } catch (err: any) {
      console.error('[Auth] Unexpected error while fetching user profile:', err.message || err);
      setUser(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        clearTimeout(timeoutId);

        if (error) {
          // Track failed login attempt
          await supabase.rpc('handle_failed_login', { user_email: email });
          
          if (
            error.message.includes('Invalid login credentials') ||
            error.message.includes('Email not confirmed') ||
            error.message.includes('Too many requests')
          ) {
            throw error;
          }

          if (retryCount < maxRetries - 1) {
            retryCount++;
            await new Promise(res => setTimeout(res, retryCount * 1000));
            continue;
          }

          throw error;
        }

        // Track successful login
        if (data.user) {
          await supabase.rpc('handle_successful_login', { user_id: data.user.id });
        }

        toast({ title: 'Success', description: 'Signed in successfully' });
        return;
      } catch (error: any) {
        if (error.name === 'AbortError') {
          error.message = 'Request timed out. Please check your connection and try again.';
        }

        if (
          retryCount >= maxRetries - 1 ||
          error.message.includes('Invalid login credentials') ||
          error.message.includes('Email not confirmed') ||
          error.message.includes('Too many requests')
        ) {
          handleAuthError(error);
          toast({ title: 'Error', description: error.message, variant: 'destructive' });
          throw error;
        }

        retryCount++;
        await new Promise(res => setTimeout(res, retryCount * 1000));
      }
    }
  };

  const signUp = async (email: string, password: string, name: string, phone: string) => {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { name, phone },
          },
        });

        clearTimeout(timeoutId);

        if (error) {
          if (
            error.message.includes('User already registered') ||
            error.message.includes('Password should be') ||
            error.message.includes('Invalid email') ||
            error.message.includes('Too many requests')
          ) {
            throw error;
          }

          if (retryCount < maxRetries - 1) {
            retryCount++;
            await new Promise(res => setTimeout(res, retryCount * 1000));
            continue;
          }

          throw error;
        }

        toast({
          title: 'Success',
          description: 'Account created successfully! Please check your email to verify your account.',
        });
        return;
      } catch (error: any) {
        if (error.name === 'AbortError') {
          error.message = 'Request timed out. Please check your connection and try again.';
        }

        if (
          retryCount >= maxRetries - 1 ||
          error.message.includes('User already registered') ||
          error.message.includes('Password should be') ||
          error.message.includes('Invalid email') ||
          error.message.includes('Too many requests')
        ) {
          handleAuthError(error);
          toast({ title: 'Error', description: error.message, variant: 'destructive' });
          throw error;
        }

        retryCount++;
        await new Promise(res => setTimeout(res, retryCount * 1000));
      }
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({ title: 'Success', description: 'Signed out successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      throw error;
    }
  };

  const updateProfile = async (data: { name?: string; phone?: string }) => {
    try {
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase.from('users').update(data).eq('id', user.id);

      if (error) throw error;

      setUser({ ...user, ...data });

      toast({ title: 'Success', description: 'Profile updated successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        updateProfile,
        clearInvalidSession,
      }}
    >
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
