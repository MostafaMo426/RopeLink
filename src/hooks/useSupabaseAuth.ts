'use client';

import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Profile } from '@/types/database';
import { User } from '@supabase/supabase-js';

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      setLoading(true);
      try {
        if (isSupabaseConfigured()) {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser && isMounted) {
            setUser(currentUser);
            const { data: prof } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentUser.id)
              .maybeSingle();
            if (prof && isMounted) setProfile(prof);
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
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          if (prof && isMounted) setProfile(prof);
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
  }, []);

  const signOut = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
  };

  return { user, profile, loading, signOut, setUser };
}
