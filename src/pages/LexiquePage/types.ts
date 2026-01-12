/**
 * Types pour le Lexique du Site Paroissial
 */

export type LexiqueCategory = 'interface' | 'navigation' | 'content' | 'actions' | 'admin';

export interface LexiqueCategoryMetadata {
  id: LexiqueCategory;
  name: string;
  icon: string;
  description: string;
  color: string; // Tailwind color class
}

export interface AnnotationMarker {
  x: string; // Position X (px ou %)
  y: string; // Position Y (px ou %)
  text: string;
  type: 'primary' | 'secondary';
}

export interface LexiqueScreenshot {
  path: string; // Chemin vers l'image
  alt: string;
  annotations: AnnotationMarker[];
}

export interface ImageAnnotation {
  label: string;
  description?: string;
  position: { x: number; y: number }; // pourcentages 0-100
}

export interface AdditionalImage {
  label: string;
  path: string; // ex: "actions/televerser" (sans extension)
  description: string;
}

export interface ActionReference {
  bouton: string;
  couleur: string; // 'vert', 'rouge', 'bleu', 'jaune', 'gris', 'orange'
  icone: string;
  usage: string;
}

export interface LexiqueUsage {
  admin?: string; // Instructions pour les administrateurs
  user?: string; // Instructions pour les visiteurs
  both?: string; // Instructions communes
}

export interface LexiqueTerm {
  id: string;
  term: string; // Terme français principal
  synonyms: string[]; // Autres noms possibles
  category: LexiqueCategory;
  icon: string; // Emoji ou nom d'icône lucide-react
  definition: {
    what: string; // Description simple: "Qu'est-ce que c'est?"
    purpose: string[]; // À quoi ça sert? (liste à puces)
    location: string; // Où le trouver?
    usage: LexiqueUsage; // Comment l'utiliser?
  };
  screenshot?: LexiqueScreenshot; // Capture optionnelle (héritage)
  // Nouveaux champs pour mapping d'images
  imagePath?: string; // ex: "interface/banner" (sans extension)
  imageCaption?: string;
  imageAnnotations?: ImageAnnotation[];
  // Champs pour galerie d'images supplémentaires (ex: "Boutons d'Action")
  additionalImages?: AdditionalImage[];
  // Tableau de référence pour les actions (ex: "Boutons d'Action")
  actionReference?: ActionReference[];
  relatedTerms: string[]; // IDs des termes liés
  difficulty?: 'beginner' | 'intermediate' | 'advanced'; // Niveau de complexité
}


