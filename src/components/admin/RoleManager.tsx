import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Trash2, Edit2, Save, X, Shield, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';

interface Role {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface Permission {
  id: string;
  page_key: string;
  page_name: string;
  category: string;
}

interface RoleManagerProps {
  compact?: boolean;
}

const PROTECTED_ROLES = ['developer', 'super_admin'];

const SIDEBAR_PAGES = [
  { path: '/', label: 'Accueil', category: 'General' },
  { path: '/a-propos', label: 'A propos', category: 'General' },
  { path: '/galerie', label: 'Galerie', category: 'Medias' },
  { path: '/videos', label: 'Videos', category: 'Medias' },
  { path: '/evenements', label: 'Evenements', category: 'General' },
  { path: '/verse', label: 'Verset du jour', category: 'Vie spirituelle' },
  { path: '/affiche', label: 'Affiches / Flyers', category: 'Communication' },
  { path: '/prayers', label: 'Intentions de priere', category: 'Vie spirituelle' },
  { path: '/announcements', label: 'Annonces', category: 'Communication' },
  { path: '/chat', label: 'Chat', category: 'Communication' },
  { path: '/donate', label: 'Faire un don', category: 'Finances' },
  { path: '/homilies', label: 'Homelies', category: 'Vie spirituelle' },
  { path: '/campaigns', label: 'Campagnes', category: 'Finances' },
  { path: '/receipts', label: 'Recus', category: 'Finances' },
  { path: '/dashboard', label: 'Tableau de bord', category: 'Administration' },
  { path: '/mariage', label: 'Mariage', category: 'Vie spirituelle' },
  { path: '/bapteme', label: 'Bapteme', category: 'Vie spirituelle' },
  { path: '/confession', label: 'Confession', category: 'Vie spirituelle' },
  { path: '/faq', label: 'FAQ', category: 'Vie spirituelle' },
  { path: '/admin/users', label: 'Utilisateurs', category: 'Administration' },
  { path: '/admin/roles', label: 'Gestion des roles', category: 'Administration' },
  { path: '/admin/officiants', label: 'Officiants', category: 'Administration' },
  { path: '/admin/requests', label: 'Demandes', category: 'Administration' },
];

export function RoleManager({ compact = false }: RoleManagerProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { confirm, DialogComponent: ConfirmDialog } = useConfirmDialog();

  useEffect(() => {
    void loadRoles();
    void loadPermissions();
  }, []);

  useEffect(() => {
    if (selectedRoleId) {
      void loadRolePermissions(selectedRoleId);
    }
  }, [selectedRoleId]);

  const loadRoles = async () => {
    const { data, error } = await supabase.from('roles').select('*').order('name');
    if (error) {
      toast.error('Erreur chargement roles');
      return;
    }
    const loadedRoles = (data as Role[]) || [];
    setRoles(loadedRoles);
    if (!selectedRoleId && loadedRoles.length) {
      setSelectedRoleId(loadedRoles[0].id);
    }
  };

  const loadPermissions = async () => {
    const { data, error } = await supabase.from('permissions').select('*');
    if (error) {
      await createDefaultPermissions();
      return;
    }
    setPermissions((data as Permission[]) || []);
  };

  const createDefaultPermissions = async () => {
    for (const page of SIDEBAR_PAGES) {
      await supabase.from('permissions').upsert(
        {
          page_key: page.path,
          page_name: page.label,
          category: page.category,
        } as never,
        { onConflict: 'page_key' },
      );
    }
    const { data } = await supabase.from('permissions').select('*');
    setPermissions((data as Permission[]) || []);
  };

  const loadRolePermissions = async (roleId: string) => {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('permission_id')
      .eq('role_id', roleId);
    if (!error) {
      setRolePermissions((data || []).map((rp: { permission_id: string }) => rp.permission_id));
    }
  };

  const handleTogglePermission = async (permissionId: string, checked: boolean) => {
    if (!selectedRoleId) return;

    setIsSaving(true);
    try {
      if (checked) {
        const { error } = await supabase
          .from('role_permissions')
          .insert({ role_id: selectedRoleId, permission_id: permissionId } as never);
        if (error) throw error;
        setRolePermissions((prev) => [...prev, permissionId]);
      } else {
        const { error } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', selectedRoleId)
          .eq('permission_id', permissionId);
        if (error) throw error;
        setRolePermissions((prev) => prev.filter((id) => id !== permissionId));
      }
      toast.success(checked ? 'Permission ajoutee' : 'Permission retiree');
    } catch {
      toast.error('Erreur');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      toast.error('Nom du role requis');
      return;
    }

    setIsLoading(true);
    try {
      const roleName = newRoleName.toLowerCase().replace(/\s+/g, '_');
      const { data, error } = await supabase
        .from('roles')
        .insert({ name: roleName, description: newRoleDesc } as never)
        .select()
        .single();
      if (error) throw error;
      setRoles((prev) => [...prev, data as Role]);
      setSelectedRoleId((data as Role).id);
      setIsCreateDialogOpen(false);
      setNewRoleName('');
      setNewRoleDesc('');
      toast.success('Role cree');
    } catch {
      toast.error('Erreur creation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (PROTECTED_ROLES.includes(role.name)) {
      toast.warning(`Le role ${role.name} ne peut pas etre supprime`);
      return;
    }

    const confirmed = await confirm({
      title: 'Supprimer le role',
      description: `Supprimer "${role.name}" ? Cette action est irreversible.`,
      confirmText: 'Supprimer',
      variant: 'destructive',
    });
    if (!confirmed) return;

    const { error } = await supabase.from('roles').delete().eq('id', role.id);
    if (error) {
      toast.error('Erreur suppression');
      return;
    }

    const remaining = roles.filter((r) => r.id !== role.id);
    setRoles(remaining);
    if (selectedRoleId === role.id) {
      setSelectedRoleId(remaining[0]?.id || null);
    }
    toast.success('Role supprime');
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('roles')
        .update({ name: editingRole.name, description: editingRole.description } as never)
        .eq('id', editingRole.id);
      if (error) throw error;
      setRoles((prev) => prev.map((r) => (r.id === editingRole.id ? editingRole : r)));
      setIsEditingRole(false);
      setEditingRole(null);
      toast.success('Role mis a jour');
    } catch {
      toast.error('Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    const category = perm.category || 'Autres';
    if (!acc[category]) acc[category] = [];
    acc[category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const isProtected = !!selectedRole && PROTECTED_ROLES.includes(selectedRole.name);

  return (
    <>
      <ConfirmDialog />
      <div className={compact ? 'space-y-4' : 'container mx-auto py-8'}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestion des roles et permissions</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nouveau role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Creer un nouveau role</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Nom du role</Label>
                  <Input
                    placeholder="ex: animateur, tresorier"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">En minuscules, underscores pour espaces</p>
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    placeholder="ex: Animation des celebrations"
                    value={newRoleDesc}
                    onChange={(e) => setNewRoleDesc(e.target.value)}
                  />
                </div>
                <Button onClick={() => void handleCreateRole()} disabled={isLoading} className="w-full">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Creer
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className={compact ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 md:grid-cols-4 gap-6'}>
          <Card>
            <CardHeader>
              <CardTitle>Roles existants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {roles.map((role) => {
                const isSelected = selectedRoleId === role.id;
                const isRoleProtected = PROTECTED_ROLES.includes(role.name);
                return (
                  <div
                    key={role.id}
                    className={`group relative rounded-lg transition-all ${
                      isSelected ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-muted'
                    }`}
                  >
                    <button onClick={() => setSelectedRoleId(role.id)} className="w-full text-left px-4 py-3">
                      <div className="flex items-center gap-2">
                        {role.name === 'super_admin' && <Shield className="h-4 w-4" />}
                        {role.name === 'admin' && <UserCog className="h-4 w-4" />}
                        <span className="font-semibold capitalize">{role.name.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="text-xs opacity-75 mt-1">{role.description || '—'}</div>
                    </button>
                    {!isRoleProtected && (
                      <button
                        onClick={() => {
                          setEditingRole(role);
                          setIsEditingRole(true);
                        }}
                        className="absolute right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/20"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                    )}
                    {!isRoleProtected && (
                      <button
                        onClick={() => void handleDeleteRole(role)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/20"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className={compact ? '' : 'md:col-span-3'}>
            <CardHeader>
              <CardTitle>
                Permissions - {selectedRole?.name?.replace(/_/g, ' ') || 'Selectionnez un role'}
                {isProtected && <span className="text-xs text-muted-foreground ml-2">(role systeme)</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedRoleId ? (
                <p className="text-muted-foreground text-center py-8">Selectionnez un role pour gerer ses permissions</p>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedPermissions).map(([category, perms]) => (
                    <div key={category}>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-3">{category}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {perms.map((perm) => {
                          const isChecked = rolePermissions.includes(perm.id);
                          return (
                            <div
                              key={perm.id}
                              className="flex items-center justify-between p-2 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
                            >
                              <span className="text-sm">{perm.page_name}</span>
                              <Switch
                                checked={isChecked}
                                onCheckedChange={(checked) => void handleTogglePermission(perm.id, checked)}
                                disabled={isSaving || isProtected}
                                className="data-[state=checked]:bg-green-500 data-[state=checked]:shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isEditingRole} onOpenChange={setIsEditingRole}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Nom</Label>
              <Input
                value={editingRole?.name || ''}
                onChange={(e) => setEditingRole(editingRole ? { ...editingRole, name: e.target.value } : null)}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={editingRole?.description || ''}
                onChange={(e) => setEditingRole(editingRole ? { ...editingRole, description: e.target.value } : null)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditingRole(false)}>
                <X className="h-4 w-4 mr-1" /> Annuler
              </Button>
              <Button onClick={() => void handleUpdateRole()} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4 mr-1" /> Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
