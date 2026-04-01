import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { showToast } from '@/lib/toast';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { displayRole, normalizeRoleName, validateRoleName } from '@/lib/roleUtils';
import { Loader2, Plus, Trash2, Edit2, Save, X, Shield, UserCog, Users, User } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
}

interface RoleManagerProps {
  compact?: boolean;
}

export function RoleManager({ compact = false }: RoleManagerProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { confirm, DialogComponent: ConfirmDialog } = useConfirmDialog();

  const getRoleIcon = (roleName: string) => {
    if (roleName === 'developer') return <Shield className="h-4 w-4" />;
    if (roleName === 'super_admin') return <Shield className="h-4 w-4" />;
    if (roleName === 'admin') return <UserCog className="h-4 w-4" />;
    if (roleName === 'member') return <Users className="h-4 w-4" />;
    if (roleName === 'guest') return <User className="h-4 w-4" />;
    return <Users className="h-4 w-4" />;
  };

  useEffect(() => {
    void loadRoles();
  }, []);

  const loadRoles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('is_system', { ascending: false })
        .order('name');

      if (error) throw error;
      const nextRoles = (data as Role[]) || [];
      setRoles(nextRoles);
      if (!selectedRoleId && nextRoles.length) setSelectedRoleId(nextRoles[0].id);
    } catch {
      showToast.error('Erreur chargement des rôles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRole = async () => {
    const normalized = normalizeRoleName(newRoleName);
    const validation = validateRoleName(normalized);

    if (!validation.valid) {
      showToast.error(validation.error);
      return;
    }

    if (roles.some((r) => r.name === normalized)) {
      showToast.error('Ce rôle existe déjà');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('roles')
        .insert({ name: normalized, description: newRoleDesc, is_system: false } as never);
      if (error) throw error;

      await loadRoles();
      setIsCreateDialogOpen(false);
      setNewRoleName('');
      setNewRoleDesc('');
      showToast.success('Rôle créé avec succès');
    } catch {
      showToast.error('Erreur lors de la création');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (role.is_system) {
      showToast.warning('Les rôles système ne peuvent pas être supprimés');
      return;
    }

    const confirmed = await confirm({
      title: 'Supprimer le rôle',
      description: `Voulez-vous vraiment supprimer le rôle "${displayRole(role.name)}" ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      variant: 'destructive',
    });

    if (confirmed) {
      setIsLoading(true);
      try {
        const { error } = await supabase.from('roles').delete().eq('id', role.id);
        if (error) throw error;

        await loadRoles();
        if (selectedRoleId === role.id) setSelectedRoleId(null);
        showToast.success('Rôle supprimé');
      } catch {
        showToast.error('Erreur lors de la suppression');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('roles')
        .update({ description: editingRole.description } as never)
        .eq('id', editingRole.id);
      if (error) throw error;

      await loadRoles();
      setIsEditingRole(false);
      setEditingRole(null);
      showToast.success('Rôle mis à jour');
    } catch {
      showToast.error('Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  return (
    <>
      <ConfirmDialog />
      <div className={compact ? 'space-y-4' : 'container mx-auto py-8'}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestion des rôles et permissions</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nouveau rôle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouveau rôle</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Nom du rôle</Label>
                  <Input
                    placeholder="ex: animateur, tresorier, catechiste"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    En minuscules, underscores pour espaces (ex: responsable_jeunes)
                  </p>
                </div>
                <div>
                  <Label>Description (optionnel)</Label>
                  <Input
                    placeholder="ex: Responsable de l'animation liturgique"
                    value={newRoleDesc}
                    onChange={(e) => setNewRoleDesc(e.target.value)}
                  />
                </div>
                <Button onClick={() => void handleCreateRole()} disabled={isLoading} className="w-full">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Créer le rôle
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className={compact ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 md:grid-cols-4 gap-6'}>
          <Card>
            <CardHeader>
              <CardTitle>Rôles existants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading && roles.length === 0 ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                roles.map((role) => {
                  const isSelected = selectedRoleId === role.id;
                  return (
                    <div
                      key={role.id}
                      className={`group relative rounded-lg transition-all ${
                        isSelected ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-muted'
                      }`}
                    >
                      <button onClick={() => setSelectedRoleId(role.id)} className="w-full text-left px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(role.name)}
                          <span className="font-semibold">{displayRole(role.name)}</span>
                          {role.is_system && (
                            <Badge variant="outline" className="text-xs ml-1">
                              Système
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs opacity-75 mt-1">
                          {role.description || (role.is_system ? 'Rôle système' : '—')}
                        </div>
                      </button>
                      {!role.is_system && (
                        <>
                          <button
                            onClick={() => {
                              setEditingRole(role);
                              setIsEditingRole(true);
                            }}
                            className="absolute right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/20"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => void handleDeleteRole(role)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/20"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className={compact ? '' : 'md:col-span-3'}>
            <CardHeader>
              <CardTitle>
                {selectedRole ? displayRole(selectedRole.name) : 'Sélectionnez un rôle'}
                {selectedRole?.is_system && <span className="text-xs text-muted-foreground ml-2">(rôle système)</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedRole ? (
                <p className="text-muted-foreground text-center py-8">Sélectionnez un rôle pour voir ses détails</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label>Nom technique</Label>
                    <p className="font-mono text-sm mt-1">{selectedRole.name}</p>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <p className="text-sm mt-1">{selectedRole.description || 'Aucune description'}</p>
                  </div>
                  {!selectedRole.is_system && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Les permissions de ce rôle seront configurées dans la section "Permissions".
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isEditingRole} onOpenChange={setIsEditingRole}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le rôle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Nom</Label>
              <Input value={editingRole?.name || ''} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground mt-1">Le nom ne peut pas être modifié</p>
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={editingRole?.description || ''}
                onChange={(e) => setEditingRole(editingRole ? { ...editingRole, description: e.target.value } : null)}
                placeholder="Description du rôle"
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
