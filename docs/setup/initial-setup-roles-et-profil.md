# Configuration initiale (assistant) — rôle après OTP

## Ce qui se passe vraiment (étapes 1 à 5)

1. **Inscription** (`initFirstParoisseAndUser` dans `setupWizard.ts`) envoie à Supabase un `signUp` avec dans les métadonnées :  
   `role: 'super_admin'` et `paroisse_id` = l’id de la paroisse créée par le RPC `init_system`.

2. Après **validation du code OTP** (`verifyOtp` dans `SetupWizardModal.tsx`), l’app appelle **`enforceSetupUserSuperAdmin`** qui force :
   - `public.profiles.role = 'super_admin'`
   - `public.parish_members` → ligne avec `role: 'super_admin'` pour cette paroisse.

3. **Redirection** : vers `/dashboard` pour un abonné « normal » ; vers `/developer/admin` **seulement** si les métadonnées indiquent `developer` (compte plateforme), pas pour le super-admin créé par le wizard.

## Donc : « developer » automatiquement ?

**Non.** Le **premier administrateur** créé via l’assistant est **`super_admin`** (tous les privilèges sur **sa** paroisse et, côté app, le même niveau d’accès UI que prévu pour super admin dans les menus / routes).  
Le rôle **`developer`** est réservé au **compte plateforme** (edge `create-developer`, UUID fixe / email convenu), pas au souscripteur du wizard.

Les deux ont des **privilèges élevés** ; seul le libellé et la portée (multi-paroisses / admin developpeur) diffèrent.

## Profil `/profile` et avatar

- Le **menu utilisateur** et le **profil** lisent `profile.avatar_url` après `ensureProfileExists` + `uploadPendingAvatar` ; l’OTP flow enchaîne ces appels après connexion.
- Le **rôle affiché** repose sur le **rôle effectif** (profil + JWT), avec libellés du type « Super administrateur » / « Développeur plateforme » (`formatRoleLabelForUi`).

## Fichiers utiles

- `src/lib/setupWizard.ts` — `initFirstParoisseAndUser`, métadonnées `super_admin`.
- `src/components/SetupWizardModal.tsx` — `enforceSetupUserSuperAdmin`, `verifyOtp`.
- `src/contexts/AuthContext.tsx` — `mergeEffectiveRole` pour le rôle affiché.
- `src/pages/ProfilePage.tsx` — affichage du rôle.
