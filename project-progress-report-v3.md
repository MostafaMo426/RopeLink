# 🏗️ RopeLink KSA - Project Progress Report & Technical Architecture (v3.0)

**Platform:** RopeLink - Saudi Arabia's Premier B2B Industrial Workforce & Rope Access Marketplace  
**Repository:** `MostafaMo426/RopeLink`  
**Current Milestone:** Phase 3 Completed (Turnaround Agreements, Real-Time Messaging & 7-Stage Saudi Ajeer Compliance)  
**Date of Report:** September 1, 2026  

---

## 1. Phase 3: Turnaround Execution & Mobilization (Completed)

Phase 3 transitions RopeLink from an intake and matchmaking directory into a legally compliant, real-time B2B execution platform tailored specifically to the Saudi industrial contracting and turnaround sector (Jubail, Yanbu, Ras Al-Khair, and NEOM).

```
+----------------------------------------------------------------------------------------------------+
|                                      PHASE 3 ARCHITECTURE OVERVIEW                                 |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|   +--------------------------+    Supabase Realtime WS    +----------------------------------+     |
|   |  Real-Time In-App Chat   | <=======================> | Negotiation Room & SAR Day Rates |     |
|   +--------------------------+                            +----------------------------------+     |
|                |                                                                                   |
|                v                                                                                   |
|   +--------------------------+    Cryptographic Auth Stamp +----------------------------------+    |
|   | Digital Sublease Agrmt   | ------------------------> | Dual Digital Signature Pipeline  |    |
|   +--------------------------+                            +----------------------------------+     |
|                |                                                                                   |
|                v                                                                                   |
|   +--------------------------------------------------------------------------------------------+   |
|   |                 7-STAGE SAUDI ARABIA LABOR-COMPLIANT MOBILIZATION TRACKER                  |   |
|   |  [1] Signed -> [2] Roster -> [3] Ajeer Permit 🇸🇦 -> [4] Gate Pass -> [5] HSE -> [6-7] Site |   |
|   +--------------------------------------------------------------------------------------------+   |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

### 1.1 Components & Files Breakdown

All files were created adhering strictly to the architectural constraint: **every single file in `src/` must remain $< 200$ lines**. Subcomponents were extracted cleanly to ensure maintainability, testability, and zero bloat.

| File Path | Description & Responsibility | Lines | Compliance Status |
| :--- | :--- | :---: | :---: |
| [`src/hooks/useMatchChat.ts`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/hooks/useMatchChat.ts) | Real-time WebSocket hook managing messaging, auto-scroll, unread flags, and channel subscription. | **110** | `< 200` lines ✅ |
| [`src/hooks/useAgreements.ts`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/hooks/useAgreements.ts) | State manager for drafting, dual digital signatures, and milestone advancement with Supabase synchronization. | **154** | `< 200` lines ✅ |
| [`src/components/chat/ChatMessageItem.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/chat/ChatMessageItem.tsx) | Micro-component rendering amber/slate message bubbles with timestamp and localized sender labels. | **39** | `< 200` lines ✅ |
| [`src/components/chat/ChatInput.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/chat/ChatInput.tsx) | Optimized text input form with shortcut support (`Enter` to send) and loading states. | **50** | `< 200` lines ✅ |
| [`src/components/chat/ChatModal.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/chat/ChatModal.tsx) | Modal container featuring partner enterprise header, message stream, and contract creation trigger. | **119** | `< 200` lines ✅ |
| [`src/components/agreements/AgreementModal.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/agreements/AgreementModal.tsx) | Modal for drafting B2B Turnaround Subleasing Agreements with day rates in SAR, technician counts, and HSE clauses. | **176** | `< 200` lines ✅ |
| [`src/components/agreements/AgreementSignatureModal.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/agreements/AgreementSignatureModal.tsx) | Digital signature authorization modal rendering an enterprise cryptographic stamp. | **91** | `< 200` lines ✅ |
| [`src/components/agreements/AgreementCard.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/agreements/AgreementCard.tsx) | Enterprise card displaying financial summaries, dual signature stamps, and embedded mobilization tracker. | **153** | `< 200` lines ✅ |
| [`src/components/agreements/AgreementsFeed.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/agreements/AgreementsFeed.tsx) | Feed container listing active contracts with empty states, instant refresh, and modal controllers. | **105** | `< 200` lines ✅ |
| [`src/components/mobilization/MobilizationTracker.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/mobilization/MobilizationTracker.tsx) | 7-stage visual milestone stepper highlighting the mandatory legal Ajeer gateway at Stage 3. | **109** | `< 200` lines ✅ |
| [`src/components/mobilization/CrewRosterList.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/mobilization/CrewRosterList.tsx) | Subcomponent displaying registered technicians, IRATA certification levels, and Ajeer permit references. | **48** | `< 200` lines ✅ |
| [`src/components/mobilization/CrewRosterModal.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/mobilization/CrewRosterModal.tsx) | Modal for adding certified personnel, logging IRATA logbooks, and mapping Qiwa / Ajeer permit numbers. | **148** | `< 200` lines ✅ |
| [`src/components/dashboard/DashboardTabs.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/dashboard/DashboardTabs.tsx) | Navigation sub-bar featuring the new 4th tab: *Turnaround Agreements & Readiness*. | **72** | `< 200` lines ✅ |
| [`src/app/[locale]/dashboard/page.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/app/[locale]/dashboard/page.tsx) | Refactored main dashboard coordinating intake, marketplace, proposals, chat, agreements, and admin views. | **162** | `< 200` lines ✅ |

---

### 1.2 Database & Supabase Schema Implementation

The master database schema (`supabase/schema.sql`) was updated with custom ENUMs, relational tables, non-recursive RLS policies, and realtime publications:

```sql
-- 1. Custom PostgreSQL ENUMs
CREATE TYPE agreement_status AS ENUM (
    'draft', 
    'pending_proposer_sig', 
    'pending_recipient_sig', 
    'active', 
    'completed', 
    'cancelled'
);

CREATE TYPE milestone_stage AS ENUM (
    'agreement_signed',      -- Stage 1: Dual Digital Execution
    'roster_dispatched',     -- Stage 2: IRATA Personnel Assigned
    'ajeer_permit_issued',   -- Stage 3: Official Qiwa / Ajeer Temporary Transfer Permit ⚡ [Mandatory Legal Gateway]
    'gate_pass_issued',      -- Stage 4: Industrial Site Gate Pass (Jubail/Yanbu/NEOM)
    'hse_induction_done',    -- Stage 5: On-Site Safety Induction
    'active_execution',      -- Stage 6: Active Maintenance / Field Operations
    'completed'              -- Stage 7: Turnaround Handover & Closeout
);

-- 2. Turnaround Subleasing Agreements Table
CREATE TABLE public.agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    proposer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    specialty TEXT NOT NULL DEFAULT 'IRATA Rope Access L1',
    city saudi_city NOT NULL DEFAULT 'Jubail',
    technician_count INTEGER NOT NULL DEFAULT 2,
    daily_rate_sar NUMERIC(10, 2) NOT NULL DEFAULT 850.00,
    total_estimated_sar NUMERIC(12, 2) NOT NULL DEFAULT 17000.00,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '10 days'),
    terms_accepted_proposer BOOLEAN NOT NULL DEFAULT FALSE,
    proposer_signed_at TIMESTAMPTZ,
    terms_accepted_recipient BOOLEAN NOT NULL DEFAULT FALSE,
    recipient_signed_at TIMESTAMPTZ,
    status agreement_status NOT NULL DEFAULT 'draft',
    current_milestone milestone_stage NOT NULL DEFAULT 'agreement_signed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. Real-Time Chat Messages Table
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4. Mobilization Crew Rosters with Ajeer Permit Reference Table
CREATE TABLE public.crew_rosters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agreement_id UUID NOT NULL REFERENCES public.agreements(id) ON DELETE CASCADE,
    technician_name TEXT NOT NULL,
    irata_level TEXT NOT NULL DEFAULT 'Level 1',
    irata_number TEXT NOT NULL,
    ajeer_permit_reference TEXT,
    gate_pass_reference TEXT,
    medical_fitness_valid BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 5. Row-Level Security (RLS) & Realtime Configuration
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_rosters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view agreements" ON public.agreements FOR SELECT USING (
    auth.uid() = proposer_id OR auth.uid() = recipient_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Match participants can view and send chat" ON public.chat_messages FOR ALL USING (
    EXISTS (SELECT 1 FROM public.matches m WHERE m.id = chat_messages.match_id AND (m.proposer_id = auth.uid() OR m.recipient_id = auth.uid()))
);

CREATE POLICY "Agreement parties can view and manage roster" ON public.crew_rosters FOR ALL USING (
    EXISTS (SELECT 1 FROM public.agreements a WHERE a.id = crew_rosters.agreement_id AND (a.proposer_id = auth.uid() OR a.recipient_id = auth.uid()))
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.agreements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crew_rosters;
```

---

### 1.3 Real-Time WebSocket Implementation

* **In-App Match Chat Channel:**
  `useMatchChat` establishes an isolated Supabase channel: `match-chat-${matchId}`.
  It listens to `postgres_changes` on the `chat_messages` table filtered by `match_id=eq.${matchId}`. New messages append to state instantaneously and trigger auto-scroll down.
* **Agreement State Machine Channel:**
  `useAgreements` subscribes to real-time changes on `agreements`. When one party digitally signs or advances a mobilization milestone, the UI of both parties re-renders live without polling or manual page refreshing.

---

### 1.4 Saudi Labor Law (Ajeer) Compliance & Bilingual Localization

Under Saudi labor regulations (MHRSD / Qiwa), subcontracted personnel cannot be legally issued industrial site gate passes or deployed without an official **Ajeer Temporary Work Permit (تصريح أجير)**.

1. **Workflow Enforcement:**
   `MobilizationTracker.tsx` structures the mobilization pipeline such that **Stage 3: Ajeer Permit Issued** is explicitly required before **Stage 4: Site Gate Pass Issued**.
2. **Technician Identity & Permits:**
   `CrewRosterModal.tsx` provides dedicated input for `ajeer_permit_reference` (`AJR-2026-XXXX`) alongside `irata_number` and `gate_pass_reference`.
3. **100% Localization Parity:**
   Every label and string in `src/messages/ar.json` and `src/messages/en.json` was harmonized with zero missing translation keys:
   * **AR:** `"تصريح أجير (إصدار تصريح أجير لنقل الخدمات المؤقت نظامياً عبر قوى)"`
   * **EN:** `"Ajeer Permit Issued (Official MHRSD / Qiwa Ajeer temporary work permit issued)"`

---

### 1.5 Verification & Automated Test Suite Results

The Phase 3 automated test suite (`scripts/verify-phase3.mjs`) validates **30 criteria** across localization parity, database schema integrity, modularity limit ($<200$ lines), and state transitions:

```bash
npm test
```
```
========================================
🧪 RUNNING ROPELINK PHASE 2 & PHASE 3 AUTOMATED TESTS
========================================
✅ [PASS] I18N-01: Chat namespace exists in both AR & EN
✅ [PASS] I18N-02: Agreements namespace exists in both AR & EN
✅ [PASS] I18N-03: Mobilization namespace exists in both AR & EN
✅ [PASS] I18N-04: Arabic mobilization tracker explicitly contains "تصريح أجير"
✅ [PASS] I18N-05: English mobilization tracker explicitly contains "Ajeer Permit"
✅ [PASS] ARCH-01: Strict File Size Rule: Every single file in src/ is < 200 lines (Violations: 0)
✅ [PASS] SEC-01: agreement_status ENUM defined
✅ [PASS] SEC-02: milestone_stage ENUM defined
✅ [PASS] SEC-03: 7-stage milestone includes ajeer_permit_issued
✅ [PASS] SEC-04: agreements table defined
✅ [PASS] SEC-05: chat_messages table defined
✅ [PASS] SEC-06: crew_rosters table defined
✅ [PASS] SEC-07: crew_rosters table contains ajeer_permit_reference column
✅ [PASS] SEC-08: Realtime publication enabled for agreements
✅ [PASS] SEC-09: Realtime publication enabled for chat_messages
✅ [PASS] MILE-01: Exactly 7 sequential stages configured in compliance pipeline
✅ [PASS] MILE-02: Stage 3 is strictly Ajeer Permit Issued
✅ [PASS] MILE-03: Stage 4 is Site Gate Pass Issued (guarded after Ajeer)
========================================
📊 COMBINED TEST SUMMARY: 30 PASSED, 0 FAILED
========================================
```

---

## 2. Phase 4: Implementation Plan (Field Operations & Commercials)

### 2.1 Objective & Business Scope
Phase 4 bridges field operations with financial settlement. In the Saudi industrial contracting sector, turnaround projects require rigorous daily timesheet approvals (signed off by the Site HSE Supervisor / Project Engineer) before invoices can be legally billed.

**Core Objectives:**
1. **Daily & Weekly Technician Timesheets:** Track hours worked, overtime, and stand-by rates on-site.
2. **Dual-Signature Timesheet Approval:** Timesheet submitted by Supplier ➔ Approved by Contractor's Site Lead.
3. **Automated B2B Tax Invoicing in SAR:** Automatically generate itemized B2B invoices based on approved timesheets with **15% Saudi VAT (ضريبة القيمة المضافة)** compliant with ZATCA rules.
4. **Commercial Settlement Tracking:** Monitor payment milestones (*Unbilled*, *Invoiced*, *Paid*, *Overdue*).

---

### 2.2 Expected Components & Files ($< 200$ Line Limit)

```
src/
├── hooks/
│   ├── useTimesheets.ts                 # Hook for logging hours, approvals, and day rates (< 150 lines)
│   └── useInvoices.ts                   # Hook for generating and paying invoices in SAR (< 150 lines)
├── components/
│   ├── timesheets/
│   │   ├── TimesheetGrid.tsx            # Daily hours entry grid per technician (< 160 lines)
│   │   ├── TimesheetApprovalModal.tsx   # Dual sign-off modal for contractor engineers (< 120 lines)
│   │   └── TimesheetSummaryCard.tsx     # Weekly approved hours summary (< 110 lines)
│   ├── invoices/
│   │   ├── InvoiceGeneratorModal.tsx    # Modal to generate invoice from approved timesheets (< 170 lines)
│   │   ├── InvoiceCard.tsx              # Itemized invoice with 15% VAT & PDF preview (< 160 lines)
│   │   ├── InvoiceStatusBadge.tsx       # Paid / Pending / Overdue badge (< 50 lines)
│   │   └── InvoicesFeed.tsx             # Central commercial settlement tab (< 140 lines)
```

---

### 2.3 Proposed Database Schema Updates (SQL)

```sql
-- 1. Phase 4 ENUMs
CREATE TYPE timesheet_status AS ENUM ('draft', 'submitted', 'approved', 'rejected');
CREATE TYPE invoice_status AS ENUM ('draft', 'issued', 'paid', 'cancelled');

-- 2. Timesheets Table (Daily Technician Log)
CREATE TABLE public.timesheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agreement_id UUID NOT NULL REFERENCES public.agreements(id) ON DELETE CASCADE,
    roster_member_id UUID NOT NULL REFERENCES public.crew_rosters(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    regular_hours NUMERIC(4, 2) NOT NULL DEFAULT 8.00,
    overtime_hours NUMERIC(4, 2) NOT NULL DEFAULT 0.00,
    daily_rate_sar NUMERIC(10, 2) NOT NULL,
    total_sar NUMERIC(10, 2) NOT NULL,
    status timesheet_status NOT NULL DEFAULT 'draft',
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. Invoices Table (ZATCA 15% VAT Compliant)
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agreement_id UUID NOT NULL REFERENCES public.agreements(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL UNIQUE,
    issuer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subtotal_sar NUMERIC(12, 2) NOT NULL,
    vat_rate NUMERIC(4, 2) NOT NULL DEFAULT 0.15, -- 15% Saudi VAT
    vat_amount_sar NUMERIC(12, 2) NOT NULL,
    total_amount_sar NUMERIC(12, 2) NOT NULL,
    status invoice_status NOT NULL DEFAULT 'draft',
    due_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
    paid_at TIMESTAMPTZ,
    payment_reference TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4. Enable RLS & Realtime
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agreement parties can view timesheets" ON public.timesheets FOR ALL USING (
    EXISTS (SELECT 1 FROM public.agreements a WHERE a.id = timesheets.agreement_id AND (a.proposer_id = auth.uid() OR a.recipient_id = auth.uid()))
);

CREATE POLICY "Agreement parties can view invoices" ON public.invoices FOR ALL USING (
    auth.uid() = issuer_id OR auth.uid() = recipient_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.timesheets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
```

---

### 2.4 Phase 4 Testing & Validation Strategy

1. **Gate Guard:** Prevent invoice generation until $100\%$ of logged timesheets are approved by the Contractor.
2. **Financial Arithmetic:** Verify exact calculations: $\text{Total SAR} = \text{Subtotal} + (\text{Subtotal} \times 0.15)$.
3. **Overtime Rules:** Validate overtime rate multiplier ($1.5\times$ base rate per Saudi Labor Law Article 107).
4. **Automated Test Runner:** Build `scripts/verify-phase4.mjs` verifying timesheet state transitions and invoice constraints.

---

## 3. Deployment Roadmap (Countdown to Launch)

```
+-----------------------------------------------------------------------------------------------+
|                                      COUNTDOWN TO LAUNCH                                      |
+-----------------------------------------------------------------------------------------------+
|   [PHASE 1] Prototype & Onboarding          ===================================> [DONE]       |
|   [PHASE 2] Marketplace Matching & Verif    ===================================> [DONE]       |
|   [PHASE 3] Turnaround Execution & Ajeer    ===================================> [DONE]       |
|   [PHASE 4] Timesheets & B2B Invoicing      -----------------------------------> [NEXT]       |
|   [PHASE 5] Super Admin & Production Launch -----------------------------------> [FINAL]      |
+-----------------------------------------------------------------------------------------------+
```

### 3.1 Remaining Phases to Production MVP: **Only 2 Phases Left!**

* **Phase 4: Field Operations & Commercials (Estimated Duration: 1 Day)**
  * Daily timesheet approval system for on-site supervisors.
  * ZATCA-compliant 15% VAT B2B automated invoice generator in SAR.
  * Payment milestone settlement tracker.
* **Phase 5: Super Admin Analytics, Security Hardening & Production Launch (Estimated Duration: 1 Day)**
  * Platform-wide analytics (turnaround volume in SAR, active technicians in field, city distribution).
  * Automated email/SMS notification triggers via Supabase Edge Functions.
  * Final security audit, penetration testing, and production deployment on Vercel.

---

### 3.2 Production Deployment & Launch Checklist

```
[ ] STEP 1: Supabase Production Environment Mapping
    - Verify Supabase PostgreSQL project in Middle East / Bahrain (me-central-1) for lowest latency.
    - Confirm all RLS policies are active and public schema is locked down.
    - Enable Point-in-Time Recovery (PITR) and automatic daily backups.

[ ] STEP 2: Storage Buckets & Content Delivery
    - Configure 'verification-docs' storage bucket with strict mime-type validation (PDF, JPG, PNG).
    - Set up image compression and edge caching headers.

[ ] STEP 3: Vercel Production Build & Environment Variables
    - Configure Vercel Project with Root Directory './'.
    - Inject production environment variables:
      * NEXT_PUBLIC_SUPABASE_URL
      * NEXT_PUBLIC_SUPABASE_ANON_KEY
      * SUPABASE_SERVICE_ROLE_KEY
    - Validate Next.js 15 SSR bundle generation and static page pre-rendering.

[ ] STEP 4: Custom Domain & DNS Mapping (ropelink.sa)
    - Register 'ropelink.sa' on SaudiNIC / certified registrar.
    - Map DNS records:
      * CNAME @ -> cname.vercel-dns.com
      * TXT -> Verification token
    - Provision automatic SSL/TLS certificate with HSTS enabled.

[ ] STEP 5: Final Production Smoke Test
    - Execute end-to-end user journeys in Arabic and English on production domain.
    - Verify CR document upload, matching engine score computation, WebSocket chat delivery, and Ajeer mobilization tracker.
```

---

*Report Generated and Certified by RopeLink Core Engineering System.* 🇸🇦🚀
