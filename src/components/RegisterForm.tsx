import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Eye, EyeOff } from "lucide-react";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";
import PhoneInputWithCountry from "@/components/PhoneInputWithCountry";
import EmailInputWithSuffix from "@/components/EmailInputWithSuffix";

interface RegisterFormProps {
  onSuccess?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+225");
  const [showPassword, setShowPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
  const fullPhone = phone ? `${countryCode}${phone}` : "";

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
        phone: fullPhone,
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
            phone: fullPhone || null,
            role: 'member',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          if (avatar_url) {
            insertData.avatar_url = avatar_url;
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from('profiles').insert(insertData);

          // Fermer le modal si callback existe
          if (onSuccess) {
            setTimeout(() => {
              onSuccess();
              // Rediriger vers la page d'accueil
              setTimeout(() => navigate("/"), 300);
            }, 500);
          } else {
            navigate('/');
          }
        } catch (profileErr) {
          console.error('Profile creation failed:', profileErr);
          if (onSuccess) {
            setTimeout(() => {
              onSuccess();
              setTimeout(() => navigate("/"), 300);
            }, 500);
          } else {
            navigate('/');
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 w-full">
      {/* Section Avatar compacte en haut */}
      <div className="flex gap-4">
        <div className="flex flex-col items-center space-y-2">
          <div
            onClick={handleAvatarClick}
            className="relative w-32 h-32 rounded-full border-4 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors cursor-pointer bg-muted/30 overflow-hidden group"
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Aperçu avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera className="h-10 w-10 text-muted-foreground/50 group-hover:text-primary/70 transition-colors" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <Camera className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="hidden"
          />
          <p className="text-xs text-muted-foreground text-center">Avatar (optionnel)</p>
        </div>

        {/* Champs principaux */}
        <div className="flex-1 space-y-3">
          {/* Prénom + Nom sur une ligne */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1">Prénom *</label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                type="text"
                placeholder="Jean"
                required
                className="h-9"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1">Nom *</label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                type="text"
                placeholder="Dupont"
                required
                className="h-9"
              />
            </div>
          </div>

          {/* Email avec auto-complétion */}
          <div>
            <label className="block text-xs font-medium mb-1">Email *</label>
            <EmailInputWithSuffix email={email} onEmailChange={setEmail} />
          </div>

          {/* Mot de passe avec indicateur */}
          <div>
            <label className="block text-xs font-medium mb-1">Mot de passe *</label>
            <div className="relative">
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder="Au moins 8 caractères"
                required
                className="h-9 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <PasswordStrengthMeter password={password} />
          </div>

          {/* Téléphone avec indicatif */}
          <div>
            <label className="block text-xs font-medium mb-1">Téléphone</label>
            <PhoneInputWithCountry
              phone={phone}
              onPhoneChange={setPhone}
              countryCode={countryCode}
              onCountryChange={setCountryCode}
            />
          </div>
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={loading} className="flex-1 h-9">
          {loading ? "Création..." : "Créer mon compte"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        * Champs obligatoires
      </p>
    </form>
  );
};

export default RegisterForm;