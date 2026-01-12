/**
 * Données du Lexique - Tous les termes du Site Paroissial
 * Guide complet pour les administrateurs, bénévoles et visiteurs
 */

import type { LexiqueTerm, LexiqueCategoryMetadata } from '../types';

export const LEXIQUE_CATEGORIES: LexiqueCategoryMetadata[] = [
  {
    id: 'interface',
    name: 'Interface',
    icon: '🖥️',
    description: 'Éléments visuels et composants de l\'interface',
    color: 'blue',
  },
  {
    id: 'navigation',
    name: 'Navigation',
    icon: '🧭',
    description: 'Menus et structures de navigation',
    color: 'emerald',
  },
  {
    id: 'content',
    name: 'Contenu',
    icon: '📄',
    description: 'Éléments de contenu et présentation de données',
    color: 'amber',
  },
  {
    id: 'actions',
    name: 'Actions',
    icon: '⚡',
    description: 'Boutons, formulaires et interactions',
    color: 'rose',
  },
  {
    id: 'admin',
    name: 'Administration',
    icon: '⚙️',
    description: 'Outils et sections d\'administration',
    color: 'purple',
  },
];

export const LEXIQUE_TERMS: LexiqueTerm[] = [
  // ========== INTERFACE ==========
  {
    id: 'hero-banner',
    term: 'Hero Banner',
    synonyms: ['Bannière d\'accueil', 'Image principale', 'Bannière héros'],
    category: 'interface',
    icon: '🖼️',
    definition: {
      what: 'Grande zone visuelle en haut de la page d\'accueil qui présente le message principal du jour ou de la semaine avec titre, description et boutons d\'action.',
      purpose: [
        'Accueillir les visiteurs avec un message fort et motivant',
        'Mettre en avant un événement ou annonce importante',
        'Guider les utilisateurs vers l\'action principale (s\'inscrire, consulter, participer)',
      ],
      location: 'En haut de la page d\'accueil, immédiatement après le header',
      usage: {
        admin: 'Modifiable via Administration → Page d\'accueil → Sections → Hero.',
        user: 'Zone informative; utilisez les boutons pour accéder à l\'action.',
      },
    },
    imagePath: 'interface/banner',
    imageCaption: 'Zone principale en haut de la page avec titre et bouton.',
    imageAnnotations: [
      { label: 'Titre', description: 'Titre principal visible', position: { x: 20, y: 25 } },
      { label: 'CTA', description: 'Boutons d\'appel', position: { x: 50, y: 65 } },
    ],
    relatedTerms: ['en-tete', 'bouton', 'section-page'],
    difficulty: 'beginner',
  },

  {
    id: 'en-tete',
    term: 'En-tête (Header)',
    synonyms: ['Header', 'Barre d\'en-tête', 'Barre supérieure'],
    category: 'navigation',
    icon: '📍',
    definition: {
      what: 'Barre horizontale en haut de chaque page contenant le logo, le menu et les icônes utilisateur.',
      purpose: ['Navigation principale', 'Accès au profil', 'Cohérence visuelle'],
      location: 'En haut de chaque page',
      usage: { admin: 'Non modifiable depuis l\'interface.', user: 'Utilisez les liens pour naviguer.' },
    },
    imagePath: 'navigation/header',
    imageCaption: 'Barre supérieure contenant logo, menu et icônes utilisateur.',
    imageAnnotations: [
      { label: 'Logo', description: 'Lien vers l\'accueil', position: { x: 10, y: 50 } },
      { label: 'Menu', description: 'Liens principaux', position: { x: 50, y: 50 } },
    ],
    relatedTerms: ['menu-horizontal', 'icones', 'user-menu'],
    difficulty: 'beginner',
  },

  {
    id: 'pied-page',
    term: 'Pied de page (Footer)',
    synonyms: ['Footer', 'Bas de page'],
    category: 'navigation',
    icon: '📌',
    definition: {
      what: 'Bande en bas de page avec informations de contact, liens et copyright.',
      purpose: ['Liens utiles', 'Coordonnées', 'Réseaux sociaux'],
      location: 'Bas de page',
      usage: { admin: 'Modifiable via paramètres.', user: 'Consultez pour contact et liens.' },
    },
    imagePath: 'navigation/footer',
    imageCaption: 'Pied de page avec liens et informations de contact.',
    imageAnnotations: [
      { label: 'Liens', description: 'Plan du site et mentions', position: { x: 25, y: 50 } },
    ],
    relatedTerms: ['en-tete', 'menu-horizontal'],
    difficulty: 'beginner',
  },

  {
    id: 'sidebar',
    term: 'Menu latéral (Sidebar)',
    synonyms: ['Barre latérale', 'Menu gauche', 'Panneau latéral'],
    category: 'navigation',
    icon: '📋',
    definition: {
      what: 'Panneau vertical pour navigation dans les pages d\'administration.',
      purpose: ['Organiser les fonctions', 'Accès rapide aux sections'],
      location: 'Côté gauche (admin)',
      usage: { admin: 'Cliquez pour accéder aux sections.', user: 'Visible uniquement aux admins.' },
    },
    imagePath: 'navigation/sidebar',
    imageCaption: 'Menu latéral utilisé dans l\'administration.',
    relatedTerms: ['menu-horizontal', 'menu-deroulant'],
    difficulty: 'beginner',
  },

  {
    id: 'menu-horizontal',
    term: 'Menu horizontal',
    synonyms: ['Navigation principale', 'Menu principal', 'Barre de navigation'],
    category: 'navigation',
    icon: '🔗',
    definition: {
      what: 'Liens de navigation disposés horizontalement dans le header.',
      purpose: ['Accès aux sections', 'Repère de navigation'],
      location: 'Header',
      usage: { user: 'Cliquez pour naviguer.' },
    },
    imagePath: 'navigation/menu_horizontal',
    imageCaption: 'Barre de navigation principale.',
    imageAnnotations: [{ label: 'Liens', description: 'Accès aux sections principales', position: { x: 50, y: 50 } }],
    relatedTerms: ['en-tete', 'menu-deroulant', 'user-menu'],
    difficulty: 'beginner',
  },

  {
    id: 'menu-deroulant',
    term: 'Menu déroulant',
    synonyms: ['Dropdown menu', 'Menu contextuel', 'Sous-menu'],
    category: 'interface',
    icon: '▼',
    definition: {
      what: 'Menu qui s\'affiche au survol ou au clic et montre des options secondaires.',
      purpose: ['Gagner de la place', 'Organiser les options'],
      location: 'Associé à un élément cliquable',
      usage: { user: 'Cliquez ou survolez pour ouvrir.' },
    },
    imagePath: 'interface/menuderoulant',
    imageCaption: 'Menu déroulant montrant des options secondaires.',
    imageAnnotations: [{ label: 'Option', description: 'Choix secondaire', position: { x: 50, y: 60 } }],
    relatedTerms: ['menu-horizontal', 'bouton'],
    difficulty: 'beginner',
  },

  {
    id: 'carte',
    term: 'Carte (Card)',
    synonyms: ['Bloc de contenu', 'Vignette', 'Conteneur'],
    category: 'content',
    icon: '📦',
    definition: {
      what: 'Bloc rectangulaire affichant un titre, une image, une description et un bouton.',
      purpose: ['Afficher des éléments uniformisés', 'Disposition en grille'],
      location: 'Cartes dans listes et grilles',
      usage: { user: 'Cliquez pour accéder au détail.' },
    },
    imagePath: 'content/card',
    imageCaption: 'Bloc contenant image, titre et description.',
    imageAnnotations: [
      { label: 'Image', description: 'Aperçu', position: { x: 50, y: 20 } },
      { label: 'Titre', description: 'Titre cliquable', position: { x: 50, y: 40 } },
    ],
    relatedTerms: ['vignette', 'bouton', 'section-page'],
    difficulty: 'beginner',
  },

  {
    id: 'vignette',
    term: 'Vignette (Thumbnail)',
    synonyms: ['Miniature', 'Image de couverture', 'Aperçu visuel'],
    category: 'content',
    icon: '🖼️',
    definition: {
      what: 'Petite image d\'aperçu affichée sur une carte ou une liste.',
      purpose: ['Aperçu visuel rapide', 'Attirer l\'attention'],
      location: 'En haut des cartes',
      usage: { user: 'Cliquez pour ouvrir le contenu.' },
    },
    imagePath: 'content/vignette',
    imageCaption: 'Image miniature utilisée dans les cartes.',
    relatedTerms: ['carte', 'image'],
    difficulty: 'beginner',
  },

  {
    id: 'bouton',
    term: 'Bouton',
    synonyms: ['Élément cliquable', 'Commande', 'Contrôle'],
    category: 'actions',
    icon: '🔘',
    definition: {
      what: 'Élément cliquable déclenchant une action (soumettre, ouvrir, confirmer).',
      purpose: ['Déclencher des actions', 'Orienter l\'utilisateur'],
      location: 'Partout',
      usage: { user: 'Cliquez pour effectuer l\'action.' },
    },
    imagePath: 'actions/bouton',
    imageCaption: 'Exemple de bouton d\'action.',
    relatedTerms: ['carte', 'formulaire', 'action-CRUD'],
    difficulty: 'beginner',
  },

  // ========== ACTIONS ==========
  {
    id: 'boutons-action',
    term: 'Boutons d\'Action',
    synonyms: ['Boutons CRUD', 'Boutons de formulaire', 'Boutons interactifs'],
    category: 'actions',
    icon: '🔄',
    definition: {
      what: 'Les boutons d\'action sont les éléments interactifs qui permettent d\'effectuer des opérations sur le site. Ils se divisent en trois grandes familles.',
      purpose: [
        'CRUD : Créer, Consulter, Modifier, Supprimer du contenu',
        'Formulaires : Valider, Annuler, Téléverser des données',
        'Confirmations : Confirmer des actions importantes ou critiques',
        'Guider l\'utilisateur dans ses actions principales'
      ],
      location: 'Partout sur le site : formulaires, tableaux, modales, cartes de contenu',
      usage: {
        admin: 'Utilisez ces boutons pour gérer le contenu du site. Attention : "Supprimer" est souvent irréversible.',
        user: 'Cliquez sur ces boutons pour interagir avec le contenu. Lisez bien les libellés avant de cliquer.'
      },
    },
    imagePath: 'actions/crud',
    imageCaption: 'Exemples des principaux boutons d\'action utilisés sur le Site Paroissial',
    additionalImages: [
      {
        label: 'Téléverser',
        path: 'actions/televerser',
        description: 'Pour envoyer un fichier depuis votre ordinateur'
      },
      {
        label: 'Télécharger',
        path: 'actions/telecharger',
        description: 'Pour récupérer un fichier sur votre appareil'
      },
      {
        label: 'Valider',
        path: 'actions/valider',
        description: 'Pour soumettre un formulaire ou confirmer une action'
      },
      {
        label: 'Annuler',
        path: 'actions/annuler',
        description: 'Pour abandonner une action en cours'
      },
      {
        label: 'Supprimer',
        path: 'actions/supprimer',
        description: 'Pour effacer définitivement un élément (avec confirmation)'
      },
      {
        label: 'Confirmer',
        path: 'actions/confirmer',
        description: 'Pour valider une action critique dans une fenêtre modale'
      }
    ],
    actionReference: [
      {
        bouton: '📝 Créer / Ajouter',
        couleur: 'vert',
        icone: '➕',
        usage: 'Ajouter un nouvel élément (vidéo, événement, utilisateur)'
      },
      {
        bouton: '👁️ Consulter / Voir',
        couleur: 'bleu',
        icone: '👁️',
        usage: 'Afficher les détails d\'un élément sans modification'
      },
      {
        bouton: '✏️ Modifier',
        couleur: 'jaune',
        icone: '✏️',
        usage: 'Éditer les informations d\'un élément existant'
      },
      {
        bouton: '🗑️ Supprimer',
        couleur: 'rouge',
        icone: '🗑️',
        usage: 'Effacer définitivement un élément (demande confirmation)'
      },
      {
        bouton: '📤 Téléverser / Upload',
        couleur: 'bleu',
        icone: '📤',
        usage: 'Envoyer un fichier depuis votre appareil vers le site'
      },
      {
        bouton: '⬇️ Télécharger',
        couleur: 'bleu',
        icone: '⬇️',
        usage: 'Récupérer un fichier du site sur votre appareil'
      },
      {
        bouton: '✅ Valider',
        couleur: 'vert',
        icone: '✅',
        usage: 'Soumettre un formulaire ou terminer une action'
      },
      {
        bouton: '❌ Annuler',
        couleur: 'gris',
        icone: '❌',
        usage: 'Abandonner l\'action en cours sans sauvegarder'
      },
      {
        bouton: '✔️ Confirmer',
        couleur: 'orange',
        icone: '✔️',
        usage: 'Valider une action critique dans une fenêtre de confirmation'
      }
    ],
    relatedTerms: ['bouton', 'formulaire', 'modal', 'tableau', 'televerser', 'telecharger', 'valider', 'annuler', 'supprimer', 'confirmer'],
    difficulty: 'beginner',
  },

  {
    id: 'formulaire',
    term: 'Formulaire',
    synonyms: ['Formulaire de saisie', 'Formulaire d\'édition', 'Form'],
    category: 'actions',
    icon: '📝',
    definition: {
      what: 'Ensemble de champs permettant de saisir ou modifier des informations.',
      purpose: ['Collecter des données', 'Valider avant soumission'],
      location: 'Pages et modals',
      usage: { user: 'Remplissez et soumettez.' },
    },
    imagePath: 'actions/form',
    imageCaption: 'Exemple de formulaire de saisie.',
    relatedTerms: ['bouton', 'zone-saisie', 'checkbox'],
    difficulty: 'intermediate',
  },

  {
    id: 'modal',
    term: 'Modal (Popup)',
    synonyms: ['Fenêtre modale', 'Popup', 'Boîte de dialogue'],
    category: 'interface',
    icon: '🪟',
    definition: {
      what: 'Fenêtre affichée par-dessus le contenu pour attirer l\'attention.',
      purpose: ['Confirmation', 'Formulaire contextuel', 'Alerte'],
      location: 'Sur la page',
      usage: { user: 'Interagissez puis fermez.' },
    },
    imagePath: 'interface/modal',
    imageCaption: 'Exemple de modal avec fond semi-transparent.',
    relatedTerms: ['bouton', 'notification'],
    difficulty: 'beginner',
  },

  {
    id: 'notification',
    term: 'Notification',
    synonyms: ['Alerte', 'Message système', 'Toast'],
    category: 'actions',
    icon: '🔔',
    definition: {
      what: 'Message bref informant le résultat d\'une action.',
      purpose: ['Retour utilisateur', 'Informer sans bloquer'],
      location: 'Coins de l\'écran',
      usage: { user: 'Lisez le message; il disparaît.' },
    },
    imagePath: 'actions/notification',
    imageCaption: 'Notification de succès ou d\'erreur.',
    relatedTerms: ['modal', 'message-toast'],
    difficulty: 'beginner',
  },

  {
    id: 'message-toast',
    term: 'Message toast',
    synonyms: ['Toast notification', 'Message éphémère', 'Alerte temporaire'],
    category: 'actions',
    icon: '📢',
    definition: {
      what: 'Message temporaire qui apparaît puis disparaît.',
      purpose: ['Retour rapide', 'Informer discrètement'],
      location: 'Coin bas de l\'écran',
      usage: { user: 'Observez et ignorez ou fermez.' },
    },
    imagePath: 'actions/toast',
    imageCaption: 'Exemple de message toast.',
    relatedTerms: ['notification', 'modal'],
    difficulty: 'beginner',
  },

  // ========== CONTENU ==========
  {
    id: 'tableau',
    term: 'Tableau (Table)',
    synonyms: ['Tableau de données', 'Liste tabulaire'],
    category: 'content',
    icon: '📊',
    definition: {
      what: 'Grille d\'informations organisée en lignes et colonnes.',
      purpose: ['Afficher des données', 'Tri et filtrage'],
      location: 'Pages d\'administration',
      usage: { admin: 'Trier et filtrer les données.' },
    },
    imagePath: 'content/tableau',
    imageCaption: 'Tableau affichant des données structurées.',
    relatedTerms: ['ligne-tableau', 'section-page'],
    difficulty: 'intermediate',
  },

  {
    id: 'ligne-tableau',
    term: 'Ligne de tableau (Row)',
    synonyms: ['Ligne', 'Enregistrement', 'Élément du tableau'],
    category: 'content',
    icon: '➡️',
    definition: {
      what: 'Rangée du tableau contenant les données d\'un élément.',
      purpose: ['Afficher l\'élément', 'Permettre actions sur l\'élément'],
      location: 'Dans un tableau',
      usage: { admin: 'Cliquez pour voir les actions.' },
    },
    imagePath: 'content/row',
    imageCaption: 'Exemple de ligne dans un tableau.',
    relatedTerms: ['tableau'],
    difficulty: 'beginner',
  },

  {
    id: 'titre',
    term: 'Titre (Heading)',
    synonyms: ['En-tête de section', 'Titre principal'],
    category: 'content',
    icon: '🔤',
    definition: {
      what: 'Texte important identifiant une section ou le sujet principal.',
      purpose: ['Structurer le contenu', 'Aider la lecture'],
      location: 'Début des sections',
      usage: { user: 'Lisez pour comprendre la structure.' },
    },
    imagePath: 'content/titre',
    imageCaption: 'Exemple de titre de section.',
    relatedTerms: ['sous-titre', 'description'],
    difficulty: 'beginner',
  },

  {
    id: 'sous-titre',
    term: 'Sous-titre (Subtitle)',
    synonyms: ['Sous-titre', 'Sous-en-tête', 'Titre secondaire'],
    category: 'content',
    icon: '📄',
    definition: {
      what: 'Texte secondaire clarifiant le titre principal.',
      purpose: ['Fournir du contexte', 'Améliorer hiérarchie visuelle'],
      location: 'Sous les titres',
      usage: { user: 'Lisez pour plus de détails.' },
    },
    imagePath: 'content/soustitre',
    imageCaption: 'Exemple de sous-titre.',
    relatedTerms: ['titre', 'description'],
    difficulty: 'beginner',
  },

  {
    id: 'description',
    term: 'Description',
    synonyms: ['Texte de description', 'Contenu textuel', 'Paragraphe'],
    category: 'content',
    icon: '📖',
    definition: {
      what: 'Texte explicatif décrivant un élément ou son contenu.',
      purpose: ['Fournir des détails', 'Expliquer le contexte'],
      location: 'Partout',
      usage: { user: 'Lisez les descriptions pour comprendre.' },
    },
    imagePath: 'content/description',
    imageCaption: 'Bloc de texte descriptif.',
    relatedTerms: ['titre', 'sous-titre'],
    difficulty: 'beginner',
  },

  // ========== INTERFACE / FORM CONTROLS ==========
  {
    id: 'section-page',
    term: 'Section de page',
    synonyms: ['Section', 'Bloc de contenu', 'Zone de page'],
    category: 'interface',
    icon: '🎯',
    definition: {
      what: 'Zone contenant un groupe d\'éléments connexes sur une page.',
      purpose: ['Organiser le contenu', 'Séparer visuellement les zones'],
      location: 'Partout',
      usage: { admin: 'Éditable via administration.' },
    },
    imagePath: 'interface/section',
    imageCaption: 'Section de page séparant les contenus.',
    relatedTerms: ['hero-banner', 'carte'],
    difficulty: 'intermediate',
  },

  {
    id: 'zone-saisie',
    term: 'Zone de saisie (Input)',
    synonyms: ['Champ de texte', 'Champ d\'entrée', 'Input field'],
    category: 'interface',
    icon: '⌨️',
    definition: {
      what: 'Champ où l\'utilisateur peut saisir du texte.',
      purpose: ['Collecter l\'entrée utilisateur'],
      location: 'Formulaires',
      usage: { user: 'Cliquez et tapez.' },
    },
    imagePath: 'interface/input',
    imageCaption: 'Champ de saisie (input).',
    relatedTerms: ['formulaire', 'checkbox'],
    difficulty: 'beginner',
  },

  {
    id: 'checkbox',
    term: 'Zone à cocher (Checkbox)',
    synonyms: ['Case à cocher', 'Boîte de sélection', 'Checkbox'],
    category: 'interface',
    icon: '☑️',
    definition: {
      what: 'Case que l\'utilisateur peut cocher ou décocher.',
      purpose: ['Sélection multiple', 'Consentement'],
      location: 'Formulaires',
      usage: { user: 'Cochez ou décochez selon besoin.' },
    },
    imagePath: 'interface/checkbox',
    imageCaption: 'Exemple de case à cocher.',
    relatedTerms: ['formulaire', 'zone-saisie', 'selecteur'],
    difficulty: 'beginner',
  },

  {
    id: 'selecteur',
    term: 'Zone de sélection (Select)',
    synonyms: ['Sélecteur', 'Liste déroulante', 'Dropdown'],
    category: 'interface',
    icon: '🔽',
    definition: {
      what: 'Sélecteur permettant de choisir une option depuis une liste.',
      purpose: ['Limiter les choix', 'Structurer la saisie'],
      location: 'Formulaires',
      usage: { user: 'Ouvrez et choisissez une option.' },
    },
    imagePath: 'interface/select',
    imageCaption: 'Exemple de sélecteur (select).',
    relatedTerms: ['formulaire', 'menu-deroulant'],
    difficulty: 'beginner',
  },

  {
    id: 'icones',
    term: 'Icônes',
    synonyms: ['Symboles', 'Pictogrammes', 'Icônes visuelles'],
    category: 'interface',
    icon: '🎨',
    definition: {
      what: 'Petites images symboliques représentant des fonctions.',
      purpose: ['Clarifier visuellement', 'Créer cohérence'],
      location: 'Partout',
      usage: { user: 'Repérez les icônes pour les actions.' },
    },
    imagePath: 'interface/icones',
    imageCaption: 'Exemples d\'icônes utilisées sur le site.',
    relatedTerms: ['bouton', 'menu-horizontal'],
    difficulty: 'beginner',
  },

  {
    id: 'user-menu',
    term: 'Menu utilisateur (User Menu)',
    synonyms: ['Menu de compte', 'Menu profil', 'Dropdown utilisateur'],
    category: 'navigation',
    icon: '👤',
    definition: {
      what: 'Menu lié au profil utilisateur contenant options de compte.',
      purpose: ['Accéder aux paramètres', 'Se déconnecter'],
      location: 'Header, en haut à droite',
      usage: { user: 'Cliquez sur l\'avatar pour ouvrir.' },
    },
    imagePath: 'navigation/user_menu',
    imageCaption: 'Menu utilisateur affichant les options de compte.',
    relatedTerms: ['en-tete', 'menu-deroulant'],
    difficulty: 'beginner',
  },

  {
    id: 'tableau-de-bord',
    term: 'Tableau de bord (Dashboard)',
    synonyms: ['Panneau de contrôle', 'Vue d\'ensemble', 'Dashboard'],
    category: 'admin',
    icon: '📈',
    definition: {
      what: 'Page d\'administration affichant statistiques et raccourcis.',
      purpose: ['Vue d\'ensemble', 'Accès rapide aux outils'],
      location: 'Administration',
      usage: { admin: 'Consultez régulièrement pour suivi.' },
    },
    imagePath: 'admin/dashboard',
    imageCaption: 'Tableau de bord administrateur.',
    relatedTerms: ['section-admin', 'boutons-action'],
    difficulty: 'intermediate',
  },

  // ========== NOUVEAUX BOUTONS D\'ACTION ==========
  {
    id: 'televerser',
    term: 'Téléverser / Upload',
    synonyms: ['Envoyer un fichier', 'Upload', 'Charger un fichier'],
    category: 'actions',
    icon: '📤',
    definition: {
      what: 'Action permettant d\'envoyer un fichier depuis votre ordinateur vers le site.',
      purpose: ['Partager des documents', 'Ajouter des contenus', 'Importer des données'],
      location: 'Formulaires, sections d\'administration',
      usage: { admin: 'Utilisez pour importer des fichiers ou des données.' },
    },
    imagePath: 'actions/televerser',
    imageCaption: 'Bouton de téléversement (Upload).',
    relatedTerms: ['boutons-action', 'formulaire', 'telecharger'],
    difficulty: 'beginner',
  },

  {
    id: 'telecharger',
    term: 'Télécharger / Download',
    synonyms: ['Récupérer un fichier', 'Download', 'Sauvegarder localement'],
    category: 'actions',
    icon: '⬇️',
    definition: {
      what: 'Action permettant de récupérer et sauvegarder un fichier du site sur votre appareil.',
      purpose: ['Récupérer des documents', 'Exporter des données', 'Sauvegarder localement'],
      location: 'Listes, tableaux, sections de contenu',
      usage: { user: 'Cliquez pour télécharger le fichier.' },
    },
    imagePath: 'actions/telecharger',
    imageCaption: 'Bouton de téléchargement (Download).',
    relatedTerms: ['boutons-action', 'televerser'],
    difficulty: 'beginner',
  },

  {
    id: 'valider',
    term: 'Valider / Soumettre',
    synonyms: ['Soumettre', 'Confirmer', 'Envoyer', 'Submit'],
    category: 'actions',
    icon: '✅',
    definition: {
      what: 'Action permettant de soumettre un formulaire ou de confirmer une action.',
      purpose: ['Envoyer des données', 'Terminer une action', 'Confirmer un choix'],
      location: 'Formulaires, modales, dialogues',
      usage: { user: 'Cliquez quand vous avez terminé de remplir le formulaire.' },
    },
    imagePath: 'actions/valider',
    imageCaption: 'Bouton de validation (Submit).',
    relatedTerms: ['boutons-action', 'formulaire', 'annuler'],
    difficulty: 'beginner',
  },

  {
    id: 'annuler',
    term: 'Annuler / Fermer',
    synonyms: ['Quitter', 'Fermer sans sauvegarder', 'Abandonner', 'Cancel'],
    category: 'actions',
    icon: '❌',
    definition: {
      what: 'Action permettant d\'abandonner une opération en cours sans sauvegarder.',
      purpose: ['Quitter un formulaire', 'Fermer une modale', 'Annuler une action'],
      location: 'Formulaires, modales, dialogues',
      usage: { user: 'Cliquez pour fermer sans enregistrer.' },
    },
    imagePath: 'actions/annuler',
    imageCaption: 'Bouton d\'annulation (Cancel).',
    relatedTerms: ['boutons-action', 'formulaire', 'valider'],
    difficulty: 'beginner',
  },

  {
    id: 'supprimer',
    term: 'Supprimer / Effacer',
    synonyms: ['Effacer', 'Enlever', 'Détruire', 'Delete', 'Remove'],
    category: 'actions',
    icon: '🗑️',
    definition: {
      what: 'Action permettant d\'effacer définitivement un élément du site.',
      purpose: ['Enlever du contenu', 'Nettoyer les données', 'Gérer l\'espace'],
      location: 'Listes, tableaux, sections d\'administration',
      usage: { admin: 'Attention : cette action est généralement irréversible. Une confirmation sera demandée.' },
    },
    imagePath: 'actions/supprimer',
    imageCaption: 'Bouton de suppression (Delete).',
    relatedTerms: ['boutons-action', 'confirmer'],
    difficulty: 'intermediate',
  },

  {
    id: 'confirmer',
    term: 'Confirmer / Valider définitivement',
    synonyms: ['Valider', 'Approuver', 'Accepter', 'OK', 'Confirm'],
    category: 'actions',
    icon: '✔️',
    definition: {
      what: 'Action permettant de valider une opération critique ou importante dans une fenêtre de confirmation.',
      purpose: ['Valider les suppressions', 'Confirmer les actions majeures', 'Sécuriser les opérations'],
      location: 'Fenêtres de confirmation (modales), dialogues critiques',
      usage: { admin: 'Utilisez pour confirmer les suppressions ou actions majeures.' },
    },
    imagePath: 'actions/confirmer',
    imageCaption: 'Bouton de confirmation (OK).',
    relatedTerms: ['boutons-action', 'modal', 'supprimer'],
    difficulty: 'beginner',
  },
];
