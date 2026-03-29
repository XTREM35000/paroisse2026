import React, { useRef, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Home,
  Video,
  Image,
  Calendar,
  Users,
  CreditCard,
  Settings,
  MessageSquare,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Bell,
  Search,
  X,
  FileText,
  CheckCircle2,
  Award,
  Building2,
  Gem,
  Baby,
  Heart,
  MessageCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import useRoleCheck from '@/hooks/useRoleCheck';
import { useParoisse } from '@/contexts/ParoisseContext';

export const MENU_GROUPS = [
  {
    title: 'Tableau de bord',
    items: [
      { label: 'Vue d\'ensemble', href: '/dashboard', icon: Home },
      { label: 'Prospect', href: '/prospect', icon: FileText },
    ],
  },
  {
    title: 'Médias',
    items: [
      { label: 'Vidéos', href: '/videos', icon: Video },
      { label: 'Photos', href: '/galerie', icon: Image },
      { label: 'Radio Paroisse FM', href: '/radio', icon: MessageSquare },
      { label: 'TV Paroisse Direct', href: '/live', icon: Home },
    ],
  },
  {
    title: '🙏 VIE SPIRITUELLE',
    items: [
      { label: 'Homélies', href: '/homilies', icon: Video },
      { label: 'Intentions de prière', href: '/prayers', icon: Home },
      { label: 'Verset du jour', href: '/verse', icon: Home },
      { label: 'Mariage', href: '/mariage', icon: Gem },
      { label: 'Baptême', href: '/bapteme', icon: Baby },
      { label: 'Confession', href: '/confession', icon: Heart },
      { label: 'FAQ', href: '/faq', icon: MessageCircle },
    ],
  },
  {
    title: 'Culte & Prière Admin',
    adminOnly: true,
    items: [
      { label: 'Demandes', href: '/admin/requests', icon: MessageSquare },
      { label: 'Officiants', href: '/admin/officiants', icon: Users },
      { label: 'Modération FAQ', href: '/admin/faq', icon: MessageCircle },
    ],
  },
  {
    title: 'Communauté',
    items: [
      { label: 'Chat', href: '/chat', icon: MessageSquare },
          { label: 'Annonces', href: '/announcements', icon: BarChart3 },
          { label: 'Affiches & Flyers', href: '/affiche', icon: Image },
      { label: 'Événements', href: '/evenements', icon: Calendar },
      { label: 'Annuaire', href: '/directory', icon: Users },
    ],
  },
  {
    title: 'Donations',
    items: [
      { label: 'Faire un don', href: '/donate', icon: CreditCard, badge: 'New' },
      { label: 'Campagnes', href: '/campaigns', icon: BarChart3 },
      { label: 'Historique', href: '/receipts', icon: CreditCard },
    ],
  },
  {
    title: 'Contenu & Diffusion',
    adminOnly: true,
    items: [
      { label: 'Streaming', href: '/admin/live', icon: Video },
      { label: 'Tutoriels', href: '/admin/tutoriels', icon: Video },
      { label: 'Contenu', href: '/admin/ads', icon: Image },
    ],
  },
  {
    title: 'Gestion Personnes',
    adminOnly: true,
    items: [
      { label: 'Utilisateurs', href: '/admin/users', icon: Users },
      { label: 'Annuaire', href: '/admin/directory', icon: Users },
      { label: 'Cartes', href: '/admin/member-cards', icon: CreditCard, badge: 'New' },
      { label: 'Diplômes', href: '/admin/certificates', icon: Award, badge: 'New' },
    ],
  },
  {
    title: 'Configuration',
    adminOnly: true,
    items: [
      { label: 'Accueil', href: '/admin/homepage', icon: Settings },
      { label: 'Paramètres', href: '/admin/settings', icon: Settings },
      { label: 'Paroisses', href: '/admin/paroisses', icon: Building2, superOnly: true },
      { label: 'Documents', href: '/documents', icon: FileText },
      { label: 'Événements', href: '/admin/events', icon: Calendar },
    ],
  },
  {
    title: 'Supervision',
    adminOnly: true,
    items: [
      { label: 'Stats Live', href: '/admin/stats-live', icon: BarChart3 },
      { label: 'Stats VOD', href: '/admin/stats-vod', icon: BarChart3 },
      { label: 'Stats Finances', href: '/admin/stats-finances', icon: CreditCard },
      { label: 'Approbations', href: '/admin/approvals', icon: CheckCircle2 },
      { label: 'Notifications', href: '/admin/notifications', icon: Bell },
      // Lien Master Reset affiché seulement pour les super_admin (filtré dans le rendu)
      { label: 'Master Reset', href: '/admin/master-reset', icon: Settings, superOnly: true, badge: 'New' },
    ],
  },
];

export interface SidebarProps {
  isCollapsed: boolean;
  onToggle: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const { profile, isAdmin, hasRole, isModerator, isSuperAdmin } = useRoleCheck();
  const { setSelectorOpen } = useParoisse();
  const navRef = useRef<HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [openSection, setOpenSection] = useState<string | null>('🙏 VIE SPIRITUELLE');

  const toggleSection = (title: string) => {
    setOpenSection((prev) => (prev === title ? null : title));
  };

  // Filter menu items across all groups based on search query
  const getFilteredGroups = () => {
    if (!searchQuery.trim()) {
      // No search: show all groups normally
      return MENU_GROUPS.map(group => ({
        ...group,
        items: group.items,
      }));
    }

    // With search: flatten, filter, then group results
    const query = searchQuery.toLowerCase();
    const allItems = MENU_GROUPS.flatMap(group =>
      group.items.map(item => ({ ...item, groupTitle: group.title }))
    );

    const filteredItems = allItems.filter(item =>
      item.label.toLowerCase().includes(query) ||
      item.href.toLowerCase().includes(query)
    );

    // Group filtered items by their original group
    const groupedResults: typeof MENU_GROUPS = [];
    filteredItems.forEach(item => {
      const existingGroup = groupedResults.find(g => g.title === item.groupTitle);
      if (existingGroup) {
        existingGroup.items.push(item);
      } else {
        const originalGroup = MENU_GROUPS.find(g => g.title === item.groupTitle);
        if (originalGroup) {
          groupedResults.push({
            title: item.groupTitle,
            adminOnly: originalGroup.adminOnly,
            items: [item],
          });
        }
      }
    });

    return groupedResults;
  };

  // Save scroll position to localStorage on every scroll
  const handleNavScroll = () => {
    if (navRef.current) {
      try {
        localStorage.setItem('sidebar_scroll_pos', String(navRef.current.scrollTop));
      } catch (e) {
        // ignore localStorage errors
      }
    }
  };

  // Restore scroll position from localStorage after navigation and DOM render
  useEffect(() => {
    const restoreScroll = () => {
      if (navRef.current) {
        try {
          const saved = localStorage.getItem('sidebar_scroll_pos');
          if (saved) {
            const pos = parseInt(saved, 10);
            // Use requestAnimationFrame twice: first to ensure DOM is ready, second to apply scroll
            requestAnimationFrame(() => {
              if (navRef.current) {
                navRef.current.scrollTop = pos;
              }
            });
          }
        } catch (e) {
          // ignore localStorage errors
        }
      }
    };

    // Restore on mount and when location changes
    restoreScroll();

    // Also restore after a small delay to ensure DOM is fully rendered
    const timer = setTimeout(restoreScroll, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <aside
      className={`fixed left-0 top-16 bottom-0 bg-card border-r border-border transition-all duration-300 overflow-y-auto z-40 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
      ref={navRef}
      onScroll={handleNavScroll}
    >
      <div className="p-4 flex items-center justify-between border-b">
        {!isCollapsed && <h3 className="text-lg font-semibold">Paroisse</h3>}
        <button
          className="text-muted hover:bg-accent/50 p-1 rounded"
          onClick={() => onToggle(!isCollapsed)}
          aria-label="Toggle sidebar"
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      {/* Search bar - only shown when not collapsed */}
      {!isCollapsed && (
        <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-border px-2 py-3 shadow-sm">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-2 text-sm bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Rechercher dans le menu"
            />
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      <nav className="px-2 py-4">
        {getFilteredGroups().map((group) => {
          if (group.adminOnly && !isAdmin) return null;
          const isOpen = searchQuery.trim() ? true : openSection === group.title;
          const SectionIcon = (group.items?.[0]?.icon || Home) as LucideIcon;
          return (
            <div key={group.title} className="mb-4">
              {!isCollapsed && (
                <button
                  type="button"
                  onClick={() => toggleSection(group.title)}
                  className={`w-full group relative flex items-center justify-between px-3 py-2 h-10 rounded-xl border backdrop-blur-sm transition-all duration-200 ease-out ${
                    isOpen
                      ? 'bg-primary/10 border-primary/30 shadow-sm'
                      : 'bg-card/70 border-border/60 hover:bg-accent/60 hover:border-border'
                  }`}
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <SectionIcon
                      className={`h-4 w-4 transition-colors ${
                        isOpen
                          ? 'text-primary'
                          : 'text-muted-foreground group-hover:text-foreground'
                      }`}
                    />
                    <span
                      title={group.title}
                      className={`font-bold text-sm uppercase tracking-wide truncate whitespace-nowrap overflow-hidden transition-colors ${
                        isOpen
                          ? 'text-foreground'
                          : 'text-muted-foreground group-hover:text-foreground'
                      }`}
                    >
                      {group.title}
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className={`${isOpen ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'} transition-colors`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.div>
                </button>
              )}
              {isCollapsed ? (
                <div className="flex flex-col gap-1">
                  {group.items.map((item: any) => {
                    if (item.superOnly && !isSuperAdmin) return null;
                    const Icon = item.icon as unknown as LucideIcon;
                    return (
                      <NavLink
                        key={item.href}
                        to={item.href}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded transition-colors justify-between ${
                            isActive ? 'bg-accent/60 text-accent-foreground' : 'hover:bg-accent/50'
                          }`
                        }
                        title={item.label}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4 flex-shrink-0" />
                        </div>
                      </NavLink>
                    );
                  })}
                </div>
              ) : (
                <AnimatePresence initial={false} mode="wait">
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{
                        height: 'auto',
                        opacity: 1,
                        transition: { duration: 0.3, ease: 'easeInOut' },
                      }}
                      exit={{
                        height: 0,
                        opacity: 0,
                        transition: { duration: 0.25, ease: 'easeInOut' },
                      }}
                      className="overflow-hidden mt-2 ml-4 space-y-1"
                    >
                      {group.items.map((item: any, idx: number) => {
                        if (item.superOnly && !isSuperAdmin) return null;
                        const Icon = item.icon as unknown as LucideIcon;
                        return (
                          <motion.div
                            key={item.href}
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: idx * 0.05, duration: 0.2 }}
                          >
                            <NavLink
                              to={item.href}
                              className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-300 border justify-between ${
                                  isActive
                                    ? 'bg-accent/50 text-accent-foreground border-border shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/40 border-transparent hover:border-border/70'
                                }`
                              }
                            >
                              <div className="flex items-center gap-3">
                                <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground/80" />
                                <span>{item.label}</span>
                              </div>
                              {(item as any)?.badge && (
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-gradient-to-b from-green-400 to-green-600 text-white shadow-md shadow-green-500/50">
                                  {(item as any).badge}
                                </span>
                              )}
                            </NavLink>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom action: switch paroisse */}
      <div className="sticky bottom-0 bg-card/95 backdrop-blur border-t border-border/50 px-2 py-3">
        <button
          type="button"
          onClick={() => setSelectorOpen(true)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-accent/50 text-muted-foreground"
          title="Changer de paroisse"
        >
          <Building2 className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && (
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="inline-flex shrink-0 items-center px-2 py-0.5 rounded-md text-[0.65rem] font-semibold bg-gradient-to-b from-green-400 to-green-600 text-white shadow-md shadow-green-500/50">
                New
              </span>
              <span className="truncate text-left text-sm">Changer de paroisse</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
