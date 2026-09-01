export type UserRole = 'contractor' | 'supplier' | 'admin';

export type RequestType = 'project' | 'need_manpower' | 'available_crew';

export type RequestStatus =
  | 'pending'
  | 'reviewing'
  | 'matched'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type VerificationStatus =
  | 'unverified'
  | 'pending_review'
  | 'verified'
  | 'rejected';

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
  user_id: string | null;
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
  // Relational joins
  profiles?: Profile | null;
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
  // Relational joins
  request?: ManpowerRequest | null;
  proposer?: Profile | null;
}

export interface CreateRequestInput {
  company_name: string;
  contact_phone?: string;
  type: RequestType;
  city: SaudiCity;
  start_date: string;
  technician_count: number;
  specialty?: string;
  notes?: string;
}
