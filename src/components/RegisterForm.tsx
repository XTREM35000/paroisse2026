import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Facebook } from "lucide-react";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";
import PasswordField from '@/components/ui/password-field';
import PhoneInputWithCountry from "@/components/PhoneInputWithCountry";
import { EmailFieldPro } from "@/components/ui/email-field-pro";

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const { register, signInWithProvider } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
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
      // Déterminer le rôle à attribuer (premier utilisateur = admin, deuxième = moderateur)
      // Utiliser les valeurs canoniques françaises acceptées par la contrainte CHECK
      let assignedRole = 'membre';
      try {
        const { data: countData, error: countErr, count } = await (supabase as any)
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        if (!countErr) {
          if (typeof count === 'number' && count === 0) assignedRole = 'admin';
          else if (typeof count === 'number' && count === 1) assignedRole = 'moderateur';
        }
      } catch (err) {
        console.error('Impossible de compter les profiles, assignation par défaut:', err);
      }

      // 1) Créer l'utilisateur d'abord et récupérer la réponse
      const registerRes: any = await register(email, password, {
        full_name: fullName,
        phone: fullPhone,
        role: assignedRole,
      });

      // Essayer d'extraire l'utilisateur depuis la réponse
      let createdUser = registerRes?.data?.user ?? null;

      // Si l'utilisateur n'est pas dans la réponse, attendre qu'il apparaisse via getUser()
      if (!createdUser) {
        const maxAttempts = 8;
        const delayMs = 300;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          try {
            const resp = await supabase.auth.getUser();
            const maybeUser = resp?.data?.user ?? null;
            if (maybeUser) {
              createdUser = maybeUser;
              break;
            }
          } catch (e) {
            // ignore and retry
          }
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }

      // If still no createdUser, throw so we don't create a profile without id
      if (!createdUser) {
        throw new Error('User not available after registration; profile creation aborted');
      }

      // 2) Stocker l'avatar dans sessionStorage pour upload au premier login
      // (On ne peut pas uploader immédiatement car pas de session après signUp)
      if (createdUser && avatarFile) {
        try {
          console.log('💾 Stockage de l\'avatar en sessionStorage pour upload ultérieur...');
          
          // Convertir le fichier en base64 pour stockage
          const reader = new FileReader();
          reader.onload = () => {
            const avatarData = {
              fileData: reader.result, // base64
              fileName: `${createdUser.id}/${Date.now()}_avatar.${avatarFile.name.split('.').pop()}`,
              mimeType: avatarFile.type,
            };
            sessionStorage.setItem('pending_avatar_upload', JSON.stringify(avatarData));
            console.log('✅ Avatar stocké en sessionStorage');
          };
          reader.readAsDataURL(avatarFile);
        } catch (err) {
          console.error('Erreur stockage avatar en sessionStorage:', err);
        }
      }

      // 3) Les données sont déjà sauvegardées dans les metadata lors du register() dans useAuth
      // On affiche juste le toast de confirmation
      toast({
        title: '✅ Inscription réussie',
        description: 'Un email de confirmation a été envoyé. Veuillez vérifier votre boîte mail pour confirmer votre compte.',
        variant: 'default',
      });
      
      if (onSuccess) {
        setTimeout(() => {
          // Revenir à l'onglet connexion au lieu de fermer
          onSwitchToLogin?.();
        }, 500);
      } else {
        setTimeout(() => {
          navigate('/');
        }, 500);
      }
    } catch (err) {
      console.error('❌ Erreur lors de l\'enregistrement:', err);
      // Afficher quand même le toast car l'utilisateur peut être créé même avec une erreur partielle
      toast({
        title: '⚠️ Erreur lors de l\'inscription',
        description: 'Une erreur est survenue, mais votre compte peut avoir été créé. Veuillez vérifier votre email.',
        variant: 'default',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-2 w-full text-sm">
      {/* Section Avatar compacte en haut */}
      <div className="flex gap-3">
        <div className="flex flex-col items-center space-y-1 flex-shrink-0">
          <div
            onClick={handleAvatarClick}
            className="relative w-24 h-24 rounded-full border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors cursor-pointer bg-muted/30 overflow-hidden group"
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Aperçu avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera className="h-6 w-6 text-muted-foreground/50 group-hover:text-primary/70 transition-colors" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <Camera className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="hidden"
          />
          <p className="text-xs text-muted-foreground text-center">Avatar</p>
        </div>

        {/* Champs principaux */}
        <div className="flex-1 space-y-2">
          {/* Prénom + Nom sur une ligne */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium mb-0.5">Prénom *</label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                type="text"
                placeholder="Jean"
                required
                className="h-8 text-xs"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium mb-0.5">Nom *</label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                type="text"
                placeholder="Dupont"
                required
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Email avec auto-complétion */}
          <EmailFieldPro
            value={email}
            onChange={setEmail}
            label="Email"
            required
            onValidationChange={() => {}}
          />

          {/* Mot de passe avec indicateur */}
          <div>
            <label className="block text-xs font-medium mb-0.5">Mot de passe *</label>
            <PasswordField
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Au moins 8 caractères"
              required
              className="h-9"
            />
            <PasswordStrengthMeter password={password} />
          </div>

          {/* Téléphone avec indicatif */}
          <div>
            <label className="block text-xs font-medium mb-0.5">Téléphone</label>
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
      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={loading} className="flex-1 h-8 text-xs">
          {loading ? "Création..." : "Créer mon compte"}
        </Button>
      </div>

      <Separator className="my-2" />

      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground text-center">Ou continuer avec</p>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            type="button" 
            onClick={() => signInWithProvider('facebook')} 
            className="flex-1 h-8 text-xs flex items-center justify-center gap-1"
            disabled={loading}
          >
            <Facebook className="w-4 h-4" />
            Facebook
          </Button>
          <Button 
            variant="outline" 
            type="button" 
            onClick={() => signInWithProvider('google')} 
            className="flex-1 h-8 text-xs"
            disabled={loading}
          >
            Google
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center py-1">
        * Champs obligatoires
      </p>
    </form>
  );
};

export default RegisterForm;