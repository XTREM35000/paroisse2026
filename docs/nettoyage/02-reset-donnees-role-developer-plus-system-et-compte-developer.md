# Nettoyage des données — rôle `developer` + paroisse SYSTEM + compte developer (profil + Auth)

## Objectif

Comme le scénario `01-`, mais en plus :

1. **`public.roles`** : une seule ligne **`developer`** (si la table existe chez toi).
2. **Paroisse interne `SYSTEM`** dans **`public.paroisses`** (slug typique : `system`, souvent `is_active = false`).
3. **Compte développeur** cohérent sur trois niveaux :
   - **`auth.users`** (+ **`auth.identities`** pour le provider email si tu utilises mot de passe),
   - **`public.profiles`** avec `role = 'developer'` et lien éventuel vers la paroisse SYSTEM (`paroisse_id`),
   - **Memberships** si ta base utilise **`parish_members`** (ou équivalent) : rattacher le developer à toutes les paroisses pertinentes, dont SYSTEM.

## Table paroisses : laquelle ?

**Utiliser `public.paroisses`** (canonique pour Faith-Flix). Voir **`00-quelle-table-paroisses-parishes.md`**.

Ne pas mélanger avec `public.parishes` sauf migration explicite.

## Ordre logique recommandé

1. **Sauvegarde** complète.
2. **Nettoyage données métier** (`TRUNCATE`/`DELETE` avec CASCADE selon FK), comme en `01-`.
3. **Référentiel rôles** : une ligne `developer` dans `public.roles` (si applicable).
4. **Insérer la paroisse SYSTEM** dans **`public.paroisses`** (UUID fixe si ton projet en définit un — ex. celui des migrations `00000000-0000-0000-0000-000000000001`).
5. **Créer ou mettre à jour l’utilisateur Auth** (idéalement via **Dashboard Supabase** ou **Admin API** / edge **`create-developer`**) avec :
   - email confirmé,
   - `user_metadata.role = 'developer'` (ou équivalent),
   - mot de passe défini (secret `DEV_PASSWORD` côté edge si tu suis le modèle du projet).
6. **Upsert `public.profiles`** : même `id` que `auth.users`, `role = 'developer'`, `paroisse_id` → id de la ligne SYSTEM.
7. **Optionnel** : resynchroniser **`parish_members`** (edge `create-developer` le fait côté service role dans ce projet).
8. **Vérifications** :
   - `SELECT * FROM public.paroisses WHERE slug = 'system';`
   - `SELECT id, email, role FROM public.profiles WHERE role = 'developer';`
   - `SELECT id, email FROM auth.users WHERE id = '<uuid developer>';`

## Pièges fréquents

- **Trigger `handle_auth_user_created`** : peut réinsérer un profil avec rôle `membre` si la création Auth ne passe pas les bonnes métadonnées ; aligner les migrations / métadonnées (voir migrations récentes « developer » dans `supabase/migrations/`).
- **RLS** : les opérations de maintenance se font souvent avec **`service_role`** ou en **SQL Editor** avec droits suffisants.
- **Ordre TRUNCATE** : les tables avec FK vers `paroisses` doivent être vidées avant ou en `CASCADE`.

## Fichiers utiles dans le repo

- `supabase/functions/create-developer/index.ts` — création / alignement developer + memberships.
- `supabase/migrations/*system*developer*`, `*paroisses*`, `*reset*`.

## Nom de fichier conservé

`02-reset-donnees-role-developer-plus-system-et-compte-developer.md`
