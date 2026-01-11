import React from 'react';
import { Play, Calendar, Image, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface ContentItem {
  id: string;
  title: string;
  date: string;
  type: 'video' | 'event' | 'image';
}

interface RecentContentFeedProps {
  videos?: ContentItem[];
  events?: ContentItem[];
  images?: ContentItem[];
  isLoading?: boolean;
}

const RecentContentFeed: React.FC<RecentContentFeedProps> = ({
  videos = [],
  events = [],
  images = [],
  isLoading = false,
}) => {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const ContentCard = ({ item, icon, color }: { item: ContentItem; icon: React.ReactNode; color: string }) => (
    <div className={`p-3 rounded-lg border ${color} hover:shadow-md transition-all`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-lg">{icon}</span>
      </div>
      <p className="text-xs font-semibold truncate mb-1">{item.title}</p>
      <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Videos */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Play className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Dernières vidéos
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/videos')}
            className="text-xs"
          >
            Tout voir <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : videos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Aucune vidéo récente</p>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {videos.slice(0, 5).map((video) => (
              <ContentCard
                key={video.id}
                item={video}
                icon="🎬"
                color="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
              />
            ))}
          </div>
        )}
      </div>

      {/* Events */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
            Événements à venir
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/events')}
            className="text-xs"
          >
            Tout voir <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Aucun événement à venir</p>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {events.slice(0, 5).map((event) => (
              <ContentCard
                key={event.id}
                item={event}
                icon="📅"
                color="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
              />
            ))}
          </div>
        )}
      </div>

      {/* Images */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Image className="h-5 w-5 text-pink-600 dark:text-pink-400" />
            Images récentes
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/gallery')}
            className="text-xs"
          >
            Tout voir <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : images.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Aucune image récente</p>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {images.slice(0, 5).map((image) => (
              <ContentCard
                key={image.id}
                item={image}
                icon="📸"
                color="bg-pink-50 dark:bg-pink-950 border-pink-200 dark:border-pink-800"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentContentFeed;
