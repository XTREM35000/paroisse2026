import React from 'react';
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
import AdminMemberCards from './pages/AdminMemberCards';
import AdminCertificates from './pages/AdminCertificates';

const queryClient = new QueryClient();

const App = () => {
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
          <BrowserRouter>
            <ScrollToTop />
            <RedirectHandler />
          <Routes>
            <Route path="/" element={<Layout><Index /></Layout>} />
            <Route path="/connexion" element={<Navigate to="/#auth" replace />} />
            <Route path="/inscription" element={<Navigate to="/?mode=register#auth" replace />} />
            <Route path="/auth" element={<Layout><Index /></Layout>} />
            <Route path="/auth/callback" element={<AuthCallback />} />
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
              path="/profil"
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
            
            {/* ✅ Routes de donation - placées stratégiquement */}
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
            <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><Layout><AdminUsers /></Layout></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute requiredRole="admin"><Layout><AdminSettings /></Layout></ProtectedRoute>} />
            <Route path="/admin/ads" element={<ProtectedRoute requiredRole="admin"><Layout><AdminAds /></Layout></ProtectedRoute>} />
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
            <Route path="/admin/members" element={
              <ProtectedRoute requiredRole="admin">
                <Layout><MembersPage /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/add-member" element={
              <ProtectedRoute requiredRole="admin">
                <Layout><AddMemberForm /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/membres" element={<Layout><MembersPage /></Layout>} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* ✅ Route catch-all - TOUJOURS À LA FIN */}
            <Route path="*" element={<Layout><NotFound /></Layout>} />
          </Routes>
        </BrowserRouter>
        </ToastProvider>
        </AuthProvider>
        </ThemeProvider>
      </NotificationProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;