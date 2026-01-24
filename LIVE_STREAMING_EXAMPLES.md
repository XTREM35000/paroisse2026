# 🎬 Exemples d'Utilisation - Système de Diffusion Live

## 📚 Exemples de Code

### 1️⃣ Utiliser les Fonctions Supabase

#### Récupérer le direct actif

```typescript
import { fetchActiveLiveStream, type LiveStream } from '@/lib/supabase/mediaQueries'

// Utilisation simple
const stream = await fetchActiveLiveStream()

if (stream) {
  console.log(`Titre: ${stream.title}`)
  console.log(`Type: ${stream.stream_type}`) // 'tv' ou 'radio'
  console.log(`URL: ${stream.stream_url}`)
}
```

#### Créer/Mettre à Jour un Direct

```typescript
import { upsertLiveStream, deactivateOtherLiveStreams } from '@/lib/supabase/mediaQueries'

// Créer un nouveau direct
const newStream = await upsertLiveStream({
  title: 'Messe Dominicale - 1er Février',
  stream_type: 'tv',
  stream_url: 'https://youtube.com/watch?v=ABCD1234',
  is_active: true,
})

// Quand on active un direct, désactiver les autres
await deactivateOtherLiveStreams(newStream.id)
```

#### Récupérer Tous les Directs (Admin)

```typescript
import { fetchAllLiveStreams } from '@/lib/supabase/mediaQueries'

// Récupérer les 50 derniers
const { data: streams, count } = await fetchAllLiveStreams({ limit: 50 })

console.log(`Total de directs: ${count}`)
streams.forEach((stream) => {
  console.log(`${stream.title} - ${stream.is_active ? '🔴 ACTIF' : '⭕ INACTIF'}`)
})
```

---

## 🎨 Exemples Admin (`AdminLiveEditor.tsx`)

### Cas d'Usage 1 : Créer une Messe en Direct

1. **Admin accède à** `/admin/live`
2. **Clique sur** "Nouveau Direct"
3. **Remplit le formulaire** :
   ```
   Titre: "Messe Solennelle du Dimanche 1er Février"
   Type: TV (Messe en direct)
   URL: https://youtube.com/watch?v=dQw4w9WgXcQ
   Actif: ✓ (switch ON)
   ```
4. **Enregistre** → Direct créé et activé

### Cas d'Usage 2 : Créer un Podcast en Direct

1. **Admin accède à** `/admin/live`
2. **Clique sur** "Nouveau Direct"
3. **Remplit le formulaire** :
   ```
   Titre: "Podcast Hebdomadaire - Actualités Paroissiales"
   Type: Radio (Podcast en direct)
   URL: https://example.com/live-stream.m3u8
   Actif: ✓ (switch ON)
   ```
4. **Enregistre** → Podcast créé et actif

### Cas d'Usage 3 : Modifier un Direct Existant

1. **Dans la liste des directs**, clique sur la carte du direct
2. **Clique sur** "Modifier"
3. **Change les informations** (ex: URL, titre)
4. **Clique** "Enregistrer" → Mise à jour

### Cas d'Usage 4 : Désactiver un Direct

1. **Sur la carte du direct**, vois le switch "Actif/Inactif"
2. **Clique sur le switch** → Direct désactivé
3. **Ou** clique "Modifier" → Change "Actif" → "Enregistrer"

---

## 👥 Exemples Utilisateur (`Live.tsx`)

### Cas d'Usage 1 : Regarder une Messe

**Utilisateur Connecté :**

1. Accède à `/live`
2. Voit :

   ```
   🔴 ● EN DIRECT MAINTENANT

   Messe Solennelle du Dimanche 1er Février
   📺 Regardez notre célébration en direct

   [Regarder le Direct] ← Bouton bleu
   ```

3. **Clique** "Regarder le Direct"
4. **Modal s'ouvre** avec lecteur YouTube
5. La vidéo en direct affiche la messe

**Utilisateur Non Connecté :**

1. Accède à `/live`
2. Voit la bannière "EN DIRECT MAINTENANT"
3. **Clique** "Regarder le Direct"
4. → Toast d'erreur : "💡 Vous devez être connecté pour accéder au direct"
5. Redirigé vers la page de connexion

### Cas d'Usage 2 : Écouter un Podcast

**Utilisateur Connecté :**

1. Accède à `/live`
2. Voit :

   ```
   🔴 ● EN DIRECT MAINTENANT

   Podcast Hebdomadaire - Actualités Paroissiales
   🎙️ Écoutez notre podcast en direct

   [Écouter le Direct] ← Bouton bleu
   ```

3. **Clique** "Écouter le Direct"
4. **Modal s'ouvre** avec lecteur audio HTML5
5. **Clique play** pour écouter le flux en direct
6. **Peut mettre en pause, reprendre**, ajuster le volume

### Cas d'Usage 3 : Aucun Direct Actif

**Tous les utilisateurs :**

1. Accède à `/live`
2. **Aucun direct actif** → Voit :

   ```
   Aucun direct en ce moment

   Les directs sont programmés selon notre calendrier paroissial.
   Revenez bientôt pour suivre nos prochaines célébrations !

   📆 Nos prochains directs :
   • Dimanche 1er février, 10:00 - Messe Solennelle
   • Mardi 3 février, 18:00 - Podcast Hebdomadaire

   Abonnez-vous à nos notifications 🔔
   ```

---

## 🧪 Formats d'URL Supportés

### Pour TV (YouTube)

Tous ces formats sont **automatiquement extraits** en ID YouTube valide :

```
✓ https://www.youtube.com/watch?v=dQw4w9WgXcQ
✓ https://youtube.com/watch?v=dQw4w9WgXcQ
✓ https://youtu.be/dQw4w9WgXcQ
✓ https://www.youtube.com/embed/dQw4w9WgXcQ
✓ dQw4w9WgXcQ (ID seul, 11 caractères)
```

### Pour Radio (Audio)

Formats supportés (dépend du lecteur audio HTML5) :

```
✓ https://example.com/live-stream.m3u8 (HLS)
✓ https://example.com/live-stream.mp3
✓ https://stream.example.com/radio (si serveur supporte)
✓ rtmp://example.com/live (selon navigateur)
```

---

## 📊 Structure des Données

### Objet `LiveStream`

```typescript
interface LiveStream {
  id: string // UUID généré automatiquement
  title: string // "Messe Dominicale"
  stream_url: string // "https://youtube.com/..."
  stream_type: 'tv' | 'radio' // Type de diffusion
  is_active: boolean // Actif en ce moment ?
  created_at: string // ISO date string
  updated_at: string // ISO date string
}
```

### Exemple d'Objet Réel

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Messe Dominicale - 1er Février 2026",
  "stream_url": "https://youtube.com/watch?v=dQw4w9WgXcQ",
  "stream_type": "tv",
  "is_active": true,
  "created_at": "2026-01-24T14:30:00.000Z",
  "updated_at": "2026-01-24T14:30:00.000Z"
}
```

---

## 🔐 Règles d'Accès (RLS)

### Table `live_streams`

| Rôle                        | SELECT | INSERT | UPDATE | DELETE |
| --------------------------- | ------ | ------ | ------ | ------ |
| **Utilisateur Authentifié** | ✅     | ❌     | ❌     | ❌     |
| **Admin**                   | ✅     | ✅     | ✅     | ✅     |
| **Non authentifié**         | ❌     | ❌     | ❌     | ❌     |

**Implication :**

- Tout utilisateur connecté **peut voir** les directs actifs
- Seulement les admins **peuvent créer/modifier/supprimer**

---

## 🚨 Erreurs Courantes & Solutions

### ❌ "Erreur 403 - Permission denied"

**Cause :** Vous n'êtes pas admin

**Solution :**

```sql
-- Dans Supabase SQL Editor, mettez à jour votre profil :
UPDATE profiles
SET role = 'admin'
WHERE id = 'YOUR_USER_ID';
```

### ❌ "Lecteur YouTube vide / "Vidéo non disponible"

**Cause :** ID YouTube invalide

**Solutions :**

- Vérifiez que l'ID a **exactement 11 caractères**
- Vérifiez que la vidéo n'est **pas privée/non listée**
- Testez l'URL directement : `https://youtube.com/watch?v=YOUR_ID`

### ❌ "Lecteur audio ne joue pas"

**Cause :** Format audio non supporté ou URL invalide

**Solutions :**

- Testez l'URL dans un lecteur : `<audio src="URL" controls>`
- Vérifiez que le serveur **autorise CORS**
- Utilisez un format **MP3 ou M3U8 (HLS)**

### ❌ "Le bouton 'Regarder' ne s'affiche pas"

**Cause :** Utilisateur non connecté

**Contexte :** C'est normal ! Le bouton est **volontairement caché** pour les non-connectés, avec un message "Vous devez être connecté".

---

## 📱 Responsive Design

Tous les composants sont **fully responsive** :

| Device                 | Affichage                         |
| ---------------------- | --------------------------------- |
| 📱 Mobile (< 640px)    | Stack vertical, bouton full-width |
| 📱 Tablet (640-1024px) | 2 colonnes, layout adapté         |
| 💻 Desktop (> 1024px)  | Layout optimal, espacés           |

**Les lecteurs vidéo/audio** :

- YouTube : responsive automatique (iframe)
- Audio : s'adapte à la largeur du modal

---

## 🎯 Checklist de Déploiement

Avant le **1er février 2026** :

- [ ] Table SQL créée dans Supabase
- [ ] Routes `/live` et `/admin/live` présentes
- [ ] Au moins un direct test créé par un admin
- [ ] Test accès avec utilisateur non-connecté → Voit la bannière, ne peut pas cliquer
- [ ] Test accès avec utilisateur connecté → Peut regarder/écouter
- [ ] Test modal ouverture → Lecteur s'affiche correctement
- [ ] Test YouTube → Vidéo charge
- [ ] Test Radio/Audio → Lecteur charge
- [ ] Test responsiveness → Marche sur mobile/tablet/desktop

---

## 🎉 C'est Prêt !

Le système est **production-ready** pour le test du 1er février 2026.
Tous les fichiers sont générés, les fonctions sont intégrées, et le design suit la charte graphique du projet.

**Bonne diffusion !** 🎬📺🎙️
