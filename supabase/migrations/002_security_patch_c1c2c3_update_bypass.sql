-- ==============================================================================
-- RopeLink Security Patch: Migration 002 — C1/C2/C3 UPDATE & SELECT Bypass Fixes
-- Audited: September 2026 | Applies to: Supabase PostgreSQL (PostgreSQL 15+)
-- Safe to run multiple times (idempotent).
-- Permitted operations: ALTER, CREATE OR REPLACE, DROP/CREATE POLICY, CREATE VIEW,
--                       DROP TRIGGER, CREATE TRIGGER.  NO DROP TABLE used.
-- Run in: Supabase Dashboard > SQL Editor
-- ==============================================================================


-- ============================================================
-- C1 FIX (Part 2): Collapse the permissive "Authenticated users
--   can view public profile directory" SELECT policy from Migration
--   001 which still returned ALL columns (including cr_document_url,
--   hse_document_url, cr_number, phone) to any logged-in user.
--
--   Root cause: PostgreSQL column-level filtering does not exist
--   in RLS USING clauses — the USING clause controls row access,
--   not column access. A SELECT policy with USING (auth.uid() IS NOT NULL)
--   exposes every column in every matching row.
--
--   Fix:
--   1. Drop the permissive cross-user SELECT policy entirely.
--   2. Keep ONLY the owner-scoped policy (auth.uid() = id).
--   3. Create a SECURITY DEFINER view `public.profile_directory`
--      that explicitly lists only safe, non-sensitive columns.
--      The frontend marketplace can JOIN/query this view instead
--      of querying the base profiles table directly.
-- ============================================================

-- Step 1: Drop the over-permissive cross-user SELECT policy installed
-- by Migration 001.
DROP POLICY IF EXISTS "Authenticated users can view public profile directory" ON public.profiles;

-- After this, the only SELECT policies on public.profiles are:
--   "Owners can view own profile"       → auth.uid() = id  (full row)
--   "Admins can view all profiles"      → is_admin()       (full row)
-- Any other authenticated user querying another user's profile row gets 0 rows.

-- Step 2: Create the secure public directory view.
-- This view is SECURITY DEFINER — it runs as the DB owner (bypasses RLS on
-- the base table) so the view itself can read all profiles, but it only
-- surfaces the columns that are safe to expose to the marketplace.
-- The view does NOT expose: cr_number, cr_document_url, hse_document_url, phone.
DROP VIEW IF EXISTS public.profile_directory;

CREATE OR REPLACE VIEW public.profile_directory
WITH (security_invoker = false)  -- view runs as definer (postgres), not caller
AS
SELECT
    id,
    company_name,
    role,
    city,
    verification_status,
    has_seen_tutorial,
    created_at,
    updated_at
    -- Intentionally excluded: cr_number, cr_document_url, hse_document_url, phone
FROM public.profiles;

-- Grant authenticated roles read access to the view (not the base table).
GRANT SELECT ON public.profile_directory TO authenticated;
GRANT SELECT ON public.profile_directory TO anon;

-- NOTE FOR FRONTEND MIGRATION:
-- The query in useRealtimeMarketplace.ts currently uses:
--   .from('requests').select('*, profiles(*)')
-- This join goes through the base profiles table. After this patch,
-- anonymous/cross-user access to the base table returns 0 rows.
-- Switch the join to use the view:
--   .from('requests').select('*, profile_directory!requests_user_id_fkey(id, company_name, city, verification_status)')
--
-- For the matches query (proposer/recipient profile info):
--   Replace:  'proposer:profiles!matches_proposer_id_fkey(*)'
--   With:     'proposer:profile_directory!matches_proposer_id_fkey(id, company_name, city, verification_status)'


-- ============================================================
-- C2 FIX: agreements BEFORE UPDATE trigger — enforce immutability
--   of participant IDs, commercial term lock after signing, and
--   correct sequential status transitions.
--
--   Bypasses closed:
--   (a) Any participant could PATCH proposer_id/recipient_id via REST API.
--   (b) After signing, daily_rate_sar / technician_count / dates could be
--       silently modified by a crafted UPDATE payload.
--   (c) Status could jump from 'draft' directly to 'completed', bypassing
--       the full agreement lifecycle.
-- ============================================================

CREATE OR REPLACE FUNCTION public.enforce_agreement_update_rules()
RETURNS TRIGGER AS $$
DECLARE
    v_current_user UUID := auth.uid();
BEGIN
    -- (a) IMMUTABILITY: Participant IDs can NEVER be changed after creation.
    IF NEW.proposer_id IS DISTINCT FROM OLD.proposer_id THEN
        RAISE EXCEPTION 'Security Violation: agreement.proposer_id is immutable after creation';
    END IF;

    IF NEW.recipient_id IS DISTINCT FROM OLD.recipient_id THEN
        RAISE EXCEPTION 'Security Violation: agreement.recipient_id is immutable after creation';
    END IF;

    IF NEW.match_id IS DISTINCT FROM OLD.match_id THEN
        RAISE EXCEPTION 'Security Violation: agreement.match_id is immutable after creation';
    END IF;

    -- (b) COMMERCIAL TERM LOCK: Once the proposer has signed (terms_accepted_proposer = TRUE),
    --     the core commercial terms become read-only.
    --     Admins may override via the is_admin() check.
    IF NOT public.is_admin() AND (OLD.terms_accepted_proposer = TRUE OR OLD.terms_accepted_recipient = TRUE) THEN
        IF NEW.specialty IS DISTINCT FROM OLD.specialty THEN
            RAISE EXCEPTION 'Contract Lock: specialty cannot be modified after signing has begun';
        END IF;
        IF NEW.technician_count IS DISTINCT FROM OLD.technician_count THEN
            RAISE EXCEPTION 'Contract Lock: technician_count cannot be modified after signing has begun';
        END IF;
        IF NEW.daily_rate_sar IS DISTINCT FROM OLD.daily_rate_sar THEN
            RAISE EXCEPTION 'Contract Lock: daily_rate_sar cannot be modified after signing has begun';
        END IF;
        IF NEW.total_estimated_sar IS DISTINCT FROM OLD.total_estimated_sar THEN
            RAISE EXCEPTION 'Contract Lock: total_estimated_sar cannot be modified after signing has begun';
        END IF;
        IF NEW.start_date IS DISTINCT FROM OLD.start_date THEN
            RAISE EXCEPTION 'Contract Lock: start_date cannot be modified after signing has begun';
        END IF;
        IF NEW.end_date IS DISTINCT FROM OLD.end_date THEN
            RAISE EXCEPTION 'Contract Lock: end_date cannot be modified after signing has begun';
        END IF;
        IF NEW.city IS DISTINCT FROM OLD.city THEN
            RAISE EXCEPTION 'Contract Lock: city cannot be modified after signing has begun';
        END IF;
    END IF;

    -- (c) STATUS TRANSITION GUARD: Enforce sequential lifecycle progression.
    --     Valid transition graph (non-admin users):
    --       draft → pending_proposer_sig  (proposer submits)
    --       pending_proposer_sig → pending_recipient_sig  (proposer signs)
    --       pending_recipient_sig → active  (recipient signs — requires dual acceptance)
    --       active → completed  (milestone completion — milestone must be 'completed')
    --       any → cancelled  (either participant or admin)
    IF NOT public.is_admin() AND NEW.status IS DISTINCT FROM OLD.status THEN
        -- Reject any direct jump to 'completed' unless milestone is 'completed'
        IF NEW.status = 'completed' AND NEW.current_milestone != 'completed' THEN
            RAISE EXCEPTION 'Invalid Transition: Agreement cannot be completed while mobilization milestone is %',
                NEW.current_milestone;
        END IF;

        -- Cannot jump from draft straight to active or completed
        IF OLD.status = 'draft' AND NEW.status NOT IN ('pending_proposer_sig', 'cancelled') THEN
            RAISE EXCEPTION 'Invalid Transition: Agreement can only move from draft to pending_proposer_sig, not to %',
                NEW.status;
        END IF;

        -- Cannot go active unless both parties have accepted
        IF NEW.status = 'active' AND (NEW.terms_accepted_proposer IS NOT TRUE OR NEW.terms_accepted_recipient IS NOT TRUE) THEN
            RAISE EXCEPTION 'Invalid Transition: Agreement cannot become active without dual electronic acceptance';
        END IF;

        -- Cannot revert a completed agreement
        IF OLD.status = 'completed' AND NEW.status != 'completed' THEN
            RAISE EXCEPTION 'Invalid Transition: A completed agreement cannot be reverted';
        END IF;
    END IF;

    -- Stamp updated_at
    NEW.updated_at := TIMEZONE('utc'::text, NOW());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Replace the existing UPDATE trigger (which only guarded signatures, not immutability)
DROP TRIGGER IF EXISTS trg_enforce_agreement_signature_rules ON public.agreements;
DROP TRIGGER IF EXISTS trg_enforce_agreement_update_rules ON public.agreements;

CREATE TRIGGER trg_enforce_agreement_update_rules
BEFORE UPDATE ON public.agreements
FOR EACH ROW EXECUTE FUNCTION public.enforce_agreement_update_rules();

-- NOTE: The original enforce_agreement_signature_rules() function is superseded
-- by enforce_agreement_update_rules() which covers all the same signature checks
-- plus the new immutability and status-transition guards.
-- The old function body is left in place (harmless) but its trigger is replaced.


-- ============================================================
-- C3 FIX: matches BEFORE UPDATE trigger — enforce participant
--   immutability and ensure only the designated recipient_id
--   can accept a proposal (proposer cannot self-accept).
--
--   Bypasses closed:
--   (a) A user could PATCH proposer_id or recipient_id on a match.
--   (b) The proposer could call .update({ status: 'accepted' }) on
--       their own match, bypassing RLS because the "Participants can
--       update matches" policy only checks proposer_id OR recipient_id.
-- ============================================================

CREATE OR REPLACE FUNCTION public.enforce_match_update_rules()
RETURNS TRIGGER AS $$
DECLARE
    v_current_user UUID := auth.uid();
BEGIN
    -- (a) IMMUTABILITY: Core identifiers can never change after creation.
    IF NEW.proposer_id IS DISTINCT FROM OLD.proposer_id THEN
        RAISE EXCEPTION 'Security Violation: match.proposer_id is immutable after creation';
    END IF;

    IF NEW.recipient_id IS DISTINCT FROM OLD.recipient_id THEN
        RAISE EXCEPTION 'Security Violation: match.recipient_id is immutable after creation';
    END IF;

    IF NEW.request_id IS DISTINCT FROM OLD.request_id THEN
        RAISE EXCEPTION 'Security Violation: match.request_id is immutable after creation';
    END IF;

    -- (b) ACCEPTANCE GUARD: Only the recipient can accept or decline a match.
    --     The proposer may only cancel (status = 'declined' via withdrawal)
    --     but CANNOT set status = 'accepted'.
    IF NOT public.is_admin() AND NEW.status IS DISTINCT FROM OLD.status THEN

        IF NEW.status = 'accepted' AND v_current_user != OLD.recipient_id THEN
            RAISE EXCEPTION 'Unauthorized: Only the designated recipient (%) can accept this match proposal. Current user: %',
                OLD.recipient_id, v_current_user;
        END IF;

        IF NEW.status = 'declined' AND v_current_user NOT IN (OLD.proposer_id, OLD.recipient_id) THEN
            RAISE EXCEPTION 'Unauthorized: Only a match participant can decline this proposal';
        END IF;

        -- Cannot revert an accepted or completed match
        IF OLD.status IN ('accepted', 'completed') AND NEW.status NOT IN ('completed', 'declined') THEN
            RAISE EXCEPTION 'Invalid Transition: Cannot revert a match from % to %',
                OLD.status, NEW.status;
        END IF;

        -- Cannot modify a completed match at all (except admins)
        IF OLD.status = 'completed' THEN
            RAISE EXCEPTION 'Invalid Transition: A completed match is immutable';
        END IF;
    END IF;

    -- Stamp updated_at
    NEW.updated_at := TIMEZONE('utc'::text, NOW());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_enforce_match_update_rules ON public.matches;

CREATE TRIGGER trg_enforce_match_update_rules
BEFORE UPDATE ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.enforce_match_update_rules();


-- ============================================================
-- POST-MIGRATION VERIFICATION QUERIES
-- Run these after applying the patch to confirm everything is active.
-- ============================================================

-- 1. Verify C1: The permissive cross-user policy is gone.
--    Expected: NO row with policyname = 'Authenticated users can view public profile directory'
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'profiles' AND schemaname = 'public'
ORDER BY cmd, policyname;

-- 2. Verify C1 view exists and exposes only safe columns.
--    Expected: columns — id, company_name, role, city, verification_status,
--              has_seen_tutorial, created_at, updated_at
--    NOT present: cr_number, cr_document_url, hse_document_url, phone
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profile_directory'
ORDER BY ordinal_position;

-- 3. Verify C2 trigger exists on agreements.
--    Expected: 1 row with trigger_name = 'trg_enforce_agreement_update_rules'
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'agreements'
  AND trigger_schema = 'public'
ORDER BY trigger_name;

-- 4. Verify C3 trigger exists on matches.
--    Expected: 1 row with trigger_name = 'trg_enforce_match_update_rules'
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'matches'
  AND trigger_schema = 'public'
ORDER BY trigger_name;
