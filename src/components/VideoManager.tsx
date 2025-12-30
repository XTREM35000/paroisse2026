import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface VideoManagerProps {
  onSubmit: (data: VideoFormData) => Promise<void>;
  isLoading?: boolean;
  categories: Array<{ id: string; label: string; value: string }>;
}

export interface VideoFormData {
  title: string;
  description: string;
  category: string;
  duration: number;
  thumbnail_url: string;
  videoFile?: File;
}

const VideoManager: React.FC<VideoManagerProps> = ({
  onSubmit,
  isLoading = false,
  categories,
}) => {
  const [formData, setFormData] = useState<VideoFormData>({
    title: '',
    description: '',
    category: categories[0]?.value || '',
    duration: 0,
    thumbnail_url: '',
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        handleImagePreview(file);
      } else {
        setError('Veuillez déposer une image valide');
      }
    }
  };

  const handleImagePreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewImage(result);
      setFormData({ ...formData, thumbnail_url: result });
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImagePreview(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError('Le titre est obligatoire');
      return;
    }

    if (!formData.category) {
      setError('La catégorie est obligatoire');
      return;
    }

    if (!formData.thumbnail_url) {
      setError('Une vignette est obligatoire');
      return;
    }

    try {
      await onSubmit(formData);
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: categories[0]?.value || '',
        duration: 0,
        thumbnail_url: '',
      });
      setPreviewImage(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Image Upload Section */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Vignette de la vidéo *</Label>
        <motion.div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          animate={{ scale: dragActive ? 1.02 : 1 }}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
        >
          {previewImage ? (
            <div className="relative inline-block">
              <img
                src={previewImage}
                alt="Preview"
                className="h-40 w-40 object-cover rounded-lg"
              />
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="absolute -top-2 -right-2 rounded-full h-8 w-8 p-0"
                onClick={() => {
                  setPreviewImage(null);
                  setFormData({ ...formData, thumbnail_url: '' });
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="py-8">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">
                Déposez l'image ici ou cliquez pour sélectionner
              </p>
              <p className="text-xs text-muted-foreground">PNG, JPG, GIF - max 5MB</p>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            aria-hidden="true"
          />
        </motion.div>
      </div>

      {/* Title */}
      <div>
        <Label htmlFor="title" className="text-sm font-medium">
          Titre *
        </Label>
        <Input
          id="title"
          placeholder="Titre de la vidéo"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="mt-2"
        />
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description" className="text-sm font-medium">
          Description
        </Label>
        <Input
          id="description"
          placeholder="Description brève de la vidéo"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="mt-2"
        />
      </div>

      {/* Category */}
      <div>
        <Label htmlFor="category" className="text-sm font-medium">
          Catégorie *
        </Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
        >
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories
              .filter((cat) => cat.value !== 'all')
              .map((cat) => (
                <SelectItem key={cat.id} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Duration */}
      <div>
        <Label htmlFor="duration" className="text-sm font-medium">
          Durée (secondes)
        </Label>
        <Input
          id="duration"
          type="number"
          placeholder="0"
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
          className="mt-2"
          min="0"
        />
      </div>

      {/* Submit Button */}
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Ajout en cours...' : 'Ajouter la vidéo'}
      </Button>
    </form>
  );
};

export default VideoManager;
