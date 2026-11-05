-- ==============================================================================
-- RopeLink Migration: 20261105171954_add_foreign_key_indexes.sql
-- Performance Advisor: Index all unindexed foreign key constraints
-- Eliminates table scans during JOINs, cascading deletes, and foreign key checks.
-- ==============================================================================

-- 1. Table: public.agreements (Foreign keys: match_id, proposer_id, recipient_id)
CREATE INDEX IF NOT EXISTS idx_agreements_match_id 
ON public.agreements(match_id);

CREATE INDEX IF NOT EXISTS idx_agreements_proposer_id 
ON public.agreements(proposer_id);

CREATE INDEX IF NOT EXISTS idx_agreements_recipient_id 
ON public.agreements(recipient_id);

-- 2. Table: public.audit_logs (Foreign key: actor_id)
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id 
ON public.audit_logs(actor_id);

-- 3. Table: public.chat_messages (Foreign keys: match_id, sender_id)
CREATE INDEX IF NOT EXISTS idx_chat_messages_match_id 
ON public.chat_messages(match_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id 
ON public.chat_messages(sender_id);

-- 4. Table: public.crew_rosters (Foreign key: agreement_id)
CREATE INDEX IF NOT EXISTS idx_crew_rosters_agreement_id 
ON public.crew_rosters(agreement_id);

-- 5. Table: public.matches (Foreign keys: proposer_id, recipient_id)
CREATE INDEX IF NOT EXISTS idx_matches_proposer_id 
ON public.matches(proposer_id);

CREATE INDEX IF NOT EXISTS idx_matches_recipient_id 
ON public.matches(recipient_id);

-- 6. Prune redundant single-column index on requests(city)
-- The composite index idx_requests_city_type already covers (city, type)
-- where city is the leading column, satisfying queries on city alone.
DROP INDEX IF EXISTS public.idx_requests_city;

