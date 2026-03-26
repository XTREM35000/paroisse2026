// src\components\SetupWizardModal.tsx
// 
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DraggableModal from './DraggableModal';
import { initFirstParoisseAndUser, uploadImageToStorage } from '@/lib/setupWizard';
import { useSetup } from '@/contexts/SetupContext';
import type { HomepageSectionRow } from '@/lib/setupWizard';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, Loader2, Camera, UserCircle2, Church, BookOpen, Sparkles, Mail, UserCog, Trash2 } from 'lucide-react';
import PasswordField from '@/components/ui/password-field';
import { Checkbox } from '@/components/ui/checkbox';
import { isValidEmail } from '@/utils/emailSanitizer';
import { RestoreFromFileModal } from '@/components/admin-master/RestoreFromFileModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { ensureProfileExists } from '@/utils/ensureProfileExists';
import { uploadPendingAvatar } from '@/utils/uploadPendingAvatar';

type FormState = {
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  heroButtonLink: string;
  heroImageUrl?: string;

  featuresTitle: string;
  featuresContent: string;

  testimonialsTitle: string;
  testimonialsContent: string;

  aboutContent: string;

  brandingName: string;
  brandingLogo?: string;
  brandingEmail: string;

  footerAddress: string;
  footerEmail: string;
  footerModeratorPhone: string;
  footerSuperAdminPhone: string;
  footerSuperAdminEmail: string;
  footerFacebookUrl: string;
  footerYoutubeUrl: string;
  footerInstagramUrl: string;
  footerWhatsappUrl: string;
  footerCopyrightText: string;

  // Header fields
  headerLogo?: string;
  headerMainTitle: string;
  headerSubtitle: string;
};

type ImageField = 'heroImageUrl' | 'brandingLogo' | 'headerLogo';

const WIZARD_STEPS = 5;

export default function SetupWizardModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { markCompleted } = useSetup();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDevBootstrap, setShowDevBootstrap] = useState(false);
  const [hasBackups, setHasBackups] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ADMIN_UNLOCK_CODE = '2022';
  const [adminUnlockOpen, setAdminUnlockOpen] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [adminUnlockError, setAdminUnlockError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [adminFullName, setAdminFullName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [useGravatar, setUseGravatar] = useState(false);
  const [adminAvatarFile, setAdminAvatarFile] = useState<File | null>(null);
  const [adminAvatarPreview, setAdminAvatarPreview] = useState<string | null>(null);
  const adminAvatarInputRef = useRef<HTMLInputElement>(null);

  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpResendCooldown, setOtpResendCooldown] = useState(0);
  const [pendingUser, setPendingUser] = useState<{ id?: string; email?: string } | null>(null);

  const [devEmail, setDevEmail] = useState('dibothierrygogo@gmail.com');
  const [devPassword, setDevPassword] = useState('P2024Mano"');
  const [devBootstrapError, setDevBootstrapError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    heroTitle: 'Bienvenue sur notre paroisse',
    heroSubtitle: 'Une communauté de foi et de service',
    heroButtonText: 'Découvrir',
    heroButtonLink: '/homepage',
    heroImageUrl: undefined,
    featuresTitle: 'Nos activités',
    featuresContent: JSON.stringify([{ title: 'Messes', description: 'Messes dominicales et festivités' }], null, 2),
    testimonialsTitle: 'Témoignages',
    testimonialsContent: JSON.stringify([{ name: 'Jean', text: 'Une belle communauté de foi.' }], null, 2),
    aboutContent: JSON.stringify({ history: '', mission: '', values: '', team: [] }, null, 2),
    brandingName: user?.email?.split('@')[0] ?? 'Ma Paroisse',
    brandingLogo: undefined,
    brandingEmail: user?.email ?? 'contact@paroisse.local',
    footerAddress: '',
    footerEmail: user?.email ?? 'contact@paroisse.local',
    footerModeratorPhone: '',
    footerSuperAdminPhone: '',
    footerSuperAdminEmail: '',
    footerFacebookUrl: '',
    footerYoutubeUrl: '',
    footerInstagramUrl: '',
    footerWhatsappUrl: '',
    footerCopyrightText: `© ${new Date().getFullYear()} Ma Paroisse`,
    headerLogo: undefined,
    headerMainTitle: user?.email?.split('@')[0] ?? 'Ma Paroisse',
    headerSubtitle: 'Une communauté de foi et de service',
  });

  // Illustration images per step (public free icons)
  const stepImages = [
    'https://cdn-icons-png.flaticon.com/512/6193/6193613.png',
    'https://cdn-icons-png.flaticon.com/512/2598/2598641.png',
    'https://cdn-icons-png.flaticon.com/512/2971/2971976.png',
    'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
    'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
  ];

  const stepIcons = [Church, BookOpen, Sparkles, Mail, UserCog];

  const progress = useMemo(() => Math.round(((step + 1) / WIZARD_STEPS) * 100), [step]);

  useEffect(() => {
    let cancelled = false;
    const checkBackups = async () => {
      try {
        const { count, error: countError } = await supabase
          .from('backups')
          .select('*', { count: 'exact', head: true });
        if (countError) throw countError;
        if (!cancelled) setHasBackups((count ?? 0) > 0);
      } catch {
        if (!cancelled) setHasBackups(false);
      }
    };
    checkBackups();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (step !== 3) return;
    setForm(prev => ({
      ...prev,
      footerEmail: prev.footerEmail.trim() ? prev.footerEmail : prev.brandingEmail,
    }));
  }, [step]);

  useEffect(() => {
    if (step !== 4) return;
    setAdminEmail(prev => (prev.trim() ? prev : form.brandingEmail));
    setAdminPhone(prev => (prev.trim() ? prev : form.footerSuperAdminPhone.trim() || form.footerModeratorPhone.trim()));
  }, [step, form.brandingEmail]);

  // Security/UX: reset the unlock state when the modal closes.
  useEffect(() => {
    if (!open) {
      setAdminUnlockOpen(false);
      setAdminUnlocked(false);
      setAdminCode('');
      setAdminUnlockError(null);
    }
  }, [open]);

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm(prev => ({ ...prev, [k]: v }));
  };

  const triggerImageUpload = (field: ImageField) => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
      (fileInputRef.current as any).dataset.field = field;
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: ImageField) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(field);
    setError(null);
    try {
      const folder = field === 'heroImageUrl' ? 'hero' : field === 'brandingLogo' ? 'branding' : 'header';
      const url = await uploadImageToStorage(file, folder);
      if (!url) throw new Error('Échec du téléchargement');
      setField(field, url);
    } catch (err: any) {
      setError(`Erreur upload ${field}: ${err.message}`);
    } finally {
      setUploading(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const validateStep = () => {
    if (step === 0) {
      return !!form.heroTitle && !!form.featuresTitle;
    }
    if (step === 1) {
      return !!form.aboutContent;
    }
    if (step === 2) {
      return !!form.brandingName && !!form.brandingEmail;
    }
    if (step === 3) {
      return !!form.footerEmail.trim() && isValidEmail(form.footerEmail.trim());
    }
    if (step === 4) {
      return (
        adminFullName.trim().length >= 2 &&
        isValidEmail(adminEmail.trim()) &&
        adminPassword.length >= 6 &&
        adminPhone.trim().length >= 6 &&
        (useGravatar || !!adminAvatarFile)
      );
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return setError('Veuillez remplir les champs requis (*)');
    setError(null);
    setStep(s => Math.min(WIZARD_STEPS - 1, s + 1));
  };

  const handlePrev = () => {
    setError(null);
    setStep(s => Math.max(0, s - 1));
  };

  const handleFinish = async () => {
    if (!validateStep()) return setError('Veuillez remplir les champs requis (*)');
    setError(null);
    setLoading(true);
    try {
      const sections: HomepageSectionRow[] = [
        {
          section_key: 'hero',
          title: form.heroTitle,
          subtitle: form.heroSubtitle,
          content: null,
          image_url: form.heroImageUrl ?? null,
          display_order: 0,
          is_active: true,
        },
        {
          section_key: 'features',
          title: form.featuresTitle,
          content: JSON.parse(form.featuresContent || '[]'),
          display_order: 1,
          is_active: true,
        },
        {
          section_key: 'testimonials',
          title: form.testimonialsTitle,
          content: JSON.parse(form.testimonialsContent || '[]'),
          display_order: 2,
          is_active: true,
        },
      ];

      const about = JSON.parse(form.aboutContent || '{}');
      const branding = {
        name: form.brandingName,
        logo: form.brandingLogo ?? null,
        email: form.brandingEmail,
        phone: form.footerModeratorPhone.trim() || null,
        address: form.footerAddress.trim() || null,
        footer_text: form.footerCopyrightText.trim() || null,
      };

      const footer = {
        address: form.footerAddress.trim() || null,
        email: form.footerEmail.trim(),
        moderator_phone: form.footerModeratorPhone.trim() || null,
        super_admin_phone: form.footerSuperAdminPhone.trim() || null,
        super_admin_email: form.footerSuperAdminEmail.trim() || null,
        facebook_url: form.footerFacebookUrl.trim() || null,
        youtube_url: form.footerYoutubeUrl.trim() || null,
        instagram_url: form.footerInstagramUrl.trim() || null,
        whatsapp_url: form.footerWhatsappUrl.trim() || null,
        copyright_text: form.footerCopyrightText.trim() || null,
      };

      const help = { faq: [] };

      const setupPayload = {
        sections,
        about,
        branding,
        footer,
        help,
        headerLogo: form.headerLogo,
        headerMainTitle: form.headerMainTitle,
        headerSubtitle: form.headerSubtitle,
      };

      const { authData } = await initFirstParoisseAndUser(
        setupPayload,
        {
          full_name: adminFullName.trim(),
          email: adminEmail.trim(),
          password: adminPassword,
          phone: adminPhone.trim(),
          useGravatar: useGravatar && !adminAvatarFile,
        },
        adminAvatarFile,
      );

      await queryClient.invalidateQueries({ queryKey: ['header-config'] });
      await queryClient.invalidateQueries({ queryKey: ['footer-config'] });

      if (authData.session) {
        markCompleted();
        onClose();
        window.location.assign('/admin');
        return;
      }

      // OTP email instead of confirmation link
      setPendingUser({
        id: authData.user?.id,
        email: authData.user?.email ?? adminEmail.trim(),
      });
      await sendOtp(adminEmail.trim(), authData.user?.id);
      setShowOtp(true);
      setOtpCode('');
      setOtpError('');
    } catch (err: unknown) {
      console.error(err);
      const e = err as { message?: string; code?: string };
      const raw =
        (typeof e?.message === 'string' && e.message !== '[object Object]' ? e.message : '') ||
        e?.code ||
        (err instanceof Error ? err.message : '');
      setError(raw || JSON.stringify(err));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setOtpLoading(true);
    setOtpError('');
    try {
      const email = adminEmail.trim();
      const code = otpCode.trim();
      if (!/^\d{4}$/.test(code)) {
        setOtpError('Veuillez saisir un code à 4 chiffres.');
        return;
      }

      const { data, error: fnErr } = await supabase.functions.invoke('verify-email-otp', {
        body: { email, code },
      });
      if (fnErr) throw fnErr;
      if (!data?.success) {
        throw new Error(data?.error || 'Code incorrect.');
      }

      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password: adminPassword,
      });
      if (signInErr) throw signInErr;

      const {
        data: { user: signedInUser },
      } = await supabase.auth.getUser();
      if (signedInUser?.id) {
        await ensureProfileExists(signedInUser.id);
        await uploadPendingAvatar(signedInUser.id);
      }

      markCompleted();
      onClose();
      window.location.assign('/admin');
    } catch (e: any) {
      setOtpError(e?.message || 'Impossible de vérifier le code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const sendOtp = async (email: string, userId?: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const { error: fnError } = await supabase.functions.invoke('send-email-otp', {
      body: { email: normalizedEmail, user_id: userId ?? pendingUser?.id ?? null },
    });
    if (fnError) throw fnError;
    setShowOtp(true);
    setOtpResendCooldown(60);
  };

  useEffect(() => {
    if (otpResendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setOtpResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [otpResendCooldown]);

  const resendOtp = async () => {
    if (otpResendCooldown > 0) return;
    setOtpLoading(true);
    setOtpError('');
    try {
      await sendOtp(pendingUser?.email ?? adminEmail.trim(), pendingUser?.id);
    } catch (e: any) {
      setOtpError(e?.message || "Impossible de renvoyer le code.");
    } finally {
      setOtpLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <DraggableModal
        open={open}
        onClose={onClose}
      draggableOnMobile={true}
      dragHandleOnly={false}
      verticalOnly={false}
      center={true}
      maxWidthClass="max-w-5xl"
      title={
        <div className="flex items-center justify-between w-full">
          <div>
            <h3 className="text-2xl font-bold text-primary drop-shadow-sm">
              Assistant de configuration
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Configurez votre paroisse en 5 étapes</p>
          </div>
          <div className="text-right flex flex-col items-end gap-3 pl-6">
            <div className="flex items-center gap-2 mt-1">
              {!adminUnlocked ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    disabled={loading}
                    onClick={() => {
                      setAdminUnlockError(null);
                      setAdminUnlockOpen((v) => !v);
                    }}
                  >
                    <UserCircle2 className="mr-2 h-4 w-4" />
                    Admin
                  </Button>

                  {adminUnlockOpen ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="password"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="Code (2022)"
                        className="w-28"
                        value={adminCode}
                        disabled={loading}
                        onChange={(e) => {
                          setAdminCode(e.target.value);
                          setAdminUnlockError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key !== 'Enter') return;
                          if (adminCode.trim() === ADMIN_UNLOCK_CODE) {
                            setAdminUnlocked(true);
                            setAdminUnlockOpen(false);
                            setAdminUnlockError(null);
                            setAdminCode('');
                          } else {
                            setAdminUnlockError('Code incorrect.');
                          }
                        }}
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        type="button"
                        disabled={loading}
                        onClick={() => {
                          if (adminCode.trim() === ADMIN_UNLOCK_CODE) {
                            setAdminUnlocked(true);
                            setAdminUnlockOpen(false);
                            setAdminUnlockError(null);
                            setAdminCode('');
                          } else {
                            setAdminUnlockError('Code incorrect.');
                          }
                        }}
                      >
                        Valider
                      </Button>
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={async () => {
                      setLoading(true);
                      setError(null);
                      try {
                        const { error: initErr } = await supabase.rpc('ensure_developer_account');
                        if (initErr) {
                          const { error: legacyErr } = await supabase.rpc('ensure_developer_exists');
                          if (legacyErr) throw legacyErr;
                        }

                        const { error: signInErr } = await supabase.auth.signInWithPassword({
                          email: devEmail.trim(),
                          password: devPassword,
                        });
                        if (signInErr) {
                          // Open the bootstrap modal so the operator can correct email/password.
                          // The modal now avoids `/auth/v1/signup` if the user already exists.
                          setShowDevBootstrap(true);
                          return;
                        }

                        const {
                          data: { user: signedInUser },
                        } = await supabase.auth.getUser();
                        if (signedInUser?.id) {
                          await ensureProfileExists(signedInUser.id);
                          await uploadPendingAvatar(signedInUser.id);
                        }

                        markCompleted();
                        onClose();
                        window.location.assign('/admin');
                      } catch (e: any) {
                        setError(e?.message || 'Connexion SYSTEM impossible.');
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    <UserCog className="mr-2 h-4 w-4" />
                    SYSTEM
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    className="text-muted-foreground hover:text-red-500"
                    disabled={loading}
                    onClick={async () => {
                      const ok = confirm(
                        '⚠️ NETTOYAGE COMPLET\n\nCette action supprimera TOUTES les données (paroisses, vidéos, événements, etc.) sauf le compte développeur et la paroisse SYSTEM.\n\nConfirmer ?',
                      );
                      if (!ok) return;

                      setLoading(true);
                      setError(null);
                      try {
                        const { error: resetErr } = await supabase.rpc('reset_all_data');
                        if (resetErr) throw resetErr;

                        // Ensure dev/system are present after reset (defensive).
                        const { error: initErr } = await supabase.rpc('ensure_developer_account');
                        if (initErr) {
                          const { error: legacyErr } = await supabase.rpc('ensure_developer_exists');
                          if (legacyErr) throw legacyErr;
                        }

                        window.location.reload();
                      } catch (e: any) {
                        setError(e?.message || 'RESET impossible.');
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    RESET
                  </Button>
                </>
              )}
            </div>

            {adminUnlockOpen && !adminUnlocked && adminUnlockError ? (
              <div className="text-xs text-destructive">{adminUnlockError}</div>
            ) : null}

            <div>
              <div className="text-3xl font-bold text-primary">{step + 1}</div>
              <div className="text-xs text-muted-foreground">sur 5</div>
            </div>
          </div>
        </div>
      }
      headerClassName="bg-gradient-to-r from-primary/10 to-transparent"
    >
      <div className="bg-background text-foreground rounded-lg shadow-2xl w-full max-w-5xl mx-4 overflow-hidden border border-border">
        {/* Progress Bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
          <div className="flex max-h-[calc(90vh-180px)] bg-gradient-animated rounded-lg">
          {/* Form Panel */}
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-3">
                Vous avez déjà configuré une paroisse ? Vous pouvez restaurer une sauvegarde.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  type="button"
                  disabled={!hasBackups}
                  onClick={() => setShowRestoreModal(true)}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {hasBackups ? 'Restaurer une sauvegarde' : 'Aucune sauvegarde disponible'}
                </Button>
              </div>
            </div>

            {/* Step 0..4: steps - animated container */}
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="step-0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.28 }}
                >
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-background/60 border border-border">
                      <img src={stepImages[0]} alt="" className="h-10 w-10 object-contain" />
                      <div className="leading-tight">
                        <div className="text-sm font-semibold">🏠 Accueil & Header</div>
                        <div className="text-xs text-muted-foreground">En-tête, hero et activités.</div>
                      </div>
                    </div>
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg flex items-center gap-3">
                      <motion.div animate={{ rotate: [0, 6, -6, 0] }} transition={{ duration: 0.6 }}>
                        <Church className="h-6 w-6 text-primary" />
                      </motion.div>
                      <div>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          <strong>✨ Donnez vie à votre paroisse en ligne</strong><br />
                          Configurez l'en-tête, le message principal et la section des activités.
                        </p>
                      </div>
                    </div>
                {/* Header configuration (visible on first step so admin can set title/logo early) */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Logo du header</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={form.headerLogo ?? ''}
                      onChange={e => setField('headerLogo', e.target.value)}
                      placeholder="URL du logo du header..."
                    />
                    <button
                      onClick={() => triggerImageUpload('headerLogo')}
                      disabled={uploading === 'headerLogo'}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 font-medium"
                    >
                      {uploading === 'headerLogo' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      Upload
                    </button>
                  </div>
                  {form.headerLogo && (
                    <div className="mt-2 text-xs text-green-600 bg-green-50 dark:bg-green-950 p-2 rounded">
                      ✓ Logo du header chargé
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Titre principal (header)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.headerMainTitle}
                    onChange={e => setField('headerMainTitle', e.target.value)}
                    placeholder="Ex: Paroisse Notre-Dame de la Compassion – Abidjan"
                  />
                  <p className="text-xs text-muted-foreground">Exemple: Paroisse Notre-Dame de la Compassion – Abidjan</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Sous-titre (header)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.headerSubtitle}
                    onChange={e => setField('headerSubtitle', e.target.value)}
                    placeholder="Ex: Une communauté vivante au service de la foi et de la fraternité"
                  />
                  <p className="text-xs text-muted-foreground">Exemple: Une communauté vivante au service de la foi et de la fraternité</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Titre principal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.heroTitle}
                    onChange={e => setField('heroTitle', e.target.value)}
                    placeholder="Ex: Bienvenue sur notre paroisse"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Sous-titre</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.heroSubtitle}
                    onChange={e => setField('heroSubtitle', e.target.value)}
                    placeholder="Ex: Une communauté de foi et de service"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Texte bouton</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      value={form.heroButtonText}
                      onChange={e => setField('heroButtonText', e.target.value)}
                      placeholder="Ex: Découvrir"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Lien bouton</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      value={form.heroButtonLink}
                      onChange={e => setField('heroButtonLink', e.target.value)}
                      placeholder="/homepage"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Image hero</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={form.heroImageUrl ?? ''}
                      onChange={e => setField('heroImageUrl', e.target.value)}
                      placeholder="URL de l'image..."
                    />
                    <button
                      onClick={() => triggerImageUpload('heroImageUrl')}
                      disabled={uploading === 'heroImageUrl'}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 font-medium"
                    >
                      {uploading === 'heroImageUrl' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      Upload
                    </button>
                  </div>
                  {form.heroImageUrl && (
                    <div className="mt-2 text-xs text-green-600 bg-green-50 dark:bg-green-950 p-2 rounded">
                      ✓ Image chargée
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    📐 Dimension recommandée : <strong>1500 x 800 pixels</strong> (format paysage).<br />
                    Outils gratuits : <a href="https://www.canva.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">Canva</a>,
                    <a href="https://www.photopea.com" target="_blank" rel="noopener noreferrer" className="text-primary underline ml-1"> Photopea</a> ou
                    <a href="https://www.iloveimg.com/resize-image" target="_blank" rel="noopener noreferrer" className="text-primary underline ml-1"> iLoveIMG</a>.
                    Une image trop petite ou mal proportionnée peut déséquilibrer l'affichage.
                  </p>
                </div>

                <div className="border-t border-border pt-6">
                  <label className="block text-sm font-semibold mb-2">
                    Titre section activités <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.featuresTitle}
                    onChange={e => setField('featuresTitle', e.target.value)}
                    placeholder="Ex: Nos activités et célébrations"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Contenu (JSON)</label>
                  <textarea
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm h-32"
                    value={form.featuresContent}
                    onChange={e => setField('featuresContent', e.target.value)}
                    placeholder="[{...}]"
                  />
                </div>
              </div>
                </motion.div>
              )}

            {/* Step 1: About */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.28 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/60 border border-border">
                  <img src={stepImages[1]} alt="" className="h-10 w-10 object-contain" />
                  <div className="leading-tight">
                    <div className="text-sm font-semibold">📖 À propos</div>
                    <div className="text-xs text-muted-foreground">Histoire, mission, valeurs, équipe.</div>
                  </div>
                </div>
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    📖 <strong>Étape 2/5 : Page "À propos"</strong><br />
                    Présentez l'histoire, la mission et les valeurs de votre paroisse.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Contenu "À Propos" <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Format JSON pour stocker l'historique, la mission, les valeurs et l'équipe
                  </p>
                  <textarea
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm h-96"
                    value={form.aboutContent}
                    onChange={e => setField('aboutContent', e.target.value)}
                    placeholder={
`{
  "history": "La paroisse a été fondée en ...",
  "mission": "Annoncer l'Évangile et servir la communauté",
  "values": ["Foi", "Espérance", "Charité"],
  "team": [
    {"name": "Père Basile", "role": "Curé", "photo": "url"}
  ]
}`
                    }
                  />
                </div>
              </motion.div>
            )}

            {/* Step 2: Branding */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.28 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/60 border border-border">
                  <img src={stepImages[2]} alt="" className="h-10 w-10 object-contain" />
                  <div className="leading-tight">
                    <div className="text-sm font-semibold">🏷️ Branding</div>
                    <div className="text-xs text-muted-foreground">Nom, logo, email principal.</div>
                  </div>
                </div>
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    🏷️ <strong>Étape 3/5 : Identité de la paroisse</strong><br />
                    Le nom, le logo et l'email principal qui apparaîtront sur tout le site.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Nom de la paroisse <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      value={form.brandingName}
                      onChange={e => setField('brandingName', e.target.value)}
                      placeholder="Ex: Notre-Dame de la Compassion"
                    />
                    <p className="text-xs text-muted-foreground">Ce nom apparaîtra dans le logo et le pied de page</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Email contact <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      value={form.brandingEmail}
                      onChange={e => setField('brandingEmail', e.target.value)}
                      placeholder="contact@votre-paroisse.ci"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Logo</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={form.brandingLogo ?? ''}
                      onChange={e => setField('brandingLogo', e.target.value)}
                      placeholder="URL du logo..."
                    />
                    <button
                      onClick={() => triggerImageUpload('brandingLogo')}
                      disabled={uploading === 'brandingLogo'}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 font-medium"
                    >
                      {uploading === 'brandingLogo' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      Upload
                    </button>
                  </div>
                  {form.brandingLogo && (
                    <div className="mt-2 text-xs text-green-600 bg-green-50 dark:bg-green-950 p-2 rounded">
                      ✓ Logo chargé
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 3: Footer (site) */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.28 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/60 border border-border">
                  <img src={stepImages[3]} alt="" className="h-10 w-10 object-contain" />
                  <div className="leading-tight">
                    <div className="text-sm font-semibold">📞 Pied de page</div>
                    <div className="text-xs text-muted-foreground">Contacts et réseaux sociaux.</div>
                  </div>
                </div>
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    📞 <strong>Étape 4/5 : Pied de page</strong><br />
                    Coordonnées, réseaux sociaux et copyright.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-1">Pied de page</h4>
                  <p className="text-sm text-muted-foreground">
                    Coordonnées et liens affichés en bas du site. Les réseaux sociaux sont facultatifs.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Adresse
                  </label>
                  <textarea
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[88px]"
                    value={form.footerAddress}
                    onChange={e => setField('footerAddress', e.target.value)}
                    placeholder={`123 rue de la Paix, Abidjan`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.footerEmail}
                    onChange={e => setField('footerEmail', e.target.value)}
                    placeholder="contact@votre-paroisse.ci"
                  />
                  <p className="text-xs text-muted-foreground">Email principal affiché dans le pied de page</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Téléphone modérateur</label>
                    <input
                      type="tel"
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      value={form.footerModeratorPhone}
                      onChange={e => setField('footerModeratorPhone', e.target.value)}
                      placeholder="+225 07 XX XX XX XX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Téléphone super admin</label>
                    <input
                      type="tel"
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      value={form.footerSuperAdminPhone}
                      onChange={e => setField('footerSuperAdminPhone', e.target.value)}
                      placeholder="+225 07 XX XX XX XX"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Email super admin</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.footerSuperAdminEmail}
                    onChange={e => setField('footerSuperAdminEmail', e.target.value)}
                    placeholder="superadmin@exemple.fr"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Facebook (URL)</label>
                    <input
                      type="url"
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      value={form.footerFacebookUrl}
                      onChange={e => setField('footerFacebookUrl', e.target.value)}
                      placeholder="https://facebook.com/…"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">YouTube (URL)</label>
                    <input
                      type="url"
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      value={form.footerYoutubeUrl}
                      onChange={e => setField('footerYoutubeUrl', e.target.value)}
                      placeholder="https://youtube.com/…"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Instagram (URL)</label>
                    <input
                      type="url"
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      value={form.footerInstagramUrl}
                      onChange={e => setField('footerInstagramUrl', e.target.value)}
                      placeholder="https://instagram.com/…"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">WhatsApp (URL)</label>
                    <input
                      type="url"
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      value={form.footerWhatsappUrl}
                      onChange={e => setField('footerWhatsappUrl', e.target.value)}
                      placeholder="https://wa.me/…"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Texte du copyright</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.footerCopyrightText}
                    onChange={e => setField('footerCopyrightText', e.target.value)}
                    placeholder={`© ${new Date().getFullYear()} Ma Paroisse`}
                  />
                </div>
              </motion.div>
            )}

            {/* Step 4: Premier compte administrateur */}
            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.28 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/60 border border-border">
                  <img src={stepImages[4]} alt="" className="h-10 w-10 object-contain" />
                  <div className="leading-tight">
                    <div className="text-sm font-semibold">👑 Compte admin</div>
                    <div className="text-xs text-muted-foreground">Super admin avec téléphone + avatar obligatoires.</div>
                  </div>
                </div>
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    👤 <strong>Étape 5/5 : Compte administrateur</strong><br />
                    Créez le premier compte (super administrateur). Vous pourrez inviter d'autres membres ensuite.
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-1">Compte administrateur</h4>
                  <p className="text-sm text-muted-foreground">
                    Créez le premier utilisateur (super administrateur de cette paroisse). Vous pourrez inviter d’autres membres ensuite.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Nom complet <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={adminFullName}
                    onChange={e => setAdminFullName(e.target.value)}
                    placeholder="Ex: Père Basile Diané"
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Téléphone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={adminPhone}
                    onChange={e => setAdminPhone(e.target.value)}
                    placeholder="+225 07 XX XX XX XX"
                    autoComplete="tel"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    placeholder="Ex: basile@nd-compassion.ci"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Mot de passe <span className="text-red-500">*</span>
                  </label>
                  <PasswordField
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    placeholder="Au moins 6 caractères"
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Minimum 6 caractères (exigence Supabase).</p>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="setup-gravatar"
                    checked={useGravatar}
                    disabled={!!adminAvatarFile}
                    onCheckedChange={c => setUseGravatar(c === true)}
                  />
                  <label htmlFor="setup-gravatar" className="text-sm cursor-pointer">
                    Utiliser Gravatar pour la photo de profil (sinon choisissez une image)
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Photo de profil <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => adminAvatarInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted text-sm"
                    >
                      <Camera className="h-4 w-4" />
                      Choisir une image
                    </button>
                    {adminAvatarPreview && (
                      <img src={adminAvatarPreview} alt="" className="h-16 w-16 rounded-full object-cover border border-border" />
                    )}
                    {!adminAvatarPreview && (
                      <UserCircle2 className="h-16 w-16 text-muted-foreground" />
                    )}
                  </div>
                  <input
                    ref={adminAvatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0] ?? null;
                      setAdminAvatarFile(file);
                      setUseGravatar(false);
                      if (file) {
                        const r = new FileReader();
                        r.onload = () => setAdminAvatarPreview(String(r.result));
                        r.readAsDataURL(file);
                      } else {
                        setAdminAvatarPreview(null);
                      }
                    }}
                  />
                </div>

                {showOtp && (
                  <div className="mt-6 p-4 rounded-lg border border-border bg-muted/40 space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <div className="text-sm font-semibold">Code OTP envoyé par email</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Un <strong>code a 4 chiffres</strong> a ete envoye a <strong>{pendingUser?.email ?? adminEmail.trim()}</strong>. Il est valable 15 minutes.
                    </div>
                    <div className="flex gap-2 items-center">
                      <Input
                        placeholder="Code à 4 chiffres"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={4}
                        value={otpCode}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setOtpCode(v);
                          setOtpError('');
                        }}
                      />
                      <Button type="button" onClick={verifyOtp} disabled={otpLoading || otpCode.trim().length !== 4}>
                        {otpLoading ? 'Vérification…' : 'Confirmer'}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={resendOtp}
                        disabled={otpLoading || otpResendCooldown > 0}
                        className="text-xs text-primary underline disabled:opacity-50"
                      >
                        {otpResendCooldown > 0 ? `Renvoyer dans ${otpResendCooldown}s` : 'Renvoyer le code'}
                      </button>
                      <div className="text-[11px] text-muted-foreground">Vérifiez aussi vos spams.</div>
                    </div>
                    {otpError && <div className="text-sm text-red-600">{otpError}</div>}
                  </div>
                )}
              </motion.div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}
            </AnimatePresence>
          </div>

          {/* Preview Panel */}
          <div className="w-80 border-l border-border p-8 bg-muted/30 overflow-y-auto">
            <h5 className="font-bold text-lg mb-6">Aperçu</h5>

            {step === 0 && (
              <div className="space-y-4">
                <div className="p-4 bg-background rounded-lg border border-border">
                  <h3 className="text-xl font-bold text-foreground">{form.heroTitle || '(titre vide)'}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{form.heroSubtitle || '(sous-titre vide)'}</p>
                  {form.heroImageUrl && (
                    <img src={form.heroImageUrl} alt="hero" className="mt-4 w-full h-32 object-cover rounded" />
                  )}
                  <button className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded font-medium text-sm">
                    {form.heroButtonText || 'Bouton'}
                  </button>
                </div>

                <div className="p-4 bg-background rounded-lg border border-border">
                  <h4 className="font-semibold text-foreground">{form.featuresTitle || '(titre activités)'}</h4>
                  <pre className="text-xs mt-2 overflow-auto max-h-32 text-muted-foreground">
                    {form.featuresContent}
                  </pre>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="p-4 bg-background rounded-lg border border-border">
                <h4 className="font-semibold text-foreground mb-2">À Propos</h4>
                <pre className="text-xs overflow-auto max-h-64 text-muted-foreground">
                  {form.aboutContent}
                </pre>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                {form.brandingLogo && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Logo</p>
                    <img src={form.brandingLogo} alt="logo" className="w-24 h-24 object-contain" />
                  </div>
                )}
                <div className="p-4 bg-background rounded-lg border border-border space-y-2">
                  <p className="font-bold text-foreground">{form.brandingName || '(nom vide)'}</p>
                  <p className="text-sm text-muted-foreground break-all">{form.brandingEmail}</p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3 text-sm">
                <div className="p-4 bg-background rounded-lg border border-border space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Pied de page</p>
                  <p className="text-muted-foreground whitespace-pre-line">{form.footerAddress || '(adresse vide)'}</p>
                  <p className="break-all">{form.footerEmail || '(email)'}</p>
                  {(form.footerModeratorPhone || form.footerSuperAdminPhone) && (
                    <p className="text-xs text-muted-foreground">
                      {form.footerModeratorPhone ? `Mod. ${form.footerModeratorPhone}` : ''}
                      {form.footerModeratorPhone && form.footerSuperAdminPhone ? ' · ' : ''}
                      {form.footerSuperAdminPhone ? `Super ${form.footerSuperAdminPhone}` : ''}
                    </p>
                  )}
                  {form.footerSuperAdminEmail && (
                    <p className="text-xs break-all text-muted-foreground">{form.footerSuperAdminEmail}</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground p-2 bg-muted/50 rounded border border-border">
                  {form.footerCopyrightText}
                </p>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="p-4 bg-background rounded-lg border border-border space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Administrateur</p>
                  <p className="font-medium text-foreground">{adminFullName.trim() || '(nom)'}</p>
                  <p className="text-sm text-muted-foreground break-all">{adminEmail.trim() || form.brandingEmail}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Après validation, la paroisse et le contenu sont enregistrés, puis ce compte est créé.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="border-t border-border p-6 flex items-center justify-between bg-muted/30">
          <div>
            {step > 0 && (
              <button
                onClick={handlePrev}
                className="px-6 py-2 border border-border rounded-lg text-foreground hover:bg-muted font-medium transition"
              >
                ← Précédent
              </button>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Les champs avec <span className="text-red-500">*</span> sont obligatoires
          </div>
          <div>
            {step < WIZARD_STEPS - 1 && (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium transition"
              >
                Suivant →
              </button>
            )}
            {step === WIZARD_STEPS - 1 && (
              <button
                type="button"
                onClick={handleFinish}
                disabled={loading || showOtp}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition"
              >
                {loading ? 'Enregistrement...' : showOtp ? 'En attente du code…' : '✓ Terminer'}
              </button>
            )}
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const field = (e.target as any)?.dataset?.field as ImageField;
            if (field) handleImageUpload(e, field);
          }}
        />

        <RestoreFromFileModal
          open={showRestoreModal}
          onOpenChange={setShowRestoreModal}
          onRestoreSuccess={() => {
            onClose();
            markCompleted();
          }}
        />
      </div>
      </DraggableModal>

      <DraggableModal
        open={showDevBootstrap}
        onClose={() => {
          setShowDevBootstrap(false);
          setDevBootstrapError(null);
        }}
        draggableOnMobile={true}
        dragHandleOnly={false}
        verticalOnly={true}
        center={true}
        maxWidthClass="max-w-xl"
        title={
          <div className="flex items-center justify-between w-full">
            <div>
              <h3 className="text-lg font-bold text-primary">Créer le compte développeur</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Si le compte n’existe pas encore, vous pouvez le créer depuis l’application.
              </p>
            </div>
          </div>
        }
      >
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold">Email</label>
            <Input value={devEmail} onChange={(e) => setDevEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold">Mot de passe</label>
            <PasswordField
              value={devPassword}
              onChange={(e) => setDevPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          {devBootstrapError ? (
            <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-300">
              {devBootstrapError}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowDevBootstrap(false);
                setDevBootstrapError(null);
              }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={async () => {
                setLoading(true);
                setDevBootstrapError(null);
                try {
                  // Ensure SYSTEM parish exists (idempotent)
                  await supabase.rpc('ensure_system_parish');

                  const email = devEmail.trim().toLowerCase();
                  const password = devPassword;

                  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
                  if (signInErr) {
                    const msg = (signInErr.message ?? "").toLowerCase();
                    const code = (signInErr as any)?.code ? String((signInErr as any).code).toLowerCase() : "";
                    const userLikelyMissing =
                      msg.includes("not found") ||
                      msg.includes("no user") ||
                      msg.includes("user not") ||
                      code.includes("user_not") ||
                      code.includes("not_found");

                    // If the user truly doesn't exist yet, we can attempt a signup + then signin.
                    if (userLikelyMissing) {
                      const { error: signUpErr } = await supabase.auth.signUp({
                        email,
                        password,
                        options: {
                          data: { full_name: 'Thierry Gogo' },
                        },
                      });
                      if (signUpErr) throw signUpErr;

                      const { error: signInAfterSignUpErr } = await supabase.auth.signInWithPassword({ email, password });
                      if (signInAfterSignUpErr) throw signInAfterSignUpErr;
                    } else {
                      // If credentials are wrong, do NOT try to signUp again (it will explode with /auth/v1/signup).
                      setDevBootstrapError(signInErr.message || "Connexion impossible (vérifiez email/mot de passe).");
                      return;
                    }
                  }

                  // Create/repair profile linkage
                  const { error: ensureErr } = await supabase.rpc('ensure_developer_account');
                  if (ensureErr) {
                    const { error: legacyErr } = await supabase.rpc('ensure_developer_exists');
                    if (legacyErr) throw legacyErr;
                  }

                  markCompleted();
                  setShowDevBootstrap(false);
                  onClose();
                  window.location.assign('/admin');
                } catch (e: any) {
                  setDevBootstrapError(e?.message || 'Impossible de créer le compte développeur.');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              {loading ? 'Création…' : 'Créer et se connecter'}
            </Button>
          </div>
        </div>
      </DraggableModal>
    </>
  );
}
