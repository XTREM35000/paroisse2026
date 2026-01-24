# 🎨 WIREFRAMES & LAYOUTS - Système de Diffusion Live

---

## 📺 PAGE PUBLIQUE (`/live`)

### ÉTAT 1 : DIRECT ACTIF

```
┌─────────────────────────────────────────────────────────┐
│                    HERO BANNER                          │
│              Diffusion En Direct                        │
│       Suivez nos célébrations et podcasts               │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ● EN DIRECT MAINTENANT                                │
│                                                         │
│  Messe Dominicale - 1er Février                        │
│  📺 Regardez notre célébration en direct               │
│                                                         │
│  ┌─────────────────────────────────────┐               │
│  │   [Regarder le Direct]              │               │
│  └─────────────────────────────────────┘               │
│                                                         │
│  💡 Vous devez être connecté...                        │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌──────────────────────────┬──────────────────────────────┐
│                          │                              │
│  📺 Type                 │  📅 Démarré le               │
│  TV - Célébration        │  24 jan. 2026, 10:00        │
│                          │                              │
└──────────────────────────┴──────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                                                         │
│  À PROPOS DE CE DIRECT                                 │
│                                                         │
│  ✨ Participez à notre célébration en direct...        │
│  🙏 Un moment de recueillement et de prière...         │
│  📱 Accessible sur tous vos appareils...               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### ÉTAT 2 : AUCUN DIRECT

```
┌─────────────────────────────────────────────────────────┐
│                    HERO BANNER                          │
│              Diffusion En Direct                        │
│       Suivez nos célébrations et podcasts               │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                                                         │
│                      📺                                 │
│                                                         │
│        Aucun direct en ce moment                        │
│                                                         │
│  Les directs sont programmés selon notre calendrier.   │
│  Revenez bientôt pour suivre nos prochaines...         │
│                                                         │
│  ┌─────────────────────────────────────┐               │
│  │   NOS PROCHAINS DIRECTS             │               │
│  │                                     │               │
│  │  📺 Dimanche 1er février            │               │
│  │     10:00 - Messe Solennelle        │               │
│  │                                     │               │
│  │  🎙️  Mardi 3 février                │               │
│  │     18:00 - Podcast Hebdomadaire    │               │
│  └─────────────────────────────────────┘               │
│                                                         │
│  Abonnez-vous à nos notifications 🔔                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### MODAL LECTEUR (TV / Radio)

#### YouTube (TV)

```
┌────────────────────────────────────────────────┐
│ Regarder en direct                         [×] │
├────────────────────────────────────────────────┤
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │                                          │ │
│  │    [YouTube Video Player - 16:9]        │ │
│  │                                          │ │
│  │    ▶️  00:12 / 1:24:30                  │ │
│  │                                          │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ✨ Profitez du direct. Connexion stable...  │
│                                                │
└────────────────────────────────────────────────┘
```

#### Audio (Radio)

```
┌────────────────────────────────────────────────┐
│ Écouter en direct                          [×] │
├────────────────────────────────────────────────┤
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │                                          │ │
│  │    🎙️                                    │ │
│  │                                          │ │
│  │    Podcast Hebdomadaire                 │ │
│  │                                          │ │
│  │    [Audio Player Controls]               │ │
│  │    [====●════════] 00:12 / 32:45         │ │
│  │                                          │ │
│  │    En direct maintenant • 14:30         │ │
│  │                                          │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  🎙️ Vous pouvez mettre en pause...           │
│                                                │
└────────────────────────────────────────────────┘
```

---

## 👨‍💼 PAGE ADMIN (`/admin/live`)

### HEADER & FORM

```
┌─────────────────────────────────────────────────────────┐
│  ← Gestion des Directs                 [Nouveau Direct] │
│     Créez et gérez les diffusions live...               │
└─────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ Créer un Nouveau Direct                              [×]  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Titre du direct                                          │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Messe Dominicale - 1er Février                       │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Type de diffusion                                        │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ ▼ TV (Messe en direct)                              │ │
│  │   - TV (Messe en direct)                            │ │
│  │   - Radio (Podcast en direct)                       │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  URL du direct ou ID YouTube                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ https://youtube.com/watch?v=ABCD1234                │ │
│  └──────────────────────────────────────────────────────┘ │
│  Lien YouTube ou ID vidéo à 11 caractères               │
│                                                            │
│  Activer ce direct                                        │
│  [●──────────────────────────────] ON                    │
│  Les autres directs seront désactivés                    │
│                                                            │
│                          [Annuler] [Enregistrer]          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### LISTE DES DIRECTS (GRID)

```
┌─────────────────────────────────────────────────────────┐
│                    MES DIRECTS                          │
│                                                         │
│  ┌──────────────────────┐  ┌──────────────────────────┐ │
│  │  Messe Dominicale    │  │  Podcast Hebdomadaire   │ │
│  │                      │  │                          │ │
│  │  📺 TV               │  │  🎙️  RADIO              │ │
│  │  ● EN DIRECT         │  │                          │ │
│  │                      │  │  https://...stream.m3u8 │ │
│  │  https://youtube...  │  │                          │ │
│  │                      │  │  Statut : Désactivé     │ │
│  │  Créé le 24 jan.     │  │  Créé le 20 jan.        │ │
│  │                      │  │                          │ │
│  │  [Modifier] [Suppr.] │  │  [Modifier] [Suppr.]    │ │
│  └──────────────────────┘  └──────────────────────────┘ │
│                                                         │
│  ┌──────────────────────┐  ┌──────────────────────────┐ │
│  │  Messe Mercredi      │  │  Concert Spiritual      │ │
│  │                      │  │                          │ │
│  │  📺 TV               │  │  🎙️  RADIO              │ │
│  │                      │  │                          │ │
│  │  https://youtube...  │  │  https://...stream.m3u8 │ │
│  │                      │  │                          │ │
│  │  Statut : Désactivé  │  │  Statut : Désactivé    │ │
│  │  Créé le 15 jan.     │  │  Créé le 10 jan.       │ │
│  │                      │  │                          │ │
│  │  [Modifier] [Suppr.] │  │  [Modifier] [Suppr.]    │ │
│  └──────────────────────┘  └──────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📱 RESPONSIVE LAYOUTS

### MOBILE (< 640px)

#### Page Publique

```
┌─────────────────┐
│    HERO BANNER  │
├─────────────────┤
│                 │
│ ● EN DIRECT     │
│                 │
│ Messe...        │
│                 │
│ 📺 Regarder     │
│                 │
├─────────────────┤
│                 │
│ 📺 Type         │
│ TV - Messe      │
│                 │
│ 📅 Démarré le   │
│ 24 jan. 10:00   │
│                 │
├─────────────────┤
│                 │
│ À PROPOS        │
│                 │
│ ✨ Participez   │
│ 🙏 Un moment    │
│ 📱 Accessible   │
│                 │
└─────────────────┘
```

#### Admin Page

```
┌──────────────────┐
│  ← Gestion       │
│    [Nouveau]     │
├──────────────────┤
│                  │
│  Messe Mardi     │
│                  │
│  📺 TV           │
│  ● EN DIRECT     │
│                  │
│  https://y...    │
│                  │
│  Créé le 24 jan. │
│                  │
│ [Modifier]       │
│ [Supprimer]      │
│                  │
├──────────────────┤
│                  │
│  Podcast         │
│  ...             │
│                  │
└──────────────────┘
```

### TABLET (640-1024px)

#### Page Publique

```
┌─────────────────────────────────────┐
│         HERO BANNER                 │
├─────────────────────────────────────┤
│                                     │
│  ● EN DIRECT MAINTENANT             │
│                                     │
│  Messe Dominicale - 1er Février     │
│  📺 Regardez notre célébration      │
│                                     │
│  [Regarder le Direct]               │
│                                     │
├─────────────┬───────────────────────┤
│             │                       │
│  📺 Type    │  📅 Démarré le       │
│  TV - Messe │  24 jan. 2026, 10:00 │
│             │                       │
├─────────────┴───────────────────────┤
│                                     │
│  À PROPOS DE CE DIRECT              │
│                                     │
│  ✨ Participez à notre... 🙏 Un     │
│  moment... 📱 Accessible sur...     │
│                                     │
└─────────────────────────────────────┘
```

---

## 🎯 INTERACTION FLOWS

### Flow Admin : Créer Direct

```
Admin accède /admin/live
  ↓
Clique "Nouveau Direct"
  ↓
Dialog modal s'ouvre
  ↓
Remplit formulaire
  - Titre
  - Type (TV/Radio)
  - URL
  - Actif (toggle)
  ↓
Clique "Enregistrer"
  ↓
API: upsertLiveStream()
  ↓
Déactive autres directs
  (si is_active = true)
  ↓
Toast "Succès !"
  ↓
Modal ferme
  ↓
Liste se rafraîchit
  ↓
Nouveau direct visible dans grille
```

### Flow Utilisateur : Regarder Direct

```
Utilisateur accède /live
  ↓
Fetch activeLiveStream()
  ↓
Direct actif ?
  │
  ├─ OUI :
  │   ├─ Bannière "EN DIRECT" visible
  │   ├─ Clique "Regarder le Direct"
  │   ├─ Auth check
  │   │  ├─ Connecté ? → Modal ouvre
  │   │  └─ Non ? → Toast "Connectez-vous"
  │   ├─ Modal affiche lecteur YouTube
  │   ├─ Video charge et play (autoplay)
  │   └─ Utilisateur peut fermer modal
  │
  └─ NON :
      ├─ Message "Aucun direct..."
      ├─ Programme futur affiché
      └─ CTA "Abonnez-vous..."

[Refresh auto toutes les 30s]
```

---

## 🎨 COLOR SCHEME

```
Primary Color        : #0066CC (Boutons CTA)
Red Alert           : #DC2626 (Indicateur "EN DIRECT")
Background Card     : #F9FAFB
Text Primary        : #1F2937
Text Secondary      : #6B7280
Border              : #E5E7EB
Muted Background    : #F3F4F6

Gradient Alive      : from-red-500/10 to-red-600/10
Gradient Audio      : from-green-500/10 to-emerald-500/10
```

---

## 📊 SIZE SPECIFICATIONS

### Buttons

```
Primary: 48px height (mobile), 44px (desktop)
Secondary: 40px height
Icon only: 40x40px
```

### Cards (Admin)

```
Grid: 3 columns (desktop), 2 (tablet), 1 (mobile)
Width: ~300px each
Height: auto (content responsive)
Gap: 16px
```

### Modals

```
Width: 90vw max-w-4xl
Height: auto (scroll if needed)
Z-index: 1000+
Background: Overlay 50% opacity
```

### Hero Banner

```
Height: 200px (mobile), 300px (desktop)
Background Image: Cover
Overlay: 40% dark gradient
```

---

## ✅ VALIDATION VISUAL

### Admin Form - Valid State

```
✅ Titre rempli
✅ Type sélectionné
✅ URL valide (YouTube ou audio)
✅ Bouton "Enregistrer" actif (enabled)
```

### Admin Form - Invalid State

```
❌ Titre vide → Input border rouge
❌ URL vide → Input border rouge
⚠️ URL YouTube invalide → Helper text
❌ Bouton "Enregistrer" inactif (disabled)
```

---

## 🎬 ÉTAT FINAL

Tous les layouts sont :

- ✅ Responsive (Mobile/Tablet/Desktop)
- ✅ Accessibles (Contraste OK)
- ✅ Modernes (Design épuré)
- ✅ Cohérents (Même palette/espacement)
- ✅ Fonctionnels (Tous les éléments présents)

**Ready for implementation!** 🚀
