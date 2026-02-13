# 🎬 Refonte Complète - Architecture Live Streaming Faith-Flix

## 📋 Résumé Exécutif

Cette refonte transforme le module Live Streaming de Faith-Flix en un système professionnel, scalable et maintenable. Les problèmes actuels (`stream_url: string`, logic de provider dispersée, UI non flexible) sont remplacés par une architecture multi-provider robuste et extensible.

---

## 1️⃣ PROBLÈMES IDENTIFIÉS (Avant)

### 1.1 Modèle de données limité

```typescript
// ❌ AVANT : Trop simple, peu extensible
stream_url: string // "https://youtube.com/..." ou embed HTML ou HLS—tout mélangé
```

**Conséquences :**

- Impossible de stocker plusieurs sources pour un même stream (fallback)
- Pas de distinction claire entre format
- Parsage complexe et fragile

### 1.2 Logique provider dispersée

- ProviderManager mélange normalization, validation et rendering
- Pas de registry centralisée des providers
- Chaque provider ne déclare pas ses capacités

### 1.3 UI rigide

- Champs affichés statiquement selon provider
- Validation bloquante sans indication de ce qui manque
- Pas de feedback clair sur les formats supportés

### 1.4 Priorité stratégique ignorée

- YouTube reste le "player principal" par défaut
- Restream proposé mais pas formellement hiérarchisé
- Pas de vraie stratégie de fallback

---

## 2️⃣ NOUVELLE ARCHITECTURE (Après)

### 2.1 Modèle de données extensible

#### Base de données (JSONB `stream_sources`)

```sql
-- Table : live_streams
live_streams (
  id: UUID,
  title: TEXT,

  -- Legacy (backward compatibility)
  stream_url: TEXT,

  -- NEW: Extensible storage (JSONB)
  stream_sources: JSONB = {
    url?: string,           -- Direct URL (fallback general)
    embed?: string,         -- HTML iframe (embed Restream/YouTube)
    hls?: string,           -- HLS manifest (.m3u8)
    audio?: string          -- Audio stream (radio)
  },

  stream_type: 'tv' | 'radio',
  provider: ProviderName,   -- youtube | restream | app.restream | api_video | radio_stream

  -- Metadata for playback strategy
  playback_strategy?: 'primary' | 'fallback',  -- (optional, for admin hint)

  is_active: BOOLEAN,
  scheduled_at: TIMESTAMPTZ,
  replay_created: BOOLEAN,

  created_at: TIMESTAMPTZ,
  updated_at: TIMESTAMPTZ
)

-- Live Stats (unchanged, for viewer tracking)
live_stats (
  live_id: UUID (FK),
  viewers_count: INT,
  peak_viewers: INT,
  ...
)
```

### 2.2 Architecture Provider (Système de plugins)

#### `src/lib/providers/types.ts`

```typescript
// Déclaration standardisée de chaque provider

type StreamInputFormat = 'url' | 'embed' | 'hls' | 'audio'
type PlaybackType = 'iframe' | 'hls' | 'audio'

interface StreamSources {
  url?: string // Direct/fallback URL
  embed?: string // HTML iframe
  hls?: string // HLS manifest
  audio?: string // Audio stream
}

interface NormalizedStream {
  id?: string
  title?: string
  provider: ProviderType
  stream_type?: 'tv' | 'radio'
  sources: StreamSources // Normalized input data
  metadata?: {
    autoplay?: boolean
    poster?: string
  }
}

interface Playback {
  type: PlaybackType
  src: string
  fallbacks?: Playback[] // Secondary options
}

interface ProviderCapability {
  id: ProviderType
  label: string
  description: string

  // What formats can this provider accept?
  inputFormats: StreamInputFormat[]

  // What playback formats can this provider produce?
  playbackFormats: PlaybackType[]

  // Is this suitable as PRIMARY playback source?
  isPrimaryPlayback: boolean

  // Is this suitable as BROADCAST DESTINATION only?
  isBroadcastOnly?: boolean

  // Example of usage
  example?: string
}
```

#### `src/lib/providers/registry/ProviderRegistry.ts`

```typescript
// Centralized registry: Each provider declares what it can do

export const PROVIDER_REGISTRY: Record<ProviderType, ProviderCapability> = {
  restream: {
    id: 'restream',
    label: 'Restream (Préféré)',
    description: 'Principal player pour streaming - support iframe, HLS, et URL',
    isPrimaryPlayback: true,
    inputFormats: ['embed', 'hls', 'url'],
    playbackFormats: ['iframe', 'hls'],
    example: 'https://restream.io/live/my-stream ou <iframe src="..."></iframe>',
  },
  'app.restream': {
    id: 'app.restream',
    label: 'app.restream',
    description: 'Variante app.restream - comportement similaire à Restream',
    isPrimaryPlayback: true,
    inputFormats: ['embed', 'hls', 'url'],
    playbackFormats: ['iframe', 'hls'],
    example: 'https://app.restream.io/...',
  },
  youtube: {
    id: 'youtube',
    label: 'YouTube',
    description: 'Destination de diffusion + player fallback',
    isPrimaryPlayback: false, // ⚠️ Pas recommandé comme principal
    isBroadcastOnly: true, // Destiné à la diffusion vers YouTube
    inputFormats: ['url', 'embed'],
    playbackFormats: ['iframe'],
    example: 'https://www.youtube.com/watch?v=VIDEO_ID',
  },
  api_video: {
    id: 'api_video',
    label: 'API.Video',
    description: 'Lecteur API.Video - embed sécurisé pour vidéos à la demande',
    isPrimaryPlayback: true,
    inputFormats: ['url', 'embed'],
    playbackFormats: ['iframe'],
    example: 'https://embed.api.video/abc123xyz',
  },
  radio_stream: {
    id: 'radio_stream',
    label: 'Flux Radio',
    description: 'Lecteur audio pour streaming radio paroissial',
    isPrimaryPlayback: true,
    inputFormats: ['audio', 'url'],
    playbackFormats: ['audio'],
    example: 'https://radio.example.com/live.mp3 or https://.../live.m3u8',
  },
}
```

#### `src/lib/providers/normalizers/ReestreamNormalizer.ts`

```typescript
// Chaque provider a son propre normalisateur

export class ReestreamNormalizer implements StreamNormalizer {
  validate(sources: StreamSources): boolean {
    // Restream accepte: embed iframe OU hls OU url
    return !!(this.isIframe(sources.embed) || this.isHls(sources.hls) || sources.url)
  }

  normalize(
    raw: Partial<StreamSources & { stream_url?: string; embed_html?: string }>,
  ): StreamSources {
    const embed =
      raw.embed_html ?? raw.embed ?? (this.isIframe(raw.stream_url) ? raw.stream_url : undefined)
    const hls = raw.hls_url ?? raw.hls ?? (this.isHls(raw.stream_url) ? raw.stream_url : undefined)
    const url = raw.stream_url && !embed && !hls ? raw.stream_url : undefined

    return { embed, hls, url }
  }

  getPlayback(sources: StreamSources): Playback | null {
    // Priorité: iframe > hls > url
    if (sources.embed && this.isIframe(sources.embed)) {
      return { type: 'iframe', src: sources.embed }
    }
    if (sources.hls) {
      return { type: 'hls', src: sources.hls }
    }
    if (sources.url) {
      return { type: 'iframe', src: sources.url }
    }
    return null
  }

  private isIframe(text?: string): boolean {
    return !!(text && text.trim().startsWith('<iframe'))
  }

  private isHls(url?: string): boolean {
    return !!(url && url.toLowerCase().includes('.m3u8'))
  }
}
```

### 2.3 Gestionnaire de Provider unifié

#### `src/lib/providers/StreamNormalizer.ts`

```typescript
// Point d'entrée unique pour ALL provider operations

export class StreamManager {
  private normalizers: Map<ProviderType, StreamNormalizer>

  constructor() {
    this.normalizers = new Map([
      ['restream', new ReestreamNormalizer()],
      ['app.restream', new ReestreamNormalizer()], // Same logic
      ['youtube', new YoutubeNormalizer()],
      ['api_video', new ApiVideoNormalizer()],
      ['radio_stream', new RadioStreamNormalizer()],
    ])
  }

  /** Normalize raw input to standard StreamSources */
  normalize(provider: ProviderType, raw: Partial<StreamSources & LegacyFields>): NormalizedStream {
    const normalizer = this.normalizers.get(provider)
    if (!normalizer) throw new Error(`Unknown provider: ${provider}`)

    const sources = normalizer.normalize(raw)
    return { provider, sources }
  }

  /** Validate that StreamSources are appropriate for provider */
  validate(provider: ProviderType, sources: StreamSources): boolean {
    const normalizer = this.normalizers.get(provider)
    return normalizer?.validate(sources) ?? false
  }

  /** Get playback strategy (priority: iframe > hls > audio > url) */
  getPlayback(provider: ProviderType, sources: StreamSources): Playback | null {
    const normalizer = this.normalizers.get(provider)
    return normalizer?.getPlayback(sources) ?? null
  }

  /** Get provider metadata/capabilities */
  getCapability(provider: ProviderType): ProviderCapability {
    return PROVIDER_REGISTRY[provider]
  }

  /** Get all available providers */
  getAllProviders(): ProviderCapability[] {
    return Object.values(PROVIDER_REGISTRY)
  }

  /** Get providers suitable for primary playback */
  getPrimaryPlaybackProviders(): ProviderCapability[] {
    return this.getAllProviders().filter((p) => p.isPrimaryPlayback)
  }
}

export const streamManager = new StreamManager()
```

### 2.4 Lecteur Vidéo Universel

#### `src/components/VideoPlayer.tsx`

```typescript
// Utilise le StreamManager pour playback unifié

type Props = {
  url?: string;                // Backward compatibility: direct URL
  sources?: StreamSources;     // New: structured sources
  provider?: ProviderType;
  streamType?: 'tv' | 'radio';
  title?: string;
  autoplay?: boolean;
  poster?: string;
};

export default function VideoPlayer({
  url,
  sources,
  provider = 'restream',
  streamType = 'tv',
  title,
  autoplay = false,
  poster,
}: Props) {
  // Support both legacy (url) and new (sources) props
  const actualSources = sources ?? (url ? { url } : {});

  const normalized = useMemo(
    () => streamManager.normalize(provider, actualSources),
    [provider, actualSources]
  );

  const playback = useMemo(
    () => streamManager.getPlayback(provider, normalized.sources),
    [provider, normalized]
  );

  if (!playback) {
    return <NoSourcesAvailable provider={provider} title={title} />;
  }

  // Render appropriate player
  if (playback.type === 'iframe') {
    return <IframePlayer src={playback.src} title={title} />;
  }

  if (playback.type === 'hls') {
    return <HlsPlayer src={playback.src} title={title} poster={poster} autoplay={autoplay} />;
  }

  if (playback.type === 'audio') {
    return <AudioPlayer src={playback.src} title={title} autoplay={autoplay} />;
  }

  return <UnsupportedFormat />;
}
```

---

## 3️⃣ SCHÉMA BASE DE DONNÉES (Nouveau)

### 3.1 Ajouts à `live_streams`

```sql
-- Migration: Add stream_sources JSONB + playback hints
ALTER TABLE public.live_streams ADD COLUMN stream_sources JSONB DEFAULT NULL;
ALTER TABLE public.live_streams ADD COLUMN playback_strategy TEXT CHECK (playback_strategy IN ('primary', 'fallback'));

-- Retroactively populate stream_sources from legacy stream_url
UPDATE public.live_streams SET stream_sources = jsonb_build_object('url', stream_url) WHERE stream_sources IS NULL;
```

### 3.2 Structure Complète

```sql
CREATE TABLE live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  title TEXT NOT NULL,
  description TEXT,

  -- Playback data (NEW)
  stream_sources JSONB DEFAULT NULL,  -- { url?, embed?, hls?, audio? }

  -- Legacy (backward compat)
  stream_url TEXT NOT NULL,           -- Fallback, keep for migrations

  -- Provider & type
  stream_type TEXT NOT NULL CHECK (stream_type IN ('tv', 'radio')),
  provider TEXT NOT NULL CHECK (provider IN (
    'youtube', 'restream', 'app.restream', 'api_video', 'radio_stream'
  )),

  -- Metadata
  playback_strategy TEXT CHECK (playback_strategy IN ('primary', 'fallback')),

  -- Activation
  is_active BOOLEAN DEFAULT false,
  scheduled_at TIMESTAMPTZ,

  -- Replay
  replay_created BOOLEAN DEFAULT false,
  replay_video_id UUID,  -- FK to media.id (optional)

  -- Tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_stream_sources CHECK (
    stream_sources IS NULL OR (
      stream_sources ? 'url' OR
      stream_sources ? 'embed' OR
      stream_sources ? 'hls' OR
      stream_sources ? 'audio'
    )
  )
);

-- Indexes
CREATE INDEX idx_live_streams_is_active ON live_streams(is_active DESC, updated_at DESC);
CREATE INDEX idx_live_streams_provider ON live_streams(provider);
CREATE INDEX idx_live_streams_stream_type ON live_streams(stream_type);
```

---

## 4️⃣ STRATÉGIE DE FALLBACK & PLAYBACK

### 4.1 Hiérarchie de sources (Par playback)

```
┌─────────────────────────────────────┐
│   Restream/app.restream PRIMARY     │
├─────────────────────────────────────┤
│ 1. embed (iframe Restream)          │ ← Meilleure UX
│ 2. hls (.m3u8 Restream)             │ ← Fallback HLS
│ 3. url (fallback général)           │ ← Last resort
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│   YouTube BROADCAST DESTINATION     │
├─────────────────────────────────────┤
│ 1. embed (YouTube Player)           │ ← Uniquement si pas Restream
│ 2. url (YouTube video ID)           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│   API.Video                         │
├─────────────────────────────────────┤
│ 1. url (embed URL)                  │
│ 2. embed (iframe)                   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│   Radio Stream                      │
├─────────────────────────────────────┤
│ 1. audio (audio stream URL)         │ ← MP3/AAC/OGG
│ 2. hls (.m3u8 radio stream)         │ ← Fallback HLS
│ 3. url (direct URL)                 │
└─────────────────────────────────────┘
```

### 4.2 Exemple : Restream avec fallback auto

```typescript
// Les données en DB :
stream_sources: {
  embed: '<iframe src="https://restream.io/player/live/KEY"></iframe>',
  hls: 'https://live.restream.io/live/KEY/index.m3u8',
  url: 'https://fallback.example.com/stream'
}

// Playback proposé :
// 1. Desktop: iframe (Restream contrôles natifs)
// 2. Mobile: HLS (meilleure performa)
// 3. Fallback: URL brut
```

---

## 5️⃣ REFONTE AdminLiveEditor.tsx

### 5.1 Structure Composants

```
<AdminLiveEditor/>
├── <StreamList/>               -- Liste des streams actifs/inactifs
│   └── <StreamCard/>           -- Chaque stream avec actions
│       ├── [Edit] btn
│       ├── [Delete] btn
│       └── [Activate] btn
│
└── <StreamEditModal/>          -- Édition/création
    ├── <BasicInfo/>            -- Titre, type, provider
    ├── <ProviderDynamicFields/> -- Champs selon provider
    │   ├── ReestreamFields/
    │   ├── YoutubeFields/
    │   ├── RadioFields/
    │   └── ApiVideoFields/
    └── <ValidationSummary/>   -- Erreurs/warnings claires
```

### 5.2 Logique de champs dynamiques

```typescript
// AVANT ❌ : Statique, tous les champs affichés
fields = [
  { name: 'stream_url', label: 'URL', type: 'text' },
  { name: 'embed_html', label: 'Embed', type: 'textarea' },
  { name: 'hls_url', label: 'HLS', type: 'text' },
]

// APRÈS ✅ : Dynamique selon provider et stream_type
const getFieldsForProvider = (provider: ProviderType, streamType: 'tv' | 'radio') => {
  const capability = streamManager.getCapability(provider)

  return capability.inputFormats.map((format) => ({
    name: `field_${format}`,
    label: getFieldLabel(format, provider),
    type: format === 'embed' ? 'textarea' : 'text',
    required: isFormatRequired(provider, format),
    placeholder: getPlaceholder(provider, format),
    example: capability.example,
    hint: `Format accepté: ${format}`,
  }))
}
```

### 5.3 Validation procédé

```typescript
// Validation en 3 étapes:

// 1. Contraintes de type
if (streamType === 'tv' && provider === 'radio_stream') {
  ❌ "Un flux TV doit avoir un provider vidéo"
}

// 2. Validation provider (normalizer)
const normalized = streamManager.normalize(provider, formData);
if (!streamManager.validate(provider, normalized.sources)) {
  ❌ "Les données fournies ne correspondent pas au format ${provider}"
  → Conseil : "Restream accepte: iframe, HLS, ou URL"
}

// 3. Avertissements (non-bloquants)
if (provider === 'youtube' && !isPrimaryPlayback) {
  ⚠️ "YouTube n'est pas recommandé comme lecteur principal.
      Préférez Restream pour une meilleure fiabilité."
}

// Save si tout OK
await upsertLiveStream({ ...formData, stream_sources: normalized.sources });
```

---

## 6️⃣ REFONTE VideoPlayer.tsx

### 6.1 Nouvelle Props Interface

```typescript
type Props = {
  // Legacy (backward compat)
  url?: string

  // New API
  sources?: StreamSources
  provider?: ProviderType

  // Common
  title?: string
  streamType?: 'tv' | 'radio'
  autoplay?: boolean
  poster?: string
  onError?: (error: Error) => void
  onPlayerReady?: () => void
}
```

### 6.2 Composants Spécialisés

```typescript
// Responsabilité unique pour chaque type de lecteur

<IframePlayer/>          -- Embed iframe (Restream, YouTube, API.Video)
<HlsPlayer/>             -- <video> + hls.js auto-attach
<AudioPlayer/>           -- <audio> controls
<NoSourcesAvailable/>    -- Aucune source ne peut être lue
<ProviderUnavailable/>   -- Provider non reconnu
```

### 6.3 Gestion des erreurs robuste

```typescript
// Fallback automatique si possible
if (playback.type === 'iframe' && iframeLoadFailed) {
  // Essayer HLS si disponible
  const fallback = streamManager.getAllFallbacks(provider, sources)[0];
  if (fallback) {
    setPlayback(fallback);  // Passer au HLS
    return;
  }
}

// Sinon: afficher erreur claire avec conseil
<ErrorState
  originalError={error}
  provider={provider}
  advice="Vérifiez que le flux Restream est actif et que l'URL est correcte"
/>
```

---

## 7️⃣ PLAN DE MIGRATION (Non-breaking)

### 7.1 Phase 1 : Préparation (Prod-safe)

```typescript
// 1. Déployer nouvelle architecture en parallel
- Créer StreamManager + Normalizers (nouveau code inactif)
- Créer nouvelle migration DB (add stream_sources nullable)
- Garder AdminLiveEditor.tsx avec nouvelle logique MAIS compatible legacy

// 2. Test complet
- Tous les streams existants doivent être lisibles
- stream_url legacy doit être respecté
- Aucune perte de données
```

### 7.2 Phase 2 : Activation progressive

```typescript
// 1. AdminLiveEditor.tsx
- Utiliser streamManager pour normalization
- Écrire BOTH stream_url (legacy) ET stream_sources (new)
- Backward compatibility par défaut

// 2. VideoPlayer.tsx
- Accepter both legacy (url) et new (sources)
- Préférer stream_sources si présent
- Fallback à stream_url si nécessaire

// 3. Données existantes
UPDATE live_streams
SET stream_sources = jsonb_build_object('url', stream_url)
WHERE stream_sources IS NULL;
```

### 7.3 Phase 3 : Optimisations (Après 2-4 semaines)

```typescript
// 1. Retirer support legacy stream_url (optionnel)
// 2. Optimiser HLS caching
// 3. Ajouter préférences playback par utilisateur
```

### 7.4 Checklist Déploiement

```
[ ] Backup DB avant migration
[ ] Test AdminLiveEditor sur tous les providers
[ ] Test VideoPlayer (desktop, mobile, tous providers)
[ ] Vérifier YouTube fallback → Restream
[ ] Vérifier HLS fallback sur mobile
[ ] Test radio streams (audio playback)
[ ] Vérifier live chat remains functional
[ ] Monitoring errors en prod (24h min)
[ ] Ajouter logs pour stream_sources population
```

---

## 8️⃣ FICHIERS À CRÉER/MODIFIER

### Nouveaux fichiers:

```
src/lib/providers/
├── types.ts                                    (NEW)
├── StreamManager.ts                            (NEW)
├── registry/
│   └── ProviderRegistry.ts                     (NEW)
└── normalizers/
    ├── StreamNormalizer.ts                     (interface)
    ├── ReestreamNormalizer.ts                  (NEW)
    ├── YoutubeNormalizer.ts                    (NEW)
    ├── ApiVideoNormalizer.ts                   (NEW)
    └── RadioStreamNormalizer.ts                (NEW)

src/components/video-player/
├── VideoPlayer.tsx                             (REFACTOR)
├── IframePlayer.tsx                            (NEW)
├── HlsPlayer.tsx                               (NEW)
├── AudioPlayer.tsx                             (NEW)
├── ErrorState.tsx                              (NEW)
└── players/HlsAutoAttach.tsx                   (MOVE from providers)

supabase/migrations/
└── 20260212_refactor_live_streams.sql          (NEW)
```

### Fichiers modifiés:

```
src/pages/AdminLiveEditor.tsx                   (REFACTOR)
src/lib/supabase/mediaQueries.ts               (UPDATE types)
src/types/database.ts                           (UPDATE types)
```

---

## 9️⃣ RÉSUMÉ DES BÉNÉFICES

| Aspect             | Avant                          | Après                                 |
| ------------------ | ------------------------------ | ------------------------------------- |
| **Modèle données** | `stream_url: string` (fragile) | `stream_sources: JSONB` (extensible)  |
| **Provider logic** | Dispersée dans ProviderManager | Centralisée, registry + normalizers   |
| **UI fields**      | Statiques, toujours affichés   | Dynamiques selon capabilities         |
| **Validation**     | Bloquante, peu claire          | Étapes, avec conseils                 |
| **Playback**       | Dur-codé par provider          | Flexible, avec fallbacks              |
| **Restream**       | Égal avec YouTube              | Prioritaire comme player principal    |
| **Mobile**         | HLS problématique              | HLS robuste avec fallbacks            |
| **Scalabilité**    | Ajout provider = N fichiers    | Ajout provider = 1 normalizer minimal |
| **Maintenance**    | Difficile, logique dispersée   | Facile, responsabilité unique         |

---

## 🔟 PHASES DE DÉPLOIEMENT

```
SEMAINE 1:
├─ Jour 1-2: Architecture + Normalizers
├─ Jour 3-4: DB migration + AdminLiveEditor refactor
├─ Jour 5: VideoPlayer refactor + tests complets
└─ Jour 6: Déploiement staging

SEMAINE 2:
├─ Jour 1-2: Tests production des streams existants
├─ Jour 3: Déploiement progressif (10% traffic)
├─ Jour 4-5: Monitoring, refinement
└─ Jour 6: Full rollout + cleanup legacy code (optionnel)

SEMAINE 3:
├─ Documentation finalisée
├─ Training admin panel
└─ Optimisations post-launch
```

---

## 📚 DOCUMENTATION COMPLÉMENTAIRE

- [ADMIN_LIVE_STREAM_GUIDE.md](./docs/ADMIN_LIVE_STREAM_GUIDE.md) — Guide admin (mis à jour)
- [API_REFERENCE.md](./docs/STREAMING_API_REFERENCE.md) — À créer
- [PROVIDER_IMPLEMENTATION.md](./docs/PROVIDER_IMPLEMENTATION.md) — À créer

---

**Auteur:** Senior Architect  
**Date:** 2026-02-12  
**Statut:** Design Phase ✅ → Implementation
