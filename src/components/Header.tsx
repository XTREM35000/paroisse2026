import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, LogOut, HelpCircle, Menu, X, Home, Info, Users } from "lucide-react";
import AnimatedLogo from "./AnimatedLogo";
import AuthModal from "./AuthModal";
import MobileSidebar from "./MobileSidebar";
import { MENU_GROUPS } from "./Sidebar";
import ThemeToggle from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";

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
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useUser();

  // nav items for mobile sidebar
  const navigationItems = [
    { label: 'Accueil', href: '/', icon: <Home className="h-5 w-5" /> },
    { label: 'Vidéos', href: '/videos', icon: <User className="h-5 w-5" /> },
    { label: 'Galerie', href: '/galerie', icon: <User className="h-5 w-5" /> },
    { label: 'Événements', href: '/evenements', icon: <User className="h-5 w-5" /> },
    { label: 'À propos', href: '/a-propos', icon: <Info className="h-5 w-5" /> },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Title + Navigation Menu */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <AnimatedLogo size="sm" />
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="hidden sm:block"
              >
                <h1 className="text-sm lg:text-base font-semibold text-foreground leading-tight">
                  Paroisse Notre Dame
                </h1>
                <p className="text-xs text-muted-foreground -mt-0.5">
                  de la Compassion
                </p>
              </motion.div>
            </Link>

            {/* Navigation Menu - Desktop */}
            <nav className="hidden md:flex items-center gap-2">
              <Link 
                to="/"
                className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                title="Accueil"
              >
                <Home className="h-4 w-4" />
                <span>Accueil</span>
              </Link>
              <Link 
                to="/a-propos"
                className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                title="À propos"
              >
                <Info className="h-4 w-4" />
                <span>À propos</span>
              </Link>
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
                {user && profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || user.email}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5" />
                )}
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
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-xs mt-1"
                      onClick={() => {
                        navigate("/membres");
                        setIsUserMenuOpen(false);
                      }}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Membre
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full justify-start text-xs mt-1"
                      onClick={() => {
                        navigate("/profil");
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
                        navigate("/");
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Déconnexion
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Toggle - pour ouvrir la sidebar */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-muted-foreground"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              title="Menu mobile"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            </div>
          </div>

        {/* Mobile Sidebar */}
        <MobileSidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
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
