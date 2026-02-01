import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Archive = {
  id: string;
  file_name: string;
  file_path: string;
  file_size?: number | null;
  description?: string | null;
  uploaded_by?: string | null;
  created_at?: string;
  media_type?: 'videos' | 'images' | 'documents' | string;
};

export default function useArchives() {
  const queryClient = useQueryClient();

  const list = async (mediaType?: string): Promise<Archive[]> => {
    const q = supabase.from('shared_archives').select('*').order('created_at', { ascending: false });
    if (mediaType) q.eq('media_type', mediaType);
    const { data, error } = await q;
    if (error) throw error;
    return (data as Archive[]) || [];
  };

  const useList = (mediaType?: string) =>
    useQuery<Archive[], Error>({
      queryKey: ['archives', mediaType ?? 'all'],
      queryFn: () => list(mediaType),
    });

  const remove = async (id: string): Promise<boolean> => {
    // Fetch the row to know the storage path
    const { data: row, error: fetchErr } = await supabase.from('shared_archives').select('file_path').eq('id', id).single();
    if (fetchErr) throw fetchErr;
    const filePath = (row as any)?.file_path;
    // Attempt to remove the storage object
    try {
      if (filePath) {
        const { error: rmError } = await supabase.storage.from('paroisse-files').remove([filePath]);
        if (rmError) console.warn('Failed to remove storage object:', rmError);
      }
    } catch (e) {
      console.warn('Storage removal failed', e);
    }

    // Delete DB row
    const { error } = await supabase.from('shared_archives').delete().eq('id', id);
    if (error) throw error;
    return true;
  };

  const useRemove = () =>
    useMutation<boolean, Error, string>({
      mutationFn: (id: string) => remove(id),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['archives'] }),
    });

  return {
    list,
    useList,
    remove,
    useRemove,
  };
} 
