'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { ManpowerRequest, RequestStatus, UserRole } from '@/types/database';

export function useRequests(userId?: string, role?: UserRole) {
  const [requests, setRequests] = useState<ManpowerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    // Only execute if user session is established
    if (!userId) {
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        let query = supabase
          .from('requests')
          .select('*')
          .order('created_at', { ascending: false });

        // If regular contractor/supplier, restrict query to their own user_id
        if (role !== 'admin') {
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
  }, [userId, role]);

  const updateRequestStatus = async (requestId: string, newStatus: RequestStatus) => {
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('requests')
          .update({ status: newStatus })
          .eq('id', requestId);
        if (error) throw error;
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
