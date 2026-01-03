import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import type { AboutSection } from '@/hooks/useAboutPage';

const AboutHero: React.FC<{ section: AboutSection }> = ({ section }) => {
  // Guard clause - retourner null si section est undefined
  if (!section) {
    return null;
  }

  const buttons = section.metadata?.buttons || [];

  return (
    <section className="relative py-20 bg-gradient-to-br from-primary/10 to-background">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{section.title}</h1>
        {section.subtitle && (
          <p className="text-xl text-muted-foreground mb-8">{section.subtitle}</p>
        )}

        <div className="flex flex-wrap gap-4 justify-center">
          {buttons.map((btn: any, index: number) => (
            <Button key={index} asChild variant={btn.variant || 'default'} size="lg">
              <Link to={btn.link || '#'}>{btn.text}</Link>
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutHero;
