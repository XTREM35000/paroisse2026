/**
 * Service Supabase pour les documents officiels
 * Gère CRUD pour cartes membres, certificats et paramètres
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  MemberCard,
  MemberCardFormData,
  Certificate,
  CertificateFormData,
  DocumentSettings,
  DocumentSettingsFormData,
  MemberCardFilter,
  CertificateFilter,
} from '../types/documents';

// ============================================================================
// 📋 MEMBER CARDS
// ============================================================================

/**
 * Récupère toutes les cartes de membres avec filtrage optionnel
 */
export async function getMemberCards(filter?: MemberCardFilter): Promise<MemberCard[]> {
  let query = supabase
    .from('member_cards')
    .select('*')
    .order('created_at', { ascending: false });

  if (filter?.status) {
    query = query.eq('status', filter.status);
  }

  if (filter?.search) {
    query = query.or(
      `full_name.ilike.%${filter.search}%,member_number.ilike.%${filter.search}%`
    );
  }

  if (filter?.limit) {
    const page = filter?.page || 1;
    const from = (page - 1) * filter.limit;
    query = query.range(from, from + filter.limit - 1);
  }

  const { data = [], error } = await query;

  if (error) {
    console.error('[getMemberCards] Error:', error);
    throw error;
  }

  return data as MemberCard[];
}

/**
 * Récupère une carte de membre par ID
 */
export async function getMemberCard(id: string): Promise<MemberCard | null> {
  const { data, error } = await supabase
    .from('member_cards')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[getMemberCard] Error:', error);
    throw error;
  }

  return data as MemberCard | null;
}

/**
 * Crée une nouvelle carte de membre
 */
export async function createMemberCard(
  formData: MemberCardFormData
): Promise<MemberCard> {
  const { data, error } = await supabase
    .from('member_cards')
    .insert([
      {
        ...formData,
        issued_at: formData.issued_at || new Date().toISOString(),
        status: formData.status || 'active',
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('[createMemberCard] Error:', error);
    throw error;
  }

  return data as MemberCard;
}

/**
 * Met à jour une carte de membre
 */
export async function updateMemberCard(
  id: string,
  formData: Partial<MemberCardFormData>
): Promise<MemberCard> {
  const { data, error } = await supabase
    .from('member_cards')
    .update(formData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[updateMemberCard] Error:', error);
    throw error;
  }

  return data as MemberCard;
}

/**
 * Supprime une carte de membre
 */
export async function deleteMemberCard(id: string): Promise<void> {
  const { error } = await supabase.from('member_cards').delete().eq('id', id);

  if (error) {
    console.error('[deleteMemberCard] Error:', error);
    throw error;
  }
}

// ============================================================================
// 📜 CERTIFICATES
// ============================================================================

/**
 * Récupère tous les certificats avec filtrage optionnel
 */
export async function getCertificates(filter?: CertificateFilter): Promise<Certificate[]> {
  let query = supabase
    .from('certificates')
    .select('*')
    .order('issued_at', { ascending: false });

  if (filter?.certificate_type) {
    query = query.eq('certificate_type', filter.certificate_type);
  }

  if (filter?.search) {
    query = query.or(
      `full_name.ilike.%${filter.search}%,certificate_type.ilike.%${filter.search}%`
    );
  }

  if (filter?.limit) {
    const page = filter?.page || 1;
    const from = (page - 1) * filter.limit;
    query = query.range(from, from + filter.limit - 1);
  }

  const { data = [], error } = await query;

  if (error) {
    console.error('[getCertificates] Error:', error);
    throw error;
  }

  return data as Certificate[];
}

/**
 * Récupère un certificat par ID
 */
export async function getCertificate(id: string): Promise<Certificate | null> {
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[getCertificate] Error:', error);
    throw error;
  }

  return data as Certificate | null;
}

/**
 * Crée un nouveau certificat
 */
export async function createCertificate(
  formData: CertificateFormData
): Promise<Certificate> {
  const { data, error } = await supabase
    .from('certificates')
    .insert([
      {
        ...formData,
        issued_at: formData.issued_at || new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('[createCertificate] Error:', error);
    throw error;
  }

  return data as Certificate;
}

/**
 * Met à jour un certificat
 */
export async function updateCertificate(
  id: string,
  formData: Partial<CertificateFormData>
): Promise<Certificate> {
  const { data, error } = await supabase
    .from('certificates')
    .update(formData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[updateCertificate] Error:', error);
    throw error;
  }

  return data as Certificate;
}

/**
 * Supprime un certificat
 */
export async function deleteCertificate(id: string): Promise<void> {
  const { error } = await supabase.from('certificates').delete().eq('id', id);

  if (error) {
    console.error('[deleteCertificate] Error:', error);
    throw error;
  }
}

// ============================================================================
// ⚙️ DOCUMENT SETTINGS
// ============================================================================

/**
 * Récupère les paramètres globaux des documents
 */
export async function getDocumentSettings(): Promise<DocumentSettings | null> {
  const { data, error } = await supabase
    .from('document_settings')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[getDocumentSettings] Error:', error);
    throw error;
  }

  return data as DocumentSettings | null;
}

/**
 * Crée ou met à jour les paramètres globaux des documents
 */
export async function upsertDocumentSettings(
  formData: DocumentSettingsFormData
): Promise<DocumentSettings> {
  // Essayer d'obtenir les paramètres existants
  const existing = await getDocumentSettings();

  let result;

  if (existing?.id) {
    // Mise à jour
    const { data, error } = await supabase
      .from('document_settings')
      .update(formData)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('[upsertDocumentSettings] Update error:', error);
      throw error;
    }
    result = data;
  } else {
    // Insertion
    const { data, error } = await supabase
      .from('document_settings')
      .insert([formData])
      .select()
      .single();

    if (error) {
      console.error('[upsertDocumentSettings] Insert error:', error);
      throw error;
    }
    result = data;
  }

  return result as DocumentSettings;
}

// ============================================================================
// 📊 STATISTICS
// ============================================================================

/**
 * Compte le nombre total de cartes de membres
 */
export async function countMemberCards(): Promise<number> {
  const { count, error } = await supabase
    .from('member_cards')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('[countMemberCards] Error:', error);
    throw error;
  }

  return count || 0;
}

/**
 * Compte le nombre total de certificats
 */
export async function countCertificates(): Promise<number> {
  const { count, error } = await supabase
    .from('certificates')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('[countCertificates] Error:', error);
    throw error;
  }

  return count || 0;
}
