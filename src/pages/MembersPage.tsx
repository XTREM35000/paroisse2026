import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import HeroBanner from '@/components/HeroBanner';
import { useLocation } from 'react-router-dom';
import usePageHero from '@/hooks/usePageHero';
import { Button } from '@/components/ui/button';
import { updateProfileRole } from '@/lib/supabase/rpc';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import useUserRoles from '@/hooks/useUserRoles';
import { displayRole, getAvailableRoles } from '@/lib/roleUtils';

interface Member {
  id: string;
  email?: string | null;
  full_name?: string | null;
  role?: string | null;
  avatar_url?: string | null;
}

const MembersPage: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Member | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState({ full_name: '', email: '', role: 'member' });
  const { toast } = useToast();
  const { canEditRole, isSuperAdmin } = useUserRoles();
  const [editingRole, setEditingRole] = useState<Record<string, string>>({});

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, role, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      console.debug('fetchMembers response', { count: (data as any)?.length ?? 0, data, error });
      setMembers(((data as unknown) as Member[]) || []);
    } catch (err) {
      console.error('Erreur fetch members', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);

  // Normalize incoming role strings vers les rôles système.
  const normalize = (r?: string | null) => {
    if (!r) return 'member';
    const lower = r.toLowerCase().trim();
    if (['member', 'membre'].includes(lower)) return 'member';
    if (['moderator', 'moderateur'].includes(lower)) return 'moderator';
    if (['admin', 'administrateur'].includes(lower)) return 'admin';
    if (['pretre', 'priest'].includes(lower)) return 'pretre';
    if (['diacre'].includes(lower)) return 'diacre';
    if (['super_admin', 'superadmin', 'super-admin'].includes(lower)) return 'super_admin';
    if (['guest', 'invité', 'invite'].includes(lower)) return 'guest';
    if (['developer', 'developper'].includes(lower)) return 'developer';
    return lower;
  };

  const roleOptions = getAvailableRoles(true);

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const result = await updateProfileRole(memberId, newRole);
      toast({ title: 'Succès', description: "Rôle mis à jour avec succès" });
      // Rafraîchir la liste
      await fetchMembers();
      // Clear editing state
      setEditingRole(prev => {
        const next = { ...prev };
        delete next[memberId];
        return next;
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rôle:', error);
      toast({ title: 'Erreur', description: `Erreur lors de la mise à jour du rôle: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, variant: 'destructive' });
    }
  };

  const openEdit = (m: Member) => {
    console.debug('Open edit member', { member: m });
    setSelected(m);
    setForm({ full_name: m.full_name || '', email: m.email || '', role: normalize(m.role) });
    setIsOpen(true);
  };

  const close = () => { setIsOpen(false); setSelected(null); };

  const save = async () => {
    if (!selected) return;
    try {
      const normalizedCurrent = normalize(selected.role);
      const normalizedForm = normalize(form.role);

      console.debug('Attempting to update member', { id: selected.id, formRole: form.role, normalizedCurrent, normalizedForm });

      // Seuls les super_admin peuvent attribuer le rôle super_admin
      if (normalizedForm === 'super_admin' && !isSuperAdmin) {
        alert('Seul un Super Admin peut attribuer le rôle super_admin.');
        return;
      }

      // If role changed, call RPC to update role safely (RLS barrier)
      if (normalizedCurrent !== normalizedForm) {
        try {
          console.debug('Calling RPC update_profile_role', { target: selected.id, role: normalizedForm });
          const rpcRes = await updateProfileRole(selected.id, normalizedForm);
          console.debug('RPC response', rpcRes);
        } catch (rpcErr: any) {
          console.error('RPC update_profile_role failed', rpcErr, { status: rpcErr?.status, details: rpcErr?.details });
          // Show a user-visible message to indicate why it failed
          alert(`Impossible de changer le rôle : ${rpcErr.message || 'erreur RPC (voir console)'} `);
          throw rpcErr;
        }
      }

      // Update other fields (name/email) via standard update (without role to avoid RLS interference)
      const updates: Partial<Member> & { updated_at?: string } = { full_name: form.full_name, email: form.email || null, updated_at: new Date().toISOString() };
      console.debug('Updating non-role fields', { id: selected.id, updates });
      const { data, error } = await supabase.from('profiles').update(updates).select().eq('id', selected.id);
      console.debug('Supabase update response', { data, error });
      if (error) throw error;
      await fetchMembers();
      close();
    } catch (err) {
      console.error('Erreur update member', err);
    }
  };

  const remove = async (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      console.debug('Deleting member', { memberId: deleteConfirmId });
      
      // Supprimer le profil - la RPC function gère les dépendances
      const { data, error } = await supabase.rpc('delete_member_with_cascade', {
        member_id: deleteConfirmId,
      });

      if (error) {
        console.error('RPC delete error', { error, message: error.message });
        throw new Error(error.message || 'Impossible de supprimer ce membre');
      }

      if (!data) {
        throw new Error('La suppression a échoué. Ce membre peut avoir des données associées non supprimables.');
      }

      await fetchMembers();
      toast({ title: 'Succès', description: 'Membre supprimé avec succès' });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue lors de la suppression';
      console.error('Erreur delete member', { error: err });
      toast({ 
        title: 'Erreur suppression', 
        description: errorMsg.includes('still referenced') 
          ? 'Ce membre ne peut pas être supprimé car il a des données associées (donations, messages, etc.). Veuillez d\'abord supprimer ces données ou contacter un administrateur.'
          : `Erreur: ${errorMsg}`, 
        variant: 'destructive' 
      });
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const createMember = async () => {
    try {
      const normalizedRole = normalize(form.role) || 'membre';

      if (normalizedRole === 'super_admin' && !isSuperAdmin) {
        alert('Seul un Super Admin peut créer un compte avec le rôle super_admin.');
        return;
      }

      const payload: Partial<Member> = { email: form.email || null, full_name: form.full_name || null, role: normalizedRole };
      const { data, error } = await supabase.from('profiles').insert([payload as unknown as any]);
      if (error) throw error;
      void data;
      await fetchMembers();
      setForm({ full_name: '', email: '', role: 'membre' });
    } catch (err) { console.error('Erreur create member', err); }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeroBanner title="Membres" subtitle="Gérez les membres" backgroundImage={hero?.image_url} onBgSave={saveHero} />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Liste des membres</h2>
          <Button onClick={() => setIsOpen(true)}>Ajouter un membre</Button>
        </div>

        {loading ? (
          <div className="text-center py-8">Chargement...</div>
        ) : (
          <div className="overflow-x-auto bg-card border border-border rounded-lg">
            <table className="w-full table-auto">
              <thead>
                <tr className="text-left">
                  <th className="px-4 py-3">Nom</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Rôle</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="px-4 py-3">{m.full_name || '—'}</td>
                    <td className="px-4 py-3">{m.email || '—'}</td>
                    <td className="px-4 py-3">
                      {canEditRole(m.role) ? (
                        <Select
                          value={editingRole[m.id] || m.role || 'member'}
                          onValueChange={(value) => {
                            const normalized = normalize(value);
                            setEditingRole(prev => ({ ...prev, [m.id]: normalized }));
                            handleRoleChange(m.id, normalized);
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Rôle" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableRoles(true).map((role) => {
                              if (role.value === 'super_admin' && !isSuperAdmin) return null;
                              return (
                                <SelectItem key={role.value} value={role.value}>
                                  {role.label}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline">{displayRole(m.role)}</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => openEdit(m)}>Éditer</Button>
                        <Button variant="destructive" onClick={() => remove(m.id)}>Supprimer</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {members.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucun membre trouvé
              </div>
            )}
          </div>
        )}
      </main>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent aria-describedby="member-edit-desc">
          <DialogHeader>
            <DialogTitle>Éditer le membre</DialogTitle>
          </DialogHeader>

          <div id="member-edit-desc" className="sr-only">Formulaire d'édition du membre sélectionné.</div>

          <div className="space-y-4">
            <div>
              <label className="text-sm block mb-1">Nom</label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm block mb-1">Email</label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="text-sm block mb-1">Rôle</label>
              <select 
                value={form.role} 
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="membre">Membre</option>
                <option value="moderateur">Modérateur</option>
                <option value="admin">Admin</option>
                <option value="pretre">Prêtre</option>
                <option value="diacre">Diacre</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={close}>Annuler</Button>
              <Button onClick={save}>Enregistrer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent aria-describedby="delete-confirm-desc">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <div id="delete-confirm-desc" className="sr-only">Confirmation de suppression du membre</div>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Êtes-vous sûr de vouloir supprimer ce membre ? Cette action ne peut pas être annulée.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Supprimer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MembersPage;
