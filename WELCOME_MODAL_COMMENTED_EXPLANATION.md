/\*\*

- ============================================================================
- 🎯 MODAL DE BIENVENUE AUTOMATIQUE - IMPLÉMENTATION
- ============================================================================
-
- Ce fichier explique comment le modal de bienvenue fonctionne dans
- src/pages/Index.tsx
-
- PROBLÈME RÉSOLU:
- ────────────────
- Afficher un modal UNE SEULE FOIS lors du chargement initial de la page /,
- sans qu'il réapparaisse lors de navigation interne (soft navigation).
-
- SOLUTION IMPLÉMENTÉE:
- ────────────────────
- Utiliser la combinaison de:
- 1.  Performance Navigation Timing API (détecter "hard" vs "soft" navigation)
- 2.  sessionStorage (mémoriser l'état pendant la session)
-
- ============================================================================
  \*/

// 1️⃣ IMPORT DU COMPOSANT MODAL
// ────────────────────────────────────────────────────────────────────────────
// import WelcomeModal from "@/components/WelcomeModal";
//
// Le composant WelcomeModal.tsx affiche le modal avec:
// - Un message de bienvenue personnalisé
// - Deux boutons: "Explorez" et "Plus tard"
// - Design épuré et responsive

// 2️⃣ STATE MANAGEMENT
// ────────────────────────────────────────────────────────────────────────────
// const [showWelcomeModal, setShowWelcomeModal] = useState(false);
//
// Cet état contrôle l'affichage/masquage du modal.
// Valeur initiale: false (modal caché jusqu'à la détection du chargement)

// 3️⃣ LOGIQUE DE DÉTECTION (useEffect)
// ────────────────────────────────────────────────────────────────────────────

/\*\*

- useEffect(() => {
- const SESSION_STORAGE_KEY = 'hasSeenHomepageWelcomeModal';
-
- // ÉTAPE 1: Vérifier si l'utilisateur a déjà vu le modal cette session
- const hasSeenModal = sessionStorage.getItem(SESSION_STORAGE_KEY);
-
- if (!hasSeenModal) {
-     // L'utilisateur n'a pas vu le modal cette session, on continue...
-
-     // ÉTAPE 2: Déterminer le type de navigation
-     const navEntries = performance.getEntriesByType('navigation');
-
-     if (navEntries.length > 0) {
-       const navEntry = navEntries[0] as PerformanceNavigationTiming;
-
-       // TYPES DE NAVIGATION:
-       // ──────────────────
-       // "navigate"      : Accès direct (URL ou lien externe)
-       // "reload"        : Rafraîchissement (F5, Ctrl+R)
-       // "back_forward"  : Bouton retour/avant du navigateur
-       // "prerender"     : Préchargement
-
-       if (navEntry.type === 'navigate' || navEntry.type === 'reload') {
-         // ÉTAPE 3: C'est une navigation "dure" → Afficher le modal
-         setShowWelcomeModal(true);
-
-         // ÉTAPE 4: Mémoriser que l'utilisateur a vu le modal
-         sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
-       }
-     } else {
-       // Fallback: pas d'entrées de navigation → Afficher le modal par défaut
-       setShowWelcomeModal(true);
-       sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
-     }
- }
- }, []); // Dépendances vides = exécuté UNE SEULE FOIS au montage du composant
  \*/

// 4️⃣ GESTION DE LA FERMETURE
// ────────────────────────────────────────────────────────────────────────────
/\*\*

- const handleWelcomeModalClose = () => {
- console.log('[WelcomeModal] Modal closed by user.');
- setShowWelcomeModal(false);
- };
-
- Cette fonction est appelée quand l'utilisateur:
- - Clique sur "Explorez"
- - Clique sur "Plus tard"
- - Clique sur le "X" pour fermer
-
- Elle cache simplement le modal (le flag sessionStorage reste intact).
  \*/

// 5️⃣ RENDU CONDITIONNEL
// ────────────────────────────────────────────────────────────────────────────
/\*\*

- return (
- <div>
-     {showWelcomeModal && (
-       <WelcomeModal onClose={handleWelcomeModalClose} />
-     )}
-     {/* ...reste de la page... */}
- </div>
- );
-
- Le modal s'affiche UNIQUEMENT si showWelcomeModal === true
  \*/

// ============================================================================
// 🔄 FLUX D'EXÉCUTION DÉTAILLÉ
// ============================================================================

/\*\*

- SCÉNARIO 1: Première visite (F5 ou accès direct)
- ───────────────────────────────────────────────
-
- 1.  Utilisateur accède à http://localhost:5173/
- 2.  Composant Index monte → useEffect exécuté
- 3.  sessionStorage vide → hasSeenModal = null
- 4.  navEntry.type = "navigate"
- 5.  Condition TRUE → setShowWelcomeModal(true)
- 6.  sessionStorage.setItem('hasSeenHomepageWelcomeModal', 'true')
- 7.  ✅ Modal s'affiche
- 8.  Utilisateur clique "Explorez" → handleWelcomeModalClose()
- 9.  setShowWelcomeModal(false) → Modal disparaît
-
-
- SCÉNARIO 2: Navigation interne (clic sur "Vidéos" puis retour)
- ──────────────────────────────────────────────────────────────
-
- 1.  Utilisateur est sur / avec modal fermé
- 2.  sessionStorage = { hasSeenHomepageWelcomeModal: 'true' }
- 3.  Clic sur "Vidéos" → Navigation à /videos
- 4.  Retour à / via clic sur "Accueil"
- 5.  Composant Index monte MAIS...
- 6.  sessionStorage.getItem() retourne 'true'
- 7.  Condition hasSeenModal === true
- 8.  useEffect ne fait rien
- 9.  ❌ Modal n'apparaît PAS
-
-
- SCÉNARIO 3: Rafraîchissement (F5) après navigation
- ─────────────────────────────────────────────────
-
- 1.  Utilisateur sur /videos avec modal fermé
- 2.  Appuie sur F5
- 3.  Nouvelle requête serveur → sessionStorage VIDÉ
- 4.  Redirection à / (ou page actuelle)
- 5.  Composant Index monte
- 6.  sessionStorage vide → hasSeenModal = null
- 7.  navEntry.type = "reload"
- 8.  Condition TRUE → setShowWelcomeModal(true)
- 9.  ✅ Modal s'affiche à nouveau
-
-
- SCÉNARIO 4: Nouvel onglet
- ─────────────────────────
-
- 1.  Utilisateur ouvre nouvel onglet (Ctrl+T)
- 2.  Navigue vers http://localhost:5173/
- 3.  Nouvel onglet = nouveau sessionStorage indépendant
- 4.  sessionStorage vide → hasSeenModal = null
- 5.  navEntry.type = "navigate"
- 6.  Condition TRUE → setShowWelcomeModal(true)
- 7.  ✅ Modal s'affiche dans le nouvel onglet
- 8.  Onglet original: modal reste fermé (sessionStorage local à chaque onglet)
      \*/

// ============================================================================
// 🐛 DEBUGGING AVEC LOGS CONSOLE
// ============================================================================

/\*\*

- Logs à rechercher en Console (F12):
-
- ✅ Affichage modal:
- [WelcomeModal] Hard navigation detected (navigate). Showing modal.
- [WelcomeModal] Hard navigation detected (reload). Showing modal.
-
- ❌ Non-affichage modal:
- [WelcomeModal] User already saw modal in this session. Not showing.
- [WelcomeModal] Soft navigation detected (back_forward).
-
- ℹ️ Fermeture:
- [WelcomeModal] Modal closed by user.
-
- ⚠️ Fallback:
- [WelcomeModal] No navigation entries. Assuming hard load, showing modal.
  \*/

// ============================================================================
// 🎨 PERSONNALISATION
// ============================================================================

/\*\*

- Pour modifier le contenu du modal, éditer:
- → src/components/WelcomeModal.tsx
-
- Options possibles:
-
- 1.  Changer le texte de bienvenue:
- <h3>Votre texte personnalisé</h3>
-
- 2.  Ajouter une image:
- <img src="/images/banner.png" alt="Welcome" />
-
- 3.  Changer les couleurs:
- className="bg-gradient-to-r from-BLUE-600 to-BLUE-700"
- → Remplacer "BLUE" par "RED", "PURPLE", etc.
-
- 4.  Ajouter des liens:
- <a href="/videos">Voir les vidéos</a>
-
- 5.  Modifier la durée de mémorisation:
- - sessionStorage: Une session (actuel)
- - localStorage: 7 jours (ajouter date d'expiration)
    \*/

// ============================================================================
// 📚 RESSOURCES & DOCUMENTATION
// ============================================================================

/\*\*

- MDN Web Docs:
- - Performance Navigation Timing:
- https://developer.mozilla.org/en-US/docs/Web/API/Performance/getEntriesByType
-
- - sessionStorage:
- https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage
-
- - React useEffect:
- https://react.dev/reference/react/useEffect
-
-
- Fichiers du projet:
- - WelcomeModal.tsx : Composant modal
- - Index.tsx : Logique et rendu
- - WELCOME_MODAL_GUIDE.md : Guide détaillé
- - WELCOME_MODAL_TEST_PROCEDURE.md : Procédure de test
    \*/

// ============================================================================
// ✅ CHECKLIST D'IMPLÉMENTATION
// ============================================================================

/\*\*

- ✅ Composant WelcomeModal.tsx créé
- ✅ Import dans Index.tsx ajouté
- ✅ State showWelcomeModal déclaré
- ✅ useEffect avec performance API implémenté
- ✅ sessionStorage pour mémorisation ajouté
- ✅ Handler onClose pour fermeture ajouté
- ✅ Rendu conditionnel dans le JSX ajouté
- ✅ Logs console pour déboguer ajoutés
- ✅ Tests manuels exécutés
- ✅ Documentation écrite
- ✅ Aucune erreur TypeScript/ESLint
  \*/

// ============================================================================
// FIN
// ============================================================================
