import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import VideoDetail from "./pages/VideoDetail";
import VideosPage from "./pages/VideosPage";
import GalleryPage from "./pages/GalleryPage";
import EventsPage from "./pages/EventsPage";
import AboutPage from "./pages/AboutPage";
import ProfilePage from "./pages/ProfilePage";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminDashboard from "./pages/AdminDashboard";
import AdminHomepageEditor from "./pages/AdminHomepageEditor";
import ChatPage from './pages/ChatPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import NotificationProvider from '@/components/ui/notification-system';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <NotificationProvider>
        <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/connexion" element={<Navigate to="/#auth" replace />} />
            <Route path="/inscription" element={<Navigate to="/?mode=register#auth" replace />} />
            <Route path="/auth" element={<Index />} />
            <Route path="/videos" element={<VideosPage />} />
            <Route path="/videos/:id" element={<VideoDetail />} />
            <Route path="/galerie" element={<GalleryPage />} />
            <Route path="/evenements" element={<EventsPage />} />
            <Route path="/a-propos" element={<AboutPage />} />
            <Route
              path="/profil"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute admin>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/homepage"
              element={
                <ProtectedRoute admin>
                  <AdminHomepageEditor />
                </ProtectedRoute>
              }
            />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/announcements" element={<AnnouncementsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </AuthProvider>
      </NotificationProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
