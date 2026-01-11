# 📊 Avant / Après : Changements dans Index.tsx

## Vue d'ensemble

Ce fichier montre exactement **quels changements** ont été faits dans `src/pages/Index.tsx` pour ajouter la fonctionnalité du modal de bienvenue.

---

## 🔴 AVANT

```tsx
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, BookOpen, Bell, Heart } from 'lucide-react'
import { useState, useEffect } from 'react'
// Header/Footer provided by Layout
import HomepageHero from '@/components/HomepageHero'
import SectionTitle from '@/components/SectionTitle'
import VideoCard from '@/components/VideoCard'
import GalleryCard from '@/components/GalleryCard'
import EventCard from '@/components/EventCard'
// AuthModal is now controlled globally in Header
import VideoPlayerModal from '@/components/VideoPlayerModal'
import AdvertisementPopup from '@/components/AdvertisementPopup'
// ← MANQUANT: WelcomeModal n'est pas importé

// ... dans le composant ...

const Index = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile } = useUser()
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [showAdPopup, setShowAdPopup] = useState(true)
  // ← MANQUANT: [showWelcomeModal, setShowWelcomeModal] n'existe pas
  const [homilies, setHomilies] = useState<any[]>([])

  // ... AUCUN useEffect pour le welcome modal ...

  // ... dans le return ...

  return (
    <div className='min-h-screen bg-background'>
      {/* Header provided by Layout */}
      {/* AuthModal moved to Header to avoid duplicate modals */}

      {/* ← MANQUANT: Pas de WelcomeModal ici */}

      <VideoPlayerModal video={selectedVideo} isOpen={!!selectedVideo} onClose={closeVideoModal} />

      {/* ... reste du contenu ... */}
    </div>
  )
}
```

---

## 🟢 APRÈS

```tsx
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, BookOpen, Bell, Heart } from 'lucide-react'
import { useState, useEffect } from 'react'
// Header/Footer provided by Layout
import HomepageHero from '@/components/HomepageHero'
import SectionTitle from '@/components/SectionTitle'
import VideoCard from '@/components/VideoCard'
import GalleryCard from '@/components/GalleryCard'
import EventCard from '@/components/EventCard'
// AuthModal is now controlled globally in Header
import VideoPlayerModal from '@/components/VideoPlayerModal'
import AdvertisementPopup from '@/components/AdvertisementPopup'
import WelcomeModal from '@/components/WelcomeModal' // ✅ AJOUTÉ

// ... dans le composant ...

const Index = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile } = useUser()
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [showAdPopup, setShowAdPopup] = useState(true)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false) // ✅ AJOUTÉ
  const [homilies, setHomilies] = useState<any[]>([])

  // ✅ AJOUTÉ: useEffect pour la détection du modal de bienvenue
  useEffect(() => {
    const SESSION_STORAGE_KEY = 'hasSeenHomepageWelcomeModal'

    const hasSeenModal = sessionStorage.getItem(SESSION_STORAGE_KEY)

    if (!hasSeenModal) {
      const navEntries = performance.getEntriesByType('navigation')

      if (navEntries.length > 0) {
        const navEntry = navEntries[0] as PerformanceNavigationTiming

        if (navEntry.type === 'navigate' || navEntry.type === 'reload') {
          console.log(`[WelcomeModal] Hard navigation detected (${navEntry.type}). Showing modal.`)
          setShowWelcomeModal(true)
          sessionStorage.setItem(SESSION_STORAGE_KEY, 'true')
        } else {
          console.log(
            `[WelcomeModal] Soft navigation detected (${navEntry.type}). Modal not shown.`,
          )
        }
      } else {
        console.log('[WelcomeModal] No navigation entries. Assuming hard load, showing modal.')
        setShowWelcomeModal(true)
        sessionStorage.setItem(SESSION_STORAGE_KEY, 'true')
      }
    } else {
      console.log('[WelcomeModal] User already saw modal in this session. Not showing.')
    }
  }, [])

  // ✅ AJOUTÉ: Handler pour fermer le modal
  const handleWelcomeModalClose = () => {
    console.log('[WelcomeModal] Modal closed by user.')
    setShowWelcomeModal(false)
  }

  // ... dans le return ...

  return (
    <div className='min-h-screen bg-background'>
      {/* Header provided by Layout */}
      {/* AuthModal moved to Header to avoid duplicate modals */}

      {/* ✅ AJOUTÉ: WelcomeModal */}
      {showWelcomeModal && <WelcomeModal onClose={handleWelcomeModalClose} />}

      <VideoPlayerModal video={selectedVideo} isOpen={!!selectedVideo} onClose={closeVideoModal} />

      {/* ... reste du contenu ... */}
    </div>
  )
}
```

---

## 📝 Résumé des Changements

| Ligne   | Action        | Code                                                               |
| ------- | ------------- | ------------------------------------------------------------------ |
| 15      | **Import**    | `import WelcomeModal from "@/components/WelcomeModal";`            |
| 50      | **State**     | `const [showWelcomeModal, setShowWelcomeModal] = useState(false);` |
| 60-92   | **useEffect** | Logique de détection de navigation                                 |
| 94-97   | **Handler**   | `const handleWelcomeModalClose = () => { ... }`                    |
| 200-203 | **JSX**       | `{showWelcomeModal && <WelcomeModal onClose={...} />}`             |

---

## 📦 Nouvelles Dépendances

| Fichier            | Type      | Raison                         |
| ------------------ | --------- | ------------------------------ |
| `WelcomeModal.tsx` | Composant | Afficher le modal              |
| `performance` API  | Native    | Détecter le type de navigation |
| `sessionStorage`   | Native    | Mémoriser l'état               |

**Aucune nouvelle dépendance npm** n'a été ajoutée. Tout utilise les APIs natives du navigateur et React.

---

## 🔄 Impact sur les Autres Composants

| Composant                | Changement | Impact                 |
| ------------------------ | ---------- | ---------------------- |
| `Layout.tsx`             | Aucun      | ✅ Pas d'impact        |
| `Header.tsx`             | Aucun      | ✅ Pas d'impact        |
| `App.tsx`                | Aucun      | ✅ Pas d'impact        |
| `WelcomeModal.tsx`       | Créé       | ✅ Nouveau composant   |
| `AdvertisementPopup.tsx` | Aucun      | ✅ Fonctionne toujours |

---

## 📊 Diffstat (Résumé des Lignes)

```diff
src/pages/Index.tsx
+1 import (WelcomeModal)
+1 state (showWelcomeModal)
+33 useEffect (détection navigation)
+4 handler (handleWelcomeModalClose)
+4 JSX (rendu conditionnel)

Total: +43 lignes dans Index.tsx

src/components/WelcomeModal.tsx
+100 lignes (nouveau fichier)

Grand total: +143 lignes de code
```

---

## ✅ Validation

Tous les changements sont:

- ✅ TypeScript compilé sans erreurs
- ✅ ESLint validé
- ✅ Logique testée
- ✅ Compatibles avec React Router v6
- ✅ Performants (aucun impact sur le chargement)

---

## 🚀 Déploiement

Pour déployer en production:

1. ✅ Fichier [WelcomeModal.tsx](src/components/WelcomeModal.tsx) créé
2. ✅ Fichier [Index.tsx](src/pages/Index.tsx) mis à jour
3. ✅ Aucune migration DB requise
4. ✅ Aucune variable d'env nouvelle requise
5. ✅ Backward-compatible (pas de breaking changes)

**Prêt pour merge et déploiement** 🎉
