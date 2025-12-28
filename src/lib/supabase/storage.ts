import { supabase } from "@/integrations/supabase/client";

export async function uploadVideoFile(file: File, path?: string) {
  const key = path ?? `videos/${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage.from("videos").upload(key, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data: publicData } = supabase.storage.from("videos").getPublicUrl(key);
  return { key: data.path, publicUrl: publicData.publicUrl };
}

export async function createVideoRecord(record: any) {
  const { data, error } = await supabase.from("videos").insert([record]).select().maybeSingle();
  if (error) throw error;
  return data;
}

export async function uploadThumbnailFile(blob: Blob, filename?: string) {
  const name = filename ?? `thumbnails/${Date.now()}.jpg`;
  // Supabase storage requires a File or Blob; convert blob to File for better metadata
  const file = new File([blob], name.split('/').pop() ?? name, { type: 'image/jpeg' });
  const { data, error } = await supabase.storage.from("videos").upload(name, file, { upsert: true });
  if (error) throw error;
  const { data: publicData } = supabase.storage.from("videos").getPublicUrl(data.path);
  return { key: data.path, publicUrl: publicData.publicUrl };
}

export async function generateThumbnailFromFile(file: File, seekTo = 0.5): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = url;
      video.muted = true;

      const cleanup = () => {
        URL.revokeObjectURL(url);
        video.remove();
      };

      video.addEventListener('loadeddata', () => {
        // seekTo as fraction of duration
        const duration = video.duration || 0;
        const time = Math.min(Math.max(0, seekTo), 0.99) * duration;
        const seekHandler = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 360;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Canvas context not available');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
              if (!blob) {
                reject(new Error('Impossible de générer la miniature'));
                cleanup();
                return;
              }
              resolve(blob);
              cleanup();
            }, 'image/jpeg', 0.85);
          } catch (e) {
            reject(e);
            cleanup();
          }
        };

        // If already seeked, call handler, otherwise seek
        if (video.readyState >= 2) {
          video.currentTime = time;
        }
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked);
          seekHandler();
        };
        video.addEventListener('seeked', onSeeked);
      });

      video.addEventListener('error', (e) => {
        reject(new Error('Erreur lors du chargement de la vidéo pour la miniature'));
        cleanup();
      });
    } catch (e) {
      reject(e);
    }
  });
}
