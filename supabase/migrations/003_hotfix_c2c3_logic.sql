-- ==============================================================================
-- RopeLink Security Hotfix: Migration 003 — C2/C3 Trigger Logic Patches
-- September 2026 | PostgreSQL 15+
-- Patches logical bypasses found in Migration 002 trigger functions.
-- Operations: CREATE OR REPLACE FUNCTION only. No DROP TABLE, no policy changes.
-- Run in: Supabase Dashboard > SQL Editor
-- ==============================================================================


-- ============================================================
-- C2 HOTFIX: enforce_agreement_update_rules
--
--   Bypass 1 — Signer Identity Forgery:
--     The recipient could flip terms_accepted_proposer = TRUE
--     (or vice versa) because the old trigger only checked the
--     commercial lock, not WHO is performing the signing action.
--
--   Bypass 2 — Un-sign Attack:
--     Any participant could PATCH terms_accepted_* back to FALSE
--     after signing, unlocking the commercial term freeze and
--     allowing retroactive modification of rates/dates.
-- ============================================================

CREATE OR REPLACE FUNCTION public.enforce_agreement_update_rules()
RETURNS TRIGGER AS $$
DECLARE
    v_uid UUID := auth.uid();
BEGIN
    -- ── IMMUTABILITY: Structural fields can never be changed. ──────────────
    IF NEW.proposer_id  IS DISTINCT FROM OLD.proposer_id  THEN
        RAISE EXCEPTION 'Security Violation: agreement.proposer_id is immutable';
    END IF;
    IF NEW.recipient_id IS DISTINCT FROM OLD.recipient_id THEN
        RAISE EXCEPTION 'Security Violation: agreement.recipient_id is immutable';
    END IF;
    IF NEW.match_id     IS DISTINCT FROM OLD.match_id     THEN
        RAISE EXCEPTION 'Security Violation: agreement.match_id is immutable';
    END IF;

    -- ── C2 HOTFIX 1: SIGNER IDENTITY ──────────────────────────────────────
    -- Only the proposer may flip terms_accepted_proposer → TRUE.
    IF NOT public.is_admin()
       AND NEW.terms_accepted_proposer IS DISTINCT FROM OLD.terms_accepted_proposer
       AND NEW.terms_accepted_proposer = TRUE
       AND v_uid IS DISTINCT FROM OLD.proposer_id
    THEN
        RAISE EXCEPTION
            'Unauthorized: Only the proposer (%) may accept on behalf of the proposer side. Current user: %',
            OLD.proposer_id, v_uid;
    END IF;

    -- Only the recipient may flip terms_accepted_recipient → TRUE.
    IF NOT public.is_admin()
       AND NEW.terms_accepted_recipient IS DISTINCT FROM OLD.terms_accepted_recipient
       AND NEW.terms_accepted_recipient = TRUE
       AND v_uid IS DISTINCT FROM OLD.recipient_id
    THEN
        RAISE EXCEPTION
            'Unauthorized: Only the recipient (%) may accept on behalf of the recipient side. Current user: %',
            OLD.recipient_id, v_uid;
    END IF;

    -- ── C2 HOTFIX 2: NO UN-SIGNING ─────────────────────────────────────────
    -- Once TRUE, terms_accepted_* is permanently TRUE — no one can revert it,
    -- not even the signer themselves (admins are the only exception).
    IF NOT public.is_admin() THEN
        IF OLD.terms_accepted_proposer = TRUE
           AND NEW.terms_accepted_proposer IS DISTINCT FROM TRUE
        THEN
            RAISE EXCEPTION
                'Contract Lock: proposer acceptance is permanent and cannot be revoked';
        END IF;

        IF OLD.terms_accepted_recipient = TRUE
           AND NEW.terms_accepted_recipient IS DISTINCT FROM TRUE
        THEN
            RAISE EXCEPTION
                'Contract Lock: recipient acceptance is permanent and cannot be revoked';
        END IF;
    END IF;

    -- ── COMMERCIAL TERM LOCK ───────────────────────────────────────────────
    -- Once either party has signed, core commercial terms are read-only.
    IF NOT public.is_admin()
       AND (OLD.terms_accepted_proposer = TRUE OR OLD.terms_accepted_recipient = TRUE)
    THEN
        IF NEW.specialty            IS DISTINCT FROM OLD.specialty            THEN RAISE EXCEPTION 'Contract Lock: specialty is read-only after signing'; END IF;
        IF NEW.technician_count     IS DISTINCT FROM OLD.technician_count     THEN RAISE EXCEPTION 'Contract Lock: technician_count is read-only after signing'; END IF;
        IF NEW.daily_rate_sar       IS DISTINCT FROM OLD.daily_rate_sar       THEN RAISE EXCEPTION 'Contract Lock: daily_rate_sar is read-only after signing'; END IF;
        IF NEW.total_estimated_sar  IS DISTINCT FROM OLD.total_estimated_sar  THEN RAISE EXCEPTION 'Contract Lock: total_estimated_sar is read-only after signing'; END IF;
        IF NEW.start_date           IS DISTINCT FROM OLD.start_date           THEN RAISE EXCEPTION 'Contract Lock: start_date is read-only after signing'; END IF;
        IF NEW.end_date             IS DISTINCT FROM OLD.end_date             THEN RAISE EXCEPTION 'Contract Lock: end_date is read-only after signing'; END IF;
        IF NEW.city                 IS DISTINCT FROM OLD.city                 THEN RAISE EXCEPTION 'Contract Lock: city is read-only after signing'; END IF;
    END IF;

    -- ── STATUS TRANSITION GUARD ────────────────────────────────────────────
    IF NOT public.is_admin() AND NEW.status IS DISTINCT FROM OLD.status THEN
        -- 'completed' requires the mobilization milestone to also be complete.
        IF NEW.status = 'completed' AND NEW.current_milestone != 'completed' THEN
            RAISE EXCEPTION
                'Invalid Transition: status cannot be completed while milestone is %',
                NEW.current_milestone;
        END IF;
        -- Cannot leave draft for anything other than pending_proposer_sig or cancelled.
        IF OLD.status = 'draft' AND NEW.status NOT IN ('pending_proposer_sig', 'cancelled') THEN
            RAISE EXCEPTION
                'Invalid Transition: draft can only move to pending_proposer_sig, not %', NEW.status;
        END IF;
        -- Cannot go active without dual acceptance.
        IF NEW.status = 'active'
           AND (NEW.terms_accepted_proposer IS NOT TRUE OR NEW.terms_accepted_recipient IS NOT TRUE)
        THEN
            RAISE EXCEPTION
                'Invalid Transition: active requires dual electronic acceptance';
        END IF;
        -- Completed agreements are permanently terminal.
        IF OLD.status = 'completed' THEN
            RAISE EXCEPTION 'Invalid Transition: a completed agreement is permanently terminal';
        END IF;
    END IF;

    NEW.updated_at := TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;


-- ============================================================
-- C3 HOTFIX: enforce_match_update_rules
--
--   Bypass 1 — Incomplete Completed Lock:
--     The old trigger only blocked status *changes* on a completed
--     match. A crafted UPDATE that did NOT touch status (e.g., only
--     changed `message`) would still succeed because the guard only
--     ran when NEW.status IS DISTINCT FROM OLD.status.
--
--   Bypass 2 — State Jump to Completed:
--     A recipient could call .update({ status: 'completed' }) on a
--     match that was still 'pending', bypassing the 'accepted' state
--     entirely, because the old trigger never validated the predecessor
--     state before allowing 'completed'.
-- ============================================================

CREATE OR REPLACE FUNCTION public.enforce_match_update_rules()
RETURNS TRIGGER AS $$
DECLARE
    v_uid UUID := auth.uid();
BEGIN
    -- ── IMMUTABILITY: Core identifiers never change. ───────────────────────
    IF NEW.proposer_id  IS DISTINCT FROM OLD.proposer_id  THEN
        RAISE EXCEPTION 'Security Violation: match.proposer_id is immutable';
    END IF;
    IF NEW.recipient_id IS DISTINCT FROM OLD.recipient_id THEN
        RAISE EXCEPTION 'Security Violation: match.recipient_id is immutable';
    END IF;
    IF NEW.request_id   IS DISTINCT FROM OLD.request_id   THEN
        RAISE EXCEPTION 'Security Violation: match.request_id is immutable';
    END IF;

    -- ── C3 HOTFIX 1: ABSOLUTE COMPLETED LOCK ──────────────────────────────
    -- If the match is already completed, NO field may be updated by anyone
    -- except an admin — not status, not message, not updated_at, nothing.
    IF OLD.status = 'completed' AND NOT public.is_admin() THEN
        RAISE EXCEPTION
            'Immutable Record: match % is completed and cannot be modified', OLD.id;
    END IF;

    -- ── C3 HOTFIX 2: STRICT STATUS PROGRESSION ────────────────────────────
    IF NOT public.is_admin() AND NEW.status IS DISTINCT FROM OLD.status THEN

        -- 'completed' MUST be preceded by 'accepted'. No skipping.
        IF NEW.status = 'completed' AND OLD.status != 'accepted' THEN
            RAISE EXCEPTION
                'Invalid Transition: match can only be completed from accepted state, current state is %',
                OLD.status;
        END IF;

        -- Only the designated recipient can accept the proposal.
        IF NEW.status = 'accepted' AND v_uid IS DISTINCT FROM OLD.recipient_id THEN
            RAISE EXCEPTION
                'Unauthorized: Only recipient (%) can accept this match. Current user: %',
                OLD.recipient_id, v_uid;
        END IF;

        -- Only participants may decline.
        IF NEW.status = 'declined'
           AND v_uid NOT IN (OLD.proposer_id, OLD.recipient_id)
        THEN
            RAISE EXCEPTION 'Unauthorized: Only a match participant can decline';
        END IF;

        -- An accepted match can only move to completed or declined (withdrawal).
        IF OLD.status = 'accepted' AND NEW.status NOT IN ('completed', 'declined') THEN
            RAISE EXCEPTION
                'Invalid Transition: accepted match can only move to completed or declined, not %',
                NEW.status;
        END IF;
    END IF;

    NEW.updated_at := TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
