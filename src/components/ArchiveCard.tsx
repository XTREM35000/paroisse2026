import React, { useState } from 'react';
import { Download, File as FileIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import useFileManager from '@/hooks/useFileManager';
import useArchives from '@/hooks/useArchives';

interface Archive {
  id: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  description?: string;
  uploaded_by?: string;
  created_at?: string;
  media_type?: string;
}

const ArchiveCard: React.FC<{ archive: Archive; onDownloaded?: () => void }> = ({ archive, onDownloaded }) => {
  const { toast } = useToast();
  const { isAdmin } = useRoleCheck();
  const { downloadArchive } = useFileManager();
  const { useRemove } = useArchives();
  const removeMutation = useRemove();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDownload = async () => {
    try {
      await downloadArchive(archive.id);
      toast({ title: 'Téléchargement lancé', description: 'L’archive va être téléchargée.' });
      onDownloaded?.();
    } catch (err) {
      console.error('downloadArchive error', err);
      toast({ title: 'Erreur', description: 'Impossible de télécharger l’archive', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!isAdmin) return;
    if (!confirm('Confirmer la suppression de l\'archive ? Cette action supprimera le fichier et la métadonnée.')) return;
    try {
      setIsDeleting(true);
      await removeMutation.mutateAsync(archive.id);
      toast({ title: 'Archive supprimée', description: `${archive.file_name} a été supprimée` });
    } catch (err) {
      console.error('remove archive', err);
      toast({ title: 'Erreur', description: 'Impossible de supprimer l\'archive', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-md bg-muted-foreground/10"><FileIcon className="w-6 h-6" /></div>
        <div>
          <div className="font-medium truncate">{archive.file_name}</div>
          <div className="text-xs text-muted-foreground">{archive.media_type} • {archive.file_size ? `${(archive.file_size / (1024*1024)).toFixed(1)} MB` : '—'}</div>
          {archive.created_at && <div className="text-xs text-muted-foreground">Mis en ligne {formatDistanceToNow(new Date(archive.created_at))}</div>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleDownload} className="bg-primary">
          <Download className="w-4 h-4 mr-2" />
          📥 Télécharger
        </Button>
        {isAdmin && (
          <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </Button>
        )}
      </div>
    </div>
  );
};

export default ArchiveCard;
