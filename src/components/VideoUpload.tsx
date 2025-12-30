import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { uploadVideoFile, createVideoRecord, generateThumbnailFromFile, uploadThumbnailFile } from "@/lib/supabase/storage";
import { toast } from "@/components/ui/sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

const VideoUpload: React.FC = () => {
  const qc = useQueryClient();
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadMut = useMutation<unknown, Error, File>({
    mutationFn: async (file: File) => {
    const uploaded = await uploadVideoFile(file);

    // generate thumbnail for direct video files
    let posterUrl: string | undefined;
    try {
      const thumbBlob = await generateThumbnailFromFile(file, 0.2);
      const thumbUploaded = await uploadThumbnailFile(thumbBlob, `thumbnails/${Date.now()}_${file.name.replace(/\s+/g, '_')}.jpg`);
      posterUrl = thumbUploaded.publicUrl;
    } catch (e) {
      // thumbnail generation failed — continue without poster
      console.warn('Thumbnail generation failed', e);
    }

    const record = await createVideoRecord({
      title: file.name,
      url: uploaded.publicUrl,
      storage_path: uploaded.key,
      poster_url: posterUrl,
      created_at: new Date().toISOString(),
      published: false,
    });

    return record;
    },
    onMutate: () => {
      toast.loading("Début de l'upload...");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin:videos"] });
      toast.dismiss();
      toast.success("Upload terminé");
    },
    onError: (error: Error) => {
      setError(error?.message ?? String(error));
      toast.dismiss();
      toast.error("Erreur lors de l'upload");
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    const file = acceptedFiles[0];
    if (!file) return;
    // rudimentary size check (e.g., 1GB limit)
    if (file.size > 1024 * 1024 * 1024) {
      setError("Fichier trop volumineux (limite ~1GB)");
      return;
    }

    uploadMut.mutate(file);
  }, [uploadMut]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false, accept: { "video/*": [] } });

  return (
    <div className="bg-card p-4 rounded">
      <h3 className="text-lg font-semibold mb-3">Uploader une vidéo</h3>
      <div {...getRootProps()} className={`border-dashed border-2 rounded p-6 text-center ${isDragActive ? "border-primary" : "border-muted"}`}>
        <input {...getInputProps()} />
        <p>{isDragActive ? "Relâchez pour uploader" : "Glissez-déposez un fichier vidéo ici ou cliquez"}</p>
      </div>

      {error && <div className="text-destructive mt-2">{error}</div>}
      {uploadMut.isPending && <div className="mt-2">Upload en cours...</div>}
      {uploadMut.isSuccess && <div className="mt-2 text-success">Upload terminé</div>}

      <div className="mt-3">
        <Button onClick={() => { /* noop: dropzone click already handled */ }}>Sélectionner un fichier</Button>
      </div>
    </div>
  );
};

export default VideoUpload;
