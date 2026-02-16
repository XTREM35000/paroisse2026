-- Migration: Add payment methods and extend donations table
-- Date: 2026-02-16
-- Description: Support for multiple payment methods (Mobile Money, Card, Cash) and enhanced donation tracking

-- 1. Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  requires_validation BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Seed initial payment methods
INSERT INTO payment_methods (code, label, icon, description, is_active, display_order, requires_validation)
VALUES
  ('card', 'Carte Bancaire', 'CreditCard', 'Payer par carte bancaire (Stripe)', true, 1, false),
  ('mobile_money', 'Mobile Money', 'Smartphone', 'Orange Money, Wave, Moov Money...', true, 2, true),
  ('cash', 'Espèces', 'DollarSign', 'Versement en espèces au bureau', true, 3, true)
ON CONFLICT DO NOTHING;

-- 3. Extend donations table (non-breaking changes)
ALTER TABLE donations
ADD COLUMN IF NOT EXISTS payment_method TEXT REFERENCES payment_methods(code),
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'confirmed', 'failed', 'refunded')),
ADD COLUMN IF NOT EXISTS provider TEXT,
ADD COLUMN IF NOT EXISTS transaction_ref TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'XOF',
ADD COLUMN IF NOT EXISTS payer_email TEXT,
ADD COLUMN IF NOT EXISTS payer_phone TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 4. Extend receipts table
ALTER TABLE receipts
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS qr_code_data TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 5. Create donation_audit log (tracking changes)
CREATE TABLE IF NOT EXISTS donation_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT,
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Enable RLS on new tables
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_audit_log ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for payment_methods (public read, admin modify)
CREATE POLICY "payment_methods_read_all" 
ON payment_methods FOR SELECT 
USING (is_active = true);

CREATE POLICY "payment_methods_modify_admin_only" 
ON payment_methods FOR ALL 
USING (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'));

-- 8. RLS Policies for donation_audit_log
CREATE POLICY "donation_audit_log_read_admin_only" 
ON donation_audit_log FOR SELECT 
USING (
  auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
);

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_donations_payment_method ON donations(payment_method);
CREATE INDEX IF NOT EXISTS idx_donations_payment_status ON donations(payment_status);
CREATE INDEX IF NOT EXISTS idx_donations_transaction_ref ON donations(transaction_ref);
CREATE INDEX IF NOT EXISTS idx_donations_payer_email ON donations(payer_email);
CREATE INDEX IF NOT EXISTS idx_donation_audit_log_donation_id ON donation_audit_log(donation_id);

-- 10. Create function to update donation timestamp
CREATE OR REPLACE FUNCTION update_donation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create trigger to update donation timestamp on change
DROP TRIGGER IF EXISTS trigger_update_donation_updated_at ON donations;
CREATE TRIGGER trigger_update_donation_updated_at
BEFORE UPDATE ON donations
FOR EACH ROW
EXECUTE FUNCTION update_donation_updated_at();

-- 12. Create function to log donation status changes
CREATE OR REPLACE FUNCTION log_donation_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    INSERT INTO donation_audit_log (donation_id, old_status, new_status, changed_by, change_reason)
    VALUES (NEW.id, OLD.payment_status, NEW.payment_status, auth.uid(), 'Status change');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 13. Create trigger for status change logging
DROP TRIGGER IF EXISTS trigger_log_donation_status ON donations;
CREATE TRIGGER trigger_log_donation_status
AFTER UPDATE ON donations
FOR EACH ROW
EXECUTE FUNCTION log_donation_status_change();
