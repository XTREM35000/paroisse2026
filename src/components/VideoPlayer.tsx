import React from "react";

type Props = {
  url: string;
  poster?: string;
};

const isYouTube = (u: string) => /youtube|youtu.be/.test(u);
const isVimeo = (u: string) => /vimeo/.test(u);

function toYouTubeEmbed(u: string) {
  const m = u.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/);
  const id = m?.[1];
  return id ? `https://www.youtube.com/embed/${id}` : u;
}

function toVimeoEmbed(u: string) {
  const m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  const id = m?.[1];
  return id ? `https://player.vimeo.com/video/${id}` : u;
}

const VideoPlayer: React.FC<Props> = ({ url, poster }) => {
  if (!url) return <div className="text-sm text-muted-foreground">Aucune vidéo disponible</div>;

  if (isYouTube(url)) {
    const src = toYouTubeEmbed(url);
    return (
      <div className="aspect-video w-full">
        <iframe title="youtube-player" src={src} frameBorder={0} allowFullScreen className="w-full h-full" />
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
    <video controls poster={poster} className="w-full max-h-[70vh] bg-black">
      <source src={url} />
      Votre navigateur ne supporte pas la lecture vidéo.
    </video>
  );
};

export default VideoPlayer;
