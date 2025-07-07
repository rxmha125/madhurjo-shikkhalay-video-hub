
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  name: string;
  avatar?: string;
  description?: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ error: any }>;
  signup: (email: string, password: string, name: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        
        // Handle password recovery
        if (event === 'PASSWORD_RECOVERY') {
          console.log('Password recovery event detected');
          // The session contains the new session after password reset
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setIsLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setTimeout(async () => {
          const { data: retryData, error: retryError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();
          
          if (!retryError && retryData) {
            setProfile(retryData);
          }
          setIsLoading(false);
        }, 1000);
      } else {
        console.log('Profile fetched:', data);
        setProfile(data);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    console.log('Attempting login for:', email);
    setIsLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('Login result:', { error });
    setIsLoading(false);
    return { error };
  };

  const signup = async (email: string, password: string, name: string) => {
    console.log('Attempting signup for:', email, 'with name:', name);
    setIsLoading(true);
    
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: name,
        }
      }
    });

    console.log('Signup result:', { data, error });
    setIsLoading(false);
    return { error };
  };

  const logout = async () => {
    console.log('Logging out');
    await supabase.auth.signOut();
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !profile) return;
    
    console.log('Updating profile:', updates);
    
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id);

    if (!error) {
      setProfile({ ...profile, ...updates });
    } else {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      login,
      signup,
      logout,
      updateProfile,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};
