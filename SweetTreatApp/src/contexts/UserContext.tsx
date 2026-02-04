import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/src/services/supabase';
import { authService } from '@/src/services/authService';
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
    // Validate session server-side on startup. Unlike getSession() which
    // returns the cached token from AsyncStorage (possibly expired),
    // getUser() makes a network call that forces a token refresh if needed.
    supabase.auth.getUser().then(({ data: { user: validatedUser } }) => {
      if (validatedUser) {
        // Token is valid (or was refreshed successfully).
        // Now read the refreshed session from the client.
        supabase.auth.getSession().then(({ data: { session: freshSession } }) => {
          setSession(freshSession);
          setUser(validatedUser);
          fetchProfile(validatedUser.id).finally(() => setLoading(false));
        });
      } else {
        // No valid session — clear state and go to login
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    }).catch(() => {
      // Network error on startup — clear state so the user can re-login
      setSession(null);
      setUser(null);
      setProfile(null);
      setLoading(false);
    });

    // Listen for auth changes, but distinguish event types
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        setIsNewUser(false);
        return;
      }

      // TOKEN_REFRESHED, SIGNED_IN, USER_UPDATED — update session state
      if (session?.user) {
        setSession(session);
        setUser(session.user);

        // Only fetch profile on sign-in, not on every token refresh
        if (event === 'SIGNED_IN') {
          await fetchProfile(session.user.id);
        }
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
