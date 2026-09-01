'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Agreement, MilestoneStage, CrewRosterMember } from '@/types/database';

export function useAgreements(currentUserId?: string) {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAgreements = useCallback(async () => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('agreements')
          .select('*, proposer:proposer_id(*), recipient:recipient_id(*)')
          .or(`proposer_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setAgreements(data as Agreement[]);
        }
      }
    } catch (err) {
      console.warn('Agreements fetch fallback:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchAgreements();

    if (!isSupabaseConfigured() || !currentUserId) return;

    const channel = supabase
      .channel('agreements_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agreements' },
        () => fetchAgreements()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, fetchAgreements]);

  const createAgreement = async (params: {
    match_id: string;
    proposer_id: string;
    recipient_id: string;
    specialty: string;
    city: any;
    technician_count: number;
    daily_rate_sar: number;
    total_estimated_sar: number;
    start_date: string;
    end_date: string;
  }): Promise<Agreement | null> => {
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('agreements')
          .insert({
            ...params,
            status: 'draft',
            current_milestone: 'agreement_signed',
          })
          .select('*, proposer:proposer_id(*), recipient:recipient_id(*)')
          .single();

        if (error) throw error;
        await fetchAgreements();
        return data as Agreement;
      }
      return null;
    } catch (err) {
      console.error('Create agreement error:', err);
      return null;
    }
  };

  const signAgreement = async (agreementId: string, isProposer: boolean): Promise<boolean> => {
    try {
      if (isSupabaseConfigured()) {
        const updatePayload = isProposer
          ? { terms_accepted_proposer: true, proposer_signed_at: new Date().toISOString() }
          : { terms_accepted_recipient: true, recipient_signed_at: new Date().toISOString() };

        // Fetch current to check if both signed
        const { data: current } = await supabase
          .from('agreements')
          .select('*')
          .eq('id', agreementId)
          .single();

        const bothSigned = isProposer
          ? current?.terms_accepted_recipient
          : current?.terms_accepted_proposer;

        const finalStatus = bothSigned ? 'active' : isProposer ? 'pending_recipient_sig' : 'pending_proposer_sig';

        const { error } = await supabase
          .from('agreements')
          .update({ ...updatePayload, status: finalStatus })
          .eq('id', agreementId);

        if (error) throw error;
        await fetchAgreements();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Sign agreement error:', err);
      return false;
    }
  };

  const advanceMilestone = async (agreementId: string, nextMilestone: MilestoneStage): Promise<boolean> => {
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('agreements')
          .update({
            current_milestone: nextMilestone,
            status: nextMilestone === 'completed' ? 'completed' : 'active',
          })
          .eq('id', agreementId);

        if (error) throw error;
        await fetchAgreements();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Advance milestone error:', err);
      return false;
    }
  };

  return {
    agreements,
    loading,
    refreshAgreements: fetchAgreements,
    createAgreement,
    signAgreement,
    advanceMilestone,
  };
}
