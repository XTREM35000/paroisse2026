import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import HeroBanner from '@/components/HeroBanner';
import { useLocation } from 'react-router-dom';
import usePageHero from '@/hooks/usePageHero';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  const [form, setForm] = useState({ full_name: '', email: '', role: 'membre' });

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, role, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
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

  const openEdit = (m: Member) => {
    setSelected(m);
    setForm({ full_name: m.full_name || '', email: m.email || '', role: m.role || 'membre' });
    setIsOpen(true);
  };

  const close = () => { setIsOpen(false); setSelected(null); };

  const save = async () => {
    if (!selected) return;
    try {
      const updates: Partial<Member> & { updated_at?: string } = { full_name: form.full_name, email: form.email || null, role: form.role || null, updated_at: new Date().toISOString() };
      const { error } = await supabase.from('profiles').update(updates).eq('id', selected.id);
      if (error) throw error;
      await fetchMembers();
      close();
    } catch (err) {
      console.error('Erreur update member', err);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce membre ?')) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      await fetchMembers();
    } catch (err) { console.error('Erreur delete member', err); }
  };

  const createMember = async () => {
    try {
      const payload: Partial<Member> = { email: form.email || null, full_name: form.full_name || null, role: form.role || 'membre' };
      const { data, error } = await supabase.from('profiles').insert([payload as unknown as any]);
      if (error) throw error;
      void data;
      await fetchMembers();
      setForm({ full_name: '', email: '', role: 'membre' });
    } catch (err) { console.error('Erreur create member', err); }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeroBanner title="Membres" subtitle="Gérez les membres" backgroundImage={hero?.image_url || '/images/prieres.png'} onBgSave={saveHero} />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Liste des membres</h2>
          <div className="flex items-center gap-2">
            <Input placeholder="Nom ou email" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <Button onClick={createMember}>Créer membre</Button>
          </div>
        </div>

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
                  <td className="px-4 py-3">{m.role || 'membre'}</td>
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
        </div>
      </main>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Éditer le membre</DialogTitle>
          </DialogHeader>

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
    </div>
  );
};

export default MembersPage;
