import React, { useState, useEffect, useRef } from 'react';
import { Edit3, Image as ImageIcon, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { uploadFile } from '@/lib/supabase/storage';
import { uploadDirectoryImage } from '@/lib/supabase/storage';

interface Props {
  current?: string | undefined;
  onSave: (url: string) => Promise<void> | void;
  bucket?: string; // Optionnel, défaut: 'gallery'
}

const HeroBgEditor: React.FC<Props> = ({ current, onSave, bucket }) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(current || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Synchroniser le state avec les changements de 'current' (pour les navigations)
  useEffect(() => {
    setValue(current || '');
  }, [current]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(value);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    console.log('[HeroBgEditor] handleFile start', { name: file.name, size: file.size, type: file.type, bucket });
    try {
      const res = bucket 
        ? await uploadDirectoryImage(file, bucket)
        : await uploadFile(file);
      console.log('[HeroBgEditor] upload result', res);
      if (res?.publicUrl) {
        setValue(res.publicUrl);
      } else {
        // fallback: create object URL
        const obj = URL.createObjectURL(file);
        setValue(obj);
        setUploadError('Téléversement échoué — affichage local seulement. Réessayez pour publier l\'image.');
      }
    } catch (e) {
      console.error('Upload failed', e);
      const obj = URL.createObjectURL(file);
      setValue(obj);
      setUploadError('Téléversement échoué — affichage local seulement. Réessayez pour publier l\'image.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="absolute top-3 right-3 z-40">
      <Button size="icon" onClick={() => setOpen(true)} title="Modifier l'image de fond" className="bg-primary hover:bg-primary/90 text-primary-foreground">
        <Edit3 className="w-4 h-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent aria-describedby="hero-bg-desc">
          <DialogHeader>
            <DialogTitle>Modifier l'image de fond</DialogTitle>
          </DialogHeader>

            <div className="space-y-3 mt-2" id="hero-bg-desc">
            <label className="text-sm text-muted-foreground">URL de l'image</label>
            <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="https://.../image.jpg" />

            <div className="flex items-center gap-3 mt-2">
              <div className="w-28 h-16 bg-muted rounded overflow-hidden flex items-center justify-center">
                {value ? <img src={value} alt="Preview" className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-muted-foreground" />}
              </div>
              <div className="flex-1 text-sm text-muted-foreground">Collez une URL publique ou téléversez une image depuis votre ordinateur.</div>
            </div>

            {uploadError && <div className="text-sm text-destructive mt-2">{uploadError}</div>}

            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="default"
                size="sm"
                className="gap-2"
                disabled={uploading}
                onClick={() => {
                  console.log('[HeroBgEditor] open file selector');
                  fileInputRef.current?.click();
                }}
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'Téléversement...' : 'Sélectionner une image'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  console.log('[HeroBgEditor] file input changed', { fileName: f?.name, size: f?.size });
                  handleFile(f);
                }}
              />
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={handleSave} disabled={saving || !value || uploading}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HeroBgEditor;
