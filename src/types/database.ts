export type UserRole = 'contractor' | 'supplier' | 'admin';

export type RequestType = 'project' | 'need_manpower' | 'available_crew';

export type RequestStatus =
  | 'pending'
  | 'reviewing'
  | 'matched'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

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
  phone?: string | null;
  role: UserRole;
  city: SaudiCity;
  has_seen_tutorial: boolean;
  created_at: string;
  updated_at: string;
}

export interface ManpowerRequest {
  id: string;
  user_id?: string | null;
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
