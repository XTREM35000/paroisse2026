import React, { useRef, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Video, Image, Calendar, Users, CreditCard, Settings, MessageSquare, BarChart3, ChevronLeft, ChevronRight, Bell, Search, X, BookOpen, FileText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import useRoleCheck from '@/hooks/useRoleCheck';

export const MENU_GROUPS = [
  {
    title: 'Tableau de bord',
    items: [
      { label: 'Vue d\'ensemble', href: '/dashboard', icon: Home },
      { label: 'Lexique', href: '/lexique', icon: BookOpen },
      { label: 'Prospect', href: '/prospect', icon: FileText },
    ],
  },
  // NOTE: this group should be admin-only (same visibility as Administration)
  {
    title: 'Médias',
    items: [
      { label: 'Vidéos', href: '/videos', icon: Video },
      { label: 'Photos', href: '/galerie', icon: Image },
      { label: 'Podcasts', href: '/podcasts', icon: MessageSquare },
      { label: 'Documents', href: '/documents', icon: Video },
    ],
  },
  {
    title: 'Culte & Prière',
    items: [
      { label: 'Messe en direct', href: '/live', icon: Home },
      { label: 'Homélies', href: '/homilies', icon: Video },
      { label: 'Intentions de prière', href: '/prayers', icon: Home },
      { label: 'Verset du jour', href: '/verse', icon: Home },
    ],
  },
  {
    title: 'Communauté',
    items: [
      { label: 'Chat', href: '/chat', icon: MessageSquare },
          { label: 'Annonces', href: '/announcements', icon: BarChart3 },
          { label: 'Publicité', href: '/publicite', icon: Image },
      { label: 'Événements', href: '/evenements', icon: Calendar },
      { label: 'Annuaire', href: '/directory', icon: Users },
    ],
  },
  {
    title: 'Donations',
    items: [
      { label: 'Faire un don', href: '/donate', icon: CreditCard },
      { label: 'Campagnes', href: '/campaigns', icon: BarChart3 },
      { label: 'Historique', href: '/donations', icon: CreditCard },
      { label: 'Reçus', href: '/receipts', icon: CreditCard },
    ],
  },
  {
    title: 'Administration',
    adminOnly: true,
    items: [
      { label: 'En Ligne', href: '/admin/live', icon: Video },
      { label: 'Notifications', href: '/admin/notifications', icon: Bell },
      { label: 'Publicité', href: '/admin/ads', icon: Image },
      { label: 'Tutoriels', href: '/admin/tutoriels', icon: Video },
      { label: 'Utilisateurs', href: '/admin/users', icon: Users },
      { label: 'Paramètres généraux', href: '/admin/settings', icon: Settings },
      { label: 'Annuaire', href: '/admin/directory', icon: Users },
      { label: 'Page d\'accueil', href: '/admin/homepage', icon: Settings },
      { label: 'Événements', href: '/admin/events', icon: Calendar },
    ],
  },
];

export interface SidebarProps {
  isCollapsed: boolean;
  onToggle: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const { profile, isAdmin, isModerator } = useRoleCheck();
  const navRef = useRef<HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
        <div className="px-2 py-3 border-b border-border">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-2 text-sm bg-muted border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
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
          return (
            <div key={group.title} className="mb-6">
              {!isCollapsed && (
                <div className="px-2 text-xs text-muted-foreground uppercase mb-2 font-semibold">
                  {group.title}
                </div>
              )}
              <div className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const Icon = item.icon as unknown as LucideIcon;
                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded transition-colors ${
                          isActive ? 'bg-accent/60 text-accent-foreground' : 'hover:bg-accent/50'
                        }`
                      }
                      title={isCollapsed ? item.label : ''}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && <span className="text-sm">{item.label}</span>}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
