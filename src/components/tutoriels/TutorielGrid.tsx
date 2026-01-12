/**
 * TutorielGrid - Grille de vignettes de tutoriels
 */
import { motion } from 'framer-motion';
import { TutorielCard } from './TutorielCard';
import type { TutorielVideo } from '@/pages/AdminTutorielsPage/types';

interface TutorielGridProps {
  tutoriels: TutorielVideo[];
  activeId: string;
  onSelectTutoriel: (id: string) => void;
  onDeleteTutoriel?: (id: string, title: string) => void;
  onEditTutoriel?: (id: string) => void;
}

export function TutorielGrid({ tutoriels, activeId, onSelectTutoriel, onDeleteTutoriel, onEditTutoriel }: TutorielGridProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Titre de section */}
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Tous les tutoriels ({tutoriels.length})
        </h2>
        <div className="flex-1 h-0.5 bg-gradient-to-r from-gold to-transparent"></div>
      </div>

      {/* Grille responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tutoriels.map((tutoriel) => (
          <TutorielCard
            key={tutoriel.id}
            tutoriel={tutoriel}
            isActive={activeId === tutoriel.id}
            onClick={onSelectTutoriel}
            onDelete={onDeleteTutoriel}
            onEdit={onEditTutoriel}
          />
        ))}
      </div>

      {/* Message si vide */}
      {tutoriels.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-lg">Aucun tutoriel disponible pour le moment.</p>
        </div>
      )}
    </motion.div>
  );
}
