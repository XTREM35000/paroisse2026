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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
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
    is_active: false,
  });

  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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
  const handleDeleteStream = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce direct ?')) return;

    try {
      setSaving(true);
      await deleteLiveStream(id);
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
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew} size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Direct
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingStream ? 'Modifier le Direct' : 'Créer un Nouveau Direct'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
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
                  <Select value={formData.stream_type} onValueChange={(value) => setFormData({ ...formData, stream_type: value as 'tv' | 'radio' })}>
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
              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Annuler
                </Button>
                <Button onClick={handleSaveStream} disabled={saving}>
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

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
                      onClick={() => handleDeleteStream(stream.id)}
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
      </div>
    </div>
  );
};

export default AdminLiveEditor;
