-- ==============================================================================
-- RopeLink B2B Manpower Marketplace - Supabase PostgreSQL Schema
-- Phase 1 & Admin Operations Edition
-- ==============================================================================

-- 1. Custom Types & ENUMs
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('contractor', 'supplier', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE request_type AS ENUM ('project', 'need_manpower', 'available_crew');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE request_status AS ENUM (
        'pending',
        'reviewing',
        'matched',
        'in_progress',
        'completed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE saudi_city AS ENUM (
        'Riyadh',
        'Jeddah',
        'Dammam',
        'Jubail',
        'Yanbu',
        'NEOM',
        'Khobar',
        'Ras Al-Khair',
        'Tabuk',
        'Jazan',
        'Other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL DEFAULT '',
    cr_number TEXT,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'contractor',
    city saudi_city NOT NULL DEFAULT 'Riyadh',
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

-- 4. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- 5. Helper Function: Is Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- 6. Profiles RLS Policies (Users see own profile, Admins see all)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id OR public.is_admin());

-- 7. Requests RLS Policies (Users see own, Admins see and manage all)
DROP POLICY IF EXISTS "Users can view own requests" ON public.requests;
CREATE POLICY "Users can view own requests"
    ON public.requests FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert requests" ON public.requests;
CREATE POLICY "Users can insert requests"
    ON public.requests FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own requests" ON public.requests;
CREATE POLICY "Users can update own requests"
    ON public.requests FOR UPDATE
    USING (auth.uid() = user_id OR public.is_admin());

-- 8. Automated Profile Creation Trigger
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

    INSERT INTO public.profiles (id, company_name, role, city, has_seen_tutorial)
    VALUES (NEW.id, v_company, v_role, 'Riyadh', FALSE)
    ON CONFLICT (id) DO UPDATE SET
        company_name = EXCLUDED.company_name,
        role = EXCLUDED.role;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Updated At Timestamp Function & Triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_requests_updated_at ON public.requests;
CREATE TRIGGER set_requests_updated_at
    BEFORE UPDATE ON public.requests
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 10. Permissions & Performance Indexes
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.requests TO anon, authenticated, service_role;

CREATE INDEX IF NOT EXISTS idx_requests_user_id ON public.requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_city ON public.requests(city);
CREATE INDEX IF NOT EXISTS idx_requests_type ON public.requests(type);
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.requests(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
