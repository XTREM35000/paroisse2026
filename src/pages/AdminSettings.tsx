import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import HeroBanner from '@/components/HeroBanner';

const AdminSettings: React.FC = () => (
  <div className="min-h-screen bg-background flex flex-col">
    <HeroBanner
      title="Paramètres"
      subtitle="Configurez les options générales du site"
      showBackButton
    />
    <main className="flex-1 container mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">Paramètres</h1>
      <p className="text-muted-foreground mb-6">Configuration de l'application</p>

      <section>
        <h2 className="text-lg font-medium mb-2">Pages dynamiques</h2>
        <div className="flex flex-col gap-2">
          <Button asChild>
            <Link to="/admin/about">Éditeur : Page À propos</Link>
          </Button>
          <Button asChild>
            <Link to="/admin/directory">Éditeur : Annuaire</Link>
          </Button>
        </div>
      </section>
    </main>
  </div>
);

export default AdminSettings;
