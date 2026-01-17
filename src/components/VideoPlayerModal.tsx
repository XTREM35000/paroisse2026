import { motion, AnimatePresence } from "framer-motion";
import { X, ThumbsUp, MessageCircle } from "lucide-react";
import { useState } from "react";
import type { Video } from "@/types/database";
import VideoPlayer from "./VideoPlayer";

interface VideoPlayerModalProps {
  video: (Video & { video_storage_path?: string | null }) | null;
  isOpen: boolean;
  onClose: () => void;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  video,
  isOpen,
  onClose,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  if (!video) return null;

  // Construire l'URL vidéo : priorité aux vidéos locales, sinon URL externe
  const getVideoUrl = () => {
    if (video.video_storage_path) {
      // URL publique pour les vidéos stockées dans Supabase Storage
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://wxlmcuafbjxofihhcwho.supabase.co";
      return `${supabaseUrl}/storage/v1/object/public/videos/${video.video_storage_path}`;
    }
    return video.video_url || "";
  };

  const videoUrl = getVideoUrl();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-hidden"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            drag
            dragElastic={0.15}
            dragMomentum={true}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg max-h-[90vh] bg-black rounded-xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing flex flex-col"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-50 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Video Player */}
            <div className="aspect-video w-full flex-shrink-0 bg-black">
              <VideoPlayer
                url={videoUrl}
                poster={video.thumbnail_url}
              />
            </div>

            {/* Info et Commentaires - Scrollable */}
            <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
              {/* Video Info */}
              <div className="bg-card p-4 border-b border-border flex-shrink-0">
                <h2 className="text-lg font-bold text-foreground mb-1 line-clamp-2">
                  {video.title}
                </h2>
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {video.description}
                </p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{video.views || 0} vues</span>
                  <span>
                    {video.created_at
                      ? new Date(video.created_at).toLocaleDateString("fr-FR")
                      : ""}
                  </span>
                </div>
              </div>

              {/* Comments Section */}
              <div className="flex-1 overflow-y-auto px-4 py-3">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Commentaires
                </h3>
                
                {/* Comment Form */}
                <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-border">
                  <textarea
                    placeholder="Ajouter un commentaire..."
                    className="w-full bg-background text-foreground placeholder-muted-foreground text-sm p-2 rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    rows={2}
                  />
                  <button className="mt-2 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded hover:bg-primary/90 transition-colors">
                    Envoyer
                  </button>
                </div>

                {/* Comments List - Placeholder */}
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Aucun commentaire pour le moment. Soyez le premier à commenter !
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VideoPlayerModal;
