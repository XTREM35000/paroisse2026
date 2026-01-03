// src/pages/AboutPage.tsx
import React from 'react';
import { Loader2 } from 'lucide-react';
import { useAboutPage, organizeAboutSections } from '@/hooks/useAboutPage';
import HeroBanner from '@/components/HeroBanner';
import ValueList from '@/components/about/ValueList';
import AboutCTASection from '@/components/about/AboutCTASection';
import { supabase } from '@/integrations/supabase/client';

const AboutPage: React.FC = () => {
  const { data: sections, isLoading, error } = useAboutPage();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !sections) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Erreur de chargement</h1>
          <p className="text-muted-foreground">Impossible de charger la page à propos.</p>
        </div>
      </div>
    );
  }

  const organized = organizeAboutSections(sections);

  const handleHeroImageSave = async (url: string) => {
    if (!organized.hero) return;
    try {
      await supabase
        .from('about_page_sections')
        .update({ image_url: url })
        .eq('id', organized.hero.id);
    } catch (e) {
      console.error('Erreur de sauvegarde', e);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section - Using HeroBanner for dynamic image support */}
      <HeroBanner
        title={organized.hero?.title || 'À propos de nous'}
        subtitle={organized.hero?.subtitle || 'Découvrez l\'histoire et la mission de notre paroisse'}
        backgroundImage={organized.hero?.image_url || undefined}
        showBackButton={false}
        bucket="directory-images"
        onBgSave={handleHeroImageSave}
      />

      {/* Description Section */}
      {organized.description && (
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold mb-6">{organized.description.title}</h2>
            <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-line">
              {organized.description.content}
            </p>
          </div>
        </section>
      )}

      {/* Mission Section */}
      {organized.mission && (
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold mb-6">{organized.mission.title}</h2>
            <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-line">
              {organized.mission.content}
            </p>
          </div>
        </section>
      )}

      {/* Values Section */}
      {organized.values && <ValueList section={organized.values} />}

      {/* Ministries Section */}
      {organized.ministries && <ValueList section={organized.ministries} />}

      {/* Contact Section */}
      {organized.contact && (
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold mb-6">{organized.contact.title}</h2>
            <div className="space-y-4 text-lg">
              {organized.contact.content && (
                <p className="text-muted-foreground whitespace-pre-line">
                  {organized.contact.content}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {organized.cta && <AboutCTASection section={organized.cta} />}
    </main>
  );
};

export default AboutPage;