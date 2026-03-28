# Reset minimal — developer + profil + Auth + paroisse SYSTEM

## Objectif

Comme l’option « nettoyage sévère », mais en **repartant sur un socle fonctionnel** :

- **`public.paroisses`** : une ligne **SYSTEM** (`slug = 'system'`, `is_active = false` en général) ;
- **`public.profiles`** : un profil **developer** ;
- **`auth.users`** (+ **`auth.identities`** pour le login e-mail/mot de passe) : compte developer opérationnel.

Référence proche dans le repo : `supabase/migrations/20260326_reset_all_data_complete.sql` et l’edge **`create-developer`** (mot de passe via secret `DEV_PASSWORD`).

## Table paroisse

Utiliser **`public.paroisses`** (voir `00-parishes-vs-paroisses.md`).

## Méthode recommandée (production / Supabase hébergé)

1. **Vider** les tables `public` nécessaires (comme dans `01-…`), sans casser les extensions.
2. **Insérer SYSTEM** dans `paroisses` :

```sql
INSERT INTO public.paroisses (
  id, nom, slug, description, is_active, created_at, updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'SYSTEM',
  'system',
  'Compte système pour maintenance',
  false,
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;
```

3. **Créer l’utilisateur Auth** avec l’**API Admin** (JS/Deno) plutôt qu’un `INSERT` brut dans `auth.users`, pour générer correctement **`auth.identities`** et le hachage mot de passe :

   - Edge **`create-developer`** du projet : après reset des données, invoquer la fonction (elle upsert paroisse SYSTEM, profil developer, memberships, aligne metadata).  
   - Mot de passe : secret **`DEV_PASSWORD`** (voir code de la fonction).

4. Si vous devez absolument tout faire en SQL : reprendre un script **déjà validé** dans vos migrations (ex. bloc `INSERT INTO auth.users` dans `20260326_reset_all_data_complete.sql`) en sachant que sur certaines versions GoTrue il manque parfois la ligne **`auth.identities`** — dans ce cas, login mot de passe échoue jusqu’à correction.

## Script SQL « squelette » post-nettoyage

```sql
-- Après TRUNCATE/delete massifs et réactivation session_replication_role

-- 1) Paroisse SYSTEM
INSERT INTO public.paroisses (id, nom, slug, is_active, description, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'SYSTEM',
  'system',
  false,
  'Compte système pour maintenance',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- 2) Profil developer (id = même UUID que auth.users)
INSERT INTO public.profiles (
  id, email, full_name, role, paroisse_id, is_active, created_at, updated_at
)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'dibothierrygogo@gmail.com',
  'Nom Developer',
  'developer',
  '00000000-0000-0000-0000-000000000001',
  true,
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  role = 'developer',
  email = EXCLUDED.email,
  paroisse_id = EXCLUDED.paroisse_id,
  updated_at = now();

-- 3) parish_members : accès SYSTEM + toutes paroisses futures (souvent géré par edge create-developer)
```

L’étape **création Auth** est volontairement renvoyée vers **Admin API / edge** pour fiabilité.

## Vérifications

```sql
SELECT id, slug, is_active FROM public.paroisses WHERE slug = 'system';
SELECT id, email, role FROM public.profiles WHERE role = 'developer';
SELECT id, email FROM auth.users WHERE id = '11111111-1111-1111-1111-111111111111';
```
