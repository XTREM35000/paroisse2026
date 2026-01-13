# 🧾 DEVIS N° PAROISSE-001-2025
## Application "Site Paroissial" - Version Essentielle

**Date du devis :** 13 janvier 2026  
**Validité de l'offre :** 31 janvier 2026  
**Client :** Paroisse / Diocèse  
**Budget Total HT :** **150 000 FCFA** (Cent cinquante mille francs CFA)

---

## 📋 **RÉSUMÉ EXÉCUTIF**

Ce devis présente une **estimation complète et réaliste** pour le développement d'une application "Site Paroissial" entièrement fonctionnelle, respectant strictement le **budget contraint de 150 000 FCFA**.

### **Engagement du prestataire :**
✅ **Budget respecté rigoureusement** : Le total est exactement de 150 000 FCFA (hors taxes)  
✅ **Phasage aligné** : 3 phases liées aux dates de paiement convenues  
✅ **Priorisation intelligente** : Focus sur le MVP (Minimum Viable Product) avec fonctionnalités essentielles  
✅ **Stack technologique optimisée** : React + TypeScript, Supabase (BaaS), Tailwind CSS, Shadcn/ui

### **Durée estimée :**
- **12 jours/homme** répartis sur ~4 semaines (20 décembre 2025 → 20 janvier 2026)
- Taux forfaitaire moyen : **12 500 FCFA/jour** (ajusté au budget global)

---

## 💰 **TABLEAU DE FACTURATION DÉTAILLÉ**

| **Phase** | **Période** | **Modules / Tâches Clés** | **Jours/h** | **Montant FCFA** | **Jalons** |
|-----------|-----------|--------------------------|-----------|-----------------|-----------|
| **Phase 1 : Base & Authentification** | 20 Dec - 28 Dec | Setup projet Vite + React/TS, Supabase init, Auth (signup/login/forgot), profils basiques, RLS simple | 5 j/h | **75 000** | Livraison 28 décembre |
| **Phase 2 : Admin Core & Contenu** | 29 Dec - 10 Jan | Dashboard admin simplifié, gestion utilisateurs, CRUD vidéos/galerie allégé, page éditable (1 page) | 4 j/h | **37 500** | Livraison 10 janvier |
| **Phase 3 : Finalisation & Déploiement** | 11 Jan - 20 Jan | Tests, corrections, déploiement Vercel, documentation basique, support initial (3 jours) | 3 j/h | **37 500** | Livraison finale 20 janvier |
| | | | |
| **TOTAL GÉNÉRAL** | | **Application "Site Paroissial" - Version Essentielle** | **12 j/h** | **150 000 FCFA** | Complétude à J+31 |

---

## 📦 **MODULES & FONCTIONNALITÉS INCLUSES**

### **✅ PHASE 1 : INFRASTRUCTURE & AUTHENTIFICATION (75 000 FCFA)**
**Durée : 5 jours/homme | Livraison : 28 décembre 2025**

#### **1.1 Setup Initial Projet**
- ✅ Configuration Vite + React 18 + TypeScript
- ✅ Intégration Tailwind CSS (thème minimal)
- ✅ Routing React Router v6 (5-7 pages)
- ✅ Structure de base layout (Header + Sidebar + Footer)
- ✅ Intégration de 5-8 composants Shadcn/ui critiques (Button, Input, Card, Modal, Tabs, Avatar, etc.)
- ✅ Variables CSS thème global (dark/light mode)

#### **1.2 Supabase Integration Basique**
- ✅ Projet Supabase créé et configuré
- ✅ PostgreSQL DB schema minimal (users, profiles, videos, gallery)
- ✅ Row Level Security (RLS) simplifié (2 rôles : Membre, Admin)
- ✅ Storage bucket pour avatars (1 bucket)
- ✅ Storage bucket pour vidéos/galerie (1 bucket)

#### **1.3 Système d'Authentification**
- ✅ **Inscription (Signup)** : Email + mot de passe, formulaire basique
- ✅ **Connexion (Login)** : Email/mot de passe standard
- ✅ **Email de confirmation** : Template minimal (texte simple)
- ✅ **Mot de passe oublié** : Flux "reset link" standard
- ✅ **Profils utilisateurs** : Table profiles basique (full_name, email, avatar_url, phone, role, created_at)
- ✅ **Système de rôles** : 2 rôles → Membre, Admin (extensible à 4 : Membre, Modérateur, Prêtre, Diacre)
- ✅ **Gestion des sessions** : Auth context React hook
- ✅ **Avatar optionnel** : Upload simple, stockage Supabase

#### **1.4 Sécurité Minimale**
- ✅ RLS pour tables critiques (profiles, videos, gallery)
- ✅ JWT tokens Supabase
- ✅ Validation formulaires côté client
- ✅ Protection des routes (redirection si non-authentifié)

---

### **✅ PHASE 2 : ADMINISTRATION & CONTENU (37 500 FCFA)**
**Durée : 4 jours/homme | Livraison : 10 janvier 2026**

#### **2.1 Dashboard Admin Allégé**
- ✅ Page admin `/admin` protégée (accès Admin uniquement)
- ✅ Vue d'ensemble (stats basiques) :
  - Nombre d'utilisateurs
  - Nombre de vidéos
  - Nombre de galeries
  - Derniers inscrits (5 derniers)
- ✅ Navigation simple dans l'admin (5-6 sections)
- ✅ Pas de graphiques complexes, stats texte/nombres simples

#### **2.2 Gestion des Utilisateurs**
- ✅ Liste des utilisateurs avec recherche basique
- ✅ Affichage : Email, Nom, Rôle, Date d'inscription
- ✅ Changer le rôle (dropdown : Membre → Admin, Admin → Membre)
- ✅ Désactiver/activer un utilisateur (soft delete)
- ✅ Suppression (optionnel, peut être différé)
- ✅ Pas de bulk actions, gestion 1 par 1

#### **2.3 Gestion des Vidéos (CRUD Simplifié)**
- ✅ Ajouter une vidéo : URL YouTube/Vimeo + titre + description basique
- ✅ Lister les vidéos : Tableau simple (Titre, URL, Date, Actions)
- ✅ Éditer vidéo : Titre, description, URL
- ✅ Supprimer une vidéo
- ✅ **EXCLU pour budget :** Catégories, tags avancés, transcoding, sous-titres, analytics vidéo

#### **2.4 Gestion de la Galerie (Upload Simple)**
- ✅ Upload d'images (JPG, PNG) → Supabase Storage
- ✅ Affichage en grille simple (3-4 colonnes)
- ✅ Édition : Titre image, description
- ✅ Suppression image
- ✅ **EXCLU pour budget :** Albums multiples, tri avancé, lightbox animée, compression côté serveur

#### **2.5 Pages Éditables (Très Simplifié)**
- ✅ **1 page dynamique SEULEMENT : Page d'Accueil (/)**
- ✅ Éditeur texte simple (pas WYSIWYG complexe)
- ✅ Modification du contenu principal + sous-titre
- ✅ Sauvegarde en BDD
- ✅ **EXCLU pour budget :** Pages multiples, éditeur riche, blocs personnalisés, templates avancés

---

### **✅ PHASE 3 : FINALISATION & MISE EN LIGNE (37 500 FCFA)**
**Durée : 3 jours/homme | Livraison : 20 janvier 2026**

#### **3.1 Pages Publiques Essentielles**
- ✅ Page d'Accueil (/)
- ✅ Page Galerie publique (/gallery)
- ✅ Page Vidéos publique (/videos)
- ✅ Page Profil utilisateur (/profile)
- ✅ Page Authentification (/auth)
- ✅ Page Conditions & Confidentialité (statiques)
- ✅ Page de Contact (formulaire basique → email)

#### **3.2 Tests & Corrections**
- ✅ Tests fonctionnels (smoke tests)
- ✅ Vérification RLS et authentification
- ✅ Tests mobiles (responsive design)
- ✅ Vérification uploads/storage
- ✅ Corrections bugs prioritaires
- ✅ **NOTE :** Tests unitaires/e2e NON inclus (gain de budget)

#### **3.3 Déploiement**
- ✅ Déploiement frontend : Vercel (gratuit)
- ✅ Configuration domaine (pointage DNS)
- ✅ Variables d'environnement (.env setup)
- ✅ SSL/HTTPS automatique
- ✅ **NOTE :** Backend sur Supabase (BaaS, pas de server à déployer)

#### **3.4 Documentation Minimale**
- ✅ README.md : Installation locale, stack utilisé
- ✅ Guide admin : Comment utiliser le dashboard (1-2 pages)
- ✅ Document de structure BDD (schema tables)
- ✅ **EXCLU pour budget :** Documentation complète, diagrammes détaillés, API docs

#### **3.5 Support Initial (3 jours inclus)**
- ✅ Support post-livraison : 3 jours (jusqu'au 23 janvier 2026)
- ✅ Corrections bugs critiques uniquement
- ✅ Assistance déploiement/configuration
- ✅ **APRÈS 3 jours :** Contrat de support séparé ou cessation

---

## ⚠️ **EXCLUSIONS & RÉDUCTIONS POUR BUDGET**

Pour respecter le **plafond strict de 150 000 FCFA**, les éléments suivants sont **EXCLU** ou **FORTEMENT RÉDUIT** :

### **❌ EXCLU COMPLÈTEMENT :**
- ❌ **Chat/Messagerie** : Trop complexe, RLS, real-time
- ❌ **Système d'événements** : Calendrier, inscriptions, notifications
- ❌ **Module de dons/paiements** : Intégration Stripe/Wave complexe
- ❌ **Modération avancée** : Signalements, appels d'offre, workflows
- ❌ **Animations UI poussées** : Parallax, 3D, transitions élaborées
- ❌ **Multi-langue** : Support i18n complexe
- ❌ **SEO avancé** : Sitemaps dynamiques, meta-tags personnalisés
- ❌ **Analytics** : Google Analytics, Mixpanel
- ❌ **Recherche avancée** : Full-text search, filtres multiples
- ❌ **Email marketing** : Newsletters, campagnes
- ❌ **Intégrations tierces** : Slack, Zapier, webhooks
- ❌ **Tests automatisés** : Unit tests, E2E tests, CI/CD
- ❌ **Optimisation images** : CDN, compression serveur, WEBP
- ❌ **Caching avancé** : Redis, query caching
- ❌ **Système de log/monitoring** : Sentry, logs centralisés

### **⚠️ RÉDUIT AU MINIMUM :**
- ⚠️ **Éditeur pages** : 1 seule page (accueil) vs. système full-page-builder
- ⚠️ **Galerie** : Upload simple, pas d'albums, pas de lightbox animée
- ⚠️ **Design** : Thème simple, pas de design custom élaboré
- ⚠️ **Animations** : Entrées/sorties basiques (Framer Motion minimaliste)
- ⚠️ **Documentation** : Minimale (README + guide utilisateur)
- ⚠️ **Support** : 3 jours seulement post-livraison
- ⚠️ **Performance** : Optimisation basique, pas d'audit Lighthouse
- ⚠️ **Accessibilité** : Support WCAG basique, pas d'audit a11y complet
- ⚠️ **Rôles** : 2 rôles (Membre, Admin) vs. 4+ rôles complexes avec permissions granulaires

---

## 📅 **PLAN DE PHASAGE & CALENDRIER**

```
╔════════════════════════════════════════════════════════════════╗
║          CALENDRIER DE DÉVELOPPEMENT & PAIEMENTS              ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  PHASE 1 : Infrastructure & Auth                              ║
║  ├─ Dates : 20 Dec 2025 → 28 Dec 2025 (5 j/h)                ║
║  ├─ Livrables : Setup complet, Auth, DB schema                ║
║  └─ Jarlon : Dépôt GitHub, environnement de dev prêt          ║
║                                                                ║
║  💰 PAIEMENT #1 (50% = 75 000 FCFA)                            ║
║     À la signature / 20 décembre 2025                         ║
║                                                                ║
║ ─────────────────────────────────────────────────────────────  ║
║                                                                ║
║  PHASE 2 : Admin & Contenu                                    ║
║  ├─ Dates : 29 Dec 2025 → 10 Jan 2026 (4 j/h)                ║
║  ├─ Livrables : Admin panel, CRUD vidéos/galerie              ║
║  └─ Jalon : Fonctionnalités admin testées                     ║
║                                                                ║
║  💰 PAIEMENT #2 (25% = 37 500 FCFA)                            ║
║     Le 15 janvier 2026                                        ║
║                                                                ║
║ ─────────────────────────────────────────────────────────────  ║
║                                                                ║
║  PHASE 3 : Finalisation & Déploiement                         ║
║  ├─ Dates : 11 Jan → 20 Jan 2026 (3 j/h)                     ║
║  ├─ Livrables : Application complète en production            ║
║  └─ Jalon : Site live, accès client, doc fournie              ║
║                                                                ║
║  SUPPORT INITIAL : 20-23 Jan (3 jours inclus)                 ║
║                                                                ║
║  💰 PAIEMENT #3 (25% = 37 500 FCFA)                            ║
║     À la remise du projet final (~20 janvier 2026)            ║
║                                                                ║
║ ─────────────────────────────────────────────────────────────  ║
║                                                                ║
║  TOTAL PROJET : 12 j/h = 150 000 FCFA                         ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

---

## 💵 **MODALITÉS DE PAIEMENT**

| **Échéance** | **Description** | **Pourcentage** | **Montant FCFA** | **Date** |
|------------|---------------|-----------------|-----------------|---------|
| **Versement 1** | À la signature / Commencement des travaux | 50% | **75 000** | 20 décembre 2025 |
| **Versement 2** | Mi-parcours / Fin Phase 2 | 25% | **37 500** | 15 janvier 2026 |
| **Versement 3** | À la remise du projet final | 25% | **37 500** | ~20 janvier 2026 |
| **TOTAL** | | **100%** | **150 000 FCFA** | |

### **Conditions de paiement :**
- ✅ Facture fournie à chaque versement
- ✅ Compte bancaire fourni par le prestataire
- ✅ Délai de virement : 48h recommandé
- ✅ Support technique inclus 3 jours post-livraison

---

## 🛠️ **STACK TECHNIQUE UTILISÉ**

| **Composant** | **Technologie** | **Justification Budget** |
|--------------|-----------------|------------------------|
| **Frontend** | React 18 + TypeScript | Stack moderne, développement rapide, réutilisation composants |
| **Build Tool** | Vite | Compilation ultra-rapide, gain de temps |
| **Styling** | Tailwind CSS | Utilitaire, pas de designer graphique nécessaire |
| **Composants UI** | Shadcn/ui (8-10 comps) | Pré-built, WCAG, design cohérent |
| **Animations** | Framer Motion (basique) | Entrées/sorties légères, pas d'animations complexes |
| **Backend/BaaS** | Supabase | Pas de serveur custom, RLS intégré, auth native, storage |
| **Database** | PostgreSQL (Supabase) | Relationnel, requêtes RLS optimisées |
| **Authentification** | Supabase Auth | Email/password, JWT, refresh tokens natifs |
| **Storage** | Supabase Storage + Vercel | Images/vidéos, déploiement gratuit |
| **Déploiement** | Vercel | Gratuit, CI/CD simple, SSL inclus |
| **Version Control** | Git + GitHub | Standard, tracabilité |

### **Coût des outils :**
- ✅ Tous les outils utilisés = **GRATUIT** ou dans plan gratuit
- ✅ Supabase : Gratuit jusqu'à 50k requêtes/mois (largement suffisant MVP)
- ✅ Vercel : Gratuit pour déploiement statique React
- ✅ GitHub : Gratuit (public ou private avec compte perso)

---

## 🎯 **HYPOTHÈSES DE RÉALISATION**

1. **Accès client fourni promptement** : Email, password pour test, accès Supabase dashboard (recommandé)
2. **Contenu initialement fourni** : Client doit fournir textes, images, vidéos (liens YouTube min.)
3. **Pas de design personnalisé élaboré** : Theme Tailwind de base, pas de designer graphique
4. **Communication asynchrone** : Email/Slack, pas de réunions quotidiennes (gain de coût)
5. **Domaine & email client** : A préparer par le client (not included dans prestation)
6. **Responsabilités partagées** :
   - **Prestataire :** Développement, déploiement, support 3j
   - **Client :** Configuration serveur email, gestion domaine, modération contenu post-launch
7. **Changements de scope** : Tout ajout au MVP entraîne devis supplémentaire

---

## ✅ **LIVRABLES FINAUX**

À la fin du projet (20 janvier 2026), le client reçoit :

1. ✅ **Application web fonctionnelle** (site live sur domaine client)
2. ✅ **Code source complet** (dépôt GitHub privé)
3. ✅ **Guide d'administration** (1-2 pages PDF)
4. ✅ **Documentation technique** (README, setup local)
5. ✅ **Accès Supabase** (tableau de bord BDD)
6. ✅ **Accès Vercel** (pour redéploiement)
7. ✅ **Support 3 jours** (corrections bugs critiques)

---

## 📌 **CONDITIONS GÉNÉRALES**

### **Validité du devis :** 31 janvier 2026
*Passé cette date, une nouvelle estimation sera nécessaire.*

### **Modifications de scope :**
Tout changement significatif au cahier des charges imposera un **devis modificatif** et ajustement des délais.

### **Propriété du code :**
✅ Code source appartient au client  
✅ Droit d'utilisation des libs open-source respecté  
✅ Pas de code propriétaire réutilisable ailleurs

### **Garantie :**
- ✅ Code livré en état fonctionnel (testé)
- ✅ Support critique 3 jours post-livraison
- ✅ Bugs non-critiques : devis de correction séparé

### **Force majeure :**
En cas de force majeure (problème Supabase, internet, etc.), délais réajustés par accord mutuel.

---

## 🤝 **ENGAGEMENT PRESTATAIRE**

✅ **Je m'engage à :**
- Respecter rigoureusement le budget de **150 000 FCFA** (pas de dépassement)
- Livrer les phases aux dates prévues (±3 jours max)
- Fournir code de qualité, sécurisé, performant
- Assurer support 3 jours post-livraison
- Documenter le minimum requis

❌ **Hors du périmètre (demandé = devis additif) :**
- Modifications substantielles après Phase 1
- Modules non inclus (chat, événements, paiements, etc.)
- Support après 3 jours
- Optimisation fine (lighthouse A+, animations élaborées)

---

## 📞 **CONTACT & ACCEPTATION**

**Pour accepter ce devis :**

1. Approuver les 3 versements (75k → 37.5k → 37.5k)
2. Valider les exclusions et réductions de scope
3. Fournir accès domaine (si disponible)
4. Signer document "Bon de commande" ci-joint

**Contact prestataire :**
- 📧 Email : [À fournir]
- 📱 Téléphone : [À fournir]
- 💬 Slack/WhatsApp : [À fournir]

---

**Date établissement : 13 janvier 2026**  
**Signature prestataire : _________________________ Date : _____**  
**Signature client : _________________________ Date : _____**

---

**🎯 Ce devis garantit une application "Site Paroissial" entièrement fonctionnelle, sécurisée, et maintenable, dans le budget convenu de 150 000 FCFA. L'application sera prête à l'emploi, extensible pour évolutions futures.**
