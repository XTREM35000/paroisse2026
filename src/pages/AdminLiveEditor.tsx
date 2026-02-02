import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Edit2, Radio, Tv } from 'lucide-react';
import usePageHero from '@/hooks/usePageHero';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DraggableModal from '@/components/DraggableModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import useRoleCheck from '@/hooks/useRoleCheck';
import { fetchAllLiveStreams, upsertLiveStream, deleteLiveStream, deactivateOtherLiveStreams, type LiveStream } from '@/lib/supabase/mediaQueries';

const AdminLiveEditor = () => {
  const navigate = useNavigate();
  const { isAdmin } = useRoleCheck();
  const { toast } = useToast();

  // Form states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStream, setEditingStream] = useState<LiveStream | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    stream_url: '',
    stream_type: 'tv' as 'tv' | 'radio',
    provider: 'youtube' as 'youtube' | 'api_video' | 'radio_stream',
    is_active: false,
  });

  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteStreamId, setDeleteStreamId] = useState<string | null>(null);

  // Load live streams
  const loadLiveStreams = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchAllLiveStreams({ limit: 50 });
      setLiveStreams(result.data);
    } catch (e) {
      console.error('Error loading live streams:', e);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les directs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadLiveStreams();
  }, [loadLiveStreams]);

  // Reset form
  const resetForm = () => {
    setEditingStream(null);
    setFormData({
      title: '',
      stream_url: '',
      stream_type: 'tv',
      provider: 'youtube',
      is_active: false,
    });
  }; 

  // Open dialog for adding
  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Open dialog for editing
  const handleEdit = (stream: LiveStream) => {
    setEditingStream(stream);
    setFormData({
      title: stream.title,
      stream_url: stream.stream_url,
      stream_type: stream.stream_type,
      provider: stream.provider ?? (stream.stream_type === 'tv' ? 'youtube' : 'radio_stream'),
      is_active: stream.is_active,
    });
    setIsDialogOpen(true);
  }; 

  // Save stream (create or update)
  const handleSaveStream = async () => {
    if (!formData.title.trim() || !formData.stream_url.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir le titre et l\'URL du direct',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      // Validate provider for stream type
      if (!formData.provider) {
        toast({ title: 'Erreur', description: 'Veuillez sélectionner un fournisseur', variant: 'destructive' });
        return;
      }

      if (formData.stream_type === 'tv' && formData.provider === 'radio_stream') {
        toast({ title: 'Erreur', description: 'Un flux TV ne peut pas avoir le fournisseur "Radio Stream"', variant: 'destructive' });
        return;
      }

      if (formData.stream_type === 'radio' && formData.provider !== 'radio_stream') {
        toast({ title: 'Erreur', description: 'Un flux Radio doit utiliser le fournisseur "Radio Stream"', variant: 'destructive' });
        return;
      }

      // If activating this stream, deactivate others
      if (formData.is_active) {
        if (editingStream?.id) {
          await deactivateOtherLiveStreams(editingStream.id);
        }
      }

      const result = await upsertLiveStream({
        id: editingStream?.id,
        title: formData.title,
        stream_url: formData.stream_url,
        stream_type: formData.stream_type,
        provider: formData.provider,
        is_active: formData.is_active,
      });

      toast({
        title: 'Succès',
        description: editingStream ? 'Direct mis à jour' : 'Direct créé',
      });

      setIsDialogOpen(false);
      await loadLiveStreams();
    } catch (e) {
      console.error('Error saving stream:', e);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le direct',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete stream
  const handleDeleteStream = async () => {
    if (!deleteStreamId) return;

    try {
      setSaving(true);
      await deleteLiveStream(deleteStreamId);
      toast({
        title: 'Succès',
        description: 'Direct supprimé',
      });
      await loadLiveStreams();
    } catch (e) {
      console.error('Error deleting stream:', e);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le direct',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
      setDeleteStreamId(null);
    }
  };

  // Toggle active status
  const handleToggleActive = async (stream: LiveStream) => {
    try {
      setSaving(true);

      if (!stream.is_active) {
        // Activating - deactivate others
        await deactivateOtherLiveStreams(stream.id);
      }

      const result = await upsertLiveStream({
        id: stream.id,
        title: stream.title,
        stream_url: stream.stream_url,
        stream_type: stream.stream_type,
        provider: stream.provider ?? (stream.stream_type === 'tv' ? 'youtube' : 'radio_stream'),
        is_active: !stream.is_active,
      });

      toast({
        title: 'Succès',
        description: result.is_active ? 'Direct activé' : 'Direct désactivé',
      }); 

      await loadLiveStreams();
    } catch (e) {
      console.error('Error toggling stream:', e);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le direct',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Accès refusé</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Vous n'avez pas les droits nécessaires pour administrer cette page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-accent rounded transition"
              title="Retour"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold">Gestion des Directs</h1>
              <p className="text-sm text-muted-foreground mt-1">Créez et gérez les diffusions live de votre paroisse</p>
            </div>
          </div>
          <Button onClick={handleAddNew} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Direct
          </Button>
        </div>

        {/* Create/Edit Dialog - Draggable */}
        <DraggableModal open={isDialogOpen} onClose={() => {
          setIsDialogOpen(false);
          resetForm();
        }} dragHandleOnly={true}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-border" data-drag-handle>
            <h2 className="text-lg font-semibold">
              {editingStream ? 'Modifier le Direct' : 'Créer un Nouveau Direct'}
            </h2>
            <button
              onClick={() => {
                setIsDialogOpen(false);
                resetForm();
              }}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4 py-4 px-6 max-h-[calc(100vh-300px)] overflow-y-auto">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Titre du direct</Label>
              <Input
                id="title"
                placeholder="Ex: Messe Dominicale - 1er Février"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {/* Stream Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Type de diffusion</Label>
              <Select value={formData.stream_type} onValueChange={(value) => setFormData({ ...formData, stream_type: value as 'tv' | 'radio', provider: value === 'tv' ? (formData.provider ?? 'youtube') : 'radio_stream' })}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger> 
                <SelectContent>
                  <SelectItem value="tv">
                    <div className="flex items-center gap-2">
                      <Tv className="w-4 h-4" />
                      TV (Messe en direct)
                    </div>
                  </SelectItem>
                  <SelectItem value="radio">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4" />
                      Radio (Podcast en direct)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Stream URL */}
            <div className="space-y-2">
              <Label htmlFor="url">URL du direct ou ID YouTube</Label>
              <Input
                id="url"
                placeholder={formData.stream_type === 'tv'
                  ? "Ex: https://youtube.com/watch?v=ABCD1234 ou ABCD1234"
                  : "Ex: https://example.com/live-audio-stream"}
                value={formData.stream_url}
                onChange={(e) => setFormData({ ...formData, stream_url: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                {formData.stream_type === 'tv'
                  ? 'Lien YouTube ou ID vidéo à 11 caractères'
                  : 'URL du flux audio en direct (m3u8, mp3, etc.)'}
              </p>
            </div>

            {/* Provider */}
            <div className="space-y-2">
              <Label htmlFor="provider">Fournisseur (provider)</Label>
              <Select value={formData.provider} onValueChange={(value) => setFormData({ ...formData, provider: value as 'youtube' | 'api_video' | 'radio_stream' })}>
                <SelectTrigger id="provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">
                    YouTube
                  </SelectItem>
                  <SelectItem value="api_video">
                    api.video
                  </SelectItem>
                  <SelectItem value="radio_stream">
                    Radio Stream (Audio)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choisissez le fournisseur du flux. Pour la TV: YouTube ou api.video. Pour la Radio: Radio Stream.
              </p>
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between rounded-lg border border-border p-3"> 
              <div>
                <Label className="text-base font-medium">Activer ce direct</Label>
                <p className="text-xs text-muted-foreground">Les autres directs seront désactivés</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <div className="flex gap-2 px-6 py-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                resetForm();
              }}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button onClick={handleSaveStream} disabled={saving} className="flex-1">
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </DraggableModal>

        {/* Content */}
        <div className="space-y-6">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Chargement des directs...</p>
              </CardContent>
            </Card>
          ) : liveStreams.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Tv className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-4">Aucun direct créé</p>
                <Button onClick={handleAddNew}>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un direct
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveStreams.map((stream) => (
                <Card key={stream.id} className={stream.is_active ? 'border-primary ring-1 ring-primary' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{stream.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          {stream.stream_type === 'tv' ? (
                            <Tv className="w-4 h-4 text-blue-500" />
                          ) : (
                            <Radio className="w-4 h-4 text-green-500" />
                          )}
                          <span className="text-xs font-medium uppercase text-muted-foreground">
                            {stream.stream_type === 'tv' ? 'TV' : 'Radio'}
                          </span>
                          {stream.is_active && (
                            <span className="ml-auto text-xs font-bold text-red-500">● EN DIRECT</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">URL</p>
                      <p className="text-sm break-all text-foreground line-clamp-2">{stream.stream_url}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">Fournisseur</p>
                      <p className="text-sm text-foreground">{stream.provider ?? (stream.stream_type === 'tv' ? 'youtube' : 'radio_stream')}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">Statut</p>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={stream.is_active}
                          onCheckedChange={() => handleToggleActive(stream)}
                          disabled={saving}
                        />
                        <span className="text-sm">
                          {stream.is_active ? 'Activé' : 'Désactivé'}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Créé le {new Date(stream.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </CardContent>
                  <div className="flex gap-2 p-4 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(stream)}
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => setDeleteStreamId(stream.id)}
                      disabled={saving}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteStreamId !== null} onOpenChange={(open) => {
          if (!open) setDeleteStreamId(null);
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer ce direct ? Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3 justify-end">
              <AlertDialogCancel disabled={saving}>
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteStream}
                disabled={saving}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {saving ? 'Suppression...' : 'Supprimer'}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default AdminLiveEditor;
