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

// Gallery storage helpers
export const GALLERY_BUCKET = (import.meta.env.VITE_BUCKET_GALLERY as string) || 'gallery';

export async function uploadFile(file: File, path?: string) {
  const fileName = (file.name || '').replace(/\s+/g, '-');
  const key = path ?? `uploads/${Date.now()}_${fileName}`;
  try {
    const { data, error } = await supabase.storage.from(GALLERY_BUCKET).upload(key, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) {
      console.error('uploadFile error', error);
      return null;
    }
    const { data: publicData } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(data.path);
    return { key: data.path, publicUrl: publicData.publicUrl };
  } catch (e) {
    console.error('uploadFile unexpected error', e);
    return null;
  }
}

export function getPublicUrl(path: string) {
  try {
    const { data } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  } catch (e) {
    console.error('getPublicUrl error', e);
    return null;
  }
}

export async function createVideoRecord(record: {
  title: string;
  description?: string;
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  author_id?: string;
  category_id?: string;
  status?: string;
}) {
  const { data, error } = await supabase.from("videos").insert([record]).select().maybeSingle();
  if (error) throw error;
  return data;
}

export async function uploadThumbnailFile(blob: Blob, filename?: string) {
  const name = filename ?? `thumbnails/${Date.now()}.jpg`;
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

        if (video.readyState >= 2) {
          video.currentTime = time;
        }
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked);
          seekHandler();
        };
        video.addEventListener('seeked', onSeeked);
      });

      video.addEventListener('error', () => {
        reject(new Error('Erreur lors du chargement de la vidéo pour la miniature'));
        cleanup();
      });
    } catch (e) {
      reject(e);
    }
  });
}

export async function testStorageConnection() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    console.log('testStorageConnection: user id =', user?.id);
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    console.log('testStorageConnection: buckets', buckets?.map(b => b.name), bucketsError);
    const galleryExists = buckets?.some(b => b.name === 'gallery');
    if (!galleryExists) return { ok: false, message: 'Bucket gallery not found' };
    const blob = new Blob(['test'], { type: 'text/plain' });
    const file = new File([blob], '_test_connection.txt');
    const { error } = await supabase.storage.from('gallery').upload('_test/connection.txt', file);
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: 'Test upload OK' };
  } catch (e) {
    console.error('testStorageConnection error', e);
    return { ok: false, message: String(e) };
  }
}
// Directory & About storage helpers
export async function uploadDirectoryImage(file: File, bucketName: string = 'directory-images') {
  const fileName = (file.name || '').replace(/\s+/g, '-');
  const key = `public/${Date.now()}_${fileName}`;
  try {
    const { data, error } = await supabase.storage.from(bucketName).upload(key, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) {
      console.error('uploadDirectoryImage error', error);
      return null;
    }
    const { data: publicData } = supabase.storage.from(bucketName).getPublicUrl(data.path);
    return { key: data.path, publicUrl: publicData.publicUrl };
  } catch (e) {
    console.error('uploadDirectoryImage unexpected error', e);
    return null;
  }
}