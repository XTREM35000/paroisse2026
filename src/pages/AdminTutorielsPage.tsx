/**
 * AdminTutorielsPage - Page des tutoriels d'administration
 * Accessible uniquement aux administrateurs et modérateurs
 */
import { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/integrations/supabase/client';
import HeroBanner from '@/components/HeroBanner';
import { YouTubePlayer } from '@/components/tutoriels/YouTubePlayer';
import AddTutorielModal from '@/components/tutoriels/AddTutorielModal';
import EditTutorielModal from '@/components/tutoriels/EditTutorielModal';
import ConfirmDialog from '@/components/tutoriels/ConfirmDialog';
import { TutorielGrid } from '@/components/tutoriels/TutorielGrid';
import type { TutorielVideo } from '@/pages/AdminTutorielsPage/types';
import { BookOpen, ExternalLink } from 'lucide-react';
interface SupabaseResponse<T> {
  data: T | null;
  error: { message: string } | null;
}
export default function AdminTutorielsPage() {
  const { user, role } = useAuth();
  const { show: showToast } = useToast();
  const { profile, isLoading: userLoading } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTutoriel, setActiveTutoriel] = useState<TutorielVideo | null>(null);
  const [filteredTutoriels, setFilteredTutoriels] = useState<TutorielVideo[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [newYoutubeUrl, setNewYoutubeUrl] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmTitle, setDeleteConfirmTitle] = useState('');
  interface TutorielRow {
    id?: number | string;
    title?: string;
    description?: string;
    youtube_id?: string;
    duration?: string;
    category?: string;
    difficulty?: string;
    steps?: string[];
    related_pages?: string[];
    thumbnail_url?: string;
    created_at?: string;
  }

  // Initialiser avec le tutoriel de l'URL ou le premier
  useEffect(() => {
    const tutorialId = searchParams.get('id');
    let tutorial: TutorielVideo | null = null;
    
    if (filteredTutoriels.length > 0) {
      tutorial = filteredTutoriels.find((t) => t.id === tutorialId) || filteredTutoriels[0];
    } else {
      // Fallback: afficher un tutoriel par défaut si aucune donnée Supabase
      tutorial = {
        id: 'default',
        title: 'Bienvenue dans les Tutoriels',
        description: 'Sélectionnez un tutoriel dans la liste pour commencer.',
        youtubeId: '6y29eM5pH1A',
        duration: '00:00',
        category: 'videos',
        difficulty: 'débutant',
        steps: ['Chargement des tutoriels...'],
        relatedPages: [],
      };
    }
    
    if (tutorial) setActiveTutoriel(tutorial);
  }, [searchParams, filteredTutoriels]);

  // Charger les tutoriels réels depuis Supabase si la table existe, sinon utiliser le fallback
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = await (supabase.from('tutoriels' as any).select('*').order('created_at', { ascending: false }) as any as Promise<SupabaseResponse<TutorielRow[]>>);
        const data = res.data;
        const error = res.error;

        if (!mounted) return;
        if (error) {
          console.warn('[AdminTutoriels] supabase fetch tutoriels error', error.message || error);
          return;
        }

        if (Array.isArray(data) && data.length > 0) {
          const rows = data as unknown as TutorielRow[];
          const mapped: TutorielVideo[] = rows.map((r) => {
            const validCategory = ['videos', 'images', 'pages', 'users', 'configuration'].includes(String(r.category)) 
              ? (String(r.category) as 'videos' | 'images' | 'pages' | 'users' | 'configuration')
              : 'videos';
            const validDifficulty = ['débutant', 'intermédiaire', 'avancé'].includes(String(r.difficulty))
              ? (String(r.difficulty) as 'débutant' | 'intermédiaire' | 'avancé')
              : 'débutant';
            return {
              id: String(r.id),
              title: r.title || r.youtube_id || 'Tutoriel',
              description: r.description || '',
              youtubeId: String(r.youtube_id || ''),
              duration: r.duration || '00:00',
              category: validCategory,
              difficulty: validDifficulty,
              steps: r.steps || [],
              relatedPages: r.related_pages || [],
              thumbnailUrl: r.thumbnail_url || undefined,
            };
          });
          setFilteredTutoriels(mapped);
          if (!activeTutoriel && mapped.length > 0) setActiveTutoriel(mapped[0]);
        }
      } catch (e) {
        console.error('[AdminTutoriels] load error', e);
      }
    })();

    return () => { mounted = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // helper: extract youtube id
  function extractYouTubeId(input?: string) {
    if (!input) return '';
    try {
      const url = new URL(input);
      const host = url.hostname.replace('www.', '');
      if (host.includes('youtube.com')) {
        if (url.pathname.includes('/embed/')) return url.pathname.split('/embed/')[1].split('/')[0];
        return url.searchParams.get('v') || '';
      }
      if (host === 'youtu.be') return url.pathname.replace('/', '');
    } catch (e) {
      // fallback to regex
    }
    const m = input.match(/(?:v=|v\/|embed\/|youtu\.be\/|watch\?v=)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : input;
  }

  const handleAddYoutube = async () => {
    if (!newYoutubeUrl.trim()) return;
    const youtubeId = extractYouTubeId(newYoutubeUrl.trim());
    if (!youtubeId) return;
    setIsSaving(true);
    try {
      const payload = {
        title: `Tutoriel - ${youtubeId}`,
        youtube_id: youtubeId,
        description: '',
        category: 'videos',
        difficulty: 'débutant',
        created_at: new Date().toISOString(),
      };

      const res = await (supabase.from('tutoriels' as any).insert([payload]).select() as any as Promise<SupabaseResponse<Array<{ id?: string | number; title?: string; description?: string; youtube_id?: string; duration?: string; category?: string; difficulty?: string; steps?: string[]; related_pages?: string[] }>>>); // eslint-disable-line @typescript-eslint/no-explicit-any
      const data = res.data;
      const error = res.error;
      if (error) throw error;
      if (Array.isArray(data) && data.length > 0) {
        const row = (data[0] as Record<string, unknown>) as { id?: string | number; title?: string; description?: string; youtube_id?: string; duration?: string; category?: string; difficulty?: string; steps?: string[]; related_pages?: string[] };
        const validCategory = ['videos', 'images', 'pages', 'users', 'configuration'].includes(String(row.category))
          ? (String(row.category) as 'videos' | 'images' | 'pages' | 'users' | 'configuration')
          : 'videos';
        const validDifficulty = ['débutant', 'intermédiaire', 'avancé'].includes(String(row.difficulty))
          ? (String(row.difficulty) as 'débutant' | 'intermédiaire' | 'avancé')
          : 'débutant';
        const created: TutorielVideo = {
          id: String(row.id),
          title: row.title || `Tutoriel ${row.youtube_id || ''}`,
          description: row.description || '',
          youtubeId: String(row.youtube_id || ''),
          duration: row.duration || '00:00',
          category: validCategory,
          difficulty: validDifficulty,
          steps: row.steps || [],
          relatedPages: row.related_pages || [],
        };
        setFilteredTutoriels((prev) => [created, ...prev]);
        setActiveTutoriel(created);
        setNewYoutubeUrl('');
        showToast('Vidéo ajoutée avec succès', 'success');
      }
    } catch (e) {
      console.error('[AdminTutoriels] add error', e);
      showToast('Impossible d\'ajouter la vidéo. Vérifiez la console.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Protection: attendre que le profil soit chargé avant d'évaluer les rôles
  // Afficher l'écran de vérification pendant le chargement ou si le profil n'est pas encore initialisé
  if (user && (userLoading || profile === null)) {
    return <div className="p-6">Vérification du profil...</div>;
  }

  const roleStr = typeof role === 'string'
    ? role.toLowerCase()
    : typeof profile?.role === 'string'
      ? profile.role.toLowerCase()
      : '';
  const isAdmin = ['admin', 'super_admin', 'administrateur'].includes(roleStr);
  const isModerator = ['moderateur', 'moderator'].includes(roleStr) || isAdmin;

  if (!user || (!isAdmin && !isModerator)) {
    return <Navigate to="/" replace />;
  }

  const handleDeleteTutoriel = async (id: string, title: string) => {
    setDeleteConfirmId(id);
    setDeleteConfirmTitle(title);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const res = await (supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('tutoriels' as any)
        .delete()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .eq('id', deleteConfirmId) as any as Promise<SupabaseResponse<null>>);
      
      const error = res.error;
      if (error) throw error;

      setFilteredTutoriels(prev => prev.filter(t => t.id !== deleteConfirmId));
      if (activeTutoriel?.id === deleteConfirmId) {
        const remaining = filteredTutoriels.filter(t => t.id !== deleteConfirmId);
        setActiveTutoriel(remaining.length > 0 ? remaining[0] : null);
      }
      setDeleteConfirmId(null);
      setDeleteConfirmTitle('');
      showToast('Tutoriel supprimé avec succès', 'success');
    } catch (e) {
      console.error('[AdminTutoriels] delete error', e);
      showToast('Erreur lors de la suppression.', 'error');
      setDeleteConfirmId(null);
      setDeleteConfirmTitle('');
    }
  };

  const handleEditTutoriel = (id: string) => {
    setEditingId(id);
  };

  const editingTutoriel = filteredTutoriels.find(t => t.id === editingId) || null;


  const handleSelectTutoriel = (id: string) => {
    const tutorial = filteredTutoriels.find((t) => t.id === id);
    if (tutorial) {
      setActiveTutoriel(tutorial);
      setSearchParams({ id });
      // Scroll vers le lecteur sur mobile
      if (window.innerWidth < 768) {
        document.getElementById('tutoriel-player')?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <HeroBanner
        title="Tutoriels d'Administration"
        subtitle="Apprenez à gérer votre site paroissial étape par étape"
        description="Centre de formation complet avec des vidéos détaillées pour tous les administrateurs."
        showBackButton={true}
      />

      {/* Contenu principal */}
      <div className="container mx-auto px-4 py-12 space-y-12">
        {/* Admin: open modal to add YouTube link */}
        {(profile && (['admin', 'super_admin', 'administrateur', 'moderateur', 'moderator'].includes(String(profile.role).toLowerCase()))) && (
          <div className="mb-6 flex items-center justify-end">
            <button onClick={() => setIsAddOpen(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-md">Ajouter une vidéo</button>
          </div>
        )}

        <AddTutorielModal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onCreated={(t) => {
            setFilteredTutoriels(prev => [t, ...prev]);
            setActiveTutoriel(t);
          }}
        />
        {/* Lecteur vidéo principal */}
        {activeTutoriel && (
          <motion.section
            id="tutoriel-player"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Lecteur */}
            <div className="rounded-lg overflow-hidden bg-black shadow-2xl">
              <YouTubePlayer videoId={activeTutoriel.youtubeId} title={activeTutoriel.title} />
            </div>

            {/* Titre et description du tutoriel actif */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    {activeTutoriel.title}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                    {activeTutoriel.description}
                  </p>
                </div>
              </div>

              {/* Métadonnées */}
              <div className="flex flex-wrap gap-4 py-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Catégorie</span>
                  <p className="font-semibold text-gray-900 dark:text-white capitalize">
                    {activeTutoriel.category}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Durée</span>
                  <p className="font-semibold text-gray-900 dark:text-white">{activeTutoriel.duration}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Niveau de difficulté</span>
                  <p className="font-semibold text-gray-900 dark:text-white capitalize">
                    {activeTutoriel.difficulty}
                  </p>
                </div>
              </div>
            </div>

            {/* Étapes/points clés */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Étapes couvertes dans ce tutoriel
              </h3>
              <ol className="space-y-2">
                {activeTutoriel.steps.map((step, idx) => (
                  <li key={idx} className="flex gap-3 text-blue-800 dark:text-blue-200">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Pages associées */}
            {activeTutoriel.relatedPages.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-4 flex items-center gap-2">
                  <ExternalLink className="w-5 h-5" />
                  Pages associées
                </h3>
                <div className="flex flex-wrap gap-2">
                  {activeTutoriel.relatedPages.map((page) => (
                    <a
                      key={page}
                      href={page}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-100 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors text-sm font-medium"
                    >
                      {page}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </motion.section>
        )}

        {/* Grille de tous les tutoriels */}
        {activeTutoriel && (
          <TutorielGrid
            tutoriels={filteredTutoriels}
            activeId={activeTutoriel.id}
            onSelectTutoriel={handleSelectTutoriel}
            onDeleteTutoriel={handleDeleteTutoriel}
            onEditTutoriel={handleEditTutoriel}
          />
        )}

        {/* Modal de confirmation de suppression */}
        <ConfirmDialog
          isOpen={deleteConfirmId !== null}
          title="Supprimer le tutoriel ?"
          message={`Êtes-vous sûr de vouloir supprimer "${deleteConfirmTitle}" ? Cette action ne peut pas être annulée.`}
          onConfirm={confirmDelete}
          onCancel={() => {
            setDeleteConfirmId(null);
            setDeleteConfirmTitle('');
          }}
          isDangerous={true}
        />

        {/* Modal d'édition */}
        <EditTutorielModal
          isOpen={editingId !== null}
          tutoriel={editingTutoriel}
          onClose={() => setEditingId(null)}
          onUpdated={(updated) => {
            setFilteredTutoriels(prev => 
              prev.map(t => t.id === updated.id ? updated : t)
            );
            setActiveTutoriel(updated);
            setEditingId(null);
          }}
        />
      </div>
    </div>
  );
}
