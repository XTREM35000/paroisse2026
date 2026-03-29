import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Camera } from "lucide-react";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";
import PasswordField from '@/components/ui/password-field';
import PhoneInputWithCountry from "@/components/PhoneInputWithCountry";
import { EmailFieldPro } from "@/components/ui/email-field-pro";
import { ensureProfileExists } from "@/utils/ensureProfileExists";
import { isValidEmail } from "@/utils/emailSanitizer";
import { validateUsername } from "@/utils/username";
import EmailOtpVerification from './EmailOtpVerification';
import { supabase } from '@/integrations/supabase/client';
import { uploadPendingAvatar } from '@/utils/uploadPendingAvatar';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
  onCancel?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchToLogin, onCancel }) => {
  const { signUpWithEmail, login, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+225");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [pendingUserEmail, setPendingUserEmail] = useState<string | null>(null);

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

  /** Attendre que l’avatar soit bien écrit dans sessionStorage (évite course au clic rapide). */
  const persistPendingAvatar = (userId: string, file: File) =>
    new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          sessionStorage.setItem(
            'pending_avatar_upload',
            JSON.stringify({
              fileData: reader.result,
              fileName: `${userId}/${Date.now()}_avatar.${file.name.split('.').pop()}`,
              mimeType: file.type,
            }),
          );
          resolve();
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = () => reject(reader.error ?? new Error('FileReader error'));
      reader.readAsDataURL(file);
    });

  const isUsernameAvailable = async (usernameToCheck: string, exceptUserId: string | null = null): Promise<boolean> => {
    const { data: rpcData, error: rpcError } = await supabase.rpc('is_username_available', {
      p_username: usernameToCheck,
      p_except_user_id: exceptUserId,
    });

    if (!rpcError) {
      return rpcData !== false;
    }

    // Fallback when the RPC is not deployed yet (PGRST202 / function missing).
    if (
      rpcError.code === 'PGRST202' ||
      /Could not find the function/i.test(rpcError.message ?? '')
    ) {
      let query = supabase.from('profiles').select('id').eq('username', usernameToCheck).limit(1);
      if (exceptUserId) query = query.neq('id', exceptUserId);

      const { data: existing, error: existingErr } = await query;
      if (existingErr) {
        throw existingErr;
      }
      return !existing || (Array.isArray(existing) && existing.length === 0);
    }

    throw rpcError;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // EmailFieldPro : valeur complète (local + domaine sélectionné ou « Autre »)
    const emailToSubmit = email.trim();

    if (!emailToSubmit) {
      toast({
        title: '❌ Email requis',
        description: 'Veuillez compléter votre adresse email (identifiant + domaine).',
        variant: 'destructive',
      });
      return;
    }

    if (!isValidEmail(emailToSubmit)) {
      toast({
        title: '❌ Email invalide',
        description: 'Vérifiez l’identifiant et le domaine (ex. prenom.nom@gmail.com).',
        variant: 'destructive',
      });
      return;
    }

    const usernameNormalized = username.trim().toLowerCase();
    const usernameErr = validateUsername(usernameNormalized);
    if (usernameErr) {
      toast({
        title: '❌ Pseudo invalide',
        description: usernameErr,
        variant: 'destructive',
      });
      return;
    }

    if (!password.trim()) {
      toast({
        title: '❌ Mot de passe requis',
        description: 'Veuillez entrer un mot de passe',
        variant: 'destructive',
      });
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: '❌ Champs requis',
        description: 'Veuillez entrer votre prénom et votre nom',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      let usernameFree = false;
      try {
        usernameFree = await isUsernameAvailable(usernameNormalized, null);
      } catch (usernameCheckErr: any) {
        console.warn('is_username_available', usernameCheckErr);
        toast({
          title: 'Vérification du pseudo impossible',
          description: usernameCheckErr.message || 'Réessayez dans un instant.',
          variant: 'destructive',
        });
        return;
      }

      if (!usernameFree) {
        toast({
          title: 'Pseudo déjà utilisé',
          description: 'Ce pseudo est déjà utilisé',
          variant: 'destructive',
        });
        return;
      }

      // Rôle : laissé au trigger SQL (handle_auth_user_created) — évite un SELECT profiles avant signup
      // (anon / RLS) et aligne le flux sur un signUp minimal type curl.
      type AuthSignUpRes = {
        data?: { user?: { id?: string } | null; session?: unknown } | null;
      };
      const registerRes = (await signUpWithEmail(emailToSubmit, password, {
        full_name: fullName,
        phone: fullPhone || undefined,
        username: usernameNormalized,
      })) as unknown as AuthSignUpRes;

      const createdUser = registerRes?.data?.user ?? null;
      const hasSession = !!registerRes?.data?.session;

      // Session active = confirmation email désactivée côté projet : compléter profil / avatar tout de suite
      if (hasSession && createdUser?.id) {
        try {
          await ensureProfileExists(createdUser.id);
        } catch (profileErr) {
          console.error('ensureProfileExists après inscription:', profileErr);
        }
        if (avatarFile) {
          try {
            await persistPendingAvatar(createdUser.id, avatarFile);
            console.log('✅ Avatar stocké en sessionStorage (pending)');
          } catch (err) {
            console.error('Erreur stockage avatar en sessionStorage:', err);
          }
        }
        toast({
          title: '✅ Inscription réussie',
          description: 'Votre compte est prêt.',
        });
        if (onSuccess) {
          setTimeout(() => onSuccess(), 300);
        } else {
          setTimeout(() => navigate('/'), 300);
        }
        return;
      }

      // Pas de session : confirmation par email (comportement attendu si « Confirm email » est activé)
      if (createdUser?.id && avatarFile) {
        try {
          await persistPendingAvatar(createdUser.id, avatarFile);
        } catch (err) {
          console.error('Erreur stockage avatar en sessionStorage:', err);
        }
      }

      // Start OTP verification flow instead of showing a static confirmation page
      setPendingUserId(createdUser?.id ?? null);
      setPendingUserEmail(emailToSubmit);
      setShowOtp(true);
    } catch (err: unknown) {
      console.error('❌ Erreur lors de l\'enregistrement:', err);
      const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
      const code = (err as { code?: string })?.code;
      const already =
        msg.includes('already registered') ||
        msg.includes('already been registered') ||
        msg.includes('user already exists');
      if (already) {
        toast({
          title: 'Compte déjà existant',
          description: 'Cette adresse est déjà utilisée. Connectez-vous ou réinitialisez votre mot de passe.',
          variant: 'destructive',
        });
        onSwitchToLogin?.();
        return;
      }
      if (code === '23505' || msg.includes('unique') || msg.includes('duplicate')) {
        toast({
          title: 'Pseudo déjà utilisé',
          description: 'Ce pseudo est déjà utilisé',
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: '⚠️ Erreur lors de l\'inscription',
        description: err instanceof Error ? err.message : 'Veuillez réessayer ou vérifier votre email.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  const handleOtpSuccess = async () => {
    // Après vérif OTP côté serveur, sign in via la méthode contextuelle (pour mettre à jour le contexte Auth)
    setLoading(true);
    try {
      await login(pendingUserEmail ?? email, password);

      // Balance profile/role update dans le contexte pour Header User Menu
      if (refreshProfile) {
        try {
          await refreshProfile();
        } catch (refreshErr) {
          console.warn('refreshProfile failed after OTP signin:', refreshErr);
        }
      }

      const { data: { user: signedInUser } } = await supabase.auth.getUser();
      if (signedInUser?.id) {
        try {
          await ensureProfileExists(signedInUser.id);
        } catch (pErr) {
          console.error('ensureProfileExists after OTP signin', pErr);
        }
        try {
          await uploadPendingAvatar(signedInUser.id);
        } catch (uErr) {
          console.error('uploadPendingAvatar after OTP signin', uErr);
        }
      }

      toast({ title: '✅ Compte activé', description: 'Vous êtes connecté.' });
      setShowOtp(false);
      if (onSuccess) onSuccess();
      else navigate('/');
    } catch (err: any) {
      toast({ title: 'Erreur', description: err?.message || 'Impossible de se connecter', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (showOtp) {
    return (
      <div className="w-full">
        <EmailOtpVerification
          email={pendingUserEmail ?? email}
          userId={pendingUserId ?? undefined}
          onSuccess={handleOtpSuccess}
          onCancel={() => setShowOtp(false)}
        />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2 w-full text-sm">
      {/* Section Avatar compacte en haut */}
      <div className="flex gap-3">
        <div className="flex flex-col items-center space-y-1 flex-shrink-0">
          <div
            onClick={handleAvatarClick}
            className="relative w-20 h-20 rounded-full border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors cursor-pointer bg-muted/30 overflow-hidden group"
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Aperçu avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary/70 transition-colors" />
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
          <div>
            <label className="block text-xs font-medium mb-0.5">Pseudo *</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
              type="text"
              autoComplete="username"
              placeholder="ex. developpeur2026"
              required
              className="h-8 text-xs"
            />
            <p className="text-[10px] text-muted-foreground mt-0.5">3–30 caractères : lettres, chiffres, _ .</p>
          </div>
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

          {/* Email avec sélecteur de domaine (composant réutilisable) */}
          <EmailFieldPro
            value={email}
            onChange={setEmail}
            label="Email"
            required
            onValidationChange={() => {}}
            className="h-8 text-xs"
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
      <div className="flex items-center justify-end gap-2 pt-1">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="h-8 text-xs"
          >
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={loading} className="h-8 text-xs">
          {loading ? "Création..." : "Créer mon compte"}
        </Button>
      </div>

      {/* Providers removed for registration to simplify signup flow. */}

      <p className="text-xs text-muted-foreground text-center py-1">
        * Champs obligatoires
      </p>
    </form>
  );
};

export default RegisterForm;