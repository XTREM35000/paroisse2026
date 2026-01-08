import React, { useState } from 'react';
import type { PublicAd } from '@/types/advertisements';
import { Button } from './ui/button';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface Props { ad: PublicAd; onOpen?: (ad: PublicAd) => void; onDelete?: (id: string) => void }

export default function AdvertisementCard({ ad, onOpen, onDelete }: Props) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = async () => {
    setIsDeleting(true);
    try {
      await onDelete?.(ad.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <article className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
      <div className="w-full h-56 bg-gray-100 overflow-hidden">
        <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg">{ad.title}</h3>
        {ad.subtitle && <p className="text-sm text-muted-foreground">{ad.subtitle}</p>}
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {ad.start_date && <div>Du {format(new Date(ad.start_date), 'dd/MM/yyyy')}</div>}
            {ad.end_date && <div>Au {format(new Date(ad.end_date), 'dd/MM/yyyy')}</div>}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onOpen?.(ad)}>
              Voir
            </Button>
            {onDelete && (
              <Button size="sm" variant="ghost" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>

    <DeleteConfirmDialog
      open={showDeleteConfirm}
      title="Supprimer cette affiche ?"
      description="Cette affiche sera supprimée définitivement. Cette action ne peut pas être annulée."
      onConfirm={handleDeleteClick}
      onCancel={() => setShowDeleteConfirm(false)}
      isLoading={isDeleting}
    />
    </>
  );
}
