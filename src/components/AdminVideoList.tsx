import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchVideos, updateVideo, deleteVideo } from "@/lib/supabase/videoQueries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Video } from "@/types/database";

const AdminVideoList: React.FC = () => {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");

  const { data: videosData, isLoading } = useQuery({
    queryKey: ["admin:videos"],
    queryFn: () => fetchVideos(),
  });

  const videos = videosData?.data || [];

  const updateMut = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Video> }) =>
      updateVideo(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin:videos"] });
      toast.success("Vidéo mise à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteVideo(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin:videos"] });
      toast.success("Vidéo supprimée");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

  if (isLoading) {
    return (
      <div className="bg-card p-6 rounded-lg border">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-10 bg-muted rounded"></div>
          <div className="h-10 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card p-6 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Gestion des vidéos</h3>
      
      {videos.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          Aucune vidéo pour le moment
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="pb-3 font-medium">Titre</th>
                <th className="pb-3 font-medium">Vues</th>
                <th className="pb-3 font-medium">Statut</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((v) => (
                <tr key={v.id} className="border-b last:border-0">
                  <td className="py-3">
                    {editingId === v.id ? (
                      <input
                        className="w-full border px-3 py-2 rounded-md bg-background"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    ) : (
                      <div className="font-medium">{v.title}</div>
                    )}
                  </td>
                  <td className="py-3">{v.views ?? 0}</td>
                  <td className="py-3">
                    <Badge variant={v.status === 'published' ? 'default' : 'secondary'}>
                      {v.status === 'published' ? 'Publié' : v.status}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2 flex-wrap">
                      {editingId === v.id ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => {
                              updateMut.mutate({ id: v.id, updates: { title } });
                              setEditingId(null);
                            }}
                          >
                            Sauvegarder
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            Annuler
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingId(v.id);
                              setTitle(v.title ?? "");
                            }}
                          >
                            Éditer
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateMut.mutate({
                                id: v.id,
                                updates: {
                                  status: v.status === 'published' ? 'draft' : 'published',
                                },
                              })
                            }
                          >
                            {v.status === 'published' ? "Dépublier" : "Publier"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteMut.mutate(v.id)}
                          >
                            Supprimer
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminVideoList;
