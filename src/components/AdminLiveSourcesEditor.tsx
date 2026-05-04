import React, { useState, useEffect } from 'react';
import { Trash2, Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import useRoleCheck from '@/hooks/useRoleCheck';
import {
  fetchLiveProviderSources,
  addLiveProviderSource,
  updateLiveProviderSource,
  deleteLiveProviderSource,
} from '@/lib/supabase/mediaQueries';
import type { LiveProviderSource } from '@/types/database';

interface AdminLiveSourcesEditorProps {
  liveId: string;
  liveTitle?: string;
}

/**
 * Composant Admin pour gérer les liens fournisseurs d'un live stream
 * 
 * Permet d'ajouter, modifier et supprimer les liens YouTube, Facebook, Instagram, TikTok, etc.
 * qui s'affichent sous le lecteur vidéo.
 * 
 * @example
 * <AdminLiveSourcesEditor liveId="live-stream-id" liveTitle="Dimanche 10h" />
 */
export default function AdminLiveSourcesEditor({
  liveId,
  liveTitle = 'Live Stream',
}: AdminLiveSourcesEditorProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin } = useRoleCheck();

  const [sources, setSources] = useState<LiveProviderSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [newProvider, setNewProvider] = useState<
    'youtube' | 'facebook' | 'instagram' | 'tiktok' | 'custom'
  >('youtube');
  const [newUrl, setNewUrl] = useState('');

  // Si pas admin, ne pas afficher
  if (!user || !isAdmin) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-destructive">Accès refusé</h4>
            <p className="text-sm text-destructive/80 mt-1">
              Seuls les administrateurs peuvent gérer les liens fournisseurs
            </p>
          </div>
        </div>
      </div>
    );
  }


  // Load sources on mount
  useEffect(() => {
    const loadSources = async () => {
      try {
        setLoading(true);
        const data = await fetchLiveProviderSources(liveId);
        setSources(data);
      } catch (error) {
        console.error('Error loading sources:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les sources',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadSources();
  }, [liveId, toast]);

  /**
   * Ajouter une nouvelle source
   */
  const handleAddSource = async () => {
    if (!newUrl.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer une URL valide',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      const source = await addLiveProviderSource(liveId, newProvider, newUrl.trim());
      setSources([...sources, source]);
      setNewUrl('');
      setNewProvider('youtube');
      toast({
        title: 'Succès',
        description: `Source ${newProvider} ajoutée`,
      });
    } catch (error) {
      console.error('Error adding source:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter la source',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  /**
   * Supprimer une source
   */
  const handleDeleteSource = async (sourceId: string) => {
    try {
      setSaving(true);
      await deleteLiveProviderSource(sourceId);
      setSources(sources.filter((s) => s.id !== sourceId));
      toast({
        title: 'Succès',
        description: 'Source supprimée',
      });
    } catch (error) {
      console.error('Error deleting source:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la source',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Chargement des sources...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section titre */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Liens Fournisseurs
        </h3>
        <p className="text-sm text-muted-foreground">
          Gérez les liens YouTube, Facebook, Instagram et TikTok qui s'affichent sous le lecteur.
          Laissez vide pour ne rien afficher.
        </p>
      </div>

      {/* Formulaire d'ajout */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <h4 className="font-medium text-foreground">Ajouter un lien</h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Sélecteur de provider */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Fournisseur
            </label>
            <select
              value={newProvider}
              onChange={(e) =>
                setNewProvider(
                  e.target.value as
                  | 'youtube'
                  | 'facebook'
                  | 'instagram'
                  | 'tiktok'
                  | 'custom'
                )
              }
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground"
            >
              <option value="youtube">YouTube</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="custom">Personnalisé</option>
            </select>
          </div>

          {/* Champ URL */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">
              URL
            </label>
            <Input
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              disabled={saving}
            />
          </div>
        </div>

        <Button
          onClick={handleAddSource}
          disabled={saving || !newUrl.trim()}
          className="w-full md:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter
        </Button>
      </div>

      {/* Liste des sources */}
      <div className="space-y-3">
        <h4 className="font-medium text-foreground">
          Sources existantes ({sources.length})
        </h4>

        {sources.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Aucun lien fournisseur pour ce live.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sources.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-muted text-xs font-medium text-foreground">
                      {source.provider.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {source.url}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Créé le{' '}
                    {new Date(source.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {/* Lien externe */}
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    aria-label={`Ouvrir ${source.provider}`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>

                  {/* Bouton supprimer */}
                  <button
                    onClick={() => handleDeleteSource(source.id)}
                    disabled={saving}
                    className="p-2 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive disabled:opacity-50"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="rounded-lg border border-amber-500/50 bg-amber-50 dark:bg-amber-950/30 p-4">
        <h5 className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">
          💡 Conseil
        </h5>
        <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
          <li>• Les liens s'affichent sous le lecteur vidéo</li>
          <li>• Laissez vide pour ne rien afficher</li>
          <li>• Supportés : YouTube, Facebook, Instagram, TikTok et autres</li>
          <li>• Les utilisateurs peuvent cliquer pour ouvrir dans un nouvel onglet</li>
        </ul>
      </div>
    </div>
  );
}
