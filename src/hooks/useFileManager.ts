import { useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useRoleCheck } from '@/hooks/useRoleCheck';

export interface ZipStructure {
  files: string[];
}

export interface UploadResult {
  success: boolean;
  path?: string;
  publicUrl?: string;
}

export default function useFileManager() {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const bucket = 'paroisse-files';

  const { user } = useAuth();
  const { isAdmin } = useRoleCheck();

  const uploadZip = async (file: File, mediaType: string): Promise<UploadResult> => {
    setIsUploading(true);
    try {
      // Require admin on client to avoid wasting uploads
      if (!isAdmin) {
        toast({ title: 'Non autorisé', description: "Vous devez être administrateur pour téléverser une archive.", variant: 'destructive' });
        throw new Error('not-authorized');
      }

      // Basic client-side validation already done by UI component
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      const path = `zips/${mediaType}/${fileName}`;

      // Upload
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { cacheControl: '3600', upsert: false });

      if (error) {
        console.error('Supabase storage upload error:', error);
        // If storage policy blocks the upload, give a clearer toast
        if (String(error?.message || '').toLowerCase().includes('policy') || String(error?.message || '').toLowerCase().includes('authorization')) {
          toast({ title: 'Erreur de permission', description: "Le téléversement a été refusé par les règles de stockage. Vérifiez la policy du bucket 'paroisse-files'.", variant: 'destructive' });
        }
        throw error;
      }

      // Insert metadata in shared_archives table
      const fileSize = file.size;
      const { error: insertError } = await supabase.from('shared_archives').insert({
        file_name: file.name,
        file_path: path,
        file_size: fileSize,
        media_type: mediaType,
        uploaded_by: user?.id || null,
      });

      if (insertError) {
        console.error('Error inserting archive metadata:', insertError);
        // Better message when RLS blocks the insert
        if (String(insertError?.message || '').toLowerCase().includes('row-level security') || String(insertError?.message || '').toLowerCase().includes('policy')) {
          toast({ title: 'Erreur RLS', description: "L'insertion en base a été bloquée par la politique RLS. Assurez-vous que votre profil a le rôle 'admin' et que la policy d'insertion existe pour 'shared_archives'.", variant: 'destructive' });
        }
        throw insertError;
      }

      // Return public url (getPublicUrl returns an object with data.publicUrl)
      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);
      const publicUrl = (publicData as { publicUrl?: string } | undefined)?.publicUrl || '';

      return { success: true, path, publicUrl };
    } finally {
      setIsUploading(false);
    }
  }; 

  const uploadMedia = async (file: File, type: 'video' | 'image' | 'document') => {
    const folder = type === 'video' ? 'videos' : type === 'image' ? 'images' : 'documents';
    const fileName = `${Date.now()}-${file.name}`;
    const path = `${folder}/${fileName}`;
    const targetBucket = type === 'video' ? 'video-files' : bucket;
    const { data, error } = await supabase.storage.from(targetBucket).upload(path, file);
    if (error) throw error;
    const { data: publicData } = supabase.storage.from(targetBucket).getPublicUrl(path);
    const publicUrl = (publicData as { publicUrl?: string } | undefined)?.publicUrl || '';
    return { success: true, path, publicUrl, bucket: targetBucket };
  };

  const resolveObjectPath = async (path: string, bucketName: string = bucket) => {
    // Try variations and listing to find the actual stored object path
    const candidates = new Set<string>();
    candidates.add(path);
    try { candidates.add(decodeURIComponent(path)); } catch (e: unknown) { /* ignore */ }
    candidates.add(path.replace(/\+/g, ' '));
    candidates.add(path.replace(/%20/g, ' '));
    candidates.add(path.replace(/ /g, '%20'));

    for (const cand of Array.from(candidates)) {
      // try listing parent folder
      const segments = cand.split('/');
      const name = segments.pop() || '';
      const parent = segments.join('/');
      try {
        const { data: listData, error: listErr } = await supabase.storage.from(bucketName).list(parent || '', { limit: 1000 }) as { data: { name: string }[] | null; error: unknown };
        if (!listErr && Array.isArray(listData)) {
          const found = listData.find(it => it.name === name || decodeURIComponent(it.name) === name || it.name.replace(/\+/g,' ') === name || it.name.replace(/%20/g,' ') === name);
          if (found) {
            return parent ? `${parent}/${found.name}` : found.name;
          }
        }
      } catch (e: unknown) {
        // ignore listing errors and try next candidate
        console.warn('Listing error while resolving path', parent, e);
      }
    }

    return null;
  };

  function chooseDownloadName(preferred?: string | null, fromPath?: string | null) {
    const preferredName = (preferred || '').trim();

    // If preferred has an extension, keep it
    if (preferredName && /\.[^./\\]+$/.test(preferredName)) return preferredName;
    // Else try to extract from path
    const from = (fromPath || '').split('/').pop() || '';
    if (from && /\.[^./\\]+$/.test(from)) return from;
    // If we have a name without extension, add .zip (archives expected)
    if (preferredName) return `${preferredName}.zip`;
    if (from) return `${from}.zip`;
    return 'archive.zip';
  }

  const downloadMedia = async (filePath: string, fileName?: string, bucketName: string = bucket) => {
    const bucketsToTry = [bucketName];
    if (bucketName === 'paroisse-files') bucketsToTry.push('video-files'); // fallback for videos

    for (const b of bucketsToTry) {
      // First attempt direct download from bucket b
      try {
        const { data, error } = await supabase.storage.from(b).download(filePath);
        if (error || !data) throw error || new Error('Empty download response');
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || filePath.split('/').pop() || 'file';
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        a.remove();
        return;
      } catch (err) {
        console.warn('downloadMedia storage.download failed for', b, filePath, err);
        // Try to resolve correct path via listing/decoding in this bucket
        try {
          const resolved = await resolveObjectPath(filePath, b);
          if (resolved && resolved !== filePath) {
            const { data, error } = await supabase.storage.from(b).download(resolved);
            if (data && !error) {
              const url = URL.createObjectURL(data);
              const a = document.createElement('a');
              a.href = url;
              a.download = fileName || resolved.split('/').pop() || 'file';
              document.body.appendChild(a);
              a.click();
              URL.revokeObjectURL(url);
              a.remove();
              return;
            }
          }
        } catch (e) {
          console.warn('resolveObjectPath failed', b, e);
        }

        // Try common prefixes (in case DB stored basename without folder) in this bucket
        const prefixes = ['videos/', 'public/', 'media/videos/', ''];
        for (const pref of prefixes) {
          const candidate = pref ? `${pref}${filePath}` : filePath;
          try {
            const { data, error } = await supabase.storage.from(b).download(candidate);
            if (data && !error) {
              const url = URL.createObjectURL(data);
              const a = document.createElement('a');
              a.href = url;
              a.download = fileName || candidate.split('/').pop() || 'file';
              document.body.appendChild(a);
              a.click();
              URL.revokeObjectURL(url);
              a.remove();
              return;
            }
          } catch (e) {
            console.warn('Prefix candidate failed', b, candidate, e);
          }
        }

        // Try public URL fetch as a fallback (works for public buckets)
        try {
          const tryPublicFetch = async (pathToTry: string) => {
            try {
              const { data: pubData } = supabase.storage.from(b).getPublicUrl(pathToTry);
              const publicUrl = (pubData as any)?.publicUrl;
              if (publicUrl) {
                const r = await fetch(publicUrl);
                if (r.ok) {
                  const blob = await r.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = fileName || pathToTry.split('/').pop() || 'file';
                  document.body.appendChild(a);
                  a.click();
                  URL.revokeObjectURL(url);
                  a.remove();
                  return true;
                }
              }
            } catch (e) {
              // ignore and return false
              console.warn('Public fetch failed for', b, pathToTry, e);
            }
            return false;
          };

          // Try original path
          if (await tryPublicFetch(filePath)) return;
          // Try prefixes
          for (const pref of prefixes) {
            const candidate = pref ? `${pref}${filePath}` : filePath;
            if (await tryPublicFetch(candidate)) return;
          }
        } catch (e) {
          console.warn('Public URL fallback failed', b, e);
        }

        // Final fallback: signed URL
        try {
          const { data: signedData, error: signedErr } = await supabase.storage.from(b).createSignedUrl(filePath, 60);
          if (signedErr || !signedData?.signedUrl) throw signedErr || new Error('Could not create signed URL');
          const res = await fetch(signedData.signedUrl);
          if (!res.ok) throw new Error('Failed to fetch signed URL');
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName || filePath.split('/').pop() || 'file';
          document.body.appendChild(a);
          a.click();
          URL.revokeObjectURL(url);
          a.remove();
          return;
        } catch (err2) {
          console.warn('signed URL fallback failed for', b, err2);
          // continue to try next bucket
        }
      }
    }

    // If we reach here, all buckets failed
    console.error('downloadMedia fallback failed for all buckets', filePath);
    try { toast({ title: 'Erreur', description: 'Impossible de télécharger le fichier. Vérifiez que le fichier existe dans Supabase Storage.', variant: 'destructive' }); } catch (e) { /* silent */ }
    throw new Error('download failed');
  }; 
  const downloadArchive = async (archiveId: string) => {
    try {
      const { data: archive, error: fetchError } = await supabase.from('shared_archives').select('file_path, file_name').eq('id', archiveId).single();
      if (fetchError) throw fetchError;
      const archiveRow = archive as { file_path?: string; file_name?: string } | null;
      const filePath = archiveRow?.file_path || '';

      // First try direct download
      try {
        const { data, error } = await supabase.storage.from(bucket).download(filePath);
        if (data && !error) {
          const url = URL.createObjectURL(data);
          const a = document.createElement('a');
          a.href = url;
          a.download = chooseDownloadName(archiveRow?.file_name, filePath);
          document.body.appendChild(a);
          a.click();
          URL.revokeObjectURL(url);
          a.remove();
          return;
        }
      } catch (err) {
        console.warn('downloadArchive storage.download failed for', filePath, err);
      }

      // Try to resolve via listing
      try {
        const resolved = await resolveObjectPath(filePath);
        if (resolved) {
          const { data, error } = await supabase.storage.from(bucket).download(resolved);
          if (data && !error) {
            const url = URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = chooseDownloadName(archiveRow?.file_name, resolved);
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            a.remove();
            return;
          }
        }
      } catch (e) {
        console.warn('resolveObjectPath failed for archive', e);
      }

      // Final fallback: signed URL
      try {
        const { data: signedData, error: signedErr } = await supabase.storage.from(bucket).createSignedUrl(filePath, 60);
        if (signedErr || !signedData?.signedUrl) throw signedErr || new Error('Could not create signed URL for archive');
        const res = await fetch(signedData.signedUrl);
        if (!res.ok) throw new Error('Failed to fetch signed URL');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = chooseDownloadName(archiveRow?.file_name, filePath);
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        a.remove();
        return;
      } catch (err2) {
        console.error('downloadArchive final fallback failed', err2);
        try { toast({ title: 'Erreur', description: 'Impossible de télécharger l\'archive. Vérifiez que le fichier existe dans le bucket.', variant: 'destructive' }); } catch (e) { /* silent */ }
        throw err2;
      }
    } catch (err) {
      console.error('downloadArchive error', err);
      throw err;
    }
  };

  const listArchives = async (mediaType?: string) => {
    const q = supabase.from('shared_archives').select('*').order('created_at', { ascending: false });
    if (mediaType) q.eq('media_type', mediaType);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  };

  const extractZipInfo = async (file: File): Promise<ZipStructure> => {
    // Optional: use JSZip if available to inspect content
    try {
      // Lazy import to avoid adding JSZip to main bundle unless used
      // dynamic import; runtime will provide the default export when installed
      const JSZip = (await import('jszip')).default;
      const jszip = new JSZip();
      const contents = await jszip.loadAsync(file);
      const files = Object.keys(contents.files);
      return { files };
    } catch (err: unknown) {
      console.warn('JSZip not available or failed to read archive', err);
      throw new Error('Impossible d\u2019inspecter le zip. Installez "jszip" si vous voulez extraire son contenu c\u00f4t\u00e9 client.');
    }
  };

  const validateZipStructure = (structure: ZipStructure) => {
    // Basic validation: check existence of root folder 'Paroisse' and a mediaType subfolder
    const hasRoot = structure.files.some((f) => f.startsWith('Paroisse/'));
    return hasRoot;
  };

  return useMemo(() => ({
    uploadZip,
    uploadMedia,
    downloadMedia,
    downloadArchive,
    listArchives,
    extractZipInfo,
    validateZipStructure,
    isUploading,
  }), [isUploading]);
}
