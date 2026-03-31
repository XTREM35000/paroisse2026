import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, AlertCircle, CheckCircle, Video as VideoIcon, Plus } from 'lucide-react';
import UnifiedFormModal from '@/components/ui/unified-form-modal';
import { supabase } from '@/integrations/supabase/client';
import { uploadFile, uploadVideoFile } from '@/lib/supabase/storage';
import { useNotification } from './ui/notification-system';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useContentSubmission from '@/hooks/useContentSubmission';
import SubmissionStatusAlert from '@/components/SubmissionStatusAlert';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import type { ContentApproval } from '@/types/database';

interface EditingVideo {
  id: string;
  title: string;
  description?: string;
  category?: string;
  duration: number | null;
  thumbnail_url: string | null;
  video_url?: string;
  published?: boolean;
}

interface VideoModalFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (videoData: Record<string, unknown>) => Promise<void>;
  onDelete?: (videoId: string) => Promise<void>;
  editingVideo?: EditingVideo | null;
  isLoading?: boolean;
}

interface FormData {
  title: string;
  description: string;
  category: string;
  duration: number | null;
  thumbnail_url: string;
  video_url: string;
  video_storage_path?: string;
  published: boolean;
}

type TabType = 'basic' | 'media' | 'preview';

const CATEGORIES = [
  { value: 'Sermon', label: 'Sermon' },
  { value: 'Musique', label: 'Musique' },
  { value: 'Célébration', label: 'Célébration' },
  { value: 'Enseignement', label: 'Enseignement' },
  { value: 'Témoignage', label: 'Témoignage' },
];

const VideoModalForm: React.FC<VideoModalFormProps> = ({
  open,
  onClose,
  onSave,
  onDelete,
  editingVideo,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: 'Sermon',
    duration: null,
    thumbnail_url: '',
    video_url: '',
    published: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submission, setSubmission] = useState<ContentApproval | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { notifySuccess, notifyError } = useNotification();
  const { submitContent, checkSubmissionStatus } = useContentSubmission();
  const { confirm, DialogComponent } = useConfirmDialog();

  // Pré-remplir si édition
  useEffect(() => {
    console.debug('📹 VideoModalForm useEffect', { open, editingVideo: editingVideo?.id });
    if (editingVideo) {
      setFormData({
        title: editingVideo.title || '',
        description: editingVideo.description || '',
        category: editingVideo.category || 'Sermon',
        duration: editingVideo.duration || null,
        thumbnail_url: editingVideo.thumbnail_url || '',
        video_url: editingVideo.video_url || '',
        published: editingVideo.published ?? true,
      });
      setActiveTab('basic');
    } else {
      setFormData({
        title: '',
        description: '',
        category: 'Sermon',
        duration: null,
        thumbnail_url: '',
        video_url: '',
        published: true,
      });
    }
    setError(null);
    setSuccess(false);
  }, [editingVideo, open]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.currentTarget;
    const inputElement = e.currentTarget as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? inputElement.checked
          : name === 'duration'
          ? value
            ? parseInt(value, 10)
            : null
          : value,
    }));
  };

  const handleThumbnailUpload = async (file: File) => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Vous devez être connecté pour uploader');
      }

      // Upload thumbnail avec le helper standard (clé courte : pas de sous-dossier)
      const uploadedThumbnail = await uploadFile(file);
      if (!uploadedThumbnail?.publicUrl) {
        throw new Error('Erreur lors du téléversement de la miniature');
      }

      setFormData((prev) => ({
        ...prev,
        thumbnail_url: uploadedThumbnail.publicUrl,
      }));

      notifySuccess('Succès', 'Miniature téléversée');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors de l\'upload';
      setError(errorMsg);
      notifyError('Erreur', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUpload = async (file: File) => {
    try {
      setLoading(true);
      setError(null);

      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      console.log('🎥 Début upload vidéo:', { fileName: file.name, size: `${fileSizeMB}MB`, type: file.type });

      // Warning for large files
      if (file.size > 100 * 1024 * 1024) {
        const msg = `⚠️ Fichier très gros (${fileSizeMB}MB). L'upload peut prendre plusieurs minutes.`;
        console.warn(msg);
        notifySuccess('⏳ Téléversement en cours', msg);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Vous devez être connecté pour uploader');
      }
      console.log('✅ User authentifié:', user.id);

      console.log('📤 Tentative upload vidéo vers bucket video-files (timeout: 5min)');
      console.log('⏳ Appel uploadVideoFile...');
      
      let uploadedVideo: { 
        key: string
        publicUrl: string
        originalName?: string
        mimeType?: string
        extension?: string
      } | null = null;
      try {
        uploadedVideo = await uploadVideoFile(file);
        console.log('✅ uploadVideoFile() retourné:', {
          key: uploadedVideo.key,
          publicUrl: uploadedVideo.publicUrl,
          originalName: uploadedVideo.originalName,
          mimeType: uploadedVideo.mimeType,
          extension: uploadedVideo.extension
        });
      } catch (uploadErr) {
        const errorMsg = uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
        console.error('❌ uploadVideoFile() a lancé une exception:', errorMsg);
        throw new Error(`Upload échoué: ${errorMsg}`);
      }

      if (!uploadedVideo?.key) {
        console.error('❌ Pas de clé retournée. uploadedVideo:', uploadedVideo);
        throw new Error(`Erreur: pas de clé de stockage retournée`);
      }

      console.log('✅ Upload réussi, video_storage_path:', uploadedVideo.key);
      console.log(`✅ Format: ${uploadedVideo.extension} (${uploadedVideo.mimeType})`);

      setFormData((prev) => ({
        ...prev,
        video_storage_path: uploadedVideo!.key,
        video_url: '', // Vider l'URL externe si vidéo locale
      }));

      notifySuccess('✅ Succès', `Vidéo téléversée (${fileSizeMB}MB)`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors de l\'upload de vidéo';
      console.error('❌ Erreur handleVideoUpload:', err, { errorMsg });
      setError(errorMsg);
      notifyError('❌ Erreur upload vidéo', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUrlChange = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      video_url: url,
      video_storage_path: '', // Vider le chemin local si URL externe
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Le titre est obligatoire');
      return;
    }

    if (!formData.category) {
      setError('Veuillez sélectionner une catégorie');
      return;
    }

    // Vérifier qu'au moins une vidéo est fournie (URL ou upload local)
    if (!formData.video_url && !formData.video_storage_path) {
      setError('Veuillez fournir une vidéo (URL externe ou upload local)');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const videoData: Record<string, unknown> = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        duration: formData.duration,
        thumbnail_url: formData.thumbnail_url || '/images/videos/default-thumbnail.jpg',
        published: formData.published,
      };

      // Inclure video_url si fournie (URL externe)
      if (formData.video_url) {
        videoData.video_url = formData.video_url;
      }

      // Inclure video_storage_path si vidéo uploadée localement
      if (formData.video_storage_path) {
        videoData.video_storage_path = formData.video_storage_path;
      }

      if (editingVideo) {
        videoData.id = editingVideo.id;
      }

      await onSave(videoData);
      
      // Si nouvelle vidéo (pas édition), soumettre pour approbation
      if (!editingVideo && videoData.id) {
        await submitContent('video', videoData.id as string, formData.title, formData.description);
        const { submission: newSubmission } = await checkSubmissionStatus('video', videoData.id as string);
        setSubmission(newSubmission);
        notifySuccess('Succès', 'Votre vidéo a été soumise pour approbation. Elle sera visible une fois approuvée par un admin.');
      }
      
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
    if (!editingVideo || !onDelete) return;

    const ok = await confirm({
      title: 'Supprimer la vidéo',
      description: 'Êtes-vous sûr de vouloir supprimer cette vidéo ? Cette action est irréversible.',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      variant: 'destructive',
    });
    if (!ok) return;

    try {
      setLoading(true);
      setError(null);
      await onDelete(editingVideo.id);
      notifySuccess('Succès', 'Vidéo supprimée');
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
    <>
    <UnifiedFormModal
      open={open}
      onClose={onClose}
      title={editingVideo ? 'Modifier la vidéo' : 'Ajouter une vidéo'}
      headerClassName="bg-amber-900"
      headerLeftAdornment={<VideoIcon className="w-5 h-5" />}
      maxWidth="max-w-2xl"
    >
      {/* Tabs */}
      <div className="flex gap-1 pb-4 mb-4 border-b border-border">
        {(['basic', 'media', 'preview'] as TabType[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t-lg font-medium transition-all ${
              activeTab === tab
                ? 'bg-amber-900 text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {tab === 'basic' && 'Infos de base'}
            {tab === 'media' && 'Médias'}
            {tab === 'preview' && 'Aperçu'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-6 max-h-[calc(80vh-250px)] overflow-y-auto pr-2">
        {submission && <SubmissionStatusAlert submission={submission} />}
        
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-green-500/10 border border-green-500 text-green-500 rounded-lg flex items-start gap-3"
          >
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>{editingVideo ? 'Vidéo mise à jour' : 'Vidéo créée'}</div>
          </motion.div>
        )}

        <form className="space-y-6">
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
                  placeholder="Titre de la vidéo"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Description de la vidéo..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg bg-muted text-foreground placeholder-muted-foreground border border-border focus:outline-none focus:ring-2 focus:ring-amber-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Catégorie *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg bg-muted text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-amber-900"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Durée (secondes)</label>
                  <Input
                    type="number"
                    name="duration"
                    value={formData.duration || ''}
                    onChange={handleChange}
                    placeholder="300"
                    min="0"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="published"
                  name="published"
                  checked={formData.published}
                  onChange={handleChange}
                  className="rounded border-border"
                />
                <label htmlFor="published" className="text-sm font-medium">
                  Publié
                </label>
              </div>
            </div>
          )}

          {/* TAB: MEDIA */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-4">Miniature</label>
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleThumbnailUpload(e.target.files[0]);
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
                    {loading ? 'Téléversement...' : 'Téléverser une miniature'}
                  </Button>

                  {formData.thumbnail_url && (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
                      <img
                        src={formData.thumbnail_url}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-6">
                <label className="block text-sm font-medium mb-4">Vidéo locale</label>
                <div className="space-y-3">
                  <input
                    key={`video-input-${Date.now()}`}
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onInput={(e: React.FormEvent<HTMLInputElement>) => {
                      const target = e.currentTarget as HTMLInputElement;
                      console.log('📹 onInput triggered:', { 
                        filesCount: target.files?.length,
                        fileName: target.files?.[0]?.name,
                        fileSize: target.files?.[0]?.size
                      });
                      if (target.files?.[0]) {
                        console.log('📹 File selected, calling handleVideoUpload');
                        handleVideoUpload(target.files[0]);
                        target.value = '';
                      }
                    }}
                    onChange={(e) => {
                      console.log('📹 onChange triggered:', { 
                        filesCount: e.target.files?.length,
                        fileName: e.target.files?.[0]?.name,
                        fileSize: e.target.files?.[0]?.size
                      });
                      if (e.target.files?.[0]) {
                        console.log('📹 File selected, calling handleVideoUpload');
                        handleVideoUpload(e.target.files[0]);
                        e.target.value = '';
                      }
                    }}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      console.log('📹 Button clicked, opening file picker');
                      videoInputRef.current?.click();
                    }}
                    disabled={loading}
                    className="w-full"
                    variant="outline"
                  >
                    <VideoIcon className="w-4 h-4 mr-2" />
                    {loading ? 'Téléversement vidéo...' : 'Téléverser une vidéo locale'}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Formats supportés: MP4, WebM, OGV (max 500MB)
                  </p>

                  {formData.video_storage_path && (
                    <div className="p-3 bg-green-500/10 border border-green-500 rounded-lg flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600 flex-1 truncate">
                        Vidéo uploadée: {formData.video_storage_path.split('/').pop()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-6">
                <label className="block text-sm font-medium mb-2">OU URL externe de la vidéo</label>
                <Input
                  type="url"
                  name="video_url"
                  value={formData.video_url}
                  onChange={(e) => handleVideoUrlChange(e.target.value)}
                  placeholder="https://youtube.com/... ou https://vimeo.com/..."
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Lien vers la vidéo (YouTube, Vimeo, etc.) - optionnel si vidéo locale uploadée
                </p>
              </div>
            </div>
          )}

          {/* TAB: PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Aperçu de la vidéo</h3>
                <div className="bg-muted rounded-lg p-4 space-y-3">
                  <div className="font-semibold text-lg">{formData.title || '(Sans titre)'}</div>
                  <p className="text-sm text-muted-foreground">
                    {formData.description || '(Sans description)'}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="bg-amber-900/20 text-amber-900 px-2 py-1 rounded">
                      {CATEGORIES.find((c) => c.value === formData.category)?.label}
                    </span>
                    {formData.duration && (
                      <span className="text-muted-foreground">
                        Durée: {Math.floor(formData.duration / 60)}m {formData.duration % 60}s
                      </span>
                    )}
                    <span className={formData.published ? 'text-green-500' : 'text-amber-500'}>
                      {formData.published ? '✓ Publié' : '⊘ Brouillon'}
                    </span>
                  </div>
                </div>

                {formData.thumbnail_url && (
                  <div className="mt-6">
                    <p className="text-sm font-medium mb-3">Miniature</p>
                    <img
                      src={formData.thumbnail_url}
                      alt="Thumbnail"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}

                {formData.video_url && (
                  <div className="mt-6">
                    <p className="text-sm font-medium mb-3">Lien vidéo</p>
                    <a
                      href={formData.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-900 hover:underline text-sm break-all"
                    >
                      {formData.video_url}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-between items-center pt-4 border-t border-border mt-6">
        <div>
          {editingVideo && onDelete && (
            <Button
              onClick={handleDelete}
              disabled={loading || isLoading}
              variant="destructive"
            >
              Supprimer
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button onClick={onClose} variant="outline" disabled={loading || isLoading}>
            Fermer
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || isLoading}
            className="gap-2 bg-amber-900 hover:bg-amber-800"
          >
            <Plus className="w-4 h-4" />
            {editingVideo ? 'Mettre à jour' : 'Ajouter la vidéo'}
          </Button>
        </div>
      </div>
    </UnifiedFormModal>
    {DialogComponent}
    </>
  );
};

export default VideoModalForm;
