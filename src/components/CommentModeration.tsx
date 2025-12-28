import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchRecentComments, moderateComment, deleteComment } from "@/lib/supabase/adminQueries";
import { Button } from "@/components/ui/button";

const CommentModeration: React.FC = () => {
  const qc = useQueryClient();
  const { data: comments, isLoading } = useQuery(["admin:comments"], () => fetchRecentComments(100));

  const modMut = useMutation(({ id, status }: any) => moderateComment(id, status), {
    onSuccess: () => qc.invalidateQueries(["admin:comments"]),
  });

  const delMut = useMutation((id: string) => deleteComment(id), {
    onSuccess: () => qc.invalidateQueries(["admin:comments"]),
  });

  if (isLoading) return <div>Chargement commentaires...</div>;

  return (
    <div className="bg-card p-4 rounded">
      <h3 className="text-lg font-semibold mb-3">Modération des commentaires</h3>
      <div className="space-y-3">
        {comments?.length === 0 && <div>Aucun commentaire récent</div>}
        {comments?.map((c: any) => (
          <div key={c.id} className="border rounded p-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium">{c.profiles?.full_name ?? c.author ?? "Anonyme"}</div>
                <div className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => modMut.mutate({ id: c.id, status: "approved" })}>Approuver</Button>
                <Button size="sm" variant="outline" onClick={() => modMut.mutate({ id: c.id, status: "rejected" })}>Rejeter</Button>
                <Button size="sm" variant="destructive" onClick={() => delMut.mutate(c.id)}>Supprimer</Button>
              </div>
            </div>
            <div className="mt-2 text-sm">{c.content}</div>
            <div className="mt-2 text-xs text-muted-foreground">Statut: {c.status ?? "pending"}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentModeration;
