import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { uploadFile } from '@/lib/supabase/storage';
import HeroBanner from '@/components/HeroBanner';
import usePageHero from '@/hooks/usePageHero';
import SectionTitle from '@/components/SectionTitle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { PublicAd } from '@/types/advertisements';

export default function AdminAds() {
  const { data: hero, save: saveHero } = usePageHero('/admin/ads');
  const { toast } = useToast();
  const [ads, setAds] = useState<PublicAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PublicAd | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  const fetchAds = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('public_advertisements').select('*').order('priority', { ascending: false }).order('created_at', { ascending: false });
      if (error) throw error;
      setAds((data || []) as PublicAd[]);
    } catch (e) {
      console.error(e);
      toast({ title: 'Erreur', description: 'Impossible de charger les annonces', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAds(); }, [toast]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = fd.get('title') as string;
    const subtitle = fd.get('subtitle') as string;
    const content = fd.get('content') as string;
    const pdf = fd.get('pdf') as string;
    const priority = Number(fd.get('priority') || 0);

    try {
      let imageUrl = editing?.image_url || '';
      if (file) {
        const res = await uploadFile(file, `public_ads/${Date.now()}_${file.name}`);
        if (!res) throw new Error('Upload failed');
        imageUrl = res.publicUrl;
      }

      if (editing) {
        const { error } = await supabase.from('public_advertisements').update({ title, subtitle, content, image_url: imageUrl, pdf_url: pdf || null, priority }).eq('id', editing.id);
        if (error) throw error;
        toast({ title: 'Mis à jour' });
      } else {
        const { error } = await supabase.from('public_advertisements').insert([{ title, subtitle, content, image_url: imageUrl, pdf_url: pdf || null, priority }]);
        if (error) throw error;
        toast({ title: 'Créé' });
      }

      setEditing(null);
      setFile(null);
      setOpenDialog(false);
      fetchAds();
    } catch (e) {
      console.error(e);
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette annonce ?')) return;
    try {
      const { error } = await supabase.from('public_advertisements').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Supprimé' });
      fetchAds();
    } catch (e) {
      console.error(e);
      toast({ title: 'Erreur', description: 'Impossible de supprimer', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <HeroBanner title="Administration des publicités" subtitle="Gérer les affiches" backgroundImage={hero?.image_url} onBgSave={saveHero} />
      <main className="container mx-auto px-4 py-12">
        <SectionTitle title="Publicités" subtitle="Créer, éditer et supprimer" />

        <div className="mb-6">
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditing(null); setFile(null); }}>Nouvelle annonce</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer / éditer une annonce</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-3">
                <div>
                  <label>Titre</label>
                  <Input name="title" defaultValue={editing?.title || ''} required />
                </div>
                <div>
                  <label>Sous-titre</label>
                  <Input name="subtitle" defaultValue={editing?.subtitle || ''} />
                </div>
                <div>
                  <label>Image</label>
                  <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </div>
                <div>
                  <label>PDF URL</label>
                  <Input name="pdf" defaultValue={editing?.pdf_url || ''} />
                </div>
                <div>
                  <label>Priority</label>
                  <Input name="priority" defaultValue={String(editing?.priority || 0)} />
                </div>
                <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => { setEditing(null); setFile(null); setOpenDialog(false); }}>Annuler</Button>
                  <Button type="submit">Sauvegarder</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ads.map(ad => (
            <div key={ad.id} className="bg-card border border-border rounded p-3">
              <img src={ad.image_url} alt={ad.title} className="w-full h-48 object-cover rounded" />
              <h3 className="font-semibold mt-2">{ad.title}</h3>
              <p className="text-sm text-muted-foreground">{ad.subtitle}</p>
              <div className="mt-3 flex gap-2">
                <Button onClick={() => { setEditing(ad); setOpenDialog(true); }}>Éditer</Button>
                <Button variant="destructive" onClick={() => handleDelete(ad.id)}>Supprimer</Button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
