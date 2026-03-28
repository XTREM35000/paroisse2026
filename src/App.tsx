import React, { useCallback, useEffect, useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Layout from "@/components/Layout";
import ScrollToTop from '@/components/ScrollToTop';
import RedirectHandler from '@/components/RedirectHandler';
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import VideoDetail from "./pages/VideoDetail";
import VideosPage from "./pages/VideosPage";
import GalleryPage from "./pages/GalleryPage";
import EventsPage from "./pages/EventsPage";
import AboutPage from "./pages/AboutPage";
import ProfilePage from "./pages/ProfilePage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLiveStats from "./pages/AdminLiveStats";
import AdminVodStats from "./pages/AdminVodStats";
import AdminFinanceStats from "./pages/AdminFinanceStats";
import AdminHomepageEditor from "./pages/AdminHomepageEditor";
import AdminEvents from "./pages/AdminEvents";
import EventDetail from './pages/EventDetail';
import AdminAboutEditor from './pages/AdminAboutEditor';
import AdminDirectoryEditor from './pages/AdminDirectoryEditor';
import AdminLiveEditor from './pages/AdminLiveEditor';
import AdminNotificationsEditor from './pages/AdminNotificationsEditor';
import AdminContentApprovals from './pages/AdminContentApprovals';
import AddMemberForm from '@/components/AddMemberForm';
import ChatPage from './pages/ChatPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import PublicitePage from './pages/PublicitePage';
import Dashboard from './pages/Dashboard';
import DashboardAnalytics from './pages/DashboardAnalytics';
import Podcasts from './pages/Podcasts';
import DevSupabaseDebug from './pages/DevSupabaseDebug';
import PasswordResetTestPage from './pages/PasswordResetTestPage';
import Documents from './pages/Documents';
import Live from './pages/Live';
import Homilies from './pages/Homilies';
import Prayers from './pages/Prayers';
import Verse from './pages/Verse';
import Directory from './pages/Directory';
import Donate from './pages/Donate';
import DonationSuccess from './pages/donation-success';
import Campaigns from './pages/Campaigns';
import DonationsHistory from './pages/DonationsHistory';
import Receipts from './pages/Receipts';
import AdminDonate from './pages/AdminDonate';
import AdminUsers from './pages/AdminUsers';
import AdminSettings from './pages/AdminSettings';
import AdminAds from './pages/AdminAds';
import HelpPage from './pages/HelpPage';
import Unauthorized from './pages/Unauthorized';
import NotificationProvider from '@/components/ui/notification-system';
import MembersPage from './pages/MembersPage';
import AdminTutorielsPage from './pages/AdminTutorielsPage';
import LexiquePage from './pages/LexiquePage';
import Notifications from './pages/Notifications';
import { ToastProvider } from '@/contexts/ToastContext';
import EmailConfirmedPage from './pages/EmailConfirmedPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import DataDeletionPage from './pages/DataDeletionPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import DocProjetPage from './pages/DocProjetPage';
import AuthCallback from './pages/AuthCallback';
import EmailConfirmationSent from './pages/EmailConfirmationSent';
import AdminMemberCards from './pages/AdminMemberCards';
import AdminCertificates from './pages/AdminCertificates';
import AdminMasterReset from './pages/AdminMasterReset';
import AdminParoisses from './pages/AdminParoisses';
import DeveloperAdminPage from './pages/DeveloperAdminPage';
import WelcomeModal from './components/WelcomeModal';
import { ParoisseProvider, useParoisse } from '@/contexts/ParoisseContext';
import { useAuthContext } from '@/contexts/useAuthContext';
import { SetupProvider } from '@/contexts/SetupContext';
import { ParoisseSelector } from '@/components/ParoisseSelector';
import SetupWizardModal from '@/components/SetupWizardModal';
import { supabase } from '@/integrations/supabase/client';
import { syncDeveloperAccess } from '@/lib/initializeDeveloper';
import { markAppInitialized, runAppInitialization } from '@/lib/appInitializer';

/**
 * Debug uniquement : `true` = ouvre le sélecteur à chaque chargement (ignore la paroisse sauvegardée).
 * En production, laisser à `false`.
 */
const FORCE_PAROISSE_MODAL_ON_LAUNCH = false;

const queryClient = new QueryClient();

const AppInner = () => {
  const { paroisse, paroissesList, setParoisse, isLoading, isSelectorOpen, setSelectorOpen } = useParoisse();
  const { user, role, loading: authLoading } = useAuthContext();
  const [showSetupWizardAuto, setShowSetupWizardAuto] = useState(false);
  const [firstLaunchCheckDone, setFirstLaunchCheckDone] = useState(false);
  // Flag pour bloquer la réouverture du wizard après finalisation
  const [isSetupFinalized, setIsSetupFinalized] = useState(false);

  const isPlatformDeveloper =
    !!user &&
    (String(role || '').toLowerCase() === 'developer' ||
      String((user.user_metadata as { role?: string } | undefined)?.role || '').toLowerCase() === 'developer');

  /** Après choix / restauration paroisse, ou prompt déjà terminé — alors seulement le splash welcome peut s'afficher. */
  const [paroisseGateDone, setParoisseGateDone] = useState(false);
  const isDeveloperAdminRoute =
    typeof window !== 'undefined' &&
    (window.location.pathname.startsWith('/developer/admin') ||
      window.location.pathname.startsWith('/developper/admin'));

  const handleParoisseSelectorClose = useCallback(() => {
    setSelectorOpen(false);
    setParoisseGateDone(true);
  }, [setSelectorOpen]);

  /** Developer : contexte tenant requis pour la plupart des pages — sélectionner une paroisse par défaut si rien en stockage. */
  useEffect(() => {
    if (isLoading || authLoading || !user || !isPlatformDeveloper || paroisse) return;
    const firstReal = paroissesList.find((p) => p.slug !== 'system');
    if (firstReal) setParoisse(firstReal);
  }, [isLoading, authLoading, user, isPlatformDeveloper, paroisse, paroissesList, setParoisse]);

  /** Mode forcé : ouverture au montage + dès que le chargement liste termine (au cas où le 1er tick échoue). */
  useEffect(() => {
    if (!FORCE_PAROISSE_MODAL_ON_LAUNCH) return;
    setSelectorOpen(true);
  }, [setSelectorOpen, isLoading]);

  /**
   * Logique par défaut : après chargement des paroisses, si aucune paroisse n’est restaurée
   * depuis `localStorage` → ouvrir le modal (y compris au rechargement, utilisateur connecté ou non).
   * Ne plus utiliser `ff_paroisse_welcome_seen` pour masquer ce modal : ça bloquait le rechargement.
   */
  useEffect(() => {
    if (FORCE_PAROISSE_MODAL_ON_LAUNCH) return;

    if (isLoading || authLoading) return;

    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const shouldSkipParoisseSelector =
      pathname.startsWith('/developer/admin') || pathname.startsWith('/developper/admin');
    if (shouldSkipParoisseSelector) {
      setSelectorOpen(false);
      setParoisseGateDone(true);
      return;
    }

    if (paroisse) {
      setSelectorOpen(false);
      setParoisseGateDone(true);
      return;
    }

    setParoisseGateDone(false);
    setSelectorOpen(true);
  }, [isLoading, authLoading, paroisse, setSelectorOpen]);

  useEffect(() => {
    let mounted = true;
    const initializeOnFirstLoad = async () => {
      const status = await runAppInitialization();
      if (!mounted) return;

      if (status.shouldForceSetupWizard) {
        try {
          if (localStorage.getItem('setupCompleted') === 'true') {
            setShowSetupWizardAuto(false);
          } else {
            setShowSetupWizardAuto(true);
          }
        } catch {
          setShowSetupWizardAuto(true);
        }
      }
      setFirstLaunchCheckDone(true);
    };

    // Non-bloquant: le rendu de l'UI continue pendant l'initialisation.
    void initializeOnFirstLoad();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
  <ScrollToTop />
        <RedirectHandler />
        {paroisseGateDone ? <WelcomeModal autoCloseDelayMs={5000} /> : null}
        <SetupWizardModal
          open={showSetupWizardAuto && !isSetupFinalized}
          onClose={() => {
            setShowSetupWizardAuto(false);
            if (firstLaunchCheckDone) {
              markAppInitialized();
            }
          }}
          onSetupCompleted={() => {
            console.info('[App] onSetupCompleted - wizard à fermer');
            setIsSetupFinalized(true); // ← IMPORTANT : bloque toute réouverture
            setShowSetupWizardAuto(false);
            console.info('[App] setupCompleted flag = true');
          }}
        />
        <Routes>
          <Route path="/" element={<Layout><Index /></Layout>} />
          <Route path="/connexion" element={<Navigate to="/#auth" replace />} />
          <Route path="/inscription" element={<Navigate to="/?mode=register#auth" replace />} />
          <Route path="/auth" element={<Layout><Index /></Layout>} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/email-confirmation-sent" element={<EmailConfirmationSent />} />
          <Route path="/email-confirmed" element={<EmailConfirmedPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/data-deletion" element={<DataDeletionPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="/videos" element={<Layout><VideosPage /></Layout>} />
          <Route path="/videos/:id" element={<Layout><VideoDetail /></Layout>} />
          <Route path="/galerie" element={<Layout><GalleryPage /></Layout>} />
          <Route path="/evenements" element={<Layout><EventsPage /></Layout>} />
          <Route path="/evenements/:slug" element={<Layout><Index /></Layout>} />
          <Route path="/a-propos" element={<Layout><AboutPage /></Layout>} />
          <Route path="/help" element={<Layout><HelpPage /></Layout>} />
          <Route path="/lexique" element={<Layout><LexiquePage /></Layout>} />
          <Route path="/prospect" element={<Layout><DocProjetPage /></Layout>} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout><ProfilePage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <Layout><AdminDashboard /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/stats-live"
            element={
              <ProtectedRoute requiredRole="admin">
                <Layout><AdminLiveStats /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/stats-vod"
            element={
              <ProtectedRoute requiredRole="admin">
                <Layout><AdminVodStats /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/stats-finances"
            element={
              <ProtectedRoute requiredRole="admin">
                <Layout><AdminFinanceStats /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/homepage"
            element={
              <ProtectedRoute requiredRole="admin">
                <Layout><AdminHomepageEditor /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/live"
            element={
              <ProtectedRoute requiredRole="admin">
                <Layout><AdminLiveEditor /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <ProtectedRoute requiredRole="admin">
                <Layout><AdminNotificationsEditor /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/approvals"
            element={
              <ProtectedRoute requiredRole="admin">
                <Layout><AdminContentApprovals /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/about"
            element={
              <ProtectedRoute requiredRole="admin">
                <Layout><AdminAboutEditor /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminEvents />
              </ProtectedRoute>
            }
          />
          <Route path="/chat" element={<Layout><ChatPage /></Layout>} />
          <Route path="/announcements" element={<Layout><AnnouncementsPage /></Layout>} />
          <Route path="/affiche" element={<Layout><PublicitePage /></Layout>} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/dashboard/analytics" element={<Layout><DashboardAnalytics /></Layout>} />
          <Route path="/radio" element={<Layout><Podcasts /></Layout>} />
          <Route path="/documents" element={<Layout><Documents /></Layout>} />
          <Route path="/live" element={<Layout><Live /></Layout>} />
          <Route path="/dev/supabase-debug" element={<Layout><DevSupabaseDebug /></Layout>} />
          <Route path="/dev/test-password-reset" element={<PasswordResetTestPage />} />
          <Route path="/notifications" element={<ProtectedRoute><Layout><Notifications /></Layout></ProtectedRoute>} />
          <Route path="/homilies" element={<Layout><Homilies /></Layout>} />
          <Route path="/prayers" element={<Layout><Prayers /></Layout>} />
          <Route path="/verse" element={<Layout><Verse /></Layout>} />
          <Route path="/directory" element={<Layout><Directory /></Layout>} />
          <Route path="/donate" element={<Layout><Donate /></Layout>} />
          <Route path="/donation-success" element={<Layout><DonationSuccess /></Layout>} />
          <Route
            path="/admin/donate"
            element={
              <ProtectedRoute requiredRole="admin">
                <Layout><AdminDonate /></Layout>
              </ProtectedRoute>
            }
          />
          <Route path="/campaigns" element={<Layout><Campaigns /></Layout>} />
          <Route path="/donations" element={<Layout><DonationsHistory /></Layout>} />
          <Route path="/receipts" element={<Layout><Receipts /></Layout>} />
          <Route
            path="/admin/users"
            element={<ProtectedRoute requiredRole="admin"><Layout><AdminUsers /></Layout></ProtectedRoute>}
          />
          <Route
            path="/admin/settings"
            element={<ProtectedRoute requiredRole="admin"><Layout><AdminSettings /></Layout></ProtectedRoute>}
          />
          <Route
            path="/admin/ads"
            element={<ProtectedRoute requiredRole="admin"><Layout><AdminAds /></Layout></ProtectedRoute>}
          />
          <Route
            path="/admin/master-reset"
            element={
              <ProtectedRoute requiredRole="super_admin">
                <Layout><AdminMasterReset /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/paroisses"
            element={
              <ProtectedRoute requiredRole="super_admin">
                <Layout><AdminParoisses /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/developer/admin"
            element={
              <ProtectedRoute>
                <DeveloperAdminPage />
              </ProtectedRoute>
            }
          />
          <Route path="/developper/admin" element={<Navigate to="/developer/admin" replace />} />
          <Route
            path="/admin/tutoriels"
            element={<ProtectedRoute requiredRole="admin"><Layout><AdminTutorielsPage /></Layout></ProtectedRoute>}
          />
          <Route
            path="/admin/directory"
            element={<ProtectedRoute requiredRole="admin"><Layout><AdminDirectoryEditor /></Layout></ProtectedRoute>}
          />
          <Route
            path="/admin/member-cards"
            element={<ProtectedRoute requiredRole="admin"><Layout><AdminMemberCards /></Layout></ProtectedRoute>}
          />
          <Route
            path="/admin/certificates"
            element={<ProtectedRoute requiredRole="admin"><Layout><AdminCertificates /></Layout></ProtectedRoute>}
          />
          <Route
            path="/admin/members"
            element={
              <ProtectedRoute requiredRole="admin">
                <Layout><MembersPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/add-member"
            element={
              <ProtectedRoute requiredRole="admin">
                <Layout><AddMemberForm /></Layout>
              </ProtectedRoute>
            }
          />
          <Route path="/membres" element={<Layout><MembersPage /></Layout>} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<Layout><NotFound /></Layout>} />
        </Routes>

        {/* Dans le Router pour que ParoisseSelector puisse utiliser useNavigate() */}
        <ParoisseSelector open={isSelectorOpen && !isDeveloperAdminRoute} onClose={handleParoisseSelectorClose} />
      </BrowserRouter>
    </div>
  );
};

const App = () => {
  useEffect(() => {
    let isMounted = true;

    const initializeDeveloperSync = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (error) {
          console.error('[App] Impossible de vérifier la session pour create-developer:', error);
          return;
        }

        if (!data.session?.user) {
          console.debug('[App] Pas d’utilisateur authentifié, create-developer ignoré.');
          return;
        }

        // Non bloquant pour l'UI : l'appel n'est pas attendu ici.
        void syncDeveloperAccess();
      } catch (err) {
        console.error('[App] Erreur inattendue pendant l’initialisation developer:', err);
      }
    };

    void initializeDeveloperSync();

    return () => {
      isMounted = false;
    };
  }, []);

  // Debugging: track visibility changes (gardé)
  React.useEffect(() => {
    const onVisibilityChange = () => {
      const state = document.visibilityState;
      const ts = new Date().toISOString();
      console.debug('visibilitychange', { state, ts, href: window.location.href });
      if (state === 'visible') {
        console.debug('visibilitychange stack:', new Error('visibilitychange stack').stack);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  // ❌ SUPPRIMÉ : Le blocage de navigation vers /donation-success qui causait le problème
  // ✅ La navigation fonctionne maintenant normalement

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <NotificationProvider>
          <ThemeProvider>
          <AuthProvider>
          <ToastProvider>
          <ParoisseProvider>
            <SetupProvider>
              <AppInner />
            </SetupProvider>
          </ParoisseProvider>
          </ToastProvider>
        </AuthProvider>
        </ThemeProvider>
      </NotificationProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;