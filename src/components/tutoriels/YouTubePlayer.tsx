/**
 * YouTubePlayer - Lecteur vidéo YouTube responsive
 */

interface YouTubePlayerProps {
  videoId: string;
  title: string;
  autoplay?: boolean;
}

export function YouTubePlayer({ videoId, title, autoplay = false }: YouTubePlayerProps) {
  return (
    <div className="w-full bg-black rounded-lg overflow-hidden shadow-lg">
      <div className="aspect-video w-full">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="border-0"
        />
      </div>
    </div>
  );
}
