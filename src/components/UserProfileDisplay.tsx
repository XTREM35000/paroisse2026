import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { displayRole } from '@/lib/roleUtils';
import { supabase } from '@/integrations/supabase/client';
import { LogOut } from 'lucide-react';

interface UserProfileDisplayProps {
  onLogoutSuccess?: () => void;
}

const UserProfileDisplay: React.FC<UserProfileDisplayProps> = ({ onLogoutSuccess }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (!error && data) {
          setProfile(data);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération du profil:', err);
      }
    };

    fetchProfile();
  }, [user?.id]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut();
      navigate('/');
      if (onLogoutSuccess) {
        onLogoutSuccess();
      }
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
    : user.email?.[0]?.toUpperCase() || 'U';

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Mon Profil</CardTitle>
        <CardDescription>Vous êtes connecté</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            {profile?.avatar_url && (
              <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
            )}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold">{profile?.full_name || user.email}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {profile?.phone && (
              <p className="text-sm text-muted-foreground">{profile.phone}</p>
            )}
          </div>
        </div>

        <div className="space-y-2 text-sm">
          {profile?.role && (
            <p>
              <span className="font-medium">Rôle:</span> {displayRole(profile.role)}
            </p>
          )}
          {profile?.created_at && (
            <p className="text-xs text-muted-foreground">
              Membre depuis le {new Date(profile.created_at).toLocaleDateString('fr-FR')}
            </p>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/profile')}
            size="sm"
          >
            Modifier le profil
          </Button>
          <Button
            variant="destructive"
            onClick={handleLogout}
            disabled={loading}
            size="sm"
            className="flex items-center gap-1"
          >
            <LogOut className="w-4 h-4" />
            {loading ? 'Déconnexion...' : 'Se déconnecter'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserProfileDisplay;
