# 🎯 Système de Liens Fournisseurs pour Live Streams

## Vue d'ensemble

Ce système permet de gérer des liens vers les fournisseurs (YouTube, Facebook, Instagram, TikTok, etc.) qui s'affichent sous le lecteur vidéo en direct. Les liens ne s'affichent que si un lien est fourni dans l'admin.

---

## 📦 Composants Créés

### 1. Type TypeScript : `LiveProviderSource`

**Fichier** : [src/types/database.ts](src/types/database.ts)

```typescript
export interface LiveProviderSource {
  id: string
  live_id: string
  provider: 'youtube' | 'facebook' | 'instagram' | 'tiktok' | 'custom'
  url: string
  created_at: string
}
```

**Propriétés** :

- `id` : Identifiant unique UUID
- `live_id` : Référence vers le live stream
- `provider` : Type de fournisseur (youtube, facebook, instagram, tiktok, custom)
- `url` : URL vers le fournisseur
- `created_at` : Timestamp de création

---

### 2. Table SQL : `live_stream_sources`

**Fichier** : [MIGRATION_LIVE_STREAM_SOURCES.sql](MIGRATION_LIVE_STREAM_SOURCES.sql)

```sql
CREATE TABLE live_stream_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('youtube', 'facebook', 'instagram', 'tiktok', 'custom')),
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Contraintes** :

- Clé étrangère sur `live_streams` avec suppression en cascade
- Index sur `live_id` pour performance
- Index composite `(live_id, provider)`
- RLS (Row Level Security) activé
- Lecture publique, écriture/suppression admin uniquement

---

### 3. Hook React : `useLiveProviderSources`

**Fichier** : [src/hooks/useLiveProviderSources.ts](src/hooks/useLiveProviderSources.ts)

**Fonction** : Récupère les sources d'un live stream

**Utilisation** :

```tsx
const { sources, loading, error } = useLiveProviderSources(liveStream.id)
```

**Retour** :

```typescript
{
  sources: LiveProviderSource[]     // Tableau des sources
  loading: boolean                   // État de chargement
  error: Error | null               // Erreur ou null
}
```

---

### 4. Composant React : `LiveProviderLinks`

**Fichier** : [src/components/live/LiveProviderLinks.tsx](src/components/live/LiveProviderLinks.tsx)

**Fonction** : Affiche les liens fournisseurs sous le lecteur vidéo

**Props** :

```typescript
interface LiveProviderLinksProps {
  sources: LiveProviderSource[]
}
```

**Comportement** :

- ✅ Filtre automatiquement les URLs vides
- ✅ Retourne `null` si aucune source valide (aucun affichage)
- ✅ Boutons avec icônes et couleurs par fournisseur
- ✅ Liens s'ouvrent dans un nouvel onglet
- ✅ Responsive et accessible

**Exemple d'UX** :

```
Regarder aussi sur :
[▶ YouTube] [▶ Facebook] [▶ Instagram] [▶ TikTok]
```

---

### 5. Queries Supabase

**Fichier** : [src/lib/supabase/mediaQueries.ts](src/lib/supabase/mediaQueries.ts)

#### `fetchLiveProviderSources(liveId: string)`

Récupère tous les liens pour un live stream

```typescript
const sources = await fetchLiveProviderSources(liveStream.id)
// Retourne : LiveProviderSource[]
```

#### `addLiveProviderSource(liveId, provider, url)`

Ajoute une source

```typescript
const newSource = await addLiveProviderSource(
  'live-id-123',
  'youtube',
  'https://youtube.com/watch?v=...',
)
```

#### `updateLiveProviderSource(sourceId, provider, url)`

Met à jour une source

```typescript
const updated = await updateLiveProviderSource(
  'source-id-123',
  'facebook',
  'https://facebook.com/...',
)
```

#### `deleteLiveProviderSource(sourceId)`

Supprime une source

```typescript
await deleteLiveProviderSource('source-id-123')
```

---

### 6. Intégration dans Live.tsx

**Fichier** : [src/pages/Live.tsx](src/pages/Live.tsx)

**Imports** :

```tsx
import useLiveProviderSources from '@/hooks/useLiveProviderSources'
import LiveProviderLinks from '@/components/live/LiveProviderLinks'
```

**Utilisation dans le composant** :

```tsx
// Récupérer les sources
const { sources: providerSources } = useLiveProviderSources(liveStream?.id)

// Afficher dans le lecteur modal
;<LiveProviderLinks sources={providerSources} />
```

---

## 🚀 Mise en place

### Étape 1 : Exécuter la migration SQL

1. Aller sur [Supabase Dashboard](https://app.supabase.com)
2. Ouvrir l'éditeur SQL
3. Copier le contenu du fichier [MIGRATION_LIVE_STREAM_SOURCES.sql](MIGRATION_LIVE_STREAM_SOURCES.sql)
4. Exécuter la migration

### Étape 2 : Les fichiers sont déjà créés ✅

- ✅ Type TypeScript ajouté à [src/types/database.ts](src/types/database.ts)
- ✅ Queries ajoutées à [src/lib/supabase/mediaQueries.ts](src/lib/supabase/mediaQueries.ts)
- ✅ Hook créé : [src/hooks/useLiveProviderSources.ts](src/hooks/useLiveProviderSources.ts)
- ✅ Composant créé : [src/components/live/LiveProviderLinks.tsx](src/components/live/LiveProviderLinks.tsx)
- ✅ Intégration faite dans [src/pages/Live.tsx](src/pages/Live.tsx)

### Étape 3 : Ajouter les sources dans l'admin (voir sections ci-dessous)

---

## 🧹 Règles Importantes

✅ **Affichage** :

- Les liens ne s'affichent QUE si des sources existent
- Aucun placeholder, aucun titre vide, aucun espace gaspillé

✅ **Filtrage** :

- Les URLs vides sont automatiquement filtrées
- Si aucune URL valide → `return null` (0 affichage)

✅ **Performance** :

- Chargement optimisé avec index Supabase
- Hook avec gestion loading/error
- Composant léger et performant

---

## 🔐 Sécurité

✅ **RLS (Row Level Security)** :

- **Lecture** : Publique (tous peuvent voir)
- **Écriture** : Admin uniquement
- **Suppression** : Admin uniquement

✅ **Validation** :

- Contrainte CHECK sur le `provider`
- Référence FK sur `live_streams` avec suppression en cascade

---

## 📱 Exemple Complet d'Admin

Voir [LIVE_PROVIDER_ADMIN_EXAMPLE.tsx](#) pour un exemple complet de formulaire admin.

---

## 🎨 Styles et Personnalisation

Le composant utilise Tailwind CSS et Lucide React pour les icônes.

**Couleurs par fournisseur** :

- YouTube : rouge (#EF4444)
- Facebook : bleu (#1E40AF)
- Instagram : rose (#EC4899)
- TikTok : noir/blanc
- Custom : primary

**Modifier les couleurs** : Éditez la fonction `getProviderColor()` dans [src/components/live/LiveProviderLinks.tsx](src/components/live/LiveProviderLinks.tsx)

---

## 🧪 Tests

### Test 1 : Aucune source

```tsx
<LiveProviderLinks sources={[]} />
// Résultat : null (aucun affichage)
```

### Test 2 : Une source valide

```tsx
<LiveProviderLinks
  sources={[
    {
      id: '123',
      live_id: 'live-123',
      provider: 'youtube',
      url: 'https://youtube.com/...',
      created_at: '2024-01-01T00:00:00Z',
    },
  ]}
/>
// Résultat : Affiche le bouton YouTube
```

### Test 3 : Plusieurs sources

```tsx
<LiveProviderLinks
  sources={[
    { provider: 'youtube', url: '...' },
    { provider: 'facebook', url: '...' },
    { provider: 'instagram', url: '...' },
  ]}
/>
// Résultat : Affiche 3 boutons
```

### Test 4 : URLs vides filtrées

```tsx
<LiveProviderLinks
  sources={[
    { provider: 'youtube', url: 'https://youtube.com/...' },
    { provider: 'facebook', url: null }, // Filtré
    { provider: 'instagram', url: '' }, // Filtré
  ]}
/>
// Résultat : Affiche seulement le bouton YouTube
```

---

## 💻 Exemple d'utilisation en Admin

```tsx
import {
  addLiveProviderSource,
  updateLiveProviderSource,
  deleteLiveProviderSource,
} from '@/lib/supabase/mediaQueries'

// Ajouter une source
const newSource = await addLiveProviderSource(
  'live-stream-id',
  'youtube',
  'https://youtube.com/watch?v=...',
)

// Mettre à jour
const updated = await updateLiveProviderSource('source-id', 'facebook', 'https://facebook.com/...')

// Supprimer
await deleteLiveProviderSource('source-id')
```

---

## ❓ FAQ

**Q: Si je supprime le live stream, que se passe-t-il avec les sources ?**
R: Elles sont automatiquement supprimées (ON DELETE CASCADE)

**Q: Peut-on ajouter d'autres fournisseurs ?**
R: Oui ! Ajouter le provider à la contrainte CHECK et au type TypeScript

**Q: Comment afficher les sources ailleurs que sous le player ?**
R: Import du hook et du composant n'importe où :

```tsx
import useLiveProviderSources from '@/hooks/useLiveProviderSources'
import LiveProviderLinks from '@/components/live/LiveProviderLinks'

const MyComponent = ({ liveId }) => {
  const { sources } = useLiveProviderSources(liveId)
  return <LiveProviderLinks sources={sources} />
}
```

**Q: Quel format d'URL est accepté ?**
R: N'importe quel URL valide (https://youtube.com/..., https://facebook.com/..., etc.)

---

## 📞 Support

En cas de problème :

1. Vérifier la migration SQL est exécutée
2. Vérifier les permissions RLS Supabase
3. Vérifier en console que `useLiveProviderSources` récupère bien les données
4. Vérifier que le composant reçoit bien les sources en props

---

**Créé le** : 15 février 2026  
**Version** : 1.0  
**Statut** : Production-ready ✅
