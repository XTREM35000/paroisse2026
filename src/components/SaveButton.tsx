import React, { useEffect, useState } from 'react';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SaveButtonProps {
  itemId?: string | null;
  isSaved?: boolean;
  onSave?: () => void | Promise<void>;
  onRemove?: () => void | Promise<void>;
  label?: string;
  className?: string;
  isRecording?: boolean;
}

const storageKeyFor = (id?: string | null) => (id ? `saved:${id}` : null);

const SaveButton: React.FC<SaveButtonProps> = ({ itemId, isSaved, onSave, onRemove, label, className, isRecording }) => {
  const [saved, setSaved] = useState<boolean>(Boolean(isSaved));

  useEffect(() => {
    if (typeof isSaved !== 'undefined') {
      setSaved(Boolean(isSaved));
      return;
    }
    const key = storageKeyFor(itemId);
    if (!key) return;
    try {
      const raw = localStorage.getItem(key);
      setSaved(Boolean(raw));
    } catch {
      // ignore
    }
  }, [itemId, isSaved]);

  const toggle = async () => {
    if (!saved) {
      try {
        if (onSave) await onSave();
        const key = storageKeyFor(itemId);
        if (key) localStorage.setItem(key, '1');
        setSaved(true);
      } catch (e) {
        console.warn('Save failed', e);
      }
    } else {
      try {
        if (onRemove) await onRemove();
        const key = storageKeyFor(itemId);
        if (key) localStorage.removeItem(key);
        setSaved(false);
      } catch (e) {
        console.warn('Remove failed', e);
      }
    }
  };

  return (
    <Button
      onClick={toggle}
      aria-pressed={saved}
      aria-label={saved ? 'Retirer des favoris' : (label ?? 'Ajouter aux favoris')}
      size="sm"
      variant={saved ? 'default' : 'outline'}
      className={className}
    >
      <Bookmark className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} />
      <span className="ml-2 text-2xl">{isRecording ? '⏺' : '⏸'}</span>
    </Button>
  );
};

export default SaveButton;
