'use client';

import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Profile } from '@/types/database';

export function useSupabaseAuth() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      setLoading(true);
      if (isSupabaseConfigured()) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser(session.user);
            const { data: prof } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            if (prof) setProfile(prof);
          }
        } catch (e) {
          console.warn('Supabase fetch error, fallback to local', e);
        }
      } else {
        const stored = sessionStorage.getItem('ropelink_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed);
          setProfile({
            id: parsed.id,
            company_name: parsed.user_metadata?.company_name || 'شركة المقاولات النموذجية',
            role: parsed.user_metadata?.role || 'contractor',
            city: 'Jubail',
            has_seen_tutorial: localStorage.getItem('ropelink_has_seen_tutorial') === 'true',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      }
      setLoading(false);
    };

    fetchSession();
  }, []);

  const signOut = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    sessionStorage.removeItem('ropelink_user');
    setUser(null);
    setProfile(null);
  };

  return { user, profile, loading, signOut, setUser };
}
