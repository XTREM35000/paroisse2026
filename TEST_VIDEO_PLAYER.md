# Guide de Test - Lecteur Vidéo Page Vidéos

## 🧪 Procédure de Test

### Setup Initial

#### 1. Vérifier la compilation

```bash
# Terminal
cd c:\axe\faith-flix
npm run build
# OU
bun run build
```

**Résultat attendu**: ✅ Pas d'erreur TypeScript

#### 2. Lancer le serveur de développement

```bash
npm run dev
# OU
bun run dev
```

**Résultat attendu**:

- ✅ Serveur démarre sans erreur
- ✅ URL: `http://localhost:5173`

#### 3. Vérifier les imports dans la console

Ouvrir `DevTools` (F12) → Console

**Résultat attendu**:

- ✅ Aucune erreur d'import
- ✅ Aucune erreur TypeScript

---

## 📝 Scénarios de Test

### Scénario 1: Lecture Vidéo YouTube

#### Setup

```
1. Créer une vidéo avec:
   - Titre: "Test YouTube"
   - Description: "Test du lecteur"
   - Catégorie: "Sermon"
   - URL vidéo: https://youtube.com/watch?v=dQw4w9WgXcQ
   - Miniature: Charger une image
```

#### Étapes

```
1. Aller à /videos
2. Vérifier que la vidéo apparaît en vignette
3. Cliquer sur la vignette
4. Vérifier que le modal s'ouvre
5. Vérifier que la vidéo YouTube s'affiche
6. Vérifier les infos (titre, description, vues, date)
7. Cliquer sur X pour fermer
8. Vérifier que le modal se ferme
```

#### Résultats attendus

- ✅ Modal s'ouvre au clic
- ✅ Vidéo YouTube se charge
- ✅ Lecture fonctionne
- ✅ Modal se ferme correctement
- ✅ Pas d'erreur console

---

### Scénario 2: Fermeture Modal (Background Click)

#### Étapes

```
1. Ouvrir le modal lecteur (voir Scénario 1)
2. Cliquer sur le fond noir (arrière-plan)
3. Vérifier que le modal se ferme
```

#### Résultats attendus

- ✅ Modal se ferme
- ✅ Page vidéos reste accessible
- ✅ État réinitialisé

---

### Scénario 3: Responsive Desktop

#### Étapes

```
1. Ouvrir la page /videos sur Desktop (1920x1080)
2. Ouvrir une vidéo
3. Vérifier la taille du modal (max-w-2xl)
4. Vérifier que la vidéo remplit bien l'espace
5. Dragguer le modal avec la souris
6. Vérifier que le modal se déplace
```

#### Résultats attendus

- ✅ Modal centered
- ✅ Taille appropriée
- ✅ Draggable fonctionnel
- ✅ Aspect ratio 16:9 respecté

---

### Scénario 4: Responsive Tablette

#### Étapes

```
1. Ouvrir la page /videos sur Tablette (768x1024)
2. Ouvrir une vidéo
3. Vérifier la taille du modal (responsive)
4. Vérifier la lisibilité du titre et description
5. Tester le scroll des commentaires
```

#### Résultats attendus

- ✅ Modal responsive
- ✅ Texte lisible
- ✅ Vidéo bien centrée
- ✅ Pas de débordement

---

### Scénario 5: Responsive Mobile

#### Étapes

```
1. Ouvrir la page /videos sur Mobile (375x667)
2. Ouvrir une vidéo
3. Vérifier que le modal prend la majorité du viewport
4. Vérifier le padding et les marges
5. Tester la fermeture avec X
```

#### Résultats attendus

- ✅ Full viewport (moins padding)
- ✅ Aspect ratio 16:9 conservé
- ✅ Tous les contrôles accessibles
- ✅ Pas de scroll horizontal

---

### Scénario 6: Vidéo locale (Supabase Storage)

#### Setup

```
1. Créer une vidéo avec:
   - Titre: "Test Vidéo Locale"
   - Upload une vidéo via formulaire
   - Soumettre
```

#### Étapes

```
1. Vérifier que la vidéo apparaît dans la liste
2. Cliquer sur la vignette
3. Vérifier que le modal s'ouvre
4. Vérifier que la vidéo se charge (barre de progression)
5. Vérifier que la lecture fonctionne
```

#### Résultats attendus

- ✅ Vidéo chargeuse depuis Storage
- ✅ Lecteur HTML5 fonctionne
- ✅ Contrôles vidéo accessibles
- ✅ Pas d'erreur CORS

---

### Scénario 7: Vimeo

#### Setup

```
1. Créer une vidéo avec:
   - Titre: "Test Vimeo"
   - URL vidéo: https://vimeo.com/123456
```

#### Étapes

```
1. Ouvrir la vidéo
2. Vérifier le lecteur Vimeo s'affiche
3. Vérifier les contrôles Vimeo
```

#### Résultats attendus

- ✅ Lecteur Vimeo se charge
- ✅ Lecture fonctionne
- ✅ Pas d'erreur

---

### Scénario 8: Navigation Catégories

#### Étapes

```
1. Aller à /videos
2. Cliquer sur "Sermon" (catégorie)
3. Ouvrir une vidéo Sermon
4. Vérifier le lecteur fonctionne
5. Fermer
6. Cliquer sur "Musique"
7. Ouvrir une vidéo Musique
8. Vérifier le lecteur fonctionne
```

#### Résultats attendus

- ✅ Filtrage catégories fonctionne
- ✅ Lecteur fonctionne avec tous les filtres
- ✅ State vidéo se réinitialise correctement

---

### Scénario 9: Recherche Vidéos

#### Étapes

```
1. Aller à /videos
2. Taper "test" dans la recherche
3. Cliquer sur une vidéo trouvée
4. Vérifier le lecteur s'ouvre
```

#### Résultats attendus

- ✅ Recherche filtre correctement
- ✅ Lecteur fonctionne avec résultats filtrés

---

### Scénario 10: Actions Admin (Edit/Delete)

#### Étapes

```
1. Connecté comme admin
2. Aller à /videos
3. Hover sur une vidéo
4. Vérifier que les boutons Edit/Delete apparaissent
5. CLIQUER LE BOUTON EDIT (pas la vignette)
6. Modifier la vidéo
7. Sauvegarder
8. Cliquer sur la VIGNETTE (pas Edit)
9. Vérifier que le lecteur s'ouvre
```

#### Résultats attendus

- ✅ Overlay admin apparaît
- ✅ Edit ouvre le formulaire
- ✅ Clic vignette ouvre toujours le lecteur
- ✅ Pas de conflit entre actions

---

## 🐛 Tests de Débogage

### Si le modal ne s'ouvre pas

#### Test 1: Console Logs

```javascript
// Dans DevTools Console, cliquer sur une vidéo
// Vérifier:
// ✅ "📹 Opening player modal for video: [id]" apparaît
```

#### Test 2: Component State

```javascript
// React DevTools → VideosPage
// Vérifier:
// ✅ isPlayerModalOpen passe de false à true
// ✅ selectedVideoForPlayback se remplit
```

#### Test 3: Network

```
// DevTools → Network
// Cliquer sur une vidéo YouTube
// Vérifier:
// ✅ Aucune erreur 4xx/5xx
// ✅ Pas de CORS error
```

### Si la vidéo ne charge pas

#### Test 1: URL Validité

```
// DevTools Console
// Copier l'URL de la vidéo
// Vérifier qu'elle est valide:
// YouTube: https://youtube.com/watch?v=...
// Vimeo: https://vimeo.com/...
// Local: https://[supabase]/storage/v1/object/public/videos/...
```

#### Test 2: Props Component

```javascript
// React DevTools → VideoPlayerModal
// Vérifier props.video:
// ✅ video_url ou video_storage_path est rempli
// ✅ video n'est pas null
// ✅ isOpen={true}
```

---

## ✅ Checklist Final

```
[  ] Compilation sans erreur
[  ] Serveur démarre
[  ] Pas d'erreur console
[  ] YouTube charge
[  ] Vimeo charge (si testé)
[  ] Vidéo locale charge (si testé)
[  ] Modal s'ouvre
[  ] Modal se ferme avec X
[  ] Modal se ferme au background click
[  ] Responsive Desktop
[  ] Responsive Tablette
[  ] Responsive Mobile
[  ] Actions admin ne conflictent pas
[  ] Filtres catégories fonctionnent
[  ] Recherche fonctionne
[  ] Pas de breaking changes
[  ] Performance acceptable
```

---

## 📊 Résultats de Test

Après l'exécution complète des tests, remplir:

| Test               | Statut | Notes |
| ------------------ | ------ | ----- |
| Compilation        | ✅/❌  |       |
| YouTube            | ✅/❌  |       |
| Vimeo              | ✅/❌  |       |
| Vidéo Locale       | ✅/❌  |       |
| Desktop Responsive | ✅/❌  |       |
| Mobile Responsive  | ✅/❌  |       |
| Ouverture Modal    | ✅/❌  |       |
| Fermeture Modal    | ✅/❌  |       |
| Actions Admin      | ✅/❌  |       |
| Performance        | ✅/❌  |       |

---

## 🔗 Ressources Utiles

- Fichier modifié: [VideosPage.tsx](src/pages/VideosPage.tsx)
- Composant lecteur: [VideoPlayerModal.tsx](src/components/VideoPlayerModal.tsx)
- Documentation: [VIDEO_PLAYER_FEATURE.md](VIDEO_PLAYER_FEATURE.md)
- Logs console: Chercher "📹" pour les logs du lecteur
