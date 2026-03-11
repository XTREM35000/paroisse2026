-- =====================================================
-- MIGRATION: Recréation complète de la table donations
-- Gère les dons et paiements en ligne
-- =====================================================

-- 1. Nettoyer les éléments existants
DROP TRIGGER IF EXISTS donations_updated_at_trigger ON public.donations;
DROP FUNCTION IF EXISTS public.update_donations_updated_at();
DROP POLICY IF EXISTS "Donations are viewable by donors and admins" ON public.donations;
DROP POLICY IF EXISTS "Users can create their own donations" ON public.donations;
DROP POLICY IF EXISTS "Users can update their own donations" ON public.donations;
DROP POLICY IF EXISTS "Only admins can delete donations" ON public.donations;
DROP TABLE IF EXISTS public.donations;
DROP TYPE IF EXISTS payment_status_type;
DROP TYPE IF EXISTS payment_method_type;
DROP TYPE IF EXISTS donation_type;

-- 2. Créer enum pour les méthodes de paiement
CREATE TYPE payment_method_type AS ENUM (
  'stripe',
  'cinetpay',
  'cash',
  'bank_transfer'
);

-- 3. Créer enum pour le statut de paiement
CREATE TYPE payment_status_type AS ENUM (
  'pending',
  'completed',
  'failed',
  'cancelled'
);

-- 4. Créer la table donations
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Donateur
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  payer_name VARCHAR(255),
  payer_email VARCHAR(255),
  payer_phone VARCHAR(30),
  intention_message TEXT,

  -- Détails du paiement
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'XOF',
  payment_method payment_method_type NOT NULL,
  payment_status payment_status_type DEFAULT 'pending',
  stripe_session_id VARCHAR(255),
  transaction_id VARCHAR(255),

  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- 5. Créer les index
CREATE INDEX idx_donations_user_id ON public.donations(user_id);
CREATE INDEX idx_donations_payment_method ON public.donations(payment_method);
CREATE INDEX idx_donations_payment_status ON public.donations(payment_status);
CREATE INDEX idx_donations_created_at ON public.donations(created_at DESC);
CREATE INDEX idx_donations_anonymous ON public.donations(is_anonymous);

-- 6. Activer RLS
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- 7. Politique de lecture : propriétaire ou admin
CREATE POLICY "Donations are viewable by donors and admins"
  ON public.donations
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'administrateur')
  );

-- 8. Politique de création : permettre les dons anonymes et authentifiés
CREATE POLICY "Users can create donations"
  ON public.donations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR user_id IS NULL
  );

-- Politique pour permettre l'insertion aux utilisateurs non authentifiés (dons anonymes)
CREATE POLICY "Anonymous users can create donations"
  ON public.donations
  FOR INSERT
  TO anon
  WITH CHECK (
    user_id IS NULL AND is_anonymous = true
  );

-- 9. Politique de mise à jour pour le propriétaire
CREATE POLICY "Users can update their own donations"
  ON public.donations
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
  )
  WITH CHECK (
    auth.uid() = user_id
  );

-- 10. Politique de suppression pour les admins seulement
CREATE POLICY "Only admins can delete donations"
  ON public.donations
  FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin', 'administrateur')
  );

-- 11. Créer un trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_donations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER donations_updated_at_trigger
  BEFORE UPDATE ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_donations_updated_at();
