import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, LogOut, Save, Edit2, Upload, Camera } from 'lucide-react';
import Header from '@/components/Header';
import HeroBanner from '@/components/HeroBanner';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

interface UserData {
  full_name: string;
  phone: string;
  avatar_url: string;
  email: string;
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, isLoading: profileLoading } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [userData, setUserData] = useState<UserData>({
    full_name: '',
    phone: '',
    avatar_url: '',
    email: '',
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
      });
    } else if (user) {
      setUserData((prev) => ({ 
        ...prev, 
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
        phone: user.user_metadata?.phone || '',
        avatar_url: user.user_metadata?.avatar_url || '',
      }));
    }
  }, [user, profile, navigate]);

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
      const profileUpdates: Database['public']['Tables']['profiles']['Update'] = {
        full_name: userData.full_name,
        avatar_url: updatedAvatarUrl,
      };
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update user metadata (phone, full_name)
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          full_name: userData.full_name,
          phone: userData.phone,
          avatar_url: updatedAvatarUrl,
        },
      });

      if (metadataError) throw metadataError;

      setUserData((prev) => ({ ...prev, avatar_url: updatedAvatarUrl }));
      setAvatarFile(null);
      setAvatarPreview(null);
      setIsEditing(false);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
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
        backgroundImage="/images/bapteme.png"
      />

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
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="infos">Mes informations</TabsTrigger>
                  <TabsTrigger value="account">Compte</TabsTrigger>
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
                        <div className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                          Membre
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
