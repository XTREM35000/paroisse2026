import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/contexts/ToastContext';
import { X } from 'lucide-react';
import type { TutorielVideo } from '@/pages/AdminTutorielsPage/types';

interface EditTutorielModalProps {
  isOpen: boolean;
  tutoriel: TutorielVideo | null;
  onClose: () => void;
  onUpdated: (t: TutorielVideo) => void;
}

interface SupabaseResponse<T> {
  data: T | null;
  error: { message: string } | null;
}

export default function EditTutorielModal({ isOpen, tutoriel, onClose, onUpdated }: EditTutorielModalProps) {
  const { show: showToast } = useToast();
  const [title, setTitle] = useState(tutoriel?.title || '');
  const [description, setDescription] = useState(tutoriel?.description || '');
  const [youtubeUrl, setYoutubeUrl] = useState(tutoriel?.youtubeId || '');
  const [isSaving, setIsSaving] = useState(false);

  // Draggable modal state
  const modalRef = React.useRef<HTMLDivElement | null>(null);
  const draggingRef = React.useRef(false);
  const offsetRef = React.useRef({ x: 0, y: 0 });
  const [pos, setPos] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('textarea')) return;
    
    draggingRef.current = true;
    const modal = modalRef.current;
    if (!modal) return;

    const rect = modal.getBoundingClientRect();
    offsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggingRef.current || !modalRef.current) return;

    const x = e.clientX - offsetRef.current.x;
    const y = e.clientY - offsetRef.current.y;

    // Constrain to viewport
    const maxX = window.innerWidth - 300;
    const maxY = window.innerHeight - 200;
    setPos({
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY)),
    });
  };

  const handleMouseUp = () => {
    draggingRef.current = false;
  };

  React.useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isOpen]);

  React.useEffect(() => {
    if (tutoriel) {
      setTitle(tutoriel.title);
      setDescription(tutoriel.description);
      setYoutubeUrl(tutoriel.youtubeId);
    }
  }, [tutoriel, isOpen]);

  function extractYouTubeId(input?: string) {
    if (!input) return '';
    try {
      const url = new URL(input);
      const host = url.hostname.replace('www.', '');
      if (host.includes('youtube.com')) {
        if (url.pathname.includes('/embed/')) return url.pathname.split('/embed/')[1].split('/')[0];
        return url.searchParams.get('v') || '';
      }
      if (host === 'youtu.be') return url.pathname.replace('/', '');
    } catch (e) {
      // regex fallback
    }
    const m = input.match(/(?:v=|v\/|embed\/|youtu\.be\/|watch\?v=)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : input;
  }

  const handleSubmit = async () => {
    if (!tutoriel) return;
    setIsSaving(true);
    try {
      const youtubeId = youtubeUrl ? extractYouTubeId(youtubeUrl) : tutoriel.youtubeId;
      const updatePayload = {
        title: title || tutoriel.title,
        description: description || '',
        youtube_id: youtubeId || tutoriel.youtubeId,
      };

      // If the youtube id changed, ensure no other row already uses it
      if (youtubeId && youtubeId !== tutoriel.youtubeId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dup = await (supabase.from('tutoriels' as any).select('id').eq('youtube_id', youtubeId) as any);
        if (dup && dup.data && Array.isArray(dup.data) && dup.data.length > 0) {
          showToast('Un tutoriel existe déjà avec ce lien YouTube.', 'error');
          setIsSaving(false);
          return;
        }
      }

      const res = await (supabase
        .from('tutoriels' as any) // eslint-disable-line @typescript-eslint/no-explicit-any
        .update(updatePayload)
        .eq('id', tutoriel.id)
        .select() as any as Promise<SupabaseResponse<Array<{ id?: string | number; title?: string; description?: string; youtube_id?: string; duration?: string; category?: string; difficulty?: string; steps?: string[]; related_pages?: string[] }>>>); // eslint-disable-line @typescript-eslint/no-explicit-any

      const data = res.data;
      const error = res.error;
      if (error) throw error;

      if (Array.isArray(data) && data.length > 0) {
        const row = (data[0] as Record<string, unknown>) as {
          id?: string | number;
          title?: string;
          description?: string;
          youtube_id?: string;
          duration?: string;
          category?: string;
          difficulty?: string;
          steps?: string[];
          related_pages?: string[];
        };
        const validCategory = ['videos', 'images', 'pages', 'users', 'configuration'].includes(String(row.category))
          ? (String(row.category) as 'videos' | 'images' | 'pages' | 'users' | 'configuration')
          : 'videos';
        const validDifficulty = ['débutant', 'intermédiaire', 'avancé'].includes(String(row.difficulty))
          ? (String(row.difficulty) as 'débutant' | 'intermédiaire' | 'avancé')
          : 'débutant';

        const updated: TutorielVideo = {
          id: tutoriel.id,
          title: row.title || tutoriel.title,
          description: row.description || '',
          youtubeId: String(row.youtube_id || tutoriel.youtubeId),
          duration: row.duration || tutoriel.duration,
          category: validCategory,
          difficulty: validDifficulty,
          steps: row.steps || [],
          relatedPages: row.related_pages || [],
        };
        onUpdated(updated);
        onClose();
        showToast('Tutoriel mis à jour avec succès', 'success');
      }
    } catch (e: unknown) {
      console.error('[EditTutorielModal] error', e);
      // Handle unique constraint on youtube_id
      const error = e as { code?: string; message?: string };
      if (error && (error.code === '23505' || error.message?.includes('duplicate key value'))) {
        showToast('Ce lien YouTube est déjà utilisé par un autre tutoriel.', 'error');
      } else {
        showToast('Erreur lors de la mise à jour. Voir console.', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !tutoriel) return null;

  const modalStyle: React.CSSProperties = pos.x !== null && pos.y !== null ? { left: pos.x + 'px', top: pos.y + 'px', transform: 'none' } : { transform: 'translate(-50%, -50%)' };

  return (
    <div className="fixed inset-0 z-60 bg-black/40 p-4 flex items-center justify-center">
      <div 
        ref={modalRef}
        onMouseDown={handleMouseDown}
        style={modalStyle}
        className="w-full max-w-2xl bg-card border border-border rounded-lg shadow-lg fixed cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Éditer la vidéo</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Titre</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground"
              placeholder="Titre du tutoriel"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground"
              rows={3}
              placeholder="Description du tutoriel"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Lien YouTube</label>
            <input
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button onClick={onClose} className="px-4 py-2 bg-muted/10 rounded-md">
              Annuler
            </button>
            <button onClick={handleSubmit} disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-md">
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
