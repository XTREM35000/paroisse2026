// src/pages/AdminAboutEditor.tsx
import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAboutPage, AboutSection } from '@/hooks/useAboutPage';
import { supabase } from '@/integrations/supabase/client';
import { uploadFile } from '@/lib/supabase/storage';
import type { Json } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Save, X, MoveUp, MoveDown, Image as ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import HeroBanner from '@/components/HeroBanner';

// Types pour les métadonnées spécifiques
interface ButtonMetadata {
  text: string;
  link: string;
  variant: 'primary' | 'secondary' | 'outline';
}

interface ListItemMetadata {
  icon: string;
  text: string;
}

interface CardMetadata {
  title: string;
  description: string;
  icon: string;
  color: string;
}

interface ContactItemMetadata {
  type: string;
  label: string;
  value: string;
  icon: string;
}

interface CtaMetadata {
  button_text: string;
  button_link: string;
  button_variant: 'primary' | 'secondary' | 'outline' | 'ghost';
}

// Type union pour toutes les métadonnées possibles
type MetadataType = 
  | { buttons: ButtonMetadata[] }
  | { items: ListItemMetadata[] }
  | { cards: CardMetadata[] }
  | { items: ContactItemMetadata[] }
  | CtaMetadata
  | null
  | undefined;

// Props pour le composant MetadataEditor
interface MetadataEditorProps {
  section: AboutSection;
  onChange: (metadata: MetadataType) => void;
}

// Composant pour éditer les métadonnées selon le type de contenu
const MetadataEditor: React.FC<MetadataEditorProps> = ({ section, onChange }) => {
  const metadata = section.metadata as unknown as MetadataType;

  switch (section.content_type) {
    case 'hero': {
      const heroMetadata = metadata as { buttons: ButtonMetadata[] } | undefined;
      const buttons = heroMetadata?.buttons || [];

      return (
        <div className="space-y-4">
          <h4 className="font-medium">Boutons</h4>
          {buttons.map((btn, index) => (
            <div key={index} className="flex gap-2 items-center border p-3 rounded">
              <Input
                placeholder="Texte du bouton"
                value={btn.text || ''}
                onChange={(e) => {
                  const newButtons = [...buttons];
                  newButtons[index] = { ...newButtons[index], text: e.target.value };
                  onChange({ buttons: newButtons });
                }}
              />
              <Input
                placeholder="Lien"
                value={btn.link || ''}
                onChange={(e) => {
                  const newButtons = [...buttons];
                  newButtons[index] = { ...newButtons[index], link: e.target.value };
                  onChange({ buttons: newButtons });
                }}
              />
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={btn.variant || 'primary'}
                onChange={(e) => {
                  const newButtons = [...buttons];
                  newButtons[index] = { 
                    ...newButtons[index], 
                    variant: e.target.value as 'primary' | 'secondary' | 'outline' 
                  };
                  onChange({ buttons: newButtons });
                }}
              >
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="outline">Outline</option>
              </select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const newButtons = buttons.filter((_, i) => i !== index);
                  onChange({ buttons: newButtons });
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() => {
              const newButtons = [...buttons, { text: '', link: '/', variant: 'primary' as const }];
              onChange({ buttons: newButtons });
            }}
          >
            <Plus className="h-4 w-4 mr-2" /> Ajouter un bouton
          </Button>
        </div>
      );
    }

    case 'list': {
      const listMetadata = metadata as { items: ListItemMetadata[] } | undefined;
      const items = listMetadata?.items || [];

      return (
        <div className="space-y-4">
          <h4 className="font-medium">Éléments de liste</h4>
          {items.map((item, index) => (
            <div key={index} className="flex gap-2 items-center border p-3 rounded">
              <Input
                placeholder="Icône (nom Lucide)"
                value={item.icon || ''}
                onChange={(e) => {
                  const newItems = [...items];
                  newItems[index] = { ...newItems[index], icon: e.target.value };
                  onChange({ items: newItems });
                }}
              />
              <Input
                placeholder="Texte"
                value={item.text || ''}
                onChange={(e) => {
                  const newItems = [...items];
                  newItems[index] = { ...newItems[index], text: e.target.value };
                  onChange({ items: newItems });
                }}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const newItems = items.filter((_, i) => i !== index);
                  onChange({ items: newItems });
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() => {
              const newItems = [...items, { icon: 'circle', text: '' }];
              onChange({ items: newItems });
            }}
          >
            <Plus className="h-4 w-4 mr-2" /> Ajouter un élément
          </Button>
        </div>
      );
    }

    case 'cards': {
      const cardsMetadata = metadata as { cards: CardMetadata[] } | undefined;
      const cards = cardsMetadata?.cards || [];

      return (
        <div className="space-y-4">
          <h4 className="font-medium">Cartes</h4>
          {cards.map((card, index) => (
            <Card key={index} className="mb-4">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Input
                    placeholder="Titre de la carte"
                    value={card.title || ''}
                    onChange={(e) => {
                      const newCards = [...cards];
                      newCards[index] = { ...newCards[index], title: e.target.value };
                      onChange({ cards: newCards });
                    }}
                  />
                  <Textarea
                    placeholder="Description"
                    value={card.description || ''}
                    onChange={(e) => {
                      const newCards = [...cards];
                      newCards[index] = { ...newCards[index], description: e.target.value };
                      onChange({ cards: newCards });
                    }}
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Icône"
                      value={card.icon || ''}
                      onChange={(e) => {
                        const newCards = [...cards];
                        newCards[index] = { ...newCards[index], icon: e.target.value };
                        onChange({ cards: newCards });
                      }}
                    />
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      value={card.color || 'blue'}
                      onChange={(e) => {
                        const newCards = [...cards];
                        newCards[index] = { ...newCards[index], color: e.target.value };
                        onChange({ cards: newCards });
                      }}
                    >
                      <option value="blue">Bleu</option>
                      <option value="green">Vert</option>
                      <option value="red">Rouge</option>
                      <option value="yellow">Jaune</option>
                      <option value="purple">Violet</option>
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newCards = cards.filter((_, i) => i !== index);
                        onChange({ cards: newCards });
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button
            variant="outline"
            onClick={() => {
              const newCards = [...cards, {
                title: '',
                description: '',
                icon: 'circle',
                color: 'blue'
              }];
              onChange({ cards: newCards });
            }}
          >
            <Plus className="h-4 w-4 mr-2" /> Ajouter une carte
          </Button>
        </div>
      );
    }

    case 'contact': {
      const contactMetadata = metadata as { items: ContactItemMetadata[] } | undefined;
      const items = contactMetadata?.items || [];

      return (
        <div className="space-y-4">
          <h4 className="font-medium">Informations de contact</h4>
          {items.map((item, index) => (
            <div key={index} className="space-y-2 border p-3 rounded">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{item.type}</Badge>
                <Input
                  placeholder="Label"
                  value={item.label || ''}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[index] = { ...newItems[index], label: e.target.value };
                    onChange({ items: newItems });
                  }}
                />
              </div>
              <Textarea
                placeholder="Valeur (lignes séparées par \n)"
                value={item.value || ''}
                onChange={(e) => {
                  const newItems = [...items];
                  newItems[index] = { ...newItems[index], value: e.target.value };
                  onChange({ items: newItems });
                }}
              />
              <Input
                placeholder="Icône"
                value={item.icon || ''}
                onChange={(e) => {
                  const newItems = [...items];
                  newItems[index] = { ...newItems[index], icon: e.target.value };
                  onChange({ items: newItems });
                }}
              />
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newItems = items.filter((_, i) => i !== index);
                    onChange({ items: newItems });
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                </Button>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() => {
              const newItems = [...items, {
                type: 'custom',
                label: '',
                value: '',
                icon: 'circle'
              }];
              onChange({ items: newItems });
            }}
          >
            <Plus className="h-4 w-4 mr-2" /> Ajouter un contact
          </Button>
        </div>
      );
    }

    case 'cta': {
      const ctaMetadata = metadata as CtaMetadata | undefined;

      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Texte du bouton</Label>
              <Input
                value={ctaMetadata?.button_text || ''}
                onChange={(e) => onChange({ 
                  ...ctaMetadata,
                  button_text: e.target.value,
                  button_link: ctaMetadata?.button_link || '/contact',
                  button_variant: ctaMetadata?.button_variant || 'primary'
                } as CtaMetadata)}
              />
            </div>
            <div>
              <Label>Lien du bouton</Label>
              <Input
                value={ctaMetadata?.button_link || ''}
                onChange={(e) => onChange({ 
                  ...ctaMetadata,
                  button_text: ctaMetadata?.button_text || 'Nous Écrire',
                  button_link: e.target.value,
                  button_variant: ctaMetadata?.button_variant || 'primary'
                } as CtaMetadata)}
              />
            </div>
          </div>
          <div>
            <Label>Variante du bouton</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              value={ctaMetadata?.button_variant || 'primary'}
              onChange={(e) => onChange({ 
                ...ctaMetadata,
                button_text: ctaMetadata?.button_text || 'Nous Écrire',
                button_link: ctaMetadata?.button_link || '/contact',
                button_variant: e.target.value as 'primary' | 'secondary' | 'outline' | 'ghost'
              } as CtaMetadata)}
            >
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="outline">Outline</option>
              <option value="ghost">Ghost</option>
            </select>
          </div>
        </div>
      );
    }

    default:
      return null;
  }
};

const AdminAboutEditor: React.FC = () => {
  const { data: sections, isLoading } = useAboutPage();
  const [editingSection, setEditingSection] = useState<AboutSection | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  // Initialiser l'édition avec la première section
  useEffect(() => {
    if (sections && sections.length > 0 && !editingSection) {
      setEditingSection(sections[0]);
    }
  }, [sections, editingSection]);

  const handleSave = async () => {
    if (!editingSection) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('about_page_sections')
        .update({
          title: editingSection.title,
          subtitle: editingSection.subtitle,
          content: editingSection.content,
          metadata: editingSection.metadata,
          image_url: editingSection.image_url,
          icon: editingSection.icon,
          display_order: editingSection.display_order,
          is_active: editingSection.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingSection.id);

      if (error) throw error;

      toast({
        title: 'Section sauvegardée',
        description: 'Les modifications ont été enregistrées avec succès.'
      });

      // Invalider le cache et forcer un refetch immédiat
      await queryClient.invalidateQueries({ queryKey: ['about-page'] });
      await queryClient.refetchQueries({ queryKey: ['about-page'] });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les modifications.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingSection) return;

    try {
      // Télécharger l'image
      const result = await uploadFile(file, 'about-page');
      
      // Mettre à jour la section avec l'URL de l'image
      setEditingSection({
        ...editingSection,
        image_url: result.publicUrl
      });

      toast({
        title: 'Image téléchargée',
        description: 'L\'image a été téléchargée avec succès.'
      });
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger l\'image.',
        variant: 'destructive'
      });
    }
  };

  const moveSectionOrder = async (sectionId: string, direction: 'up' | 'down') => {
    const section = sections?.find(s => s.id === sectionId);
    if (!section || !sections) return;

    const currentOrder = section.display_order;
    const targetSection = sections.find(s => 
      direction === 'up' 
        ? s.display_order < currentOrder
        : s.display_order > currentOrder
    );

    if (!targetSection) return;

    try {
      // Échanger les ordres d'affichage
      await supabase
        .from('about_page_sections')
        .update({ display_order: targetSection.display_order })
        .eq('id', sectionId);

      await supabase
        .from('about_page_sections')
        .update({ display_order: currentOrder })
        .eq('id', targetSection.id);

      toast({
        title: 'Ordre modifié',
        description: 'L\'ordre d\'affichage a été mis à jour.'
      });

      // Invalider et refetch immédiatement
      await queryClient.invalidateQueries({ queryKey: ['about-page'] });
      await queryClient.refetchQueries({ queryKey: ['about-page'] });
    } catch (error) {
      console.error('Erreur lors du déplacement:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier l\'ordre.',
        variant: 'destructive'
      });
    }
  };

  const handleToggleActive = async (sectionId: string, isActive: boolean) => {
    try {
      await supabase
        .from('about_page_sections')
        .update({ is_active: isActive })
        .eq('id', sectionId);

      toast({
        title: 'Statut modifié',
        description: `Section ${isActive ? 'activée' : 'désactivée'}`
      });

      // Invalider et refetch immédiatement
      await queryClient.invalidateQueries({ queryKey: ['about-page'] });
      await queryClient.refetchQueries({ queryKey: ['about-page'] });
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut.',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <HeroBanner
          title="Page À propos"
          subtitle="Gérez la page &quot;Qui sommes-nous ?&quot; de la paroisse"
          showBackButton
        />
        <div className="flex-1 container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Chargement des sections...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!sections || sections.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <HeroBanner
          title="Page À propos"
          subtitle="Gérez la page &quot;Qui sommes-nous ?&quot; de la paroisse"
          showBackButton
        />
        <div className="flex-1 container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Aucune section trouvée</p>
                <Button onClick={() => window.location.reload()}>
                  Recharger la page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeroBanner
        title="Page À propos"
        subtitle="Gérez la page &quot;Qui sommes-nous ?&quot; de la paroisse"
        showBackButton
      />

      <div className="flex-1 container mx-auto px-4 py-10">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold">
            Page &laquo; À propos &raquo;
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Structurez l&apos;histoire de la paroisse en sections simples : un titre clair, un court texte
            et, si besoin, une image illustratrice. Commencez par choisir une section dans la colonne
            de gauche, puis ajustez son contenu dans l&apos;éditeur.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6 items-start">
          {/* Liste des sections */}
          <div className="lg:col-span-1">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Sections de la page</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sections
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((section) => (
                      <div
                        key={section.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          editingSection?.id === section.id
                            ? 'bg-primary/10 border border-primary/20'
                            : 'hover:bg-accent'
                        }`}
                        onClick={() => setEditingSection(section)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium truncate">
                              {section.title || section.section_key}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {section.content_type}
                              </Badge>
                              <div className="flex items-center gap-1">
                                <Switch
                                  checked={section.is_active}
                                  onClick={(e) => e.stopPropagation()}
                                  onCheckedChange={(checked) =>
                                    handleToggleActive(section.id, checked)
                                  }
                                />
                                <span className="text-xs text-muted-foreground">
                                  {section.is_active ? 'Actif' : 'Inactif'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveSectionOrder(section.id, 'up');
                              }}
                              disabled={section.display_order <= 1}
                            >
                              <MoveUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveSectionOrder(section.id, 'down');
                              }}
                              disabled={section.display_order >= sections.length}
                            >
                              <MoveDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Éditeur */}
          <div className="lg:col-span-3">
            {editingSection ? (
              <Card className="shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      Édition: {editingSection.title || editingSection.section_key}
                    </CardTitle>
                    <Badge variant="outline">
                      {editingSection.content_type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="general" className="space-y-4">
                    <TabsList>
                      <TabsTrigger value="general">Texte & en‑tête</TabsTrigger>
                      <TabsTrigger value="content">Paragraphe</TabsTrigger>
                      <TabsTrigger value="metadata">Mise en page</TabsTrigger>
                      <TabsTrigger value="image">Image de section</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-4">
                      <p className="text-xs text-muted-foreground">
                        Définissez le titre, le sous‑titre et l&apos;icône qui apparaîtront pour cette section sur la page publique.
                      </p>
                      <div>
                        <Label htmlFor="title">Titre</Label>
                        <Input
                          id="title"
                          value={editingSection.title || ''}
                          onChange={(e) => setEditingSection({
                            ...editingSection,
                            title: e.target.value
                          })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="subtitle">Sous-titre</Label>
                        <Input
                          id="subtitle"
                          value={editingSection.subtitle || ''}
                          onChange={(e) => setEditingSection({
                            ...editingSection,
                            subtitle: e.target.value
                          })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="icon">Icône (nom Lucide)</Label>
                        <Input
                          id="icon"
                          value={editingSection.icon || ''}
                          onChange={(e) => setEditingSection({
                            ...editingSection,
                            icon: e.target.value
                          })}
                          placeholder="heart, users, church, etc."
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="is-active"
                          checked={editingSection.is_active}
                          onCheckedChange={(checked) => setEditingSection({
                            ...editingSection,
                            is_active: checked
                          })}
                        />
                        <Label htmlFor="is-active">Section active</Label>
                      </div>
                    </TabsContent>

                    <TabsContent value="content" className="space-y-4">
                      <div>
                        <Label htmlFor="content">Contenu principal de la section</Label>
                        <Textarea
                          id="content"
                          value={editingSection.content || ''}
                          onChange={(e) => setEditingSection({
                            ...editingSection,
                            content: e.target.value
                          })}
                          rows={6}
                          className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Vous pouvez utiliser des retours à la ligne pour aérer le texte.
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="metadata" className="space-y-4">
                      <p className="text-xs text-muted-foreground">
                        Options avancées (listes, cartes, boutons, contacts…) pour affiner la mise en page. Laissez vide si vous ne les utilisez pas.
                      </p>
                      <MetadataEditor
                        section={editingSection}
                        onChange={(metadata) => setEditingSection({
                          ...editingSection,
                          metadata: metadata as unknown as Json
                        })}
                      />
                    </TabsContent>

                    <TabsContent value="image" className="space-y-4">
                      <div>
                        <Label>
                          {editingSection.section_key === 'about_hero' 
                            ? 'Image de fond du Hero Banner' 
                            : 'Image de la section'}
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {editingSection.section_key === 'about_hero' 
                            ? 'Définissez l\'image de fond du banner principal de la page à propos. Cette image sera affichée avec un overlay semi-transparent.'
                            : 'Téléchargez ou collez l\'URL d\'une image pour cette section.'}
                        </p>
                        <div className="mt-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="cursor-pointer"
                          />
                        </div>
                        {editingSection.image_url && (
                          <div className="mt-4">
                            <p className="text-sm font-medium mb-2">Image actuelle:</p>
                            <div className="relative w-full max-w-md aspect-video rounded-lg overflow-hidden border">
                              <img
                                src={editingSection.image_url}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <Input
                                value={editingSection.image_url}
                                readOnly
                                className="text-xs"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingSection({
                                    ...editingSection,
                                    image_url: null
                                  });
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setEditingSection(
                        sections.find(s => s.id === editingSection.id) || null
                      )}
                    >
                      <X className="h-4 w-4 mr-2" /> Annuler
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                          Sauvegarde...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" /> Sauvegarder
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Aucune section sélectionnée</h3>
                    <p className="text-muted-foreground">
                      Sélectionnez une section dans la liste pour commencer à éditer.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAboutEditor;