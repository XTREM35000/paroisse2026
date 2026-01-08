# Migration : Configuration des Affiches Publicitaires

## État actuel

La page `/publicite` est prête, mais la table Supabase n'existe pas encore. Vous devez exécuter la migration SQL.

## Instructions pour exécuter la migration

### Méthode 1 : Via le dashboard Supabase (Recommandé)

1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet
3. Allez dans **SQL Editor** (menu de gauche)
4. Cliquez sur **New Query**
5. Copiez et collez le SQL ci-dessous
6. Cliquez sur **Run**

### SQL à exécuter

```sql
-- Migration: 038_create_public_advertisements.sql
-- Create table public_advertisements with RLS and supporting objects
BEGIN;

CREATE TABLE IF NOT EXISTS public_advertisements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  content TEXT,
  image_url TEXT NOT NULL,
  pdf_url TEXT,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public_advertisements ENABLE ROW LEVEL SECURITY;

-- Public select policy: only show active and not expired ads
CREATE POLICY "Public ads are viewable by everyone"
ON public_advertisements FOR SELECT
USING (is_active = TRUE AND (end_date IS NULL OR end_date > NOW()));

-- Admins policy: check profiles.role = 'admin'
CREATE POLICY "Only admins can modify ads"
ON public_advertisements FOR ALL
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Index to speed up active queries
CREATE INDEX IF NOT EXISTS idx_ads_active_dates ON public_advertisements(is_active, end_date) WHERE is_active = TRUE;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp ON public_advertisements;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public_advertisements
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Example data (optional)
INSERT INTO public_advertisements (title, subtitle, content, image_url, pdf_url, is_active, priority)
VALUES (
  'Fête paroissiale',
  'Célébration et repas communautaire',
  'Rejoignez-nous pour la fête annuelle de la paroisse.',
  'https://example.com/affiche-fete.jpg',
  NULL,
  TRUE,
  10
)
ON CONFLICT DO NOTHING;

COMMIT;
```

## Vérification

Une fois la migration exécutée, vous devriez voir :

1. **Table créée** : `public_advertisements` visible dans l'onglet Schema
2. **Exemple d'affiche** : Un enregistrement inséré (vous pouvez le supprimer plus tard)
3. **RLS activé** : Vérifiez dans l'onglet Schema → public_advertisements → RLS

## Fonctionnalités activées après migration

- ✅ `/publicite` - Page publique d'affichage des affiches
- ✅ `/admin/ads` - Interface d'administration (CRUD)
- ✅ `/` - Popup de la dernière affiche au chargement
- ✅ Confirmation ReactJS pour la suppression
- ✅ Gestion des priorités et dates d'expiration
- ✅ Contrôle d'accès basé sur les rôles (admins uniquement)

## Troubleshooting

**Problème** : Erreur "table does not exist"
→ La migration SQL n'a pas été exécutée. Suivez les instructions ci-dessus.

**Problème** : Impossible de modifier les affiches en tant qu'admin
→ Vérifiez que votre `profiles.role` est bien `'admin'`

**Problème** : Le popup ne s'affiche pas à la page d'accueil
→ Une fois la migration exécutée, rechargez la page (`Ctrl+F5`)

## Notes

- La table utilise `TIMESTAMPTZ` pour gérer les fuseaux horaires
- Les affiches expirées ne s'affichent pas publiquement (RLS)
- L'ID créateur est facultatif mais utile pour l'audit
- Les affiches sont triées par priorité décroissante, puis par date
