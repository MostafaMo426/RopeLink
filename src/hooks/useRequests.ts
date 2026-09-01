'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { ManpowerRequest } from '@/types/database';

export function useRequests(userId?: string) {
  const [requests, setRequests] = useState<ManpowerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        let query = supabase
          .from('requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (userId) {
          query = query.eq('user_id', userId);
        }

        const { data, error } = await query;
        if (error) {
          console.warn('Supabase requests fetch warning:', error.message);
          setRequests([]);
        } else {
          setRequests(data || []);
        }
      } else {
        setRequests([]);
      }
    } catch (e) {
      console.error('Error fetching requests', e);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return { requests, loading, refreshRequests: fetchRequests };
}
