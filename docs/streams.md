## Objectif

Mettre en place une gestion **professionnelle** du streaming multi-plateformes avec:

- **Vraies clés RTMP** (stockées chiffrées) par live et par plateforme
- **Configuration avancée** (bitrate, ABR, CDN, latence)
- **Sessions** (historique “start/stop”)
- **Métriques** (table time-series, exploitable ensuite via Realtime / dashboards)
- **Intégration UI** dans l’admin et la sidebar

---

## Prérequis

- **Un projet Supabase** déjà relié à l’app
- Au moins un utilisateur “admin” dans `public.admin_users` (cf. migration `014_simplify_rls_with_admin_table.sql`)
- OBS Studio + (optionnel) plugins:
  - Multi-RTMP / multiple outputs (selon votre stack)
  - OBS WebSocket si vous souhaitez du contrôle distant

---

## Phase A — Migrations Supabase (à faire côté DB)

### 1) Ajouter l’infrastructure RTMP

Appliquez la migration:

- `supabase/migrations/20260504103400_add_rtmp_infrastructure.sql`

Elle crée:

- `public.rtmp_keys` (clés RTMP chiffrées, 1 par provider + live)
- `public.stream_configs` (bitrate, ABR variants, CDN urls…)
- `public.stream_metrics` (append-only metrics)
- `public.stream_sessions` (historique des sessions)

Et active RLS:

- `rtmp_keys`: **admin only** (basé sur `public.admin_users`)
- `stream_configs`: **admin only**
- `stream_metrics`: **SELECT public**, **INSERT admin**
- `stream_sessions`: **SELECT public**, **INSERT admin**

### 2) Vérifier que vous avez bien un admin

Dans Supabase SQL Editor:

```sql
select * from public.admin_users;
```

Si vide, ajoutez votre user id:

```sql
insert into public.admin_users (id)
values ('<VOTRE_AUTH_UID>')
on conflict (id) do nothing;
```

---

## Phase B — Configuration app (variables d’environnement)

### VITE_RTMP_MASTER_KEY (obligatoire pour l’UI de clés)

Cette implémentation chiffre/déchiffre côté navigateur via WebCrypto.

- **Attendu**: une clé **AES-256** de **32 bytes**, encodée en **base64**
- Variable: `VITE_RTMP_MASTER_KEY`

Exemple (PowerShell):

```powershell
# Génère 32 bytes aléatoires et les affiche en base64
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

Ajoutez la sortie dans `.env.local`:

```bash
VITE_RTMP_MASTER_KEY=...
```

### Important (sécurité)

Mettre une clé maître côté client **n’est pas une sécurité parfaite** (un admin avec accès au front peut théoriquement la retrouver).

Pour une prod “béton”, migrez le chiffrement/déchiffrement vers:

- une **Edge Function** (Supabase secrets) qui stocke / renvoie la clé (ou un masque),
ou
- Postgres `pgcrypto` avec des secrets côté serveur.

Cette étape “client-side crypto” est un compromis: **éviter le stockage plaintext** immédiatement.

---

## Phase C — Utilisation pas à pas (Admin)

### 1) Créer / activer un live

Aller sur:

- **Admin → Streaming** (`/admin/live`)

Créer un live puis activer le switch **Activer** sur un live (un seul live actif à la fois).

### 2) Ajouter les plateformes “liens fournisseurs” (optionnel mais recommandé)

Dans l’admin, vous avez déjà le composant de gestion des sources:

- Table `live_stream_sources` (providers + URL)

But: l’app sait quelles plateformes sont utilisées, et peut proposer la gestion de clés RTMP pour chacune.

### 3) Enregistrer les vraies clés RTMP

Dans la section **OBS Multi-Stream** (sur la page admin live):

- Onglet **Plateformes**
- Bloc **Clés RTMP (réelles)**
- Cliquez **Ajouter une clé** (par plateforme)
- Collez la clé RTMP (depuis YouTube/Twitch/Facebook/etc.)
- Optionnel: mettez une **expiration** (en jours)

Les clés sont stockées dans `public.rtmp_keys` chiffrées.

### 4) Exporter la config OBS

Dans l’onglet **Configuration**:

- Choisissez le format (JSON/XML/TXT)
- Cliquez **Exporter la configuration**

### 5) Démarrer/arrêter une session (historique)

Toujours dans **Configuration**:

- Bouton **Démarrer (session)** → crée une ligne dans `stream_sessions`
- Bouton **Arrêter (session)** → termine la session

### 6) Monitoring

Quand la session est en cours, un bloc “Monitoring” s’affiche.

Actuellement:

- Les métriques sont **simulées** côté UI et insérées en DB (toutes les 5s) pour valider le pipeline.

Pour du réel:

- brancher OBS WebSocket (stats encodeur), ou
- brancher votre infra ingest/CDN (Nginx-RTMP, SRS, Mux, Cloudflare Stream, etc.)
et pousser ces métriques dans `stream_metrics`.

---

## Phase D — Utilisation pas à pas (Sidebar)

La sidebar affiche un panneau **OBS Multi-Stream** quand elle n’est pas “collapsed”:

- Titre du live actif
- Bouton “Config OBS” (copie rapide)
- Aperçu des plateformes

---

## Où sont les fichiers côté code

- **Migration DB**: `supabase/migrations/20260504103400_add_rtmp_infrastructure.sql`
- **Chiffrement (WebCrypto)**: `src/lib/encryption/rtmpKeyEncryption.ts`
- **API Supabase RTMP**: `src/lib/supabase/rtmpQueries.ts`
- **Hook pro**: `src/hooks/useObsMultiStreamPro.ts`
- **UI clés**: `src/components/live/RtmpKeyManager.tsx`
- **UI monitoring**: `src/components/live/StreamMonitoringDashboard.tsx`
- **Panel pro**: `src/components/live/ObsMultiStreamConfig.tsx`
- **Sidebar**: `src/components/sidebar/SidebarObsPanel.tsx`

---

## Check-list de validation

- **DB**: tables `rtmp_keys`, `stream_configs`, `stream_metrics`, `stream_sessions` existent
- **RLS**: un admin voit `rtmp_keys`, un user normal ne voit pas
- **UI**: l’admin peut enregistrer une clé (dialog) sans erreur
- **Export**: le fichier exporté contient serveur + key (si clé enregistrée)
- **Sessions**: démarrer/arrêter écrit bien en DB
- **Metrics**: des lignes apparaissent dans `stream_metrics`

