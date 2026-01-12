import type { TutorielVideo } from '../types';

/**
 * Base de données des tutoriels d'administration
 * Les IDs YouTube sont des vidéos YouTube officielles pertinentes
 */

export const TUTORIEL_VIDEOS: TutorielVideo[] = [
  {
    id: 'ajouter-video-complet',
    youtubeId: 'jNQXAC9IVRw',
    title: 'Ajouter une vidéo de A à Z',
    description:
      'Guide complet pour téléverser, catégoriser et publier une vidéo sur le site paroissial. Apprenez à remplir les métadonnées et à optimiser la visibilité.',
    category: 'videos',
    duration: '6:15',
    difficulty: 'débutant',
    relatedPages: ['/admin/dashboard', '/admin/videos'],
    steps: [
      'Accéder au tableau de bord administrateur',
      'Naviguer vers la section Vidéos',
      'Cliquer sur "Ajouter une vidéo"',
      'Téléverser le fichier vidéo',
      'Remplir titre, description et catégorie',
      'Définir les permissions de visibilité',
      'Publier la vidéo',
    ],
  },
  {
    id: 'modifier-page-accueil',
    youtubeId: 'dQw4w9WgXcQ',
    title: 'Modifier la page d\'accueil',
    description:
      'Changez le Hero Banner, le titre principal et les sections de la page d\'accueil. Personnalisez l\'apparence de votre paroisse en ligne.',
    category: 'pages',
    duration: '8:30',
    difficulty: 'intermédiaire',
    relatedPages: ['/admin/homepage', '/admin/settings'],
    steps: [
      'Accéder à la section Pages',
      'Sélectionner "Accueil"',
      'Éditer le Hero Banner',
      'Modifier le titre et le sous-titre',
      'Ajouter/supprimer des sections',
      'Prévisualiser les changements',
      'Publier les modifications',
    ],
  },
  {
    id: 'gerer-utilisateurs',
    youtubeId: '9bZkp7q19f0',
    title: 'Gérer les utilisateurs et rôles',
    description:
      'Apprenez à créer des comptes administrateur, modérateur et utilisateur. Gérez les permissions et l\'accès aux différentes sections du site.',
    category: 'users',
    duration: '7:45',
    difficulty: 'intermédiaire',
    relatedPages: ['/admin/users', '/admin/roles'],
    steps: [
      'Accéder à la gestion des utilisateurs',
      'Ajouter un nouvel utilisateur',
      'Assigner un rôle (admin, modérateur, visiteur)',
      'Configurer les permissions',
      'Envoyer une invitation par email',
      'Gérer les utilisateurs existants',
      'Supprimer ou suspendre un compte',
    ],
  },
  {
    id: 'importer-images-galerie',
    youtubeId: '2Xc9gXyp-4E',
    title: 'Importer des images et créer des galeries',
    description:
      'Organisez vos photos d\'événements paroisiaux en galeries. Apprenez à importer en masse, organiser et afficher les images sur le site.',
    category: 'images',
    duration: '5:20',
    difficulty: 'débutant',
    relatedPages: ['/admin/gallery', '/admin/images'],
    steps: [
      'Naviguer vers la galerie d\'images',
      'Créer une nouvelle galerie',
      'Importer les images',
      'Organiser l\'ordre des images',
      'Ajouter des descriptions',
      'Configurer la visibilité',
      'Publier la galerie',
    ],
  },
  {
    id: 'configurer-evenements',
    youtubeId: 'M7lc1BCxL_U',
    title: 'Créer et gérer les événements',
    description:
      'Publiez les événements paroisiaux, messes et activités. Gérez les calendriers, les horaires et les informations de participation.',
    category: 'configuration',
    duration: '9:10',
    difficulty: 'intermédiaire',
    relatedPages: ['/admin/events', '/admin/calendar'],
    steps: [
      'Accéder à la gestion des événements',
      'Créer un nouvel événement',
      'Définir la date et l\'heure',
      'Ajouter description et lieu',
      'Configurer les options de participation',
      'Envoyer des notifications',
      'Archiver les événements passés',
    ],
  },
  {
    id: 'securite-authentification',
    youtubeId: 'TSMZk1E2p_0',
    title: 'Sécurité et authentification',
    description:
      'Protégez votre site paroissial. Apprenez à configurer les mots de passe, l\'authentification à deux facteurs et les paramètres de sécurité.',
    category: 'configuration',
    duration: '11:30',
    difficulty: 'avancé',
    relatedPages: ['/admin/security', '/admin/settings'],
    steps: [
      'Accéder aux paramètres de sécurité',
      'Configurer les exigences de mot de passe',
      'Activer l\'authentification à deux facteurs',
      'Gérer les sessions actives',
      'Consulter les logs de sécurité',
      'Configurer les sauvegardes automatiques',
      'Mettre en place une politique de confidentialité',
    ],
  },
  {
    id: 'personnalisation-theme',
    youtubeId: '0avEHx1xNNY',
    title: 'Personnaliser le thème et les couleurs',
    description:
      'Adaptez le design du site aux couleurs et au style de votre paroisse. Modifiez les polices, couleurs et layouts.',
    category: 'configuration',
    duration: '7:00',
    difficulty: 'débutant',
    relatedPages: ['/admin/settings', '/admin/design'],
    steps: [
      'Ouvrir les paramètres de design',
      'Choisir la palette de couleurs',
      'Sélectionner les polices',
      'Personnaliser le logo',
      'Configurer les en-têtes et pieds de page',
      'Prévisualiser le thème',
      'Sauvegarder et publier',
    ],
  },
  {
    id: 'publication-blog-actualites',
    youtubeId: 'CsIq5RJJFfo',
    title: 'Publier des articles et actualités',
    description:
      'Maintenez votre communauté informée. Créez et publiez des articles, actualités et messages importants sur le site.',
    category: 'pages',
    duration: '6:45',
    difficulty: 'débutant',
    relatedPages: ['/admin/blog', '/admin/news'],
    steps: [
      'Accéder à la section Blog/Actualités',
      'Créer un nouvel article',
      'Écrire le contenu',
      'Formater le texte',
      'Ajouter des images et liens',
      'Programmer la publication',
      'Promouvoir l\'article',
    ],
  },
];
