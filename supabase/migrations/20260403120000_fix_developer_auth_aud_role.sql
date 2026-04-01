-- Reparer le compte developer seedé sans aud/role (signInWithPassword -> 400).
-- Idempotent : ne remplace le hash mot de passe que si la colonne est vide.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

UPDATE auth.users
SET
  aud = 'authenticated',
  role = 'authenticated',
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  encrypted_password = CASE
    WHEN encrypted_password IS NULL OR btrim(encrypted_password) = '' THEN crypt('P2024Mano"', gen_salt('bf'))
    ELSE encrypted_password
  END,
  updated_at = NOW()
WHERE id = '11111111-1111-1111-1111-111111111111';
