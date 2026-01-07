import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { authService } from '@/src/services/authService';
import { supabase } from '@/src/services/supabase';
import { Profile } from '@/src/types';

interface UserContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ hasProfile: boolean }>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isNewUser: boolean;
  setIsNewUser: (value: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  const fetchProfile = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Profile doesn't exist yet - this is a new user
        if (error.code === 'PGRST116') {
          setProfile(null);
          setIsNewUser(true);
          return false;
        }
        throw error;
      }

      setProfile(data);
      setIsNewUser(false);
      return true;
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      return false;
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Get initial session
    authService.getSession().then((session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { subscription } = authService.onAuthStateChange(async (session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setIsNewUser(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ hasProfile: boolean }> => {
    setLoading(true);
    try {
      const data = await authService.signIn(email, password);
      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        const hasProfile = await fetchProfile(data.user.id);
        return { hasProfile };
      }
      return { hasProfile: false };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await authService.signUp(email, password);
      if (data && data.user) {
        setUser(data.user);
        setSession(data.session);
        setIsNewUser(true);
        // Profile will be created in the profile creation screen
      } else {
        throw new Error('Sign up failed: No user returned');
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setProfile(null);
      setIsNewUser(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        isNewUser,
        setIsNewUser,
      }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
