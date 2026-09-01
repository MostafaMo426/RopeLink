-- ==============================================================================
-- RopeLink B2B Manpower Marketplace - Supabase PostgreSQL Schema
-- Phase 3: Digital Turnaround Agreements, Real-Time Messaging & Mobilization
-- ==============================================================================

-- 1. Custom Types & ENUMs (Independent Safe Blocks)
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('contractor', 'supplier', 'admin'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE request_type AS ENUM ('project', 'need_manpower', 'available_crew'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE request_status AS ENUM ('pending', 'reviewing', 'matched', 'in_progress', 'completed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE verification_status AS ENUM ('unverified', 'pending_review', 'verified', 'rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE match_status AS ENUM ('pending', 'accepted', 'declined', 'completed'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE saudi_city AS ENUM ('Riyadh', 'Jeddah', 'Dammam', 'Jubail', 'Yanbu', 'NEOM', 'Khobar', 'Ras Al-Khair', 'Tabuk', 'Jazan', 'Other'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE agreement_status AS ENUM ('draft', 'pending_proposer_sig', 'pending_recipient_sig', 'active', 'completed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE milestone_stage AS ENUM ('agreement_signed', 'roster_dispatched', 'ajeer_permit_issued', 'gate_pass_issued', 'hse_induction_done', 'active_execution', 'completed'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Profiles Table (with Verification & Credentials)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL DEFAULT '',
    cr_number TEXT,
    cr_document_url TEXT,
    hse_document_url TEXT,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'contractor',
    city saudi_city NOT NULL DEFAULT 'Riyadh',
    verification_status verification_status NOT NULL DEFAULT 'unverified',
    has_seen_tutorial BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. Requests Table
CREATE TABLE IF NOT EXISTS public.requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    company_name TEXT NOT NULL,
    contact_phone TEXT,
    type request_type NOT NULL,
    city saudi_city NOT NULL DEFAULT 'Riyadh',
    start_date DATE NOT NULL,
    technician_count INTEGER NOT NULL CHECK (technician_count > 0),
    specialty TEXT NOT NULL DEFAULT 'Rope Access IRATA',
    status request_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4. Match Proposals Table
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
    proposer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT,
    status match_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 5. Phase 3: Digital Turnaround Subleasing Agreements Table
CREATE TABLE IF NOT EXISTS public.agreements (
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

-- 6. Phase 3: In-App Match Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 7. Phase 3: Mobilization Crew Rosters & Ajeer Reference Table
CREATE TABLE IF NOT EXISTS public.crew_rosters (
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

-- 8. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_rosters ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
CREATE POLICY "Users can view profiles" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Anyone can view requests" ON public.requests;
CREATE POLICY "Anyone can view requests" ON public.requests FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert requests" ON public.requests;
CREATE POLICY "Users can insert requests" ON public.requests FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
DROP POLICY IF EXISTS "Users and Admins can update requests" ON public.requests;
CREATE POLICY "Users and Admins can update requests" ON public.requests FOR UPDATE USING (auth.uid() = user_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Participants can view matches" ON public.matches;
CREATE POLICY "Participants can view matches" ON public.matches FOR SELECT USING (auth.uid() = proposer_id OR auth.uid() = recipient_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
DROP POLICY IF EXISTS "Contractors can insert matches" ON public.matches;
CREATE POLICY "Contractors can insert matches" ON public.matches FOR INSERT WITH CHECK (auth.uid() = proposer_id);
DROP POLICY IF EXISTS "Participants can update matches" ON public.matches;
CREATE POLICY "Participants can update matches" ON public.matches FOR UPDATE USING (auth.uid() = proposer_id OR auth.uid() = recipient_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Participants can view agreements" ON public.agreements;
CREATE POLICY "Participants can view agreements" ON public.agreements FOR SELECT USING (auth.uid() = proposer_id OR auth.uid() = recipient_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
DROP POLICY IF EXISTS "Participants can insert agreements" ON public.agreements;
CREATE POLICY "Participants can insert agreements" ON public.agreements FOR INSERT WITH CHECK (auth.uid() = proposer_id OR auth.uid() = recipient_id);
DROP POLICY IF EXISTS "Participants can update agreements" ON public.agreements;
CREATE POLICY "Participants can update agreements" ON public.agreements FOR UPDATE USING (auth.uid() = proposer_id OR auth.uid() = recipient_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Match participants can view and send chat" ON public.chat_messages;
CREATE POLICY "Match participants can view and send chat" ON public.chat_messages FOR ALL USING (
    EXISTS (SELECT 1 FROM public.matches m WHERE m.id = chat_messages.match_id AND (m.proposer_id = auth.uid() OR m.recipient_id = auth.uid()))
);

DROP POLICY IF EXISTS "Agreement parties can view and manage roster" ON public.crew_rosters;
CREATE POLICY "Agreement parties can view and manage roster" ON public.crew_rosters FOR ALL USING (
    EXISTS (SELECT 1 FROM public.agreements a WHERE a.id = crew_rosters.agreement_id AND (a.proposer_id = auth.uid() OR a.recipient_id = auth.uid()))
);

-- 10. Realtime Publications
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.requests; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.matches; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.agreements; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.crew_rosters; EXCEPTION WHEN OTHERS THEN NULL; END $$;
