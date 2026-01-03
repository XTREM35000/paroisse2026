// src/components/about/AboutHero.tsx
import React from 'react';
import { AboutSection } from '@/hooks/useAboutPage';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface ButtonItem {
  text: string;
  link: string;
  variant?: 'link' | 'secondary' | 'outline' | 'ghost' | 'default' | 'destructive';
}

interface AboutHeroProps {
  section: AboutSection;
}

const AboutHero: React.FC<AboutHeroProps> = ({ section }) => {
  const metadata = section.metadata as { buttons?: ButtonItem[] } | null;
  const buttons = metadata?.buttons || [];
  
  return (
    <section className="relative py-20 bg-gradient-to-br from-primary/10 to-background overflow-hidden">
      <div className="container mx-auto px-4 text-center relative z-10">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
          {section.title}
        </h1>
        {section.subtitle && (
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {section.subtitle}
          </p>
        )}
        
        <div className="flex flex-wrap gap-4 justify-center mt-10">
          {buttons.map((btn: ButtonItem, index: number) => (
            <Button 
              key={index} 
              size="lg" 
              variant={btn.variant || 'default'}
              asChild
            >
              <Link to={btn.link || '#'}>{btn.text}</Link>
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutHero;