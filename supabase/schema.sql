-- ==============================================================================
-- RopeLink B2B Manpower Marketplace - Supabase PostgreSQL Master Schema
-- Phase 3 Hardened: Turnaround Agreements, Chat Security & 7-Stage Mobilization
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

-- 2. Profiles Table (with Verification & Role Protection)
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

-- 5. Digital Turnaround Subleasing Agreements Table
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

-- 6. In-App Match Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 7. Mobilization Crew Rosters & Ajeer Reference Table
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

-- 8. Immutable Security & Compliance Audit Log Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    old_state JSONB,
    new_state JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 9. Helper Function: Check Admin Privileges
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

-- 10. Automated Profile Creation Trigger (Prevents Role Escalation on Signup)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role user_role := 'contractor';
    v_company TEXT := '';
BEGIN
    IF NEW.raw_user_meta_data IS NOT NULL THEN
        -- Never assign 'admin' from unauthenticated client metadata
        IF (NEW.raw_user_meta_data->>'role') = 'supplier' THEN
            v_role := 'supplier';
        ELSE
            v_role := 'contractor';
        END IF;
        v_company := COALESCE(NEW.raw_user_meta_data->>'company_name', '');
    END IF;

    INSERT INTO public.profiles (id, company_name, role, city, verification_status, has_seen_tutorial)
    VALUES (NEW.id, v_company, v_role, 'Riyadh', 'unverified', FALSE)
    ON CONFLICT (id) DO UPDATE SET company_name = EXCLUDED.company_name;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. Profile Privilege Escalation Guard Trigger
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT public.is_admin() THEN
        IF NEW.role IS DISTINCT FROM OLD.role THEN
            RAISE EXCEPTION 'Unauthorized: Normal users cannot change their role';
        END IF;
        -- Normal users can only request verification (transitioning to pending_review)
        -- They CANNOT set their status to 'verified' or manipulate verification arbitrarily
        IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
            IF NEW.verification_status = 'verified' THEN
                RAISE EXCEPTION 'Unauthorized: Normal users cannot self-verify';
            ELSIF NEW.verification_status != 'pending_review' THEN
                RAISE EXCEPTION 'Unauthorized: Normal users can only submit verification for review';
            END IF;
        END IF;
    END IF;

    IF NEW.role IS DISTINCT FROM OLD.role OR NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
        INSERT INTO public.audit_logs (entity_type, entity_id, action, actor_id, old_state, new_state)
        VALUES (
            'profile',
            NEW.id,
            'profile_status_update',
            auth.uid(),
            jsonb_build_object('role', OLD.role, 'verification_status', OLD.verification_status),
            jsonb_build_object('role', NEW.role, 'verification_status', NEW.verification_status)
        );
    END IF;

    NEW.updated_at := TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_privilege_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- 12. Agreement Acceptance & Dual-Signature Guard Trigger
CREATE OR REPLACE FUNCTION public.enforce_agreement_signature_rules()
RETURNS TRIGGER AS $$
DECLARE
    v_current_user UUID := auth.uid();
BEGIN
    IF NOT public.is_admin() THEN
        IF v_current_user = OLD.proposer_id AND (
            NEW.terms_accepted_recipient IS DISTINCT FROM OLD.terms_accepted_recipient OR
            NEW.recipient_signed_at IS DISTINCT FROM OLD.recipient_signed_at
        ) THEN
            RAISE EXCEPTION 'Unauthorized: Proposer cannot sign on behalf of recipient';
        END IF;

        IF v_current_user = OLD.recipient_id AND (
            NEW.terms_accepted_proposer IS DISTINCT FROM OLD.terms_accepted_proposer OR
            NEW.proposer_signed_at IS DISTINCT FROM OLD.proposer_signed_at
        ) THEN
            RAISE EXCEPTION 'Unauthorized: Recipient cannot sign on behalf of proposer';
        END IF;

        IF NEW.status = 'active' AND (NEW.terms_accepted_proposer IS NOT TRUE OR NEW.terms_accepted_recipient IS NOT TRUE) THEN
            RAISE EXCEPTION 'Invalid State: Agreement requires dual acceptance before activation';
        END IF;
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status OR 
       NEW.terms_accepted_proposer IS DISTINCT FROM OLD.terms_accepted_proposer OR 
       NEW.terms_accepted_recipient IS DISTINCT FROM OLD.terms_accepted_recipient THEN
        INSERT INTO public.audit_logs (entity_type, entity_id, action, actor_id, old_state, new_state)
        VALUES (
            'agreement',
            NEW.id,
            'agreement_signature_update',
            v_current_user,
            jsonb_build_object('status', OLD.status, 'proposer_signed', OLD.terms_accepted_proposer, 'recipient_signed', OLD.terms_accepted_recipient),
            jsonb_build_object('status', NEW.status, 'proposer_signed', NEW.terms_accepted_proposer, 'recipient_signed', NEW.terms_accepted_recipient)
        );
    END IF;

    NEW.updated_at := TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_enforce_agreement_signature_rules ON public.agreements;
CREATE TRIGGER trg_enforce_agreement_signature_rules
BEFORE UPDATE ON public.agreements
FOR EACH ROW EXECUTE FUNCTION public.enforce_agreement_signature_rules();

-- 13. Mobilization Sequential Progression Guard Trigger (N -> N+1 Only)
CREATE OR REPLACE FUNCTION public.enforce_mobilization_sequence()
RETURNS TRIGGER AS $$
DECLARE
    v_old_rank INT;
    v_new_rank INT;
BEGIN
    IF NEW.current_milestone IS DISTINCT FROM OLD.current_milestone THEN
        v_old_rank := CASE OLD.current_milestone
            WHEN 'agreement_signed' THEN 1
            WHEN 'roster_dispatched' THEN 2
            WHEN 'ajeer_permit_issued' THEN 3
            WHEN 'gate_pass_issued' THEN 4
            WHEN 'hse_induction_done' THEN 5
            WHEN 'active_execution' THEN 6
            WHEN 'completed' THEN 7
            ELSE 0 END;

        v_new_rank := CASE NEW.current_milestone
            WHEN 'agreement_signed' THEN 1
            WHEN 'roster_dispatched' THEN 2
            WHEN 'ajeer_permit_issued' THEN 3
            WHEN 'gate_pass_issued' THEN 4
            WHEN 'hse_induction_done' THEN 5
            WHEN 'active_execution' THEN 6
            WHEN 'completed' THEN 7
            ELSE 0 END;

        IF v_new_rank != v_old_rank + 1 AND NOT public.is_admin() THEN
            RAISE EXCEPTION 'Invalid Mobilization Transition: Stages must progress sequentially (current: %, attempted: %)', OLD.current_milestone, NEW.current_milestone;
        END IF;

        IF v_new_rank = 2 AND OLD.status != 'active' AND NEW.status != 'active' THEN
            RAISE EXCEPTION 'Prerequisite Failed: Agreement must be active (dual-signed) before roster dispatch';
        END IF;

        INSERT INTO public.audit_logs (entity_type, entity_id, action, actor_id, old_state, new_state)
        VALUES (
            'agreement',
            NEW.id,
            'milestone_advancement',
            auth.uid(),
            jsonb_build_object('milestone', OLD.current_milestone),
            jsonb_build_object('milestone', NEW.current_milestone)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_enforce_mobilization_sequence ON public.agreements;
CREATE TRIGGER trg_enforce_mobilization_sequence
BEFORE UPDATE ON public.agreements
FOR EACH ROW EXECUTE FUNCTION public.enforce_mobilization_sequence();

-- 14. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_rosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 15. Hardened RLS Policies
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
CREATE POLICY "Users can view profiles" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Anyone can view requests" ON public.requests;
CREATE POLICY "Anyone can view requests" ON public.requests FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert requests" ON public.requests;
CREATE POLICY "Users can insert requests" ON public.requests FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users and Admins can update requests" ON public.requests;
CREATE POLICY "Users and Admins can update requests" ON public.requests FOR UPDATE USING (auth.uid() = user_id OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "Users and Admins can delete requests" ON public.requests;
CREATE POLICY "Users and Admins can delete requests" ON public.requests FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Participants can view matches" ON public.matches;
CREATE POLICY "Participants can view matches" ON public.matches FOR SELECT USING (auth.uid() = proposer_id OR auth.uid() = recipient_id OR public.is_admin());
DROP POLICY IF EXISTS "Contractors can insert matches" ON public.matches;
CREATE POLICY "Contractors can insert matches" ON public.matches FOR INSERT WITH CHECK (auth.uid() = proposer_id AND proposer_id != recipient_id);
DROP POLICY IF EXISTS "Participants can update matches" ON public.matches;
CREATE POLICY "Participants can update matches" ON public.matches FOR UPDATE USING (auth.uid() = proposer_id OR auth.uid() = recipient_id OR public.is_admin());

DROP POLICY IF EXISTS "Participants can view agreements" ON public.agreements;
CREATE POLICY "Participants can view agreements" ON public.agreements FOR SELECT USING (auth.uid() = proposer_id OR auth.uid() = recipient_id OR public.is_admin());
DROP POLICY IF EXISTS "Participants can insert agreements" ON public.agreements;
CREATE POLICY "Participants can insert agreements" ON public.agreements FOR INSERT WITH CHECK (auth.uid() = proposer_id OR auth.uid() = recipient_id);
DROP POLICY IF EXISTS "Participants can update agreements" ON public.agreements;
CREATE POLICY "Participants can update agreements" ON public.agreements FOR UPDATE USING (auth.uid() = proposer_id OR auth.uid() = recipient_id OR public.is_admin());

DROP POLICY IF EXISTS "Match participants can view and send chat" ON public.chat_messages;
DROP POLICY IF EXISTS "Match participants can view chat" ON public.chat_messages;
CREATE POLICY "Match participants can view chat" ON public.chat_messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.matches m WHERE m.id = chat_messages.match_id AND (m.proposer_id = auth.uid() OR m.recipient_id = auth.uid())) OR public.is_admin()
);
DROP POLICY IF EXISTS "Match participants can send chat" ON public.chat_messages;
CREATE POLICY "Match participants can send chat" ON public.chat_messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.matches m WHERE m.id = chat_messages.match_id AND (m.proposer_id = auth.uid() OR m.recipient_id = auth.uid()))
);

DROP POLICY IF EXISTS "Agreement parties can view and manage roster" ON public.crew_rosters;
CREATE POLICY "Agreement parties can view and manage roster" ON public.crew_rosters FOR ALL USING (
    EXISTS (SELECT 1 FROM public.agreements a WHERE a.id = crew_rosters.agreement_id AND (a.proposer_id = auth.uid() OR a.recipient_id = auth.uid())) OR public.is_admin()
);

-- Immutable Audit Log RLS (Append-only via triggers; Normal users cannot write; Admins can view)
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Direct audit insertions denied" ON public.audit_logs;
CREATE POLICY "Direct audit insertions denied" ON public.audit_logs FOR INSERT WITH CHECK (false);
DROP POLICY IF EXISTS "Audit log updates denied" ON public.audit_logs;
CREATE POLICY "Audit log updates denied" ON public.audit_logs FOR UPDATE USING (false);
DROP POLICY IF EXISTS "Audit log deletions denied" ON public.audit_logs;
CREATE POLICY "Audit log deletions denied" ON public.audit_logs FOR DELETE USING (false);

-- 16. Realtime Publications
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.requests; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.matches; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.agreements; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.crew_rosters; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 17. Supabase Storage Policies for verification-docs Bucket
-- Force private bucket (disables anonymous public CDN bypass)
UPDATE storage.buckets SET public = false WHERE id = 'verification-docs';
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-docs', 'verification-docs', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Allow public document viewing" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Read" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view verification docs" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own verification docs" ON storage.objects;
CREATE POLICY "Users can upload own verification docs" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'verification-docs' AND
    auth.uid() IS NOT NULL AND
    (auth.uid()::text = (storage.foldername(name))[1])
);

DROP POLICY IF EXISTS "Users and Admins can read verification docs" ON storage.objects;
CREATE POLICY "Users and Admins can read verification docs" ON storage.objects
FOR SELECT USING (
    bucket_id = 'verification-docs' AND (
        (auth.uid()::text = (storage.foldername(name))[1]) OR
        public.is_admin()
    )
);

DROP POLICY IF EXISTS "Users can update own verification docs" ON storage.objects;
CREATE POLICY "Users can update own verification docs" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'verification-docs' AND
    auth.uid() IS NOT NULL AND
    (auth.uid()::text = (storage.foldername(name))[1])
);

DROP POLICY IF EXISTS "Users can delete own verification docs" ON storage.objects;
CREATE POLICY "Users can delete own verification docs" ON storage.objects
FOR DELETE USING (
    bucket_id = 'verification-docs' AND
    auth.uid() IS NOT NULL AND
    (auth.uid()::text = (storage.foldername(name))[1])
);
