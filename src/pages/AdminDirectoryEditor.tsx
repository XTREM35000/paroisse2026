import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2, Upload, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDirectory, type DirectoryItem } from '@/hooks/useDirectory';
import HeroBanner from '@/components/HeroBanner';
import { useLocation } from 'react-router-dom';
import usePageHero from '@/hooks/usePageHero';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const AdminDirectoryEditor: React.FC = () => {
  const { data: items = [], isLoading, refetch } = useDirectory();
  const { toast } = useToast();

  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState<{
    name: string;
    description: string;
    category: 'service' | 'member' | 'clergy';
    email: string;
    phone: string;
    website: string;
    image_url: string;
    display_order: number;
  }>({
    name: '',
    description: '',
    category: 'service',
    email: '',
    phone: '',
    website: '',
    image_url: '',
    display_order: 0,
  });

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      category: 'service',
      email: '',
      phone: '',
      website: '',
      image_url: '',
      display_order: 0,
    });
    setEditingId(null);
  };

  const openEdit = (item: DirectoryItem) => {
    setForm({
      name: item.name,
      description: item.description || '',
      category: item.category as 'service' | 'member' | 'clergy',
      email: item.email || '',
      phone: item.phone || '',
      website: item.website || '',
      image_url: item.image_url || '',
      display_order: item.display_order,
    });
    setEditingId(item.id);
    setIsDialogOpen(true);
  };

  const openCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { error: uploadError, data } = await supabase.storage
        .from('directory-images')
        .upload(`public/${fileName}`, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('directory-images')
        .getPublicUrl(`public/${fileName}`);

      setForm(prev => ({ ...prev, image_url: publicUrlData.publicUrl }));
      toast({
        title: 'Image téléchargée',
        description: 'L\'image a été uploadée avec succès.',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'uploader l\'image.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom est requis.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        // Update
        const { error } = await supabase
          .from('directory')
          .update({
            name: form.name,
            description: form.description,
            category: form.category,
            email: form.email || null,
            phone: form.phone || null,
            website: form.website || null,
            image_url: form.image_url || null,
            display_order: form.display_order,
          })
          .eq('id', editingId);

        if (error) throw error;
        toast({
          title: 'Succès',
          description: 'Élément mis à jour.',
        });
      } else {
        // Create
        const { error } = await supabase
          .from('directory')
          .insert([
            {
              name: form.name,
              description: form.description,
              category: form.category,
              email: form.email || null,
              phone: form.phone || null,
              website: form.website || null,
              image_url: form.image_url || null,
              display_order: form.display_order,
            },
          ]);

        if (error) throw error;
        toast({
          title: 'Succès',
          description: 'Élément créé.',
        });
      }

      closeDialog();
      await refetch();
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder l\'élément.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

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

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      service: 'Service',
      clergy: 'Clergé',
      member: 'Membre',
    };
    return labels[category] || category;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <HeroBanner
        title="Annuaire - Administration"
        subtitle="Gérez les services, le clergé et les membres"
        showBackButton={false}
        backgroundImage={hero?.image_url || undefined}
        onBgSave={saveHero}
      />

      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header with Add Button */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Éléments de l'annuaire</h2>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-5 w-5" />
              Ajouter un élément
            </Button>
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Nom</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Catégorie</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Téléphone</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Ordre</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                        Aucun élément. Créez le premier !
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-foreground">{item.name}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                            {getCategoryLabel(item.category)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{item.email || '—'}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{item.phone || '—'}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{item.display_order}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEdit(item)}
                              className="gap-1"
                            >
                              <Edit2 className="h-4 w-4" />
                              <span className="hidden sm:inline">Éditer</span>
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                              className="gap-1"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="hidden sm:inline">Supprimer</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Éditer l\'élément' : 'Créer un nouvel élément'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nom *
              </label>
              <Input
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Messe Dominicale"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Catégorie
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value as 'service' | 'member' | 'clergy' }))}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="service">Service</option>
                <option value="clergy">Clergé</option>
                <option value="member">Membre</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description détaillée..."
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="contact@paroisse.fr"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Téléphone
              </label>
              <Input
                value={form.phone}
                onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+33 1 23 45 67 89"
              />
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Site Web
              </label>
              <Input
                type="url"
                value={form.website}
                onChange={(e) => setForm(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://example.com"
              />
            </div>

            {/* Image */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Image
              </label>
              {form.image_url && (
                <div className="mb-3">
                  <img
                    src={form.image_url}
                    alt="Preview"
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="flex-1"
                />
                {uploading && <Loader2 className="h-5 w-5 animate-spin" />}
              </div>
            </div>

            {/* Display Order */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Ordre d'affichage
              </label>
              <Input
                type="number"
                value={form.display_order}
                onChange={(e) => setForm(prev => ({ ...prev, display_order: parseInt(e.target.value) }))}
                placeholder="0"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={closeDialog}
                disabled={isSaving}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingId ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDirectoryEditor;
