import React, { useState, useEffect } from 'react';
import DraggableModal from '@/components/DraggableModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { uploadFile } from '@/lib/supabase/storage';
import { Trash2, RotateCcw, Save, ImageIcon } from 'lucide-react';

export interface PageContentManagerData {
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
}

export interface PageContentManagerProps {
  page: string;
  open: boolean;
  onClose: () => void;
  currentData: PageContentManagerData;
  onSaved?: (data: PageContentManagerData) => void;
  path: string;
}

const PAGE_CONFIG: Record<
  string,
  {
    path: string;
    label: string;
    deleteLabel: string;
    table: string;
    defaultHero: PageContentManagerData;
  }
> = {
  videos: {
    path: '/videos',
    label: 'Vidéos',
    deleteLabel: 'Supprimer toutes les vidéos',
    table: 'videos',
    defaultHero: { heroTitle: 'Vidéos', heroSubtitle: 'Retrouvez nos messes et enseignements', heroImage: '' },
  },
  homilies: {
    path: '/homilies',
    label: 'Homélies',
    deleteLabel: 'Supprimer toutes les homélies',
    table: 'homilies',
    defaultHero: { heroTitle: 'Les Homélies', heroSubtitle: 'Écoutez les prédications de nos prêtres', heroImage: '' },
  },
  events: {
    path: '/evenements',
    label: 'Événements',
    deleteLabel: 'Supprimer tous les événements',
    table: 'events',
    defaultHero: { heroTitle: 'Événements', heroSubtitle: 'Ne manquez aucun rendez-vous', heroImage: '' },
  },
  gallery: {
    path: '/galerie',
    label: 'Galerie',
    deleteLabel: 'Supprimer toutes les images de la galerie',
    table: 'gallery_images',
    defaultHero: { heroTitle: 'Galerie', heroSubtitle: 'Nos photos et moments', heroImage: '' },
  },
  prayers: {
    path: '/prayers',
    label: 'Intentions de prière',
    deleteLabel: 'Supprimer toutes les intentions de prière',
    table: 'prayer_intentions',
    defaultHero: { heroTitle: 'Intentions de prière', heroSubtitle: 'Confiez vos intentions', heroImage: '' },
  },
  about: {
    path: '/a-propos',
    label: 'À propos',
    deleteLabel: '',
    table: '',
    defaultHero: { heroTitle: 'À propos', heroSubtitle: 'Découvrez notre paroisse', heroImage: '' },
  },
  donate: {
    path: '/donate',
    label: 'Faire un don',
    deleteLabel: '',
    table: '',
    defaultHero: { heroTitle: 'Faire un don', heroSubtitle: 'Soutenez notre mission', heroImage: '' },
  },
  receipts: {
    path: '/receipts',
    label: 'Reçus',
    deleteLabel: '',
    table: '',
    defaultHero: { heroTitle: 'Reçus de dons', heroSubtitle: 'Consultez et imprimez vos reçus', heroImage: '' },
  },
};

export default function PageContentManager({
  page,
  open,
  onClose,
  currentData,
  onSaved,
  path,
}: PageContentManagerProps) {
  const { toast } = useToast();
  const [heroTitle, setHeroTitle] = useState(currentData.heroTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(currentData.heroSubtitle);
  const [heroImage, setHeroImage] = useState(currentData.heroImage);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmTable, setDeleteConfirmTable] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [resetting, setResetting] = useState(false);

  const config = PAGE_CONFIG[page] ?? {
    path,
    label: page,
    deleteLabel: '',
    table: '',
    defaultHero: { heroTitle: '', heroSubtitle: '', heroImage: '' },
  };

  useEffect(() => {
    if (open) {
      setHeroTitle(currentData.heroTitle);
      setHeroSubtitle(currentData.heroSubtitle);
      setHeroImage(currentData.heroImage);
      setDeleteConfirmTable(null);
      setDeleteConfirmText('');
    }
  }, [open, currentData.heroTitle, currentData.heroSubtitle, currentData.heroImage]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadFile(file, `hero-images/${Date.now()}_${file.name}`);
      if (res?.publicUrl) {
        setHeroImage(res.publicUrl);
        toast({ title: 'Image téléversée' });
      } else {
        toast({ title: 'Erreur', description: 'Échec de l\'upload', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Erreur', description: 'Impossible d\'uploader l\'image', variant: 'destructive' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleApply = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('page_hero_banners')
        .upsert(
          {
            path: config.path,
            title: heroTitle || null,
            subtitle: heroSubtitle || null,
            image_url: heroImage || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'path' }
        );
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['page-hero', config.path] });
      toast({ title: 'Modifications enregistrées' });
      onSaved?.({ heroTitle, heroSubtitle, heroImage });
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
      toast({ title: 'Erreur', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!config.table || deleteConfirmText.trim().toUpperCase() !== 'SUPPRIMER') return;
    try {
      const { error } = await (supabase as any).from(config.table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      toast({ title: 'Contenu supprimé', variant: 'destructive' });
      setDeleteConfirmTable(null);
      setDeleteConfirmText('');
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      toast({ title: 'Erreur', description: msg, variant: 'destructive' });
    }
  };

  const handleResetDefaults = () => {
    setHeroTitle(config.defaultHero.heroTitle);
    setHeroSubtitle(config.defaultHero.heroSubtitle);
    setHeroImage(config.defaultHero.heroImage);
    setResetting(true);
    toast({ title: 'Valeurs par défaut chargées (cliquez sur Appliquer pour enregistrer)' });
    setTimeout(() => setResetting(false), 500);
  };

  return (
    <DraggableModal
      open={open}
      onClose={onClose}
      title={`Gestion du contenu – ${config.label}`}
      center
      maxWidthClass="max-w-lg"
      initialY={40}
      minHeight="280px"
    >
      <div id="page-content-manager-desc" className="space-y-6" aria-describedby="page-content-manager-desc">
          {/* 1. HERO BANNER */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3">Hero Banner</h3>
            <div className="space-y-3">
              <div>
                <Label>Titre</Label>
                <Input
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  placeholder="Titre du bandeau"
                />
              </div>
              <div>
                <Label>Sous-titre</Label>
                <Input
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  placeholder="Sous-titre"
                />
              </div>
              <div>
                <Label>Image</Label>
                <div className="flex gap-2 items-start">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="hero-image-upload"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                  <Button type="button" variant="outline" size="sm" asChild>
                    <label htmlFor="hero-image-upload" className="cursor-pointer flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      {uploading ? 'Téléversement…' : 'Choisir une image'}
                    </label>
                  </Button>
                </div>
                {heroImage && (
                  <div className="mt-2 rounded border overflow-hidden max-w-xs">
                    <img src={heroImage} alt="Aperçu hero" className="w-full h-24 object-cover" />
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 2. CONTENU DE LA PAGE */}
          {config.table && (
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3">Contenu de la page</h3>
              {!deleteConfirmTable ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setDeleteConfirmTable(config.table)}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {config.deleteLabel}
                </Button>
              ) : (
                <div className="space-y-2 p-3 rounded-lg border border-destructive/50 bg-destructive/5">
                  <p className="text-sm text-foreground">
                    Confirmez en tapant <strong>SUPPRIMER</strong> ci-dessous.
                  </p>
                  <Input
                    placeholder="SUPPRIMER"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="border-destructive"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteAll}
                      disabled={deleteConfirmText.trim().toUpperCase() !== 'SUPPRIMER'}
                    >
                      Confirmer la suppression
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setDeleteConfirmTable(null); setDeleteConfirmText(''); }}>
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 3. RÉINITIALISATION */}
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-3">Réinitialisation</h3>
            <Button
              type="button"
              variant="outline"
              className="w-full border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              onClick={handleResetDefaults}
              disabled={resetting}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Réinitialiser aux valeurs par défaut
            </Button>
          </section>

          {/* 4. SAUVEGARDE */}
          <section className="pt-2 border-t">
            <Button type="button" className="w-full" onClick={handleApply} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Enregistrement…' : 'Appliquer les modifications'}
            </Button>
          </section>
        </div>
    </DraggableModal>
  );
}
