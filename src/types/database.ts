export type UserRole = 'contractor' | 'supplier' | 'admin';
export type RequestType = 'project' | 'need_manpower' | 'available_crew';
export type RequestStatus = 'pending' | 'reviewing' | 'matched' | 'in_progress' | 'completed' | 'cancelled';
export type VerificationStatus = 'unverified' | 'pending_review' | 'verified' | 'rejected';
export type MatchStatus = 'pending' | 'accepted' | 'declined' | 'completed';
export type SaudiCity =
  | 'Riyadh'
  | 'Jeddah'
  | 'Dammam'
  | 'Jubail'
  | 'Yanbu'
  | 'NEOM'
  | 'Khobar'
  | 'Ras Al-Khair'
  | 'Tabuk'
  | 'Jazan'
  | 'Other';

export type AgreementStatus =
  | 'draft'
  | 'pending_proposer_sig'
  | 'pending_recipient_sig'
  | 'active'
  | 'completed'
  | 'cancelled';

export type MilestoneStage =
  | 'agreement_signed'
  | 'roster_dispatched'
  | 'ajeer_permit_issued'
  | 'gate_pass_issued'
  | 'hse_induction_done'
  | 'active_execution'
  | 'completed';

export interface Profile {
  id: string;
  company_name: string;
  cr_number?: string | null;
  cr_document_url?: string | null;
  hse_document_url?: string | null;
  phone?: string | null;
  role: UserRole;
  city: SaudiCity;
  verification_status: VerificationStatus;
  has_seen_tutorial: boolean;
  created_at: string;
  updated_at: string;
}

export interface ManpowerRequest {
  id: string;
  user_id: string;
  company_name: string;
  contact_phone?: string | null;
  type: RequestType;
  city: SaudiCity;
  start_date: string;
  technician_count: number;
  specialty: string;
  status: RequestStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile | null;
}

export interface CreateRequestInput {
  company_name: string;
  contact_phone?: string;
  type: RequestType;
  city: SaudiCity;
  start_date: string;
  technician_count: number;
  specialty: string;
  notes?: string;
}

export interface MatchProposal {
  id: string;
  request_id: string;
  proposer_id: string;
  recipient_id: string;
  message?: string | null;
  status: MatchStatus;
  created_at: string;
  updated_at: string;
  request?: ManpowerRequest | null;
  proposer?: Profile | null;
  recipient?: Profile | null;
}

export interface Agreement {
  id: string;
  match_id: string;
  proposer_id: string;
  recipient_id: string;
  specialty: string;
  city: SaudiCity;
  technician_count: number;
  daily_rate_sar: number;
  total_estimated_sar: number;
  start_date: string;
  end_date: string;
  terms_accepted_proposer: boolean;
  proposer_signed_at?: string | null;
  terms_accepted_recipient: boolean;
  recipient_signed_at?: string | null;
  status: AgreementStatus;
  current_milestone: MilestoneStage;
  created_at: string;
  updated_at: string;
  proposer?: Profile | null;
  recipient?: Profile | null;
}

export interface ChatMessage {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: Profile | null;
}

export interface CrewRosterMember {
  id: string;
  agreement_id: string;
  technician_name: string;
  irata_level: string;
  irata_number: string;
  ajeer_permit_reference?: string | null;
  gate_pass_reference?: string | null;
  medical_fitness_valid: boolean;
  created_at: string;
}
