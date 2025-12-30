import { useState, useCallback } from 'react';
import { useVideos } from './useVideos';

export interface VideoWithState {
  id: string;
  title: string;
  thumbnail_url: string | null;
  duration: number | null;
  views: number;
  category?: string;
  created_at: string;
  description?: string;
  published?: boolean;
  isEditing?: boolean;
  isSaving?: boolean;
}

export const useVideoManager = (limit = 100, category?: string) => {
  const [editingData, setEditingData] = useState<Record<string, { isEditing?: boolean; isSaving?: boolean }>>({});
  const {
    videos,
    loading,
    error,
    createVideo,
    updateVideo,
    deleteVideo,
    refreshVideos,
  } = useVideos(limit, category);

  const handleCreate = useCallback(
    async (data: Record<string, unknown>) => {
      try {
        await createVideo(data as Parameters<typeof createVideo>[0]);
        return true;
      } catch (err) {
        console.error('Erreur création:', err);
        return false;
      }
    },
    [createVideo]
  );

  const handleUpdate = useCallback(
    async (videoId: string, data: Record<string, unknown>) => {
      try {
        setEditingData((prev) => ({ ...prev, [videoId]: { ...prev[videoId], isSaving: true } }));
        await updateVideo(videoId, data as Parameters<typeof updateVideo>[1]);
        setEditingData((prev) => {
          const newData = { ...prev };
          delete newData[videoId];
          return newData;
        });
        return true;
      } catch (err) {
        setEditingData((prev) => ({ ...prev, [videoId]: { ...prev[videoId], isSaving: false } }));
        console.error('Erreur mise à jour:', err);
        return false;
      }
    },
    [updateVideo]
  );

  const handleDelete = useCallback(
    async (videoId: string) => {
      try {
        await deleteVideo(videoId);
        return true;
      } catch (err) {
        console.error('Erreur suppression:', err);
        return false;
      }
    },
    [deleteVideo]
  );

  const startEditing = useCallback((videoId: string) => {
    setEditingData((prev) => ({
      ...prev,
      [videoId]: { ...prev[videoId], isEditing: true },
    }));
  }, []);

  const cancelEditing = useCallback((videoId: string) => {
    setEditingData((prev) => {
      const newData = { ...prev };
      delete newData[videoId];
      return newData;
    });
  }, []);

  const getVideoState = (videoId: string) => ({
    isEditing: editingData[videoId]?.isEditing || false,
    isSaving: editingData[videoId]?.isSaving || false,
  });

  return {
    videos,
    loading,
    error,
    handleCreate,
    handleUpdate,
    handleDelete,
    startEditing,
    cancelEditing,
    getVideoState,
    refreshVideos,
  };
};
