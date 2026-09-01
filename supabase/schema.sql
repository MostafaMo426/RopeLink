-- ==============================================================================
-- RopeLink B2B Manpower Marketplace - Supabase PostgreSQL Schema
-- Phase 2: Real-time Matching, Verification & Marketplace Edition
-- ==============================================================================

-- 1. Custom Types & ENUMs (Independent Safe Blocks)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('contractor', 'supplier', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE request_type AS ENUM ('project', 'need_manpower', 'available_crew');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE request_status AS ENUM ('pending', 'reviewing', 'matched', 'in_progress', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('unverified', 'pending_review', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE match_status AS ENUM ('pending', 'accepted', 'declined', 'completed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE saudi_city AS ENUM ('Riyadh', 'Jeddah', 'Dammam', 'Jubail', 'Yanbu', 'NEOM', 'Khobar', 'Ras Al-Khair', 'Tabuk', 'Jazan', 'Other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

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

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_status verification_status NOT NULL DEFAULT 'unverified';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cr_document_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hse_document_url TEXT;

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

-- 4. Match Proposals Table (Phase 2)
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

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- 6. Profiles RLS Policies
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
CREATE POLICY "Users can view profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (
    auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 7. Requests RLS Policies (Open Marketplace Discovery)
DROP POLICY IF EXISTS "Anyone can view requests" ON public.requests;
DROP POLICY IF EXISTS "Users can view own requests" ON public.requests;
DROP POLICY IF EXISTS "Users can view requests" ON public.requests;
CREATE POLICY "Anyone can view requests" ON public.requests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert requests" ON public.requests;
CREATE POLICY "Users can insert requests" ON public.requests FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users and Admins can update requests" ON public.requests;
DROP POLICY IF EXISTS "Users can update own requests" ON public.requests;
DROP POLICY IF EXISTS "Users can update requests" ON public.requests;
CREATE POLICY "Users and Admins can update requests" ON public.requests FOR UPDATE USING (
    auth.uid() = user_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 8. Matches RLS Policies
DROP POLICY IF EXISTS "Participants can view matches" ON public.matches;
CREATE POLICY "Participants can view matches" ON public.matches FOR SELECT USING (
    auth.uid() = proposer_id OR auth.uid() = recipient_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

DROP POLICY IF EXISTS "Contractors can insert matches" ON public.matches;
CREATE POLICY "Contractors can insert matches" ON public.matches FOR INSERT WITH CHECK (auth.uid() = proposer_id);

DROP POLICY IF EXISTS "Participants can update matches" ON public.matches;
CREATE POLICY "Participants can update matches" ON public.matches FOR UPDATE USING (
    auth.uid() = proposer_id OR auth.uid() = recipient_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 9. Automated Profile Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role user_role := 'contractor';
    v_company TEXT := '';
BEGIN
    IF NEW.raw_user_meta_data IS NOT NULL THEN
        IF (NEW.raw_user_meta_data->>'role') = 'supplier' THEN
            v_role := 'supplier';
        ELSIF (NEW.raw_user_meta_data->>'role') = 'admin' THEN
            v_role := 'admin';
        ELSE
            v_role := 'contractor';
        END IF;
        v_company := COALESCE(NEW.raw_user_meta_data->>'company_name', '');
    END IF;

    INSERT INTO public.profiles (id, company_name, role, city, verification_status, has_seen_tutorial)
    VALUES (NEW.id, v_company, v_role, 'Riyadh', 'unverified', FALSE)
    ON CONFLICT (id) DO UPDATE SET
        company_name = EXCLUDED.company_name,
        role = EXCLUDED.role;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Updated At Triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = TIMEZONE('utc'::text, NOW()); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_requests_updated_at ON public.requests;
CREATE TRIGGER set_requests_updated_at BEFORE UPDATE ON public.requests FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_matches_updated_at ON public.matches;
CREATE TRIGGER set_matches_updated_at BEFORE UPDATE ON public.matches FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 11. Permissions & Real-time Replication
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.requests TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.matches TO anon, authenticated, service_role;

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.requests; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.matches; EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_requests_city_type ON public.requests(city, type);
CREATE INDEX IF NOT EXISTS idx_matches_request_id ON public.matches(request_id);
