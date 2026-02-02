import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, AlertCircle, CheckCircle, Calendar, MapPin } from 'lucide-react';
import BaseModal from './base-modal';
import { supabase } from '@/integrations/supabase/client';
import { uploadFile } from '@/lib/supabase/storage';
import { useNotification } from './ui/notification-system';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import slugify from '@/lib/slugify';

interface EditingEvent {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  image_url?: string | null;
}

interface EventModalFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (eventData: Record<string, unknown>) => Promise<void>;
  onDelete?: (eventId: string) => Promise<void>;
  editingEvent?: EditingEvent | null;
  isLoading?: boolean;
}

interface FormData {
  title: string;
  description: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  location: string;
  image_url: string;
  // New fields
  slug?: string;
  seo_title?: string;
  seo_description?: string;
  content?: string;
}

type TabType = 'basic' | 'datetime' | 'location' | 'preview';

const EventModalForm: React.FC<EventModalFormProps> = ({
  open,
  onClose,
  onSave,
  onDelete,
  editingEvent,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    start_date: '',
    start_time: '09:00',
    end_date: '',
    end_time: '17:00',
    location: '',
    image_url: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { notifySuccess, notifyError } = useNotification();

  // Pré-remplir si édition
  useEffect(() => {
    if (editingEvent) {
      const startDateTime = editingEvent.start_date ? new Date(editingEvent.start_date) : null;
      const endDateTime = editingEvent.end_date ? new Date(editingEvent.end_date) : null;

      setFormData({
        title: editingEvent.title || '',
        description: editingEvent.description || '',
        start_date: startDateTime ? startDateTime.toISOString().split('T')[0] : '',
        start_time: startDateTime ? startDateTime.toTimeString().slice(0, 5) : '09:00',
        end_date: endDateTime ? endDateTime.toISOString().split('T')[0] : '',
        end_time: endDateTime ? endDateTime.toTimeString().slice(0, 5) : '17:00',
        location: editingEvent.location || '',
        image_url: editingEvent.image_url || '',
        // New fields populated if editing
        slug: (editingEvent as any).slug || undefined,
        seo_title: (editingEvent as any).seo_title || undefined,
        seo_description: (editingEvent as any).seo_description || undefined,
        content: (editingEvent as any).content || editingEvent.description || undefined,
      });
      setActiveTab('basic');
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        title: '',
        description: '',
        start_date: today,
        start_time: '09:00',
        end_date: today,
        end_time: '17:00',
        location: '',
        image_url: '',
        slug: undefined,
        seo_title: undefined,
        seo_description: undefined,
        content: undefined,
      });
    }
  }, [editingEvent, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Auto-générer slug à partir du titre si slug vide
  useEffect(() => {
    if (!formData.slug && formData.title) {
      setFormData((prev) => ({ ...prev, slug: slugify(prev.title) }));
    }
    // only run when title changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.title]);

  const handleImageUpload = async (file: File) => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Vous devez être connecté pour uploader');
      }

      const fileName = file.name.replace(/\s+/g, '-');
      const uploadedImage = await uploadFile(file, `event-images/${Date.now()}_${fileName}`);
      if (!uploadedImage?.publicUrl) {
        throw new Error('Erreur lors du téléversement de l\'image');
      }

      setFormData((prev) => ({
        ...prev,
        image_url: uploadedImage.publicUrl,
      }));

      notifySuccess('Succès', 'Image téléversée');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors de l\'upload';
      setError(errorMsg);
      notifyError('Erreur', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Le titre est obligatoire');
      return;
    }

    if (!formData.start_date) {
      setError('La date de début est obligatoire');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const start_datetime = new Date(`${formData.start_date}T${formData.start_time}`).toISOString();
      const end_datetime = formData.end_date 
        ? new Date(`${formData.end_date}T${formData.end_time}`).toISOString()
        : null;

      const eventData: Record<string, unknown> = {
        title: formData.title,
        description: formData.description,
        start_date: start_datetime,
        end_date: end_datetime,
        location: formData.location || null,
        image_url: formData.image_url || null,
        // New fields
        slug: formData.slug || undefined,
        seo_title: formData.seo_title || undefined,
        seo_description: formData.seo_description || undefined,
        content: formData.content || formData.description || undefined,
      };

      if (editingEvent) {
        eventData.id = editingEvent.id;
      }

      await onSave(eventData);
      setSuccess(true);

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
      setError(errorMsg);
      notifyError('Erreur', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editingEvent || !onDelete) return;

    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onDelete(editingEvent.id);
      notifySuccess('Succès', 'Événement supprimé');
      onClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      setError(errorMsg);
      notifyError('Erreur', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <BaseModal open={open} onClose={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-background rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Calendar className="w-6 h-6" />
                {editingEvent ? 'Modifier l\'événement' : 'Ajouter un événement'}
              </h2>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-6 pt-6 pb-4 border-b border-border">
              {(['basic', 'datetime', 'location', 'seo', 'preview'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-t-lg font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {tab === 'basic' && 'Infos de base'}
                  {tab === 'datetime' && 'Date & Heure'}
                  {tab === 'location' && 'Localisation'}
                  {tab === 'seo' && 'SEO & Contenu'}
                  {tab === 'preview' && 'Aperçu'}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 bg-destructive/10 border border-destructive text-destructive rounded-lg flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>{error}</div>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 bg-green-500/10 border border-green-500 text-green-500 rounded-lg flex items-start gap-3"
                >
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>{editingEvent ? 'Événement mis à jour' : 'Événement créé'}</div>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* TAB: BASIC */}
                {activeTab === 'basic' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Titre *</label>
                      <Input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Ex: Célébration de Noël"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Détails sur l'événement..."
                        className="w-full h-24 px-3 py-2 border border-input rounded-md bg-background"
                      />
                    </div>
                  </div>
                )}

                {/* TAB: DATE & TIME */}
                {activeTab === 'datetime' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Date de début *</label>
                        <Input
                          type="date"
                          name="start_date"
                          value={formData.start_date}
                          onChange={handleChange}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Heure de début</label>
                        <Input
                          type="time"
                          name="start_time"
                          value={formData.start_time}
                          onChange={handleChange}
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Date de fin</label>
                        <Input
                          type="date"
                          name="end_date"
                          value={formData.end_date}
                          onChange={handleChange}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Heure de fin</label>
                        <Input
                          type="time"
                          name="end_time"
                          value={formData.end_time}
                          onChange={handleChange}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: LOCATION */}
                {activeTab === 'location' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Localisation</label>
                      <div className="flex gap-2">
                        <MapPin className="w-5 h-5 text-muted-foreground" />
                        <Input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          placeholder="Ex: Église Saint-Jean, 123 rue de Paris"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-4">Image de l'événement</label>
                      <div className="space-y-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleImageUpload(e.target.files[0]);
                            }
                          }}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={loading}
                          className="w-full"
                          variant="outline"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {loading ? 'Téléversement...' : 'Téléverser une image'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: SEO & CONTENT */}
                {activeTab === 'seo' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Slug (optionnel)</label>
                      <Input
                        type="text"
                        name="slug"
                        value={formData.slug || ''}
                        onChange={handleChange}
                        placeholder="Ex: celebration-de-noel"
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Laisser vide pour le générer automatiquement à partir du titre.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">SEO title</label>
                      <Input
                        type="text"
                        name="seo_title"
                        value={formData.seo_title || ''}
                        onChange={handleChange}
                        placeholder="Titre pour SEO / partage"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">SEO description</label>
                      <Input
                        type="text"
                        name="seo_description"
                        value={formData.seo_description || ''}
                        onChange={handleChange}
                        placeholder="Description pour SEO / partage"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Contenu détaillé</label>
                      <textarea
                        name="content"
                        value={formData.content || ''}
                        onChange={handleChange}
                        placeholder="Contenu de la page événement (texte enrichi ou markdown)"
                        className="w-full h-32 px-3 py-2 border border-input rounded-md bg-background"
                      />
                    </div>
                  </div>
                )}

                        {formData.image_url && (
                          <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
                            <img
                              src={formData.image_url}
                              alt="Event preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                {/* TAB: PREVIEW */}
                {activeTab === 'preview' && (
                  <div className="space-y-6">
                    <div className="bg-muted rounded-lg p-6 space-y-4">
                      <h3 className="text-xl font-semibold">{formData.title || '(Sans titre)'}</h3>
                      <p className="text-sm text-muted-foreground">{formData.description || '(Sans description)'}</p>
                      
                      <div className="space-y-2 text-sm">
                        <p className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {formData.start_date} à {formData.start_time}
                            {formData.end_date && ` → ${formData.end_date} à ${formData.end_time}`}
                          </span>
                        </p>
                        {formData.location && (
                          <p className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{formData.location}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {formData.image_url && (
                      <div>
                        <p className="text-sm font-medium mb-3">Image</p>
                        <img
                          src={formData.image_url}
                          alt="Event"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>

            {/* Footer */}
            <div className="flex gap-2 p-6 border-t border-border bg-card">
              <Button variant="outline" onClick={onClose}>
                Fermer
              </Button>
              {editingEvent && onDelete && (
                <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                  Supprimer
                </Button>
              )}
              <div className="flex-1" />
              <Button onClick={handleSubmit} disabled={isLoading || loading}>
                {editingEvent ? 'Mettre à jour' : 'Ajouter l\'événement'}
              </Button>
            </div>
          </motion.div>
        </BaseModal>
      )}
    </AnimatePresence>
  );
};

export default EventModalForm;
