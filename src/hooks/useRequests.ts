'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { getCached, setCached, invalidateCache } from '@/lib/cache/clientCache';
import { ManpowerRequest, RequestStatus, UserRole } from '@/types/database';

export function useRequests(userId?: string, role?: UserRole) {
  const [requests, setRequests] = useState<ManpowerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    // H5: Only execute if user session is established; clear stale data otherwise
    if (!userId) {
      setRequests([]);
      setLoading(false);
      return;
    }

    const cacheKey = `requests_${userId}_${role || 'user'}`;
    const cached = getCached<ManpowerRequest[]>(cacheKey);
    if (cached) {
      setRequests(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      if (isSupabaseConfigured()) {
        let query = supabase
          .from('requests')
          .select('*, profiles(*)')
          .order('created_at', { ascending: false });

        if (role !== 'admin') {
          query = query.eq('user_id', userId);
        }

        const { data, error } = await query;
        if (error) {
          console.warn('Supabase requests fetch warning:', error.message);
          if (!cached) setRequests([]);
        } else {
          setRequests(data || []);
          setCached(cacheKey, data || [], 30_000);
        }
      } else if (!cached) {
        setRequests([]);
      }
    } catch (e) {
      console.error('Error fetching requests', e);
      if (!cached) setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [userId, role]);

  const updateRequestStatus = async (requestId: string, newStatus: RequestStatus) => {
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('requests')
          .update({ status: newStatus })
          .eq('id', requestId);
        if (error) throw error;
        invalidateCache('requests_');
      }
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: newStatus } : r))
      );
      return true;
    } catch (e) {
      console.error('Error updating request status', e);
      return false;
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return { requests, loading, refreshRequests: fetchRequests, updateRequestStatus };
}
