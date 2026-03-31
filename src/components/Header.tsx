import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, UserCircle, LogOut, HelpCircle, Menu, X, Home, Info, Users, MessageCircle, Bell, FileText, MoreVertical, Shield } from "lucide-react";
import AnimatedLogo from "./AnimatedLogo";
const AuthModal = lazy(() => import("./AuthModal"));
const ForgotPasswordModal = lazy(() => import("./ForgotPasswordModal"));
const MobileSidebar = lazy(() => import("./MobileSidebar"));
import { MENU_GROUPS } from "./Sidebar";
import ThemeToggle from "./ThemeToggle";
import HeaderSkeleton from "./HeaderSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useAuthContext } from "@/contexts/useAuthContext";
import { useUser } from "@/hooks/useUser";
import { useHeaderConfig } from "@/hooks/useHeaderConfig";
import useRoleCheck from '@/hooks/useRoleCheck';
import useUnreadNotifications from '@/hooks/useUnreadNotifications';
import useUnreadMessages from '@/hooks/useUnreadMessages';
import { supabase } from '@/integrations/supabase/client';
import useLiveStatus from "@/hooks/useLiveStatus";
import LiveStatusBadge from "@/components/LiveStatusBadge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useParoisse } from '@/contexts/ParoisseContext';

interface HeaderProps {
  darkMode?: boolean;
  toggleDarkMode?: () => void;
  onOpenAuthModal?: (mode: 'login' | 'register') => void;
}

const useHeaderSpace = () => {
  const [availableSpace, setAvailableSpace] = useState<"full" | "medium" | "compact">("full");

  useEffect(() => {
    const checkSpace = () => {
      if (typeof window === "undefined") return;
      const width = window.innerWidth;
      if (width < 400) setAvailableSpace("compact");
      else if (width < 600) setAvailableSpace("medium");
      else setAvailableSpace("full");
    };

    checkSpace();
    window.addEventListener("resize", checkSpace);
    return () => window.removeEventListener("resize", checkSpace);
  }, []);

  return availableSpace;
};

const Header = ({ darkMode = false, toggleDarkMode = () => {}, onOpenAuthModal }: HeaderProps) => {
  // All hooks FIRST, in strict order
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const headerSpace = useHeaderSpace();
  const isCompactHeader = headerSpace === "compact";
  const isFullHeader = headerSpace === "full";
  
  const location = useLocation();
  const authMode = new URLSearchParams(location.search).get("mode") === "register" ? "register" : "login";
  const emailJustConfirmed = new URLSearchParams(location.search).get("confirmed") === "true";
  const navigate = useNavigate();
  const { user, signOut } = useAuthContext();
  const { profile } = useUser();
  const isGuest = profile?.role === 'guest';
  const { isAdmin, isSuperAdmin } = useRoleCheck();
  const { data: headerConfig, isLoading: headerLoading } = useHeaderConfig();
  const { unreadCount: unreadNotificationsCount, markAllAsRead: markAllAsReadNotifications } = useUnreadNotifications();
  const { unreadCount: unreadMessagesCount, markAllAsRead } = useUnreadMessages();
  const { isLiveActive } = useLiveStatus();
  const isConnected = !!user;
  const { paroisse } = useParoisse();

  // Favicon effect
  useEffect(() => {
    if (!headerConfig?.logo_url) return;
    try {
      const url = headerConfig.logo_url;
      const cacheBusted = url + (url.includes('?') ? '&' : '?') + 'v=' + Date.now();
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = cacheBusted;
      let apple: HTMLLinkElement | null = document.querySelector("link[rel='apple-touch-icon']");
      if (!apple) {
        apple = document.createElement('link');
        apple.rel = 'apple-touch-icon';
        document.head.appendChild(apple);
      }
      apple.href = cacheBusted;
    } catch (e) {
      // noop
    }
  }, [headerConfig?.logo_url]);

  // Close mobile menu when auth state changes
  useEffect(() => {
    if (!user) {
      setIsMobileMenuOpen(false);
    }
  }, [user]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle auth modal (tolerant to additional params after #auth)
  useEffect(() => {
    setIsAuthModalOpen(location.hash.includes('#auth'));
  }, [location.hash]);

  // User menu outside click / Escape handler
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!isUserMenuOpen) return;
      const target = e.target as Node | null;
      if (userMenuRef.current && target && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsUserMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [isUserMenuOpen]);

  // Also listen to raw hashchange events to ensure clicks that only update window.location.hash
  // are handled immediately (some environments do not always propagate through react-router's location)
  useEffect(() => {
    const onHash = () => setIsAuthModalOpen(window.location.hash.includes('#auth'));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);


  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Zone gauche : menu burger + logo + titre */}
          <div className="flex items-center gap-3">
            {user && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-muted-foreground"
                onClick={() => setIsMobileMenuOpen(prev => !prev)}
                title="Menu mobile"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            )}

            <Link to={isAdmin ? "/admin" : "/"} className="flex items-center gap-2 flex-shrink-0 group">
              {/* Logo dynamique avec animation 3D + étoiles dorées */}
              <div className="relative animate-star-rotate-3d" style={{ perspective: '1000px' }}>
                {headerConfig?.logo_url ? (
                    <>
                      <img
                        src={headerConfig.logo_url}
                        alt={headerConfig.logo_alt_text ?? 'Logo'}
                        loading="lazy"
                        className={
                          (headerConfig.logo_size ?? 'sm') === 'sm'
                            ? 'h-10 md:h-12 w-auto object-contain animate-sparkle'
                            : (headerConfig.logo_size ?? 'sm') === 'md'
                            ? 'h-12 md:h-14 w-auto object-contain animate-sparkle'
                            : 'h-16 md:h-20 w-auto object-contain animate-sparkle'
                        }
                      />
                      {/* Étoiles décoratives animées autour du logo (plus visibles) */}
                      <div className="absolute -top-2 -right-2 text-sm md:text-base animate-pulse-slow opacity-90">⭐</div>
                      <div className="absolute -bottom-2 -left-2 text-sm md:text-base animate-pulse-slow opacity-80" style={{ animationDelay: '0.9s' }}>✨</div>
                    </>
                  ) : (
                    <div className="animate-sparkle">
                      <AnimatedLogo size={(headerConfig?.logo_size ?? 'sm') as any} />
                    </div>
                  )}
              </div>
              
              {/* Titres dynamiques */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="relative"
              >
                {headerConfig?.main_title && (
                  <div className="flex items-center gap-2">
                    <h1 className="text-sm lg:text-base font-semibold text-foreground leading-tight animate-glow-text">
                      {headerConfig.main_title}
                    </h1>
                  </div>
                )}
                {headerConfig?.subtitle && (
                  <p className="text-xs text-muted-foreground -mt-0.5 animate-float-soft">
                    {headerConfig.subtitle}
                  </p>
                )}
              </motion.div>
            </Link>

            {/* Navigation Menu - Desktop */}
            <nav className="hidden md:flex items-center gap-3 ml-3">
              {/* Badge Actif / Inactif juste avant "Accueil" */}
              {isConnected ? (
                <span className="inline-block px-2 py-0.5 text-[0.7rem] font-bold rounded-full bg-gradient-to-r from-emerald-400 to-green-500 text-white animate-badge-color-shift shadow-md">
                  Actif
                </span>
              ) : (
                <span className="inline-block px-2 py-0.5 text-[0.7rem] font-bold rounded-full bg-gradient-to-r from-slate-500 to-slate-700 text-slate-100 shadow-md">
                  Inactif
                </span>
              )}
              {(headerConfig?.navigation_items || []).map((item, index) => (
                <Link 
                  key={index}
                  to={item.href}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  title={item.label}
                >
                  {item.icon === 'home' && <Home className="h-4 w-4" />}
                  {item.icon === 'info' && <Info className="h-4 w-4" />}
                  {item.icon === 'play-circle' && <User className="h-4 w-4" />}
                  {item.icon === 'calendar' && <User className="h-4 w-4" />}
                  <span>{item.label}</span>
                </Link>
              ))}
              {/* Prospect Link - Accessible à tous */}
              <Link 
                to="/prospect"
                className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                title="Prospect"
              >
                <FileText className="h-4 w-4" />
                <span>Prospect</span>
              </Link>
            </nav>
          </div>

          {/* Zone droite : badge Direct + actions avec priorité */}
          <div className="flex items-center gap-2">
            {/* Badge Direct : toujours visible */}
            <LiveStatusBadge isLive={isLiveActive} />

            {/* Icônes supplémentaires : aide + chat + notifications */}
            {isFullHeader ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/help")}
                  className="text-muted-foreground hover:text-foreground"
                  title="Aide"
                >
                  <HelpCircle className="h-5 w-5" />
                </Button>

                {user && !isGuest && (
                  <>
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          await markAllAsRead();
                          navigate('/chat');
                        }}
                        className="text-muted-foreground hover:text-foreground"
                        title="Chat en direct"
                      >
                        <MessageCircle className="h-5 w-5" />
                      </Button>
                      {unreadMessagesCount > 0 && (
                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold leading-none text-white bg-gradient-to-r from-rose-500 to-rose-600 rounded-full animate-badge-pulse shadow-lg">
                          {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          await markAllAsReadNotifications();
                          navigate('/notifications');
                        }}
                        className="text-muted-foreground hover:text-foreground"
                        title="Notifications"
                      >
                        <Bell className="h-5 w-5" />
                      </Button>
                      {unreadNotificationsCount > 0 && (
                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold leading-none text-white bg-gradient-to-r from-amber-500 to-orange-600 rounded-full animate-badge-pulse shadow-lg">
                          {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground"
                    title="Plus d'actions"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem
                    onClick={() => navigate("/help")}
                  >
                    <HelpCircle className="mr-2 h-4 w-4" /> Aide
                  </DropdownMenuItem>
                  {user && !isGuest && (
                    <>
                      <DropdownMenuItem
                        onClick={async () => {
                          await markAllAsRead();
                          navigate('/chat');
                        }}
                      >
                        <MessageCircle className="mr-2 h-4 w-4" /> Chat en direct
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={async () => {
                          await markAllAsReadNotifications();
                          navigate('/notifications');
                        }}
                      >
                        <Bell className="mr-2 h-4 w-4" /> Notifications
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Toggle thème : toujours visible */}
            <ThemeToggle />

            {/* Icône utilisateur : toujours visible, animée si non connecté */}
            <div className="relative" ref={userMenuRef}>
              {user ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="text-muted-foreground hover:text-foreground overflow-hidden rounded-full"
                  title={user.email || "Mon compte"}
                >
                  {(() => {
                    let avatarSrc: string | null = null;
                    if (user && profile?.avatar_url) {
                      const val = String(profile.avatar_url);
                      if (val.startsWith('http') || val.startsWith('data:')) {
                        avatarSrc = val;
                      } else {
                        const bucket = import.meta.env.VITE_BUCKET_AVATAR || 'avatars';
                        try {
                          const { data } = supabase.storage.from(bucket).getPublicUrl(val);
                          avatarSrc = data?.publicUrl || null;
                        } catch {
                          avatarSrc = null;
                        }
                      }
                    }
                    const fallbackLabel = profile?.full_name?.[0] ?? user.email?.[0] ?? "👤";
                    return (
                      <Avatar className="h-8 w-8">
                        {avatarSrc && <AvatarImage src={avatarSrc} alt={profile?.full_name || user.email} />}
                        <AvatarFallback>{fallbackLabel}</AvatarFallback>
                      </Avatar>
                    );
                  })()}
                </Button>
              ) : (
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1.2, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  whileHover={{ scale: 1.3 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/#auth')}
                    className="relative"
                    title="Se connecter"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-sm opacity-70" />
                    <UserCircle className="h-6 w-6 relative z-10 text-white" />
                  </Button>
                </motion.div>
              )}

              {/* Dropdown menu seulement si connecté */}
              <AnimatePresence>
                {isUserMenuOpen && user && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg p-2 z-50"
                  >
                    <div className="px-3 py-2 border-b border-border/50">
                      <p className="text-xs font-medium text-foreground truncate">
                        {profile?.full_name || user.email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isGuest ? 'Invité' : 'Connecté'}
                      </p>
                    </div>

                    {isGuest ? (
                      <>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-xs mt-1"
                          onClick={() => {
                            navigate('/profile');
                            setIsUserMenuOpen(false);
                          }}
                        >
                          <User className="h-4 w-4 mr-2" />
                          Modifier profil
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={async () => {
                            await signOut();
                            setIsUserMenuOpen(false);
                            setIsMobileMenuOpen(false);
                            navigate('/');
                          }}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Déconnexion
                        </Button>
                      </>
                    ) : (
                      <>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-xs mt-1"
                            onClick={() => {
                              navigate('/membres');
                              setIsUserMenuOpen(false);
                            }}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Membre
                          </Button>
                        )}
                        {isSuperAdmin && (
                          <>
                            <Button
                              variant="ghost"
                              className="w-full justify-start text-xs mt-1"
                              onClick={() => {
                                navigate('/admin/roles');
                                setIsUserMenuOpen(false);
                              }}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Gestion des rôles
                            </Button>
                            <Button
                              variant="ghost"
                              className="w-full justify-start text-xs mt-1"
                              onClick={() => {
                                navigate('/admin/officiants');
                                setIsUserMenuOpen(false);
                              }}
                            >
                              <Users className="h-4 w-4 mr-2" />
                              Gestion des officiants
                            </Button>
                          </>
                        )}

                        <Button
                          variant="ghost"
                          className="w-full justify-start text-xs mt-1"
                          onClick={() => {
                            navigate('/profile');
                            setIsUserMenuOpen(false);
                          }}
                        >
                          <User className="h-4 w-4 mr-2" />
                          Mon profil
                        </Button>

                        <Button
                          variant="ghost"
                          className="w-full justify-start text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={async () => {
                            await signOut();
                            setIsUserMenuOpen(false);
                            setIsMobileMenuOpen(false);
                            navigate('/');
                          }}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Déconnexion
                        </Button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            </div>
          </div>

        {/* Mobile Sidebar */}
        <Suspense fallback={null}>
          <MobileSidebar
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
            // @ts-expect-error - MENU_GROUPS icons are valid React.ReactNode
            navigationGroups={MENU_GROUPS}
            user={user}
          />
        </Suspense>
      </div>

      {/* Auth Modal */}
      <Suspense fallback={null}>
        <AuthModal 
          isOpen={isAuthModalOpen} 
          showEmailConfirmedBanner={emailJustConfirmed}
          onClose={() => {
            setIsAuthModalOpen(false);
            // Si l'URL a '#auth', on l'enlève et on force le retour à la page d'accueil
            if (typeof window !== 'undefined' && window.location.hash.includes('#auth')) {
              try {
                navigate('/', { replace: true });
              } catch (e) {
                try { window.history.replaceState(null, '', '/'); } catch { /* ignore */ }
              }
            } else {
              // Même sans hash, on force le retour à la home après fermeture manuelle du modal
              try {
                navigate('/', { replace: true });
              } catch (e) {
                try { window.history.replaceState(null, '', '/'); } catch { /* ignore */ }
              }
            }
          }}
          defaultMode={authMode}
          onForgotPassword={() => {
            setIsAuthModalOpen(false);
            setIsForgotPasswordOpen(true);
          }}
        />
      </Suspense>

      {/* Forgot Password Modal */}
      <Suspense fallback={null}>
        <ForgotPasswordModal
          isOpen={isForgotPasswordOpen}
          onClose={() => setIsForgotPasswordOpen(false)}
          onBackToLogin={() => {
            setIsForgotPasswordOpen(false);
            setIsAuthModalOpen(true);
          }}
        />
      </Suspense>
    </header>
  );
};

export default Header;
