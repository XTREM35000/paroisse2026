import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, LogOut, Save, Edit2, Upload, Camera } from 'lucide-react';
import Header from '@/components/Header';
import HeroBanner from '@/components/HeroBanner';
import { useLocation } from 'react-router-dom';
import usePageHero from '@/hooks/usePageHero';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { formatRoleLabelForUi, isAdmin as rpIsAdmin, isSuperAdminLevel } from '@/utils/rolePermissions';

interface UserData {
  full_name: string;
  phone: string;
  avatar_url: string;
  email: string;
  role?: string | null;
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  const { user, signOut, refreshProfile, role: authRole } = useAuth();
  const { profile, isLoading: profileLoading } = useUser();
  const { data: hero, save: saveHero } = usePageHero(location.pathname); // ✅ Utilisable ici
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [userData, setUserData] = useState<UserData>({
    full_name: '',
    phone: '',
    avatar_url: '',
    email: '',
    role: null,
  });

  useEffect(() => {
    if (!user) {
      navigate('/connexion');
      return;
    }

    if (profile) {
      setUserData({
        full_name: profile.full_name || user.user_metadata?.full_name || '',
        phone: user.user_metadata?.phone || '',
        avatar_url: profile.avatar_url || user.user_metadata?.avatar_url || '',
        email: user.email || '',
        role: (function normalize(r?: string | null){
          if(!r) return null;
          const lower = r.toLowerCase();
          if(lower === 'membre' || lower === 'member') return 'membre';
          if(lower === 'moderateur' || lower === 'moderator') return 'moderateur';
          if(lower === 'admin' || lower === 'administrateur') return 'admin';
          if(lower === 'super_admin' || lower === 'superadmin' || lower === 'super-admin') return 'super_admin';
          if(lower === 'developer' || lower === 'developper') return 'developer';
          if(lower === 'pretre' || lower === 'priest') return 'pretre';
          if(lower === 'diacre') return 'diacre';
          return lower;
        })(profile.role ?? authRole),
      });
    } else if (user) {
      setUserData((prev) => ({ 
        ...prev, 
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
        phone: user.user_metadata?.phone || '',
        avatar_url: user.user_metadata?.avatar_url || '',
        role: (function normalize(r?: string | null){
          if(!r) return prev.role || null;
          const lower = r.toLowerCase();
          if(lower === 'membre' || lower === 'member') return 'membre';
          if(lower === 'moderateur' || lower === 'moderator') return 'moderateur';
          if(lower === 'admin' || lower === 'administrateur') return 'admin';
          if(lower === 'pretre' || lower === 'priest') return 'pretre';
          if(lower === 'diacre') return 'diacre';
          return lower;
        })(user.user_metadata?.role),
      }));
    }
  }, [user, profile, navigate]);

  // Show a small prompt banner when redirected with prompt=complete
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      if (params.get('prompt') === 'complete') {
        setShowCompletePrompt(true);
      }
    } catch (e) {
      // ignore
    }
  }, [location.search]);

  // const location = useLocation();
  // const { data: hero, save: saveHer9o } = usePageHero(location.pathname);
  const [showCompletePrompt, setShowCompletePrompt] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      let updatedAvatarUrl = userData.avatar_url;

      // Upload avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const bucket = import.meta.env.VITE_BUCKET_AVATAR || 'avatars';
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = await supabase.storage.from(bucket).getPublicUrl(filePath);
        updatedAvatarUrl = data?.publicUrl || userData.avatar_url;
      }

      // Update profile in database
      const normalize = (r?: string | null) => {
        if (!r) return 'membre';
        const lower = r.toLowerCase();
        if (lower === 'membre' || lower === 'member') return 'membre';
        if (lower === 'moderateur' || lower === 'moderator') return 'moderateur';
        if (lower === 'admin' || lower === 'administrateur') return 'admin';
        if (lower === 'pretre' || lower === 'priest') return 'pretre';
        if (lower === 'diacre') return 'diacre';
        if (['super_admin', 'superadmin', 'super-admin'].includes(lower)) return 'super_admin';
        // Pour tout autre rôle inconnu, conserver la valeur normalisée en minuscules
        return lower;
      };

      const profileUpdates: Database['public']['Tables']['profiles']['Update'] = {
        full_name: userData.full_name,
        avatar_url: updatedAvatarUrl,
        role: normalize(userData.role ?? null),
      };
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update auth metadata only when values changed (reduces unnecessary global auth events).
      const currentMeta = (user.user_metadata || {}) as Record<string, unknown>;
      const nextMeta = {
        full_name: userData.full_name,
        phone: userData.phone,
        avatar_url: updatedAvatarUrl,
      };
      const shouldUpdateMetadata =
        String(currentMeta.full_name || '') !== String(nextMeta.full_name || '') ||
        String(currentMeta.phone || '') !== String(nextMeta.phone || '') ||
        String(currentMeta.avatar_url || '') !== String(nextMeta.avatar_url || '');

      if (shouldUpdateMetadata) {
        const { error: metadataError } = await supabase.auth.updateUser({
          data: nextMeta,
        });
        if (metadataError) throw metadataError;
      }

      setUserData((prev) => ({ ...prev, avatar_url: updatedAvatarUrl }));
      setAvatarFile(null);
      setAvatarPreview(null);
      setIsEditing(false);

      // Forcer le rafraîchissement global du profil utilisateur (Header User Menu, etc.)
      if (refreshProfile) {
        try {
          await refreshProfile();
        } catch (refreshErr) {
          console.warn('Impossible de rafraîchir le profil global après mise à jour :', refreshErr);
        }
      }

      toast({ title: 'Profil mis a jour', description: 'Vos modifications ont ete enregistrees.' });
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      toast({
        title: 'Erreur',
        description: "Impossible d'enregistrer le profil",
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header provided by Layout */}
        <HeroBanner
          title="Mon profil"
          subtitle="Gérez vos informations personnelles"
          showBackButton={true}
        />
        <div className="flex items-center justify-center py-16 flex-1">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header provided by Layout */}

      <HeroBanner
        title="Mon profil"
        subtitle="Gérez vos informations personnelles"
        showBackButton={true}
        backgroundImage={hero?.image_url}
        onBgSave={saveHero}
      />

      {showCompletePrompt && (
        <div className="container mx-auto px-4 mt-4">
          <div className="rounded-lg p-4 bg-yellow-50 border border-yellow-200 flex items-center justify-between">
            <div>
              <p className="font-medium">Complétez votre profil</p>
              <p className="text-sm text-muted-foreground">Il manque des informations (nom, email ou photo). Merci de compléter pour améliorer votre expérience.</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => { setIsEditing(true); setShowCompletePrompt(false); }} className="">Compléter maintenant</Button>
              <Button variant="outline" onClick={() => {
                setShowCompletePrompt(false);
                try {
                  const url = new URL(window.location.href);
                  url.searchParams.delete('prompt');
                  window.history.replaceState({}, document.title, url.pathname + url.search);
                } catch (e) { /* ignore */ }
              }}>Plus tard</Button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 py-12 lg:py-16">
        <div className="container mx-auto px-4">
          {/* Profile Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8">
              <div>
                {/* Removed duplicate header since HeroBanner is now used */}
              </div>
              {!isEditing && (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Modifier
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleLogout}
                    className="gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </Button>
                </div>
              )}
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Profile Card - Avatar et Info Principales */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Profil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar */}
                  <div className="flex flex-col items-center">
                    <div className="relative mb-4">
                      <Avatar className="h-24 w-24">
                        <AvatarImage
                          src={avatarPreview || userData.avatar_url || ''}
                          alt={userData.full_name}
                        />
                        <AvatarFallback>{userData.full_name?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {isEditing && (
                        <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90">
                          <Camera className="h-4 w-4" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                          />
                        </label>
                      )}
                    </div>
                    {isEditing && avatarFile && (
                      <p className="text-sm text-muted-foreground text-center">
                        Nouvelle image sélectionnée
                      </p>
                    )}
                  </div>

                  {/* User Status */}
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">Membre depuis</p>
                    <p className="text-lg font-semibold">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'N/A'}
                    </p>
                  </div>

                  {isEditing && (
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        className="flex-1 gap-2"
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                      >
                        <Save className="h-4 w-4" />
                        {isSaving ? 'Sauvegarde...' : 'Enregistrer'}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setIsEditing(false);
                          setAvatarFile(null);
                          setAvatarPreview(null);
                        }}
                        disabled={isSaving}
                      >
                        Annuler
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Profile Details - Informations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="lg:col-span-2"
            >
              <Tabs defaultValue="infos" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="infos">Mes informations</TabsTrigger>
                  <TabsTrigger value="account">Compte</TabsTrigger>
                  <TabsTrigger value="security">Sécurité</TabsTrigger>
                </TabsList>

                {/* Informations Personnelles */}
                <TabsContent value="infos" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Informations personnelles</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Full Name */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">Nom complet</label>
                        {isEditing ? (
                          <Input
                            value={userData.full_name}
                            onChange={(e) =>
                              setUserData({ ...userData, full_name: e.target.value })
                            }
                            placeholder="Votre nom complet"
                          />
                        ) : (
                          <p className="text-lg">{userData.full_name || 'Non renseigné'}</p>
                        )}
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">Téléphone</label>
                        {isEditing ? (
                          <Input
                            value={userData.phone}
                            onChange={(e) =>
                              setUserData({ ...userData, phone: e.target.value })
                            }
                            placeholder="+225 XX XX XX XX"
                            type="tel"
                          />
                        ) : (
                          <p className="text-lg">{userData.phone || 'Non renseigné'}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Compte */}
                <TabsContent value="account" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Informations du compte</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Email */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">Email</label>
                        <p className="text-lg text-muted-foreground">{userData.email}</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Votre email ne peut pas être modifié depuis ce formulaire.
                        </p>
                      </div>

                      {/* Account Type */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">Type de compte</label>
                        {/* Sélecteur visible seulement pour les admins */}
                        {(() => {
                          const effective = authRole ?? profile?.role ?? user?.user_metadata?.role ?? null;
                          const isPrivileged = rpIsAdmin(String(effective ?? '')) || isSuperAdminLevel(String(effective ?? ''));
                          const isSuperOrDev =
                            isSuperAdminLevel(String(effective ?? '')) ||
                            String(effective ?? '').toLowerCase() === 'developer';
                          if (isPrivileged && isEditing && !isSuperOrDev) {
                            return (
                              <select
                                value={userData.role || 'member'}
                                onChange={(e) => setUserData({ ...userData, role: e.target.value })}
                                className="w-full p-2 border rounded"
                              >
                                <option value="member">Membre</option>
                                <option value="moderator">Modérateur</option>
                                <option value="admin">Administrateur</option>
                              </select>
                            );
                          }

                          return (
                            <div className="p-3 bg-muted rounded">
                              <p className="text-sm">
                                Rôle :{' '}
                                <strong>{formatRoleLabelForUi(String(effective ?? ''))}</strong>
                                {effective && (
                                  <span className="text-muted-foreground font-normal"> ({String(effective)})</span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {isSuperOrDev
                                  ? 'Compte avec tous les privilèges sur la paroisse et la plateforme (selon le rôle).'
                                  : 'Seul un administrateur peut modifier votre rôle.'}
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Sécurité */}
                <TabsContent value="security" className="space-y-6">
                  <ChangePasswordForm />
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>

          {/* Favorites Section - Pour le futur */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-12"
          >
            <Card>
              <CardHeader>
                <CardTitle>Mes favoris</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Vous n'avez pas encore de vidéos en favoris.
                </p>
                <p className="text-sm text-muted-foreground text-center">
                  Cliquez sur le bouton de cœur sous une vidéo pour l'ajouter à vos favoris.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;
