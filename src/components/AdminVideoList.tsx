import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchVideos, updateVideo, deleteVideo } from "@/lib/supabase/adminQueries";
import { Button } from "@/components/ui/button";

const AdminVideoList: React.FC = () => {
  const qc = useQueryClient();
  const { data: videos, isLoading } = useQuery(["admin:videos"], fetchVideos);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");

  const updateMut = useMutation(({ id, updates }: any) => updateVideo(id, updates), {
    onSuccess: () => qc.invalidateQueries(["admin:videos"]),
  });

  const deleteMut = useMutation((id: string) => deleteVideo(id), {
    onSuccess: () => qc.invalidateQueries(["admin:videos"]),
  });

  if (isLoading) return <div>Chargement vidéos...</div>;

  return (
    <div className="bg-card p-4 rounded">
      <h3 className="text-lg font-semibold mb-3">Gestion des vidéos</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="pb-2">Titre</th>
              <th className="pb-2">Vues</th>
              <th className="pb-2">Publié</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {videos?.map((v: any) => (
              <tr key={v.id} className="border-t">
                <td className="py-2">
                  {editingId === v.id ? (
                    <input className="w-full border px-2 py-1 rounded" value={title} onChange={(e) => setTitle(e.target.value)} />
                  ) : (
                    <div className="font-medium">{v.title}</div>
                  )}
                </td>
                <td className="py-2">{v.views ?? 0}</td>
                <td className="py-2">{v.published ? "Oui" : "Non"}</td>
                <td className="py-2 flex gap-2">
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
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        Annuler
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
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
                        onClick={() => updateMut.mutate({ id: v.id, updates: { published: !v.published } })}
                      >
                        {v.published ? "Dépublier" : "Publier"}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteMut.mutate(v.id)}>
                        Supprimer
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminVideoList;
