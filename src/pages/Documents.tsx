import { useState, useEffect } from 'react';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'react-router-dom';
import usePageHero from '@/hooks/usePageHero';
import HeroBanner from '@/components/HeroBanner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Download, Edit2, Upload } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Document {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_type: string;
  category: string | null;
  tags: string[] | null;
  is_public: boolean;
  download_count: number;
  created_at: string;
  uploaded_by: string;
}

interface EditForm {
  title: string;
  description: string;
  is_public: boolean;
  category: string;
}

export default function Documents() {
  const { isAdmin } = useRoleCheck();
  const { user } = useAuth();
  const { toast } = useToast();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    title: '',
    description: '',
    is_public: true,
    category: '',
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileInput, setFileInput] = useState<File | null>(null);

  // Fetch documents
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Filter documents
  useEffect(() => {
    let filtered = documents;

    if (searchTerm) {
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((doc) => doc.category === selectedCategory);
    }

    setFilteredDocs(filtered);
  }, [documents, searchTerm, selectedCategory]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const query = supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      // Non-admins only see public documents
      if (!isAdmin) {
        query.eq('is_public', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les documents',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!fileInput || !user) return;

    try {
      setUploading(true);
      const formData = new FormData(e.currentTarget);
      const title = formData.get('title') as string;
      const description = formData.get('description') as string;
      const category = formData.get('category') as string;
      const is_public = formData.get('is_public') === 'true';

      // Upload file to storage
      const fileExt = fileInput.name.split('.').pop();
      const fileName = `${Date.now()}-${fileInput.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(`public/${fileName}`, fileInput);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(uploadData.path);

      // Create document record
      const { error: insertError } = await supabase.from('documents').insert({
        title,
        description,
        file_url: urlData.publicUrl,
        file_name: fileInput.name,
        file_type: fileExt || 'unknown',
        category: category || null,
        is_public,
        uploaded_by: user.id,
      });

      if (insertError) throw insertError;

      toast({
        title: 'Succès',
        description: 'Document téléchargé avec succès',
      });

      setUploadDialogOpen(false);
      setFileInput(null);
      fetchDocuments();
    } catch (err) {
      console.error('Error uploading document:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger le document',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = async (docId: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({
          title: editForm.title,
          description: editForm.description || null,
          is_public: editForm.is_public,
          category: editForm.category || null,
        })
        .eq('id', docId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Document mis à jour',
      });

      setEditingDoc(null);
      fetchDocuments();
    } catch (err) {
      console.error('Error updating document:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le document',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (docId: string) => {
    try {
      const { error } = await supabase.from('documents').delete().eq('id', docId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Document supprimé',
      });

      setDeleteConfirm(null);
      fetchDocuments();
    } catch (err) {
      console.error('Error deleting document:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le document',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (doc: Document) => {
    setEditingDoc(doc);
    setEditForm({
      title: doc.title,
      description: doc.description || '',
      is_public: doc.is_public,
      category: doc.category || '',
    });
  };

  const categories = Array.from(
    new Set(documents.map((doc) => doc.category).filter(Boolean))
  ) as string[];

  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeroBanner
        title="Documents"
        subtitle="Ressources et documents à télécharger"
        showBackButton={true}
        backgroundImage={hero?.image_url || '/images/gallery.png'}
        onBgSave={saveHero}
      />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          {/* Search & Filters */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Rechercher des documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(isAdmin || user) && (
                <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Upload className="w-4 h-4 mr-2" />
                      Télécharger
                    </Button>
                  </DialogTrigger>
                  <DialogContent aria-describedby="upload-doc-desc">
                    <DialogHeader>
                      <DialogTitle>Télécharger un document</DialogTitle>
                    </DialogHeader>
                      <div id="upload-doc-desc" className="sr-only">Formulaire pour téléverser un document et définir ses métadonnées.</div>
                      <form onSubmit={handleUpload} className="space-y-4">
                      <div>
                        <Label htmlFor="title">Titre</Label>
                        <Input
                          id="title"
                          name="title"
                          placeholder="Titre du document"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          name="description"
                          placeholder="Description (optionnel)"
                        />
                      </div>

                      <div>
                        <Label htmlFor="category">Catégorie</Label>
                        <Input
                          id="category"
                          name="category"
                          placeholder="Ex: Guides, Formulaires, etc."
                        />
                      </div>

                      <div>
                        <Label htmlFor="file">Fichier</Label>
                        <Input
                          id="file"
                          type="file"
                          onChange={(e) => setFileInput(e.target.files?.[0] || null)}
                          required
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="is_public"
                          name="is_public"
                          value="true"
                          defaultChecked
                        />
                        <Label htmlFor="is_public" className="cursor-pointer">
                          Rendre public
                        </Label>
                      </div>

                      <div className="flex gap-2 justify-end pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setUploadDialogOpen(false)}
                        >
                          Annuler
                        </Button>
                        <Button
                          type="submit"
                          disabled={uploading || !fileInput}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {uploading ? 'Téléchargement...' : 'Télécharger'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Documents Grid */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Chargement des documents...</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucun document trouvé</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden group"
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                    <h3 className="font-semibold text-lg truncate">{doc.title}</h3>
                    {doc.category && (
                      <p className="text-sm text-blue-100 mt-1">{doc.category}</p>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    {doc.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {doc.description}
                      </p>
                    )}

                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Fichier: {doc.file_name}</p>
                      <p>
                        Téléchargements: <span className="font-semibold">{doc.download_count}</span>
                      </p>
                      {!doc.is_public && (
                        <p className="text-orange-600 font-semibold">Privé</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="border-t dark:border-slate-700 p-3 flex gap-2">
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          supabase
                            .from('documents')
                            .update({ download_count: doc.download_count + 1 })
                            .eq('id', doc.id)
                            .then();
                        }}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Télécharger
                      </Button>
                    </a>

                    {isAdmin && (
                      <>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(doc)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent aria-describedby="doc-edit-desc">
                            <DialogHeader>
                              <DialogTitle>Modifier le document</DialogTitle>
                            </DialogHeader>
                            <div id="doc-edit-desc" className="sr-only">Formulaire de modification des métadonnées du document.</div>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="edit-title">Titre</Label>
                                <Input
                                  id="edit-title"
                                  value={editForm.title}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      title: e.target.value,
                                    })
                                  }
                                />
                              </div>

                              <div>
                                <Label htmlFor="edit-description">Description</Label>
                                <Textarea
                                  id="edit-description"
                                  value={editForm.description}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      description: e.target.value,
                                    })
                                  }
                                />
                              </div>

                              <div>
                                <Label htmlFor="edit-category">Catégorie</Label>
                                <Input
                                  id="edit-category"
                                  value={editForm.category}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      category: e.target.value,
                                    })
                                  }
                                />
                              </div>

                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id="edit-is_public"
                                  checked={editForm.is_public}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      is_public: e.target.checked,
                                    })
                                  }
                                />
                                <Label htmlFor="edit-is_public" className="cursor-pointer">
                                  Public
                                </Label>
                              </div>

                              <div className="flex gap-2 justify-end pt-4">
                                <Button variant="outline">Annuler</Button>
                                <Button
                                  onClick={() =>
                                    editingDoc && handleEdit(editingDoc.id)
                                  }
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  Enregistrer
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <AlertDialog open={deleteConfirm === doc.id} onOpenChange={() => setDeleteConfirm(null)}>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer le document?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="flex gap-2 justify-end">
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(doc.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>

                        <button
                          onClick={() => setDeleteConfirm(doc.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
