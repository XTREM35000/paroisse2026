import React, { useState } from 'react';
import { motion } from 'framer-motion';
import HeroBanner from '@/components/HeroBanner';

export default function DocProjetPage() {
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* HERO BANNER */}
      <HeroBanner
        title="Votre Média Paroissial"
        subtitle="Spécificités & Avantages Compétitifs"
        backgroundImage={undefined}
        showBackButton={true}
      />

      {/* CONTENU PRINCIPAL */}
      <main className="container mx-auto max-w-4xl px-4 py-12">
        {/* SECTION VISION */}
        <motion.section
          className="mb-12 p-8 rounded-lg bg-gradient-to-r from-blue-50 to-amber-50 dark:from-blue-900/20 dark:to-amber-900/20 border-l-4 border-blue-600 dark:border-blue-400"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <h2 className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
            🌟 Introduction & Vision Pastorale
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-justify mb-4">
            À l'ère du numérique, la communication paroissiale est souvent fragmentée entre différents réseaux sociaux et outils, diluant le message et perdant le contrôle des données. Votre <span className="font-semibold">Média Paroissial</span> rompt avec ce modèle. Il ne s'agit pas d'un simple site web, mais d'un <span className="font-semibold">écosystème numérique intégré</span>, conçu spécifiquement pour <span className="font-semibold">renforcer les liens communautaires</span> dans un espace sécurisé et centré sur la foi.
          </p>
          
          <button
            onClick={() => toggleSection('vision-details')}
            className="mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-semibold"
          >
            {expandedSections['vision-details'] ? '📖 Masquer' : '📖 Voir'} les points-clés de la vision
          </button>
          
          {expandedSections['vision-details'] && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <p className="text-gray-700 dark:text-gray-300 font-semibold mb-3">Cette plateforme incarne une vision pastorale moderne :</p>
              <ul className="space-y-2 ml-6">
                <li className="flex gap-3 text-gray-700 dark:text-gray-300">
                  <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                  <span><span className="font-semibold">Un Espace Protégé</span> : Une communauté en ligne à l'abri des algorithmes commerciaux et des publicités inappropriées.</span>
                </li>
                <li className="flex gap-3 text-gray-700 dark:text-gray-300">
                  <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                  <span><span className="font-semibold">Un Outil de Mission</span> : Une vitrine conçue pour partager la foi, les annonces et les célébrations, et non pour générer du "clique".</span>
                </li>
                <li className="flex gap-3 text-gray-700 dark:text-gray-300">
                  <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                  <span><span className="font-semibold">Un Centre de Vie Paroissiale</span> : Un point d'accès unique et intuitif pour tous les besoins numériques de vos fidèles et de vos équipes.</span>
                </li>
              </ul>
            </motion.div>
          )}
        </motion.section>

        {/* SECTION SPÉCIFICITÉS */}
        <motion.section
          className="mb-12 p-8 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-md"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
            🎯 Nos Spécificités Fondamentales
          </h2>
          
          <h3 className="text-2xl font-semibold text-amber-900 dark:text-amber-200 mt-6 mb-3">1. Une Plateforme 100% Intégrée & Unifiée</h3>
          <p className="text-gray-700 dark:text-gray-300 text-justify mb-4">
            Finis la dispersion entre Facebook, YouTube, les newsletters et les outils de dons externes. Votre Média Paroissial consolide <span className="font-semibold">l'ensemble des fonctions vitales</span> en un seul environnement cohérent.
          </p>
          
          <button
            onClick={() => toggleSection('features-table')}
            className="mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-semibold"
          >
            {expandedSections['features-table'] ? '📊 Masquer' : '📊 Afficher'} le tableau des fonctionnalités
          </button>
          
          {expandedSections['features-table'] && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="overflow-x-auto mb-6"
            >
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-600 dark:bg-blue-900 text-white">
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left">Besoin Pastoral</th>
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left">Solution Intégrée</th>
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left">Avantage</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gray-50 dark:bg-slate-700/50">
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3"><span className="font-semibold">Contenu & Actualités</span></td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">Pages éditables en direct</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3"><span className="text-green-600 font-bold">✓</span> Modification sans code</td>
                  </tr>
                  <tr className="bg-white dark:bg-slate-800">
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3"><span className="font-semibold">Médias & Diffusion</span></td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">Lecteur vidéo avancé</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3"><span className="text-green-600 font-bold">✓</span> Partage sans publicités</td>
                  </tr>
                  <tr className="bg-gray-50 dark:bg-slate-700/50">
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3"><span className="font-semibold">Vie Communautaire</span></td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">Annuaire, messagerie, profils</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3"><span className="text-green-600 font-bold">✓</span> Connexions authentiques</td>
                  </tr>
                  <tr className="bg-white dark:bg-slate-800">
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3"><span className="font-semibold">Engagement & Don</span></td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">Système de dons intégré</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-3"><span className="text-green-600 font-bold">✓</span> Générosité simplifiée</td>
                  </tr>
                </tbody>
              </table>
            </motion.div>
          )}
          
          <h3 className="text-2xl font-semibold text-amber-900 dark:text-amber-200 mt-8 mb-3">2. Une Architecture Conçue pour la Confiance</h3>
          <p className="text-gray-700 dark:text-gray-300 text-justify mb-4">
            La confiance est au cœur d'une communauté. Notre plateforme l'intègre à chaque niveau avec une <span className="font-semibold">souveraineté des données</span> (votre base Supabase), une <span className="font-semibold">sécurité granulaire</span> par rôles, et une <span className="font-semibold">modération totale</span>.
          </p>
          
          <h3 className="text-2xl font-semibold text-amber-900 dark:text-amber-200 mt-8 mb-3">3. Une Expérience Utilisateur Moderne</h3>
          <p className="text-gray-700 dark:text-gray-300 text-justify">
            Interface responsive (Tailwind CSS), personnalisation complète sans code, et performances optimales (React 18 + Vite).
          </p>
        </motion.section>

        {/* SECTION COMPARAISON */}
        <motion.section
          className="mb-12 p-8 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-md"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-6 flex items-center gap-2">
            ⚖️ Avantages Compétitifs : Comparaison Détaillée
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-blue-600 dark:bg-blue-900 text-white">
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left">Fonctionnalité</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left">Réseaux Sociaux Génériques</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left">Votre Média Paroissial</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left">Notre Avantage</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-gray-50 dark:bg-slate-700/50">
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3"><span className="font-semibold">Contrôle des Données</span></td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3"><span className="text-red-600 font-bold">✗</span> À la plateforme</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3"><span className="text-green-600 font-bold">✓</span> Vous êtes propriétaire</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">Indépendance & pérennité</td>
                </tr>
                <tr className="bg-white dark:bg-slate-800">
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3"><span className="font-semibold">Visibilité</span></td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3"><span className="text-red-600 font-bold">✗</span> Algorithmes opaques</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3"><span className="text-green-600 font-bold">✓</span> Visibilité garantie</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">Maîtrise communication</td>
                </tr>
                <tr className="bg-gray-50 dark:bg-slate-700/50">
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3"><span className="font-semibold">Publicités</span></td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3"><span className="text-red-600 font-bold">✗</span> Commerciales intrusives</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3"><span className="text-green-600 font-bold">✓</span> Espace sans pub</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">Expérience sereine</td>
                </tr>
                <tr className="bg-white dark:bg-slate-800">
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3"><span className="font-semibold">Modération</span></td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3"><span className="text-red-600 font-bold">✗</span> Limité, réactive</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3"><span className="text-green-600 font-bold">✓</span> Proactive et complète</td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3">Espace sécurisé</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* SECTION AVANTAGES */}
        <motion.section
          className="mb-12 p-8 rounded-lg bg-gradient-to-r from-amber-50 to-green-50 dark:from-amber-900/20 dark:to-green-900/20 border-l-4 border-green-600 dark:border-green-400"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-3xl font-bold text-amber-900 dark:text-amber-100 mb-4 flex items-center gap-2">
            💪 Pourquoi Notre Solution Est Plus Adaptée ?
          </h2>
          
          <button
            onClick={() => toggleSection('advantages-list')}
            className="mb-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 font-semibold"
          >
            {expandedSections['advantages-list'] ? '📋 Masquer' : '📋 Développer'} les 5 avantages clés
          </button>
          
          {expandedSections['advantages-list'] && (
            <motion.ol
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 ml-6 mb-6"
            >
              <li className="flex gap-3 text-gray-700 dark:text-gray-300">
                <span className="text-green-600 font-bold flex-shrink-0 text-lg">1.</span>
                <span><span className="font-semibold">Elle répond aux vrais besoins pastoraux</span> : Conçue spécifiquement pour les activités d'une paroisse.</span>
              </li>
              <li className="flex gap-3 text-gray-700 dark:text-gray-300">
                <span className="text-green-600 font-bold flex-shrink-0 text-lg">2.</span>
                <span><span className="font-semibold">Elle sécurise et rassure votre communauté</span> : Espace contrôlé sans intrusion publicitaire.</span>
              </li>
              <li className="flex gap-3 text-gray-700 dark:text-gray-300">
                <span className="text-green-600 font-bold flex-shrink-0 text-lg">3.</span>
                <span><span className="font-semibold">Elle vous rend autonome et professionnel</span> : Interfaces admin intuitives pour gérer sans dépendance technique.</span>
              </li>
              <li className="flex gap-3 text-gray-700 dark:text-gray-300">
                <span className="text-green-600 font-bold flex-shrink-0 text-lg">4.</span>
                <span><span className="font-semibold">Elle est un levier d'engagement</span> : Centralise la vie paroissiale et renforce l'appartenance.</span>
              </li>
              <li className="flex gap-3 text-gray-700 dark:text-gray-300">
                <span className="text-green-600 font-bold flex-shrink-0 text-lg">5.</span>
                <span><span className="font-semibold">Elle est pérenne et évolutive</span> : Architecture moderne et documentation exhaustive pour grandir avec vous.</span>
              </li>
            </motion.ol>
          )}
          
          <h3 className="text-2xl font-semibold text-amber-900 dark:text-amber-200 mt-8 mb-3">🚀 Conclusion : Votre Vitrine Numérique pour l'Avenir</h3>
          <p className="text-gray-700 dark:text-gray-300 text-justify">
            Votre Média Paroissial est la <span className="font-semibold">pièce maîtresse d'une stratégie de communication pastorale moderne, maîtrisée et tournée vers la communauté</span>. Il représente un avantage stratégique durable en vous permettant de reprendre la main sur votre présence numérique.
          </p>
        </motion.section>

        {/* FOOTER */}
        <motion.div
          className="text-center mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
        >
          <p className="font-semibold mb-2">Document établi par l'équipe de développement</p>
          <p className="mb-2">Pour toute question, contactez votre référent technique : Thierry Gogo</p>
          <p className="text-sm">📧 2024dibo@gmail.com | 📞 07 58 96 61 56</p>
        </motion.div>
      </main>
    </div>
  );
}