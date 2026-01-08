import React, { useState } from 'react';
import HeroBanner from '@/components/HeroBanner';
import usePageHero from '@/hooks/usePageHero';
import { useAdvertisements } from '@/hooks/useAdvertisements';
import AdvertisementCard from '@/components/AdvertisementCard';
import AdvertisementPopup from '@/components/AdvertisementPopup';
import PrintZone from '@/components/PrintZone';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import SectionTitle from '@/components/SectionTitle';
import { supabase } from '@/integrations/supabase/client';
import { PublicAd } from '@/types/advertisements';
import useRoleCheck from '@/hooks/useRoleCheck';

export default function PublicitePage() {
  const { data: hero, save: saveHero } = usePageHero('/publicite');
  const { ads, loading, latestAd } = useAdvertisements();
  const { isAdmin } = useRoleCheck();
  const { toast } = useToast();
  const [selected, setSelected] = useState<PublicAd | null>(null);
  const [showPopup, setShowPopup] = useState(true);
  const [adsList, setAdsList] = useState<PublicAd[]>(ads);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('public_advertisements').delete().eq('id', id);
      if (error) throw error;
      setAdsList(adsList.filter(a => a.id !== id));
      toast({ title: 'Supprimé', description: 'Affiche supprimée' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Erreur', description: 'Impossible de supprimer', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <HeroBanner
        title={hero?.title || 'Publicité'}
        subtitle={hero?.subtitle}
        backgroundImage={hero?.image_url}
        onBgSave={saveHero}
      />

      <main className="container mx-auto px-4 py-12">
        <SectionTitle title="Affiches" subtitle="Nos dernières affiches publicitaires" />

        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 bg-muted/20 animate-pulse rounded" />
              ))
            ) : (
              (adsList.length > 0 ? adsList : ads).map((ad) => (
                <AdvertisementCard 
                  key={ad.id} 
                  ad={ad} 
                  onOpen={(a) => setSelected(a)}
                  onDelete={isAdmin ? handleDelete : undefined}
                />
              ))
            )}
          </div>
        </div>

        <div className="mt-8">
          <SectionTitle title="Zone d'impression" subtitle="Sélectionnez des affiches et imprimez" />
          <PrintZone ads={ads} />
        </div>

        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selected?.title}</DialogTitle>
            </DialogHeader>
            <div>
              <img src={selected?.image_url} alt={selected?.title} className="w-full h-auto rounded" />
              <div className="mt-4">
                <p className="text-muted-foreground">{selected?.content}</p>
                {selected?.pdf_url && (
                  <a href={selected.pdf_url} target="_blank" rel="noreferrer" className="text-blue-600 underline">Télécharger le PDF</a>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {showPopup && latestAd && (
          <AdvertisementPopup ad={latestAd} onClose={() => setShowPopup(false)} />
        )}
      </main>
    </div>
  );
}
