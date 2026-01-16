# Lecteur Vidéo - Page Vidéos

## ✅ Fonctionnalité Implémentée

La page `/videos` supporte maintenant la lecture directe des vidéos via un lecteur médias modal, similaire à la page `/live`.

## 🎬 Utilisation

### Lecture d'une Vidéo

1. Cliquez sur **n'importe quelle vignette vidéo** de la page `/videos`
2. Un **modal lecteur** s'ouvre avec :
   - Lecteur vidéo en full-screen adaptatif
   - Titre et description de la vidéo
   - Nombre de vues et date de création
   - Section commentaires (placeholder pour extension future)
3. **Fermer** le lecteur :
   - Cliquez le bouton **X** en haut à droite
   - Cliquez sur le fond noir (arrière-plan)

### Types de Vidéos Supportés

Le lecteur supporte deux sources vidéo :

1. **Vidéos YouTube/Vimeo** :

   - Passez l'URL complète dans le champ `video_url`
   - Format: `https://youtube.com/watch?v=...` ou `https://vimeo.com/...`
   - Le lecteur convertit automatiquement en embed

2. **Vidéos Locales** (Supabase Storage) :

   - Uploadez la vidéo via le formulaire d'ajout
   - Le système stocke le chemin dans `video_storage_path`
   - Accès URL: `https://[supabase]/storage/v1/object/public/videos/[path]`

3. **URLs HLS** :
   - Format: `https://example.com/stream.m3u8`
   - Utilisé pour les streaming adaptatifs

## 🔧 Implémentation Technique

### Fichiers Modifiés

- **[VideosPage.tsx](src/pages/VideosPage.tsx)** : Ajout du modal lecteur
  - Import `VideoPlayerModal`
  - State `selectedVideoForPlayback` et `isPlayerModalOpen`
  - Fonction `handleOpenPlayerModal()` pour ouvrir le lecteur
  - Fonction `handleClosePlayerModal()` pour fermer
  - Rendu du `VideoPlayerModal`

### Composants Impliqués

- **[VideoPlayerModal.tsx](src/components/VideoPlayerModal.tsx)** : Modal lecteur complet

  - Gestion des URLs vidéo (YouTube, Vimeo, HLS, local)
  - Interface avec VideoPlayer
  - Affichage des infos vidéo
  - Section commentaires (template)

- **[VideoPlayer.tsx](src/components/VideoPlayer.tsx)** : Lecteur médias

  - Détection type vidéo (YouTube, Vimeo, HTML5)
  - Conversion URLs embeds
  - Rendu responsive

- **[VideoCard.tsx](src/components/VideoCard.tsx)** : Vignette vidéo
  - Callback `onOpen()` appelé au clic
  - Icône play sur la vignette
  - Actions admin (edit, delete)

## 📋 Champs de Données

Pour que le lecteur fonctionne, chaque vidéo doit avoir :

```typescript
{
  id: string;                          // ✅ Obligatoire (UUID)
  title: string;                       // ✅ Obligatoire
  thumbnail_url: string | null;        // Miniature (recommandée)
  description: string | null;          // Description optionnelle
  video_url: string | null;            // URL YouTube/Vimeo
  video_storage_path?: string | null;  // Chemin Supabase Storage
  hls_url: string | null;              // URL stream HLS
  views: number;                       // Nombre de vues
  created_at: string;                  // Date création
  // ...autres champs
}
```

### Priorité d'Affichage

Le lecteur utilise cet ordre de priorité :

1. `video_storage_path` → URL locale Supabase Storage
2. `video_url` → URL YouTube/Vimeo/HLS
3. Rien → Message "Aucune vidéo disponible"

## 🎨 Design Responsive

Le lecteur s'adapte à tous les écrans :

- **Desktop** : Modal centered max-w-2xl
- **Tablette** : Full-width avec padding
- **Mobile** : Full viewport avec padding minimal
- **Aspect ratio** : 16:9 adaptatif
- **Draggable** : Modal déplaçable à la souris sur desktop

## 🚀 Fonctionnalités Futures

Possibilités d'extension :

- [ ] Système de commentaires fonctionnel
- [ ] Likes/favoris sur vidéos
- [ ] Recommandations vidéos similaires
- [ ] Sous-titres (YouTube supporté nativement)
- [ ] Playlist/files de lecture
- [ ] Téléchargement (si autorisé)
- [ ] Partage sur réseaux sociaux
- [ ] Analytics vue par utilisateur

## 🐛 Diagnostic

### La vidéo ne charge pas

1. Vérifiez que `video_url` ou `video_storage_path` est rempli
2. Pour YouTube : vérifiez le format de l'URL
3. Pour vidéos locales : vérifiez que le fichier existe dans Storage
4. Vérifiez les permissions CORS du bucket Storage

### L'URL YouTube ne fonctionne pas

Formats acceptés :

- ✅ `https://youtube.com/watch?v=ID`
- ✅ `https://youtu.be/ID`
- ✅ `https://youtube.com/embed/ID`
- ✅ `https://youtube.com/shorts/ID`

### Modal ne s'ouvre pas

1. Cliquez directement sur la vignette (pas les boutons admin)
2. Vérifiez la console pour les erreurs
3. Assurez-vous que la vidéo a un `id` valide (UUID)

## 📖 Exemple d'Utilisation Code

```tsx
// Dans VideosPage.tsx
const handleOpenPlayerModal = (video: Video) => {
  setSelectedVideoForPlayback(video);
  setIsPlayerModalOpen(true);
};

// Rendu du modal
<VideoPlayerModal
  video={selectedVideoForPlayback}
  isOpen={isPlayerModalOpen}
  onClose={handleClosePlayerModal}
/>

// Dans VideoCard.tsx
<div onClick={onOpen}> {/* Déclenche handleOpenPlayerModal */}
  {/* Icône play et vignette */}
</div>
```

## ✨ Cas d'Usage

- **Église** : Visualiser les enregistrements de messes et homélies
- **Paroissiens** : Regarder les vidéos en ligne sans redirection externe
- **Mobile** : Accès facile et responsive sur tous les appareils
- **Live** : Intégration cohérente avec la page `/live`
