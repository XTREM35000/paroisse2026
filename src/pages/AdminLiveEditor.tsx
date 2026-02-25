import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit2, Radio, Tv } from 'lucide-react';
import usePageHero from '@/hooks/usePageHero';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StreamEditorModal from '@/components/StreamEditorModal';
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
import { StreamFormFields } from '@/components/form/StreamFormFields';
import {
  fetchAllLiveStreams,
  upsertLiveStream,
  deleteLiveStream,
  deactivateOtherLiveStreams,
  getLiveStats,
  type LiveStream,
  type LiveStats,
} from '@/lib/supabase/mediaQueries';
import { ProviderManager, streamManager } from '@/lib/providers';
import type { ProviderType } from '@/lib/providers/types';

const AdminLiveEditor: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useRoleCheck();
  const { toast } = useToast();

  type FormData = {
    title: string;
    provider: 'youtube' | 'facebook' | 'twitch' | 'tiktok';
    video_id: string;
    is_active: boolean;
    scheduled_at: string;
  };

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStream, setEditingStream] = useState<LiveStream | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    provider: 'youtube',
    video_id: '',
    is_active: false,
    scheduled_at: '',
  });

  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteStreamId, setDeleteStreamId] = useState<string | null>(null);
  const [statsMap, setStatsMap] = useState<Record<string, LiveStats | null>>({});

  const loadLiveStreams = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAllLiveStreams({ limit: 50 });
      setLiveStreams(result.data || []);

      // load stats
      try {
        const statsResults = await Promise.all(
          (result.data || []).map(async (s) => ({ id: s.id, stats: await getLiveStats(s.id) }))
        );
        const map: Record<string, LiveStats | null> = {};
        statsResults.forEach((r) => (map[r.id] = r.stats));
        setStatsMap(map);
      } catch (e) {
        console.warn('Unable to fetch stats', e);
      }
    } catch (e) {
      console.error('Error loading live streams', e);
      toast({ title: 'Erreur', description: 'Impossible de charger les directs', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadLiveStreams();
  }, [loadLiveStreams]);

  const resetForm = () => {
    setEditingStream(null);
    setFormData({ title: '', provider: 'youtube', video_id: '', is_active: false, scheduled_at: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.currentTarget as HTMLInputElement;
    setFormData((f) => ({ ...f, [name]: value }));
  };

  const handleProviderChange = (v: string) => {
    // only accept the four supported providers; fallback to YouTube
    const allowedProviders = ['youtube', 'facebook', 'twitch', 'tiktok'] as const;
    const p = allowedProviders.includes(v as FormData['provider'])
      ? (v as FormData['provider'])
      : 'youtube';
    setFormData((f) => ({ ...f, provider: p, video_id: '' }));
  };


  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (stream: LiveStream) => {
    setEditingStream(stream);
    // only allow known options; otherwise default to YouTube
    const allowed: FormData['provider'][] = ['youtube', 'facebook', 'twitch', 'tiktok'];
    const prov = allowed.includes(stream.provider as FormData['provider']) ? (stream.provider as FormData['provider']) : 'youtube';
    setFormData({
      title: stream.title || '',
      provider: prov,
      video_id: stream.video_id || '',
      is_active: !!stream.is_active,
      scheduled_at: stream.scheduled_at ?? '',
    });
    setIsDialogOpen(true);
  };

  const handleSaveStream = async () => {
    if (!formData.title.trim()) {
      toast({ title: 'Erreur', description: 'Veuillez remplir le titre', variant: 'destructive' });
      return;
    }
    if (!formData.provider || !formData.video_id.trim()) {
      toast({ title: 'Erreur', description: 'Veuillez sélectionner un fournisseur et entrer un ID', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      // compute embed url as fallback using provider-specific helpers
      const { getEmbedUrl, extractVideoId } = await import('@/lib/providers/videoUtils');
      const id = extractVideoId(formData.video_id.trim(), formData.provider);
      const embedUrl = getEmbedUrl(formData.provider, id);

      if (formData.is_active && editingStream?.id) {
        await deactivateOtherLiveStreams(editingStream.id);
      }

      const scheduledAtISO = formData.scheduled_at ? new Date(formData.scheduled_at).toISOString() : null;

      await upsertLiveStream({
        id: editingStream?.id,
        title: formData.title,
        provider: formData.provider as ProviderType,
        video_id: id,
        stream_url: embedUrl,
        stream_type: 'tv',
        is_active: formData.is_active,
        scheduled_at: scheduledAtISO,
      });

      toast({ title: 'Succès', description: editingStream ? 'Direct mis à jour' : 'Direct créé' });
      setIsDialogOpen(false);
      resetForm();
      await loadLiveStreams();
    } catch (e) {
      console.error('Error saving stream', e);
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder le direct', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStream = async () => {
    if (!deleteStreamId) return;
    setSaving(true);
    try {
      await deleteLiveStream(deleteStreamId);
      toast({ title: 'Succès', description: 'Direct supprimé' });
      setDeleteStreamId(null);
      await loadLiveStreams();
    } catch (e) {
      console.error('Error deleting stream', e);
      toast({ title: 'Erreur', description: 'Impossible de supprimer le direct', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleToggleActive = async (stream: LiveStream) => {
    setSaving(true);
    try {
      if (!stream.is_active) await deactivateOtherLiveStreams(stream.id);
      await upsertLiveStream({
        id: stream.id,
        title: stream.title,
        stream_url: stream.stream_url,
        provider: stream.provider || 'youtube',
        stream_type: stream.stream_type || 'tv',
        is_active: !stream.is_active,
      });
      toast({ title: 'Succès', description: !stream.is_active ? 'Direct activé' : 'Direct désactivé' });
      await loadLiveStreams();
    } catch (e) {
      console.error('Error toggling', e);
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour le direct', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader><CardTitle>Accès refusé</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Vous n'avez pas les droits nécessaires pour administrer cette page.</p></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-accent rounded transition" title="Retour"><ArrowLeft className="w-5 h-5" /></button>
            <div>
              <h1 className="text-3xl font-bold">Gestion des Directs</h1>
              <p className="text-sm text-muted-foreground mt-1">Créez et gérez les diffusions live</p>
            </div>
          </div>
          <Button onClick={handleAddNew} size="lg"><Plus className="w-4 h-4 mr-2"/>Nouveau Direct</Button>
        </div>

        <StreamEditorModal
          open={isDialogOpen}
          onClose={() => { setIsDialogOpen(false); resetForm(); }}
          title={editingStream ? 'Modifier le direct' : 'Créer un direct'}
        >
          <form onSubmit={(e) => { e.preventDefault(); handleSaveStream(); }} className="space-y-5">
            {/* Titre et Actif - Titre prend l'espace, Actif à droite */}
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Label htmlFor="title">Titre du direct</Label>
                <Input name="title" id="title" value={formData.title} onChange={handleChange} placeholder="Ex: Messe dominicale" required />
              </div>
              <div className="flex items-center gap-2 pb-2">
                <Label htmlFor="is_active" className="text-sm">Activer</Label>
                <Switch id="is_active" checked={formData.is_active} onCheckedChange={(v) => setFormData((f) => ({ ...f, is_active: v }))} />
              </div>
            </div>

            {/* Fournisseur + identifiant simplifié */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="provider">Plateforme</Label>
                <Select value={formData.provider} onValueChange={handleProviderChange}>
                  <SelectTrigger id="provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="twitch">Twitch</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="video_id">
                {formData.provider === 'youtube' && 'ID YouTube'}
                {formData.provider === 'facebook' && 'ID Facebook'}
                {formData.provider === 'twitch' && 'Chaîne Twitch'}
                {formData.provider === 'tiktok' && 'Identifiant TikTok'}
              </Label>
              <Input
                name="video_id"
                id="video_id"
                value={formData.video_id}
                onChange={handleChange}
                placeholder={
                  formData.provider === 'youtube'
                    ? 'dQw4w9WgXcQ'
                    : formData.provider === 'facebook'
                    ? '1261288742544535'
                    : formData.provider === 'twitch'
                    ? 'ndcompassion'
                    : formData.provider === 'tiktok'
                    ? '@ndcompassion/live'
                    : ''
                }
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.provider === 'youtube' && 'Ex: dQw4w9WgXcQ (depuis youtu.be/ID ou youtube.com/watch?v=ID)'}
                {formData.provider === 'facebook' && 'Ex: 1261288742544535 (depuis facebook.com/video_id)'}
                {formData.provider === 'twitch' && 'Nom de la chaîne uniquement'}
                {formData.provider === 'tiktok' && 'Format: @username/live'}
              </p>
            </div>


            {/* Programmation - seulement si pas YouTube */}
            {formData.provider !== 'youtube' && (
              <div>
                <Label htmlFor="scheduled_at">Programmation (optionnel)</Label>
                <Input name="scheduled_at" id="scheduled_at" type="datetime-local" value={formData.scheduled_at} onChange={handleChange} />
                <p className="text-xs text-muted-foreground mt-1">Laissez vide si le direct est immédiat</p>
              </div>
            )}

            {/* Boutons */}
            <div className="flex gap-2 justify-end pt-4 border-t">
              <button
                type="button"
                onClick={() => { setIsDialogOpen(false); resetForm(); }}
                className="px-4 py-2 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </StreamEditorModal>

        <div className="space-y-6">
          {loading ? (
            <Card><CardContent className="py-12 text-center">Chargement des directs...</CardContent></Card>
          ) : liveStreams.length === 0 ? (
            <Card><CardContent className="py-12 text-center">Aucun direct créé <div className="mt-3"><Button onClick={handleAddNew}><Plus className="w-4 h-4 mr-2"/>Créer</Button></div></CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveStreams.map((stream) => (
                <Card key={stream.id} className={stream.is_active ? 'border-primary ring-1 ring-primary' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{stream.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          {stream.stream_type === 'tv' ? <Tv className="w-4 h-4 text-blue-500" /> : <Radio className="w-4 h-4 text-green-500" />}
                          <span className="text-xs uppercase text-muted-foreground">{stream.stream_type}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(stream)}><Edit2 className="w-4 h-4"/></Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeleteStreamId(stream.id)}><Trash2 className="w-4 h-4"/></Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm break-all">
                      {stream.video_id ? `${stream.provider}: ${stream.video_id}` : stream.stream_url}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">Fournisseur: {stream.provider}</div>
                      <div className="flex items-center gap-2">
                        <Switch checked={stream.is_active} onCheckedChange={() => handleToggleActive(stream)} disabled={saving} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <AlertDialog open={deleteStreamId !== null} onOpenChange={(o) => { if (!o) setDeleteStreamId(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>Êtes-vous sûr de vouloir supprimer ce direct ?</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3 justify-end">
              <AlertDialogCancel disabled={saving}>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteStream} className="bg-destructive text-destructive-foreground">{saving ? 'Suppression...' : 'Supprimer'}</AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default AdminLiveEditor;
