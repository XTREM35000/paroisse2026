# Architecture - Lecteur Vidéo Page Vidéos

## 🏗️ Architecture Globale

```
                          ╔══════════════════════════════╗
                          ║      VideosPage.tsx          ║
                          ║   (Page principale)          ║
                          ╚════════┬═════════════════════╝
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
            ╔─────────────╗  ╔──────────────╗  ╔──────────────╗
            ║ VideoCard   ║  ║ VideoModal   ║  ║ VideoPlayer  ║
            ║ (Vignettes) ║  ║ (Edit Form)  ║  ║ (Lecteur)    ║
            ╚────┬────────╝  ╚──────────────╝  ╚──────────────╝
                 │
          onClick → onOpen()
                 │
                 ▼
    ╔════════════════════════════════════╗
    ║  handleOpenPlayerModal(video)      ║
    ║  • setSelectedVideoForPlayback     ║
    ║  • setIsPlayerModalOpen = true     ║
    ╚════════════════════════════════════╝
                 │
                 ▼
    ╔════════════════════════════════════╗
    ║   VideoPlayerModal.tsx (NOUVEAU)   ║
    ║   • Gère l'ouverture/fermeture     ║
    ║   • Détecte type vidéo             ║
    ║   • Affiche infos vidéo            ║
    ║   • Contient VideoPlayer           ║
    ╚════════════════════════════════════╝
                 │
                 ▼
    ╔════════════════════════════════════╗
    ║    VideoPlayer.tsx (Existant)      ║
    ║   • Rendu iframe YouTube/Vimeo     ║
    ║   • Rendu HTML5 vidéo locale       ║
    ║   • Conversion URLs                ║
    ╚════════════════════════════════════╝
```

## 📊 État (State) Flow

```
VideosPage State
├── selectedCategory: 'all' | 'Sermon' | ...
├── searchTerm: string
├── isModalOpen: boolean ← Formulaire édition vidéo
├── editingVideo: Video | null
├── isSaving: boolean
├── ← NEW → selectedVideoForPlayback: Video | null
└── ← NEW → isPlayerModalOpen: boolean

State Flow:

  Clic vignette
        ↓
  VideoCard.onOpen()
        ↓
  handleOpenPlayerModal(video)
        ↓
  selectedVideoForPlayback = video
  isPlayerModalOpen = true
        ↓
  Re-render VideoPlayerModal
        ↓
  Lecteur affiche
        ↓
  Clic X ou background
        ↓
  handleClosePlayerModal()
        ↓
  selectedVideoForPlayback = null
  isPlayerModalOpen = false
        ↓
  Re-render VideoPlayerModal (hidden)
```

## 🔄 Composant Hierarchy

```
<VideosPage>
  │
  ├─ <HeroBanner>
  │
  ├─ <input> (Search)
  ├─ <Buttons> (Categories)
  │
  ├─ Grid
  │  ├─ <VideoCard onClick={onOpen}>
  │  │  └─ <img> (thumbnail)
  │  │  └─ <PlayIcon>
  │  │
  │  ├─ Overlay (Admin)
  │  │  ├─ <Button> Edit
  │  │  └─ <Button> Delete
  │  │
  │  └─ <Badge> (Draft status)
  │
  ├─ <VideoModalForm> ← Pour éditer vidéo
  │
  └─ <VideoPlayerModal> ← NEW (Pour lire vidéo)
     │
     ├─ Button Close (X)
     │
     ├─ <VideoPlayer>
     │  └─ <iframe> | <video>
     │
     ├─ Info Section
     │  ├─ Title
     │  ├─ Description
     │  ├─ Views
     │  └─ Date
     │
     └─ Comments Section
        ├─ Textarea (placeholder)
        └─ Comments List (placeholder)
```

## 🎯 Flux d'Appels

### Scénario 1: Ouvrir Lecteur

```typescript
1. Utilisateur clique sur VideoCard
   ↓
2. onClick déclenche props.onOpen()
   ↓
3. onOpen={() => handleOpenPlayerModal(video)}
   ↓
4. console.debug('📹 Opening player modal for video:', video.id)
   ↓
5. setSelectedVideoForPlayback(video)
   ✓ State: selectedVideoForPlayback = { id, title, video_url, ... }
   ↓
6. setIsPlayerModalOpen(true)
   ✓ State: isPlayerModalOpen = true
   ↓
7. VideosPage re-render
   ↓
8. <VideoPlayerModal
     video={selectedVideoForPlayback}  // NON NULL
     isOpen={isPlayerModalOpen}        // TRUE
     onClose={handleClosePlayerModal}
   />
   ↓
9. AnimatePresence condition true
   ↓
10. Modal s'affiche avec animation
    ↓
11. VideoPlayer détecte type:
    - if (video.video_storage_path) → URL locale
    - if (video.video_url) → URL externe
    ↓
12. Rendu iframe ou <video> tag
    ↓
13. Vidéo prête à la lecture
```

### Scénario 2: Fermer Lecteur

```typescript
1. Utilisateur clique X OU arrière-plan
   ↓
2. onClick déclenche props.onClose()
   ↓
3. onClose={() => handleClosePlayerModal()}
   ↓
4. console.debug('📹 Closing player modal')
   ↓
5. setIsPlayerModalOpen(false)
   ✓ State: isPlayerModalOpen = false
   ↓
6. setSelectedVideoForPlayback(null)
   ✓ State: selectedVideoForPlayback = null
   ↓
7. VideosPage re-render
   ↓
8. <VideoPlayerModal
     video={null}
     isOpen={false}
   />
   ↓
9. AnimatePresence condition false
   ↓
10. Modal se ferme avec animation
    ↓
11. État réinitialisé
```

## 💾 Props Flow

```
VideosPage
  │
  ├─ props pour VideoCard:
  │  ├─ video: Video
  │  ├─ onOpen: () => void  ← handleOpenPlayerModal(video)
  │  └─ onDeleted: () => void
  │
  └─ props pour VideoPlayerModal:
     ├─ video: Video | null  ← selectedVideoForPlayback
     ├─ isOpen: boolean      ← isPlayerModalOpen
     └─ onClose: () => void  ← handleClosePlayerModal
         │
         └─ VideoPlayer props:
            ├─ url: string  (built from video_url/video_storage_path)
            └─ poster: string | null  (video.thumbnail_url)
```

## 🎬 Détection Type Vidéo

```
VideoPlayer.tsx
  │
  ├─ const isYouTube = (u: string) => /youtube|youtu.be/.test(u)
  │  └─ Retourne iframe embed
  │
  ├─ const isVimeo = (u: string) => /vimeo/.test(u)
  │  └─ Retourne iframe embed
  │
  ├─ isHLS = (u: string) => u.includes('.m3u8')
  │  └─ Retourne <video> tag
  │
  └─ else (URLs locales, etc)
     └─ Retourne <video> tag HTML5
```

## 📱 Responsive Breakpoints

```
Desktop (1920x1080)
  └─ Modal: max-w-2xl, centered
     └─ max-h-[95vh]
     └─ Draggable: YES
     └─ Padding: normal

Tablette (768x1024)
  └─ Modal: full-width - padding
     └─ max-h-[95vh]
     └─ Draggable: optional
     └─ Padding: medium

Mobile (375x667)
  └─ Modal: full-width - padding
     └─ max-h-[95vh] (avec scroll si besoin)
     └─ Draggable: NO
     └─ Padding: minimal
```

## 🔐 Sécurité

```
YouTube URL
  └─ Converted to: youtube-nocookie.com (NOT youtube.com)
     └─ Raison: Éviter le tracking par Google
     └─ Sécurité: iframe allowFullScreen + sandbox implicite

Video Local (Supabase)
  └─ URL: https://[supabase]/storage/v1/object/public/videos/...
     └─ Bucket: 'videos' (public read)
     └─ Authentication: NOT required (public)
     └─ CORS: Configured in Supabase

Vimeo
  └─ https://player.vimeo.com/video/...
     └─ Official embed
     └─ CORS: Handled by Vimeo
```

## ⚡ Performance

```
Lazy Loading (préservé)
  └─ VideoCard: img avec loading="lazy"
  └─ Modal: AnimatePresence (ne rend que si open)
  └─ VideoPlayer: iframe/video chargé à la demande

Memoization (potentiellement)
  └─ VideoCard: motion.div (animation)
  └─ VideoPlayer: Aucune, accepte de re-rendre
  └─ VideoPlayerModal: Aucun memo needed

Bundle Size
  └─ AUCUNE dépendance ajoutée
  └─ VideoPlayerModal existait déjà
  └─ Augmentation: ~20 lignes de code
```

## 🔌 Intégration Points

```
Actuellement Utilisé
  └─ useVideos() hook
     └─ videos array
     └─ loading state
     └─ createVideo/updateVideo/deleteVideo
     └─ refreshVideos function

Prêt pour Extension
  └─ Comments system
     └─ useComments() hook
     └─ POST /api/comments
     └─ Textarea déjà present

  └─ Likes system
     └─ useVideoLikes() hook
     └─ ThumbsUp icon déjà present

  └─ Share system
     └─ Navigator.share() API
     └─ Copy link utility

  └─ Analytics
     └─ Tracking vidéo views
     └─ Duration watched
     └─ User engagement
```

## 📚 Données Requises

```
Video Object Structure:

{
  id: string (UUID)              ← REQUIRED
  title: string                  ← REQUIRED (affichage)
  description?: string           ← OPTIONAL (affichage)
  thumbnail_url?: string         ← OPTIONAL (poster image)

  // Source vidéo (priorité)
  video_storage_path?: string    ← Check first
  video_url?: string             ← Check second
  hls_url?: string               ← Alternative

  // Métadonnées
  views?: number                 ← Affichage compteur
  created_at?: string            ← Affichage date
  category?: string              ← Filtre (non utilisé dans modal)

  // Optionnel
  duration?: number
  likes_count?: number
  comments_count?: number
  allow_comments?: boolean
  allow_download?: boolean
  // ...autres
}
```

## 🎨 Design System

```
Colors
  └─ Modal background: black (#000)
  └─ Content background: card (--card)
  └─ Text: foreground (--foreground)
  └─ Muted: muted-foreground (--muted-foreground)

Typography
  └─ Title: text-lg font-bold
  └─ Description: text-sm muted
  └─ Metadata: text-xs muted-foreground

Spacing
  └─ Modal padding: p-4
  └─ Section gap: gap-4
  └─ Text gap: mb-2, mb-4

Animations
  └─ Modal: scale 0.85→1, opacity 0→1
  └─ Backdrop: opacity 0→1
  └─ Duration: 300ms (smooth)
  └─ Easing: default (ease-out)

Interactions
  └─ Draggable: 📍 cursor-grab / cursor-grabbing
  └─ Clickable: 🔘 pointer-cursor
  └─ Scrollable: 📜 overflow-y-auto (comments)
```

---

**Architecture Complète et Optimisée** ✅
