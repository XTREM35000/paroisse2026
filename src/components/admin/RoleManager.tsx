import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { updateProfileRole } from '@/lib/supabase/rpc';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type RoleManagerProps = {
  compact?: boolean;
};

type UserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
};

const ROLE_OPTIONS = [
  { value: 'membre', label: 'Membre' },
  { value: 'moderateur', label: 'Moderateur' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
];

const normalizeRole = (role?: string | null) => {
  const value = String(role || '').toLowerCase();
  if (['member', 'membre'].includes(value)) return 'membre';
  if (['moderator', 'moderateur'].includes(value)) return 'moderateur';
  if (['admin', 'administrateur'].includes(value)) return 'admin';
  if (['super_admin', 'superadmin', 'super-admin'].includes(value)) return 'super_admin';
  return 'membre';
};

export function RoleManager({ compact = false }: RoleManagerProps) {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [changingId, setChangingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRows((data as UserRow[]) || []);
    } catch (error) {
      toast.error('Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, []);

  const totalByRole = useMemo(() => {
    return rows.reduce<Record<string, number>>((acc, user) => {
      const role = normalizeRole(user.role);
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});
  }, [rows]);

  const handleRoleChange = async (userId: string, role: string) => {
    setChangingId(userId);
    try {
      await updateProfileRole(userId, role);
      setRows((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
      toast.success('Role mis a jour');
    } catch {
      toast.error('Erreur lors de la mise a jour du role');
    } finally {
      setChangingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {ROLE_OPTIONS.map((opt) => (
          <Badge key={opt.value} variant="outline">
            {opt.label}: {totalByRole[opt.value] || 0}
          </Badge>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement des utilisateurs...
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((user) => (
            <div
              key={user.id}
              className={`rounded-lg border p-3 ${compact ? 'flex items-center justify-between gap-3' : 'grid md:grid-cols-[1fr_auto] gap-3'}`}
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{user.full_name || 'Sans nom'}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email || 'Sans email'}</p>
              </div>
              <Select
                value={normalizeRole(user.role)}
                onValueChange={(value) => void handleRoleChange(user.id, value)}
                disabled={changingId === user.id}
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          {rows.length === 0 ? <p className="text-sm text-muted-foreground">Aucun utilisateur trouve.</p> : null}
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => void fetchUsers()} disabled={loading}>
          Rafraichir
        </Button>
      </div>
    </div>
  );
}
