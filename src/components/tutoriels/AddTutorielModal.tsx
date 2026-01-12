import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/contexts/ToastContext';
import { X } from 'lucide-react';
import type { TutorielVideo } from '@/pages/AdminTutorielsPage/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (t: TutorielVideo) => void;
}

interface SupabaseResponse<T> {
  data: T | null;
  error: { message: string } | null;
}

export default function AddTutorielModal({ isOpen, onClose, onCreated }: Props) {
  const { show: showToast } = useToast();
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const modalRef = React.useRef<HTMLDivElement | null>(null);
  const draggingRef = React.useRef(false);
  const offsetRef = React.useRef({ x: 0, y: 0 });
  const [pos, setPos] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });

  // Center modal on open
  React.useEffect(() => {
    if (isOpen && modalRef.current) {
      // Use requestAnimationFrame to ensure DOM is ready
      const frame = requestAnimationFrame(() => {
        const modal = modalRef.current;
        if (modal) {
          const centerX = Math.max(8, (window.innerWidth - modal.offsetWidth) / 2);
          const centerY = Math.max(8, (window.innerHeight - modal.offsetHeight) / 2);
          setPos({ x: centerX, y: centerY });
        }
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [isOpen]);

  React.useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!draggingRef.current) return;
      const clientX = e.clientX;
      const clientY = e.clientY;
      const nx = clientX - offsetRef.current.x;
      const ny = clientY - offsetRef.current.y;
      const modal = modalRef.current;
      if (!modal) return;
      const maxX = window.innerWidth - modal.offsetWidth - 16;
      const maxY = window.innerHeight - modal.offsetHeight - 16;
      setPos({ x: Math.max(8, Math.min(nx, maxX)), y: Math.max(8, Math.min(ny, maxY)) });
    }
    function onUp() {
      draggingRef.current = false;
      document.body.style.userSelect = '';
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  React.useEffect(() => {
    function onTouchMove(e: TouchEvent) {
      if (!draggingRef.current) return;
      const t = e.touches[0];
      const nx = t.clientX - offsetRef.current.x;
      const ny = t.clientY - offsetRef.current.y;
      const modal = modalRef.current;
      if (!modal) return;
      const maxX = window.innerWidth - modal.offsetWidth - 16;
      const maxY = window.innerHeight - modal.offsetHeight - 16;
      setPos({ x: Math.max(8, Math.min(nx, maxX)), y: Math.max(8, Math.min(ny, maxY)) });
    }
    function onTouchEnd() {
      draggingRef.current = false;
      document.body.style.userSelect = '';
    }
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  if (!isOpen) return null;

  function startDrag(clientX: number, clientY: number) {
    const modal = modalRef.current;
    if (!modal) return;
    if (pos.x === null || pos.y === null) {
      // center initially
      const startX = Math.max(8, (window.innerWidth - modal.offsetWidth) / 2);
      const startY = Math.max(8, (window.innerHeight - modal.offsetHeight) / 2);
      setPos({ x: startX, y: startY });
      offsetRef.current.x = clientX - startX;
      offsetRef.current.y = clientY - startY;
    } else {
      offsetRef.current.x = clientX - (pos.x || 0);
      offsetRef.current.y = clientY - (pos.y || 0);
    }
    draggingRef.current = true;
    document.body.style.userSelect = 'none';
  }

  function onMouseDownHeader(e: React.MouseEvent) {
    startDrag(e.clientX, e.clientY);
  }
  function onTouchStartHeader(e: React.TouchEvent) {
    const t = e.touches[0];
    startDrag(t.clientX, t.clientY);
  }

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
    const youtubeId = extractYouTubeId(youtubeUrl.trim());
    if (!youtubeId) {
      showToast('Veuillez fournir un lien YouTube valide.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      let thumbnailUrl: string | null = null;
      if (file) {
        const fileName = `${Date.now()}-${file.name}`;
        const bucket = import.meta.env.VITE_BUCKET_PUBLIC || 'public';
        const upRes = await (supabase.storage.from(bucket).upload(fileName, file, { cacheControl: '3600', upsert: false }) as Promise<SupabaseResponse<{ path: string }>>);
        if (upRes.error) throw upRes.error;
        const urlRes = supabase.storage.from(bucket).getPublicUrl(fileName) as { data: { publicUrl: string } };
        thumbnailUrl = urlRes?.data?.publicUrl || null;
      }

      const payload = {
        title: title || `Tutoriel ${youtubeId}`,
        youtube_id: youtubeId,
        description: description || '',
        thumbnail_url: thumbnailUrl,
        category: 'videos',
        difficulty: 'débutant',
        created_at: new Date().toISOString(),
      };

      const res = await (supabase.from('tutoriels' as any).insert([payload]).select() as any as Promise<SupabaseResponse<Array<{ id?: string | number; title?: string; description?: string; youtube_id?: string; duration?: string; category?: string; difficulty?: string; steps?: string[]; related_pages?: string[] }>>>); // eslint-disable-line @typescript-eslint/no-explicit-any
      const data = res.data;
      const error = res.error;
      if (error) throw error;
      if (Array.isArray(data) && data.length > 0) {
        const row = (data[0] as Record<string, unknown>) as { id?: string | number; title?: string; description?: string; youtube_id?: string; duration?: string; category?: string; difficulty?: string; steps?: string[]; related_pages?: string[] };
        const created: TutorielVideo = {
          id: String(row.id),
          title: row.title || `Tutoriel ${row.youtube_id || ''}`,
          description: row.description || '',
          youtubeId: String(row.youtube_id || ''),
          duration: row.duration || '00:00',
          category: (String(row.category) as 'videos' | 'images' | 'pages' | 'users' | 'configuration') || 'videos',
          difficulty: (String(row.difficulty) as 'débutant' | 'intermédiaire' | 'avancé') || 'débutant',
          steps: row.steps || [],
          relatedPages: row.related_pages || [],
        };
        onCreated(created);
        // reset
        setYoutubeUrl('');
        setTitle('');
        setDescription('');
        setFile(null);
        onClose();
        showToast('Vidéo ajoutée avec succès', 'success');
      }
    } catch (e) {
      console.error('[AddTutorielModal] submit error', e);
      showToast('Erreur lors de l\'ajout du tutoriel. Voir console.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const modalStyle: React.CSSProperties = pos.x !== null && pos.y !== null 
    ? { left: pos.x + 'px', top: pos.y + 'px', position: 'fixed' } 
    : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)', position: 'fixed' };

  return (
    <div className="fixed inset-0 z-60 bg-black/40 pointer-events-none" aria-modal="true" role="dialog">
      <div
        ref={modalRef}
        style={modalStyle}
        className="w-full max-w-2xl bg-card border border-border rounded-lg shadow-lg pointer-events-auto z-70"
      >
        <div
          onMouseDown={onMouseDownHeader}
          onTouchStart={onTouchStartHeader}
          className="cursor-grab select-none flex items-center justify-between p-3 border-b border-border bg-gradient-to-r from-background/30 to-background/10 rounded-t-lg"
        >
          <h3 className="text-lg font-semibold text-foreground">Ajouter une vidéo</h3>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-muted-foreground px-2 py-1 rounded hover:bg-muted/10">
              <X />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4 text-foreground">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Lien YouTube</label>
            <input
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Titre</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground"
              placeholder="Titre du tutoriel"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground"
              rows={3}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Miniature (optionnel)</label>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} className="mt-1" />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button onClick={onClose} className="px-4 py-2 bg-muted/10 rounded-md">Annuler</button>
            <button onClick={handleSubmit} disabled={isSaving} className="px-4 py-2 bg-emerald-600 text-white rounded-md">{isSaving ? 'Enregistrement...' : 'Ajouter la vidéo'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
