/**
 * TutorielCard - Vignette de tutoriel pour la grille
 */
import { motion } from 'framer-motion';
import { Clock, Zap, Trash2, Edit } from 'lucide-react';
import type { TutorielVideo } from '@/pages/AdminTutorielsPage/types';

interface TutorielCardProps {
  tutoriel: TutorielVideo;
  isActive: boolean;
  onClick: (id: string) => void;
  onDelete?: (id: string, title: string) => void;
  onEdit?: (id: string) => void;
}

const difficultyColors = {
  débutant: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200',
  intermédiaire: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200',
  avancé: 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200',
};

const categoryColors = {
  videos: 'from-blue-500 to-blue-600',
  images: 'from-purple-500 to-purple-600',
  pages: 'from-indigo-500 to-indigo-600',
  users: 'from-cyan-500 to-cyan-600',
  configuration: 'from-slate-500 to-slate-600',
};

export function TutorielCard({ tutoriel, isActive, onClick, onDelete, onEdit }: TutorielCardProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick(tutoriel.id)}
      className={`w-full text-left rounded-lg overflow-hidden transition-all duration-300 ${
        isActive ? 'ring-2 ring-gold shadow-xl' : 'hover:shadow-md'
      }`}
    >
      {/* Thumbnail: use custom image if provided, otherwise fallback to colored banner */}
      <div className={`aspect-video w-full relative overflow-hidden flex items-center justify-center ${tutoriel.thumbnailUrl ? '' : `bg-gradient-to-br ${categoryColors[tutoriel.category]}`}`}>
        {tutoriel.thumbnailUrl ? (
          <img src={tutoriel.thumbnailUrl} alt={tutoriel.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="text-white/90 text-4xl font-bold">▶</div>
        )}
        
        {/* Action buttons: edit (blue) and delete (red) */}
        <div className="absolute bottom-2 left-2 flex gap-1.5">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(tutoriel.id);
              }}
              className="p-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors"
              title="Éditer"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(tutoriel.id, tutoriel.title);
              }}
              className="p-1.5 bg-red-600 hover:bg-red-700 rounded text-white transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        {/* Overlay with duration */}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          {tutoriel.duration}
        </div>
        {/* Category badge */}
        <div className="absolute top-2 left-2 bg-white/90 dark:bg-slate-800 text-xs font-semibold px-2 py-1 rounded capitalize">
          {tutoriel.category}
        </div>
      </div>

      {/* Contenu */}
      <div className={`p-3 ${isActive ? 'bg-gold/10 dark:bg-gold/5' : 'bg-white dark:bg-slate-800'}`}>
        <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-2 line-clamp-2">
          {tutoriel.title}
        </h3>

        {/* Métadonnées */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{tutoriel.duration}</span>
          </div>

          <span className={`px-2 py-0.5 rounded text-xs font-medium ${difficultyColors[tutoriel.difficulty]}`}>
            {tutoriel.difficulty}
          </span>
        </div>
      </div>

      {/* Indicateur d'activation */}
      {isActive && (
        <div className="h-1 bg-gradient-to-r from-gold to-gold/50"></div>
      )}
    </motion.button>
  );
}
