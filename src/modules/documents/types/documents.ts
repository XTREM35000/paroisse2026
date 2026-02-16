/**
 * Types pour le module Documents Officiels Paroisse
 * Cartes de membres, certificats, diplômes
 */

// ============================================================================
// 📋 MEMBER CARDS
// ============================================================================

export interface MemberCard {
  id: string;
  profile_id?: string | null;
  full_name: string;
  role?: string | null;
  member_number: string;
  photo_url?: string | null;
  signature_url?: string | null;
  issued_by?: string | null;
  issued_at: string;
  status: 'active' | 'inactive' | 'expired' | 'revoked';
  created_at: string;
  updated_at?: string;
}

export interface MemberCardFormData {
  full_name: string;
  role?: string;
  member_number: string;
  photo_url?: string;
  signature_url?: string;
  issued_by?: string;
  issued_at?: string;
  status?: 'active' | 'inactive' | 'expired' | 'revoked';
}

// ============================================================================
// 📜 CERTIFICATES
// ============================================================================

export interface Certificate {
  id: string;
  full_name: string;
  certificate_type: 'diplôme' | 'certificat' | 'mention' | 'honneur' | string;
  mention?: string | null;
  description?: string | null;
  issued_by?: string | null;
  signature_url?: string | null;
  logo_url?: string | null;
  issued_at: string;
  created_at: string;
  updated_at?: string;
}

export interface CertificateFormData {
  full_name: string;
  certificate_type: 'diplôme' | 'certificat' | 'mention' | 'honneur' | string;
  mention?: string;
  description?: string;
  issued_by?: string;
  signature_url?: string;
  logo_url?: string;
  issued_at?: string;
}

// ============================================================================
// ⚙️ DOCUMENT SETTINGS
// ============================================================================

export interface DocumentSettings {
  id: string;
  parish_name?: string | null;
  parish_address?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  authority_name?: string | null;
  authority_title?: string | null;
  authority_signature_url?: string | null;
  footer_text?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface DocumentSettingsFormData {
  parish_name?: string;
  parish_address?: string;
  logo_url?: string;
  banner_url?: string;
  authority_name?: string;
  authority_title?: string;
  authority_signature_url?: string;
  footer_text?: string;
}

// ============================================================================
// 🎨 PREVIEW DATA
// ============================================================================

export interface MemberCardPreviewData {
  card: MemberCard;
  settings: DocumentSettings;
}

export interface CertificatePreviewData {
  certificate: Certificate;
  settings: DocumentSettings;
}

// ============================================================================
// 📊 PAGINATION & FILTERING
// ============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MemberCardFilter extends PaginationParams {
  status?: 'active' | 'inactive' | 'expired' | 'revoked';
  search?: string;
}

export interface CertificateFilter extends PaginationParams {
  certificate_type?: string;
  search?: string;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ApiResponse<T> {
  data?: T;
  error?: string | null;
  loading: boolean;
}

export interface ListResponse<T> {
  data: T[];
  count: number;
  error?: string | null;
  loading: boolean;
}
