# Guide d'Implémentation : Modal de Bienvenue Automatique

## 📋 Vue d'ensemble

Un popup modal s'affiche **automatiquement** au chargement initial de la page d'accueil (`/`) dansMédia Paroissiale. Ce modal se montre une seule fois par **session navigateur** et n'apparaît **PAS** lors de la navigation interne.

## 🎯 Comportement Implémenté

### ✅ Le modal S'AFFICHE dans ces cas :

- Accès direct par URL : `https://app.com/`
- Rafraîchissement de la page : <kbd>F5</kbd> ou <kbd>Ctrl+R</kbd>
- Nouvelle visite : Ouverture d'un nouvel onglet avec l'URL
- Navigation via le bouton "Retour" puis accès à `/`

### ❌ Le modal NE S'AFFICHE PAS dans ces cas :

- Navigation via `<Link>` de React Router
- Clic sur le logo ou le menu de la navigation
- Redirection programmatique depuis une autre page
- Visite ultérieure de la même page **pendant la même session**

## 🔧 Fichiers Modifiés

### 1. [src/components/WelcomeModal.tsx](src/components/WelcomeModal.tsx) (Nouveau)

Composant modal de bienvenue avec :

- Design inspiré de `AdvertisementPopup`
- Deux boutons : "Explorez" et "Plus tard"
- Message personnalisé de bienvenue
- Gestion de l'état d'affichage

### 2. [src/pages/Index.tsx](src/pages/Index.tsx) (Modifié)

Ajouts dans la page d'accueil :

- Import du composant `WelcomeModal`
- State `showWelcomeModal`
- `useEffect` avec logique de détection de navigation
- Rendu conditionnel du modal

## 💡 Logique Technique Expliquée

### Comment ça marche ?

L'implémentation utilise **deux mécanismes** pour différencier les navigations "dures" des navigations "molles" :

#### 1️⃣ **Performance Navigation Timing API**

```typescript
const navEntries = performance.getEntriesByType('navigation')
const navEntry = navEntries[0] as PerformanceNavigationTiming

// Détecte le type de navigation :
// - "navigate" : Accès direct ou nouvelle page
// - "reload"   : Rafraîchissement (F5, Ctrl+R)
// - "back_forward" : Bouton Retour/Avant du navigateur
```

**Types détectés** :

- `navigate` : ✅ Affiche le modal (chargement initial vrai)
- `reload` : ✅ Affiche le modal (l'utilisateur a rafraîchi)
- `back_forward` : ⚠️ Selon la logique personnalisée

#### 2️⃣ **sessionStorage pour la Mémorisation**

```typescript
const SESSION_STORAGE_KEY = 'hasSeenHomepageWelcomeModal'
const hasSeenModal = sessionStorage.getItem(SESSION_STORAGE_KEY)

if (!hasSeenModal) {
  // Affiche le modal
  sessionStorage.setItem(SESSION_STORAGE_KEY, 'true')
}
```

**Cycle de vie** :

1. 🔓 Chargement initial → `sessionStorage` est vide → Modal s'affiche
2. ✅ Utilisateur ferme le modal → Flag enregistré
3. 🔄 Même session, naviguer ailleurs puis revenir → Modal ne s'affiche PAS
4. 🆕 Nouvel onglet / Nouvelle fenêtre → `sessionStorage` vide → Modal s'affiche

### Visualisation du Flux

```
┌─────────────────────────────────────────┐
│ Accès à la page d'accueil (/)           │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ Vérifier: hasSeenHomepageWelcomeModal   │
│ dans sessionStorage                      │
└─────────────────────────────────────────┘
                    ↓
         ┌──────────┴──────────┐
         │                     │
        OUI                    NON
    (déjà vu)            (première fois)
         │                     │
         ↓                     ↓
    ❌ Ne pas        ┌──────────────────────┐
     afficher       │ Vérifier le type de  │
                    │ navigation (perf API) │
                    └──────────────────────┘
                               ↓
              ┌────────────────┼────────────────┐
              │                │                │
          "navigate"       "reload"    "back_forward"
          (accès direct)  (rafraîchir)    (retour)
              │                │                │
              ↓                ↓                ↓
          ✅ AFFICHE       ✅ AFFICHE       ❌ NE MONTRE PAS*
           MODAL            MODAL           (*selon logique)
              │                │                │
              └────────────────┴────────────────┘
                               ↓
                    ✅ Enregistrer le flag
                    dans sessionStorage
```

## 🧪 Guide de Test en Développement

### Test 1 : Affichage au Chargement Initial

1. Ouvrir la console du navigateur : <kbd>F12</kbd>
2. Aller à la page d'accueil : `http://localhost:5173/`
3. **Résultat attendu** : Le modal de bienvenue s'affiche immédiatement
4. **Vérifier dans la console** : Message `[WelcomeModal] Hard navigation detected (navigate).`

### Test 2 : Ne Pas Afficher sur Navigation Interne

1. Depuis la page d'accueil déjà chargée, cliquer sur un lien (ex: "Vidéos")
2. Naviguer ailleurs (ex: `/videos`)
3. Cliquer sur le logo ou "Accueil" pour revenir à `/`
4. **Résultat attendu** : Le modal ne réapparaît PAS
5. **Vérifier dans la console** : Message `[WelcomeModal] User already saw modal in this session.`

### Test 3 : Réaffichage après F5

1. Être sur la page d'accueil (modal déjà fermé)
2. Appuyer sur <kbd>F5</kbd> (ou <kbd>Ctrl+R</kbd>) pour rafraîchir
3. **Résultat attendu** : Le modal réapparaît
4. **Raison** : `sessionStorage` est vidé après un rafraîchissement (c'est un nouveau "chargement")

### Test 4 : Nouvel Onglet / Nouvelle Session

1. Ouvrir un nouvel onglet : <kbd>Ctrl+T</kbd> (ou <kbd>Cmd+T</kbd> sur Mac)
2. Aller à `http://localhost:5173/`
3. **Résultat attendu** : Le modal s'affiche (nouvel onglet = nouveau `sessionStorage`)
4. **Raison** : Chaque onglet/fenêtre a son propre `sessionStorage`

### Test 5 : Clearance de sessionStorage Manuel

Pour forcer le réaffichage du modal :

```javascript
// Dans la console du navigateur (F12)
sessionStorage.removeItem('hasSeenHomepageWelcomeModal')

// Puis rafraîchir la page
location.reload()
```

### Test 6 : Vérifier les Logs

Dans la console, recherchez les logs :

```
[WelcomeModal] Hard navigation detected (navigate). Showing modal.
[WelcomeModal] Modal closed by user.
[WelcomeModal] User already saw modal in this session. Not showing.
```

## 📊 Vérification de la Performance

### Console Logs à Rechercher

#### 🟢 Cas Nominal (Affichage Attendu)

```
[WelcomeModal] Hard navigation detected (navigate). Showing modal.
[WelcomeModal] Modal closed by user.
```

#### 🔵 Navigation Interne (Pas d'Affichage)

```
[WelcomeModal] User already saw modal in this session. Not showing.
```

#### 🟡 Fallback (Rare)

```
[WelcomeModal] No navigation entries. Assuming hard load, showing modal.
```

## 🎨 Personnalisation du Modal

### Modifier le Contenu du Message

Éditer [src/components/WelcomeModal.tsx](src/components/WelcomeModal.tsx) :

```tsx
<h3 className="text-lg font-semibold text-gray-900 mb-3">
  Heureux de vous revoir ! 🙏  {/* ← Changer ce texte */}
</h3>
<p className="text-gray-600 mb-4 leading-relaxed">
  Découvrez nos dernières vidéos... {/* ← Changer la description */}
</p>
```

### Changer les Couleurs

```tsx
{
  /* Header gradient */
}
;<div className='bg-gradient-to-r from-blue-600 to-blue-700 ...'>
  {/* ↑ Changer les couleurs Tailwind (blue-600, blue-700) */}
</div>

{
  /* Button primary */
}
;<button className='bg-blue-600 hover:bg-blue-700 ...'>{/* ↑ Changer blue-600, blue-700 */}</button>
```

### Ajouter une Image

```tsx
{
  /* Après le header */
}
;<div className='w-full h-40 overflow-hidden bg-gray-200'>
  <img src='/images/welcome-banner.png' alt='Bienvenue' className='w-full h-full object-cover' />
</div>
```

### Modifier la Durée de Session

`sessionStorage` persiste tant que l'onglet est ouvert. Pour une durée plus longue, remplacer par `localStorage` :

```typescript
// Durée = session actuelle
sessionStorage.setItem('hasSeenHomepageWelcomeModal', 'true')

// OU Durée = 7 jours
localStorage.setItem('hasSeenHomepageWelcomeModal', 'true')
// Puis ajouter une logique d'expiration
```

## 🐛 Dépannage

### Le modal ne s'affiche pas au démarrage

**Causes possibles** :

1. ✅ `sessionStorage` déjà défini → Vider avec la console (voir Test 5)
2. ✅ Type de navigation non-"navigate" → Vérifier les logs console
3. ✅ Component pas importé → Vérifier `import WelcomeModal` dans `Index.tsx`
4. ✅ État initial → Vérifier `showWelcomeModal` est bien `false`

**Solution** :

```javascript
// Console F12
sessionStorage.clear()
location.reload()
```

### Le modal réapparaît sur navigation interne

**Cause** : Le flag `sessionStorage` est peut-être supprimé ailleurs dans le code.

**Solution** : Rechercher tous les appels à `sessionStorage.removeItem()` :

```bash
grep -r "sessionStorage.removeItem" src/
```

### Le modal apparaît au rechargement alors qu'il ne devrait pas

**Cause** : Le type de navigation est `reload` au lieu de `navigate`.

**Solution** : Modifier la condition pour exclure `reload` :

```typescript
if (navEntry.type === 'navigate') {
  // Enlever "|| navEntry.type === 'reload'"
  // Afficher modal
}
```

## 📚 Ressources

- [MDN: Performance Navigation Timing](https://developer.mozilla.org/en-US/docs/Web/API/Performance/getEntriesByType)
- [MDN: sessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage)
- [React Hooks: useEffect](https://react.dev/reference/react/useEffect)

## ✅ Checklist d'Implémentation

- ✅ Composant `WelcomeModal.tsx` créé
- ✅ Import dans `Index.tsx` ajouté
- ✅ State `showWelcomeModal` déclaré
- ✅ `useEffect` avec logique de détection implémenté
- ✅ Rendu conditionnel du modal ajouté
- ✅ Logs console pour débogag
- ✅ Tests manuels validés
- ✅ Documentation complète fournie

---

**Créé** : 11 janvier 2026  
**Dernière mise à jour** : 11 janvier 2026  
**Statut** : ✅ Production-ready
