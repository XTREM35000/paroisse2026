import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import type { LexiqueTerm } from '../types';
import { LEXIQUE_TERMS } from '../data/terms';

interface TermCardProps {
  term: LexiqueTerm;
  onRelatedTermClick?: (termId: string) => void;
}

export function TermCard({ term, onRelatedTermClick }: TermCardProps) {
  const [expandedAnnotation, setExpandedAnnotation] = useState<number | null>(null);
  
  const relatedTermData = term.relatedTerms
    .map(id => LEXIQUE_TERMS.find(t => t.id === id))
    .filter(Boolean) as LexiqueTerm[];

  const [imageLoading, setImageLoading] = useState(true);
  const [imageLoadError, setImageLoadError] = useState(false);

  const categoryColors = {
    interface: 'blue',
    navigation: 'emerald',
    content: 'amber',
    actions: 'rose',
    admin: 'purple',
  };

  const categoryColor = categoryColors[term.category];
  
  // Construire le chemin de l'image à partir de imagePath
  const imageSrc = term.imagePath ? `/images/lexique/${term.imagePath}.png` : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className={`bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow`}
    >
      {/* Header avec catégorie et icône */}
      <div className={`bg-gradient-to-r from-${categoryColor}-50 to-${categoryColor}-100 dark:from-${categoryColor}-900/20 dark:to-${categoryColor}-800/20 p-4 border-b border-gray-200 dark:border-slate-700`}>
        <div className="flex items-start justify-between mb-2">
          <span className="text-4xl">{term.icon}</span>
          <Badge className={`bg-${categoryColor}-100 text-${categoryColor}-800 dark:bg-${categoryColor}-900 dark:text-${categoryColor}-200`}>
            {term.category}
          </Badge>
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          {term.term}
        </h3>
        {term.synonyms.length > 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold">Synonymes:</span> {term.synonyms.join(', ')}
          </p>
        )}
      </div>

      {/* 🖼️ SECTION IMAGE : Image du terme */}
      {imageSrc && (
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-lg">📸</span>
              Capture réelle
            </h4>
            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
              {term.imagePath}.png
            </span>
          </div>

          {/* Conteneur de l'image */}
          <div className="relative rounded-lg overflow-hidden border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800/50">
            {imageLoading && (
              <div className="w-full h-48 flex items-center justify-center bg-gray-100 dark:bg-slate-700/50">
                <span className="text-sm text-gray-500 dark:text-gray-400">⏳ Chargement...</span>
              </div>
            )}

            {!imageLoadError && (
              <div className="relative">
                <img
                  src={imageSrc}
                  alt={term.imageCaption || `Capture du ${term.term}`}
                  className="w-full h-auto max-h-64 object-contain"
                  loading="eager"
                  onLoad={() => setImageLoading(false)}
                  onError={() => {
                    setImageLoading(false);
                    setImageLoadError(true);
                  }}
                  style={{ display: imageLoading ? 'none' : 'block' }}
                />

                {/* Annotations - Marqueurs circulaires */}
                {term.imageAnnotations && term.imageAnnotations.length > 0 && !imageLoading && (
                  <div className="absolute inset-0 pointer-events-auto">
                    {term.imageAnnotations.map((anno, idx) => {
                      return (
                        <motion.button
                          key={idx}
                          onClick={() => setExpandedAnnotation(expandedAnnotation === idx ? null : idx)}
                          className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full border-2 border-white bg-blue-500 shadow-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
                          style={{
                            left: `${anno.position.x}%`,
                            top: `${anno.position.y}%`,
                          }}
                          whileHover={{ scale: 1.2 }}
                          title={anno.label}
                        >
                          <span className="text-white text-xs font-bold">{idx + 1}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {imageLoadError && (
              <div className="image-fallback p-8 text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gray-200 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">📷</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Capture d'écran à venir
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  L'image sera ajoutée dans :<br />
                  <code className="bg-gray-200 dark:bg-slate-700 px-2 py-1 rounded text-xs mt-1 inline-block font-mono">
                    {imageSrc}
                  </code>
                </p>
              </div>
            )}
          </div>

          {/* Légende et annotations */}
          <div className="mt-3">
            {term.imageCaption && (
              <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                💡 {term.imageCaption}
              </p>
            )}

            {/* Légende des annotations */}
            {term.imageAnnotations && term.imageAnnotations.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">
                  📍 Points clés sur l'image :
                </p>
                <div className="space-y-2">
                  {term.imageAnnotations.map((anno, idx) => (
                    <motion.button
                      key={idx}
                      onClick={() => setExpandedAnnotation(expandedAnnotation === idx ? null : idx)}
                      className={`w-full text-left text-xs px-3 py-2 rounded transition-all ${
                        expandedAnnotation === idx
                          ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700'
                          : 'bg-gray-100 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 hover:bg-gray-150 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span className="font-semibold text-blue-600 dark:text-blue-300">
                        {idx + 1}. {anno.label}
                      </span>
                      {anno.description && expandedAnnotation === idx && (
                        <div className="mt-2 text-gray-700 dark:text-gray-300 text-xs whitespace-normal">
                          {anno.description}
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🎨 SECTION GALERIE : Galerie des boutons d'action */}
      {term.id === 'boutons-action' && term.additionalImages && term.additionalImages.length > 0 && (
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-lg">🎨</span>
            Tous les boutons d'action
          </h4>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {term.additionalImages.map((image, idx) => {
              const imageSrc = `/images/lexique/${image.path}.png`;
              return (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.05 }}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="relative w-full aspect-square rounded-lg border-2 border-rose-200 dark:border-rose-800 overflow-hidden bg-white dark:bg-slate-800 group-hover:border-rose-400 dark:group-hover:border-rose-600 transition-colors">
                    <img
                      src={imageSrc}
                      alt={image.label}
                      className="w-full h-full object-contain p-2"
                      loading="eager"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center');
                        e.currentTarget.parentElement!.innerHTML += '<span class="text-2xl">📷</span>';
                      }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">
                      {image.label}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {image.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* 📊 SECTION TABLEAU : Tableau de référence des actions */}
      {term.id === 'boutons-action' && term.actionReference && term.actionReference.length > 0 && (
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-lg">📊</span>
            Tableau de référence des actions
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300 dark:border-slate-600">
                  <th className="text-left py-2 px-3 font-semibold text-gray-900 dark:text-white">
                    Bouton
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-900 dark:text-white">
                    Couleur
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-900 dark:text-white">
                    Usage
                  </th>
                </tr>
              </thead>
              <tbody>
                {term.actionReference.map((action, idx) => {
                  // Déterminer la classe de couleur basée sur la valeur 'couleur'
                  const colorMap: { [key: string]: string } = {
                    'vert': 'bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500',
                    'bleu': 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500',
                    'jaune': 'bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500',
                    'rouge': 'bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500',
                    'gris': 'bg-gray-100 dark:bg-gray-700 border-l-4 border-gray-500',
                    'orange': 'bg-orange-100 dark:bg-orange-900/30 border-l-4 border-orange-500',
                  };
                  
                  const rowClass = colorMap[action.couleur] || 'bg-gray-50 dark:bg-slate-700/50';

                  return (
                    <tr
                      key={idx}
                      className={`border-b border-gray-200 dark:border-slate-700 transition-colors hover:${rowClass.split(' ')[0].replace('bg-', 'hover:bg-')} ${rowClass}`}
                    >
                      <td className="py-3 px-3">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {action.bouton}
                        </span>
                        <div className="text-xl mt-1">{action.icone}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold capitalize
                          ${action.couleur === 'vert' && 'bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-100'}
                          ${action.couleur === 'bleu' && 'bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100'}
                          ${action.couleur === 'jaune' && 'bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100'}
                          ${action.couleur === 'rouge' && 'bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100'}
                          ${action.couleur === 'gris' && 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}
                          ${action.couleur === 'orange' && 'bg-orange-200 dark:bg-orange-800 text-orange-900 dark:text-orange-100'}
                        `}>
                          {action.couleur}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-700 dark:text-gray-300">
                        {action.usage}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Légende des couleurs */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <span className="font-semibold">💡 Conseil :</span> Chaque action est codée par couleur pour une meilleure compréhension visuelle. 
              Les boutons <strong>rouges</strong> comme "Supprimer" demandent généralement une confirmation pour éviter les erreurs.
            </p>
          </div>
        </div>
      )}

      {/* Contenu */}
      <div className="p-4 space-y-4">
        {/* Qu'est-ce que c'est? */}
        <section>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <span>❓</span> Qu'est-ce que c'est ?
          </h4>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            {term.definition.what}
          </p>
        </section>

        {/* À quoi ça sert? */}
        {term.definition.purpose.length > 0 && (
          <section>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <span>⚡</span> À quoi ça sert ?
            </h4>
            <ul className="text-gray-700 dark:text-gray-300 text-sm space-y-1">
              {term.definition.purpose.map((purpose, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-gray-400 flex-shrink-0">•</span>
                  <span>{purpose}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Où le trouver? */}
        <section>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <span>📍</span> Où le trouver ?
          </h4>
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            {term.definition.location}
          </p>
        </section>

        {/* Comment l'utiliser? */}
        <section>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <span>🎯</span> Comment l'utiliser ?
          </h4>
          <div className="space-y-2 text-sm">
            {term.definition.usage.admin && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded p-3">
                <p className="font-semibold text-purple-900 dark:text-purple-200 mb-1">
                  Pour les administrateurs :
                </p>
                <p className="text-purple-800 dark:text-purple-300">
                  {term.definition.usage.admin}
                </p>
              </div>
            )}
            {term.definition.usage.user && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3">
                <p className="font-semibold text-blue-900 dark:text-blue-200 mb-1">
                  Pour les visiteurs :
                </p>
                <p className="text-blue-800 dark:text-blue-300">
                  {term.definition.usage.user}
                </p>
              </div>
            )}
            {term.definition.usage.both && (
              <div className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded p-3">
                <p className="text-gray-700 dark:text-gray-300">
                  {term.definition.usage.both}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Termes connexes */}
        {relatedTermData.length > 0 && (
          <section>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <span>🔗</span> Voir aussi
            </h4>
            <div className="flex flex-wrap gap-2">
              {relatedTermData.map(relatedTerm => (
                <button
                  key={relatedTerm.id}
                  onClick={() => onRelatedTermClick?.(relatedTerm.id)}
                  className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-300 rounded-full transition-colors border border-gray-300 dark:border-gray-600"
                >
                  {relatedTerm.icon} {relatedTerm.term}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Difficulté/Niveau */}
        {term.difficulty && (
          <section className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-600 dark:text-gray-400">Niveau:</span>
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300 font-medium capitalize">
                {term.difficulty === 'beginner' && '👶 Débutant'}
                {term.difficulty === 'intermediate' && '📚 Intermédiaire'}
                {term.difficulty === 'advanced' && '🚀 Avancé'}
              </span>
            </div>
          </section>
        )}
      </div>
    </motion.div>
  );
}
