# Guide: Page Vidéos Optimisée - Faith Flix

## 🎬 Vue d'ensemble

La page `/videos` a été complètement refondée avec un système CRUD complet, des fonctionnalités de gestion avancées et une interface utilisateur améliorée.

## ✨ Nouvelles Fonctionnalités

### Pour les Administrateurs

#### 1. **Ajouter une Vidéo**

- Bouton "Ajouter une vidéo" en haut à droite de la barre de recherche
- Dialog/Modal intuitif avec validation
- Champs requis : Titre, Catégorie, Vignette

```tsx
Formulaire d'ajout :
├── Titre *
├── Description
├── Catégorie * (Sermon, Musique, Célébration, Enseignement, Témoignage)
├── Durée (secondes)
└── Vignette * (drag-drop ou sélection fichier)
```

#### 2. **Gérer les Vidéos**

- Survoler une card vidéo pour voir les actions
- **Afficher/Masquer** : Publier ou mettre en brouillon
- **Supprimer** : Suppression avec confirmation

#### 3. **Statut Brouillon**

- Badge "Brouillon" affiché sur les vidéos non publiées
- Visibles uniquement aux admins en brouillon

### Pour les Visiteurs

#### 1. **Recherche en Temps Réel**

- Barre de recherche qui filtre par titre et description
- Résultats instantanés

#### 2. **Filtrage par Catégorie**

- Boutons de catégorie : Toutes, Sermon, Musique, Célébration, Enseignement, Témoignage
- Filtrage rapide

#### 3. **Statistiques**

- Nombre total de vidéos
- Total des vues
- Durée totale du contenu

#### 4. **Affichage des Vidéos**

- Grille responsive : 1 col (mobile) → 2 col (tablet) → 4 col (desktop)
- Cards avec vignettes optimisées
- Durée, vues, date et catégorie affichées

## 🏗️ Architecture Technique

### Composants Principaux

#### **VideosPage.tsx**

Page principale avec :

- Gestion de l'état de la recherche et filtrage
- Dialog d'ajout de vidéos
- Grille de vidéos responsive
- Stats dynamiques
- Actions admin (overlay)

#### **VideoManager.tsx** (Nouveau)

Formulaire avancé pour ajouter/éditer des vidéos :

- Drag-and-drop pour vignettes
- Preview d'image temps réel
- Validation robuste
- Gestion d'erreurs

#### **GalleryGrid.tsx** (Nouveau)

Composant de grille optimisée :

- Layout responsive auto-fill
- Colonnes configurables
- Animation d'apparition

### Hooks Personnalisés

#### **useVideos.ts** (Amélioré)

Gestion des vidéos Supabase :

- `fetchVideos()` - Récupérer
- `createVideo(data)` - Créer
- `updateVideo(id, updates)` - Modifier
- `deleteVideo(id)` - Supprimer

Nouveau champ : `published: boolean`

#### **useVideoManager.ts** (Nouveau)

Gestion d'état avancée :

- `handleCreate()` - Wrapper pour création
- `handleUpdate()` - Wrapper pour mise à jour
- `handleDelete()` - Wrapper pour suppression
- `startEditing()` / `cancelEditing()` - Gestion mode édition
- `getVideoState()` - État par vidéo

## 🎨 Interface Utilisateur

### Responsive Design

```
Mobile (< 768px):
├── 1 colonne vidéos
├── Buttons empilés
└── Full-width search

Tablet (768px - 1024px):
├── 2 colonnes vidéos
├── Buttons en ligne
└── Sidebar optionnel

Desktop (> 1024px):
├── 4 colonnes vidéos (xl: 4)
├── Tous les contrôles visibles
└── Stats en 3 colonnes
```

### Animations

- ✨ AnimatePresence pour ajout/suppression
- 🎯 Hover effects sur les cards
- 🔄 Smooth transitions
- ⚡ Lazy loading des animations

## 🔐 Sécurité

### Vérification Admin

```tsx
const isAdmin = user?.role === 'admin';

// Les actions admin ne s'affichent que pour les admins
{isAdmin && (/* Actions */)}
```

### Validation

- Validation client avant envoi
- Confirmation avant suppression
- Gestion d'erreurs complète
- Feedback utilisateur clair

## 📊 Catégories Disponibles

| ID           | Label        | Valeur       |
| ------------ | ------------ | ------------ |
| sermon       | Sermon       | Sermon       |
| musique      | Musique      | Musique      |
| celebration  | Célébration  | Célébration  |
| enseignement | Enseignement | Enseignement |
| temoignage   | Témoignage   | Témoignage   |

## 💾 Format des Données

### Structure Vidéo

```typescript
interface Video {
  id: string
  title: string // Titre de la vidéo
  description?: string // Description brève
  thumbnail_url: string | null // URL de la vignette
  category?: string // Catégorie
  duration: number | null // Durée en secondes
  views: number // Nombre de vues
  created_at: string // Date de création
  published?: boolean // Publié ou brouillon
}
```

## 🚀 Utilisation

### Ajouter une Vidéo

1. **Cliquer** sur "Ajouter une vidéo"
2. **Remplir** le formulaire :
   - Titre (obligatoire)
   - Description (optionnel)
   - Catégorie (obligatoire)
   - Durée en secondes (optionnel)
   - Vignette (obligatoire) - Drag-drop ou clic
3. **Cliquer** sur "Ajouter"
4. ✅ Vidéo ajoutée et visible (publiée par défaut)

### Publier/Masquer une Vidéo

1. **Survoler** la card vidéo
2. **Cliquer** sur "Afficher" (publier) ou "Masquer" (brouillon)
3. ✅ État mis à jour

### Supprimer une Vidéo

1. **Survoler** la card vidéo
2. **Cliquer** sur "Supprimer"
3. **Confirmer** la suppression
4. ✅ Vidéo supprimée

### Rechercher/Filtrer

- **Par titre/description** : Taper dans la barre de recherche
- **Par catégorie** : Cliquer sur le bouton de catégorie
- **Réinitialiser** : Cliquer sur "Réinitialiser la recherche" ou "Toutes"

## 📈 Stats Affichées

```
📊 Nombre de vidéos
   - "4 vidéos" ou "1 vidéo"
   - Par catégorie sélectionnée

👁️ Total des vues
   - Somme de toutes les vues
   - Format français (ex: 1 245)

⏱️ Durée totale
   - En heures et décimales
   - Ex: "2.5h"
```

## 🔗 Intégrations

### Supabase

Les vidéos sont stockées dans la table `videos` avec les champs :

- `id` (UUID)
- `title` (text)
- `description` (text)
- `category` (text)
- `thumbnail_url` (text)
- `duration` (integer)
- `views` (integer)
- `created_at` (timestamp)
- `published` (boolean) - ✅ Nouveau

### Notifications

Utilisé via `useNotification()` :

- `notifySuccess()` - Succès opération
- `notifyError()` - Erreur
- Messages contextuels

## ⚙️ Configuration

### Catégories Personnalisées

Pour modifier les catégories, éditer le tableau `CATEGORIES` dans `VideosPage.tsx` :

```tsx
const CATEGORIES = [
  { id: 'all', label: 'Toutes', value: 'all' },
  { id: 'nouvelle', label: 'Nouvelle', value: 'Nouvelle' },
  // ...
]
```

### Limite de Vidéos

Modifier le premier paramètre de `useVideos()` :

```tsx
const { videos } = useVideos(100, category) // 100 = limite
```

## 🐛 Dépannage

### Les boutons admin ne s'affichent pas

- Vérifier que `user?.role === 'admin'`
- Vérifier l'authentification

### La vidéo ne s'ajoute pas

- Vérifier que tous les champs requis sont remplis
- Vérifier la connexion Supabase
- Consulter la console des erreurs

### La recherche ne fonctionne pas

- Vérifier que `description` existe dans les données
- Vérifier que la casse correspond

## 📱 Responsive Breakpoints

| Breakpoint | Largeur | Colonnes | Cas d'usage     |
| ---------- | ------- | -------- | --------------- |
| xs         | < 640px | 1        | Téléphone       |
| sm         | 640px+  | 2        | Téléphone large |
| md         | 768px+  | 2        | Tablette        |
| lg         | 1024px+ | 3        | Tablette large  |
| xl         | 1280px+ | 4        | Desktop         |

## 🎯 Prochaines Étapes

- [ ] Système de commentaires
- [ ] Playlist personnalisées
- [ ] Recommandations
- [ ] Analytics avancées
- [ ] Sous-titres/Transcription
- [ ] Partage réseaux sociaux
- [ ] Téléchargement vidéos
- [ ] Streaming vidéo native

## 📞 Support

Pour les problèmes ou questions sur la page vidéos, consulter les fichiers :

- [src/pages/VideosPage.tsx](VideosPage.tsx)
- [src/components/VideoManager.tsx](VideoManager.tsx)
- [src/hooks/useVideos.ts](../hooks/useVideos.ts)
- [IMPROVEMENTS.md](../../IMPROVEMENTS.md)
