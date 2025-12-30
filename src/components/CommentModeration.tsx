import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchRecentComments, moderateComment, deleteComment } from "@/lib/supabase/commentQueries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { CommentStatus } from "@/types/database";

const CommentModeration: React.FC = () => {
  const qc = useQueryClient();

  const { data: comments, isLoading } = useQuery({
    queryKey: ["admin:comments"],
    queryFn: () => fetchRecentComments(100),
  });

  const modMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CommentStatus }) =>
      moderateComment(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin:comments"] });
      toast.success("Commentaire modéré");
    },
    onError: () => {
      toast.error("Erreur lors de la modération");
    },
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteComment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin:comments"] });
      toast.success("Commentaire supprimé");
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
          <div className="h-20 bg-muted rounded"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approuvé</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeté</Badge>;
      case 'spam':
        return <Badge variant="outline">Spam</Badge>;
      default:
        return <Badge variant="secondary">En attente</Badge>;
    }
  };

  return (
    <div className="bg-card p-6 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Modération des commentaires</h3>
      
      <div className="space-y-4">
        {(!comments || comments.length === 0) ? (
          <p className="text-muted-foreground text-center py-8">
            Aucun commentaire récent
          </p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">
                      {c.author?.full_name ?? "Anonyme"}
                    </span>
                    {getStatusBadge(c.status)}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {new Date(c.created_at).toLocaleString()}
                  </p>
                  <p className="text-sm">{c.content}</p>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => modMut.mutate({ id: c.id, status: "approved" })}
                    disabled={c.status === 'approved'}
                  >
                    Approuver
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => modMut.mutate({ id: c.id, status: "rejected" })}
                    disabled={c.status === 'rejected'}
                  >
                    Rejeter
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => delMut.mutate(c.id)}
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentModeration;
