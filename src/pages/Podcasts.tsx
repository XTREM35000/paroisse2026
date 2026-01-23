import React, { useEffect, useRef, useState } from 'react';
import HeroBanner from '@/components/HeroBanner';
import { useLocation } from 'react-router-dom';
import usePageHero from '@/hooks/usePageHero';
import { useNotification } from '@/components/ui/notification-system';
import { Button } from '@/components/ui/button';
import { Play, Pause, Download, Radio, Clock } from 'lucide-react';
import SaveButton from '@/components/SaveButton';
import { supabase } from '@/integrations/supabase/client';

interface Episode {
  id: string;
  title: string;
  description?: string;
  duration?: number; // seconds
  audioUrl: string;
  publishedAt?: string;
}

// We'll list files from a configured Supabase storage bucket
const PODCAST_BUCKET = (import.meta.env.VITE_BUCKET_PODCASTS as string) || 'podcasts';

const Podcasts: React.FC = () => {
  const [current, setCurrent] = useState<Episode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const { notifyError } = useNotification();

  // live stream URL - Stream MP3 public gratuit pour test
  const LIVE_STREAM_URL = 'https://media-ssl.podbean.com/pb/d5a87c02e4e88f9f35d46b857e8c9f31/653c7dd9e1f99c11446db5bb/stream.m3u8';
  const [isLivePlaying, setIsLivePlaying] = useState(false);

  // restore saved episode (if user previously saved one)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('podcast.saved');
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s && s.audioUrl) {
        const ep: Episode = {
          id: s.id,
          title: s.title,
          description: s.description,
          audioUrl: s.audioUrl,
          duration: s.duration,
          publishedAt: s.publishedAt,
        };
        setCurrent(ep);
        setCurrentTime(s.currentTime ?? 0);
        setDuration(s.duration ?? 0);
        // prepare audio element (do not autoplay)
        audioRef.current = new Audio(s.audioUrl);
        audioRef.current.currentTime = s.currentTime ?? 0;
        audioRef.current.onloadedmetadata = () => setDuration(audioRef.current?.duration || 0);
        audioRef.current.ontimeupdate = () => {
          setCurrentTime(audioRef.current?.currentTime || 0);
          setProgress(audioRef.current?.duration ? (audioRef.current!.currentTime / audioRef.current!.duration) * 100 : 0);
        };
      }
    } catch (e) {
      console.warn('Failed to restore saved podcast', e);
    }
  }, []);

  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);

  useEffect(() => {
    let mounted = true;

    const fetchEpisodes = async () => {
      setLoadingEpisodes(true);
      try {
        const { data, error: listError } = await supabase.storage.from(PODCAST_BUCKET).list('', { limit: 200 });
        if (listError) throw listError;
        if (!data) {
          setEpisodes([]);
          setLoadingEpisodes(false);
          return;
        }
        // map files to Episode entries and get public URLs
        const items: Episode[] = [];
        for (const f of data) {
          // skip folders
          if ((f as any).name && (f as any).metadata && (f as any).metadata['is_folder']) continue;
          const path = (f as any).name ? (f as any).name : (f as any).id || '';
          // get public url
          const { data: publicData } = supabase.storage.from(PODCAST_BUCKET).getPublicUrl(path);
          const publicUrl = publicData?.publicUrl ?? '';
          items.push({ id: path, title: path.replace(/[-_]/g, ' ').replace(/\.mp3$/, ''), audioUrl: publicUrl, publishedAt: '' });
        }
        if (mounted) setEpisodes(items);
      } catch (e: any) {
        console.error('Error listing podcast files:', e);
        setError(String(e?.message ?? e));
      } finally {
        if (mounted) setLoadingEpisodes(false);
      }
    };

    fetchEpisodes();

    return () => {
      mounted = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const playEpisode = (ep: Episode) => {
    if (isLivePlaying) setIsLivePlaying(false);
    if (!audioRef.current) audioRef.current = new Audio();
    const a = audioRef.current;
    if (current?.id !== ep.id) {
      a.src = ep.audioUrl;
      a.currentTime = 0;
      setCurrent(ep);
    }
    a.play().then(() => setIsPlaying(true)).catch((e) => {
      console.error('Play error:', e);
      setIsPlaying(false);
    });

    // wire events for progress and duration
    a.onloadedmetadata = () => {
      setDuration(a.duration || 0);
    };
    a.ontimeupdate = () => {
      setCurrentTime(a.currentTime || 0);
      setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
    };
    a.onended = () => {
      setIsPlaying(false);
    };
  };

  const togglePlay = () => {
    if (!audioRef.current) audioRef.current = new Audio();
    const a = audioRef.current;
    if (isPlaying) {
      a.pause();
      setIsPlaying(false);
    } else {
      a.play().then(() => setIsPlaying(true)).catch((e) => {
        console.error('Play error:', e);
        setIsPlaying(false);
      });
    }
  };

  const saveCurrent = () => {
    if (!current) return;
    const payload = {
      id: current.id,
      title: current.title,
      description: current.description,
      audioUrl: current.audioUrl,
      currentTime,
      duration,
      publishedAt: current.publishedAt,
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem('podcast.saved', JSON.stringify(payload));
      // small feedback in console; UI toast could be added
      console.debug('Podcast saved', payload.id);
    } catch (e) {
      console.warn('Could not save podcast', e);
    }
  };

  const playLive = () => {
    console.log('🎙️ Tentative de lecture du stream:', LIVE_STREAM_URL);
    
    // stop episode if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    
    const live = new Audio();
    live.crossOrigin = 'anonymous';
    live.src = LIVE_STREAM_URL;
    audioRef.current = live;
    
    live.play()
      .then(() => {
        console.log('✅ Stream en lecture');
        setIsLivePlaying(true);
        setIsPlaying(false);
        setCurrent(null);
      })
      .catch((err) => {
        console.error('❌ Erreur lecture stream:', err);
        setIsLivePlaying(false);
        setError(`Erreur: ${err.message}`);
        notifyError('Erreur', `Impossible de lire le stream: ${err.message}`);
      });
    
    // wire events for live stream progress
    live.onloadedmetadata = () => {
      console.log('📊 Métadonnées chargées');
      setDuration(live.duration || 0);
    };
    
    live.ontimeupdate = () => {
      setCurrentTime(live.currentTime || 0);
      setProgress(live.duration ? (live.currentTime / live.duration) * 100 : 0);
    };
    
    live.onerror = (err) => {
      console.error('🔴 Erreur stream:', err);
      setIsLivePlaying(false);
      setError('Impossible de lire le stream. Vérifiez l\'URL.');
    };
  };

  const stopLive = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setIsLivePlaying(false);
  };

  return (
    <main className="min-h-screen bg-background">
      <HeroBanner
        title="Podcasts"
        subtitle="Écoutez nos émissions audio"
        showBackButton={true}
        backgroundImage={hero?.image_url}
        onBgSave={saveHero}
      />

      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Live / Player */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Radio className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Radio / Streaming</h3>
                  <p className="text-sm text-muted-foreground">Émission en direct et flux continu</p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <Button onClick={() => (isLivePlaying ? stopLive() : playLive())} className="gap-2">
                  {isLivePlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isLivePlaying ? 'Arrêter le direct' : 'Écouter le direct'}
                </Button>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>En direct maintenant</span>
                </div>
                {/* Save live / add to favorites button */}
                <SaveButton
                  itemId={isLivePlaying ? 'live-stream' : undefined}
                  isRecording={isLivePlaying}
                  onSave={() => {
                    // For live, persist a small marker in localStorage for UX
                    try {
                      localStorage.setItem('podcast.live.saved', JSON.stringify({ savedAt: new Date().toISOString() }));
                      console.debug('Live stream saved');
                    } catch (e) {
                      console.warn('Could not save live marker', e);
                    }
                  }}
                  onRemove={() => {
                    try {
                      localStorage.removeItem('podcast.live.saved');
                      console.debug('Live stream removed from saved');
                    } catch (e) {
                      console.warn('Could not remove live marker', e);
                    }
                  }}
                />
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="font-semibold mb-3">Lecteur</h4>
              {current ? (
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{current.title}</div>
                      <div className="text-sm text-muted-foreground">{current.description}</div>
                    </div>
                      <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={togglePlay}>
                        {isPlaying ? <Pause /> : <Play />}
                      </Button>
                      <SaveButton
                        itemId={current?.id}
                        isRecording={isPlaying}
                        onSave={() => saveCurrent()}
                        onRemove={() => {
                          try {
                            localStorage.removeItem('podcast.saved');
                            console.debug('Podcast saved removed');
                          } catch (e) {
                            console.warn('Could not remove saved podcast', e);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Aucun épisode sélectionné</div>
              )}
            </div>
          </div>

          {/* Episodes list */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Derniers épisodes</h2>
              <div className="text-sm text-muted-foreground">{episodes.length} épisodes</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loadingEpisodes ? (
                <div className="col-span-1 md:col-span-2 text-center text-muted-foreground">Chargement des épisodes…</div>
              ) : error ? (
                <div className="col-span-1 md:col-span-2 text-center text-destructive">Erreur: {error}</div>
              ) : (
                episodes.map((ep) => {
                  return (
                    <article key={ep.id} className="bg-card border border-border rounded-lg p-4 flex items-start gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold">{ep.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{ep.description}</p>
                        <div className="mt-3 flex items-center gap-3">
                          <Button onClick={() => playEpisode(ep)} size="sm" className="gap-2">
                            <Play className="h-4 w-4" />
                            Écouter
                          </Button>
                          <a href={ep.audioUrl} download className="text-sm text-muted-foreground inline-flex items-center gap-1">
                            <Download className="w-4 h-4" /> Télécharger
                          </a>
                        </div>
                        <div className="mt-3">
                          <input
                            type="range"
                            min={0}
                            max={duration || 0}
                            value={current?.id === ep.id ? currentTime : 0}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              if (audioRef.current && current?.id === ep.id) {
                                audioRef.current.currentTime = v;
                                setCurrentTime(v);
                              }
                            }}
                            className="w-full"
                          />
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground text-right">
                        <div>{ep.publishedAt}</div>
                        <div className="mt-2">{Math.floor((ep.duration ?? 0) / 60)} min</div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Sticky mini player */}
      <div className="fixed left-0 right-0 bottom-4 pointer-events-none flex justify-center">
        <div className="pointer-events-auto bg-card border border-border rounded-full px-4 py-2 shadow-lg flex items-center gap-4 w-[min(1000px,90%)]">
          <div className="flex-1">
            <div className="text-sm font-medium">{current ? current.title : (isLivePlaying ? 'Direct' : 'Lecteur inactif')}</div>
            <div className="text-xs text-muted-foreground">{current ? current.description : (isLivePlaying ? 'Émission en direct' : 'Aucune lecture')}</div>
          </div>
          <div className="flex items-center gap-2">
            {isLivePlaying ? (
              <Button onClick={stopLive} className="gap-2"><Pause className="h-4 w-4" />Stop</Button>
            ) : (
              <>
                <Button onClick={togglePlay} className="gap-2">{isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{isPlaying ? 'Pause' : 'Play'}</Button>
                <SaveButton
                  itemId={current?.id}
                  onSave={() => saveCurrent()}
                  onRemove={() => {
                    try {
                      localStorage.removeItem('podcast.saved');
                      console.debug('Podcast saved removed');
                    } catch (e) {
                      console.warn('Could not remove saved podcast', e);
                    }
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Podcasts;
