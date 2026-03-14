-- =====================================================
-- Workflow dons en espèces au guichet
-- Colonnes: status (intention/completed), intention_token, receipt_number, donor_phone
-- =====================================================

-- 1. Statut étendu (intention = en attente de traitement au guichet)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'donations' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.donations
    ADD COLUMN status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'intention', 'completed', 'failed', 'cancelled'));
  END IF;
END $$;

-- 2. Token d'intention (affiché au fidèle, utilisé par l'admin pour retrouver le don)
ALTER TABLE public.donations
ADD COLUMN IF NOT EXISTS intention_token VARCHAR(50) UNIQUE;

-- 3. Numéro de reçu (rempli par l'admin à la validation)
ALTER TABLE public.donations
ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(50);

-- 4. Téléphone du donateur (obligatoire pour les intentions guichet)
ALTER TABLE public.donations
ADD COLUMN IF NOT EXISTS donor_phone VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_donations_intention_token ON public.donations(intention_token);
CREATE INDEX IF NOT EXISTS idx_donations_status ON public.donations(status);

-- Permettre aux anonymes de créer une intention de don au guichet (sans compte)
DROP POLICY IF EXISTS "Anonymous users can create cash intentions" ON public.donations;
CREATE POLICY "Anonymous users can create cash intentions"
  ON public.donations
  FOR INSERT
  TO anon
  WITH CHECK (
    user_id IS NULL
    AND (type = 'cash_guichet' OR payment_status = 'intention')
  );
