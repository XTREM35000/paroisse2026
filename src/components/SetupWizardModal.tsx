// Mocks supplémentaires pour les composants UI et supabase
const Input = (props: any) => <input {...props} />;
const Upload = (props: any) => <div {...props}>{props.children}</div>;
const PasswordField = (props: any) => <input type="password" {...props} />;
const Checkbox = (props: any) => <input type="checkbox" {...props} />;
const Camera = (props: any) => <span {...props} />;
// Mock supabase chainable (compatible with update().eq(), select(), upsert(), etc.)
const createQueryBuilder = () => {
  const chain = {
    update: (_payload?: unknown) => chain,
    insert: async (_payload?: unknown) => ({ data: null, error: null }),
    upsert: async (_payload?: unknown, _options?: unknown) => ({ data: null, error: null }),
    delete: (_payload?: unknown) => chain,
    eq: async (_field?: string, _value?: unknown) => ({ data: null, error: null }),
    select: async (_columns?: string, _options?: unknown) => ({ data: null, error: null, count: 0 }),
  };
  return chain;
};

const supabase: any = {
  from: (_table: string) => createQueryBuilder(),
  auth: {
    signInWithPassword: async (_args?: unknown) => ({ data: {}, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
  },
  functions: {
    invoke: async (_name: string, _args?: unknown) => ({ data: {}, error: null }),
  },
  rpc: async (_name: string, _args?: unknown) => ({ data: null, error: null }),
};
// Mock RestoreFromFileModal
const RestoreFromFileModal = (props: any) => <div {...props}>{props.children}</div>;

// src\components\SetupWizardModal.tsx
// 


import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DraggableModal from './DraggableModal';
// Icônes fictives pour éviter les erreurs de compilation
const Church = (props: any) => <span {...props} />;
const BookOpen = (props: any) => <span {...props} />;
const Sparkles = (props: any) => <span {...props} />;
const Images = (props: any) => <span {...props} />;
const Mail = (props: any) => <span {...props} />;
const UserCog = (props: any) => <span {...props} />;
// Types et fonctions fictives pour éviter les erreurs
type SetupData = any;
const uploadImageToStorage = (file?: File, folder?: string) => {
  // Retourne une URL fictive pour simuler un upload
  return Promise.resolve('https://dummy.url/' + (folder || 'default') + '/' + (file?.name || 'image.jpg'));
};
const initFirstParoisseAndUser = (
  setupPayload?: any,
  adminData?: any,
  adminAvatarFile?: any
) => {
  return Promise.resolve({
    authData: { session: true, user: { id: 'demo', email: 'demo@paroisse.com' } },
    paroisseId: 'demo-parish',
  });
};
const upsertPageHeroBanners = async (_: any) => {};
// Mocks UI components to avoid missing import errors
const Button = (props: any) => <button {...props}>{props.children}</button>;
const Loader2 = (props: any) => <span {...props} />;
const Trash2 = (props: any) => <span {...props} />;
const UserCircle2 = (props: any) => <span {...props} />;
const MapPin = (props: any) => <span {...props} />;
const Phone = (props: any) => <span {...props} />;
const useSetup = () => ({ markCompleted: () => {}, markIncomplete: () => {} });
const useAuth = () => ({ user: undefined, refreshProfile: async () => {} });
const useParoisse = () => ({ reloadParoisses: async () => {} });
const useQueryClient = () => ({ clear: async () => {}, invalidateQueries: async (_: any) => {} });
const markAppInitialized = () => {};
const invalidateAllPageHeroBanners = async (_: any) => {};
const performFullCleanup = async () => {};
const isValidEmail = (_: string) => true;
const ensureProfileExists = async (_: any) => {};
const uploadPendingAvatar = async (_: any) => {};
// Constantes manquantes
const PENDING_HERO_BANNERS_KEY = 'pending_hero_banners';
const EPHEMERAL_SETUP_LS_KEYS: string[] = [];
const STORAGE_SELECTED_PAROISSE = 'selected_paroisse';
type HomepageSectionRow = any;

// Définition du type FormState
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
  headerLogo?: string;
  headerMainTitle?: string;
  headerSubtitle?: string;
  heroBanners: { [key: string]: string };
};

type ImageField = 'heroImageUrl' | 'brandingLogo' | 'headerLogo';

const PUBLIC_HERO_BANNER_PAGES: { path: string; label: string }[] = [
  { path: '/', label: 'Accueil' },
  { path: '/a-propos', label: 'À propos' },
  { path: '/galerie', label: 'Galerie' },
  { path: '/videos', label: 'Vidéos' },
  { path: '/evenements', label: 'Événements' },
  { path: '/verse', label: 'Verset du jour' },
  { path: '/affiche', label: 'Affiches / Flyers' },
  { path: '/prayers', label: 'Intentions de prière' },
  { path: '/announcements', label: 'Annonces paroissiales' },
  { path: '/chat', label: 'Chat' },
  { path: '/donate', label: 'Faire un don' },
  { path: '/homilies', label: 'Homélies' },
  { path: '/campaigns', label: 'Campagnes' },
  { path: '/receipts', label: 'Reçus & historique des dons' },
  { path: '/dashboard', label: 'Tableau de bord' },
  { path: '/prospect', label: 'Média Paroissial' },
  { path: '/radio', label: 'Radio Paroisse FM' },
  { path: '/live', label: 'TV Paroisse Direct' },
  { path: '/profil', label: 'Mon Profil' },
  { path: '/mariage', label: 'Préparatif Mariage' },
  { path: '/bapteme', label: 'Préparatif Baptême' },
  { path: '/confession', label: 'Demande de Confession' },
  { path: '/faq', label: 'FAQ sans censure' },
  { path: '/admin/faq', label: 'Admin - FAQ' },
  { path: '/admin/officiants', label: 'Admin - Officiants' },
  { path: '/admin/requests', label: 'Admin - Demandes' },
];
// Tableau d'images demo pour les hero banners
const DEMO_HERO_IMAGES = [
  'https://cghwsbkxcjsutqwzdbwe.supabase.co/storage/v1/object/public/gallery/uploads/1767454960147_messe01.jpeg',
  'https://cghwsbkxcjsutqwzdbwe.supabase.co/storage/v1/object/public/gallery/hero-banners/1774760153581-accueil.png',
  'https://cghwsbkxcjsutqwzdbwe.supabase.co/storage/v1/object/public/gallery/hero-banners/1774760305338-event07.jpeg',
  'https://cghwsbkxcjsutqwzdbwe.supabase.co/storage/v1/object/public/gallery/hero-banners/1774760326847-event01.jpeg',
  'https://cghwsbkxcjsutqwzdbwe.supabase.co/storage/v1/object/public/gallery/hero-banners/1774760353565-ecran01.png',
  'https://cghwsbkxcjsutqwzdbwe.supabase.co/storage/v1/object/public/gallery/hero-banners/1774760369224-messe01.jpeg',
  'https://cghwsbkxcjsutqwzdbwe.supabase.co/storage/v1/object/public/gallery/hero-banners/1774760377470-mess02.jpeg',
  'https://cghwsbkxcjsutqwzdbwe.supabase.co/storage/v1/object/public/gallery/hero-banners/1774760411490-gallerie01.jpeg',
  'https://cghwsbkxcjsutqwzdbwe.supabase.co/storage/v1/object/public/gallery/hero-banners/1774760436019-homelies01.png',
  'https://cghwsbkxcjsutqwzdbwe.supabase.co/storage/v1/object/public/gallery/hero-banners/1774760505593-messe01.png',
  'https://cghwsbkxcjsutqwzdbwe.supabase.co/storage/v1/object/public/gallery/hero-banners/1774760526445-ecran04.png',
  'https://cghwsbkxcjsutqwzdbwe.supabase.co/storage/v1/object/public/gallery/hero-banners/1774760535550-ecran06.png',
  'https://cghwsbkxcjsutqwzdbwe.supabase.co/storage/v1/object/public/gallery/hero-banners/1774760548089-accueil.png',
];

// Fonction utilitaire pour générer des images aléatoires pour chaque clé
const getRandomHeroBanners = () => {
  // Images fixes pour certaines pages
  const fixedImages: Record<string, string> = {
    '/profil': 'https://cghwsbkxcjsutqwzdbwe.supabase.co/storage/v1/object/public/gallery/hero/1774174729748-event04.jpeg',
    // Ajouter d'autres pages fixes ici si besoin
  };

  // Toutes les clés sauf celles fixées
  const heroKeys = PUBLIC_HERO_BANNER_PAGES.map(({ path }) => path).filter((key) => !(key in fixedImages));
  const shuffled = [...DEMO_HERO_IMAGES];
  // Mélange Fisher-Yates
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const result: Record<string, string> = { ...fixedImages };
  heroKeys.forEach((key, index) => {
    result[key] = shuffled[index % shuffled.length];
  });
  return result;
};

function emptyHeroBanners(): { [key: string]: string } {
  return Object.fromEntries(PUBLIC_HERO_BANNER_PAGES.map(({ path }) => [path, '']));
}

function useHeroBannerPreviews() {
  const [heroBannerPreviews, setHeroBannerPreviews] = useState<Record<string, string>>({});

  const setPreviewForPath = (path: string, file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setHeroBannerPreviews((prev) => {
      const current = prev[path];
      if (current) URL.revokeObjectURL(current);
      return { ...prev, [path]: previewUrl };
    });
    return previewUrl;
  };

  const clearPreviewForPath = (path: string) => {
    setHeroBannerPreviews((prev) => {
      const current = prev[path];
      if (!current) return prev;
      URL.revokeObjectURL(current);
      const { [path]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const getPreviewSrc = (path: string, persistedUrl?: string) => heroBannerPreviews[path] || persistedUrl || '';

  useEffect(() => {
    return () => {
      Object.values(heroBannerPreviews).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [heroBannerPreviews]);

  return {
    heroBannerPreviews,
    setPreviewForPath,
    clearPreviewForPath,
    getPreviewSrc,
  };
}

const WIZARD_STEPS = 6;

type SetupWizardModalProps = {
  open: boolean;
  onClose: () => void;
  onSetupCompleted?: (payload: { paroisseId: string }) => void;
};

  // isDeveloperUser doit être défini après l'appel à useAuth()

export default function SetupWizardModal({ open, onClose, onSetupCompleted }: SetupWizardModalProps) {
    const setupFinalizedRef = useRef(false);
    const isMountedRef = useRef(true);
    const otpInFlightRef = useRef(false);
    const heroBannerFileInputRef = useRef<HTMLInputElement>(null);
    const [heroBannerUploadPath, setHeroBannerUploadPath] = useState<string | null>(null);

    // Navigation étapes wizard
    const handlePrev = () => {
      setError(null);
      setStep(s => Math.max(0, s - 1));
    };

    const handleNext = () => {
      if (!validateStep()) return setError('Veuillez remplir les champs requis (*)');
      setError(null);
      setStep(s => Math.min(WIZARD_STEPS - 1, s + 1));
    };

    // Finalisation après OTP : hard redirect pour casser toute boucle SPA / état corrompu
    const finalizeSetupAfterAuth = async (parishId: string, _signedInUser: unknown, targetPath: string) => {
      if (!isMountedRef.current) return;
      if (isCompleting || setupFinalizedRef.current) {
        console.warn('[SetupWizard] finalizeSetupAfterAuth: ignoré (déjà en cours ou finalisé)');
        return;
      }
      setupFinalizedRef.current = true;
      setIsCompleting(true);
      console.info('[SetupWizard] finalizeSetupAfterAuth - début', { parishId, targetPath });
      try {
        let pendingHeroSnapshot: Record<string, string> | null = null;
        try {
          const raw = localStorage.getItem(PENDING_HERO_BANNERS_KEY);
          if (raw) pendingHeroSnapshot = JSON.parse(raw) as Record<string, string>;
        } catch {
          /* ignore */
        }

        try {
          document.cookie.split(';').forEach((c) => {
            const name = c.replace(/^ +/, '').replace(/=.*/, '').trim();
            if (!name) return;
            document.cookie = `${name}=;expires=${new Date(0).toUTCString()};path=/`;
          });
        } catch {
          /* ignore */
        }

        for (const k of EPHEMERAL_SETUP_LS_KEYS) {
          try {
            localStorage.removeItem(k);
          } catch {
            /* ignore */
          }
        }
        try {
          sessionStorage.clear();
        } catch {
          /* ignore */
        }

        await queryClient.clear();

        const effectiveParishId =
          parishId ||
          pendingParishId ||
          (typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_SELECTED_PAROISSE) : '') ||
          '';

        await Promise.all([
          reloadParoisses().catch((e) => console.warn('[SetupWizard] reloadParoisses', e)),
          refreshProfile().catch((e) => console.warn('[SetupWizard] refreshProfile', e)),
        ]);

        try {
          if (pendingHeroSnapshot && Object.keys(pendingHeroSnapshot).length > 0) {
            await upsertPageHeroBanners(pendingHeroSnapshot);
            localStorage.removeItem(PENDING_HERO_BANNERS_KEY);
            console.info('[SetupWizard] Hero banners rejoués après session OTP');
          }
        } catch (e) {
          console.warn('[SetupWizard] pending hero banners', e);
        }

        markCompleted();
        markAppInitialized();

        await queryClient.invalidateQueries({ queryKey: ['header-config'] });
        await queryClient.invalidateQueries({ queryKey: ['footer-config'] });
        await queryClient.invalidateQueries({ queryKey: ['profile'] });
        await invalidateAllPageHeroBanners(queryClient);

        if (onSetupCompleted) {
          console.info('[SetupWizard] onSetupCompleted', { effectiveParishId });
          onSetupCompleted({ paroisseId: effectiveParishId });
        }

        setShowOtp(false);
        setPendingParishId(null);
        setPendingUser(null);
        setStep(0);
        onClose();

        const url =
          targetPath.startsWith('http://') || targetPath.startsWith('https://')
            ? targetPath
            : `${window.location.origin}${targetPath.startsWith('/') ? targetPath : `/${targetPath}`}`;

        window.location.replace(url);
      } catch (err) {
        console.error('[SetupWizard] finalizeSetupAfterAuth error:', err);
        setupFinalizedRef.current = false;
      } finally {
        if (isMountedRef.current) {
          setIsCompleting(false);
        }
      }
    };
  const { markCompleted, markIncomplete } = useSetup();
  const { user, refreshProfile } = useAuth();
  const { reloadParoisses } = useParoisse();
  const queryClient = useQueryClient();
  const isDeveloperUser =
    user?.user_metadata?.role === 'developer' || user?.app_metadata?.role === 'developer';

  // Ajout du flag pour empêcher les appels multiples
  const [isCompleting, setIsCompleting] = useState(false);

  const [step, setStep] = useState(0);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showCleanConfirm, setShowCleanConfirm] = useState(false);
  const [showDevBootstrap, setShowDevBootstrap] = useState(false);
  const [hasBackups, setHasBackups] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullCleanLoading, setFullCleanLoading] = useState(false);
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
  const {
    setPreviewForPath,
    clearPreviewForPath,
    getPreviewSrc,
  } = useHeroBannerPreviews();

  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpResendCooldown, setOtpResendCooldown] = useState(0);
  const otpInputRef = useRef<HTMLInputElement>(null);
  const [pendingUser, setPendingUser] = useState<{ id?: string; email?: string } | null>(null);
  const [pendingParishId, setPendingParishId] = useState<string | null>(null);

  // Intentionally empty by default to avoid accidental auth calls (400) with stale credentials.
  // Prefill developer credentials so SYSTEM works from a clean UI.
  // (Do not auto-connect; user still clicks "Se connecter".)
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
    heroBanners: emptyHeroBanners(),
  });

  // Illustration images per step (public free icons)
  const stepImages = [
    'https://cdn-icons-png.flaticon.com/512/6193/6193613.png',
    'https://cdn-icons-png.flaticon.com/512/2598/2598641.png',
    'https://cdn-icons-png.flaticon.com/512/2971/2971976.png',
    'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
    'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
    'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
  ];

  const stepIcons = [Church, BookOpen, Sparkles, Images, Mail, UserCog];

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
    if (step !== 4) return;
    setForm(prev => ({
      ...prev,
      footerEmail: prev.footerEmail.trim() ? prev.footerEmail : prev.brandingEmail,
    }));
  }, [step]);

  useEffect(() => {
    if (step !== 5) return;
    setAdminEmail(prev => (prev.trim() ? prev : form.brandingEmail));
    setAdminPhone(prev => (prev.trim() ? prev : form.footerSuperAdminPhone.trim() || form.footerModeratorPhone.trim()));
  }, [step, form.brandingEmail]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setupFinalizedRef.current = false;
    otpInFlightRef.current = false;
    setIsCompleting(false);
  }, [open]);

  useEffect(() => {
    if (!showOtp) return;
    window.requestAnimationFrame(() => {
      otpInputRef.current?.focus();
    });
  }, [showOtp]);

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

  /** Remet uniquement le formulaire du wizard à zéro (sans toucher à la base). */
  function resetFormFieldsOnly() {
    setError(null);
    setForm({
      heroTitle: '',
      heroSubtitle: '',
      heroButtonText: '',
      heroButtonLink: '',
      heroImageUrl: undefined,
      featuresTitle: '',
      featuresContent: '',
      testimonialsTitle: '',
      testimonialsContent: '',
      aboutContent: '',
      brandingName: '',
      brandingLogo: undefined,
      brandingEmail: '',
      footerAddress: '',
      footerEmail: '',
      footerModeratorPhone: '',
      footerSuperAdminPhone: '',
      footerSuperAdminEmail: '',
      footerFacebookUrl: '',
      footerYoutubeUrl: '',
      footerInstagramUrl: '',
      footerWhatsappUrl: '',
      footerCopyrightText: '',
      headerLogo: undefined,
      headerMainTitle: '',
      headerSubtitle: '',
      heroBanners: emptyHeroBanners(),
    });
    setAdminFullName('');
    setAdminEmail('');
    setAdminPassword('');
    setAdminPhone('');
    setUseGravatar(false);
    setAdminAvatarFile(null);
    setAdminAvatarPreview(null);
  }

  /** Nettoyage base (RPC) puis rechargement — sans exiger de session (selon politiques Supabase sur les RPC). */
  const executeFullSystemClean = async () => {
    setFullCleanLoading(true);
    setError(null);
    try {
      setShowCleanConfirm(false);
      await performFullCleanup();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Erreur nettoyage : ${msg}`);
    } finally {
      setFullCleanLoading(false);
    }
  };

  // Pré-remplissage démo
  const fillWithDemoData = () => {
    setError(null);
    // Générer des images aléatoires pour les hero banners
    const randomHeroBanners = getRandomHeroBanners();
    setForm((prev) => ({
      // ...toutes les données existantes (header, hero, features, etc.)
      ...prev,
      headerLogo: 'https://cghwsbkxcjsutqwzdbwe.supabase.co/storage/v1/object/public/gallery/header/1774523308670-logo2.png',
      headerMainTitle: 'Paroisse Internationale',
      headerSubtitle: 'Notre-Dame de la Compassion',
      heroTitle: 'Bienvenue à la Paroisse Internationale Notre-Dame de la Compassion',
      heroSubtitle: 'Port-Bouët – Adjahui Coubé – Une paroisse qui vous accueille, vous écoute et vous accompagne',
      heroButtonText: 'Découvrir la paroisse',
      heroButtonLink: '/a-propos',
      heroImageUrl: 'https://cghwsbkxcjsutqwzdbwe.supabase.co/storage/v1/object/public/gallery/hero/1774523372478-accueil.png',
      featuresTitle: 'Nos activités et célébrations',
      featuresContent: JSON.stringify(
        [
          { title: 'Messes', description: 'Messes dominicales et festivités' },
          { title: 'Adoration', description: 'Adoration du Saint-Sacrement' },
          { title: 'Catéchèse', description: 'Formation des enfants et adultes' },
        ],
        null,
        2,
      ),
      testimonialsTitle: 'Témoignages',
      testimonialsContent: JSON.stringify(
        [
          { name: 'Un fidèle', text: 'Une communauté vivante et accueillante.' },
          { name: 'Une paroissienne', text: 'Un lieu de prière, de fraternité et de soutien.' },
        ],
        null,
        2,
      ),
      aboutContent: JSON.stringify(
        {
          history:
            "La Paroisse Internationale Notre-Dame de la Compassion a été fondée pour être un lieu de prière, de partage et de rayonnement spirituel au cœur de Port-Bouët – Adjahui Coubé. Depuis sa création, elle accueille des fidèles de toutes les communautés, avec un esprit d'ouverture et de fraternité.",
          mission:
            "Annoncer l'Évangile, célébrer la foi, accompagner les fidèles dans leur vie spirituelle et servir la communauté à travers des actions de solidarité et de partage.",
          values: ['Foi', 'Espérance', 'Charité', 'Fraternité', 'Accueil'],
          team: [
            {
              name: 'Père Basile Diané',
              role: 'Curé',
              photo:
                'https://cghwsbkxcjsutqwzdbwe.supabase.co/storage/v1/object/public/gallery/1774734028124_nf5pez.jpg',
            },
          ],
        },
        null,
        2,
      ),
      brandingName: 'Paroisse Internationale Notre-Dame de la Compassion',
      brandingEmail: 'basilediane71@gmail.com',
      brandingLogo: 'https://cghwsbkxcjsutqwzdbwe.supabase.co/storage/v1/object/public/gallery/header/1774523308670-logo2.png',
      footerAddress: "Port-Bouët – Adjahui Coubé, 657 BP 07, Abidjan, Côte d'Ivoire",
      footerEmail: 'basilediane71@gmail.com',
      footerModeratorPhone: '+225 27 20 15 20 70',
      footerSuperAdminPhone: '+225 05 05 26 30 30',
      footerSuperAdminEmail: 'basilediane71@gmail.com',
      footerFacebookUrl: 'https://facebook.com/ndcompassion',
      footerYoutubeUrl: 'https://youtube.com/@ndcompassion',
      footerInstagramUrl: 'https://instagram.com/ndcompassion',
      footerWhatsappUrl: 'https://wa.me/2250505263030',
      footerCopyrightText:
        '© 2026 Paroisse Internationale Notre-Dame de la Compassion – Tous droits réservés',
      // Hero Banners aléatoires
      heroBanners: randomHeroBanners,
    }));

    // Step 5 – Compte admin
    setAdminFullName('Père Basile Diané');
    setAdminPhone('+225 05 05 26 30 30');
    setAdminEmail('compassionnotredame5@gmail.com');
    setAdminPassword('P2026@ndc');
    setUseGravatar(false);
    setAdminAvatarFile(null);
    setAdminAvatarPreview('https://cghwsbkxcjsutqwzdbwe.supabase.co/storage/v1/object/public/gallery/branding/1774709512892-BasileAccueil.jpg');
  };
// Fonction pour obtenir le nom de la page à partir de la clé
const getPageName = (key: string): string => {
  const names: Record<string, string> = {
    '/profil': 'Mon Profil',
    '/mariage': 'Préparatif Mariage',
    '/bapteme': 'Préparatif Baptême',
    '/confession': 'Demande de Confession',
    '/faq': 'FAQ sans censure',
    '/admin/faq': 'Admin - FAQ',
    '/admin/officiants': 'Admin - Officiants',
    '/admin/requests': 'Admin - Demandes',
  };
  return names[key] || key;
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

  const handleHeroBannerFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const path = heroBannerUploadPath;
    setHeroBannerUploadPath(null);
    if (!file || !path) return;
    setPreviewForPath(path, file);

    const uploadKey = `hero-banner-${path}`;
    setUploading(uploadKey);
    setError(null);
    try {
      const url = await uploadImageToStorage(file, 'hero-banners');
      if (!url) throw new Error('Échec du téléchargement');
      setForm((prev) => ({
        ...prev,
        heroBanners: { ...prev.heroBanners, [path]: url },
      }));
    } catch (err: any) {
      setError(`Erreur bannière ${path}: ${err.message}`);
    } finally {
      setUploading(null);
      if (heroBannerFileInputRef.current) heroBannerFileInputRef.current.value = '';
    }
  };

  const setHeroBannerUrl = (path: string, url: string) => {
    clearPreviewForPath(path);
    setForm((prev) => ({
      ...prev,
      heroBanners: { ...prev.heroBanners, [path]: url },
    }));
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
      return true;
    }
    if (step === 4) {
      return !!form.footerEmail.trim() && isValidEmail(form.footerEmail.trim());
    }
    if (step === 5) {
      return (
        adminFullName.trim().length >= 2 &&
        isValidEmail(adminEmail.trim()) &&
        adminPassword.length >= 6 &&
        adminPhone.trim().length >= 6 &&
        (useGravatar || !!adminAvatarFile || (!!adminAvatarPreview && adminAvatarPreview.trim() !== ''))
      );
    }
    return true;
  };



  const enforceSetupUserSuperAdmin = async (userId: string, parishId: string) => {
    const updateQuery = supabase.from('profiles').update({ role: 'super_admin' });
    if (typeof updateQuery?.eq !== 'function') {
      throw new Error('Supabase query builder malformed (eq not available)');
    }
    const { error: profileRoleError } = await updateQuery.eq('id', userId);
    if (profileRoleError) {
      throw new Error(
        `Impossible de définir le rôle super_admin sur le profil : ${profileRoleError.message}`,
      );
    }

    const { error: memberError } = await supabase
      .from('parish_members')
      .upsert(
        { parish_id: parishId, user_id: userId, role: 'super_admin' },
        { onConflict: 'parish_id,user_id' },
      );
    if (memberError) {
      throw new Error(
        `Impossible de définir le rôle super_admin dans parish_members : ${memberError.message}`,
      );
    }
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

      const setupPayload: SetupData = {
        sections,
        about,
        branding,
        footer,
        help,
        headerLogo: form.headerLogo,
        headerMainTitle: form.headerMainTitle,
        headerSubtitle: form.headerSubtitle,
        heroBanners: form.heroBanners,
      };

      const pastedAvatarUrl =
        !useGravatar && !adminAvatarFile && adminAvatarPreview?.trim().match(/^https?:\/\//i)
          ? adminAvatarPreview.trim()
          : null;

      const { authData, paroisseId } = await initFirstParoisseAndUser(
        setupPayload,
        {
          full_name: adminFullName.trim(),
          email: adminEmail.trim(),
          password: adminPassword,
          phone: adminPhone.trim(),
          useGravatar: useGravatar && !adminAvatarFile,
          avatarUrl: pastedAvatarUrl,
        },
        adminAvatarFile,
      );

      await queryClient.invalidateQueries({ queryKey: ['header-config'] });
      await queryClient.invalidateQueries({ queryKey: ['footer-config'] });
      await invalidateAllPageHeroBanners(queryClient);

      if (authData.session) {
        if (authData.user?.id) {
          await enforceSetupUserSuperAdmin(authData.user.id, paroisseId);
        }

        markAppInitialized();
        markCompleted();
        onSetupCompleted?.({ paroisseId });
        onClose();
        const p = isDeveloperUser ? '/developer/admin' : '/dashboard';
        window.location.assign(`${window.location.origin}${p.startsWith('/') ? p : `/${p}`}`);
        return;
      }

      // OTP email instead of confirmation link — sauver les bannières pour rejou après connexion (RLS)
      try {
        localStorage.setItem(PENDING_HERO_BANNERS_KEY, JSON.stringify(form.heroBanners));
      } catch {
        /* ignore */
      }

      setPendingParishId(paroisseId);
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
    if (otpInFlightRef.current || setupFinalizedRef.current || isCompleting) return;
    otpInFlightRef.current = true;
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
        const parishIdForMembership =
          pendingParishId || localStorage.getItem('selectedParoisse') || '';
        if (parishIdForMembership) {
          await enforceSetupUserSuperAdmin(signedInUser.id, parishIdForMembership);
        }
        await ensureProfileExists(signedInUser.id);
        await uploadPendingAvatar(signedInUser.id);
        if (parishIdForMembership) {
          try {
            localStorage.setItem(STORAGE_SELECTED_PAROISSE, parishIdForMembership);
          } catch {
            /* ignore */
          }
        }
      }

      const storedParoisseId = pendingParishId || localStorage.getItem('selectedParoisse') || '';
      if (!storedParoisseId) {
        console.warn('[SetupWizard] verifyOtp: aucun paroisseId stocké, redirection quand même');
      }
      const signedInIsDeveloper =
        signedInUser?.user_metadata?.role === 'developer' ||
        signedInUser?.app_metadata?.role === 'developer' ||
        isDeveloperUser;
      const target = signedInIsDeveloper ? '/developer/admin' : '/dashboard';
      await finalizeSetupAfterAuth(storedParoisseId || pendingParishId || '', signedInUser, target);
    } catch (e: any) {
      setOtpError(e?.message || 'Impossible de vérifier le code.');
    } finally {
      setOtpLoading(false);
      otpInFlightRef.current = false;
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
        lockIntrinsicSizeOnOpen={false}
        minHeight="0"
        className="h-[calc(100dvh-3rem)] max-h-[calc(100dvh-3rem)] min-h-0 w-full"
        bodyClassName="min-h-0 flex-1 overflow-hidden p-1 sm:p-2"
      title={
        <div className="flex w-full items-center justify-between gap-2 sm:gap-3">
          <div className="flex min-w-0 max-w-[min(100%,280px)] shrink-0 items-center gap-3 sm:max-w-xs">
            <div className="relative shrink-0">
              <img
                src="/profile01.png"
                alt=""
                className="h-12 w-12 rounded-full border-2 border-white/30 object-cover shadow-lg sm:h-14 sm:w-14"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://ui-avatars.com/api/?background=ffb347&color=fff&size=56&bold=true&name=TG';
                }}
              />
            </div>
            <div className="min-w-0 text-left leading-tight">
              <div className="text-sm font-medium text-white/90">Thierry Gogo</div>
              <div className="text-[11px] text-white/70 sm:text-xs">Développeur Web Full Stack</div>
              <div className="mt-1 flex flex-col gap-0.5 text-[10px] text-white/60 sm:text-xs">
                <div className="flex items-start gap-1">
                  <Mail className="mt-0.5 h-3 w-3 shrink-0" />
                  <span className="break-all">dibothierrygogo@gmail.com</span>
                </div>
                <div className="flex items-start gap-1">
                  <Phone className="mt-0.5 h-3 w-3 shrink-0" />
                  <span className="break-words">+225 0758966156 / 0103644527</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span>01 BP 5341 AB 01</span>
                </div>
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1 px-2 text-center">
            <h3 className="text-2xl font-bold text-white drop-shadow-sm">Assistant de configuration</h3>
            <p className="mt-1 text-sm text-white/90">Configurez votre paroisse en 6 étapes</p>
          </div>

          <div className="flex min-w-[140px] shrink-0 flex-col items-end gap-2">
            <div className="flex max-w-[100vw] flex-wrap items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="whitespace-nowrap bg-white/10 text-white/90 hover:bg-white/15 hover:text-white"
                disabled={loading}
                onClick={fillWithDemoData}
                title="Pré-remplir le SetupWizard avec des données de démonstration"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                DÉMO
              </Button>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="whitespace-nowrap bg-white/10 text-white/90 hover:bg-white/15 hover:text-white"
                disabled={loading || fullCleanLoading}
                onClick={() => setShowCleanConfirm(true)}
                title="Nettoyage complet de la base (RPC) puis réinitialisation du formulaire"
              >
                {fullCleanLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                CLEAN
              </Button>
              {!adminUnlocked ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    className="whitespace-nowrap bg-white/10 text-white/90 hover:bg-white/15 hover:text-white"
                    disabled={loading}
                    onClick={() => {
                      setAdminUnlockError(null);
                      setAdminUnlockOpen((v) => !v);
                    }}
                  >
                    <UserCircle2 className="mr-2 h-4 w-4" />
                    ADMIN
                  </Button>
                  {adminUnlockOpen ? (
                    <Input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="Code"
                      className="w-28 bg-white/10 border-white/20 text-white placeholder:text-white/70 focus-visible:ring-white/40"
                      value={adminCode}
                      disabled={loading}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setAdminCode(digits);
                        setAdminUnlockError(null);

                        if (digits.length === 4) {
                          if (digits === ADMIN_UNLOCK_CODE) {
                            setAdminUnlocked(true);
                            setAdminUnlockOpen(false);
                            setAdminUnlockError(null);
                            setAdminCode('');
                          } else {
                            setAdminUnlockError('Code incorrect.');
                            setAdminCode('');
                          }
                        }
                      }}
                    />
                  ) : null}
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    className="whitespace-nowrap bg-white text-black hover:bg-white/90"
                    onClick={() => {
                      setDevBootstrapError(null);
                      setShowDevBootstrap(true);
                    }}
                  >
                    <UserCog className="mr-2 h-4 w-4" />
                    SYSTEM
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    className="whitespace-nowrap bg-white text-black hover:bg-white/90"
                    onClick={() => setShowCleanConfirm(true)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    RESET
                  </Button>
                </>
              )}
            </div>

            {adminUnlockOpen && !adminUnlocked && adminUnlockError ? (
              <div className="max-w-[220px] rounded border border-destructive/30 bg-destructive/10 px-2 py-1 text-right text-xs font-medium text-destructive">
                {adminUnlockError}
              </div>
            ) : null}

            <div className="text-right">
              <div className="text-3xl font-bold text-white">{step + 1}</div>
              <div className="text-xs text-white/90">sur 6</div>
            </div>
          </div>
        </div>
      }
      headerClassName="bg-amber-800"
    >
      <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-1 flex-col overflow-hidden rounded-lg border border-border bg-background px-1 text-foreground shadow-2xl sm:px-2">
        <div className="h-1 shrink-0 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden bg-gradient-animated rounded-lg">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto p-8">
            {/* Step 0..5: steps - animated container */}
            <AnimatePresence mode="sync">
              {step === 0 && (
                <motion.div
                  key="step-0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.28 }}
                >
                  <div className="space-y-6">
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
                    📖 <strong>Étape 2/6 : Page "À propos"</strong><br />
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
                    🏷️ <strong>Étape 3/6 : Identité de la paroisse</strong><br />
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

            {/* Step 3: Bannières hero (pages publiques) */}
            {step === 3 && (
              <motion.div
                key="step-3-hero-banners"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.28 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/60 border border-border">
                  <img src={stepImages[3]} alt="" className="h-10 w-10 object-contain" />
                  <div className="leading-tight">
                    <div className="text-sm font-semibold">🖼️ Bannières hero</div>
                    <div className="text-xs text-muted-foreground">Images d’en-tête pour les pages publiques (accueil, à propos, galerie, etc.).</div>
                  </div>
                </div>
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    🖼️ <strong>Étape 4/6 : Bannières des pages</strong><br />
                    Optionnel : une image par page. Vous pourrez les modifier plus tard depuis chaque page.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {PUBLIC_HERO_BANNER_PAGES.map(({ path, label }) => (
                    <div
                      key={path}
                      className="rounded-lg border border-border bg-background/40 p-4 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold">{label}</div>
                          <div className="text-xs text-muted-foreground font-mono">{path}</div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                        <input
                          type="text"
                          className="flex-1 min-w-0 px-3 py-2 border border-border rounded-lg bg-background text-sm"
                          value={form.heroBanners[path] ?? ''}
                          onChange={(e) => setHeroBannerUrl(path, e.target.value)}
                          placeholder="https://…"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setHeroBannerUploadPath(path);
                            heroBannerFileInputRef.current?.click();
                          }}
                          disabled={uploading === `hero-banner-${path}`}
                          className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm font-medium"
                        >
                          {uploading === `hero-banner-${path}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          Téléverser
                        </button>
                      </div>
                      {getPreviewSrc(path, form.heroBanners[path]) ? (
                        <div className="flex items-center gap-3">
                          <img
                            src={getPreviewSrc(path, form.heroBanners[path])}
                            alt=""
                            className="h-20 w-36 rounded-md object-cover border border-border bg-muted"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <span className="text-xs text-muted-foreground">Aperçu</span>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">(aucune image)</div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border">
                  Les bannières apparaissent en haut de chaque page publique. Format recommandé : 16:9 (ex.
                  1200×675 px). Après validation avec OTP, elles sont enregistrées dès que la session est active.
                </div>
                <input
                  ref={heroBannerFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleHeroBannerFile}
                />
              </motion.div>
            )}

            {/* Step 4: Footer (site) */}
            {step === 4 && (
              <motion.div
                key="step-4-footer"
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
                    📞 <strong>Étape 5/6 : Pied de page</strong><br />
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

            {/* Step 5: Premier compte administrateur */}
            {step === 5 && (
              <motion.div
                key="step-5-admin"
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
                    👤 <strong>Étape 6/6 : Compte administrateur</strong><br />
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
                  {/* Champ de lien pour l'avatar */}
                  <div className="mb-2">
                    <Input
                      type="text"
                      placeholder="Coller un lien d'image (https://...)"
                      value={adminAvatarPreview && !adminAvatarFile ? adminAvatarPreview : ''}
                      onChange={e => {
                        const url = e.target.value.trim();
                        setAdminAvatarPreview(url);
                        setAdminAvatarFile(null);
                        setUseGravatar(false);
                      }}
                      className="w-full"
                    />
                    <span className="text-xs text-muted-foreground">Vous pouvez coller un lien d'image ou choisir un fichier.</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setAdminAvatarPreview('');
                        adminAvatarInputRef.current?.click();
                      }}
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
                        ref={otpInputRef}
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
            </AnimatePresence>

            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}
          </div>

          <div className="flex h-full min-h-0 w-80 shrink-0 flex-col overflow-y-auto border-l border-border bg-muted/30 p-8">
            <h5 className="sticky top-0 z-[1] mb-6 bg-muted/30 py-2 font-bold text-lg backdrop-blur-sm [-webkit-backdrop-filter:blur(8px)]">
              Aperçu
            </h5>

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
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Bannières hero</p>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {PUBLIC_HERO_BANNER_PAGES.map(({ path, label }) => (
                    <div key={path} className="p-2 rounded border border-border bg-background/80">
                      <div className="text-[11px] font-medium">{label}</div>
                      <div className="text-[10px] text-muted-foreground font-mono truncate">{path}</div>
                      {getPreviewSrc(path, form.heroBanners[path]) ? (
                        <img
                          src={getPreviewSrc(path, form.heroBanners[path])}
                          alt=""
                          className="mt-2 h-14 w-full rounded object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="mt-2 text-[11px] text-muted-foreground">(aucune image)</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
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

            {step === 5 && (
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

        <div className="flex shrink-0 items-center justify-between border-t border-border bg-muted/30 p-6">
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
        open={showCleanConfirm}
        onClose={() => {
          if (!fullCleanLoading) setShowCleanConfirm(false);
        }}
        draggableOnMobile={true}
        dragHandleOnly={false}
        verticalOnly={true}
        center={true}
        maxWidthClass="max-w-lg"
        title="Confirmation de nettoyage"
      >
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <Trash2 className="h-8 w-8 shrink-0" />
            <h3 className="text-lg font-bold">Action destructive</h3>
          </div>

          <p className="text-muted-foreground">
            Cette action supprime les données métier dans la base (RPC{' '}
            <code className="text-xs">clean_all_data</code> / <code className="text-xs">reset_all_data</code>) :
          </p>

          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>Paroisses, membres, profils (selon la politique côté serveur)</li>
            <li>Contenus (vidéos, événements, galerie, etc.)</li>
            <li>Configurations (en-tête, pied de page, bannières)</li>
          </ul>

          <p className="font-semibold text-amber-600 dark:text-amber-500">
            Le compte développeur et la paroisse SYSTEM sont en principe conservés par le script SQL.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={fullCleanLoading}
              onClick={() => setShowCleanConfirm(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={fullCleanLoading}
              onClick={() => void executeFullSystemClean()}
            >
              {fullCleanLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Nettoyage…
                </>
              ) : (
                'Confirmer le nettoyage'
              )}
            </Button>
          </div>
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
              <h3 className="text-lg font-bold text-white">Connexion développeur</h3>
              <p className="text-xs text-white/90 mt-1">
                Le compte est créé ou réparé au chargement de l’application ; connectez-vous ici pour l’admin.
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
                  const email = devEmail.trim().toLowerCase();
                  const password = devPassword;

                  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
                  if (signInErr) {
                    setDevBootstrapError(signInErr.message || 'Connexion impossible (vérifiez email / mot de passe).');
                    return;
                  }

                  const { error: ensureErr } = await supabase.rpc('ensure_developer_account');
                  if (ensureErr) {
                    const { error: legacyErr } = await supabase.rpc('ensure_developer_exists');
                    if (legacyErr) throw legacyErr;
                  }

                  markCompleted();
                  setShowDevBootstrap(false);
                  onClose();
                  window.location.assign('/admin');
                } catch (e: unknown) {
                  const details =
                    e instanceof Error
                      ? e.message
                      : typeof e === 'string'
                        ? e
                        : JSON.stringify(e ?? {});
                  console.error('SYSTEM modal sign-in error', e);
                  setDevBootstrapError(details || 'Connexion impossible.');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </Button>
          </div>
        </div>
      </DraggableModal>
    </>
  );
}
