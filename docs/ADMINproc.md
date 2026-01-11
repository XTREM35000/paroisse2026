# 🎛️ GUIDE COMPLET - ADMINISTRATIONMEDIA PAROISSIALE

## 📖 Pour les Utilisateurs Novices

> **Ce guide vous explique comment utiliser chaque option du menu latéral (Sidebar) pour administrer le site.**
> Pas de jargon technique, juste des explications simples et des étapes claires.

---

## 🔐 AVANT DE COMMENCER : ACCÈS À L'ADMINISTRATION

### ✅ Suis-je administrateur ?

1. **Connectez-vous** au site (en haut à droite: "Se connecter")
2. **Regardez le menu latéral** (à gauche)
3. **Vous voyez "Tableau de bord" et "Administration" ?** → ✅ Vous êtes admin
4. **Vous ne les voyez pas ?** → ❌ Contactez le responsable technique

### 📍 Où trouver le menu d'administration ?

```
┌─────────────────────────────────────────────┐
│ SITE MEDIA PAROISSIALE                            │
├─────────────────────────────────────────────┤
│                                             │
│  ← MENU                 ← Votre nom         │
│     LATÉRAL                                 │
│     (Sidebar)           Ici se trouve       │
│                         le menu admin       │
│                                             │
│     ══════════════════════════════════════│
│     ┃ Tableau de bord     👁️              ┃
│     ┃ Analytics           📊              ┃
│     ┃ Médias              🎬              ┃
│     ┃ Culte & Prière      ⛪              ┃
│     ┃ Communauté          👥              ┃
│     ┃ Donations           💰              ┃
│     ┃ Administration      ⚙️               ┃ ← C'EST ICI
│     ══════════════════════════════════════│
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🗺️ STRUCTURE DU MENU LATÉRAL

Le menu est organisé en **6 groupes principaux**.

Voici ce que vous trouverez dans chaque groupe :

---

# 📊 GROUPE 1️⃣ : TABLEAU DE BORD

## 🎛️ Vue d'ensemble (`/dashboard`)

### 🎯 Qu'est-ce que c'est ?

C'est la **page principale** qui montre un **résumé** de ce qui se passe sur le site :

- Combien de visiteurs aujourd'hui ?
- Vidéos récentes ajoutées
- Messages dans le chat
- Statistiques rapides

### 📍 Où le trouver ?

Menu latéral → **Tableau de bord** → **Vue d'ensemble**

### 🖥️ À quoi ça sert ?

```
Imagine une DASHBOARD de voiture:
┌──────────────────────────────────────────┐
│ 🎛️ TABLEAU DE BORDMEDIA PAROISSIALE            │
├──────────────────────────────────────────┤
│                                          │
│ 📊 Visiteurs (ce mois)      : 542       │
│ 🎬 Vidéos publiées           : 23       │
│ 💬 Commentaires modérés      : 12       │
│ 👥 Nouveaux membres          : 8        │
│ 📺 Session live active      : OUI       │
│                                          │
└──────────────────────────────────────────┘

Tous les chiffres importants au même endroit!
```

---

## 📈 Analytics (`/dashboard/analytics`)

### 🎯 Qu'est-ce que c'est ?

Les **statistiques détaillées** du site:

- Graphiques d'activité
- Vidéos les plus regardées
- Tendances du mois
- Engagement des utilisateurs

### 📍 Où le trouver ?

Menu latéral → **Tableau de bord** → **Analytics**

### 🖥️ À quoi ça sert ?

Voir **comment le site se porte** :

```
Exemple de ce que vous verrez:

📈 VISITEURS
   Janvier 2026 : 1,245 visites
   (↗ +12% par rapport à décembre)

🎬 VIDÉOS POPULAIRES
   1. "Messe du dimanche" - 234 vues
   2. "Homilie de Noël" - 189 vues
   3. "Musique sacrée" - 156 vues

💬 ENGAGEMENT
   Commentaires : 45
   Partages : 23
   Réactions : 178

👥 UTILISATEURS
   Nouveaux: 8
   Actifs: 142
   Inactifs: 12
```

### 🤔 Comment interpréter ?

- **Flèche montante ↗** = C'est bon, ça augmente ! 📈
- **Flèche descendante ↘** = À investiguer 📉
- **Chiffres stables →** = Données régulières 📊

---

# 🎬 GROUPE 2️⃣ : MÉDIAS

> Les médias sont tous les **contenus multimédias** du site (vidéos, photos, documents).

## 🎥 Vidéos (`/videos`)

### 🎯 Qu'est-ce que c'est ?

C'est la **galerie de toutes les vidéos** du site (messes, homélies, concerts, etc).

### 📍 Où le trouver ?

Menu latéral → **Médias** → **Vidéos**

### 🖥️ À quoi ça sert ?

**Pour les visiteurs** : Regarder les vidéos
**Pour vous (admin)** : Ajouter, modifier, supprimer des vidéos

### 📐 Structure de la page

```
┌─────────────────────────────────────────────┐
│ 🎬 VIDÉOS                                   │
├─────────────────────────────────────────────┤
│                                             │
│  [🔍 Rechercher...]  [🏷️ Filtrer]          │
│                                             │
│  [Vidéo 1]  [Vidéo 2]  [Vidéo 3]          │
│  - Titre    - Titre    - Titre             │
│  - 234 vues - 189 vues - 156 vues          │
│  - ⭐⭐⭐    - ⭐⭐⭐    - ⭐⭐              │
│                                             │
│  [Vidéo 4]  [Vidéo 5]  [Vidéo 6]          │
│  ...                                       │
│                                             │
└─────────────────────────────────────────────┘
```

### ➕ COMMENT AJOUTER UNE VIDÉO

**Étape 1** : Cliquez sur le **bouton ➕ (en haut à droite)**

**Étape 2** : Remplissez le formulaire

```
📝 Titre
   Ex: "Messe dominicale - 12 janvier 2026"

📄 Description
   Résumé ou notes
   Ex: "Messe avec homilie du Père Martin"

🎬 Fichier vidéo
   Cliquez "Choisir un fichier"
   Formats: MP4, WebM
   Taille max: 500 MB ⚠️

🏷️ Catégorie
   Sélectionnez dans la liste:
   🎤 Sermon / Homilie
   🎵 Musique / Concert
   ⛪ Célébration / Liturgie
   📚 Enseignement / Catéchèse
   📢 Témoignage

🖼️ Image de couverture (optionnel)
   Miniature qui s'affiche dans la galerie
```

**Étape 3** : Cliquez sur **[Publier]** ou **[Brouillon]**

```
[Publier]    → Visible immédiatement ✅
[Brouillon]  → Privée, à modifier plus tard ⏳
```

**Résultat** : ✅ Votre vidéo apparaît dans la galerie

---

## 📸 Photos (`/galerie`)

### 🎯 Qu'est-ce que c'est ?

La **galerie d'albums photos** du site.

Exemple : "Fête paroissiale 2025", "Pèlerinage", "Événements", etc.

### 📍 Où le trouver ?

Menu latéral → **Médias** → **Photos**

### 🖥️ À quoi ça sert ?

- Créer des **albums photos**
- Ajouter des **images** aux albums
- Partager les moments paroissaux en photos

### ➕ CRÉER UN ALBUM

**Étape 1** : Cliquez **[➕ Créer un album]**

**Étape 2** : Remplissez les infos

```
📝 Titre de l'album
   Ex: "Fête paroissiale - Janvier 2026"

📄 Description
   Ex: "Photos de notre belle fête"

🖼️ Image de couverture
   La première photo à afficher

🔒 Visibilité
   ☑️ Public (tout le monde voit)
   ☐ Privé (admins seulement)
```

**Étape 3** : **[Créer]**

### 📸 AJOUTER DES PHOTOS À UN ALBUM

**Étape 1** : Ouvrez l'album

**Étape 2** : Cliquez **[➕ Ajouter des photos]**

**Étape 3** : Sélectionnez les fichiers

```
Formats: JPG, PNG, WebP
Taille max par photo: 10 MB
Vous pouvez en ajouter plusieurs à la fois!
```

**Étape 4** : Attendez le téléchargement et **[Enregistrer]**

---

## 🎙️ Podcasts (`/podcasts`)

### 🎯 Qu'est-ce que c'est ?

Les **fichiers audio** : enseignements, méditations, prières enregistrées.

### 📍 Où le trouver ?

Menu latéral → **Médias** → **Podcasts**

### ➕ AJOUTER UN PODCAST

Même processus que les vidéos :

```
📝 Titre
🎙️ Fichier audio (MP3, WAV, M4A)
📄 Description
🏷️ Catégorie
[Publier]
```

---

## 📄 Documents (`/documents`)

### 🎯 Qu'est-ce que c'est ?

Les **fichiers PDF et documents** : bulletins, prières, guides de lecture, etc.

### 📍 Où le trouver ?

Menu latéral → **Médias** → **Documents**

### ➕ AJOUTER UN DOCUMENT

```
📝 Titre
📄 Fichier (PDF, Word, Excel)
📝 Description courte
🏷️ Catégorie
[Partager]
```

---

# ⛪ GROUPE 3️⃣ : CULTE & PRIÈRE

> C'est tout ce qui concerne la **vie spirituelle** et **liturgique** de la paroisse.

## 📺 Messe en direct (`/live`)

### 🎯 Qu'est-ce que c'est ?

La **page de streaming en direct** pour regarder les messes en temps réel.

### 📍 Où le trouver ?

Menu latéral → **Culte & Prière** → **Messe en direct**

### 🖥️ À quoi ça sert ?

- Regarder la **messe en direct**
- **Discuter** en direct via le chat
- **Partager** la messe avec ceux qui ne peuvent pas venir

### 👥 POUR LES VISITEURS

Ils voient une vidéo de la messe + un chat pour discuter.

### ⚙️ POUR LES ADMINS

Vous pouvez paramétrer cela dans la section **Administration** → **En Ligne**

---

## 🎤 Homélies (`/homilies`)

### 🎯 Qu'est-ce que c'est ?

La **galerie des homélies** (enseignements du prêtre).

### 📍 Où le trouver ?

Menu latéral → **Culte & Prière** → **Homélies**

### 🖥️ À quoi ça sert ?

- **Consulter** les homélies passées
- **Lire** le texte ou écouter la vidéo
- **Partager** avec d'autres

### 📝 POUR AJOUTER UNE HOMÉLIE

Allez dans **Médias** → **Vidéos** et catégorisez en "Sermon/Homilie".

---

## 🙏 Intentions de prière (`/prayers`)

### 🎯 Qu'est-ce que c'est ?

Les **prières de la communauté** que les membres peuvent partager.

### 📍 Où le trouver ?

Menu latéral → **Culte & Prière** → **Intentions de prière**

### 🖥️ À quoi ça sert ?

- Les fidèles demandent des prières
- La communauté les soutient spirituellement
- Vous pouvez modérer les intentions

### 💬 MODÉRER LES INTENTIONS

**Vérifier une intention** :

```
1. Ouvrez l'intention
2. Est-ce approprié ? OUI → ✅ Approuver
3. Est-ce inapproprié ? NON → ❌ Supprimer
```

---

## 📖 Verset du jour (`/verse`)

### 🎯 Qu'est-ce que c'est ?

Un **verset biblique** qui change tous les jours sur la page d'accueil.

### 📍 Où le trouver ?

Menu latéral → **Culte & Prière** → **Verset du jour**

### 🖥️ À quoi ça sert ?

Inspirer et encourager les visiteurs chaque jour.

### ✏️ COMMENT AJOUTER UN VERSET

**Étape 1** : Cliquez sur **[➕ Ajouter un verset]**

**Étape 2** : Remplissez

```
📖 Verset biblique
   Ex: "Jean 3:16"

📝 Texte
   Le verset complet

🏷️ Thème (optionnel)
   Ex: "Espoir", "Amour", "Pardon"

📅 Date
   Quand afficher ce verset?
```

**Étape 3** : **[Publier]**

---

# 💰 GROUPE 5️⃣ : DONATIONS

> Gérer les **dons** et les **campagnes de financement** de la paroisse.

## 💳 Faire un don (`/donate`)

### 🎯 Qu'est-ce que c'est ?

La **page de donation** où les fidèles peuvent donner de l'argent.

### 📍 Où le trouver ?

Menu latéral → **Donations** → **Faire un don**

### 🖥️ À quoi ça sert ?

Permettre aux fidèles de **soutenir financièrement** la paroisse.

### 🎯 POUR LES VISITEURS

Ils voient :

- Montants suggérés (10€, 25€, 50€, 100€, autre)
- Moyens de paiement (Carte bancaire, PayPal, virement)
- Destination du don (général, projet spécifique)

### ⚙️ POUR LES ADMINS

C'est géré dans **Administration** → **Paramètres** (voir section correspondante)

---

## 📊 Campagnes (`/campaigns`)

### 🎯 Qu'est-ce que c'est ?

Les **projets de financement** spécifiques.

Exemple : "Rénovation du toit de l'église", "Acheter des instruments de musique"

### 📍 Où le trouver ?

Menu latéral → **Donations** → **Campagnes**

### 🖥️ À quoi ça sert ?

Mobiliser les fidèles pour un projet spécifique avec un **objectif monétaire**.

```
Exemple de campagne:

┌─────────────────────────────┐
│ 🎯 RÉNOVATION DE L'ÉGLISE   │
├─────────────────────────────┤
│ Objectif: 50 000€           │
│ Collecté: 32 500€ (65%)     │
│                             │
│ ████████████░░░░ 65%        │
│                             │
│ Reste: 17 500€              │
│ [FAIRE UN DON]              │
└─────────────────────────────┘
```

### ➕ CRÉER UNE CAMPAGNE

**Étape 1** : Allez dans **Administration** → **Paramètres**

**Étape 2** : Cliquez **[➕ Nouvelle campagne]**

**Étape 3** : Remplissez

```
📝 Titre
   Ex: "Rénovation du toit"

📄 Description
   Explique pourquoi et comment

💰 Objectif (montant en €)
   Ex: 50000

🖼️ Image
   Photo du projet

📅 Date de fin
   Quand la campagne se termine?
```

**Étape 4** : **[Créer]**

---

## 📜 Historique (`/donations`)

### 🎯 Qu'est-ce que c'est ?

La **liste de tous les dons** reçus.

### 📍 Où le trouver ?

Menu latéral → **Donations** → **Historique**

### 🖥️ À quoi ça sert ?

Voir les donations passées et leur statut.

### 📊 EXEMPLE DE VUE

```
Date       | Donateur    | Montant | Campagne        | Reçu
-----------|-------------|---------|-----------------|--------
12 jan     | Jean D.     | 50€     | Rénovation      | Généré
11 jan     | Marie L.    | 100€    | Général         | Généré
10 jan     | Pierre M.   | 25€     | Instruments     | En attente
```

---

## 🧾 Reçus (`/receipts`)

### 🎯 Qu'est-ce que c'est ?

Les **reçus fiscaux** pour les dons (défiscalisables).

### 📍 Où le trouver ?

Menu latéral → **Donations** → **Reçus**

### 🖥️ À quoi ça sert ?

Générer des **reçus** pour la déclaration d'impôts.

### 📄 GÉNÉRER UN REÇU

**Situation** : Un donateur a versé 100€ et veut un reçu.

**Étape 1** : Allez dans **Historique des donations**

**Étape 2** : Trouvez le don

**Étape 3** : Cliquez sur **[Générer reçu]**

**Résultat** :

- ✅ PDF reçu créé
- ✅ Envoyé par email au donateur automatiquement
- ✅ Conservé dans la base de données

---

#

# 👥 GROUPE 4️⃣ : COMMUNAUTÉ

> La **vie de la communauté** : interactions, événements, communication.

## 💬 Chat (`/chat`)

### 🎯 Qu'est-ce que c'est ?

Un **espace de discussion** en temps réel avec d'autres membres.

### 📍 Où le trouver ?

Menu latéral → **Communauté** → **Chat**

### 🖥️ À quoi ça sert ?

- Poser des questions
- Discuter d'un sujet
- Partager des informations
- Créer du lien

### 💬 MODÉRER LE CHAT

**Comme admin**, vous pouvez :

- ✅ Voir tous les messages
- ✅ Supprimer un message inapproprié
- ✅ Avertir un utilisateur
- ✅ Bannir temporairement

**Procédure** :

```
1. Cliquez sur le message
2. Cliquez sur [⋮] (3 points)
3. Sélectionnez:
   - ✏️ Éditer (corriger une typo)
   - 🗑️ Supprimer (message inapproprié)
   - ⚠️ Avertir (premier avertissement)
   - 🚫 Bannir (utilisateur problématique)
```

---

## 📢 Annonces (`/announcements`)

### 🎯 Qu'est-ce que c'est ?

Les **messages importants** que les admins veulent communiquer à tous.

Exemple : "Fermeture de l'église pour travaux", "Nouvelle horaire de messe"

### 📍 Où le trouver ?

Menu latéral → **Communauté** → **Annonces**

### 🖥️ À quoi ça sert ?

Informer rapidement toute la communauté.

### ➕ AJOUTER UNE ANNONCE

**Étape 1** : Cliquez **[➕ Nouvelle annonce]**

**Étape 2** : Remplissez

```
🔴 Niveau d'importance
   🔴 Urgent (bandeau rouge)
   🟡 Important (bandeau orange)
   🟢 Information (bandeau vert)

📝 Titre
   Ex: "Fermeture pour travaux"

📄 Contenu
   Les détails complets

📅 Date de fin
   Jusqu'à quand afficher?
   (Autosupp après cette date)
```

**Étape 3** : **[Publier immédiatement]** ou **[Programmer pour plus tard]**

### ✨ Résultat

L'annonce :

- ✅ S'affiche en bandeau sur la page d'accueil
- ✅ Apparaît dans la section "Annonces"
- ✅ Envoie une notification à tous (optionnel)

---

## 📣 Publicité (`/publicite`)

### 🎯 Qu'est-ce que c'est ?

Les **affiches et promotions** (événements, appels à bénévoles, etc).

### 📍 Où le trouver ?

Menu latéral → **Communauté** → **Publicité**

### 🖥️ À quoi ça sert ?

Promouvoir les événements et activités paroissiales.

### ➕ AJOUTER UNE PUBLICITÉ

C'est géré dans **Administration** → **Publicité** (voir la section correspondante plus bas).

---

## 📅 Événements (`/evenements`)

### 🎯 Qu'est-ce que c'est ?

Le **calendrier des événements** paroissaux.

### 📍 Où le trouver ?

Menu latéral → **Communauté** → **Événements**

### 🖥️ À quoi ça sert ?

- Voir les **événements à venir**
- **S'inscrire** à un événement
- **Partager** avec d'autres

### ➕ AJOUTER UN ÉVÉNEMENT

**Important** : Les événements se gèrent dans **Administration** → **Événements**

(Voir la section "Administration" plus bas)

---

## 👥 Annuaire (`/directory`)

### 🎯 Qu'est-ce que c'est ?

La **liste de la paroisse** : prêtres, bénévoles, associations, services.

Exemple : "Père Martin - Curé - 03.XX.XX.XX"

### 📍 Où le trouver ?

Menu latéral → **Communauté** → **Annuaire**

### 🖥️ À quoi ça sert ?

Trouver les contacts et services paroissials.

### 📝 GÉRER L'ANNUAIRE

Pour les **admins**, l'annuaire se gère dans :
**Administration** → **Annuaire** (voir section correspondante)

---

# 💰 GROUPE 5️⃣ : DONATIONS

> Gérer les **dons** et les **campagnes de financement** de la paroisse.

## 💳 Faire un don (`/donate`)

### 🎯 Qu'est-ce que c'est ?

La **page de donation** où les fidèles peuvent donner de l'argent.

### 📍 Où le trouver ?

Menu latéral → **Donations** → **Faire un don**

### 🖥️ À quoi ça sert ?

Permettre aux fidèles de **soutenir financièrement** la paroisse.

### 🎯 POUR LES VISITEURS

Ils voient :

- Montants suggérés (10€, 25€, 50€, 100€, autre)
- Moyens de paiement (Carte bancaire, PayPal, virement)
- Destination du don (général, projet spécifique)

### ⚙️ POUR LES ADMINS

C'est géré dans **Administration** → **Paramètres** (voir section correspondante)

---

## 📊 Campagnes (`/campaigns`)

### 🎯 Qu'est-ce que c'est ?

Les **projets de financement** spécifiques.

Exemple : "Rénovation du toit de l'église", "Acheter des instruments de musique"

### 📍 Où le trouver ?

Menu latéral → **Donations** → **Campagnes**

### 🖥️ À quoi ça sert ?

Mobiliser les fidèles pour un projet spécifique avec un **objectif monétaire**.

```
Exemple de campagne:

┌─────────────────────────────┐
│ 🎯 RÉNOVATION DE L'ÉGLISE   │
├─────────────────────────────┤
│ Objectif: 50 000€           │
│ Collecté: 32 500€ (65%)     │
│                             │
│ ████████████░░░░ 65%        │
│                             │
│ Reste: 17 500€              │
│ [FAIRE UN DON]              │
└─────────────────────────────┘
```

### ➕ CRÉER UNE CAMPAGNE

**Étape 1** : Allez dans **Administration** → **Paramètres**

**Étape 2** : Cliquez **[➕ Nouvelle campagne]**

**Étape 3** : Remplissez

```
📝 Titre
   Ex: "Rénovation du toit"

📄 Description
   Explique pourquoi et comment

💰 Objectif (montant en €)
   Ex: 50000

🖼️ Image
   Photo du projet

📅 Date de fin
   Quand la campagne se termine?
```

**Étape 4** : **[Créer]**

---

## 📜 Historique (`/donations`)

### 🎯 Qu'est-ce que c'est ?

La **liste de tous les dons** reçus.

### 📍 Où le trouver ?

Menu latéral → **Donations** → **Historique**

### 🖥️ À quoi ça sert ?

Voir les donations passées et leur statut.

### 📊 EXEMPLE DE VUE

```
Date       | Donateur    | Montant | Campagne        | Reçu
-----------|-------------|---------|-----------------|--------
12 jan     | Jean D.     | 50€     | Rénovation      | Généré
11 jan     | Marie L.    | 100€    | Général         | Généré
10 jan     | Pierre M.   | 25€     | Instruments     | En attente
```

---

## 🧾 Reçus (`/receipts`)

### 🎯 Qu'est-ce que c'est ?

Les **reçus fiscaux** pour les dons (défiscalisables).

### 📍 Où le trouver ?

Menu latéral → **Donations** → **Reçus**

### 🖥️ À quoi ça sert ?

Générer des **reçus** pour la déclaration d'impôts.

### 📄 GÉNÉRER UN REÇU

**Situation** : Un donateur a versé 100€ et veut un reçu.

**Étape 1** : Allez dans **Historique des donations**

**Étape 2** : Trouvez le don

**Étape 3** : Cliquez sur **[Générer reçu]**

**Résultat** :

- ✅ PDF reçu créé
- ✅ Envoyé par email au donateur automatiquement
- ✅ Conservé dans la base de données

---

# ⚙️ GROUPE 6️⃣ : ADMINISTRATION

> C'est le **centre de contrôle** pour **gérer le site**.
> **Cette section est réservée aux administrateurs seulement.**

---

## 🎬 En Ligne (`/admin/live`)

### 🎯 Qu'est-ce que c'est ?

Gérer les **sessions de streaming en direct** (messes, événements).

### 📍 Où le trouver ?

Menu latéral → **Administration** → **En Ligne**

### 🖥️ À quoi ça sert ?

Contrôler :

- ✅ Démarrer/arrêter une messe en direct
- ✅ Gérer le chat en temps réel
- ✅ Modérer les messages disruptifs
- ✅ Voir les statistiques (nombre de spectateurs)

### 📡 CONFIGURER UNE SESSION LIVE

**Étape 1** : Cliquez **[➕ Nouvelle session live]**

**Étape 2** : Remplissez

```
📝 Titre
   Ex: "Messe dominicale - 12 janvier"

📅 Date & Heure
   Quand commencera la diffusion?

🎬 Lien de la vidéo
   URL de votre stream (YouTube Live, etc)

📄 Description
   Informations supplémentaires
```

**Étape 3** : **[Commencer la diffusion]**

### 💬 MODÉRER LE CHAT EN DIRECT

**Pendant la session** :

```
À droite: chat en temps réel

Messages problématiques?
  1. Cliquez sur le message
  2. [🗑️ Supprimer]
  3. [⚠️ Avertir l'utilisateur]
  4. [🚫 Bannir]
```

---

## 📸 Publicité (`/admin/ads`)

### 🎯 Qu'est-ce que c'est ?

Les **affiches promotionnelles** du site.

### 📍 Où le trouver ?

Menu latéral → **Administration** → **Publicité**

### 🖥️ À quoi ça sert ?

Créer des annonces qui s'affichent :

- À la page d'accueil (popup)
- Sur la page `/publicite`
- Avec dates programmables

### ➕ AJOUTER UNE AFFICHE

**Étape 1** : Cliquez **[➕ Ajouter une affiche]**

**Étape 2** : Remplissez

```
📝 Titre
   Ex: "Fête paroissiale 2026"

📝 Sous-titre (optionnel)
   Ex: "Dimanche 15 janvier"

📄 Description
   Détails, programme, infos pratiques

🖼️ Image
   Photo de l'affiche (800x600 px recommandé)

📎 Lien PDF (optionnel)
   Document à télécharger
```

**Étape 3** : Configurer les dates

```
📅 Visible à partir de
   Date de début

📅 Visible jusqu'au
   Date de fin (optionnel)
   Si vide: toujours active

⭐ Priorité
   1-10 (10 = s'affiche en premier)
```

**Étape 4** : **[Créer l'affiche]**

### ✨ Résultat

L'affiche :

- ✅ S'affiche comme **popup** à l'accueil
- ✅ Apparaît dans la **page `/publicite`**
- ✅ Respecte les dates configurées

---

## 👥 Utilisateurs (`/admin/users`)

### 🎯 Qu'est-ce que c'est ?

La **gestion de tous les comptes** de la paroisse.

### 📍 Où le trouver ?

Menu latéral → **Administration** → **Utilisateurs**

### 🖥️ À quoi ça sert ?

- ✅ Créer de nouveaux comptes
- ✅ Modifier les rôles
- ✅ Désactiver des comptes
- ✅ Réinitialiser les mots de passe

### 📐 INTERFACE

```
┌────────────────────────────────────┐
│ 👥 GESTION DES UTILISATEURS        │
├────────────────────────────────────┤
│                                    │
│ [🔍 Rechercher...]  [➕ Ajouter]  │
│                                    │
│ Nom        | Email   | Rôle   | [⋮]
│─────────────────────────────────────
│ Jean D.    | j@...   | Admin  | [⋮]
│ Marie L.   | m@...   | Membre | [⋮]
│ Pierre M.  | p@...   | Modo   | [⋮]
│                                    │
└────────────────────────────────────┘
```

### 🔍 CHERCHER UN UTILISATEUR

**Étape 1** : Cliquez dans **[🔍 Rechercher...]**

**Étape 2** : Tapez le **nom** ou **email**

**Résultat** : La liste se filtre instantanément

---

### ➕ AJOUTER UN NOUVEL UTILISATEUR

**Étape 1** : Cliquez **[➕ Ajouter]**

**Étape 2** : Remplissez le formulaire

```
👤 Prénom
   Ex: Jean

👤 Nom
   Ex: Dupont

📧 Email
   Ex: jean.dupont@paroisse.fr

🔑 Mot de passe
   Min 8 caractères
   Conseil: Créez un bon mot de passe!

🎭 Rôle
   Sélectionnez:
   👤 Membre (par défaut)
   🛡️ Modérateur (modère les commentaires)
   ⚙️ Administrateur (accès complet)
```

**Étape 3** : Envoyer une invitation

```
☑️ "Envoyer une invitation par email"
   ✅ Oui: L'utilisateur reçoit un email
   ✅ Non: Vous le créez sans notification
```

**Étape 4** : **[Créer l'utilisateur]**

### ✏️ MODIFIER LE RÔLE D'UN UTILISATEUR

**Situation** : Vous voulez que Jean devienne Admin.

**Étape 1** : Trouvez Jean dans la liste

**Étape 2** : Cliquez sur **[⋮]** (3 points)

**Étape 3** : Sélectionnez **"Modifier le rôle"**

**Étape 4** : Sélectionnez **"Administrateur"**

**Étape 5** : **[Enregistrer]**

**Résultat** : ✅ Jean voit maintenant le menu Administration

---

### 🔄 DÉSACTIVER / RÉACTIVER UN COMPTE

#### Désactiver

**Situation** : Un utilisateur ne peut plus se connecter.

**Étape 1** : Trouvez-le dans la liste

**Étape 2** : Cliquez sur **[⋮]**

**Étape 3** : Sélectionnez **"Désactiver"**

**Résultat** :

- ✅ L'utilisateur voit "Compte désactivé"
- ✅ Il ne peut plus se connecter
- ✅ Ses messages/vidéos restent visibles

#### Réactiver

**Étape 1** : Cliquez sur **[⋮]**

**Étape 2** : Sélectionnez **"Réactiver"**

**Résultat** : ✅ L'utilisateur peut se reconnecter

---

### 🔑 RÉINITIALISER UN MOT DE PASSE

**Situation** : Un utilisateur a oublié son mot de passe.

**Étape 1** : Trouvez-le dans la liste

**Étape 2** : Cliquez sur **[⋮]**

**Étape 3** : Sélectionnez **"Réinitialiser le mot de passe"**

**Étape 4** : Un lien est généré

**Étape 5** : Copiez le lien et envoyez-le par email

**Résultat** :

- ✅ L'utilisateur reçoit le lien
- ✅ Il crée un nouveau mot de passe
- ✅ Il peut se reconnecter

---

## ⚙️ Paramètres généraux (`/admin/settings`)

### 🎯 Qu'est-ce que c'est ?

Les **paramètres du site** et les **éditeurs de pages**.

### 📍 Où le trouver ?

Menu latéral → **Administration** → **Paramètres généraux**

### 🖥️ À quoi ça sert ?

Personnaliser et éditer :

- Page d'accueil
- Page À propos
- Annuaire
- Paramètres généraux

### 📐 INTERFACE

La page affiche des **boutons rapides** :

```
[📝 Éditeur: Page d'accueil]
[📝 Éditeur: Page À propos]
[📝 Éditeur: Annuaire]
[⚙️  Paramètres du site]
```

---

### 📝 ÉDITER LA PAGE D'ACCUEIL

**Étape 1** : Cliquez **[📝 Éditeur: Page d'accueil]**

**Étape 2** : L'éditeur visuel s'ouvre

**Étape 3** : Vous pouvez modifier

```
🖼️ Grande image (Hero Banner)
   - Cliquez dessus pour la changer
   - Recommandé: 1920x1080 pixels

📝 Titre
   Le slogan principal

📝 Sous-titre
   Texte explicatif

🎨 Sections
   - Ajouter des blocs de texte
   - Ajouter des images
   - Ajouter des vidéos
   - Ajouter des boutons
```

**Étape 4** : **[Enregistrer les modifications]**

**Résultat** : ✅ Les changements sont visibles immédiatement

---

### 📋 GÉRER L'ANNUAIRE

**Étape 1** : Cliquez **[📝 Éditeur: Annuaire]**

**Étape 2** : Vous voyez les **entrées de l'annuaire**

```
Exemple:
Père Martin Dupont | Curé | 03.XX.XX.XX
Secrétariat        | Info | 03.YY.YY.YY
Scouts             | Jeunesse | secrétaire@scouts
```

**Étape 3** : Ajouter une entrée

- Cliquez **[➕ Ajouter]**
- Remplissez : Nom, Fonction, Contact (email/téléphone)
- **[Sauvegarder]**

**Étape 4** : Modifier une entrée

- Cliquez sur l'entrée
- Modifiez les champs
- **[Enregistrer]**

**Étape 5** : Supprimer une entrée

- Cliquez sur **[🗑️ Supprimer]**
- Confirmez

---

### ⚙️ PARAMÈTRES DU SITE

**Aller dans** : **[⚙️ Paramètres du site]**

**Vous pouvez configurer** :

```
🏛️ Nom de la paroisse
   Ex: "Paroisse Saint-Jean"

📧 Email de contact
   Ex: contact@paroisse.fr

☎️ Téléphone
   Ex: 03.XX.XX.XX

🌐 Site web (si existant)
   Ex: www.paroisse.fr

📍 Adresse
   Ex: 123 rue de l'Église, 75000 Paris

🕐 Horaires d'ouverture
   Affichées sur le site

🎨 Couleurs du site
   Personnalisez l'apparence

📱 Réseaux sociaux
   Liens vers Facebook, Instagram, etc
```

**Sauvegardez** : **[Enregistrer]**

---

## 📚 Annuaire (`/admin/directory`)

### 🎯 Qu'est-ce que c'est ?

L'administration de l'**annuaire de la paroisse**.

### 📍 Où le trouver ?

Menu latéral → **Administration** → **Annuaire**

### 🖥️ À quoi ça sert ?

Gérer les contacts et services paroissials.

**Note** : C'est le même que dans **Paramètres généraux** → **Éditeur Annuaire**

---

## 🏠 Page d'accueil (`/admin/homepage`)

### 🎯 Qu'est-ce que c'est ?

L'administration de la **page d'accueil du site**.

### 📍 Où le trouver ?

Menu latéral → **Administration** → **Page d'accueil**

### 🖥️ À quoi ça sert ?

Modifier ce que voient les visiteurs en premier.

**Note** : C'est le même que dans **Paramètres généraux** → **Éditeur: Page d'accueil**

---

## 📅 Événements (`/admin/events`)

### 🎯 Qu'est-ce que c'est ?

L'administration complète de tous les **événements paroissaux**.

### 📍 Où le trouver ?

Menu latéral → **Administration** → **Événements**

### 🖥️ À quoi ça sert ?

- ✅ Créer des événements
- ✅ Les modifier
- ✅ Les supprimer
- ✅ Gérer les inscriptions

### 📐 INTERFACE

```
┌────────────────────────────────────┐
│ 📅 GESTION DES ÉVÉNEMENTS          │
├────────────────────────────────────┤
│                                    │
│ [➕ Créer un événement]            │
│                                    │
│ Événement        | Date    | Lieu
│─────────────────────────────────────
│ Messe dominicale | 12 jan  | Église
│ Fête paroissiale | 15 jan  | Salle
│ Réunion conseil  | 20 jan  | Bureau
│                                    │
└────────────────────────────────────┘
```

### ➕ CRÉER UN ÉVÉNEMENT

**Étape 1** : Cliquez **[➕ Créer un événement]**

**Étape 2A** : Infos de base

```
📝 Titre
   Ex: "Messe solennelle de Noël"

📄 Description
   Détails, programme, notes
   Ex: "Messe à 23h, chœur, veillée"

📍 Lieu
   Ex: "Église Saint-Joseph"

🔗 Lien externe (optionnel)
   Pour plus d'infos
```

**Étape 2B** : Dates

```
📅 Date & Heure de début
   Cliquez sur le champ → calendrier

⏰ Heure de fin
   Quand se termine l'événement?

📅 Date de fin (optionnel)
   Si événement sur plusieurs jours
```

**Étape 2C** : Image

```
🖼️ Image de l'événement (optionnel)
   Photo représentative
```

**Étape 2D** : Inscriptions

```
☑️ Permettre les inscriptions?
   OUI: Les gens peuvent s'inscrire
   NON: Juste informatif

👥 Limite de participants (si oui)
   Exemple: 100 personnes
```

**Étape 3** : **[Créer l'événement]**

### ✏️ MODIFIER UN ÉVÉNEMENT

**Étape 1** : Cliquez sur l'événement

**Étape 2** : Cliquez **[✏️ Modifier]**

**Étape 3** : Apportez vos changements

**Étape 4** : **[Enregistrer]**

---

### ❌ ANNULER UN ÉVÉNEMENT

**Étape 1** : Ouvrez l'événement

**Étape 2** : Cliquez **[✏️ Modifier]**

**Étape 3** : Cochez **☑️ Événement annulé**

Un bandeau **[ANNULÉ]** apparaît en rouge

**Étape 4** : Notifier les inscrits

Cliquez sur **"Notifier par email"**

**Résultat** :

- ✅ L'événement apparaît comme annulé
- ✅ Les inscrits reçoivent une notification
- ✅ Les nouvelles inscriptions sont bloquées

---

## 📞 SUPPORT ET DÉPANNAGE

### ❓ "Je ne vois pas le menu Administration"

**Causes possibles** :

- ❌ Vous n'êtes pas connecté
- ❌ Votre compte n'est pas administrateur

**Solutions** :

1. Vérifiez que vous êtes **connecté** (regardez en haut à droite)
2. Demandez au responsable IT d'accorder les permissions admin
3. Rechargez la page (F5)

---

### ❓ "Je ne peux pas uploader une vidéo"

**Causes possibles** :

- ❌ Fichier trop volumineux (max 500 MB)
- ❌ Format non accepté (MP4 ou WebM seulement)
- ❌ Connexion internet instable

**Solutions** :

1. Vérifiez le format : MP4 ou WebM
2. Réduisez la taille du fichier
3. Essayez avec un autre navigateur (Chrome, Firefox, Safari)

---

### ❓ "Les modifications ne se sauvegardent pas"

**Causes possibles** :

- ❌ Champ obligatoire non rempli
- ❌ Délai de traitement
- ❌ Problème de serveur

**Solutions** :

1. Vérifiez tous les champs : Sont-ils bien remplis ?
2. Patientez 3-5 secondes
3. Appuyez sur **F12** pour voir les erreurs (onglet "Console")
4. Contactez l'équipe IT

---

## 📋 RÉSUMÉ - TABLEAU RAPIDE

| Page                       | Accès                                 | Fonction                |
| -------------------------- | ------------------------------------- | ----------------------- |
| **Vue d'ensemble**         | Tableau de bord → Vue d'ensemble      | Résumé du site          |
| **Analytics**              | Tableau de bord → Analytics           | Statistiques détaillées |
| **Vidéos**                 | Médias → Vidéos                       | Galerie vidéos          |
| **Photos**                 | Médias → Photos                       | Albums photos           |
| **Podcasts**               | Médias → Podcasts                     | Fichiers audio          |
| **Documents**              | Médias → Documents                    | Fichiers PDF            |
| **Messe en direct**        | Culte & Prière → Messe en direct      | Stream live             |
| **Homélies**               | Culte & Prière → Homélies             | Galerie homélies        |
| **Intentions de prière**   | Culte & Prière → Intentions de prière | Prières communauté      |
| **Verset du jour**         | Culte & Prière → Verset du jour       | Versets bibliques       |
| **Chat**                   | Communauté → Chat                     | Discussion temps réel   |
| **Annonces**               | Communauté → Annonces                 | Messages importants     |
| **Publicité**              | Communauté → Publicité                | Affiches promo          |
| **Événements**             | Communauté → Événements               | Calendrier événements   |
| **Annuaire**               | Communauté → Annuaire                 | Contacts paroisse       |
| **Faire un don**           | Donations → Faire un don              | Page donation           |
| **Campagnes**              | Donations → Campagnes                 | Projets financiers      |
| **Historique**             | Donations → Historique                | Liste des dons          |
| **Reçus**                  | Donations → Reçus                     | Reçus fiscaux           |
| **En Ligne**               | Administration → En Ligne             | Gestion streaming       |
| **Publicité (Admin)**      | Administration → Publicité            | Créer affiches          |
| **Utilisateurs**           | Administration → Utilisateurs         | Gérer comptes           |
| **Paramètres généraux**    | Administration → Paramètres généraux  | Éditeurs & config       |
| **Annuaire (Admin)**       | Administration → Annuaire             | Gérer contacts          |
| **Page d'accueil (Admin)** | Administration → Page d'accueil       | Éditer accueil          |
| **Événements (Admin)**     | Administration → Événements           | Gérer événements        |

---

## ✅ CHECKLIST - Êtes-vous prêt ?

Avant de commencer l'administration, vérifiez :

```
☐ J'ai accès au menu "Administration"
☐ Je comprends la structure du Sidebar
☐ Je sais créer un utilisateur
☐ Je sais ajouter une vidéo
☐ Je sais créer un événement
☐ Je sais modérer le chat
☐ Je sais éditer la page d'accueil
☐ Je sais créer une affiche
☐ Je connais le contact IT en cas de problème
☐ J'ai lu cette documentation
```

Si tout est coché ✅ : **Vous êtes prêt à administrerMédia Paroissiale !**

---

## 🎓 RESSOURCES SUPPLÉMENTAIRES

Pour plus d'aide :

- 📧 Email support : support@faithflix.fr
- 📞 Chef IT : Contact disponible dans les paramètres du site
- 💬 Chat d'aide : Disponible en bas à droite de chaque page admin

---

## 📖 Fin du guide

**Merci d'utiliserMédia Paroissiale !**

Vous administrez maintenant le site de votre paroisse.

Bonne chance ! 🎉

```

```
