import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Menu, X, User, Moon, Sun, LogOut } from "lucide-react";
import AnimatedLogo from "./AnimatedLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/hooks/useUser";

interface HeaderProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  onOpenAuthModal?: (mode: 'login' | 'register') => void;
}

const navItems = [
  { name: "Accueil", path: "/" },
  { name: "Vidéos", path: "/videos" },
  { name: "Galerie", path: "/galerie" },
  { name: "Événements", path: "/evenements" },
  { name: "À propos", path: "/a-propos" },
];

const Header = ({ darkMode, toggleDarkMode, onOpenAuthModal }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useUser();

  return (
    <header className="sticky top-0 z-50 glass-effect border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <AnimatedLogo size="md" />
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="hidden sm:block"
            >
              <h1 className="font-display text-lg lg:text-xl font-semibold text-foreground leading-tight">
                Paroisse Notre Dame
              </h1>
              <p className="text-xs text-muted-foreground -mt-0.5">
                de la Compassion
              </p>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item, i) => (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                <Link
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 relative group ${
                    location.pathname === item.path
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.name}
                  {location.pathname === item.path && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 bg-primary/10 rounded-lg -z-10"
                      transition={{ type: "spring", duration: 0.5 }}
                    />
                  )}
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <AnimatePresence>
              {isSearchOpen && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 200, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <Input
                    type="search"
                    placeholder="Rechercher..."
                    className="h-9 bg-muted/50"
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
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="text-muted-foreground hover:text-foreground"
            >
              <AnimatePresence mode="wait">
                {darkMode ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>

            {/* User Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="text-muted-foreground hover:text-foreground overflow-hidden rounded-full"
              >
                {user && profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || user.email}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </Button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg p-2 z-50"
                  >
                    {user ? (
                      <>
                        <div className="px-4 py-3 border-b border-border/50">
                          <p className="text-sm font-medium text-foreground">
                            {user.email}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Connecté
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-muted-foreground hover:text-foreground mt-1"
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
                          className="w-full justify-start text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          onClick={async () => {
                            await signOut();
                            setIsUserMenuOpen(false);
                            navigate("/");
                          }}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Déconnexion
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            onOpenAuthModal?.('login');
                            setIsUserMenuOpen(false);
                          }}
                        >
                          <User className="h-4 w-4 mr-2" />
                          Connexion
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            onOpenAuthModal?.('register');
                            setIsUserMenuOpen(false);
                          }}
                        >
                          <User className="h-4 w-4 mr-2" />
                          Inscription
                        </Button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-muted-foreground"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden border-t border-border/50 bg-background overflow-hidden"
          >
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {navItems.map((item, i) => (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <Link
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                      location.pathname === item.path
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {item.name}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;


