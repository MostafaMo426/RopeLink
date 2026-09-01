'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Profile } from '@/types/database';
import { User } from '@supabase/supabase-js';

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (uid: string) => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();
      if (data) setProfile(data);
    } catch (e) {
      console.warn('Error fetching profile:', e);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      setLoading(true);
      try {
        if (isSupabaseConfigured()) {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser && isMounted) {
            setUser(currentUser);
            await fetchProfile(currentUser.id);
          } else if (isMounted) {
            setUser(null);
            setProfile(null);
          }
        }
      } catch (e) {
        console.warn('Supabase auth initialization error:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    let authSubscription: any = null;
    if (isSupabaseConfigured()) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user && isMounted) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else if (isMounted) {
          setUser(null);
          setProfile(null);
        }
      });
      authSubscription = data.subscription;
    }

    return () => {
      isMounted = false;
      if (authSubscription) authSubscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  return { user, profile, loading, signOut, setUser, refreshProfile };
}
