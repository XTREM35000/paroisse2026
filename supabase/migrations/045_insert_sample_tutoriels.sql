-- Insert sample tutorials into the tutoriels table
INSERT INTO public.tutoriels (title, description, youtube_id, duration, category, difficulty, steps, related_pages, created_at)
VALUES 
  (
    'Accueil et Navigation - Guide Complet',
    'Apprenez à naviguer dans l''interface d''administration, accédez au tableau de bord et découvrez toutes les fonctionnalités principales.',
    'dQw4w9WgXcQ',
    '08:32',
    'videos',
    'débutant',
    ARRAY['Connexion à l''espace admin', 'Découverte du tableau de bord', 'Navigation dans les menus', 'Accès aux paramètres'],
    ARRAY['/admin', '/admin/dashboard'],
    NOW()
  ),
  (
    'Gérer la Page d''Accueil',
    'Modifiez le contenu de votre page d''accueil, ajoutez des images, du texte et organisez les sections à votre guise.',
    'jNQXAC9IVRw',
    '12:45',
    'pages',
    'débutant',
    ARRAY['Accéder à l''éditeur de page', 'Modifier le titre et la description', 'Ajouter des images', 'Organiser les sections', 'Publier les modifications'],
    ARRAY['/admin/homepage'],
    NOW()
  ),
  (
    'Créer et Éditer des Événements',
    'Créez des événements, définissez des dates, ajoutez une description, des images et gérez les inscriptions.',
    'ZXg48Xjmvd8',
    '15:20',
    'configuration',
    'intermédiaire',
    ARRAY['Créer un nouvel événement', 'Définir la date et l''heure', 'Ajouter une description détaillée', 'Uploader une image', 'Configurer les inscriptions', 'Publier l''événement'],
    ARRAY['/admin/events'],
    NOW()
  ),
  (
    'Gérer la Galerie Photos',
    'Organisez vos photos en catégories, ajoutez des descriptions, et affichez vos images sur votre site.',
    'xB8M2OcwJ4U',
    '10:15',
    'images',
    'débutant',
    ARRAY['Créer une catégorie', 'Ajouter des photos', 'Éditer les propriétés', 'Organiser les images', 'Supprimer des photos'],
    ARRAY['/admin/gallery'],
    NOW()
  ),
  (
    'Gestion des Vidéos et Contenu Multimédia',
    'Intégrez des vidéos YouTube, créez des playlists et gérez votre contenu multimédia.',
    '9bZkp7q19f0',
    '13:50',
    'videos',
    'intermédiaire',
    ARRAY['Ajouter une vidéo YouTube', 'Créer une playlist', 'Modifier les informations', 'Définir une image de couverture', 'Gérer les autorisations'],
    ARRAY['/admin/videos'],
    NOW()
  ),
  (
    'Gestion des Utilisateurs et Rôles',
    'Administrez les utilisateurs, assignez des rôles, gérez les permissions et suivez l''activité.',
    'kJQP7kiw9Fk',
    '18:30',
    'users',
    'avancé',
    ARRAY['Accéder à la liste des utilisateurs', 'Créer un compte', 'Modifier les rôles', 'Gérer les permissions', 'Bloquer/débloquer des comptes', 'Consulter l''historique d''activité'],
    ARRAY['/admin/users'],
    NOW()
  ),
  (
    'Configuration Avancée et Paramètres',
    'Configurez les paramètres généraux du site, activez les modules, gérez les sauvegardes et bien plus.',
    'a5v6IJW_xo0',
    '22:15',
    'configuration',
    'avancé',
    ARRAY['Paramètres généraux', 'Configuration du module email', 'Gestion des sauvegardes', 'Optimisation des performances', 'Gestion du stockage', 'Backup et restauration'],
    ARRAY['/admin/settings'],
    NOW()
  ),
  (
    'Créer et Modifier des Pages',
    'Créez des pages statiques ou dynamiques, modifiez les SEO et publiez votre contenu.',
    'Dx_Z_LSxFAw',
    '11:40',
    'pages',
    'débutant',
    ARRAY['Créer une nouvelle page', 'Ajouter du contenu', 'Paramétrer les métadonnées SEO', 'Ajouter des images', 'Prévisualiser la page', 'Publier'],
    ARRAY['/admin/pages'],
    NOW()
  );
