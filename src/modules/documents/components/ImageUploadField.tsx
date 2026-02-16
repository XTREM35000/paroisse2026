/**
 * Composant réutilisable pour upload d'images
 * Supporte URL ou upload fichier avec toggle
 */
import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, X, Eye } from 'lucide-react';
import { uploadFile } from '@/lib/supabase/storage';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadFieldProps {
  label: string;
  value: string | null | undefined;
  onChange: (url: string) => void;
  placeholder?: string;
  imageId?: string;
  folder?: string;
  maxSizeMb?: number;
}

export default function ImageUploadField({
  label,
  value,
  onChange,
  placeholder = 'https://...',
  imageId = 'image',
  folder = 'documents',
  maxSizeMb = 5,
}: ImageUploadFieldProps) {
  const [inputMode, setInputMode] = useState<'url' | 'upload'>('url');
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);

      // Vérifier la taille
      if (file.size > maxSizeMb * 1024 * 1024) {
        toast({
          title: 'Erreur',
          description: `La taille du fichier ne doit pas dépasser ${maxSizeMb}MB`,
          variant: 'destructive',
        });
        return;
      }

      // Upload via helper
      const uploaded = await uploadFile(file, `${folder}/${Date.now()}_${file.name}`);
      if (!uploaded?.publicUrl) {
        throw new Error('Échec de l\'upload');
      }

      onChange(uploaded.publicUrl);
      toast({ title: 'Succès', description: 'Image téléversée' });
      setInputMode('url');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du téléversement';
      toast({ title: 'Erreur', description: msg, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-900">{label}</label>

      {/* Toggle buttons */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setInputMode('url')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            inputMode === 'url'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground hover:bg-muted/80'
          }`}
          type="button"
        >
          Lien direct
        </button>
        <button
          onClick={() => setInputMode('upload')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            inputMode === 'upload'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground hover:bg-muted/80'
          }`}
          type="button"
        >
          Téléverser
        </button>
        {value && (
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-3 py-1.5 text-sm rounded-md bg-muted text-foreground hover:bg-muted/80 transition-colors flex items-center gap-1"
            type="button"
          >
            <Eye className="h-4 w-4" />
            Aperçu
          </button>
        )}
      </div>

      {/* URL mode */}
      {inputMode === 'url' && (
        <div className="flex gap-2">
          <Input
            id={`${imageId}_url`}
            type="url"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-white text-black border border-gray-300"
          />
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onChange('')}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Upload mode */}
      {inputMode === 'upload' && (
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
              e.target.value = '';
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Téléversement...' : 'Sélectionner un fichier'}
          </Button>
        </div>
      )}

      {/* Preview */}
      {showPreview && value && (
        <div className="mt-2 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-2">Aperçu :</p>
          <img
            src={value}
            alt="Preview"
            className="max-h-32 rounded-md object-cover"
          />
        </div>
      )}

      {/* Help text */}
      <p className="text-xs text-muted-foreground">
        PNG, JPG, GIF - Max {maxSizeMb}MB
      </p>
    </div>
  );
}
