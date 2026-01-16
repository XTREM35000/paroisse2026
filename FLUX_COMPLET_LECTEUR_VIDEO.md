# 🎬 FLUX COMPLET - Lecteur Vidéo Page /Videos

**Visualisation du fonctionnement complet de l'implémentation**

---

## 🔄 Flux Utilisateur

```
┌─────────────────────────────────────────────────────────┐
│  UTILISATEUR ACCÈDE À /VIDEOS                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ Page vidéos se charge  │
        │ • HeroBanner           │
        │ • Search bar           │
        │ • Categories buttons   │
        │ • Video grid           │
        └────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ Grille de vignettes    │
        │ affichées avec         │
        │ • Miniature            │
        │ • Icône play           │
        │ • Titre et infos       │
        └────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ UTILISATEUR CLIQUE     │
        │ sur une vignette       │
        └────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │ onClick déclenche                  │
        │ onOpen={() =>                      │
        │   handleOpenPlayerModal(video)     │
        │ }                                  │
        └────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │ handleOpenPlayerModal() exécutée   │
        │ • setSelectedVideoForPlayback(v)   │
        │ • setIsPlayerModalOpen(true)       │
        └────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │ State mis à jour                   │
        │ • selectedVideoForPlayback = video │
        │ • isPlayerModalOpen = true         │
        └────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │ VideosPage re-render               │
        │ <VideoPlayerModal                  │
        │   video={selectedVideoForPlayback} │
        │   isOpen={true}                    │
        │   onClose={handleClosePlayerModal} │
        │ />                                 │
        └────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │ VideoPlayerModal condition true    │
        │ • AnimatePresence rendu            │
        │ • Modal s'affiche (animation)      │
        └────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │ Modal Lecteur Vidéo Affiché        │
        │ ┌──────────────────────────────┐   │
        │ │ [X]                          │   │
        │ ├──────────────────────────────┤   │
        │ │     VIDÉO YOUTUBE/etc        │   │
        │ │                              │   │
        │ ├──────────────────────────────┤   │
        │ │ Titre: ...                   │   │
        │ │ Description: ...             │   │
        │ │ Vues: 100 | Date: 16/01/26   │   │
        │ └──────────────────────────────┘   │
        └────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │ Utilisateur regarde la vidéo       │
        │ • Lecture standard                 │
        │ • Contrôles HTML5 ou iframe        │
        │ • Full-screen possible             │
        │ • Responsive sur tous les appareils│
        └────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │ UTILISATEUR FERME LE LECTEUR       │
        │ Option 1: Clic bouton [X]          │
        │ Option 2: Clic arrière-plan noir   │
        └────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │ onClose déclenche                  │
        │ handleClosePlayerModal()           │
        │ • setIsPlayerModalOpen(false)      │
        │ • setSelectedVideoForPlayback(null)│
        └────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │ State mis à jour                   │
        │ • selectedVideoForPlayback = null  │
        │ • isPlayerModalOpen = false        │
        └────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │ VideosPage re-render               │
        │ <VideoPlayerModal                  │
        │   video={null}                     │
        │   isOpen={false}                   │
        │   ...                              │
        │ />                                 │
        └────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │ VideoPlayerModal condition false   │
        │ • AnimatePresence ne rend pas      │
        │ • Modal disparaît (animation)      │
        └────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │ Retour à page /videos              │
        │ État complet réinitialisé          │
        │ Prêt pour nouvelle action          │
        └────────────────────────────────────┘
```

---

## 🔗 Flux State

```
┌──────────────────────────────────────────────────────────┐
│  ÉTAT INITIAL - Page charge                              │
├──────────────────────────────────────────────────────────┤
│  selectedVideoForPlayback = null                         │
│  isPlayerModalOpen = false                               │
│  → VideoPlayerModal ne rend rien                         │
└──────────────────────────────────────────────────────────┘
                         │
              Clic vignette vidéo
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│  ÉTAT OUVERTURE - Modal s'ouvre                          │
├──────────────────────────────────────────────────────────┤
│  selectedVideoForPlayback = { id, title, url, ... }     │
│  isPlayerModalOpen = true                                │
│  → VideoPlayerModal rend avec isOpen={true}              │
│  → Modal s'affiche et s'anime                            │
└──────────────────────────────────────────────────────────┘
                         │
              Utilisateur regarde
                         │
              Clique X ou arrière-plan
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│  ÉTAT FERMETURE - Modal se ferme                         │
├──────────────────────────────────────────────────────────┤
│  selectedVideoForPlayback = null                         │
│  isPlayerModalOpen = false                               │
│  → VideoPlayerModal rend avec isOpen={false}             │
│  → Modal disparaît et s'anime                            │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│  ÉTAT FINAL - Page ready                                 │
├──────────────────────────────────────────────────────────┤
│  État réinitialisé = État initial                        │
│  Prêt pour nouvelle action                               │
└──────────────────────────────────────────────────────────┘
```

---

## 🎯 Détection Type Vidéo

```
┌─────────────────────────────┐
│   URL Vidéo Reçue           │
└──────────────┬──────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
   YouTube?      Vimeo?
        │             │
   YES  │             │  YES
        │             │
        ▼             ▼
  youtube-nocookie  player.vimeo.com
  /embed/ID        /video/ID
        │             │
        └──────┬──────┘
               │
               ▼
         ┌─────────────┐
         │  HLS URL?   │
         └──────┬──────┘
                │
            YES │
                │
                ▼
          HTML5 <video>
          + HLS stream
                │
                └─ HLS?
                   │
                NO │
                   │
                   ▼
              HTML5 <video>
              + MP4/WebM
                   │
                   ▼
          ┌────────────────┐
          │  Vidéo prête   │
          │  à la lecture  │
          └────────────────┘
```

---

## 🏗️ Architecture Composant

```
┌──────────────────────────────────────────┐
│          VideosPage.tsx                  │
├──────────────────────────────────────────┤
│                                          │
│  ┌─────────────────────────────────┐    │
│  │ HeroBanner                      │    │
│  └─────────────────────────────────┘    │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │ Search + Categories             │    │
│  └─────────────────────────────────┘    │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │ Grid of VideoCard               │    │
│  │ ├─ VideoCard (onClick onOpen)   │◄──┐│
│  │ ├─ VideoCard (onClick onOpen)   │   ││
│  │ └─ VideoCard (onClick onOpen)   │   ││
│  └─────────────────────────────────┘   ││
│        │                                ││
│        │ handleOpenPlayerModal(video)  ││
│        │ setSelectedVideoForPlayback  ││
│        │ setIsPlayerModalOpen = true  ││
│        │                                ││
│        ▼                                ││
│  ┌─────────────────────────────────┐   ││
│  │ VideoPlayerModal                │   ││
│  │ ├─ Button Close [X]             │   ││
│  │ ├─ VideoPlayer                  │   ││
│  │ │  ├─ iframe (YouTube/Vimeo)    │   ││
│  │ │  └─ <video> (HLS/Local)       │   ││
│  │ ├─ Video Info                   │   ││
│  │ │  ├─ Title                     │   ││
│  │ │  ├─ Description               │   ││
│  │ │  ├─ Views & Date              │   ││
│  │ │  └─ Comments Section          │   ││
│  │ └─ Draggable Container          │   ││
│  └─────────────────────────────────┘   ││
│        ▲                                ││
│        │ handleClosePlayerModal()       ││
│        │ setIsPlayerModalOpen = false  ││
│        │ setSelectedVideoForPlayback  ││
│        │ = null                       ││
│        └─ onClick (X or background) ──┘│
│                                          │
│  ┌─────────────────────────────────┐    │
│  │ VideoModalForm (Edit)           │    │
│  └─────────────────────────────────┘    │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │ Footer                          │    │
│  └─────────────────────────────────┘    │
│                                          │
└──────────────────────────────────────────┘
```

---

## 📊 Props Flow

```
VideosPage Component
    ├─ video: Video ─────┐
    │                    │
    ├─ onOpen callback   │
    │  ├─ (video) ──────┤──> handleOpenPlayerModal
    │  │                │    │
    │  │                │    ├─> setSelectedVideoForPlayback
    │  │                │    └─> setIsPlayerModalOpen = true
    │  │                │
    │  └─> VideoCard    │
    │                    │
    ├─ selectedVideoForPlayback
    │  └─────────────────┴──> VideoPlayerModal.video
    │
    ├─ isPlayerModalOpen
    │  └─────────────────────> VideoPlayerModal.isOpen
    │
    ├─ onClose callback
    │  └─────────────────────> VideoPlayerModal.onClose
    │                          │
    │                          ├─> handleClosePlayerModal
    │                          │   │
    │                          │   ├─> setIsPlayerModalOpen = false
    │                          │   └─> setSelectedVideoForPlayback = null
    │                          │
    │                          └─> Ferme modal
    │
    └─> VideoPlayerModal.video
        └─> VideoPlayer.url
            └─> <iframe> ou <video>
```

---

**Flux complet et optimisé** ✅
