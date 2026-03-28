// src/pages/AboutPage.tsx
import React from 'react';
import { Loader2 } from 'lucide-react';
import { useAboutPage, organizeAboutSections } from '@/hooks/useAboutPage';
import HeroBanner from '@/components/HeroBanner';
import ValueList from '@/components/about/ValueList';
import AboutCTASection from '@/components/about/AboutCTASection';
import { supabase } from '@/integrations/supabase/client';

interface ParsedAboutContent {
  history?: string;
  mission?: string;
  values?: string[];
  team?: { name: string; role: string; photo: string }[];
}

const AboutPage: React.FC = () => {
  const { data: sections, isLoading, error } = useAboutPage();

  // Parser le contenu des sections
  const parseSections = () => {
    if (!sections) return { hero: null, content: null };
    
    let heroSection = null;
    let parsedContent: ParsedAboutContent = {};
    
    for (const section of sections) {
      // Section hero
      if (section.section_key === 'about_hero') {
        heroSection = section;
      }
      
      // Section parish_description - contient le JSON du Setup Wizard
      if (section.section_key === 'parish_description' && section.content) {
        try {
          // Parser le JSON stocké dans content
          const content = typeof section.content === 'string' 
            ? JSON.parse(section.content) 
            : section.content;
          
          parsedContent = {
            history: content.history,
            mission: content.mission,
            values: content.values,
            team: content.team
          };
        } catch (err) {
          console.error('Erreur lors du parsing du contenu:', err);
        }
      }
    }
    
    return { hero: heroSection, content: parsedContent };
  };

  const { hero, content: parsedContent } = parseSections();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Erreur de chargement</h1>
          <p className="text-muted-foreground">Impossible de charger la page à propos.</p>
        </div>
      </div>
    );
  }

  // Si on a du contenu parsé, l'afficher
  if (parsedContent && (parsedContent.history || parsedContent.mission)) {
    return (
      <main className="min-h-screen bg-background">
        {/* Hero Banner */}
        <HeroBanner
          title={hero?.title || 'À propos de nous'}
          subtitle={hero?.subtitle || 'Découvrez l\'histoire et la mission de notre paroisse'}
          backgroundImage={hero?.image_url || undefined}
          showBackButton={true}
          bucket="directory-images"
        />

        {/* Histoire */}
        {parsedContent.history && (
          <section className="py-16 px-4">
            <div className="container mx-auto max-w-3xl">
              <h2 className="text-3xl font-bold mb-6">Notre histoire</h2>
              <div className="text-lg text-muted-foreground leading-relaxed whitespace-pre-line">
                {parsedContent.history}
              </div>
            </div>
          </section>
        )}

        {/* Mission */}
        {parsedContent.mission && (
          <section className="py-16 px-4 bg-muted/30">
            <div className="container mx-auto max-w-3xl">
              <h2 className="text-3xl font-bold mb-6">Notre mission</h2>
              <div className="text-lg text-muted-foreground leading-relaxed whitespace-pre-line">
                {parsedContent.mission}
              </div>
            </div>
          </section>
        )}

        {/* Valeurs */}
        {parsedContent.values && parsedContent.values.length > 0 && (
          <section className="py-16 px-4">
            <div className="container mx-auto max-w-3xl">
              <h2 className="text-3xl font-bold mb-6">Nos valeurs</h2>
              <div className="flex flex-wrap gap-3">
                {parsedContent.values.map((value, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium"
                  >
                    {value}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Équipe */}
        {parsedContent.team && parsedContent.team.length > 0 && (
          <section className="py-16 px-4 bg-muted/30">
            <div className="container mx-auto max-w-3xl">
              <h2 className="text-3xl font-bold mb-6">Notre équipe</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {parsedContent.team.map((member, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-background rounded-lg border">
                    <img
                      src={member.photo}
                      alt={member.name}
                      className="w-16 h-16 rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=ffb347&color=fff`;
                      }}
                    />
                    <div>
                      <h3 className="font-semibold text-lg">{member.name}</h3>
                      <p className="text-gray-600">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <AboutCTASection section={{
          id: 'cta-fallback',
          section_key: 'cta',
          title: 'Rejoignez-nous',
          content: 'Nous serions ravis de vous accueillir dans notre communauté.',
          button_text: 'Nous contacter',
          button_link: '/contact',
          display_order: 999,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }} />
      </main>
    );
  }

  // Affichage par défaut
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Page en construction</h1>
        <p className="text-muted-foreground">Le contenu de cette page sera bientôt disponible.</p>
      </div>
    </div>
  );
};

export default AboutPage;