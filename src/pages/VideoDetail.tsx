import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import HeroBanner from "@/components/HeroBanner";
import { useLocation } from 'react-router-dom';
import usePageHero from '@/hooks/usePageHero';
import VideoPlayer from "@/components/VideoPlayer";
import { getVideoById, incrementViewCount } from "@/lib/supabase/queries";

interface Video {
  id: string;
  title?: string;
  category?: string;
  url?: string;
  video_url?: string;
  poster_url?: string;
  duration?: number | string;
  views?: number;
  description?: string;
}

const VideoDetail: React.FC = () => {
  const { id } = useParams();

  const { data: video, isLoading } = useQuery<Video | null>({
    queryKey: ["video", id],
    queryFn: async () => {
      if (!id) return null;
      return await getVideoById(id);
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (id) {
      incrementViewCount(id).catch(() => {});
    }
  }, [id]);

  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);

  if (isLoading)
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header provided by Layout */}
        <HeroBanner
          title="Chargement..."
          subtitle="Veuillez patienter"
          showBackButton={true}
        />
      </div>
    );
  if (!video)
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header darkMode={false} toggleDarkMode={() => {}} />
        <HeroBanner
          title="Vidéo introuvable"
          subtitle="La vidéo que vous recherchez n'existe pas"
          showBackButton={true}
        />
      </div>
    );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header provided by Layout */}

        <HeroBanner
          title={video.title ?? "Vidéo"}
          subtitle={video.category || "Vidéo paroissiale"}
          showBackButton={true}
          backgroundImage={hero?.image_url || video.poster_url || undefined}
          onBgSave={saveHero}
        />

      <main className="flex-1 py-12 lg:py-16">
        <div className="max-w-4xl mx-auto px-4">
          <VideoPlayer url={video.url ?? video.video_url ?? ""} poster={video.poster_url} />
          <div className="mt-8 space-y-4">
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>Durée : {video.duration ?? "-"}</span>
              <span>•</span>
              <span>Vues : {video.views ?? 0}</span>
            </div>
            <p className="text-lg leading-relaxed">{video.description}</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VideoDetail;
