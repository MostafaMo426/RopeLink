'use client';

import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Profile } from '@/types/database';

export function useSupabaseAuth() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchSession = async () => {
      setLoading(true);
      try {
        if (isSupabaseConfigured()) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && isMounted) {
            setUser(session.user);
            const { data: prof } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();
            if (prof && isMounted) setProfile(prof);
          }
        } else {
          const stored = typeof window !== 'undefined' ? sessionStorage.getItem('ropelink_user') : null;
          if (stored && stored.trim()) {
            try {
              const parsed = JSON.parse(stored);
              if (parsed && isMounted) {
                setUser(parsed);
                setProfile({
                  id: parsed.id || 'demo-user-saudi-01',
                  company_name: parsed.user_metadata?.company_name || 'شركة المقاولات النموذجية',
                  role: parsed.user_metadata?.role || 'contractor',
                  city: 'Jubail',
                  has_seen_tutorial: localStorage.getItem('ropelink_has_seen_tutorial') === 'true',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });
              }
            } catch {
              sessionStorage.removeItem('ropelink_user');
            }
          }
        }
      } catch (e) {
        console.warn('Session initialization warning:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSession();

    // Listen for Supabase auth state changes
    let authListener: any = null;
    if (isSupabaseConfigured()) {
      const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
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
      authListener = data.subscription;
    }

    return () => {
      isMounted = false;
      if (authListener) authListener.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Sign out error', e);
      }
    }
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('ropelink_user');
    }
    setUser(null);
    setProfile(null);
  };

  return { user, profile, loading, signOut, setUser };
}
