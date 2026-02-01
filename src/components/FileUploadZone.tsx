import React, { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useFileManager from '@/hooks/useFileManager';
import { useToast } from '@/hooks/use-toast';

interface FileUploadZoneProps {
  mediaType: 'videos' | 'images' | 'documents';
  onUploaded?: () => void;
}

const MAX_SIZE_BYTES = 500 * 1024 * 1024; // 500MB

const FileUploadZone: React.FC<FileUploadZoneProps> = ({ mediaType, onUploaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const { uploadZip, isUploading, extractZipInfo, validateZipStructure } = useFileManager();
  const { toast } = useToast();

  const validateFile = (file: File) => {
    const name = file.name.toLowerCase();
    if (!name.endsWith('.zip') && !name.endsWith('.rar')) {
      toast({ title: 'Type de fichier invalide', description: 'Seuls les fichiers .zip et .rar sont autorisés', variant: 'destructive' });
      return false;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast({ title: 'Fichier trop volumineux', description: 'La taille maximale est de 500MB', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!validateFile(file)) return;

    // If it's a .zip, try to inspect structure (non-blocking if JSZip not present)
    if (file.name.toLowerCase().endsWith('.zip')) {
      try {
        const structure = await extractZipInfo(file);
        const ok = validateZipStructure(structure);
        if (!ok) {
          toast({ title: 'Structure invalide', description: 'L’archive ne respecte pas la structure attendue.', variant: 'destructive' });
          return;
        }
      } catch (e) {
        console.warn('Zip inspection failed or not available', e);
      }
    }

    try {
      const res = await uploadZip(file, mediaType);
      if (res && res.success) {
        toast({ title: 'Téléversement réussi', description: `${file.name} a été téléversé` });
        onUploaded?.();
      }
    } catch (err) {
      console.error('Upload error', err);
      toast({ title: 'Erreur', description: 'Impossible de téléverser l’archive', variant: 'destructive' });
    }
  }, [uploadZip, mediaType, onUploaded, toast]);

  const handleDrop = useCallback(async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (!file) return;
    if (!validateFile(file)) return;

    // If it's a .zip, try to inspect structure (non-blocking if JSZip not present)
    if (file.name.toLowerCase().endsWith('.zip')) {
      try {
        const structure = await extractZipInfo(file);
        const ok = validateZipStructure(structure);
        if (!ok) {
          toast({ title: 'Structure invalide', description: 'L’archive ne respecte pas la structure attendue.', variant: 'destructive' });
          return;
        }
      } catch (e) {
        console.warn('Zip inspection failed or not available', e);
      }
    }

    try {
      const res = await uploadZip(file, mediaType);
      if (res && res.success) {
        toast({ title: 'Téléversement réussi', description: `${file.name} a été téléversé` });
        onUploaded?.();
      }
    } catch (err) {
      console.error('Upload error', err);
      toast({ title: 'Erreur', description: 'Impossible de téléverser l’archive', variant: 'destructive' });
    }
  }, [uploadZip, mediaType, onUploaded, toast]);

  return (
    <div className="mb-8 p-6 border-2 border-dashed rounded-lg bg-muted/30">
      <div
        className={`text-center p-8 rounded border-2 ${isDragging ? 'border-primary bg-primary/10' : 'border-transparent'}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="mb-2">
          <strong>Glissez-déposez une archive (.zip ou .rar) ici</strong>
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Taille max : 500MB • Structure : <code>Paroisse/{mediaType}/...</code>
        </p>
        <Button asChild disabled={isUploading}>
          <label className="cursor-pointer">
            <input type="file" accept=".zip,.rar" className="hidden" onChange={handleFileSelect} disabled={isUploading} />
            {isUploading ? 'Téléversement en cours...' : 'Parcourir les fichiers'}
          </label>
        </Button>
      </div>
    </div>
  );
};

export default FileUploadZone;
