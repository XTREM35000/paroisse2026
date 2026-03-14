import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Clock, AlertCircle } from 'lucide-react';
import useContentApprovals from '@/hooks/useContentApprovals';
import useRoleCheck from '@/hooks/useRoleCheck';
import HeroBanner from '@/components/HeroBanner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { ContentType } from '@/types/database';

interface PendingContent {
  id: string;
  content_type: 'video' | 'gallery';
  title: string;
  description?: string;
  submitted_at: string;
  image_url?: string;
  thumbnail_url?: string;
  user_id: string;
}

export default function AdminContentApprovals() {
  const { isAdmin } = useRoleCheck();
  const { pendingItems, loading, error, approveContent, rejectContent } = useContentApprovals();
  
  const [selectedItem, setSelectedItem] = useState<PendingContent | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <HeroBanner
          title="Approbations"
          subtitle="Validez les contenus en attente de publication"
          showBackButton
        />
        <div className="flex-1 container mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-red-600 mb-4" />
            <h2 className="text-xl font-semibold text-red-900 mb-2">Accès refusé</h2>
            <p className="text-red-700">Seuls les administrateurs peuvent accéder à cette page.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleApprove = async (item: PendingContent) => {
    setIsProcessing(true);
    const result = await approveContent(item.content_type, item.id);
    if (result.success) {
      setSelectedItem(null);
    }
    setIsProcessing(false);
  };

  const handleReject = async () => {
    if (!selectedItem) return;
    setIsProcessing(true);
    const result = await rejectContent(selectedItem.content_type, selectedItem.id, rejectReason);
    if (result.success) {
      setSelectedItem(null);
      setShowRejectDialog(false);
      setRejectReason('');
    }
    setIsProcessing(false);
  };

  const formatTimeRemaining = (submittedAt: string) => {
    const now = new Date();
    const submitted = new Date(submittedAt);
    const expiresAt = new Date(submitted.getTime() + 24 * 60 * 60 * 1000);
    const diffMs = expiresAt.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffMs < 0) return 'Expiré';
    if (diffHours > 0) return `${diffHours}h ${diffMinutes}m restantes`;
    return `${diffMinutes}m restantes`;
  };

  const getContentTitle = (item: PendingContent): string => {
    return item.title || 'Contenu sans titre';
  };

  const getThumbnail = (item: PendingContent): string | undefined => {
    if (item.content_type === 'video') {
      return item.thumbnail_url;
    }
    if (item.content_type === 'gallery') {
      return item.thumbnail_url || item.image_url;
    }
    return undefined;
  };

  // Séparer les vidéos et images
  const pendingVideos = pendingItems.filter(item => item.content_type === 'video');
  const pendingImages = pendingItems.filter(item => item.content_type === 'gallery');

  const ContentGrid = ({ items, title, emptyMessage }: { items: PendingContent[]; title: string; emptyMessage: string }) => {
    if (items.length === 0) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <AlertCircle className="h-10 w-10 mx-auto text-blue-600 mb-3" />
          <h4 className="text-md font-semibold text-blue-900 mb-1">{emptyMessage}</h4>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
          >
            {/* Thumbnail */}
            {getThumbnail(item) && (
              <div className="relative aspect-video bg-muted overflow-hidden">
                <img
                  src={getThumbnail(item)}
                  alt={getContentTitle(item)}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">
                  {item.content_type === 'video' ? '🎬' : '🖼️'}
                </div>
              </div>
            )}

            {/* Content Info */}
            <div className="p-4">
              <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                {getContentTitle(item)}
              </h3>

              {item.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {item.description}
                </p>
              )}

              {/* Time Remaining */}
              <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-2 rounded mb-4">
                <Clock className="h-4 w-4" />
                <span>{formatTimeRemaining(item.submitted_at)}</span>
              </div>

              {/* User Info */}
              <p className="text-xs text-muted-foreground mb-4">
                Soumis le: {new Date(item.submitted_at).toLocaleString('fr-FR')}
              </p>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(item)}
                  disabled={isProcessing}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approuver
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setSelectedItem(item);
                    setShowRejectDialog(true);
                  }}
                  disabled={isProcessing}
                >
                  <X className="h-4 w-4 mr-1" />
                  Rejeter
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeroBanner
        title="Approbations"
        subtitle="Validez les contenus en attente d'approbation"
        showBackButton
      />
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Approbations de contenu</h1>
          <p className="text-muted-foreground">
            Gérez les vidéos et images en attente d'approbation. Les contenus rejetés sont supprimés immédiatement.
          </p>
        </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
          <p className="font-semibold">Erreur</p>
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-muted rounded-lg h-64 animate-pulse" />
          ))}
        </div>
      ) : pendingItems.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <Check className="h-12 w-12 mx-auto text-green-600 mb-4" />
          <h3 className="text-lg font-semibold text-green-900 mb-2">Aucun contenu en attente</h3>
          <p className="text-green-700">Tous les contenus ont été approuvés ou rejetés.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Section Vidéos */}
          <div>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-blue-200">
              <span className="text-2xl">🎬</span>
              <h2 className="text-2xl font-bold text-foreground">Vidéos en attente ({pendingVideos.length})</h2>
            </div>
            <ContentGrid
              items={pendingVideos}
              title="Vidéos"
              emptyMessage="Aucune vidéo en attente d'approbation"
            />
          </div>

          {/* Séparateur */}
          {pendingVideos.length > 0 && pendingImages.length > 0 && (
            <div className="py-4 border-t-2 border-dashed border-border" />
          )}

          {/* Section Images */}
          <div>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-orange-200">
              <span className="text-2xl">🖼️</span>
              <h2 className="text-2xl font-bold text-foreground">Images en attente ({pendingImages.length})</h2>
            </div>
            <ContentGrid
              items={pendingImages}
              title="Images"
              emptyMessage="Aucune image en attente d'approbation"
            />
          </div>
        </div>
      )}

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent aria-describedby="reject-desc">
            <DialogHeader>
              <DialogTitle>Rejeter le contenu</DialogTitle>
              <DialogDescription id="reject-desc">
                {selectedItem && getContentTitle(selectedItem)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Raison du rejet (facultatif)
                </label>
                <Textarea
                  placeholder="Expliquez pourquoi ce contenu est rejeté..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="min-h-32"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectDialog(false);
                    setRejectReason('');
                  }}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Traitement...' : 'Confirmer le rejet'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
