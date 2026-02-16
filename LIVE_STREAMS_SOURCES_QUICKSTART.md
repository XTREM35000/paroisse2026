# 🚀 Quick Start - Système de Liens Fournisseurs

## 1️⃣ Migration SQL (5 min)

Copier le contenu de : `MIGRATION_LIVE_STREAM_SOURCES.sql`

Sur [Supabase Dashboard](https://app.supabase.com) :

1. SQL Editor
2. Coller le code
3. Run
4. ✅ Table créée

---

## 2️⃣ Code prêt à l'emploi (déjà créé)

### Types

✅ `src/types/database.ts` - Type `LiveProviderSource`

### Hooks

✅ `src/hooks/useLiveProviderSources.ts` - Hook complet

### Composants

✅ `src/components/live/LiveProviderLinks.tsx` - Affichage liens
✅ `src/components/AdminLiveSourcesEditor.tsx` - Gestion admin

### Queries

✅ `src/lib/supabase/mediaQueries.ts` - CRUD complet

### Pages

✅ `src/pages/Live.tsx` - Intégration complète

---

## 3️⃣ Utilisation dans Live.tsx

Le système est **déjà intégré** ! ✅

```tsx
// Dans Live.tsx (déjà fait)
import useLiveProviderSources from '@/hooks/useLiveProviderSources'
import LiveProviderLinks from '@/components/live/LiveProviderLinks'

// Dans le composant
const { sources: providerSources } = useLiveProviderSources(liveStream?.id)

// Dans le modal du player
;<LiveProviderLinks sources={providerSources} />
```

---

## 4️⃣ Ajouter dans l'Admin Panel

### Option A : Utiliser le composant prêt fait

Importer et inclure dans votre page admin live existante :

```tsx
import AdminLiveSourcesEditor from '@/components/AdminLiveSourcesEditor'

export default function AdminLiveEditor() {
  return (
    <div>
      {/* Autres champs */}

      {/* Ajouter cette section */}
      {liveId && (
        <div className='mt-8 border-t pt-8'>
          <AdminLiveSourcesEditor liveId={liveId} liveTitle={liveTitle} />
        </div>
      )}
    </div>
  )
}
```

### Option B : Utiliser les queries directement

```tsx
import {
  addLiveProviderSource,
  updateLiveProviderSource,
  deleteLiveProviderSource,
} from '@/lib/supabase/mediaQueries'

// Ajouter
await addLiveProviderSource(liveId, 'youtube', 'https://...')

// Supprimer
await deleteLiveProviderSource(sourceId)
```

---

## 5️⃣ Tester

### Test 1 : Sans sources

- Créer un live sans sources
- Ouvrir le live
- ✅ Aucun affichage sous le player

### Test 2 : Avec sources

```typescript
// En base Supabase
INSERT INTO live_stream_sources (live_id, provider, url) VALUES
('abc-123', 'youtube', 'https://youtube.com/watch?v=test'),
('abc-123', 'facebook', 'https://facebook.com/test');
```

- Recharger la page
- ✅ 2 boutons affichés sous le player

### Test 3 : Depuis l'admin

- Utiliser `AdminLiveSourcesEditor`
- Ajouter une source YouTube
- ✅ Bouton apparaît immédiatement

---

## 📦 Ressources Créées

| Fichier                                                                                | Type      | Description               |
| -------------------------------------------------------------------------------------- | --------- | ------------------------- |
| [MIGRATION_LIVE_STREAM_SOURCES.sql](MIGRATION_LIVE_STREAM_SOURCES.sql)                 | SQL       | Migration table           |
| [src/types/database.ts](src/types/database.ts)                                         | TS        | Type `LiveProviderSource` |
| [src/hooks/useLiveProviderSources.ts](src/hooks/useLiveProviderSources.ts)             | Hook      | Récupération sources      |
| [src/components/live/LiveProviderLinks.tsx](src/components/live/LiveProviderLinks.tsx) | Composant | Affichage liens           |
| [src/components/AdminLiveSourcesEditor.tsx](src/components/AdminLiveSourcesEditor.tsx) | Composant | Gestion admin             |
| [src/lib/supabase/mediaQueries.ts](src/lib/supabase/mediaQueries.ts)                   | Queries   | CRUD Supabase             |
| [src/pages/Live.tsx](src/pages/Live.tsx)                                               | Page      | Intégration complète      |
| [LIVE_STREAM_SOURCES_DOCUMENTATION.md](LIVE_STREAM_SOURCES_DOCUMENTATION.md)           | Doc       | Documentation complète    |

---

## 🎯 Résumé de l'implémentation

```
✅ Type TypeScript
✅ Table SQL
✅ Queries Supabase (CRUD)
✅ Hook React
✅ Composant d'affichage
✅ Composant admin
✅ Intégration dans Live.tsx
✅ Documentation complète
```

---

## ⚡ Prochaines étapes

1. ✅ Exécuter la migration SQL
2. ✅ Tester avec des sources
3. ✅ Intégrer le composant admin dans votre panel
4. ✅ C'est bon ! 🎉

---

## 🆘 Problèmes courants

**Q: Les liens ne s'affichent pas**

- Vérifier la migration SQL est exécutée
- Vérifier les sources existent en base

**Q: Erreur permission Supabase**

- Vérifier les policies RLS
- Si problème, exécuter la migration SQL complète

**Q: Composant Input non trouvé**

- S'assurer que `@/components/ui/input` existe
- Sinon, remplacer par un `<input />` HTML simple

---

**Créé le** : 15 février 2026  
**Temps d'intégration** : ~15 min  
**Difficulté** : Facile ✅
