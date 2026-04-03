# ✅ Correction : Inscription et Connexion avec Pseudo

## 🔍 Problème Identifié

Depuis l'ajout de la fonctionnalité pseudo (username), l'inscription et la connexion ne fonctionnaient pas correctement. Les causes:

1. **TypeScript**: Le type du paramètre `metadata` dans `signUpWithEmail` n'incluait pas `username`
2. **Supabase SQL**: La migration qui ajoute le support du pseudo n'avait probablement pas été exécutée manuellement sur votre base

## ✅ Corrections Appliquées

### 1. Frontend (TypeScript)
**Fichiers modifiés:**

#### [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx)
La signature de `signUpWithEmail` a été mise à jour pour inclure `username`:

```typescript
metadata?: { full_name?: string; phone?: string; role?: string; username?: string }
```

#### [src/components/LoginForm.tsx](src/components/LoginForm.tsx)
Le champ identifiant a été normalisé pour traiter les pseudos en minuscules (comme lors de l'inscription):

```typescript
onChange={(e) => {
  const value = e.target.value;
  // Normaliser : si ce n'est pas un email (pas de @), minuscules
  if (!value.includes('@')) {
    setIdentifier(value.toLowerCase().replace(/[^a-z0-9._@]/g, ''));
  } else {
    setIdentifier(value);
  }
}}
```

Le fallback de résolution d'email utilise maintenant `.ilike()` pour une recherche case-insensitive:

```typescript
// Avant: .eq('username', t) - case-sensitive
// Après: .ilike('username', t) - case-insensitive
.ilike('username', t)
```

### 2. Backend SQL (OBLIGATOIRE)
Vous DEVEZ exécuter la migration SQL suivante dans **Supabase SQL Editor** (voir ci-dessous)

**Fichier source:** `supabase/migrations/20260329120000_add_username_to_profiles.sql`

Copiez tout le contenu et exécutez-le dans Supabase SQL Editor:
- Allez dans: https://app.supabase.com → Votre projet → SQL Editor
- Créez une nouvelle requête
- Collez le SQL ci-dessous
- Exécutez

## 🚀 SQL à Exécuter

```sql
-- Pseudo unique sur profiles + RPC pour connexion (résolution email) et disponibilité

BEGIN;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username TEXT;

-- Unicité insensible à la casse (pseudo stocké en minuscules côté app)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower
  ON public.profiles (lower(trim(username)))
  WHERE username IS NOT NULL AND trim(username) <> '';

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS valid_username;

ALTER TABLE public.profiles
  ADD CONSTRAINT valid_username
  CHECK (
    username IS NULL
    OR (username ~ '^[a-zA-Z0-9._]{3,30}$' AND length(trim(username)) >= 3)
  );

-- Connexion : résout un email à partir d'un pseudo
CREATE OR REPLACE FUNCTION public.resolve_email_for_login(p_identifier text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v text;
  t text := trim(coalesce(p_identifier, ''));
BEGIN
  IF t = '' THEN
    RETURN NULL;
  END IF;
  IF position('@' in t) > 0 THEN
    RETURN t;
  END IF;
  SELECT p.email::text INTO v
  FROM public.profiles p
  WHERE p.username IS NOT NULL
    AND lower(trim(p.username)) = lower(t)
  LIMIT 1;
  RETURN v;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_email_for_login(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_email_for_login(text) TO anon, authenticated, service_role;

-- Disponibilité d'un pseudo
CREATE OR REPLACE FUNCTION public.is_username_available(
  p_username text,
  p_except_user_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.username IS NOT NULL
      AND lower(trim(p.username)) = lower(trim(p_username))
      AND (p_except_user_id IS NULL OR p.id <> p_except_user_id)
  );
$$;

REVOKE ALL ON FUNCTION public.is_username_available(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_username_available(text, uuid) TO anon, authenticated, service_role;

-- Trigger inscription : enregistrer le pseudo depuis user_metadata
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_paroisse_id uuid;
  v_role text := 'membre';
  v_count bigint;
  v_requested_role text;
  v_username text;
BEGIN
  v_paroisse_id := null;
  IF (coalesce(new.raw_user_meta_data, '{}'::jsonb)->>'paroisse_id') IS NOT NULL
     AND (coalesce(new.raw_user_meta_data, '{}'::jsonb)->>'paroisse_id') != '' THEN
    BEGIN
      v_paroisse_id := (coalesce(new.raw_user_meta_data, '{}'::jsonb)->>'paroisse_id')::uuid;
    EXCEPTION WHEN OTHERS THEN
      v_paroisse_id := null;
    END;
  END IF;

  v_requested_role := lower(coalesce(new.raw_user_meta_data->>'role', ''));
  IF v_requested_role = 'super_admin' THEN
    v_role := 'super_admin';
  ELSIF v_paroisse_id IS NOT NULL THEN
    SELECT count(*) INTO v_count
    FROM public.profiles
    WHERE paroisse_id = v_paroisse_id;
    IF v_count = 0 THEN
      v_role := 'super_admin';
    END IF;
  ELSE
    SELECT count(*) INTO v_count FROM public.profiles;
    IF v_count = 0 THEN
      v_role := 'super_admin';
    END IF;
  END IF;

  v_username := nullif(trim(lower(coalesce(new.raw_user_meta_data->>'username', ''))), '');

  BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, role, paroisse_id, username, created_at, updated_at)
    VALUES (
      new.id,
      coalesce(new.email, ''),
      coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, ''), '@', 1), 'Utilisateur'),
      coalesce(new.raw_user_meta_data->>'avatar_url', null),
      v_role,
      v_paroisse_id,
      v_username,
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      updated_at = now(),
      username = COALESCE(excluded.username, public.profiles.username);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'handle_auth_user_created: failed for user %: %', new.id, sqlerrm;
  END;

  RETURN new;
END;
$$;

COMMIT;
```

## 📋 Étapes à Suivre

### 1️⃣ Appliquer la Migration SQL
1. Connectez-vous à [Supabase Console](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Créez une **New Query**
5. Collez le SQL ci-dessus
6. Cliquez **Run** ✓

### 2️⃣ Redéployer le Frontend
Les changements TypeScript ont déjà été appliqués. Redéployez ou redémarrez le serveur de développement:

```bash
# Développement
npm run dev

# Production
npm run build
npm run deploy
```

### 3️⃣ Tester l'Inscription et la Connexion

**Test 1: Inscription avec pseudo**
- Allez sur: `/auth` (page Auth)
- Onglet: **Inscription**
- Entrez:
  - Pseudo: `test2026` (3-30 caractères, lettres/chiffres/. /)
  - Email: `test@gmail.com`
  - Mot de passe: `SecurePass123!`
  - Prénom & Nom
- Cliquez **S'inscrire**

**Test 2: Connexion avec pseudo**
- Onglet: **Connexion**
- Identifiant: `test2026` (votre pseudo, pas l'email)
- Mot de passe: (identique)
- Cliquez **Se connecter**

## 🧪 Vérification SQL (Optionnel)

Pour vérifier que vos données sont bien récupérées:

```sql
-- Vérifier les profils avec pseudo
SELECT id, email, username, created_at 
FROM public.profiles 
WHERE username IS NOT NULL 
LIMIT 10;

-- Tester la RPC de résolution
SELECT public.resolve_email_for_login('test2026');
SELECT public.resolve_email_for_login('Test2026'); -- Doit retourner le même email que le précédent

-- Tester la disponibilité d'un pseudo
SELECT public.is_username_available('test2026');
SELECT public.is_username_available('nouveau_pseudo');
SELECT public.is_username_available('Test2026'); -- Doit retourner false si test2026 existe

-- Vérifier que les recherches case-insensitive fonctionnent en base
SELECT * FROM public.profiles WHERE lower(username) = lower('Test2026') LIMIT 1;
```

## ✨ Cas d'Usage : Vérification Complète

```sql
-- 1. Un utilisateur s'inscrit avec le pseudo "JohnDoe2026"
-- → Stocké en BDD comme "johndoe2026" (minuscule)

-- 2. Test de résolution d'email (RPC)
SELECT resolve_email_for_login('johndoe2026'); -- ✓ Retourne l'email
SELECT resolve_email_for_login('JohnDoe2026'); -- ✓ Retourne l'email (case-insensitive)
SELECT resolve_email_for_login('john@example.com'); -- ✓ Retourne l'email (email directement)

-- 3. Test de disponibilité
SELECT is_username_available('johndoe2026'); -- ✗ False (déjà utilisé)
SELECT is_username_available('newusername');  -- ✓ True (disponible)
```

## 📌 Notes Importantes

- Les pseudo sont **insensibles à la casse** (automatiquement minuscules)
- Formats valides: `3-30` caractères, caractères: `a-z`, `0-9`, `.`, `_`
- Le pseudo est **unique** par utilisateur
- **Les utilisateurs existants** devront ajouter un pseudo manuellement s'ils en veulent un

## ⚠️ Troubleshooting

| Problème | Cause | Solution |
|----------|-------|----------|
| "Pseudo invalide" | Format non respecté | Utilisez 3-30 caractères, a-z, 0-9, . , _ |
| "Pseudo déjà utilisé" | Pseudo pris | Choisir un autre pseudo |
| "RPC introuvable" | Migration non appliquée | Exécuter le SQL dans Supabase |
| Connexion au pseudo échoue | Pas d'inscription complète | Vérifier que le pseudo est enregistré (voir vérification SQL) |
| "Email introuvable" | Typo dans résolution | Vérifier le pseudo exact en BDD |

## 📚 Fichiers Modifiés

- ✅ [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx) - Type TypeScript corrigé (`username` ajouté au type `metadata`)
- ✅ [src/components/LoginForm.tsx](src/components/LoginForm.tsx) - Normalisation du pseudo en minuscules + fallback case-insensitive

## 🔗 Ressources

- [RegisterForm.tsx](src/components/RegisterForm.tsx) - Formulaire d'inscription
- [LoginForm.tsx](src/components/LoginForm.tsx) - Formulaire de connexion
- [SQL Migration](supabase/migrations/20260329120000_add_username_to_profiles.sql) - Migration SQL
