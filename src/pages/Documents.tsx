import { useState, useEffect, useMemo } from 'react';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import usePageHero from '@/hooks/usePageHero';
import HeroBanner from '@/components/HeroBanner';
import SectionTitle from '@/components/SectionTitle';
import { supabase } from '@/integrations/supabase/client';
import { uploadFile } from '@/lib/supabase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Download, Edit2, Upload, FileText, Clock, FolderOpen } from 'lucide-react';
import { motion } from 'framer-motion';
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
import FileUploadZone from '@/components/FileUploadZone';
import ArchiveCard from '@/components/ArchiveCard';
import useArchives from '@/hooks/useArchives';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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
  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);
  const queryClient = useQueryClient();

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

      // Upload file to storage via centralized helper (ensures GALLERY_BUCKET)
      const fileExt = fileInput.name.split('.').pop();
      const fileName = `${Date.now()}-${fileInput.name}`;
      const uploadResult = await uploadFile(fileInput, `public/${fileName}`);

      if (!uploadResult || !uploadResult.publicUrl) throw new Error('Upload failed');

      // Create document record
      const { error: insertError } = await supabase.from('documents').insert({
        title,
        description,
        file_url: uploadResult.publicUrl,
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

  // Stats calculation
  const stats = useMemo(() => ({
    total: documents.length,
    categories: categories.length,
    public: documents.filter(d => d.is_public).length,
    recent: documents.slice(0, 3),
    byCategory: categories.map(cat => ({
      name: cat,
      count: documents.filter(d => d.category === cat).length,
      docs: documents.filter(d => d.category === cat).slice(0, 3)
    }))
  }), [documents, categories]);

  // Recent documents sorted by date
  const recentDocs = useMemo(() => {
    return [...documents].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6);
  }, [documents]);

  // Most downloaded
  const mostDownloaded = useMemo(() => {
    return [...documents].sort((a, b) => (b.download_count || 0) - (a.download_count || 0)).slice(0, 6);
  }, [documents]);

function DocumentsArchivesList({ mediaType }: { mediaType?: string }) {
  const { useList } = useArchives();
  const { data: archives, isLoading } = useList(mediaType);

  if (isLoading) return <div>Chargement des archives...</div>;

  return (
    <div className="space-y-3">
      {archives?.length ? (
        (archives as any[]).map((a) => <ArchiveCard key={a.id} archive={a} />)
      ) : (
        <div className="text-sm text-muted-foreground">Aucune archive partagée pour le moment.</div>
      )}
    </div>
  );
}

  return (
    <div className="min-h-screen bg-background">
      <HeroBanner
        title="Documents"
        subtitle="Ressources et documents à télécharger"
        showBackButton={true}
        backgroundImage={hero?.image_url}
        onBgSave={saveHero}
      />

      <main className="container mx-auto px-4 py-12 lg:py-16">
        {/* Stats Section */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0 }}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total documents</p>
                      <h3 className="text-3xl font-bold">{stats.total}</h3>
                    </div>
                    <FileText className="w-8 h-8 text-blue-500" />
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Catégories</p>
                      <h3 className="text-3xl font-bold">{stats.categories}</h3>
                    </div>
                    <FolderOpen className="w-8 h-8 text-purple-500" />
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Documents publics</p>
                      <h3 className="text-3xl font-bold">{stats.public}</h3>
                    </div>
                    <Upload className="w-8 h-8 text-green-500" />
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
            {isAdmin && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <Card>
                  <CardHeader>
                    <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                          <Upload className="w-4 h-4 mr-2" />
                          Télécharger
                        </Button>
                      </DialogTrigger>
                      {/* Upload Dialog Content */}
                      <DialogContent aria-describedby="upload-doc-desc">
                        <DialogHeader>
                          <DialogTitle>Télécharger un document</DialogTitle>
                        </DialogHeader>
                        <div id="upload-doc-desc" className="sr-only">Formulaire pour téléverser un document et définir ses métadonnées.</div>
                        <form onSubmit={handleUpload} className="space-y-4">
                          <div>
                            <Label htmlFor="title">Titre</Label>
                            <Input id="title" name="title" placeholder="Titre du document" required />
                          </div>
                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" placeholder="Description (optionnel)" />
                          </div>
                          <div>
                            <Label htmlFor="category">Catégorie</Label>
                            <Input id="category" name="category" placeholder="Ex: Guides, Formulaires, etc." />
                          </div>
                          <div>
                            <Label htmlFor="file">Fichier</Label>
                            <Input id="file" type="file" onChange={(e) => setFileInput(e.target.files?.[0] || null)} required />
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="checkbox" id="is_public" name="is_public" value="true" defaultChecked />
                            <Label htmlFor="is_public" className="cursor-pointer">Rendre public</Label>
                          </div>
                          <div className="flex gap-2 justify-end pt-4">
                            <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)}>Annuler</Button>
                            <Button type="submit" disabled={uploading || !fileInput} className="bg-blue-600 hover:bg-blue-700">
                              {uploading ? 'Téléchargement...' : 'Télécharger'}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                </Card>
              </motion.div>
            )}
          </div>
        </motion.section>

        {/* Archives partagées (synchronisation OBS) */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Archives partagées</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              {(isAdmin) ? (
                <FileUploadZone mediaType="documents" onUploaded={() => queryClient.invalidateQueries({ queryKey: ['archives', 'documents'] })} />
              ) : (
                <div className="p-4 text-sm text-muted-foreground">Seuls les administrateurs peuvent téléverser des archives ZIP.</div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Dernières archives</h3>
              <DocumentsArchivesList mediaType="documents" />
            </div>
          </div>
        </section>

        {/* Documents récents */}
        {recentDocs.length > 0 && (
          <section className="mb-12">
            <SectionTitle title="Documents récents" subtitle="Les documents ajoutés dernièrement" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentDocs.map((doc) => <DocumentCard key={doc.id} doc={doc} />)}
            </div>
          </section>
        )}

        {/* Most downloaded */}
        {mostDownloaded.length > 0 && (
          <section className="mb-12">
            <SectionTitle title="Documents populaires" subtitle="Les documents les plus téléchargés" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mostDownloaded.map((doc) => <DocumentCard key={doc.id} doc={doc} />)}
            </div>
          </section>
        )}

        {/* Documents par catégorie */}
        {stats.byCategory.map((cat) => (
          <section key={cat.name} className="mb-12">
            <SectionTitle title={cat.name} subtitle={`${cat.count} document${cat.count > 1 ? 's' : ''}`} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.filter(d => d.category === cat.name).map((doc) => <DocumentCard key={doc.id} doc={doc} />)}
            </div>
          </section>
        ))}

        {/* Search & Filter Section (moved to bottom) */}
        <section className="mt-16 pt-12 border-t border-border">
          <h2 className="text-2xl font-bold mb-6">Rechercher et filtrer les documents</h2>
          <div className="space-y-4 mb-8">
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
            </div>
          </div>

          {/* Filtered Documents Grid */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Chargement des documents...</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Aucun document trouvé</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocs.map((doc) => <DocumentCard key={doc.id} doc={doc} />)}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// Document card component rendered at the beginning of the component
function DocumentCard({ doc, isAdmin, setDeleteConfirm, setEditForm, setEditingDoc, handleEdit, handleDelete, deleteConfirm }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-card rounded-lg border border-border hover:border-primary/50 transition-colors overflow-hidden h-full flex flex-col"
    >
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
        <h3 className="font-semibold truncate">{doc.title}</h3>
        {doc.category && <p className="text-sm text-blue-100 mt-1">{doc.category}</p>}
      </div>
      <div className="p-4 flex-1 space-y-2">
        {doc.description && <p className="text-sm text-muted-foreground line-clamp-2">{doc.description}</p>}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>{doc.file_name}</p>
          <p className="flex items-center gap-1"><Download className="w-3 h-3" /> {doc.download_count} téléchargements</p>
          {!doc.is_public && <p className="text-orange-600 font-semibold">Privé</p>}
        </div>
      </div>
      <div className="border-t border-border p-3 flex gap-2">
        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="flex-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              supabase.from('documents').update({ download_count: doc.download_count + 1 }).eq('id', doc.id).then();
            }}
          >
            <Download className="w-4 h-4 mr-1" />
            Télécharger
          </Button>
        </a>
      </div>
    </motion.div>
  );
}
