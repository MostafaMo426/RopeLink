-- ==============================================================================
-- RopeLink Migration: 20261105171427_security_and_performance_advisor_hardening.sql
-- Fixes Supabase Security & Performance Advisor recommendations:
-- 1. [ERROR] security_definer_view: Convert public.profile_directory to security_invoker = true
-- 2. [WARN]  function_search_path_mutable: Set explicit search_path on public.handle_updated_at()
-- 3. [WARN]  anon/authenticated_security_definer_function_executable: Revoke public RPC EXECUTE on trigger functions
-- 4. [WARN]  Convert public.is_admin() to SECURITY INVOKER to eliminate exposed RPC warning
-- 5. [WARN]  auth_rls_initplan: Wrap auth.uid() in (SELECT auth.uid()) across all RLS policies (InitPlan caching)
-- 6. [WARN]  multiple_permissive_policies: Consolidate overlapping SELECT policies on public.profiles
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. FIX: security_definer_view on public.profile_directory
-- ------------------------------------------------------------------------------
ALTER VIEW public.profile_directory SET (security_invoker = true);

-- ------------------------------------------------------------------------------
-- 2. FIX: multiple_permissive_policies & auth_rls_initplan on public.profiles
-- Drop legacy/duplicate SELECT policies and consolidate into a single performant policy
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owners can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view public profile directory" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can select profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Optimize UPDATE policy with InitPlan caching
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = id OR (SELECT public.is_admin()))
WITH CHECK ((SELECT auth.uid()) = id OR (SELECT public.is_admin()));

-- Optimize INSERT policy with InitPlan caching
DROP POLICY IF EXISTS "Enforce safe defaults on profile insert" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Enforce safe defaults on profile insert"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT auth.uid()) = id
    AND role IN ('contractor', 'supplier')
    AND verification_status = 'unverified'
);

-- ------------------------------------------------------------------------------
-- 3. FIX: auth_rls_initplan on public.requests
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert requests" ON public.requests;
CREATE POLICY "Users can insert requests"
ON public.requests
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users and Admins can update requests" ON public.requests;
CREATE POLICY "Users and Admins can update requests"
ON public.requests
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id OR (SELECT public.is_admin()))
WITH CHECK ((SELECT auth.uid()) = user_id OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Users and Admins can delete requests" ON public.requests;
CREATE POLICY "Users and Admins can delete requests"
ON public.requests
FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id OR (SELECT public.is_admin()));

-- ------------------------------------------------------------------------------
-- 4. FIX: auth_rls_initplan on public.matches
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Participants can view matches" ON public.matches;
CREATE POLICY "Participants can view matches"
ON public.matches
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = proposer_id OR (SELECT auth.uid()) = recipient_id OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Contractors can insert matches" ON public.matches;
CREATE POLICY "Contractors can insert matches"
ON public.matches
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = proposer_id AND proposer_id != recipient_id);

DROP POLICY IF EXISTS "Participants can update matches" ON public.matches;
CREATE POLICY "Participants can update matches"
ON public.matches
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = proposer_id OR (SELECT auth.uid()) = recipient_id OR (SELECT public.is_admin()));

-- ------------------------------------------------------------------------------
-- 5. FIX: auth_rls_initplan on public.agreements
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Participants can view agreements" ON public.agreements;
CREATE POLICY "Participants can view agreements"
ON public.agreements
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = proposer_id OR (SELECT auth.uid()) = recipient_id OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Participants can insert agreements" ON public.agreements;
CREATE POLICY "Participants can insert agreements"
ON public.agreements
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = proposer_id OR (SELECT auth.uid()) = recipient_id);

DROP POLICY IF EXISTS "Participants can update agreements" ON public.agreements;
CREATE POLICY "Participants can update agreements"
ON public.agreements
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = proposer_id OR (SELECT auth.uid()) = recipient_id OR (SELECT public.is_admin()));

-- ------------------------------------------------------------------------------
-- 6. FIX: auth_rls_initplan on public.chat_messages
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Match participants can view chat" ON public.chat_messages;
CREATE POLICY "Match participants can view chat"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.matches m
        WHERE m.id = chat_messages.match_id
        AND (m.proposer_id = (SELECT auth.uid()) OR m.recipient_id = (SELECT auth.uid()))
    ) OR (SELECT public.is_admin())
);

DROP POLICY IF EXISTS "Match participants can send chat" ON public.chat_messages;
CREATE POLICY "Match participants can send chat"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT auth.uid()) = sender_id
    AND EXISTS (
        SELECT 1 FROM public.matches m
        WHERE m.id = chat_messages.match_id
        AND (m.proposer_id = (SELECT auth.uid()) OR m.recipient_id = (SELECT auth.uid()))
    )
);

-- ------------------------------------------------------------------------------
-- 7. FIX: auth_rls_initplan on public.crew_rosters
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Agreement parties can view and manage roster" ON public.crew_rosters;
CREATE POLICY "Agreement parties can view and manage roster"
ON public.crew_rosters
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.agreements a
        WHERE a.id = crew_rosters.agreement_id
        AND (a.proposer_id = (SELECT auth.uid()) OR a.recipient_id = (SELECT auth.uid()))
    ) OR (SELECT public.is_admin())
);

-- ------------------------------------------------------------------------------
-- 8. FIX: function_search_path_mutable on public.handle_updated_at()
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    ALTER FUNCTION public.handle_updated_at() SET search_path = public, pg_temp;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ------------------------------------------------------------------------------
-- 9. FIX: Switch public.is_admin() to SECURITY INVOKER
-- Eliminates anon & authenticated security definer RPC execution warnings
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (SELECT auth.uid())
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY INVOKER STABLE SET search_path = public, pg_temp;

-- ------------------------------------------------------------------------------
-- 10. FIX: anon/authenticated_security_definer_function_executable
-- Revoke direct API execution on internal database trigger functions
-- ------------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.enforce_agreement_initial_state() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_agreement_signature_rules() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_agreement_update_rules() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_match_initial_state() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_match_update_rules() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_mobilization_sequence() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_privilege_escalation() FROM PUBLIC, anon, authenticated;

DO $$ BEGIN
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

