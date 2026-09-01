# RopeLink Platform — Comprehensive Project Progress Report & Phase 3 Roadmap

**Date:** September 1, 2026  
**Repository:** [MostafaMo426/RopeLink](https://github.com/MostafaMo426/RopeLink)  
**Target Market:** Kingdom of Saudi Arabia (Industrial Hubs: Jubail, Yanbu, NEOM, Ras Al-Khair, Riyadh, Dammam)  
**Core Stack:** Next.js 15 (App Router, Webpack), TypeScript, Tailwind CSS, Supabase (GoTrue Auth, PostgreSQL, Realtime WebSocket Channels, Storage Buckets), next-intl (Bilingual AR/EN), Framer Motion, driver.js, Lucide React, Sonner.

---

## 1. Phase 1: Prototype & Onboarding (Completed)

### 1.1 Components & Files
Phase 1 established the foundation for the RopeLink B2B platform, deploying responsive, glassmorphic UI components under a strict $< 200$ lines modular architecture.

| Component Name | File Path | Lines | Description & Purpose |
|---|---|---|---|
| `Navbar` | [`src/components/layout/Navbar.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/layout/Navbar.tsx) | 125 | Global sticky navigation with brand identity, locale switcher (`/ar` ⇋ `/en`), dynamic auth buttons, and dashboard routing. |
| `Footer` | [`src/components/layout/Footer.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/layout/Footer.tsx) | 98 | Industrial-themed footer featuring Saudi Vision 2030 highlights, supported industrial zones, and localized contact details. |
| `HeroSection` | [`src/components/landing/HeroSection.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/landing/HeroSection.tsx) | 138 | Visual hero banner with live KSA industrial statistics, call-to-action cards, and backdrop mesh gradients. |
| `ValuePropsSection` | [`src/components/landing/ValuePropsSection.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/landing/ValuePropsSection.tsx) | 115 | 3-column value proposition section highlighting idle bench elimination, 48h mobilization, and IRATA/HSE compliance. |
| `MarketStatsSection` | [`src/components/landing/MarketStatsSection.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/landing/MarketStatsSection.tsx) | 94 | High-impact key performance indicators (+1,450 techs, 99.4% HSE compliance, 48h turnaround, +180 contractors). |
| `HowItWorksSection` | [`src/components/landing/HowItWorksSection.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/landing/HowItWorksSection.tsx) | 108 | 3-step contractor journey from request submission to algorithmic pairing and on-site mobilization. |
| `RopeTechnicianAnimation` | [`src/components/landing/RopeTechnicianAnimation.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/landing/RopeTechnicianAnimation.tsx) | 116 | Scroll-linked IRATA technician descending on an industrial rig using Framer Motion spring physics. |
| `GuidedTour` | [`src/components/dashboard/GuidedTour.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/dashboard/GuidedTour.tsx) | 124 | Interactive onboarding walkthrough powered by `driver.js`, tailored to the user's role (Admin vs Contractor/Supplier). |
| `AuthModal` | [`src/components/auth/AuthModal.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/auth/AuthModal.tsx) | 158 | Multi-role authentication modal supporting Sign In and Registration for Main Contractors and Manpower Suppliers. |
| `RequestModal` | [`src/components/requests/RequestModal.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/requests/RequestModal.tsx) | 162 | Structured intake form for submitting Project Demand, Manpower Requests, or Available Crew listings. |
| `DashboardHeader` | [`src/components/dashboard/DashboardHeader.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/dashboard/DashboardHeader.tsx) | 83 | Organization profile header displaying company title, role pill, Saudi city, restart tour button, and sign out trigger. |
| `RequestsList` | [`src/components/dashboard/RequestsList.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/dashboard/RequestsList.tsx) | 113 | Live card grid displaying organization-specific active manpower requests, technician counts, and deployment statuses. |
| `AdminOperationsView` | [`src/components/dashboard/AdminOperationsView.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/dashboard/AdminOperationsView.tsx) | 177 | Operations Control Center enabling platform administrators to filter, review, and advance request statuses. |
| `AdminRequestCard` | [`src/components/dashboard/AdminRequestCard.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/dashboard/AdminRequestCard.tsx) | 82 | Modularized admin card component featuring instant status dropdown selectors and contact details. |

---

### 1.2 Database & Supabase Schema
The PostgreSQL schema in [`supabase/schema.sql`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/supabase/schema.sql) was engineered with custom PostgreSQL ENUM types, automated timestamp triggers, and non-recursive Row-Level Security (RLS) policies.

```sql
-- 1. Custom ENUM Definitions
CREATE TYPE user_role AS ENUM ('contractor', 'supplier', 'admin');
CREATE TYPE request_type AS ENUM ('project', 'manpower_need', 'available_crew');
CREATE TYPE request_status AS ENUM ('pending', 'reviewing', 'matched', 'in_progress', 'completed', 'cancelled');
CREATE TYPE saudi_city AS ENUM ('Riyadh', 'Jeddah', 'Dammam', 'Jubail', 'Yanbu', 'NEOM', 'Ras Al-Khair', 'Khobar');

-- 2. Organization Profiles Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'contractor',
    phone TEXT,
    city saudi_city DEFAULT 'Riyadh',
    has_seen_tutorial BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Manpower & Project Requests Table
CREATE TABLE public.requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type request_type NOT NULL,
    company_name TEXT NOT NULL,
    contact_phone TEXT,
    city saudi_city NOT NULL,
    start_date DATE NOT NULL,
    technician_count INTEGER NOT NULL CHECK (technician_count > 0),
    specialty TEXT NOT NULL,
    notes TEXT,
    status request_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Automated User Profile Creation Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, company_name, role, phone, city)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'company_name', 'منشأة معتمدة'),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'contractor'),
        NEW.raw_user_meta_data->>'phone',
        COALESCE((NEW.raw_user_meta_data->>'city')::saudi_city, 'Riyadh')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Non-Recursive RLS Policies (Fixing Supabase Infinite Loop Traps)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow authenticated read of requests" ON public.requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert requests" ON public.requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own requests or Admins update all" ON public.requests FOR UPDATE TO authenticated
USING (
    auth.uid() = user_id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
```

---

### 1.3 Onboarding & Guided Tour Integration
* **Driver.js Configuration:** Integrated via [`GuidedTour.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/dashboard/GuidedTour.tsx) with custom Saudi amber theme highlights (`#F59E0B`), darkened backdrop blur, and responsive positioning.
* **Trigger Conditions:**
  * Auto-triggers on first dashboard entry if `profile.has_seen_tutorial === false`.
  * Manual re-trigger available at any time via the "Restart Guided Tour" (`restartTour`) button in `DashboardHeader.tsx`.
* **State Persistence:** Once the tour completes or is dismissed, `useSupabaseAuth.completeTutorial()` sends an immediate update to Supabase:
  ```ts
  await supabase.from('profiles').update({ has_seen_tutorial: true }).eq('id', user.id);
  ```

---

### 1.4 Framer Motion Scroll-Linked Rope Technician Animation
* **Mechanism:** [`RopeTechnicianAnimation.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/landing/RopeTechnicianAnimation.tsx) utilizes `useScroll()` and `useTransform()` to bind the vertical descent of an SVG rope access technician directly to the page scroll progress (`scrollYProgress`).
* **Physics & Realism:** Includes subtle spring pendulum swings (`rotate: [-2, 2, -1, 1, 0]`) and tension lines mimicking active industrial descent.
* **Mobile Viewport Constraints & Layering:**
  * Positioned with fixed coordinates (`pointer-events-none z-30`).
  * On mobile screens ($< 768\text{px}$), the component is hidden (`hidden md:block`) or scaled down (`scale: 0.65`) to prevent obstructing interactive form inputs and navigation menus.

---

### 1.5 Localization & UI Architecture (Saudi Industrial Business Dialect)
* **Framework:** `next-intl` App Router routing with localized routing paths (`/ar/*` and `/en/*`).
* **Directionality & RTL Layout:** Applied `dir="rtl"` dynamically for Arabic and `dir="ltr"` for English in [`src/app/[locale]/layout.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/app/[locale]/layout.tsx), utilizing logical CSS utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`) to ensure zero visual misalignment.
* **Terminology:** Uses authentic Saudi industrial terminology (e.g., *تسكين الكوادر الفنية*, *عقود الإسناد الميداني*, *تخفيض الطاقة الفائضة*, *فنيي الوصول بالحبال IRATA/SPRAT*).

---

### 1.6 Architectural Modularity & File Size Audit
Every source file in `src/` was strictly held to $< 200$ lines.
* `AdminOperationsView.tsx` (177 lines) refactored sub-cards into `AdminRequestCard.tsx` (82 lines).
* `DashboardPage.tsx` (189 lines) refactored action buttons into `QuickActionButtons.tsx` (45 lines).

---

## 2. Phase 2: Real-Time Matching Engine, B2B Marketplace & Enterprise Verification (Completed)

### 2.1 Overview & Scope
Phase 2 expanded RopeLink from a request intake prototype into a functional **B2B Manpower Marketplace**, introducing automated multi-factor algorithmic matchmaking, interactive match proposal dispatch, CR enterprise verification, and real-time database replication.

---

### 2.2 New Components & Custom Hooks

| Component / Hook | File Path | Lines | Description & Purpose |
|---|---|---|---|
| `engine.ts` | [`src/lib/matching/engine.ts`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/lib/matching/engine.ts) | 125 | Algorithmic scoring engine calculating 0–100% compatibility scores between project demands and available crews. |
| `useRealtimeMarketplace.ts` | [`src/hooks/useRealtimeMarketplace.ts`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/hooks/useRealtimeMarketplace.ts) | 127 | Real-time hook subscribing to Supabase WebSocket changes on `requests` and `matches` tables. |
| `TrustBadge` | [`src/components/verification/TrustBadge.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/verification/TrustBadge.tsx) | 111 | Multi-variant trust badge rendering full labels or compact inline checkmarks (`verified`, `pending_review`, `rejected`, `unverified`). |
| `VerificationModal` | [`src/components/verification/VerificationModal.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/verification/VerificationModal.tsx) | 158 | Enterprise verification modal supporting 10-digit CR input and direct file upload to `verification-docs` storage bucket. |
| `VerificationBanner` | [`src/components/verification/VerificationBanner.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/verification/VerificationBanner.tsx) | 87 | Dynamic dashboard banner guiding unverified, pending, or rejected contractors to complete verification. |
| `AdminVerificationQueue` | [`src/components/dashboard/AdminVerificationQueue.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/dashboard/AdminVerificationQueue.tsx) | 149 | Admin queue for auditing uploaded CR documents with 1-click Approve / Reject actions and direct document preview links. |
| `MarketplaceFeed` | [`src/components/marketplace/MarketplaceFeed.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/marketplace/MarketplaceFeed.tsx) | 125 | Central B2B marketplace discovery board featuring city, trade, type, and verified filters + live refresh button. |
| `MarketplaceFilters` | [`src/components/marketplace/MarketplaceFilters.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/marketplace/MarketplaceFilters.tsx) | 134 | Filter bar for granular discovery across 8 Saudi industrial regions and 9 IRATA/specialty disciplines. |
| `MarketplaceCard` | [`src/components/marketplace/MarketplaceCard.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/marketplace/MarketplaceCard.tsx) | 130 | Marketplace listing card with real-time match compatibility indicator, verified checkmark, and proposal trigger. |
| `MatchProposalModal` | [`src/components/marketplace/MatchProposalModal.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/marketplace/MatchProposalModal.tsx) | 120 | Dialog enabling contractors to send direct mobilization proposals with scope notes and scheduling details. |
| `MatchProposalsList` | [`src/components/dashboard/MatchProposalsList.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/dashboard/MatchProposalsList.tsx) | 120 | Dual-tab view (Incoming vs Outgoing Proposals) with refresh button and real-time counter badge. |
| `MatchProposalCard` | [`src/components/dashboard/MatchProposalCard.tsx`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/src/components/dashboard/MatchProposalCard.tsx) | 107 | Modular proposal card with 1-click Accept / Decline action buttons and status pill. |

---

### 2.3 Database Updates & Storage Buckets
The database was augmented with verification and matching schemas in [`supabase/schema.sql`](file:///c:/Users/Dell/Desktop/Safy/RopeLink/supabase/schema.sql):

```sql
-- 1. Verification & Match Status ENUMs
CREATE TYPE verification_status AS ENUM ('unverified', 'pending_review', 'verified', 'rejected');
CREATE TYPE match_status AS ENUM ('pending', 'accepted', 'declined', 'cancelled');

-- 2. Alter Profiles with CR Verification Columns
ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS verification_status verification_status NOT NULL DEFAULT 'unverified',
    ADD COLUMN IF NOT EXISTS cr_number TEXT,
    ADD COLUMN IF NOT EXISTS cr_document_url TEXT;

-- 3. B2B Match Proposals Table
CREATE TABLE public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
    proposer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT,
    status match_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Enable Realtime Publications
ALTER PUBLICATION supabase_realtime ADD TABLE public.requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;

-- 5. Storage RLS Policies for 'verification-docs'
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'verification-docs' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow public document viewing" ON storage.objects;
CREATE POLICY "Allow public document viewing" ON storage.objects
FOR SELECT USING (bucket_id = 'verification-docs');
```

---

### 2.4 Business Logic & Functional Features

#### 1. Multi-Factor Intelligent Matching Engine (`engine.ts`)
The matching engine evaluates opposing requests (Project Demand vs Available Crew) and assigns a weighted compatibility score:
$$\text{Score} = (W_{\text{specialty}} \times S_{\text{specialty}}) + (W_{\text{city}} \times S_{\text{city}}) + (W_{\text{timeline}} \times S_{\text{timeline}}) + (W_{\text{count}} \times S_{\text{count}})$$
* **IRATA Trade Specialty (40% Weight):** Exact trade match $= 100\%$, related discipline $= 50\%$, mismatch $= 0\%$.
* **Geographic Proximity (30% Weight):** Same industrial city $= 100\%$, neighboring Eastern Province cluster $= 70\%$, Western/Central cluster $= 50\%$, cross-country $= 25\%$.
* **Mobilization Timeline (20% Weight):** Within 3 days $= 100\%$, within 7 days $= 80\%$, within 14 days $= 50\%$.
* **Headcount Sufficiency (10% Weight):** Crew size $\ge$ requested count $= 100\%$, partial $= \frac{\text{crew}}{\text{needed}} \times 100\%$.
* **Compatibility Badges:**
  * $\ge 85\%$: *Optimal Match / تطابق ممتاز* (Emerald glow)
  * $70\% - 84\%$: *Strong Match / تطابق جيد* (Amber glow)
  * $< 70\%$: *Partial Match / تطابق جزئي* (Slate)

#### 2. Verification Lifecycle & Document Storage
1. **Submission:** User enters 10-digit Saudi CR and attaches a PDF or image.
2. **Bucket Upload:** The file is uploaded to the Supabase `verification-docs` storage bucket under path `${user_id}/${timestamp}_${filename}`.
3. **Public URL Mapping:** The resulting CDN URL is saved to `profiles.cr_document_url` and status transitions to `pending_review`.
4. **Admin Queue:** Admin reviews the CR and document via direct preview link and approves or rejects with 1-click.
5. **Re-Verification Flow:** If rejected, the contractor dashboard displays an alert banner allowing immediate correction and re-submission.
6. **Trust Checkmarks:** Emerald checkmarks (`CheckCircle2`) appear beside verified contractors across all feeds and proposals.

#### 3. B2B Match Proposals & Live Notification
* Contractors browsing the marketplace click **"Request Mobilization Match"** to send a tailored proposal with mobilization notes.
* The recipient receives an animated real-time notification badge on their **"Match Proposals"** tab.
* The recipient can **Accept** or **Decline** with immediate database synchronization.

---

## 3. Testing, Security & Quality Assurance

### 3.1 Automated Test Suite Execution
Our automated regression test suite is split across Phase 1 and Phase 2 scripts:

```bash
# Running Phase 2 Automated Tests
npm test
```

**Test Execution Results (12/12 PASSED, 0 FAILED):**
```
========================================
🧪 RUNNING ROPELINK PHASE 2 AUTOMATED TESTS
========================================

--- [1] Localization & i18n Dictionary Parity ---
✅ [PASS] I18N-01: AR and EN dictionary section parity (including marketplace, matching & verification)
✅ [PASS] I18N-02: All inner translation keys are 100% synchronized across AR & EN

--- [2] Codebase Modularity & File Size Audit ---
✅ [PASS] ARCH-01: Strict File Size Rule: Every single file in src/ is < 200 lines

--- [3] Database Schema & Real-Time Integrity ---
✅ [PASS] SEC-01: Verification status ENUM defined
✅ [PASS] SEC-02: Match status ENUM defined
✅ [PASS] SEC-03: Matches table created for B2B proposals
✅ [PASS] SEC-04: Realtime publication enabled for requests
✅ [PASS] SEC-05: Realtime publication enabled for matches

--- [4] Matching Engine Algorithm Verification ---
✅ [PASS] ENG-01: calculateMatchScore function implemented
✅ [PASS] ENG-02: IRATA specialty weighted at 40%
✅ [PASS] ENG-03: Geographic proximity weighted at 30%
✅ [PASS] ENG-04: Mobilization timeline weighted at 20%

========================================
📊 PHASE 2 TEST SUMMARY: 12 PASSED, 0 FAILED
========================================
```

---

### 3.2 Security & Edge Cases Handled
1. **Non-Recursive RLS Architecture:** Eliminated circular subqueries on `public.profiles` by evaluating `auth.uid()` directly.
2. **File Size & Type Restrictions:** Client-side and storage-level guards limiting uploads to 10MB and enforcing `.pdf, .jpg, .jpeg, .png`.
3. **CR Number Sanitization:** Enforced exact 10-digit format matching Saudi Ministry of Commerce standard commercial registrations.
4. **Self-Matching Prevention:** Contractors are prohibited from sending match proposals to their own listings.
5. **Realtime Re-Subscription Resiliency:** Handled cleanup and memory leak prevention in `useRealtimeMarketplace.ts` with channel state validation.
6. **Mobile/Tablet Viewport Responsiveness:** Tested and verified on standard breakpoints ($375\text{px}, 768\text{px}, 1024\text{px}, 1440\text{px}$).

---

## 4. Phase 3: Implementation Plan (Upcoming)

### 4.1 Objective & Scope
Phase 3 transitions RopeLink into a full-cycle **Turnaround Execution Platform**, enabling matched parties to negotiate terms in a **Real-Time Match Chat Room**, execute legally binding **Digital Turnaround Subleasing Agreements (عقود الإسناد والتسكين الرقمية)** denominated in Saudi Riyals (SAR), and monitor on-site **Field Crew Mobilization Milestones** (Site Gate Passes, IRATA ID Badges, and Safety Inductions).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PHASE 3 B2B WORKFLOW PIPELINE                         │
└─────────────────────────────────────────────────────────────────────────────┘
  1. Match Proposal Accepted
               │
               ▼
  2. Real-Time Chat & Negotiation Room (Direct In-App Messaging & Day Rates)
               │
               ▼
  3. Digital Subleasing Agreement (Scope of Work, Rates in SAR, Dual Signatures)
               │
               ▼
  4. Field Crew Mobilization Tracker (6-Stage Milestone Execution)
     ├─ Stage 1: Agreement Dual-Signed
     ├─ Stage 2: IRATA Roster Dispatched
     ├─ Stage 3: Site Gate Pass Issued (Jubail / Yanbu / NEOM)
     ├─ Stage 4: Safety & HSE Induction Completed
     ├─ Stage 5: Active Field Execution
     └─ Stage 6: Project Turnaround Handover
```

---

### 4.2 New Components & File Structure
All new files will strictly comply with the $< 200$ line architectural rule.

| Target Component | Expected File Path | Expected Lines | Description & Purpose |
|---|---|---|---|
| `useMatchChat.ts` | `src/hooks/useMatchChat.ts` | ~120 | Real-time hook managing chat messages for a specific match proposal via Supabase WebSockets. |
| `useAgreements.ts` | `src/hooks/useAgreements.ts` | ~110 | Hook managing turnaround agreements, digital signatures, and milestone progression. |
| `ChatModal.tsx` | `src/components/chat/ChatModal.tsx` | ~150 | In-app 1-to-1 chat modal linking contractor and manpower supplier for rate/scope negotiation. |
| `ChatMessageItem.tsx` | `src/components/chat/ChatMessageItem.tsx` | ~75 | Message bubble rendering timestamps, sender company badge, and read indicators. |
| `ChatInput.tsx` | `src/components/chat/ChatInput.tsx` | ~80 | Real-time message input with auto-expanding textarea and send trigger. |
| `AgreementModal.tsx` | `src/components/agreements/AgreementModal.tsx` | ~160 | Contract drafting modal displaying standard Saudi B2B turnaround sublease terms. |
| `AgreementCard.tsx` | `src/components/agreements/AgreementCard.tsx` | ~140 | Agreement status card with contract value in SAR, dual signature stamps, and action buttons. |
| `AgreementSignatureModal.tsx` | `src/components/agreements/AgreementSignatureModal.tsx` | ~110 | Digital signature capture modal stamping authorization with timestamp and user ID. |
| `MobilizationTracker.tsx` | `src/components/mobilization/MobilizationTracker.tsx` | ~150 | 6-stage visual milestone stepper for live deployment monitoring. |
| `CrewRosterModal.tsx` | `src/components/mobilization/CrewRosterModal.tsx` | ~140 | Manager for entering technician names, IRATA logbook numbers, and Gate Pass document references. |
| `AgreementsFeed.tsx` | `src/components/agreements/AgreementsFeed.tsx` | ~130 | Dashboard view aggregating all active and completed B2B agreements for the user. |

---

### 4.3 Database & Supabase Schema Extensions
The following schema additions will be appended to `supabase/schema.sql`:

```sql
-- 1. Phase 3 Custom ENUM Types
CREATE TYPE agreement_status AS ENUM (
    'draft', 
    'pending_proposer_sig', 
    'pending_recipient_sig', 
    'active', 
    'completed', 
    'cancelled'
);

CREATE TYPE milestone_stage AS ENUM (
    'agreement_signed', 
    'roster_dispatched', 
    'gate_pass_issued', 
    'hse_induction_done', 
    'active_execution', 
    'completed'
);

-- 2. Digital Turnaround Subleasing Agreements Table
CREATE TABLE public.agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    proposer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    specialty TEXT NOT NULL,
    city saudi_city NOT NULL,
    technician_count INTEGER NOT NULL,
    daily_rate_sar NUMERIC(10, 2) NOT NULL,
    total_estimated_sar NUMERIC(12, 2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    terms_accepted_proposer BOOLEAN NOT NULL DEFAULT FALSE,
    proposer_signed_at TIMESTAMPTZ,
    terms_accepted_recipient BOOLEAN NOT NULL DEFAULT FALSE,
    recipient_signed_at TIMESTAMPTZ,
    status agreement_status NOT NULL DEFAULT 'draft',
    current_milestone milestone_stage NOT NULL DEFAULT 'agreement_signed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. In-App Match Chat Messages Table
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Mobilization Crew Rosters & Passports Table
CREATE TABLE public.crew_rosters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agreement_id UUID NOT NULL REFERENCES public.agreements(id) ON DELETE CASCADE,
    technician_name TEXT NOT NULL,
    irata_level TEXT NOT NULL,
    irata_number TEXT NOT NULL,
    gate_pass_reference TEXT,
    medical_fitness_valid BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Enable Realtime Publications for Phase 3
ALTER PUBLICATION supabase_realtime ADD TABLE public.agreements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crew_rosters;

-- 6. Row-Level Security Policies for Phase 3
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_rosters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agreements" ON public.agreements
FOR SELECT TO authenticated
USING (auth.uid() = proposer_id OR auth.uid() = recipient_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users can update own agreements" ON public.agreements
FOR UPDATE TO authenticated
USING (auth.uid() = proposer_id OR auth.uid() = recipient_id);

CREATE POLICY "Match participants can view and send chat messages" ON public.chat_messages
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.matches m 
        WHERE m.id = chat_messages.match_id 
        AND (m.proposer_id = auth.uid() OR m.recipient_id = auth.uid())
    )
);

CREATE POLICY "Agreement parties can view and update crew roster" ON public.crew_rosters
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.agreements a 
        WHERE a.id = crew_rosters.agreement_id 
        AND (a.proposer_id = auth.uid() OR a.recipient_id = auth.uid())
    )
);
```

---

### 4.4 Phase 3 Testing & Quality Assurance Strategy
1. **Automated Suite (`scripts/verify-phase3.mjs`):**
   * **I18N-03:** 100% dictionary key synchronization across `ar.json` and `en.json` for `chat`, `agreements`, and `mobilization` namespaces.
   * **ARCH-03:** Zero file limit violations ($< 200$ lines per `.tsx` and `.ts` file).
   * **STATE-01:** Agreement dual-signature state machine verification (`draft` ➔ `pending_recipient_sig` ➔ `active`).
   * **MILE-01:** Sequential mobilization milestone transitions from `agreement_signed` through `completed`.
2. **Manual & Realtime Verification:**
   * Multi-tab chat testing verifying instant delivery across sessions.
   * Dual-party agreement execution flow validating timestamp stamping in SAR.
   * Gate pass document referencing and technician IRATA ID validation.
