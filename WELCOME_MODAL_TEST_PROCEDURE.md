# 🧪 Procédure de Test : Modal de Bienvenue

## 📱 Interface du Modal

```
┌─────────────────────────────────────┐
│ Bienvenue sur votre site média en ligne       [✕]  │  ← Header (gradient bleu)
├─────────────────────────────────────┤
│                                     │
│       Heureux de vous revoir ! 🙏   │  ← Titre
│                                     │
│  Découvrez nos dernières vidéos     │  ← Description
│  de messes, homélies, événements    │
│  et bien plus encore.               │
│                                     │
│  Rejoignez notre communauté pour    │
│  rester connecté à votre paroisse.  │
│                                     │
├─────────────────────────────────────┤
│  [  Explorez  ]  [ Plus tard ]      │  ← Boutons
└─────────────────────────────────────┘
```

---

## ✅ Scénario 1 : Affichage au Démarrage

**Titre** : Premier accès à la page d'accueil

**Étapes** :

1. Ouvrir <kbd>F12</kbd> pour afficher la Console
2. Accéder à `http://localhost:5173/`
3. Attendre le chargement complet

**Résultat Attendu** :

- ✅ Modal de bienvenue s'affiche immédiatement
- ✅ Console affiche : `[WelcomeModal] Hard navigation detected (navigate). Showing modal.`
- ✅ Modal est au-dessus des autres éléments (z-50)
- ✅ Fond semi-transparent noir derrière le modal

**Capture Console Attendue** :

```
[WelcomeModal] Hard navigation detected (navigate). Showing modal.
```

---

## ✅ Scénario 2 : Fermeture du Modal

**Titre** : Fermer le modal et continuer

**Étapes** :

1. Depuis le modal ouvert, cliquer sur le bouton "Explorez"
   OU cliquer sur le "X" en haut à droite
   OU cliquer sur "Plus tard"

**Résultat Attendu** :

- ✅ Modal disparaît progressivement (animation fade-out)
- ✅ Console affiche : `[WelcomeModal] Modal closed by user.`
- ✅ Utilisateur voit la page d'accueil normale

**Capture Console Attendue** :

```
[WelcomeModal] Modal closed by user.
```

---

## ✅ Scénario 3 : Navigation Interne (Ne Pas Afficher)

**Titre** : Naviguer vers une autre page puis revenir

**Étapes** :

1. Depuis `/` avec modal fermé
2. Cliquer sur "Vidéos" dans le menu
3. Accéder à `/videos`
4. Dans le menu, cliquer sur le logo "Faith Flix"
   OU cliquer sur "Accueil"
5. Revenir à `/`

**Résultat Attendu** :

- ✅ Le modal n'apparaît PAS
- ✅ Console affiche : `[WelcomeModal] User already saw modal in this session. Not showing.`
- ✅ La page se charge normalement sans modal

**Capture Console Attendue** :

```
[WelcomeModal] User already saw modal in this session. Not showing.
```

---

## ✅ Scénario 4 : Rafraîchissement de la Page

**Titre** : Rafraîchir la page (F5) avec modal déjà fermé

**Étapes** :

1. Depuis `/` avec modal déjà fermé
2. Appuyer sur <kbd>F5</kbd>
   OU <kbd>Ctrl+R</kbd> (Windows/Linux)
   OU <kbd>Cmd+R</kbd> (Mac)
3. Attendre le rechargement

**Résultat Attendu** :

- ✅ Le modal réapparaît
- ✅ Console affiche : `[WelcomeModal] Hard navigation detected (reload). Showing modal.`
- ✅ `sessionStorage` a été vidé avec le rechargement

**Capture Console Attendue** :

```
[WelcomeModal] Hard navigation detected (reload). Showing modal.
```

---

## ✅ Scénario 5 : Nouvel Onglet

**Titre** : Ouvrir un nouvel onglet et accéder à `/`

**Étapes** :

1. Dans le navigateur, ouvrir un nouvel onglet
   - <kbd>Ctrl+T</kbd> (Windows/Linux)
   - <kbd>Cmd+T</kbd> (Mac)
2. Aller à `http://localhost:5173/`
3. Attendre le chargement

**Résultat Attendu** :

- ✅ Le modal s'affiche
- ✅ Console affiche : `[WelcomeModal] Hard navigation detected (navigate). Showing modal.`
- ✅ Raison : Nouvel onglet = nouveau `sessionStorage`

**Capture Console Attendue** :

```
[WelcomeModal] Hard navigation detected (navigate). Showing modal.
```

---

## ✅ Scénario 6 : Bouton Retour du Navigateur

**Titre** : Naviguer avec le bouton "Retour"

**Étapes** :

1. Depuis `/`, cliquer sur "Vidéos"
2. Accéder à `/videos`
3. Cliquer le bouton "Retour" du navigateur
   - ← Flèche en haut à gauche
4. Revenir à `/`

**Résultat Attendu** :

- ❌ Le modal n'apparaît PAS
- ✅ Console affiche : `[WelcomeModal] User already saw modal in this session. Not showing.`
- ✅ Raison : `sessionStorage` n'a pas été vidé

**Capture Console Attendue** :

```
[WelcomeModal] User already saw modal in this session. Not showing.
```

---

## 🔧 Scénario 7 : Forcer l'Affichage (Test de Développement)

**Titre** : Réinitialiser l'état pour voir le modal à nouveau

**Étapes** :

1. Ouvrir la Console <kbd>F12</kbd>
2. Copier-coller ceci :

```javascript
sessionStorage.removeItem('hasSeenHomepageWelcomeModal')
location.reload()
```

3. Appuyer sur <kbd>Entrée</kbd>

**Résultat Attendu** :

- ✅ La page se recharge
- ✅ Le modal réapparaît
- ✅ Comme si c'était la première visite

**Capture Console Attendue** :

```
[WelcomeModal] Hard navigation detected (reload). Showing modal.
```

---

## 🔍 Matrice de Vérification

Imprimer et cocher au fur et à mesure des tests :

```
Test 1 : Premier Accès
  ☐ Modal affiche
  ☐ Console : "Hard navigation detected (navigate)"
  ☐ Animation fade-in visible
  ☐ Boutons cliquables

Test 2 : Fermeture
  ☐ Clic "Explorez" ferme le modal
  ☐ Clic "Plus tard" ferme le modal
  ☐ Clic "X" ferme le modal
  ☐ Console : "Modal closed by user"

Test 3 : Navigation Interne
  ☐ Clic "Vidéos" → pas de modal
  ☐ Retour "Accueil" → pas de modal
  ☐ Console : "User already saw modal"

Test 4 : F5
  ☐ Modal réapparaît après F5
  ☐ Console : "Hard navigation detected (reload)"

Test 5 : Nouvel Onglet
  ☐ Modal affiche dans nouvel onglet
  ☐ Onglet original : modal fermé
  ☐ Chaque onglet indépendant

Test 6 : Bouton Retour
  ☐ Pas de modal lors du retour
  ☐ Console : "User already saw modal"

Test 7 : Force Reset
  ☐ sessionStorage.removeItem() fonctionne
  ☐ Modal réapparaît après reload
```

---

## 🚨 Tests de Cas Limites

### Test : Mobile

- [ ] Ouvrir l'app sur mobile (iOS Safari, Chrome Android)
- [ ] Modal s'affiche correctement
- [ ] Boutons sont cliquables
- [ ] Animation fonctionne

### Test : Vitesse Lente

- [ ] Throttle réseau (Chrome DevTools) à 3G
- [ ] Modal affiche-t-il immédiatement ou attend-il le chargement complet ?
- [ ] Pas de blocage du rendu initial

### Test : Navigateur Ancien

- [ ] Firefox ESR (version 120+)
- [ ] Edge (version 120+)
- [ ] Safari (version 14+)
- [ ] Performance Navigation API supportée ? ✅

---

## 📊 Résumé des Logs Console

| Cas                 | Log Attendu                           |
| ------------------- | ------------------------------------- |
| Accès direct `/`    | `Hard navigation detected (navigate)` |
| F5 / Ctrl+R         | `Hard navigation detected (reload)`   |
| Clic interne        | `User already saw modal`              |
| Bouton Retour       | `User already saw modal`              |
| Fermeture modal     | `Modal closed by user`                |
| sessionStorage vide | `Hard navigation detected...`         |

---

## ✅ Validation Finale

- [ ] Tous les 7 scénarios testés ✅
- [ ] Aucune erreur en console 🟢
- [ ] Animation fluide
- [ ] Responsive design (mobile + desktop)
- [ ] Accessibilité (clavier, screen reader)
- [ ] Performance (pas de lag)

**Status** : 🟢 Prêt pour production

---

**Date de test** : **\*\***\_**\*\***  
**Testeur** : **\*\***\_**\*\***  
**Notes** : **\*\***\_**\*\***
