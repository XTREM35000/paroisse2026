/**
 * EXEMPLE D'INTÉGRATION ROUTER
 * 
 * Cet exemple montre comment intégrer ChatPage dans votre router
 * (React Router v6+)
 */

// ============================================
// EXEMPLE 1: Intégration simple
// ============================================

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ChatPage from '@/pages/ChatPage';
import Layout from '@/components/Layout';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/chat" element={<Layout><ChatPage /></Layout>} />
        {/* ... autres routes */}
      </Routes>
    </BrowserRouter>
  );
}

// ============================================
// EXEMPLE 2: Avec ProtectedRoute
// ============================================

import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Chat protected - utilisateur doit être connecté */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Layout>
                <ChatPage />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

// ============================================
// EXEMPLE 3: Navigation vers ChatPage
// ============================================

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function StartChatButton() {
  const navigate = useNavigate();

  return (
    <Button
      onClick={() => navigate('/chat')}
      className="gap-2"
    >
      💬 Ouvrir le chat
    </Button>
  );
}

// ============================================
// EXEMPLE 4: En-tête avec lien chat
// ============================================

import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import useUnreadMessages from '@/hooks/useUnreadMessages';

export function HeaderNavigation() {
  const { unreadCount } = useUnreadMessages();

  return (
    <nav className="flex gap-4">
      <Link to="/chat" className="relative">
        <MessageCircle className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-destructive text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Link>
    </nav>
  );
}

// ============================================
// EXEMPLE 5: Sidebar with chat link
// ============================================

import { Sidebar } from '@/components/Sidebar';
import { MessageCircle } from 'lucide-react';

export function EnhancedSidebar() {
  const sidebarItems = [
    {
      label: 'Chat',
      icon: MessageCircle,
      path: '/chat',
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    // ... autres items
  ];

  return <Sidebar items={sidebarItems} />;
}

// ============================================
// EXEMPLE 6: Avec lazy loading (performance)
// ============================================

import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const ChatPage = lazy(() => import('@/pages/ChatPage'));

function ChatPageLoader() {
  return <Skeleton className="w-full h-screen" />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/chat"
          element={
            <Suspense fallback={<ChatPageLoader />}>
              <Layout>
                <ChatPage />
              </Layout>
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

// ============================================
// EXEMPLE 7: Avec gestion d'erreurs
// ============================================

import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
      <h2 className="font-bold">Erreur lors du chargement du chat</h2>
      <p className="text-sm">{error.message}</p>
    </div>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/chat"
          element={
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <Layout>
                <ChatPage />
              </Layout>
            </ErrorBoundary>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

// ============================================
// EXEMPLE 8: Avec paramètres (room spécifique)
// ============================================

// Pour une intégration avancée avec un ID de salle :
// Route: /chat/:roomId

import { useParams } from 'react-router-dom';

export function ChatPageWithParams() {
  const { roomId } = useParams<{ roomId: string }>();

  // Pourrait être implémenté pour ouvrir directement une salle
  return <ChatPage initialRoomId={roomId} />;
}

// ============================================
// EXEMPLE 9: Mobile avec navigation onglet
// ============================================

export function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border lg:hidden">
      <div className="flex gap-0 justify-around">
        <Link
          to="/"
          className="flex-1 py-3 text-center hover:bg-muted"
        >
          🏠
        </Link>
        <Link
          to="/chat"
          className="flex-1 py-3 text-center hover:bg-muted relative"
        >
          💬
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 bg-destructive text-white text-xs rounded-full px-1">
              {unreadCount}
            </span>
          )}
        </Link>
        {/* ... autres items */}
      </div>
    </nav>
  );
}

// ============================================
// EXEMPLE 10: Accessibilité et sémantique
// ============================================

export function AccessibleChatLink() {
  const { unreadCount } = useUnreadMessages();

  return (
    <a
      href="/chat"
      className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg"
      aria-label={`Ouvrir le chat${unreadCount > 0 ? ` (${unreadCount} non lus)` : ''}`}
      title="Ouvrir les messages"
    >
      <MessageCircle className="h-5 w-5" aria-hidden="true" />
      <span>Chat</span>
      {unreadCount > 0 && (
        <span
          className="ml-auto text-xs font-bold text-destructive"
          aria-label={`${unreadCount} messages non lus`}
        >
          {unreadCount}
        </span>
      )}
    </a>
  );
}

// ============================================
// NOTES IMPORTANTES
// ============================================

/*
✅ BONNES PRATIQUES:

1. Toujours envelopper ChatPage avec Layout
   <Layout><ChatPage /></Layout>

2. Utiliser ProtectedRoute si le chat est réservé aux membres
   <ProtectedRoute><ChatPage /></ProtectedRoute>

3. Intégrer useUnreadMessages pour les badges
   const { unreadCount } = useUnreadMessages()

4. Utiliser lazy loading pour une meilleure performance
   const ChatPage = lazy(() => import('@/pages/ChatPage'))

5. Ajouter une ErrorBoundary pour capturer les erreurs
   <ErrorBoundary><ChatPage /></ErrorBoundary>

❌ PIÈGES À ÉVITER:

1. ❌ Ne pas envelopper avec Layout
   <ChatPage /> (sans Layout)

2. ❌ Permettre l'accès au chat sans authentification
   (Toujours utiliser ProtectedRoute ou vérifier useAuth)

3. ❌ Charger ChatPage sans Suspense si lazy loaded
   (Ajouter un loader)

4. ❌ Naviguer directement sans useNavigate
   window.location.href = '/chat' (perdre le contexte React)

5. ❌ Modifier ChatPage.tsx directement en production
   (Faire une copie ou créer une branche)
*/

export {};
