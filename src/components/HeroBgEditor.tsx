import React, { useState, useEffect } from 'react';
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

  const handleFile = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = bucket 
        ? await uploadDirectoryImage(file, bucket)
        : await uploadFile(file);
      if (res?.publicUrl) {
        setValue(res.publicUrl);
      } else {
        // fallback: create object URL
        setValue(URL.createObjectURL(file));
      }
    } catch (e) {
      console.error('Upload failed', e);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="absolute top-3 right-3 z-40">
      <Button size="icon" onClick={() => setOpen(true)} title="Modifier l'image de fond" className="bg-black/40 hover:bg-black/60">
        <Edit3 className="w-4 h-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'image de fond</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            <label className="text-sm text-muted-foreground">URL de l'image</label>
            <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="https://.../image.jpg" />

            <div className="flex items-center gap-3 mt-2">
              <div className="w-28 h-16 bg-muted rounded overflow-hidden flex items-center justify-center">
                {value ? <img src={value} alt="Preview" className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-muted-foreground" />}
              </div>
              <div className="flex-1 text-sm text-muted-foreground">Collez une URL publique ou téléversez une image depuis votre ordinateur.</div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-muted rounded text-sm">
                <Upload className="w-4 h-4" /> Sélectionner un fichier
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
              </label>
              {uploading && <span className="text-sm text-muted-foreground">Téléversement...</span>}
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
