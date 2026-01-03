import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Search, Users, Briefcase, Cross } from 'lucide-react';
import { useDirectory, organizeByCategory } from '@/hooks/useDirectory';
import HeroBanner from '@/components/HeroBanner';
import { useLocation } from 'react-router-dom';
import usePageHero from '@/hooks/usePageHero';
import DirectorySection from '@/components/DirectorySection';
import { Input } from '@/components/ui/input';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Directory: React.FC = () => {
  const { data: directoryItems = [], isLoading, refetch } = useDirectory();

  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);
  const [searchTerm, setSearchTerm] = useState('');
  const { profile } = useUser();
  const { toast } = useToast();
  const isAdmin = !!(profile?.role && ['admin', 'super_admin'].includes(String(profile.role).toLowerCase()));

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return;
    
    try {
      const { error } = await supabase
        .from('directory')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Élément supprimé.',
      });
      await refetch();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'élément.',
        variant: 'destructive',
      });
    }
  };

  const organized = useMemo(() => {
    // Filter items based on search term
    const filtered = directoryItems.filter(
      item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    );

    return organizeByCategory(filtered);
  }, [directoryItems, searchTerm]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasResults =
    organized.services.length > 0 ||
    organized.clergy.length > 0 ||
    organized.members.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <HeroBanner
        title="Annuaire"
        subtitle="Retrouvez nos services, nos membres et notre clergé"
        showBackButton={false}
        bucket="directory-images"
        backgroundImage={hero?.image_url}
        onBgSave={saveHero}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher un service, une personne..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-base"
            />
          </div>
        </motion.div>

        {/* No Results */}
        {!hasResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Aucun résultat trouvé
            </h3>
            <p className="text-muted-foreground">
              Modifiez votre recherche et réessayez
            </p>
          </motion.div>
        )}

        {/* Services Section */}
        {organized.services.length > 0 && (
          <DirectorySection
            title="Services"
            description="Les services proposés par notre paroisse"
            icon={Briefcase}
            items={organized.services}
            index={0}
            showAdminActions={isAdmin}
            onDelete={handleDelete}
          />
        )}

        {/* Clergy Section */}
        {organized.clergy.length > 0 && (
          <DirectorySection
            title="Clergé"
            description="Notre équipe pastorale et spirituelle"
            icon={Cross}
            items={organized.clergy}
            index={1}
            showAdminActions={isAdmin}
            onDelete={handleDelete}
          />
        )}

        {/* Members Section */}
        {organized.members.length > 0 && (
          <DirectorySection
            title="Membres"
            description="Les membres de notre paroisse"
            icon={Users}
            items={organized.members}
            index={2}
            showAdminActions={isAdmin}
            onDelete={handleDelete}
          />
        )}

        {/* CTA Section */}
        {hasResults && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-20 py-12 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-2xl border border-border text-center"
          >
            <h3 className="text-2xl font-bold text-foreground mb-3 font-display">
              Besoin d'aide supplémentaire ?
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
              Si vous ne trouvez pas ce que vous cherchez dans l'annuaire, n'hésitez pas à nous contacter directement.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <a
                href="mailto:contact@paroisse.fr"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Nous contacter
              </a>
            </div>
          </motion.section>
        )}
      </main>
    </div>
  );
};

export default Directory;
