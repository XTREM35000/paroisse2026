-- ============================================================================
-- MIGRATION: Module Documents Officiels Paroisse (Cartes & Diplômes)
-- ============================================================================
-- Created: 2026-02-16
-- Description: Tables pour gérer cartes de membres et certificats/diplômes
-- ============================================================================

-- ============================================================================
-- 📋 TABLE: member_cards
-- Gère les cartes de membres avec photos, numéros et signatures
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.member_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    role TEXT,
    member_number TEXT UNIQUE,
    photo_url TEXT,
    signature_url TEXT,
    issued_by TEXT,
    issued_at TIMESTAMP DEFAULT now(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'revoked')),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_member_cards_profile_id ON public.member_cards(profile_id);
CREATE INDEX IF NOT EXISTS idx_member_cards_status ON public.member_cards(status);
CREATE INDEX IF NOT EXISTS idx_member_cards_created_at ON public.member_cards(created_at DESC);

-- ============================================================================
-- 📜 TABLE: certificates
-- Gère les certificats, diplômes et mentions honorifiques
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    certificate_type TEXT NOT NULL,
    mention TEXT,
    description TEXT,
    issued_by TEXT,
    signature_url TEXT,
    logo_url TEXT,
    issued_at TIMESTAMP DEFAULT now(),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_certificates_certificate_type ON public.certificates(certificate_type);
CREATE INDEX IF NOT EXISTS idx_certificates_issued_at ON public.certificates(issued_at DESC);

-- ============================================================================
-- ⚙️ TABLE: document_settings
-- Paramètres globaux pour les documents (logo, signature autorité, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.document_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parish_name TEXT,
    parish_address TEXT,
    logo_url TEXT,
    banner_url TEXT,
    authority_name TEXT,
    authority_title TEXT,
    authority_signature_url TEXT,
    footer_text TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- 🔐 ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.member_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- member_cards RLS Policies
-- ============================================================================

-- Admin et super_admin : CRUD complet
CREATE POLICY "member_cards_admin_all" 
  ON public.member_cards 
  FOR ALL 
  USING (
    (auth.jwt() ->> 'email')::text IN (
      SELECT email FROM public.profiles 
      WHERE role IN ('admin', 'super_admin', 'curé')
    )
  );

-- Authenticated users : lecture seule
CREATE POLICY "member_cards_authenticated_read" 
  ON public.member_cards 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- certificates RLS Policies
-- ============================================================================

-- Admin et super_admin : CRUD complet
CREATE POLICY "certificates_admin_all" 
  ON public.certificates 
  FOR ALL 
  USING (
    (auth.jwt() ->> 'email')::text IN (
      SELECT email FROM public.profiles 
      WHERE role IN ('admin', 'super_admin', 'curé')
    )
  );

-- Authenticated users : lecture seule
CREATE POLICY "certificates_authenticated_read" 
  ON public.certificates 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- document_settings RLS Policies
-- ============================================================================

-- Admin et super_admin : CRUD complet
CREATE POLICY "document_settings_admin_all" 
  ON public.document_settings 
  FOR ALL 
  USING (
    (auth.jwt() ->> 'email')::text IN (
      SELECT email FROM public.profiles 
      WHERE role IN ('admin', 'super_admin', 'curé')
    )
  );

-- Authenticated users : lecture seule
CREATE POLICY "document_settings_authenticated_read" 
  ON public.document_settings 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- 🔧 FUNCTIONS
-- ============================================================================

-- Fonction pour mettre à jour le timestamp updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour mise à jour automatique
CREATE TRIGGER update_member_cards_updated_at BEFORE UPDATE ON public.member_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON public.certificates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_settings_updated_at BEFORE UPDATE ON public.document_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 📝 COMMENTS
-- ============================================================================

COMMENT ON TABLE public.member_cards IS 'Cartes de membres officielles avec photo, numéro et signature';
COMMENT ON TABLE public.certificates IS 'Certificats, diplômes et mentions honorifiques';
COMMENT ON TABLE public.document_settings IS 'Paramètres globaux pour la génération de documents';

COMMENT ON COLUMN public.member_cards.member_number IS 'Numéro unique de membre';
COMMENT ON COLUMN public.member_cards.status IS 'État: active, inactive, expired, revoked';
COMMENT ON COLUMN public.certificates.certificate_type IS 'Type: diplôme, certificat, mention, honneur';
COMMENT ON COLUMN public.document_settings.parish_name IS 'Nom officiel de la paroisse';

-- ============================================================================
-- FIN MIGRATION
-- ============================================================================
