export type CulteRequestType = 'wedding' | 'baptism' | 'confession';

export type RequestPriority = 'very_high' | 'high' | 'normal' | 'low' | 'very_low';

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';

export interface OfficiantRow {
  id: string;
  paroisse_id: string | null;
  name: string;
  title: string | null;
  description?: string | null;
  bio?: string | null;
  photo_url?: string | null;
  phone?: string | null;
  email?: string | null;
  is_active: boolean;
  sort_order?: number | null;
  display_order?: number | null;
  created_at?: string | null;
}

export interface DailyOfficiantRow {
  id: string;
  paroisse_id: string;
  officiant_id: string | null;
  date: string;
  created_at: string;
}

export interface RequestRow {
  id: string;
  paroisse_id: string;
  type: CulteRequestType;
  is_anonymous: boolean;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  user_phone: string | null;
  location: string | null;
  preferred_date: string | null;
  preferred_officiant_id: string | null;
  default_officiant_id: string | null;
  duration_minutes: number | null;
  description: string | null;
  status: RequestStatus;
  priority: RequestPriority;
  metadata: Record<string, unknown>;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeddingParticipant {
  firstName: string;
  lastName: string;
  role: string;
  category: 'adult' | 'young' | 'child';
}

export interface BaptismChild {
  firstName: string;
  lastName: string;
  birthDate: string;
  age: string;
}

export interface BaptismParent {
  firstName: string;
  lastName: string;
  contact: string;
}

export type FaqModerationStatus = 'pending' | 'published' | 'rejected';

export interface FaqRow {
  id: string;
  paroisse_id: string;
  question: string;
  answer: string | null;
  category: string | null;
  author_name: string | null;
  author_email: string | null;
  user_id: string | null;
  is_anonymous: boolean;
  moderation_status: FaqModerationStatus;
  is_pinned: boolean;
  votes_up: number;
  votes_down: number;
  created_at: string;
  published_at: string | null;
  updated_at: string;
}
