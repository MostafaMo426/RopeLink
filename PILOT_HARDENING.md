# RopeLink Platform Hardening & Pilot-Ready Architecture Specification

**Status:** `PILOT-READY v0.3 — EXISTING MVP HARDENED`  
**Milestone:** Pilot Release & Technical Hardening  
**Date:** September 2026  
**Repository:** [MostafaMo426/RopeLink](https://github.com/MostafaMo426/RopeLink)

---

## Executive Summary

The existing RopeLink MVP codebase has undergone a complete technical and security hardening process. In accordance with the project scope constraints, **zero new product features or future commercial modules were introduced**. The architecture was hardened strictly at the database, trigger, RLS, validation, and messaging layers to prevent privilege escalation, data tampering, message spoofing, and workflow skipping.

---

## 1. What Was Hardened

### A. Privilege Escalation & Self-Verification Guards
- **Signup Role Protection**: Updated `handle_new_user()` in [`supabase/schema.sql`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/supabase/schema.sql) to reject `'admin'` from `raw_user_meta_data`. New registrations are strictly assigned `'contractor'` or `'supplier'`.
- **Profile Privilege Escalation Trigger**: Added database `BEFORE UPDATE` trigger `trg_prevent_profile_privilege_escalation` on `public.profiles`. Any attempt by a non-administrator to alter `role` or `verification_status` is physically blocked by PostgreSQL with an exception.
- **Enterprise Profile Updates**: Normal users retain full autonomy to update operational details (`company_name`, `phone`, `city`, `cr_number`, `cr_document_url`, `has_seen_tutorial`), while administrative fields remain tamper-proof.

### B. Row-Level Security (RLS) & Storage Isolation
- **Chat Message Integrity**: Replaced permissive `FOR ALL` policy with dedicated policies:
  - `FOR SELECT`: Restricted to verified match participants or admins.
  - `FOR INSERT`: Enforces `WITH CHECK (auth.uid() = sender_id)` alongside match participation, eliminating sender impersonation.
  - `UPDATE` and `DELETE`: Prohibited for normal users (immutable chat audit trail).
- **Match Proposals**: Enforced `proposer_id != recipient_id` and required `auth.uid() = proposer_id`.
- **Requests Table**: Restricted INSERT to `auth.uid() = user_id`, restricted UPDATE to owner/admin with matching `WITH CHECK`, and added owner/admin DELETE policy.
- **Storage Security**: Documented row-level storage policies for `verification-docs`, restricting upload and read access strictly to the document owner (`auth.uid()/*`) and system administrators.

### C. Sequential 7-Stage Mobilization State Machine
- **Preserved Existing 7 Stages**:
  1. `agreement_signed`
  2. `roster_dispatched`
  3. `ajeer_permit_issued`
  4. `gate_pass_issued`
  5. `hse_induction_done`
  6. `active_execution`
  7. `completed`
- **Database Trigger Enforcement**: Implemented `trg_enforce_mobilization_sequence` on `public.agreements`:
  - **Sequential Order**: Enforces `current_stage -> current_stage + 1` strictly. Stage skipping (e.g. Stage 1 directly to Stage 4) is rejected by the database.
  - **Dual-Signature Prerequisite**: Advancing from Stage 1 (`agreement_signed`) to Stage 2 (`roster_dispatched`) requires agreement status to be `'active'` (both parties accepted).
  - **Zero Invented Rules**: No artificial prerequisites were introduced; the existing MVP sequence is enforced as defined.

### D. Agreement Dual-Signature & Acceptance Terminology
- **Cross-Party Acceptance Protection**: Implemented `trg_enforce_agreement_signature_rules`:
  - Proposers cannot sign or modify `terms_accepted_recipient`.
  - Recipients cannot sign or modify `terms_accepted_proposer`.
  - Agreement `status` cannot become `'active'` without true dual electronic acceptance.
- **Accurate Legal Terminology**:
  - Replaced misleading claims of "Cryptographic Digital Signatures" (`ختم رقمي مشفر`) with **"Electronic Agreement Acceptance"** (`اعتماد وتأكيد إلكتروني للأطراف`).
  - Replaced unverified claims of "100% legal compliance guarantee" with **"Designed to support applicable B2B technician subleasing workflows adhering to industry safety practices"**.

### E. Matching Logic Hardening
- **Preserved Existing Factors & Weights**:
  - Specialty / Trade: $40\%$ (`0.4`)
  - Geographic Proximity: $30\%$ (`0.3`)
  - Mobilization Timeline: $20\%$ (`0.2`)
  - Headcount Sufficiency: $10\%$ (`0.1`)
  - Total: $100\%$ (`1.0`)
- **Upstream Hard Eligibility Gate**: Added `isEligibleMatch()` in [`src/lib/matching/engine.ts`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/lib/matching/engine.ts):
  - Ineligible pairs (e.g. demand matching demand, 0 technician count, unparseable dates) are immediately assigned `score = 0` and `recommendationKey = 'partial'`, eliminating false-positive recommendations while leaving the soft scoring engine intact.

### F. Immutable Audit Logging
- **Append-Only `public.audit_logs` Table**:
  - Stores `entity_type`, `entity_id`, `action`, `actor_id`, `old_state`, `new_state`, `created_at`.
  - Direct client `INSERT`, `UPDATE`, and `DELETE` operations are explicitly blocked (`WITH CHECK (false)`).
  - Populated exclusively by trusted database triggers (`SECURITY DEFINER`) for role changes, verification updates, agreement signatures, and mobilization milestone advances.
  - Read access is restricted strictly to administrators.

---

## 2. Automated Test Verification (54/54 Tests Passed)

All 3 automated test suites execute in sequence via `npm test`:

```bash
npm test
```

### Test Suite Breakdown:
1. **Phase 2 Regression Suite (`scripts/verify-phase2.mjs`)**: 12/12 PASSED
   - i18n dictionary section parity
   - Inner translation key synchronization
   - File size audit ($< 200$ lines)
   - Matching engine weights ($40/30/20$)
2. **Phase 3 Ajeer Mobilization Suite (`scripts/verify-phase3.mjs`)**: 18/18 PASSED
   - Chat, agreements, and mobilization namespaces
   - Arabic and English Ajeer references
   - 7-stage sequential milestone pipeline structure
3. **Pilot Hardening Behavioral Suite (`scripts/verify-pilot-hardening.mjs`)**: 24/24 PASSED
   - `ENG-01` to `ENG-06`: Matching hard eligibility rejection and consistent 4-factor scoring
   - `RBAC-01` & `RBAC-02`: Role escalation prevention on signup and profile update
   - `AGR-01` to `AGR-03`: Agreement signature boundary and dual-acceptance activation guard
   - `MOBL-01` to `MOBL-03`: Sequential mobilization enforcement and stage skip rejection
   - `CHAT-01` to `CHAT-03`: Sender spoofing prevention and session-derived sender ID
   - `AUD-01` to `AUD-03`: Audit log immutability and admin-only read access
   - `TERM-01` to `TERM-03`: Terminology validation across Arabic and English
   - `ARCH-01`: Strict file size constraint ($< 200$ lines for every file in `src/`)

### Production Build Validation:
- **Command:** `npm run build`
- **Result:** Next.js 16.3.4 Turbopack production compilation succeeded with **`Exit Code: 0`** across all static and dynamic localized routes (`/ar`, `/en`, `/ar/dashboard`, `/en/dashboard`).

---

## 3. Scope Boundaries: Implemented vs. Out of Scope

| Domain | Implemented in Existing Hardened MVP (v0.3) | Explicitly OUT OF SCOPE (Future Phases) |
| :--- | :--- | :--- |
| **Authentication & RBAC** | Contractor & Supplier self-signup; Admin protected by DB trigger | Automated enterprise SSO, external KYC providers |
| **Marketplace & Requests** | B2B demand/supply listings, city filtering, request creation | Public bidding auctions, multi-tier subcontracting |
| **Matching Engine** | 4-factor scoring ($40/30/20/10$) + hard eligibility gate | AI neural matching, automated dispatching algorithms |
| **Turnaround Agreements** | In-app agreement drafting, dual electronic acceptance | Cryptographic PKI signing, external DocuSign/AdobeSign API |
| **Real-Time Chat** | Peer-to-peer match negotiation, session-derived sender check | Group video calling, end-to-end PGP encryption |
| **Mobilization & Ajeer** | 7-stage sequential workflow tracker, crew roster, Ajeer reference storage | Direct Ajeer / Qiwa government API automation |
| **Financial Operations** | Estimated SAR daily rates and total contract calculation | Timesheets, Overtime, Invoicing, ZATCA e-invoicing, Payments, Collections |
| **Audit Logging** | Append-only database audit log table for critical events | Complex admin audit dashboards, visual analytics suites |

---

## 4. Known Pilot Limitations & Operational Guidance

1. **Direct Ajeer Issuance**: Platforms in Saudi Arabia require contractual documentation to be registered in the official Qiwa / Ajeer portal. Contractors must execute the temporary transfer in Qiwa and record the reference number (`AJR-XXXX`) in the RopeLink roster modal.
2. **Administrative Role Seeding**: To maintain zero client privilege escalation, new administrator accounts must be created using server-side SQL scripts or direct database management.
3. **Electronic Acceptance**: The agreement confirmation constitutes an electronic commercial agreement record under Saudi Electronic Transactions regulations; it does not replace statutory notary requirements for capital transfers.

---

**Conclusion:** The RopeLink repository is formally certified as **PILOT-READY v0.3 — EXISTING MVP HARDENED**.
