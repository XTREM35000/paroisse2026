import React from "react";

type Props = {
  url: string;
  poster?: string;
};

const isYouTube = (u: string) => /youtube|youtu.be/.test(u);
const isVimeo = (u: string) => /vimeo/.test(u);

function toYouTubeEmbed(u: string) {
  // Extraire l'ID vidéo de différents formats d'URL YouTube
  let id = null;
  
  // Format: https://youtu.be/XXXX ou youtu.be/XXXX?...
  const shortMatch = u.match(/youtu\.be\/([A-Za-z0-9_-]+)/);
  if (shortMatch) {
    id = shortMatch[1];
  }
  
  // Format: YouTube Shorts https://www.youtube.com/shorts/XXXX
  const shortsMatch = u.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]+)/);
  if (shortsMatch) {
    id = shortsMatch[1];
  }
  
  // Format: https://www.youtube.com/watch?v=XXXX ou youtube.com/watch?v=XXXX&...
  const watchMatch = u.match(/(?:youtube\.com\/watch\?v=|v=)([A-Za-z0-9_-]+)/);
  if (watchMatch) {
    id = watchMatch[1];
  }
  
  // Format: déjà en embed https://youtube.com/embed/XXXX
  const embedMatch = u.match(/youtube\.com\/embed\/([A-Za-z0-9_-]+)/);
  if (embedMatch) {
    id = embedMatch[1];
  }
  
  // Si on a trouvé un ID, utiliser le format embed
  if (id) {
    return `https://www.youtube-nocookie.com/embed/${id}`;
  }
  
  return u;
}

function toVimeoEmbed(u: string) {
  const m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  const id = m?.[1];
  return id ? `https://player.vimeo.com/video/${id}` : u;
}

const VideoPlayer: React.FC<Props> = ({ url, poster }) => {
  if (!url) return <div className="text-sm text-muted-foreground">Aucune vidéo disponible</div>;

  console.log('🎥 VideoPlayer received URL:', url);
  
  if (isYouTube(url)) {
    const src = toYouTubeEmbed(url);
    console.log('📹 YouTube URL detected, converted to:', src);
    return (
      <div className="aspect-video w-full">
        <iframe 
          title="youtube-player" 
          src={src} 
          frameBorder={0} 
          allowFullScreen 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          className="w-full h-full" 
        />
      </div>
    );
  }

  if (isVimeo(url)) {
    const src = toVimeoEmbed(url);
    return (
      <div className="aspect-video w-full">
        <iframe title="vimeo-player" src={src} frameBorder={0} allowFullScreen className="w-full h-full" />
      </div>
    );
  }

  // fallback to HTML5 video for direct src (mp4, webm)
  return (
    <video 
      controls 
      poster={poster} 
      className="w-full max-h-[70vh] bg-black"
      crossOrigin="anonymous"
      preload="metadata"
    >
      <source src={url} type="video/mp4" />
      <source src={url.replace('.mp4', '.webm')} type="video/webm" />
      Votre navigateur ne supporte pas la lecture vidéo.
    </video>
  );
};

export default VideoPlayer;
