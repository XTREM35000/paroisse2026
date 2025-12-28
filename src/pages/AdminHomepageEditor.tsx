import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import HeroBanner from '@/components/HeroBanner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type HomepageSection = Database['public']['Tables']['homepage_sections']['Row'];

const AdminHomepageEditor = () => {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_sections')
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      if (data) setSections(data);
    } catch (err) {
      console.error('Erreur lors du chargement des sections:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSection = async (id: string, field: string, value: string | boolean) => {
    setSaving(true);
    try {
      const updates: Record<string, unknown> = { 
        [field]: value, 
        updated_at: new Date().toISOString() 
      };
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('homepage_sections')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Mettre à jour l'état local pour un feedback immédiat
      setSections(sections.map(s => 
        s.id === id ? { ...s, [field]: value } : s
      ));
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header darkMode={false} toggleDarkMode={() => {}} />
        <HeroBanner
          title="Chargement..."
          subtitle="Veuillez patienter"
          showBackButton={true}
        />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header darkMode={false} toggleDarkMode={() => {}} />

      <HeroBanner
        title="Éditeur de la page d'accueil"
        subtitle="Modifiez les titres, sous-titres et textes affichés sur la page principale"
        showBackButton={true}
        backgroundImage="/images/ceremonie.png"
      />

      <main className="flex-1 py-12 lg:py-16">
        <div className="container mx-auto px-4 space-y-6">
          {sections.map((section) => (
            <Card key={section.id} className="overflow-hidden">
              <CardHeader className="bg-muted/50 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <span className="font-mono text-sm bg-background px-3 py-1 rounded border">
                      {section.key}
                    </span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      section.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                    }`}>
                      {section.is_active ? 'Actif' : 'Inactif'}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateSection(section.id, 'is_active', !section.is_active)}
                      disabled={saving}
                    >
                      {section.is_active ? 'Désactiver' : 'Activer'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Titre principal</label>
                  <Input
                    value={section.title || ''}
                    onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                    placeholder="Titre de la section..."
                    disabled={saving}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Sous-titre</label>
                  <Input
                    value={section.subtitle || ''}
                    onChange={(e) => updateSection(section.id, 'subtitle', e.target.value)}
                    placeholder="Sous-titre optionnel..."
                    disabled={saving}
                  />
                </div>
                
                {(section.key === 'hero' || section.key.includes('event')) && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Contenu détaillé</label>
                    <Textarea
                      value={section.content || ''}
                      onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                      placeholder="Texte descriptif plus long..."
                      rows={3}
                      disabled={saving}
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Texte du bouton</label>
                    <Input
                      value={section.button_text || ''}
                      onChange={(e) => updateSection(section.id, 'button_text', e.target.value)}
                      placeholder="Ex: Voir plus"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Lien du bouton</label>
                    <Input
                      value={section.button_link || ''}
                      onChange={(e) => updateSection(section.id, 'button_link', e.target.value)}
                      placeholder="/chemin-ou-url"
                      disabled={saving}
                    />
                  </div>
                </div>

                {section.key === 'hero' && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">URL de l'image</label>
                    <Input
                      value={section.image_url || ''}
                      onChange={(e) => updateSection(section.id, 'image_url', e.target.value)}
                      placeholder="https://..."
                      disabled={saving}
                    />
                    {section.image_url && (
                      <img 
                        src={section.image_url} 
                        alt="Aperçu" 
                        className="mt-3 h-40 object-cover rounded border"
                      />
                    )}
                  </div>
                )}

                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    Dernière modification: {new Date(section.updated_at).toLocaleString('fr-FR')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AdminHomepageEditor;
