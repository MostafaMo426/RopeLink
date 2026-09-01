'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { ManpowerRequest, MatchProposal } from '@/types/database';

export function useRealtimeMarketplace(userId?: string) {
  const [requests, setRequests] = useState<ManpowerRequest[]>([]);
  const [matches, setMatches] = useState<MatchProposal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMarketplace = useCallback(async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('requests')
          .select('*, profiles(*)')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Marketplace fetch error:', error.message);
        } else {
          setRequests(data || []);
        }

        if (userId) {
          const { data: matchData } = await supabase
            .from('matches')
            .select('*, request:requests(*)')
            .or(`proposer_id.eq.${userId},recipient_id.eq.${userId}`)
            .order('created_at', { ascending: false });
          setMatches(matchData || []);
        }
      }
    } catch (e) {
      console.error('Realtime marketplace fetch exception', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const sendMatchProposal = async (
    requestId: string,
    recipientId: string,
    message: string
  ): Promise<boolean> => {
    if (!userId || !isSupabaseConfigured()) return false;
    try {
      const { error } = await supabase.from('matches').insert([
        {
          request_id: requestId,
          proposer_id: userId,
          recipient_id: recipientId,
          message: message.trim(),
          status: 'pending',
        },
      ]);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Error sending match proposal', e);
      return false;
    }
  };

  useEffect(() => {
    fetchMarketplace();

    if (!isSupabaseConfigured()) return;

    // Real-time Postgres channel subscription
    const channel = supabase
      .channel('marketplace_feed_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requests' },
        () => {
          fetchMarketplace();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        () => {
          fetchMarketplace();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMarketplace]);

  return {
    requests,
    matches,
    loading,
    refreshMarketplace: fetchMarketplace,
    sendMatchProposal,
  };
}
