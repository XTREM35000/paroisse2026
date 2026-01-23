# Guide Complet: Page Podcasts & Streaming en Direct

## 📋 Vue d'ensemble de la page `/podcasts`

La page Podcasts a déjà une structure complète avec:

- ✅ **Lecteur audio** pour écouter les épisodes
- ✅ **Liste des épisodes** stockés dans Supabase Storage
- ✅ **Streaming en direct** (placeholder en place)
- ✅ **Mini-lecteur fixe** en bas de page
- ✅ **Sauvegarde** des épisodes écoutés (localStorage)

---

## 🎯 Architecture Actuelle

### 1. **Récupération des épisodes**

```
Supabase Storage (bucket 'podcasts')
  ↓
Liste des fichiers MP3
  ↓
Génération des URLs publiques
  ↓
Affichage dans la grille
```

**Fichier:** `src/pages/Podcasts.tsx` (lignes 66-104)

### 2. **Lecteur Audio**

- Utilise l'API `HTMLAudioElement` native
- Contrôle du volume, de la durée
- Barre de progression
- Pause/Reprendre

### 3. **Streaming en Direct**

- **URL placeholder:** `/media/live/stream.mp3`
- Fonction `playLive()` (ligne 176)
- Bouton "Écouter le direct" dans la sidebar
- État `isLivePlaying` pour contrôler l'affichage

---

## 🚀 Comment Implémenter un Stream en Direct

### **Option 1: Simple (Flux MP3 statique)**

Si vous avez une URL d'un flux MP3 continu (par exemple, depuis un service comme:

- **Icecast**
- **Shoutcast**
- **Mux**
- **StreamYard**

**Étape 1:** Modifiez l'URL du stream

```tsx
// src/pages/Podcasts.tsx ligne 39
const LIVE_STREAM_URL = 'https://votre-service.com/stream.mp3'
// Ou depuis Supabase Storage
const LIVE_STREAM_URL =
  supabase.storage.from('live-streams').getPublicUrl('live.mp3').data?.publicUrl || ''
```

**Étape 2:** C'est tout! Le bouton "Écouter le direct" fonctionnera déjà.

---

### **Option 2: Stream HLS (Recommandé pour la qualité)**

Pour du streaming vidéo en direct (avec caméra), utilisez **HLS (HTTP Live Streaming)**.

**Services recommandés:**

1. **Mux** (https://mux.com)
2. **Cloudflare Stream**
3. **AWS IVS**
4. **Twitch**

**Installation du lecteur HLS:**

```bash
npm install hls.js
```

**Code pour lire un stream HLS:**

```tsx
import HLSPlayer from 'hls.js'

const playLiveHLS = () => {
  const video = document.getElementById('live-video') as HTMLVideoElement

  if (HLS.isSupported()) {
    const hls = new HLS()
    hls.loadSource('https://votre-stream-hls.m3u8')
    hls.attachMedia(video)
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = 'https://votre-stream-hls.m3u8'
  }

  video.play()
}
```

---

### **Option 3: WebRTC (Streaming en direct interactive)**

Pour des sessions de streaming interactif avec chat en temps réel.

**Services:**

- **Jitsi Meet**
- **Daily.co**
- **Twilio**

**Exemple avec Daily.co:**

```tsx
import Daily from '@daily-co/daily-js'

const startWebRTC = async () => {
  const callFrame = Daily.createFrame({
    iframeStyle: {
      position: 'fixed',
      width: '100%',
      height: '100%',
    },
  })

  await callFrame.join({ url: 'https://your-room.daily.co' })
}
```

---

## 📊 Stockage des Configurations

Pour permettre aux **admins de gérer l'URL du stream**, créez une table Supabase:

```sql
CREATE TABLE public.podcast_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insérez l'URL du stream
INSERT INTO public.podcast_settings (setting_key, setting_value)
VALUES ('live_stream_url', 'https://votre-stream.com/live.mp3');
```

**Code React pour charger l'URL dynamiquement:**

```tsx
const [liveStreamUrl, setLiveStreamUrl] = useState<string>('')

useEffect(() => {
  const fetchStreamUrl = async () => {
    const { data } = await supabase
      .from('podcast_settings')
      .select('setting_value')
      .eq('setting_key', 'live_stream_url')
      .single()

    if (data) {
      setLiveStreamUrl(data.setting_value)
    }
  }

  fetchStreamUrl()
}, [])

const playLive = () => {
  if (!liveStreamUrl) {
    console.error('URL du stream non configurée')
    return
  }

  const live = new Audio(liveStreamUrl)
  audioRef.current = live
  live.play()
  setIsLivePlaying(true)
}
```

---

## 🎬 Ajouter une Vidéo en Direct

Si vous voulez afficher une vidéo en direct (pas juste l'audio), modifiez la page:

```tsx
import { useState } from 'react'

export default function Podcasts() {
  const [showLiveVideo, setShowLiveVideo] = useState(false)

  return (
    <main>
      {showLiveVideo && (
        <div className='fixed inset-0 z-50 bg-black/90 flex items-center justify-center'>
          <video src={liveStreamUrl} controls autoPlay className='w-full h-full object-contain' />
          <button
            onClick={() => setShowLiveVideo(false)}
            className='absolute top-4 right-4 bg-white rounded-full p-2'
          >
            ✕
          </button>
        </div>
      )}

      <Button onClick={() => setShowLiveVideo(true)}>Regarder en direct</Button>
    </main>
  )
}
```

---

## 📱 Architecture Recommandée pour le Stream

```
┌─────────────────────────────────────────────┐
│         Studio/Encoder (OBS/Wirecast)       │
└──────────────────┬──────────────────────────┘
                   │ (RTMP/SRT)
                   ↓
┌─────────────────────────────────────────────┐
│      Service de Streaming (Mux/Twitch)      │
│  - Transcoding                              │
│  - Distribution CDN                         │
│  - Analytics                                │
└──────────────────┬──────────────────────────┘
                   │ (HLS/DASH URL)
                   ↓
┌─────────────────────────────────────────────┐
│     Application Faith-Flix (lecteur)        │
│  - HLS.js ou HTML5 <video>                  │
│  - Chat en temps réel                       │
│  - Notifications                            │
└─────────────────────────────────────────────┘
```

---

## ✅ Checklist d'Implémentation

- [ ] Choisir un service de streaming (Mux, Twitch, etc.)
- [ ] Obtenir l'URL du stream
- [ ] Remplacer `LIVE_STREAM_URL` dans Podcasts.tsx
- [ ] Créer une table `podcast_settings` (optionnel mais recommandé)
- [ ] Ajouter une admin panel pour gérer l'URL
- [ ] Tester le stream en direct
- [ ] Ajouter des notifications "En direct maintenant" (push/email)
- [ ] Analytics du nombre de spectateurs

---

## 🔗 Ressources Utiles

- **HLS.js:** https://github.com/video-dev/hls.js
- **Mux:** https://mux.com (recommandé pour vidéo en direct)
- **Daily.co:** https://daily.co (pour streaming interactif)
- **OBS Studio:** https://obsproject.com (pour encoder)

---

## Prochaines Étapes

1. **Configurez une URL de stream** (demandez un service de streaming)
2. **Mettez à jour `LIVE_STREAM_URL`**
3. **Testez avec un flux de test** (ex: http://media.example.org/media/playlist.m3u8)
4. **Ajoutez une admin panel** pour gérer les paramètres

Besoin d'aide pour une étape spécifique? 😊
