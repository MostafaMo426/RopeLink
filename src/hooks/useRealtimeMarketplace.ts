'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { getCached, setCached, invalidateCache } from '@/lib/cache/clientCache';
import { ManpowerRequest, MatchProposal, MatchStatus } from '@/types/database';

export function useRealtimeMarketplace(userId?: string) {
  const [requests, setRequests] = useState<ManpowerRequest[]>([]);
  const [matches, setMatches] = useState<MatchProposal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMarketplace = useCallback(async () => {
    // Serve from cache if available for instantaneous rendering
    const cachedReqs = getCached<ManpowerRequest[]>('mkt_requests');
    if (cachedReqs) setRequests(cachedReqs);

    let cachedMatches: MatchProposal[] | null = null;
    if (userId) {
      cachedMatches = getCached<MatchProposal[]>(`matches_${userId}`);
      if (cachedMatches) setMatches(cachedMatches);
    } else {
      // H5: Strictly reset matches when no user session is present
      setMatches([]);
    }

    if (!cachedReqs && !(userId && cachedMatches)) {
      setLoading(true);
    }

    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('requests')
          .select('*, profiles:profile_directory!requests_user_id_fkey(id, company_name, city, verification_status)')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Marketplace fetch error:', error.message);
        } else if (data) {
          setRequests(data);
          setCached('mkt_requests', data, 20_000);
        }

        if (userId) {
          const { data: matchData, error: matchErr } = await supabase
            .from('matches')
            .select('*, request:requests(*), proposer:profile_directory!matches_proposer_id_fkey(id, company_name, city, verification_status), recipient:profile_directory!matches_recipient_id_fkey(id, company_name, city, verification_status)')
            .or(`proposer_id.eq.${userId},recipient_id.eq.${userId}`)
            .order('created_at', { ascending: false });
          if (!matchErr && matchData) {
            setMatches(matchData);
            setCached(`matches_${userId}`, matchData, 20_000);
          }
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
      invalidateCache('matches_');
      invalidateCache('mkt_requests');
      await fetchMarketplace();
      return true;
    } catch (e) {
      console.error('Error sending match proposal', e);
      return false;
    }
  };

  const updateMatchStatus = async (
    matchId: string,
    status: MatchStatus
  ): Promise<boolean> => {
    if (!isSupabaseConfigured()) return false;
    try {
      const { error } = await supabase
        .from('matches')
        .update({ status })
        .eq('id', matchId);
      if (error) throw error;
      invalidateCache('matches_');
      invalidateCache('mkt_requests');
      await fetchMarketplace();
      return true;
    } catch (e) {
      console.error('Error updating match status', e);
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
    updateMatchStatus,
  };
}
