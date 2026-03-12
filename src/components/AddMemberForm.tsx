import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/hooks/useAuthContext';
import { useUser } from '@/hooks/useUser';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PasswordField from '@/components/ui/password-field';
import { useToast } from '@/hooks/use-toast';

const AddMemberForm: React.FC = () => {
  const { user } = useAuthContext();
  const { profile } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [full_name, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'member'|'moderator'|'admin'>('member');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const isAdmin = !!(profile && profile.role && ['admin','super_admin'].includes(String(profile.role).toLowerCase()));
    if (!user || !isAdmin) {
      navigate('/unauthorized');
    }
  }, [user, profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1) Create account via Supabase
      const { data: signData, error: signError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name,
            role,
          }
        }
      });

      if (signError) throw signError;

      const createdId = signData?.user?.id;

      if (!createdId) throw new Error('Impossible de récupérer l\'id du nouvel utilisateur');

      // 2) Insert profile row
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: createdId,
          email,
          full_name,
          role,
          invited_by: user?.id || null,
        });

      if (profileError) throw profileError;

      toast({ title: 'Membre ajouté', description: `${full_name} a été créé(e) avec le rôle ${role}` });
      navigate('/admin/users');
    } catch (err: unknown) {
      console.error('Erreur ajout membre:', err);
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: 'Erreur', description: message || 'Impossible d\'ajouter le membre', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajouter un nouveau membre</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm block mb-1">Nom complet</label>
            <Input value={full_name} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm block mb-1">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm block mb-1">Mot de passe temporaire</label>
            <PasswordField value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <div>
            <label className="text-sm block mb-1">Rôle</label>
            <select
              value={role}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRole(e.target.value as 'member' | 'moderator' | 'admin')}
              className="w-full p-2 border rounded"
            >
              <option value="member">Membre</option>
              <option value="moderator">Modérateur</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">{loading ? 'Création...' : 'Créer le compte'}</Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>Annuler</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddMemberForm;
