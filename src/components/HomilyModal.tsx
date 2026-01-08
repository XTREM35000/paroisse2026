import React, { useEffect, useState } from 'react';
import DraggableModal from './DraggableModal';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { uploadFile } from '@/lib/supabase/storage';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: (homily: HomilyData | null) => void;
  homilyId?: string | null;
}

interface HomilyData {
  id?: string;
  title?: string;
  priest_name?: string;
  description?: string | null;
  homily_date?: string | null;
  video_url?: string | null;
  image_url?: string | null;
  duration_minutes?: number | null;
  created_at?: string;
  updated_at?: string;
}

const HomilyModal: React.FC<Props> = ({ open, onClose, onSaved, homilyId = null }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    priest_name: '',
    description: '',
    homily_date: '',
    video_url: '',
    image_url: '',
    duration_minutes: '',
  });
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    if (open && homilyId) {
      (async () => {
        setLoading(true);
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data, error } = await (supabase as any)
            .from('homilies')
            .select('*')
            .eq('id', homilyId)
            .maybeSingle();
          if (error) throw error;
          const row = (data as HomilyData) || null;
          if (row) {
            setForm({
              title: row.title || '',
              priest_name: row.priest_name || '',
              description: row.description || '',
              homily_date: row.homily_date ? row.homily_date.split('T')[0] : '',
              video_url: row.video_url || '',
              image_url: row.image_url || '',
              duration_minutes: row.duration_minutes ? String(row.duration_minutes) : '',
            });
          }
        } catch (e) {
          console.error('Error loading homily', e);
          toast({ title: 'Erreur', description: "Impossible de charger l'homélie", variant: 'destructive' });
        } finally {
          setLoading(false);
        }
      })();
    } else if (open) {
      setForm({ title: '', priest_name: '', description: '', homily_date: '', video_url: '', image_url: '', duration_minutes: '' });
    }
  }, [open, homilyId, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.currentTarget as HTMLInputElement;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleFileUpload = async (file: File) => {
    try {
      setImageUploading(true);
      const uploaded = await uploadFile(file, `homilies/${Date.now()}_${file.name}`);
      if (!uploaded) throw new Error('Upload failed');
      setForm((f) => ({ ...f, image_url: uploaded.publicUrl || '' }));
      toast({ title: 'Succès', description: 'Image téléversée' });
    } catch (e) {
      console.error('upload error', e);
      toast({ title: 'Erreur', description: 'Impossible d\'uploader l\'image', variant: 'destructive' });
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.priest_name.trim()) {
      toast({ title: 'Erreur', description: 'Titre et prêtre requis', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const payload: Partial<HomilyData> & { created_at?: string; updated_at?: string } = {
        title: form.title,
        priest_name: form.priest_name,
        description: form.description || null,
        homily_date: form.homily_date ? new Date(form.homily_date).toISOString() : null,
        video_url: form.video_url || null,
        image_url: form.image_url || null,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
        updated_at: new Date().toISOString(),
      };

      if (homilyId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from('homilies')
          .update(payload)
          .eq('id', homilyId)
          .select()
          .maybeSingle();
        if (error) throw error;
        toast({ title: 'Succès', description: 'Homélie mise à jour' });
        onSaved?.((data as HomilyData) || null);
      } else {
        payload.created_at = new Date().toISOString();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from('homilies')
          .insert([payload])
          .select()
          .maybeSingle();
        if (error) throw error;
        toast({ title: 'Succès', description: 'Homélie ajoutée' });
        onSaved?.((data as HomilyData) || null);
      }
      onClose();
    } catch (err) {
      console.error('Save homily error', err);
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DraggableModal open={open} onClose={onClose} initialY={120} draggableOnMobile={true} dragHandleOnly={true}>
      <div className="p-4 w-full max-w-2xl">
        <div data-drag-handle className="flex items-center justify-between cursor-grab mb-3">
          <h2 className="text-lg font-semibold">{homilyId ? 'Éditer homélie' : 'Nouvelle homélie'}</h2>
          <div className="text-sm text-muted-foreground">Déplacer la fenêtre en la faisant glisser</div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Titre</label>
            <Input name="title" value={form.title} onChange={handleChange} required />
          </div>

          <div>
            <label className="text-sm font-medium">Prêtre</label>
            <Input name="priest_name" value={form.priest_name} onChange={handleChange} required />
          </div>

          <div>
            <label className="text-sm font-medium">Date</label>
            <Input name="homily_date" type="date" value={form.homily_date} onChange={handleChange} />
          </div>

          <div>
            <label className="text-sm font-medium">Durée (minutes)</label>
            <Input name="duration_minutes" type="number" value={form.duration_minutes} onChange={handleChange} />
          </div>

          <div>
            <label className="text-sm font-medium">Vidéo (URL)</label>
            <Input name="video_url" value={form.video_url} onChange={handleChange} />
          </div>

          <div>
            <label className="text-sm font-medium">Image (URL)</label>
            <div className="flex items-center gap-2">
              <Input name="image_url" value={form.image_url} onChange={handleChange} />
              <label className="inline-flex">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
                <Button type="button" variant="outline" disabled={imageUploading} title="Téléverser">
                  {imageUploading ? '...' : 'Uploader'}
                </Button>
              </label>
            </div>
            {form.image_url && (
              <div className="mt-2">
                <img src={form.image_url} alt="Aperçu" className="h-24 w-auto object-cover rounded" />
              </div>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea name="description" value={form.description} onChange={handleChange} className="min-h-[80px]" />
          </div>

          <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Annuler</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Enregistrement...' : 'Enregistrer'}</Button>
          </div>
        </form>
      </div>
    </DraggableModal>
  );
};

export default HomilyModal;
