# Plan de Migration - Refonte Live Streaming

## Vue d'ensemble

Ce document détaille le plan de migration progressif et sans risque pour passer du système legacy au nouveau système de streaming multi-provider. La migration est conçue pour **zéro downtime** et **backward compatibility** totale.

---

## 📅 Phases de Déploiement

### Phase 1: Préparation (Sans Impact) - Jour 1-3

**Objectif**: Déployer la nouvelle architecture sans l'activer

#### Actions:

1. **Code Deployment**

   ```bash
   # Déployer tous les nouveaux fichiers dans la branche main
   - src/lib/providers/types.ts (NEW - types refactorisés)
   - src/lib/providers/StreamManager.ts (NEW - orchestrateur)
   - src/lib/providers/registry/ProviderRegistry.ts (NEW)
   - src/lib/providers/normalizers/*.ts (NEW - x5 normalizers)
   - src/lib/providers/legacy-compatibility.ts (NEW)
   - supabase/migrations/20260212_refactor_live_streams_add_stream_sources.sql
   ```

2. **Database Migration** (Backfill - Non destructive)

   ```sql
   -- Exécuter la migration Supabase
   -- Cela va:
   -- ✅ Ajouter colonnes stream_sources, playback_strategy, description
   -- ✅ Remplir stream_sources depuis stream_url existant (backward compat)
   -- ✅ Ajouter contraintes et indexes
   -- ⚠️ Ne pas supprimer ou modifier stream_url
   ```

3. **Testing Phase**
   - ✅ Test complet des types TypeScript (build time)
   - ✅ Vérifier que tous les imports existants restent fonctionnels
   - ✅ Tests unitaires normalizers (si applicable)
   - ✅ Vérifier zéro erreurs à la compilation

#### Vérification Santé:

```
Before and After Migration:
✅ Nombre de live_streams inchangé
✅ Tous les stream_url préservés
✅ Tous les providers correctement détectés
✅ stream_sources correctement populé
```

---

### Phase 2: Activation Progressive (Jour 4-10)

#### 2a. Admin Panel (AdminLiveEditor.tsx)

**Déploiement**: Remplacer le composant avec la nouvelle version

```bash
# Replace: src/pages/AdminLiveEditor.tsx
# Change:
#   - Import streamManager à la place de ProviderManager
#   - Utiliser streamManager.normalize() et validate()
#   - Rendu dynamique des champs via streamManager.getCapability()
#   - Restream par défaut au lieu de YouTube
```

**Test Checklist**:

```
Créer un nouveau direct:
[ ] TV + Restream + URL: crée stream_sources{url}
[ ] TV + Restream + Embed: crée stream_sources{embed}
[ ] TV + Restream + HLS: crée stream_sources{hls}
[ ] TV + YouTube: crée stream_sources{url} + avertissement
[ ] Radio + Radio Stream: crée stream_sources{audio}

Modifier un direct existant:
[ ] Les données sont pré-remplies correctement
[ ] stream_sources reste intact après modification
[ ] stream_url de fallback reste à jour

Validation:
[ ] Refuser URLs invalides pour provider
[ ] Afficher conseils clairs sur formats supportés
[ ] Non-bloquant: avertissements ≠ erreurs
```

#### 2b. VideoPlayer Component

**Déploiement**: Remplacer le composant avec la nouvelle version

```bash
# Replace: src/components/VideoPlayer.tsx
# Change:
#   - Import streamManager
#   - Support sources + provider au lieu de juste url
#   - Fallback automatique HLS via hls.js
#   - Gestion erreurs robuste
```

**Test Checklist**:

```
Compatibilité Legacy:
[ ] <VideoPlayer url="..." /> still works
[ ] <VideoPlayer url="..." provider="youtube" /> works
[ ] Tous les directs existants se lisent correctement

Nouveaux Formats:
[ ] <VideoPlayer sources={{embed: "..."}} provider="restream" />
[ ] <VideoPlayer sources={{hls: "..."}} provider="restream" />
[ ] <VideoPlayer sources={{audio: "..."}} provider="radio_stream" />

Playback:
[ ] iframe: Restream affiche correctement
[ ] HLS: Stream jouable sur desktop et mobile
[ ] Audio: Contrôles audio correct, autoplay fonctionne
[ ] Fallback: Si iframe échoue, HLS se lance

Mobile Spécifique:
[ ] iPhone/iPad: HLS marche, pas de lag
[ ] Android Chrome: HLS avec hls.js, ok
[ ] Desktop Safari: HLS natif, ok
```

#### 2c. Backfill des anciens directs

**Optionnel mais recommandé** (après 2 semaines):

```python
# Script de migration (une fois)
for stream in live_streams:
    if stream.stream_sources is None:
        # Parsage intelligent du stream_url legacy
        detected_sources = detect_format(stream.stream_url)
        stream.stream_sources = detected_sources
        stream.provider = detect_provider(stream.stream_url, stream.stream_type)
        stream.save()
```

---

### Phase 3: Production Hardening (Jour 10+)

#### 3a. Monitoring & Logs

Ajouter logging structured:

```typescript
// Dans AdminLiveEditor.tsx
console.log('[AdminLiveEditor] Saved stream', {
  streamId: stream.id,
  provider: stream.provider,
  sources: stream.stream_sources,
  fallbackUrl: stream.stream_url,
});

// Dans VideoPlayer.tsx
console.log('[VideoPlayer] Playback', {
  provider: provider,
  playbackType: playback.type,
  hasEmbedd ad: !!sources.embed,
  hasHLS: !!sources.hls,
});
```

#### 3b. Error Tracking

Intégrer Sentry ou équivalent:

```typescript
onError={(error) => {
  captureException(error, {
    tags: {
      stream_id: streamId,
      provider: provider,
      playbackType: playback?.type,
    },
  });
}}
```

#### 3c. User Feedback

Admin guide affiché dans UI:

```
"ℹ️ Restream est le lecteur principal.
YouTube/Facebook sont des destinations
de diffusion uniquement. Pour la meilleure
expérience mobile, utilisez HLS."
```

---

## ⛔ Rollback Plan

**Si problèmes critiques:**

### Option 1: Revert Code

```bash
git revert <commit-refactor>
# Redéployer l'ancienne version
# VideoPlayer et AdminLiveEditor revertent au code old
# stream_sources ignorés, stream_url utilisé à la place
```

### Option 2: Feature Flag (Recommandé)

```typescript
// Dans un fichier config
const USE_NEW_STREAM_MANAGER = process.env.VITE_NEW_STREAMS === 'true';

// Dans AdminLiveEditor/VideoPlayer
if (USE_NEW_STREAM_MANAGER) {
  // Utiliser new StreamManager
  return <NewAdminLiveEditor />;
} else {
  // Fallback au old ProviderManager
  return <LegacyAdminLiveEditor />;
}

// Contrôler via env var dans déploiement Vercel
```

---

## 📋 Checklist Déploiement Production

### Pré-déploiement (24h avant)

- [ ] Backup complet de la DB Supabase
- [ ] Snapshot media/vidéos
- [ ] Notification à l'équipe admin
- [ ] Derniers tests sur staging

### Déploiement (pendant maintenance)

1. **Étape 1 - Code + Migration (0h)**
   - [ ] Déployer code refactorisé sur `main`
   - [ ] Exécuter migration DB (Supabase)
   - [ ] Vérifier zéro erreurs dans logs

2. **Étape 2 - Activation (0h30)**
   - [ ] AdminLiveEditor.tsx en production
   - [ ] VideoPlayer.tsx en production
   - [ ] Monitorer metrics

3. **Étape 3 - Validation (1h - 4h)**
   - [ ] Admin: Créer un test direct TV
   - [ ] Admin: Créer un test direct Radio
   - [ ] Public: Regarder directs depuis page d'accueil
   - [ ] Mobile: Tester sur iPhone et Android
   - [ ] Logs: Zéro erreurs critiques

### Post-déploiement (24h after)

- [ ] Monitorer usage patterns
- [ ] Check user feedback
- [ ] Valider performance (no regressions)
- [ ] Documenter any surprises

---

## 🔍 Vérifications Clé

### Backward Compatibility

```typescript
// Ancien code doit continuer à fonctionner:

// ✅ Imports legacy
import { extractYoutubeId } from '@/lib/providers';

// ✅ Old VideoPlayer props
<VideoPlayer url="https://..." provider="youtube" />

// ✅ Old database queries
const stream = await fetchActiveLiveStream();
// stream.stream_url toujours disponible
// stream.stream_sources maintenant aussi disponible
```

### Forward Compatibility

```typescript
// Nouveau code fonctionne:

// ✅ New streamManager
const normalized = streamManager.normalize('restream', {...});

// ✅ New VideoPlayer props
<VideoPlayer
  sources={{embed: "..."}}
  provider="restream"
/>

// ✅ New database schema
const stream = {
  stream_url: '...',      // Legacy (still required)
  stream_sources: {...},   // New (has priority)
  provider: 'restream',
  ...
};
```

---

## 📊 Metrics to Track

### Admin Panel

- [ ] Time to create new stream (before vs after)
- [ ] Number of validation errors (should decrease)
- [ ] Provider selection distribution (expect more Restream)

### Playback

- [ ] Video load time
- [ ] Playback errors per provider
- [ ] Mobile vs Desktop success rate
- [ ] HLS fallback triggering frequency

### Database

- [ ] stream_sources population ratio
- [ ] Query performance (stream_sources index)
- [ ] Storage growth (JSONB overhead minimal)

---

## 🎯 Success Criteria

**Migration is successful when:**

1. ✅ Zéro downtime pendant déploiement
2. ✅ Tous les directs existants lisibles immédiatement après
3. ✅ Admin peut créer directs sans erreurs
4. ✅ Videos jouent sur desktop et mobile
5. ✅ Zéro breaking changes pour utilisateurs finaux
6. ✅ Logs montrent zéro erreurs critiques 24h après

---

## 📖 Documentation Post-Déploiement

Une fois live, mettre à jour:

- [ ] [ADMIN_LIVE_STREAM_GUIDE.md](./docs/ADMIN_LIVE_STREAM_GUIDE.md) - nouveau UI
- [ ] [STREAMING_API_REFERENCE.md](./docs/STREAMING_API_REFERENCE.md) - nouvelle API
- [ ] Discord/Slack: annonce à l'équipe IT
- [ ] Formulaire feedback: https://forms.gle/xyz...

---

## 🛠️ Outils & Scripts

### Verificação Post-Migration:

```bash
# Scripts à exécuter (dans scripts/ folder)
./verify-migration.sh          # Vérifier DB state
./test-all-providers.sh        # Test tous les providers
./check-video-playback.sh      # Vérifier playback
```

### Rollback Script:

```bash
./rollback.sh                  # Reverter si needed
```

---

## 📞 Support & Questions

Pendant et après la migration:

- **Tech Lead**: [Nom]
- **On-call Slack**: #streaming-migration
- **Supabase Console**: https://app.supabase.io
- **Vercel Deployment**: https://vercel.com/...

---

**Date Cible**: 2026-02-20  
**Status**: 🟡 Planning Phase  
**Risk Level**: 🟢 Low (backward compatible, gradual rollout)
