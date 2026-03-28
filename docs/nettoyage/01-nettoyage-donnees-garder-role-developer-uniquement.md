# Nettoyage des données — conserver uniquement le rôle / compte « developer »

## Objectif

Vider le contenu des **tables applicatives** `public.*` (et éventuellement nettoyer `auth.users`) tout en **conservant** :

- une **ligne de rôle « developer »** si vous avez une table de référence des rôles (ex. `public.roles` **que vous auriez ajoutée** ; ce dépôt standard n’en définit pas) ;
- en pratique pour Faith-Flix : **un profil `profiles` avec `role = 'developer'`** et **un utilisateur Auth** associé (voir section réaliste ci‑dessous).

## Avertissements

- Faire une **sauvegarde** ou un export avant exécution.
- Sur **Supabase hébergé**, `DELETE FROM auth.users` peut être **soumis à des restrictions** ; préférer souvent le **Dashboard Authentication** ou l’**API Admin** (`auth.admin.deleteUser`) pour les suppressions ciblées.
- Les **triggers** sur `auth.users` / `public.profiles` / `public.paroisses` peuvent recréer des lignes : désactivez-les temporairement si nécessaire (voir migrations `handle_auth_user_created`, `trigger_add_developer_to_parish` sur la table réelle utilisée).
- **`session_replication_role = replica`** : contourne les FK pour TRUNCATE massifs ; à remettre en `DEFAULT` ensuite. Certaines instances désactivent ce réglage (voir migration `20260327_fix_reset_all_data_remove_replication_role`).

## Schéma Faith-Flix : `public.paroisses` (pas `parishes`)

Utilisez **`public.paroisses`** pour les références paroisse (voir `00-parishes-vs-paroisses.md`).

## Script SQL type (à adapter à vos tables existantes)

Ordre : **tables enfants → tables parents**, ou `TRUNCATE ... CASCADE` depuis les tables qui ont des FK sortantes, en listant toutes vos tables métier.

```sql
-- =====================================================
-- Option A — Données publiques vidées, developer conservé
-- Adapter la liste TRUNCATE à votre schéma réel (\dt public.*)
-- =====================================================

BEGIN;

-- Triggers à suspendre (noms à vérifier dans pg_trigger / migrations)
DROP TRIGGER IF EXISTS ensure_developer_account ON auth.users;
DROP TRIGGER IF EXISTS trigger_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trigger_add_developer_to_parish ON public.paroisses;

SET session_replication_role = replica;  -- peut être interdit sur certains plans

-- Exemples alignés sur les migrations du repo (compléter si besoin)
TRUNCATE TABLE public.parish_members CASCADE;
TRUNCATE TABLE public.footer_config CASCADE;
TRUNCATE TABLE public.header_config CASCADE;
TRUNCATE TABLE public.homepage_sections CASCADE;
TRUNCATE TABLE public.about_page_sections CASCADE;
TRUNCATE TABLE public.page_hero_banners CASCADE;
-- … autres tables métier (videos, events, donations, chat, live_streams, …)
TRUNCATE TABLE public.paroisses CASCADE;

TRUNCATE TABLE public.profiles CASCADE;

-- Nettoyage auth : NE GARDER QUE l’email developer convenu
DELETE FROM auth.users
WHERE id <> '11111111-1111-1111-1111-111111111111';  -- ou filtrer par email

-- Si vous avez une table public.roles (non standard ici) :
-- TRUNCATE TABLE public.roles CASCADE;
-- INSERT INTO public.roles (id, name, …) VALUES (…, 'developer', …);

SET session_replication_role = DEFAULT;

-- Recréer triggers (reprendre définitions des migrations à jour)
-- CREATE TRIGGER …

COMMIT;
```

## Approche recommandée plutôt que TRUNCATE auth à la main

1. Repos : la fonction **`reset_all_data`** ou l’edge **`create-developer`** + migrations `ensure_developer_*` documentent un **état minimal** cohérent.
2. Pour « tout vider sauf developer », la voie la plus fiable est souvent :
   - TRUNCATE / DELETE sur `public.*` avec **service role** ;
   - s’assurer que **un** user Auth + **un** `profiles` developer existent via **Dashboard** ou **Supabase Auth Admin** (`createUser` avec `email_confirm`, identités email correctes).

## Vérifications

```sql
SELECT count(*) AS profiles_developer FROM public.profiles WHERE lower(role::text) = 'developer';
SELECT id, email FROM auth.users WHERE lower(email) = lower('votre-email-developer@domaine');
-- SELECT count(*) FROM public.paroisses;  -- souvent 0 après ce script jusqu’à re-seed SYSTEM
```
