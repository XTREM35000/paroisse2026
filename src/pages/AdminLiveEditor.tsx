import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, Upload, Save, Plus, Trash2 } from 'lucide-react';
import usePageHero from '@/hooks/usePageHero';
import { uploadFile, testStorageConnection } from '@/lib/supabase/storage';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import useRoleCheck from '@/hooks/useRoleCheck';

const AdminLiveEditor = () => {
  const navigate = useNavigate();
  const { profile, isAdmin } = useRoleCheck();
  const { data: hero, save: saveHero } = usePageHero('/live');
  const { toast } = useToast();

  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  type Section = { id?: string; type?: 'text' | 'youtube' | 'image' | 'html'; title: string; content: string; is_live?: boolean; start_time?: string; end_time?: string };
  const [sections, setSections] = useState<Section[]>([]);
  const [loadingSections, setLoadingSections] = useState(false);
  const [savingSections, setSavingSections] = useState(false);

  useEffect(() => {
    setImagePreview(hero?.image_url ?? null);
  }, [hero]);

  const fetchSections = useCallback(async () => {
    try {
      setLoadingSections(true);
      const { data, error } = await supabase.from('homepage_sections').select('*').eq('section_key', 'live_sections').maybeSingle();
      if (error) throw error;
      if (data) {
        const rawContent = data?.content;
        const parsed = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent;
        if (Array.isArray(parsed)) setSections(parsed as Section[]);
      }
    } catch (e) {
      console.error('fetchSections error', e);
      toast({ title: 'Erreur', description: 'Impossible de charger les sections', variant: 'destructive' });
    } finally {
      setLoadingSections(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const handleFile = async (file: File) => {
    console.log('[AdminLiveEditor] handleFile: selected file', { name: file.name, size: file.size, type: file.type });
    try {
      setUploadError(null);
      setImageUploading(true);
      console.log('[AdminLiveEditor] handleFile: starting upload...');
      const uploaded = await uploadFile(file, `live/${Date.now()}_${file.name}`);
      console.log('[AdminLiveEditor] handleFile: upload result', uploaded);
      if (!uploaded) throw new Error('Upload failed (no result)');
      setImagePreview(uploaded.publicUrl || null);
      // Save hero immediately
      console.log('[AdminLiveEditor] handleFile: saving hero...');
      await saveHero(uploaded.publicUrl || null);
      console.log('[AdminLiveEditor] handleFile: hero saved with image_url=', uploaded.publicUrl);
      toast({ title: 'Succès', description: 'Image de bannière sauvegardée' });
    } catch (e) {
      console.error('[AdminLiveEditor] upload error', e);
      const msg = e instanceof Error ? e.message : 'Impossible d\'uploader l\'image';
      setUploadError(msg);
      toast({ title: 'Erreur', description: msg, variant: 'destructive' });
    } finally {
      setImageUploading(false);
    }
  };

  const addSection = () => setSections((s) => [...s, { type: 'text', title: 'Nouvelle section', content: '', is_live: false }]);
  const updateSection = (idx: number, key: string, value: any) => {
    setSections((s) => s.map((sec, i) => (i === idx ? { ...sec, [key]: value } : sec)));
  };
  const removeSection = (idx: number) => setSections((s) => s.filter((_, i) => i !== idx));

  const saveSections = async () => {
    try {
      setSavingSections(true);
      const payload = {
        section_key: 'live_sections',
        title: 'En Ligne - Sections',
        content: JSON.stringify(sections),
        display_order: 0,
        is_active: true,
      };
      const { error } = await supabase.from('homepage_sections').upsert([payload], { onConflict: 'section_key' });
      if (error) throw error;
      toast({ title: 'Succès', description: 'Sections sauvegardées' });
    } catch (e) {
      console.error('saveSections error', e);
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder les sections', variant: 'destructive' });
    } finally {
      setSavingSections(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold">Accès refusé</h2>
        <p className="text-sm text-muted-foreground">Vous n'avez pas les droits nécessaires pour administrer cette page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button className="btn-ghost p-2 rounded" onClick={() => navigate(-1)} title="Retour">
            <ArrowLeft />
          </button>
          <h1 className="text-2xl font-bold">Administration — En Ligne</h1>
        </div>
      </div>

      <section className="mb-8 bg-card p-6 rounded-lg border border-border">
        <h2 className="text-lg font-semibold mb-4">Hero Banner</h2>
        <div className="flex gap-6">
          <div className="w-1/3">
            <div className="h-48 bg-muted rounded overflow-hidden flex items-center justify-center border border-border">
              {imagePreview ? (
                <img src={imagePreview} alt="Aperçu bannière" className="w-full h-full object-cover" />
              ) : (
                <div className="text-muted-foreground flex flex-col items-center gap-2">
                  <ImageIcon className="w-10 h-10" />
                  <div>Aucune image</div>
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input id="live-upload" type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <Button asChild variant="outline">
                <label htmlFor="live-upload" className="inline-flex items-center gap-2 cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />Téléverser
                </label>
              </Button>
              <Button onClick={() => saveHero(null)} variant="ghost">Supprimer</Button>
              <Button variant="outline" onClick={async () => {
                console.log('[AdminLiveEditor] testing storage connection...');
                const res = await testStorageConnection();
                console.log('[AdminLiveEditor] testStorageConnection result', res);
                toast({ title: res.ok ? 'Storage OK' : 'Storage Erreur', description: res.message || '' , variant: res.ok ? 'default' : 'destructive' });
              }}>Tester stockage</Button>
            </div>
            {imageUploading && <div className="text-sm text-muted-foreground mt-2">Téléversement en cours…</div>}
            {uploadError && <div className="text-sm text-red-600 mt-2">Erreur: {uploadError}</div>}
          </div>

          <div className="flex-1">
            <p className="text-sm text-muted-foreground">La bannière apparaît lorsque la page live est affichée.</p>
            <div className="mt-4">
              <Button onClick={() => saveHero(imagePreview)} disabled={imageUploading}>
                <Save className="w-4 h-4 mr-2" /> Enregistrer la bannière
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-card p-6 rounded-lg border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Sections</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={addSection}><Plus className="w-4 h-4" /> Ajouter</Button>
            <Button onClick={saveSections} disabled={savingSections}><Save className="w-4 h-4 mr-2" />Enregistrer</Button>
          </div>
        </div>

        {loadingSections ? (
          <div>Chargement...</div>
        ) : (
          <div className="space-y-4">
            {sections.map((sec, idx) => (
              <div key={idx} className="bg-background p-4 rounded border border-border">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <Input value={sec.title} onChange={(e) => updateSection(idx, 'title', e.target.value)} />
                  <select
                    value={sec.type ?? 'text'}
                    onChange={(e) => {
                      const val = e.target.value as 'text' | 'youtube' | 'image' | 'html';
                      setSections(s => s.map((x,i) => i===idx ? {...x, type: val} : x));
                    }}
                    className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                  >
                    <option value="text">Texte</option>
                    <option value="youtube">YouTube</option>
                    <option value="image">Image</option>
                    <option value="html">HTML</option>
                  </select>
                  <Button variant="ghost" onClick={() => removeSection(idx)}><Trash2 /></Button>
                </div>
                {sec.type === 'text' && (
                  <Textarea value={sec.content} onChange={(e) => updateSection(idx, 'content', e.target.value)} />
                )}
                {sec.type === 'html' && (
                  <Textarea value={sec.content} onChange={(e) => updateSection(idx, 'content', e.target.value)} placeholder="HTML autorisé" />
                )}
                {sec.type === 'youtube' && (
                  <div className="space-y-2">
                    <Input value={sec.content} onChange={(e) => updateSection(idx, 'content', e.target.value)} placeholder="URL ou ID YouTube" />
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={!!sec.is_live} onChange={(e) => updateSection(idx, 'is_live', e.target.checked)} />
                        <span>En direct</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <span className="text-xs text-muted-foreground">Heure de début (optionnel)</span>
                        <input
                          type="datetime-local"
                          value={sec.start_time ?? ''}
                          onChange={(e) => updateSection(idx, 'start_time', e.target.value)}
                          className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                        />
                      </label>
                    </div>
                  </div>
                )}
                {sec.type === 'image' && (
                  <Input value={sec.content} onChange={(e) => updateSection(idx, 'content', e.target.value)} placeholder="URL de l'image" />
                )}
              </div>
            ))}
            {sections.length === 0 && <div className="text-sm text-muted-foreground">Aucune section définie.</div>}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminLiveEditor;
