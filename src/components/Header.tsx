import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, LogOut, HelpCircle, Menu, X, Home, Info, Users } from "lucide-react";
import AnimatedLogo from "./AnimatedLogo";
import AuthModal from "./AuthModal";
import MobileSidebar from "./MobileSidebar";
import { MENU_GROUPS } from "./Sidebar";
import ThemeToggle from "./ThemeToggle";
import HeaderSkeleton from "./HeaderSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";
import { useHeaderConfig } from "@/hooks/useHeaderConfig";
import useRoleCheck from '@/hooks/useRoleCheck';
import { supabase } from '@/integrations/supabase/client';

interface HeaderProps {
  darkMode?: boolean;
  toggleDarkMode?: () => void;
  onOpenAuthModal?: (mode: 'login' | 'register') => void;
}

const Header = ({ darkMode = false, toggleDarkMode = () => {}, onOpenAuthModal }: HeaderProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const location = useLocation();
  const authMode = new URLSearchParams(location.search).get("mode") === "register" ? "register" : "login";
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useUser();
  const { isAdmin } = useRoleCheck();
  const { data: headerConfig, isLoading: headerLoading } = useHeaderConfig();

  // Close mobile menu when auth state changes (e.g. on logout)
  useEffect(() => {
    if (!user) {
      setIsMobileMenuOpen(false);
    }
  }, [user]);

  // Ouvrir le modal d'authentification si l'URL contient #auth
  useEffect(() => {
    setIsAuthModalOpen(location.hash === '#auth');
  }, [location.hash]);

  // Afficher le skeleton pendant le chargement
  if (headerLoading || !headerConfig) {
    return <HeaderSkeleton />;
  }

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Title + Navigation Menu */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              {/* Logo dynamique */}
              {headerConfig.logo_url ? (
                <img
                  src={headerConfig.logo_url}
                  alt={headerConfig.logo_alt_text}
                  className={`h-${
                    headerConfig.logo_size === 'sm' ? '8' :
                    headerConfig.logo_size === 'md' ? '10' :
                    '12'
                  } w-auto object-contain`}
                />
              ) : (
                <AnimatedLogo size={headerConfig.logo_size} />
              )}
              
              {/* Titres dynamiques */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="hidden sm:block"
              >
                <h1 className="text-sm lg:text-base font-semibold text-foreground leading-tight">
                  {headerConfig.main_title}
                </h1>
                <p className="text-xs text-muted-foreground -mt-0.5">
                  {headerConfig.subtitle}
                </p>
              </motion.div>
            </Link>

            {/* Navigation Menu - Desktop */}
            <nav className="hidden md:flex items-center gap-2">
              {headerConfig.navigation_items.map((item, index) => (
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
            </nav>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right Actions - Universelles */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <AnimatePresence>
              {isSearchOpen && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 160, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="overflow-hidden mr-2"
                >
                  <Input
                    type="search"
                    placeholder="Rechercher..."
                    className="h-9 bg-muted/50 text-sm"
                    autoFocus
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="text-muted-foreground hover:text-foreground"
              title="Rechercher"
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Help */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/help")}
              className="text-muted-foreground hover:text-foreground"
              title="Aide"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>

            {/* Dark Mode Toggle */}
              <ThemeToggle />

            {/* User Menu / Auth Button */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (user) {
                    setIsUserMenuOpen(!isUserMenuOpen);
                  } else {
                    setIsAuthModalOpen(true);
                  }
                }}
                className="text-muted-foreground hover:text-foreground overflow-hidden rounded-full"
                title={user ? user.email : "Se connecter"}
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
                      } catch (e) {
                        avatarSrc = null;
                      }
                    }
                  }
                  return avatarSrc ? (
                    <img src={avatarSrc} alt={profile?.full_name || user.email} className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <User className="h-5 w-5" />
                  );
                })()}
              </Button>

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
                        Connecté
                      </p>
                    </div>

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

                    <Button
                      variant="ghost"
                      className="w-full justify-start text-xs mt-1"
                      onClick={() => {
                        navigate('/profil');
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Toggle - pour ouvrir la sidebar (masqué si non connecté) */}
            {user && (
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-muted-foreground"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                title="Menu mobile"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            )}

            </div>
          </div>

        {/* Mobile Sidebar */}
        <MobileSidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          // @ts-expect-error - MENU_GROUPS icons are valid React.ReactNode
          navigationGroups={MENU_GROUPS}
          user={user}
        />
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode="login"
      />
    </header>
  );
};

export default Header;
