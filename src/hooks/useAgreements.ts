'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Agreement, MilestoneStage, CrewRosterMember } from '@/types/database';

// Columns fetched from the profile_directory view (Migration 002: C1 fix).
// Excludes sensitive columns: cr_number, cr_document_url, hse_document_url, phone.
const DIRECTORY_COLS = 'id, company_name, role, city, verification_status, has_seen_tutorial, created_at, updated_at';

export function useAgreements(currentUserId?: string) {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAgreements = useCallback(async () => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        // U6 FIX: Join counterparty data through the secure profile_directory
        // view instead of the base profiles table, which now returns 0 rows
        // for cross-user queries after Migration 002 (C1 RLS lockdown).
        const { data, error } = await supabase
          .from('agreements')
          .select(
            `*, proposer:profile_directory!agreements_proposer_id_fkey(${DIRECTORY_COLS}), recipient:profile_directory!agreements_recipient_id_fkey(${DIRECTORY_COLS})`
          )
          .or(`proposer_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Agreements fetch error:', error.message);
        } else if (data) {
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
        // Trigger enforce_agreement_initial_state (Migration 001: C2) will hard-reset
        // status and acceptance fields regardless of payload — these are safe defaults.
        const { data, error } = await supabase
          .from('agreements')
          .insert({
            ...params,
            status: 'draft',
            current_milestone: 'agreement_signed',
          })
          .select(
            `*, proposer:profile_directory!agreements_proposer_id_fkey(${DIRECTORY_COLS}), recipient:profile_directory!agreements_recipient_id_fkey(${DIRECTORY_COLS})`
          )
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

  /**
   * H1 FIX: signAgreement — aligned to the trigger-enforced lifecycle:
   *
   *   draft → pending_proposer_sig  (proposer clicks sign first)
   *   pending_proposer_sig → pending_recipient_sig  (proposer signs)
   *   pending_recipient_sig → active  (recipient signs, both accepted)
   *
   * The trigger (Migration 002/003) enforces:
   *   - The caller must be the correct party (proposer/recipient).
   *   - terms_accepted_* is permanent once TRUE.
   *   - 'active' requires dual acceptance.
   *
   * This function returns { success: boolean; error?: string } so the
   * modal can surface DB-level rejection messages to the user (H1).
   */
  const signAgreement = async (
    agreementId: string,
    isProposer: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) return { success: false, error: 'Supabase not configured' };

    try {
      // Step 1: Fetch the current agreement state to determine the correct
      // next status transition without relying on stale client state.
      const { data: current, error: fetchErr } = await supabase
        .from('agreements')
        .select('id, status, terms_accepted_proposer, terms_accepted_recipient')
        .eq('id', agreementId)
        .single();

      if (fetchErr || !current) {
        return { success: false, error: fetchErr?.message ?? 'Agreement not found' };
      }

      // Step 2: Build the signing payload for the correct party.
      const signingPayload = isProposer
        ? { terms_accepted_proposer: true, proposer_signed_at: new Date().toISOString() }
        : { terms_accepted_recipient: true, recipient_signed_at: new Date().toISOString() };

      // Step 3: Determine the correct next status.
      //
      // The DB trigger (Migration 003) enforces a strict graph:
      //   draft → pending_proposer_sig (ONLY valid first transition)
      //   pending_proposer_sig → pending_recipient_sig  (implicit, no guard)
      //   pending_recipient_sig → active  (requires dual acceptance)
      //
      // Root cause of the H1 blocker: the old code sent 'pending_recipient_sig'
      // when the proposer signed first from 'draft', but the trigger rejects any
      // status other than 'pending_proposer_sig' or 'cancelled' from 'draft'.
      //
      // Fix: always use 'pending_proposer_sig' as the intermediate status when
      // moving away from 'draft', regardless of which party signs first.
      // Only move to 'active' once BOTH parties have accepted.
      const otherPartyHasSigned = isProposer
        ? current.terms_accepted_recipient === true
        : current.terms_accepted_proposer === true;

      let nextStatus: string;
      if (otherPartyHasSigned) {
        // Both parties will have accepted after this update → activate.
        nextStatus = 'active';
      } else if (current.status === 'draft') {
        // First signature from draft — trigger ONLY allows pending_proposer_sig here.
        nextStatus = 'pending_proposer_sig';
      } else {
        // Second-party signs after first is already recorded → move to waiting state.
        nextStatus = 'pending_recipient_sig';
      }

      // Step 4: Submit the update. The BEFORE UPDATE trigger enforces all
      // security rules — if it raises, the error surfaces here.
      const { error: updateErr } = await supabase
        .from('agreements')
        .update({ ...signingPayload, status: nextStatus })
        .eq('id', agreementId);

      if (updateErr) {
        // Surface the DB trigger's message directly so the UI can show it.
        // Trigger messages are intentionally human-readable (Migration 002/003).
        return { success: false, error: updateErr.message };
      }

      await fetchAgreements();
      return { success: true };
    } catch (err: any) {
      console.error('Sign agreement error:', err);
      return { success: false, error: err?.message ?? 'Unexpected error during signing' };
    }
  };

  const advanceMilestone = async (
    agreementId: string,
    nextMilestone: MilestoneStage
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) return { success: false, error: 'Supabase not configured' };

    try {
      const { error } = await supabase
        .from('agreements')
        .update({
          current_milestone: nextMilestone,
          status: nextMilestone === 'completed' ? 'completed' : 'active',
        })
        .eq('id', agreementId);

      if (error) {
        return { success: false, error: error.message };
      }

      await fetchAgreements();
      return { success: true };
    } catch (err: any) {
      console.error('Advance milestone error:', err);
      return { success: false, error: err?.message ?? 'Unexpected error advancing milestone' };
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
