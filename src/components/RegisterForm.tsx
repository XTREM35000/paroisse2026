import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Camera } from "lucide-react";

const RegisterForm: React.FC = () => {
  const { register, signInWithProvider } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAvatarClick = () => {
    document.getElementById("avatar-upload")?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1) Créer l'utilisateur d'abord
      await register(email, password, {
        full_name: fullName,
        phone,
      });

      // Récupérer l'utilisateur courant depuis Supabase
      const userResp = await supabase.auth.getUser();
      const createdUser = userResp.data?.user;

      let avatar_url: string | undefined;

      // 2) Si on a un user.id et un fichier avatar, uploader dans le dossier userId/
      if (createdUser && avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${createdUser.id}/${Date.now()}_avatar.${fileExt}`;
        try {
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, avatarFile, { upsert: true });
          if (uploadError) throw uploadError;

          const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(fileName);
          avatar_url = publicData.publicUrl;
        } catch (err) {
          console.error('Upload avatar failed:', err);
        }
      }

      // 3) Créer l'entrée dans la table profiles
      if (createdUser) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const insertData: any = {
            id: createdUser.id,
            email: createdUser.email,
            full_name: fullName || null,
            phone: phone || null,
            role: 'membre',
            is_verified: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          if (avatar_url) {
            insertData.avatar_url = avatar_url;
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from('profiles').insert(insertData);

          navigate('/');
        } catch (profileErr) {
          console.error('Profile creation failed:', profileErr);
          navigate('/');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6 w-full max-w-4xl">
      {/* Conteneur principal avec mise en page sur deux colonnes */}
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Section Avatar à gauche */}
        <div className="md:w-1/3 flex flex-col items-center space-y-4">
          <div className="text-center mb-2">
            <h3 className="text-lg font-semibold">Votre avatar</h3>
            <p className="text-sm text-muted-foreground">Cliquez pour choisir une image</p>
          </div>
          
          {/* Zone de sélection d'avatar cliquable */}
          <div 
            onClick={handleAvatarClick}
            className="relative w-48 h-48 rounded-full border-4 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors cursor-pointer bg-muted/30 overflow-hidden group"
          >
            {/* Aperçu de l'image ou placeholder */}
            {avatarPreview ? (
              <img 
                src={avatarPreview} 
                alt="Aperçu avatar" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {/* Icône d'appareil photo stylisée */}
                <Camera className="h-16 w-16 text-muted-foreground/50 group-hover:text-primary/70 transition-colors" />
              </div>
            )}
            
            {/* Overlay pour l'effet de survol */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <Camera className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          
          {/* Input file caché */}
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="hidden"
          />
          
          {/* Indicateur de fichier sélectionné */}
          {avatarFile && (
            <p className="text-sm text-center text-muted-foreground">
              ✓ {avatarFile.name.substring(0, 20)}
              {avatarFile.name.length > 20 ? "..." : ""}
            </p>
          )}
          
          {/* Boutons sociaux optionnels pourraient aller ici */}
        </div>
        
        {/* Section formulaire à droite */}
        <div className="md:w-2/3 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nom complet *</label>
            <Input 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              type="text"
              placeholder="Votre nom et prénom"
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Email *</label>
            <Input 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              type="email" 
              placeholder="votre@email.com"
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Mot de passe *</label>
            <Input 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              type="password" 
              placeholder="Minimum 6 caractères"
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Téléphone</label>
            <Input 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              type="tel" 
              placeholder="+225 XX XX XX XX"
            />
          </div>
        </div>
      </div>
      
      {/* Boutons d'action */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Création du compte..." : "Créer mon compte"}
        </Button>
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          {/* <Button 
            variant="outline" 
            type="button" 
            onClick={() => signInWithProvider("google")}
            className="flex-1"
          >
            Continuer avec Google
          </Button> */}
          <Button 
            variant="outline" 
            type="button" 
            onClick={() => navigate('/connexion')}
            className="flex-1"
          >
            Déjà un compte ? Se connecter
          </Button>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground text-center pt-2">
        * Champs obligatoires. Votre avatar est facultatif et peut être ajouté plus tard.
      </p>
    </form>
  );
};

export default RegisterForm;