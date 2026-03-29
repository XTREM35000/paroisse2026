import HeroBanner from '@/components/HeroBanner';
import { useLocation } from 'react-router-dom';
import usePageHero from '@/hooks/usePageHero';

/**
 * Page publique « Média paroissial » (/prospect) — présentation du projet / média.
 */
export default function DocProjetPage() {
  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);

  return (
    <div className="min-h-screen bg-background">
      <HeroBanner
        title="Média paroissial"
        subtitle="Découvrez notre présence médiatique et nos ressources"
        showBackButton={true}
        backgroundImage={hero?.image_url}
        onBgSave={saveHero}
      />
      <main className="container mx-auto px-4 py-10 max-w-3xl">
        <p className="text-muted-foreground leading-relaxed">
          Cette page présente le projet médiatique de la paroisse. Le contenu détaillé peut être enrichi depuis
          l’administration ou les outils de gestion de contenu.
        </p>
      </main>
    </div>
  );
}
