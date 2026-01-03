import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Video, Image, Calendar, Users, CreditCard, Settings, MessageSquare, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useUser } from '@/hooks/useUser';

export const MENU_GROUPS = [
  {
    title: 'Tableau de bord',
    items: [
      { label: 'Vue d\'ensemble', href: '/dashboard', icon: Home },
      { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    ],
  },
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
  const { profile, isAdmin } = useUser();

  return (
    <aside
      className={`fixed left-0 top-16 bottom-0 bg-card border-r border-border transition-all duration-300 overflow-y-auto z-40 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
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

      <nav className="px-2 py-4">
        {MENU_GROUPS.map((group) => {
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
