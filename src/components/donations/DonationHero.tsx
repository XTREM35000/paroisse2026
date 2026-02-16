/**
 * Composant Hero Banner pour la page Donate
 */
import React from 'react';
import HeroBanner from '@/components/HeroBanner';

interface DonationHeroProps {
  heroData?: {
    image_url?: string;
    title?: string;
    subtitle?: string;
    button_text?: string;
  };
}

export const DonationHero: React.FC<DonationHeroProps> = ({ heroData }) => {
  return (
    <HeroBanner
      image={heroData?.image_url}
      title={heroData?.title || 'Soutenir Notre Paroisse'}
      subtitle={
        heroData?.subtitle ||
        'Votre générosité permet à notre communauté de poursuivre sa mission. Ensemble, nous bâtissons un avenir solidaire.'
      }
      buttonText={heroData?.button_text || 'Faire un don'}
    />
  );
};

export default DonationHero;
