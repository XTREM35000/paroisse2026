/**
 * Types pour le système de tutoriels admin
 */

export interface TutorielVideo {
  id: string;                                              // Identifiant unique (slug)
  youtubeId: string;                                       // ID YouTube
  title: string;                                           // Titre du tutoriel
  description: string;                                     // Description détaillée
  category: 'videos' | 'images' | 'pages' | 'users' | 'configuration';
  duration: string;                                        // Format: "MM:SS"
  difficulty: 'débutant' | 'intermédiaire' | 'avancé';
  relatedPages: string[];                                  // Routes admin associées
  steps: string[];                                         // Étapes/points clés
  thumbnailUrl?: string;                                   // URL custom thumbnail (optionnel)
}
