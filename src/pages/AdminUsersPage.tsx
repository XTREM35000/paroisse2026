import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import HeroBanner from '@/components/HeroBanner';
import { useLocation } from 'react-router-dom';
import usePageHero from '@/hooks/usePageHero';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Edit, Upload } from 'lucide-react';
import { updateProfileRole } from '@/lib/supabase/rpc';
import useRoleCheck from '@/hooks/useRoleCheck';

interface User {
  id: string;
  email?: string | null;
  full_name?: string | null;
  role?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  created_at?: string;
  updated_at?: string;
}

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'membre',
    avatar_url: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { toast } = useToast();
  const { hasRole } = useRoleCheck();
  const isSuperAdmin = hasRole('super_admin');

  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, role, phone, created_at, updated_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      console.debug('fetchUsers response', { count: (data as unknown as unknown[])?.length ?? 0 });
      setUsers((data as User[]) || []);
    } catch (err) {
      console.error('Erreur fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      console.debug('Deleting user', { userId: deleteConfirmId });
      // Try to delete directly using Supabase SDK
      // RLS policy on profiles table will allow this if user is admin
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', deleteConfirmId);

      if (error) {
        console.error('Supabase delete error', { error, status: (error as any).status, details: (error as any).details });
        // Check if it's a permission error
        if ((error as any).status === 403 || error.message.includes('permission')) {
          throw new Error(`Permission refusée: Vous ne disposez pas des droits suffisants pour supprimer cet utilisateur. ${error.message}`);
        }
        throw error;
      }

      await fetchUsers();
      toast({ title: 'Succès', description: 'Utilisateur supprimé avec succès' });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue lors de la suppression';
      console.error('Erreur delete user', { error: err, message: errorMsg });
      toast({ title: 'Erreur', description: `Suppression échouée: ${errorMsg}`, variant: 'destructive' });
    } finally {
      setDeleteConfirmId(null);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const normalize = (r?: string | null) => {
    // Normaliser vers les valeurs acceptées par le CHECK constraint
    if (!r) return 'membre';
    const lower = r.toLowerCase();
    if (['member', 'membre'].includes(lower)) return 'membre';
    if (['moderator', 'moderateur'].includes(lower)) return 'moderateur';
    if (['admin', 'administrateur'].includes(lower)) return 'admin';
    if (['pretre', 'priest'].includes(lower)) return 'pretre';
    if (['diacre'].includes(lower)) return 'diacre';
    if (['super_admin', 'superadmin', 'super-admin'].includes(lower)) return 'super_admin';
    return 'membre';
  };

  const displayRole = (r?: string | null) => {
    // Afficher un label lisible pour l'utilisateur
    if (!r) return 'Membre';
    const lower = r.toLowerCase();
    if (['member', 'membre'].includes(lower)) return 'Membre';
    if (['moderator', 'moderateur'].includes(lower)) return 'Modérateur';
    if (['admin', 'administrateur'].includes(lower)) return 'Admin';
    if (['pretre', 'priest'].includes(lower)) return 'Prêtre';
    if (['diacre'].includes(lower)) return 'Diacre';
    if (['super_admin', 'superadmin', 'super-admin'].includes(lower)) return 'Super Admin';
    return 'Membre';
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setAvatarFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setAvatarPreview(String(reader.result));
      reader.readAsDataURL(file);
    } else {
      setAvatarPreview(null);
    }
  };

  const openEdit = (user: User) => {
    console.debug('Open edit user', { user });
    setSelected(user);
    setForm({
      full_name: user.full_name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: normalize(user.role),
      avatar_url: user.avatar_url || '',
    });
    setAvatarFile(null);
    setAvatarPreview(user.avatar_url || null);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setSelected(null);
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const save = async () => {
    if (!selected) return;
    try {
      const normalizedCurrent = normalize(selected.role);
      const normalizedForm = normalize(form.role);

      console.debug('Attempting to update user', {
        id: selected.id,
        formRole: form.role,
        normalizedCurrent,
        normalizedForm,
      });

      // Seuls les super_admin peuvent attribuer le rôle super_admin
      if (normalizedForm === 'super_admin' && !isSuperAdmin) {
        toast({
          title: 'Action non autorisée',
          description: 'Seul un Super Admin peut attribuer ou retirer le rôle super_admin.',
          variant: 'destructive',
        });
        return;
      }

      let avatar_url = form.avatar_url;

      // Upload avatar if a new file was selected
      if (avatarFile) {
        try {
          const fileExt = avatarFile.name.split('.').pop();
          const fileName = `${selected.id}/${Date.now()}_avatar.${fileExt}`;
          const bucket = import.meta.env.VITE_BUCKET_AVATAR || 'avatars';

          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(fileName, avatarFile, { upsert: true });

          if (uploadError) throw uploadError;

          const { data: publicData } = await supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

          avatar_url = publicData?.publicUrl || '';
          console.debug('Avatar uploaded successfully', { avatar_url });
        } catch (uploadErr) {
          console.error('Avatar upload failed:', uploadErr);
          toast({ title: 'Erreur', description: 'Erreur lors du téléchargement de l\'image', variant: 'destructive' });
          return;
        }
      }

      // If role changed, call RPC to update role safely (RLS barrier)
      if (normalizedCurrent !== normalizedForm) {
        try {
          console.debug('Calling RPC update_profile_role', {
            target: selected.id,
            role: normalizedForm,
          });
          const rpcRes = await updateProfileRole(selected.id, normalizedForm);
          console.debug('RPC response', rpcRes);
        } catch (rpcErr) {
          const error = rpcErr instanceof Error ? rpcErr : new Error(String(rpcErr));
          console.error('RPC update_profile_role failed', error);
          toast({ title: 'Erreur', description: `Impossible de changer le rôle : ${error.message || 'erreur RPC'}`, variant: 'destructive' });
          throw error;
        }
      }

      // Update other fields (name/email/phone/avatar) via standard update
      interface ProfileUpdate {
        full_name: string | null;
        email: string | null;
        phone: string | null;
        avatar_url: string | null;
        updated_at: string;
      }
      const updates: ProfileUpdate = {
        full_name: form.full_name || null,
        email: form.email || null,
        phone: form.phone || null,
        avatar_url: avatar_url || null,
        updated_at: new Date().toISOString(),
      };

      console.debug('Updating user fields', { id: selected.id, updates });
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .select()
        .eq('id', selected.id);

      if (error) throw error;
      console.debug('Update response', { data });

      await fetchUsers();
      close();
      toast({ title: 'Succès', description: 'Utilisateur modifié avec succès' });
    } catch (err) {
      console.error('Erreur update user', err);
      toast({ title: 'Erreur', description: 'Erreur lors de la modification', variant: 'destructive' });
    }
  };

  const deleteUser = async (id: string) => {
    // open confirmation dialog
    setDeleteConfirmId(id);
  };

  const filteredUsers = users.filter((u) =>
    (u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())) ?? false
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeroBanner
        title="Gestion des utilisateurs"
        subtitle="Administrez les utilisateurs et leurs permissions"
        backgroundImage={hero?.image_url}
        onBgSave={saveHero}
      />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">Liste des utilisateurs</h2>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Rechercher par nom ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <span className="text-sm text-muted-foreground">{filteredUsers.length} utilisateur(s)</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Chargement...</div>
        ) : (
          <div className="overflow-x-auto bg-card border border-border rounded-lg">
            <table className="w-full table-auto">
              <thead>
                <tr className="text-left bg-muted/50">
                  <th className="px-4 py-3">Avatar</th>
                  <th className="px-4 py-3">Nom</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Téléphone</th>
                  <th className="px-4 py-3">Rôle</th>
                  <th className="px-4 py-3">Date de création</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-t hover:bg-muted/30 transition">
                    <td className="px-4 py-3">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.full_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                          {user.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{user.full_name || '—'}</td>
                    <td className="px-4 py-3 text-sm">{user.email || '—'}</td>
                    <td className="px-4 py-3 text-sm">{user.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary">
                        {displayRole(user.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(user)}
                          className="gap-1"
                        >
                          <Edit className="w-4 h-4" />
                          Éditer
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteUser(user.id)}
                          className="gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucun utilisateur trouvé
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal d'édition */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl" aria-describedby="user-edit-desc">
          <DialogHeader>
            <DialogTitle>Éditer l'utilisateur</DialogTitle>
          </DialogHeader>

          <div id="user-edit-desc" className="sr-only">
            Formulaire d'édition complet de l'utilisateur avec avatar, email, nom, téléphone et rôle.
          </div>

          <div className="space-y-6">
            {/* Avatar Section */}
            <div>
              <label className="text-sm font-semibold block mb-3">Photo de profil</label>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Aperçu avatar"
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">Aucune image</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Télécharger une image
                  </Button>
                  {avatarFile && (
                    <p className="text-xs text-muted-foreground mt-2">{avatarFile.name}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-semibold block mb-1">Nom complet</label>
                <Input
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Nom de l'utilisateur"
                />
              </div>

              <div>
                <label className="text-sm font-semibold block mb-1">Email</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@exemple.com"
                />
              </div>

              <div>
                <label className="text-sm font-semibold block mb-1">Téléphone</label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+225 07 00 00 00"
                />
              </div>

              <div>
                <label className="text-sm font-semibold block mb-1">Rôle</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="membre">Membre</option>
                  <option value="moderateur">Modérateur</option>
                  <option value="admin">Admin</option>
                  <option value="pretre">Prêtre</option>
                  <option value="diacre">Diacre</option>
                  <option value="super_admin" disabled={!isSuperAdmin}>
                    Super Admin {isSuperAdmin ? '' : '(réservé)'}
                  </option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end border-t pt-4">
              <Button variant="outline" onClick={close}>
                Annuler
              </Button>
              <Button onClick={save} className="gap-2">
                Enregistrer les modifications
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Confirmation suppression utilisateur */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <DialogContent className="max-w-md" aria-describedby="delete-user-desc">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription id="delete-user-desc">Cette action supprimera définitivement l'utilisateur sélectionné.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>Voulez-vous vraiment supprimer cet utilisateur ? Cette action est irréversible.</p>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Annuler</Button>
              <Button variant="destructive" onClick={confirmDelete}>Supprimer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsersPage;
