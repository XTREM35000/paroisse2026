# 📺 Système de Diffusion Live (Live Streams) - Guide d'Intégration

## 📋 Résumé

Ce système permet à un **Administrateur** de gérer des diffusions live (TV pour les messes, Radio pour les podcasts) que les **Membres connectés** peuvent regarder ou écouter via des boutons dédiés.

### Structure des Fichiers Créés/Modifiés

```
supabase/migrations/
  └── 20260124_create_live_streams.sql        [NOUVEAU] Table + RLS

src/lib/supabase/
  └── mediaQueries.ts                         [MODIFIÉ] Fonctions live streams

src/pages/
  ├── AdminLiveEditor.tsx                     [MODIFIÉ] Interface admin
  └── Live.tsx                                [MODIFIÉ] Page publique
```

---

## 🔧 ÉTAPE 1 : Créer la Table Supabase

### Option A : Via l'Interface Supabase Dashboard

1. Allez dans **Supabase Dashboard** → votre projet
2. Sélectionnez l'onglet **SQL Editor**
3. Cliquez sur **New Query**
4. Copiez-collez le contenu du fichier :
   ```
   supabase/migrations/20260124_create_live_streams.sql
   ```
5. Cliquez sur **Run** (exécuter)
6. Vérifiez que la table `live_streams` apparaît dans l'onglet **Tables**

### Vérification

Après exécution, vous devriez voir :

- Table `live_streams` avec colonnes : `id`, `title`, `stream_url`, `stream_type`, `is_active`, `created_at`, `updated_at`
- 4 politiques RLS : SELECT, INSERT, UPDATE, DELETE

---

## ✅ ÉTAPE 2 : Vérifier l'Import des Fonctions

Le fichier `src/lib/supabase/mediaQueries.ts` contient les nouvelles fonctions :

```typescript
// Récupérer le direct actif
export async function fetchActiveLiveStream(): Promise<LiveStream | null>

// Récupérer tous les directs (admin)
export async function fetchAllLiveStreams(options?: { limit?, offset? }): Promise<{ data: LiveStream[], count }>

// Créer ou mettre à jour un direct
export async function upsertLiveStream(stream: Omit<LiveStream, ...>): Promise<LiveStream>

// Supprimer un direct
export async function deleteLiveStream(id: string): Promise<boolean>

// Désactiver tous les autres directs
export async function deactivateOtherLiveStreams(activeId: string): Promise<boolean>
```

**Aucune action requise** - elles sont déjà importées dans les composants.

---

## 🎨 ÉTAPE 3 : Interface Admin (`AdminLiveEditor.tsx`)

### Fonctionnalités

#### Créer un Nouveau Direct

- **Dialogue modal** avec form :
  - Titre : texte libre (ex: "Messe Dominicale - 1er Février")
  - Type : Select entre "TV (Messe)" et "Radio (Podcast)"
  - URL : lien YouTube ou flux audio (ex: `https://youtube.com/watch?v=ABCD1234` ou `ABCD1234`)
  - Statut : Switch pour activer/désactiver
  - Bouton "Enregistrer"

#### Gérer les Directs Existants

- **Liste en grille** de cartes affichant :
  - Titre du direct
  - Type (TV/Radio) avec icône
  - Statut "● EN DIRECT" si actif
  - URL du flux
  - Date de création
  - Boutons : Modifier, Supprimer
  - Switch pour activer/désactiver

### Accès

- **Route** : `/admin/live` (nécessite rôle admin)
- **Via Menu** : Ajouter le lien dans le menu admin existant

---

## 📺 ÉTAPE 4 : Page Publique (`Live.tsx`)

### Affichage Conditionnel

#### ✨ Quand un Direct est Actif

1. **Bannière "EN DIRECT MAINTENANT"** avec indicateur animé rouge
2. Titre du direct et type (TV/Radio)
3. **Bouton Principal** :
   - "Regarder le Direct" (TV)
   - "Écouter le Direct" (Radio)
   - ⚠️ Visible **UNIQUEMENT pour les utilisateurs connectés**
   - Si non connecté → Toast "Veuillez vous connecter"

4. **Cartes informatives** :
   - Type de diffusion
   - Date/heure de démarrage
   - Information descriptive

#### 🔲 Quand AUCUN Direct n'est Actif

1. Message élégant : "Aucun direct en ce moment"
2. Programme prévisuel avec prochains directs
3. CTA : "Abonnez-vous à nos notifications"

### Lecteur (Modal)

**Pour la TV (YouTube):**

- Iframe YouTube en full responsive
- Autoplay activé
- Contrôles standard YouTube

**Pour la Radio (Audio):**

- Lecteur HTML5 `<audio controls>`
- Fond dégradé vert
- Info : "En direct maintenant"

---

## 🔗 ÉTAPE 5 : Intégration au Routing

Vérifiez que les routes existent dans votre fichier de routing (généralement `App.tsx` ou `router.tsx`) :

```typescript
// Pages existantes - vérifier qu'elles sont présentes :
import Live from '@/pages/Live';
import AdminLiveEditor from '@/pages/AdminLiveEditor';

// Routes (exemple):
{
  path: '/live',
  element: <Live />
},
{
  path: '/admin/live',
  element: <AdminLiveEditor />
}
```

---

## 📊 ÉTAPE 6 : Test Complet

### Scénario de Test Admin

1. **Accédez à** `/admin/live` avec un compte admin
2. **Cliquez** sur "Nouveau Direct"
3. **Remplissez** le formulaire :
   - Titre : "Test Messe 1er Février"
   - Type : "TV (Messe en direct)"
   - URL : `https://www.youtube.com/watch?v=ABCD1234` (remplacer par un vrai ID)
   - Switch ON pour activer
4. **Cliquez** "Enregistrer"
5. Le direct doit apparaître dans la liste avec badge "● EN DIRECT"

### Scénario de Test Public (Utilisateur Connecté)

1. **Accédez à** `/live` avec un compte utilisateur connecté
2. Vous devez voir la **bannière rouge "EN DIRECT MAINTENANT"**
3. **Cliquez** sur "Regarder le Direct" ou "Écouter le Direct"
4. Un **modal s'ouvre** avec le lecteur
5. Pour TV : iframe YouTube doit afficher la vidéo
6. Pour Radio : lecteur audio doit être visible

### Scénario de Test Public (Non Connecté)

1. **Logout** ou accédez en incognito
2. Accédez à `/live`
3. Si un direct est actif :
   - Bannière visible
   - **Bouton "Regarder"/"Écouter" DÉSACTIVÉ**
   - Toast "Connexion requise" au clic

---

## 🛠️ Détails Techniques

### Table `live_streams`

```sql
CREATE TABLE live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  stream_url TEXT NOT NULL,
  stream_type TEXT CHECK (stream_type IN ('tv', 'radio')),
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Politiques RLS

| Opération | Qui         | Condition                 |
| --------- | ----------- | ------------------------- |
| SELECT    | Tous (auth) | ✓                         |
| INSERT    | Admins      | `profiles.role = 'admin'` |
| UPDATE    | Admins      | `profiles.role = 'admin'` |
| DELETE    | Admins      | `profiles.role = 'admin'` |

### Logique Métier

- **Un seul direct actif à la fois** : Quand vous activez un direct, les autres sont désactivés automatiquement
- **Extraction URL YouTube** : Supporte plusieurs formats (URL complète, ID seul, youtu.be, etc.)
- **Rechargement toutes les 30s** : La page `Live.tsx` rafraîchit automatiquement pour détecter les changements

---

## 🎯 Prochaines Étapes (Optionnel)

### Améliorations Futures

1. **Notifications push** quand un direct commence
2. **Calendrier** intégré pour programmer les directs
3. **Chat en direct** (existe partiellement dans le code)
4. **Enregistrement** des directs passés
5. **Statistiques** (nombre de spectateurs, durée, etc.)

### SEO & Performance

- La page `Live.tsx` est optimisée pour le responsive
- Les iframes YouTube/audio sont lazy-loaded
- Rafraîchissement modéré (30s) pour ne pas surcharger

---

## 📞 Support

Si vous rencontrez des problèmes :

1. **Table non créée** : Vérifiez que le SQL a bien été exécuté dans Supabase
2. **Erreur 403 RLS** : Assurez-vous que votre utilisateur est admin (colonne `role = 'admin'` dans table `profiles`)
3. **Lecteur YouTube ne marche pas** : Vérifiez que l'ID YouTube est valide
4. **Audio ne joue pas** : Vérifiez le format du flux (m3u8, mp3, etc.) et l'URL est accessible

---

## ✨ Résumé des Fichiers

| Fichier                                                | Type       | Action                 |
| ------------------------------------------------------ | ---------- | ---------------------- |
| `supabase/migrations/20260124_create_live_streams.sql` | SQL        | Exécuter dans Supabase |
| `src/lib/supabase/mediaQueries.ts`                     | TypeScript | Déjà modifié ✅        |
| `src/pages/AdminLiveEditor.tsx`                        | TSX        | Déjà modifié ✅        |
| `src/pages/Live.tsx`                                   | TSX        | Déjà modifié ✅        |

**Statut : 🟢 PRÊT POUR LE TEST - 01 FÉVRIER 2026**
