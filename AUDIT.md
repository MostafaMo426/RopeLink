# Technical Security & Architecture Audit Report (Baseline Pre-Hardening)

**Document:** `AUDIT.md`  
**Platform:** RopeLink B2B Industrial Platform  
**Target Milestone:** Pilot-Ready v0.3  
**Audit Date:** September 2026  
**Status:** Baseline BEFORE State (pre-mitigation)

---

## Executive Summary

An exhaustive technical, architectural, and security audit of the existing RopeLink codebase was conducted prior to implementing any code changes. The audit focused on identifying vulnerabilities where a technical or malicious user could bypass client-side UI restrictions and exploit Supabase APIs, database functions, row-level security (RLS) policies, or workflow integrity.

Nine (9) specific security and architectural findings were identified and verified against the live codebase:
- **CRITICAL**: 2
- **HIGH**: 3
- **MEDIUM**: 3
- **LOW**: 1

---

## Detailed Audit Findings

### Finding 1: Client-Side Role Escalation to System Administrator
- **Severity:** `CRITICAL`
- **Current Behavior:** A user registering via `supabase.auth.signUp()` can pass `options: { data: { role: 'admin' } }`. The automated profile creation trigger immediately creates a profile with `role = 'admin'`, conferring full administrative privileges across the entire marketplace.
- **Root Cause:** In [`supabase/schema.sql`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/supabase/schema.sql), function `handle_new_user()` trusts unauthenticated client metadata:
  ```sql
  ELSIF (NEW.raw_user_meta_data->>'role') = 'admin' THEN v_role := 'admin';
  ```
- **Affected Files / Tables / Policies:**
  - Table: `auth.users`, `public.profiles`
  - Function: `public.handle_new_user()` in `supabase/schema.sql`
- **Proposed Fix:** Remove `'admin'` from `handle_new_user()`. If metadata role is `'supplier'`, assign `'supplier'`; otherwise default to `'contractor'`. Admin role assignment must be restricted to direct database operations or migrations.
- **Expected Side Effects:** New signups can never be admin through the public registration interface. Demo admin accounts must be seeded via server-side SQL scripts.
- **Residual Risk:** None. Database controls strictly govern privileged access.

---

### Finding 2: Direct Self-Elevation of Profile Role and Verification Status
- **Severity:** `CRITICAL`
- **Current Behavior:** An authenticated regular contractor or supplier can call `supabase.from('profiles').update({ role: 'admin', verification_status: 'verified' }).eq('id', user.id)` directly from the browser dev tools. The database accepts the update, instantly granting admin rights and a verified enterprise badge.
- **Root Cause:** The RLS policy `"Users can update own profile"` in [`supabase/schema.sql`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/supabase/schema.sql) only evaluates:
  ```sql
  CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE 
  USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
  ```
  PostgreSQL RLS `USING` filters which rows can be updated, but does not restrict *which columns* can be updated without a `WITH CHECK` clause or a `BEFORE UPDATE` trigger.
- **Affected Files / Tables / Policies:**
  - Table: `public.profiles`
  - Policy: `"Users can update own profile"` in `supabase/schema.sql`
- **Proposed Fix:** Implement a database `BEFORE UPDATE` trigger `trg_prevent_profile_privilege_escalation` on `public.profiles`. If the current user is not an administrator, raise an exception if `NEW.role != OLD.role` or `NEW.verification_status != OLD.verification_status`.
- **Expected Side Effects:** Non-admin users cannot alter their role or verification status through client API calls. Company profile details (`company_name`, `phone`, `city`, `cr_number`, `has_seen_tutorial`) remain freely editable by the owner.
- **Residual Risk:** Low. Admin role checks in triggers must use clean subqueries to avoid recursion.

---

### Finding 3: Chat Message Sender Impersonation & Inadequate Mutation Guard
- **Severity:** `HIGH`
- **Current Behavior:** Any participant in a match can insert messages with an arbitrary `sender_id` (e.g. setting `sender_id` to the other company's user ID or an admin's ID). Furthermore, any participant can update or delete messages.
- **Root Cause:** Policy `"Match participants can view and send chat"` in [`supabase/schema.sql`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/supabase/schema.sql) is defined `FOR ALL USING (...)`:
  ```sql
  CREATE POLICY "Match participants can view and send chat" ON public.chat_messages FOR ALL USING (
      EXISTS (SELECT 1 FROM public.matches m WHERE m.id = chat_messages.match_id AND (m.proposer_id = auth.uid() OR m.recipient_id = auth.uid()))
  );
  ```
  It lacks a `WITH CHECK (auth.uid() = sender_id)` constraint on insertion, and allows `UPDATE` and `DELETE` operations on existing messages.
- **Affected Files / Tables / Policies:**
  - Table: `public.chat_messages`
  - Policy: `"Match participants can view and send chat"` in `supabase/schema.sql`
  - Hook: [`src/hooks/useMatchChat.ts`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/hooks/useMatchChat.ts)
- **Proposed Fix:** Split the `FOR ALL` policy into separate, granular policies:
  - `FOR SELECT`: Match participants and admins.
  - `FOR INSERT`: `WITH CHECK (auth.uid() = sender_id AND EXISTS (match participant check))`.
  - Disallow `UPDATE` and `DELETE` for regular users (chat records are immutable).
  - In `useMatchChat.ts`, resolve `sender_id` from the authenticated session rather than client-supplied arguments.
- **Expected Side Effects:** Users can only send messages as themselves. Messages cannot be edited or deleted after sending.
- **Residual Risk:** None.

---

### Finding 4: Cross-Party Agreement Signature Forgery & Premature Activation
- **Severity:** `HIGH`
- **Current Behavior:** A proposer can call `supabase.from('agreements').update({ terms_accepted_recipient: true, recipient_signed_at: now(), status: 'active' }).eq('id', agreementId)`. The agreement becomes active and legally binding without the recipient's consent.
- **Root Cause:** Policy `"Participants can update agreements"` in [`supabase/schema.sql`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/supabase/schema.sql) grants update permission to both parties without validating column ownership:
  ```sql
  CREATE POLICY "Participants can update agreements" ON public.agreements FOR UPDATE 
  USING (auth.uid() = proposer_id OR auth.uid() = recipient_id OR is_admin());
  ```
- **Affected Files / Tables / Policies:**
  - Table: `public.agreements`
  - Policy: `"Participants can update agreements"` in `supabase/schema.sql`
  - Hook: [`src/hooks/useAgreements.ts`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/hooks/useAgreements.ts)
- **Proposed Fix:** Add a `BEFORE UPDATE` trigger on `public.agreements` (`trg_enforce_agreement_signature_rules`):
  - Proposer can only mutate `terms_accepted_proposer` and `proposer_signed_at`.
  - Recipient can only mutate `terms_accepted_recipient` and `recipient_signed_at`.
  - Transition of `status` to `'active'` is strictly rejected unless both flags are `true`.
- **Expected Side Effects:** Neither party can sign for the other. Dual execution is enforced at the database layer.
- **Residual Risk:** Low.

---

### Finding 5: Client-Side Skipping of 7-Stage Mobilization & Ajeer Compliance
- **Severity:** `HIGH`
- **Current Behavior:** Any participant in an agreement can invoke `supabase.from('agreements').update({ current_milestone: 'completed' }).eq('id', agreementId)`. The system immediately jumps from Stage 1 to Stage 7, skipping Ajeer permit issuance, gate passes, HSE induction, and execution.
- **Root Cause:** No database-level validation enforces the sequential progression of `milestone_stage` ENUM values.
- **Affected Files / Tables / Policies:**
  - Table: `public.agreements` (column `current_milestone`)
  - Component: [`src/components/mobilization/MobilizationTracker.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/mobilization/MobilizationTracker.tsx)
- **Proposed Fix:** Add a database trigger `trg_enforce_mobilization_sequence` that enforces the strict sequential progression rule: `current_stage -> current_stage + 1`. Reject any update that skips stages (e.g. Stage 1 to Stage 4). Enforce that Stage 1 cannot advance to Stage 2 unless the agreement status is `'active'` (dual-signed).
- **Expected Side Effects:** Stage skipping is physically blocked by PostgreSQL. UI errors will display cleanly if illegal state transitions are attempted.
- **Residual Risk:** Low. Requires ensuring legitimate consecutive transitions pass smoothly.

---

### Finding 6: Missing Hard Eligibility Filter in Matching Engine
- **Severity:** `MEDIUM`
- **Current Behavior:** In [`src/lib/matching/engine.ts`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/lib/matching/engine.ts), `calculateMatchScore(demand, supply)` computes a weighted score (0–100) regardless of whether the requests are logically compatible. Two identical demand requests (`need_manpower` vs `need_manpower`), past-dated requests, or requests with 0 technicians receive scores as high as 70–80%, generating false match recommendations.
- **Root Cause:** The engine only implements soft weighted scoring ($40\%$ specialty, $30\%$ location, $20\%$ timeline, $10\%$ headcount) without an initial hard eligibility gate.
- **Affected Files / Tables / Policies:**
  - File: [`src/lib/matching/engine.ts`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/lib/matching/engine.ts)
- **Proposed Fix:** Introduce an explicit `isEligibleMatch(demand, supply)` gate:
  - Must have complementary request types (demand vs supply).
  - Must have valid technician headcount ($> 0$).
  - Must have valid, parseable dates.
  - If ineligible, return `score: 0` and `recommendationKey: 'ineligible'` without altering the existing soft scoring formula or weights.
- **Expected Side Effects:** Incompatible marketplace requests are immediately rejected from recommendation lists.
- **Residual Risk:** None. Preserves existing 4 factors and weights exactly.

---

### Finding 7: Inaccurate Legal and Cryptographic Signature Claims
- **Severity:** `MEDIUM`
- **Current Behavior:** The UI and i18n copy claim:
  - *"Cryptographic digital signature stamp will be recorded"* (English: `signModalDesc`)
  - *"يتم ختم العقد رقمياً وتسجيل الطابع الزمني"* (Arabic: `signModalDesc`)
  - *"100% Legally compliant B2B technician subleasing agreements adhering to Aramco & SABIC"* (English: `agreements.subtitle`)
  In reality, the system implements an electronic confirmation record (checkbox + timestamp + user ID) and does not hold an official Aramco/SABIC accreditation or asymmetric PKI signature keys.
- **Root Cause:** Promotional prototype copy in `src/messages/ar.json` and `src/messages/en.json`.
- **Affected Files / Tables / Policies:**
  - Files: `src/messages/ar.json`, `src/messages/en.json`
  - Components: `AgreementSignatureModal.tsx`, `AgreementCard.tsx`
- **Proposed Fix:** Refactor terminology to:
  - *"Electronic Agreement Acceptance"* / *"اعتماد وتأكيد إلكتروني للأطراف"*
  - *"Designed to support applicable B2B technician subleasing workflows adhering to industry safety practices"*
  - *"Designed to support applicable Ajeer workflow requirements"*
- **Expected Side Effects:** Legal and marketing accuracy; eliminates misleading claims for pilots.
- **Residual Risk:** None.

---

### Finding 8: Unprotected Verification Documents Storage Access
- **Severity:** `MEDIUM`
- **Current Behavior:** The `verification-docs` storage bucket does not have explicit row-level storage policies defined in `schema.sql`. Depending on default bucket settings, uploaded commercial registration (CR) documents and HSE certifications may be readable by unauthorized users or writable by any user.
- **Root Cause:** Missing explicit storage policies in master SQL schema.
- **Affected Files / Tables / Policies:**
  - Bucket: `storage.objects` (`verification-docs`)
  - File: `supabase/schema.sql`
- **Proposed Fix:** Add explicit storage RLS policies in `supabase/schema.sql` restricting upload paths to `auth.uid()/*` and limiting SELECT permissions strictly to document owners and system administrators.
- **Expected Side Effects:** Cross-tenant document inspection is blocked.
- **Residual Risk:** Low.

---

### Finding 9: Lack of Immutable Audit Logging for Sensitive Transitions
- **Severity:** `LOW`
- **Current Behavior:** Critical security and compliance events (role escalation attempts, verification approvals/rejections, agreement signing timestamps, mobilization stage transitions) are only stored as current state values in mutable tables. There is no append-only audit trail to reconstruct the sequence of actions.
- **Root Cause:** No audit table exists in the database schema.
- **Affected Files / Tables / Policies:**
  - Database schema: `supabase/schema.sql`
- **Proposed Fix:** Create a lightweight `public.audit_logs` table with strict RLS:
  - Direct client writes (`INSERT`, `UPDATE`, `DELETE`) are denied for all normal users (`WITH CHECK (false)`).
  - Records are generated solely via database triggers (`SECURITY DEFINER`).
  - Administrators have `SELECT` access only.
- **Expected Side Effects:** Zero frontend overhead; complete database-level traceability.
- **Residual Risk:** None.

---

## Conclusion & Action Plan

All 9 findings represent concrete, verified risks in the current baseline. The remediation plan will proceed with minimal, targeted fixes across `supabase/schema.sql`, `src/lib/matching/engine.ts`, `src/hooks/`, and i18n dictionaries, followed by real behavioral tests.
