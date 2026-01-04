import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import useRoleCheck from '@/hooks/useRoleCheck';

interface NavItem {
  label: string;
  href: string;
  // accept either a React element/node or a component type (Lucide icons etc.)
  icon?: React.ReactNode | React.ElementType;
}

interface NavGroup {
  title: string;
  items: NavItem[];
  adminOnly?: boolean;
}

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  // navigation prop mirrors desktop Sidebar API
  // accept either flat nav items or grouped navigation like Sidebar's MENU_GROUPS
  navigation?: NavItem[];
  navigationGroups?: NavGroup[];
  // backwards-compatible
  navItems?: NavItem[];
  // optional user can be passed from parent; if not provided we fallback to useAuth
  user?: {
    id?: string;
    email?: string;
    full_name?: string;
    display_name?: string;
    avatar_url?: string;
    role?: string;
  };
  // optional signOut callback
  onSignOut?: () => Promise<void> | void;
}

export default function MobileSidebar({ isOpen, onClose, navItems, navigation, navigationGroups, user: userProp, onSignOut }: MobileSidebarProps) {
  const auth = useAuth();
  const { user: authUser, signOut: authSignOut } = auth || {};
  const user = userProp ?? authUser;
  const { isAdmin, isModerator } = useRoleCheck();
  const signOut = onSignOut ?? authSignOut;

  const renderIcon = (icon?: React.ReactNode | React.ElementType) => {
    if (!icon) return null;
    // already an element
    if (React.isValidElement(icon)) return icon;
    // if it's a component (function/class), create an element with sizing class
    if (typeof icon === 'function' || typeof icon === 'object') {
      try {
        return React.createElement(icon as React.ElementType, { className: 'h-4 w-4 flex-shrink-0' });
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      document.body.classList.add('sidebar-open');
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      document.body.classList.remove('sidebar-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      document.body.classList.remove('sidebar-open');
    };
  }, [isOpen]);

  // Ensure cleanup on unmount: remove any leftover body locks
  React.useEffect(() => {
    return () => {
      try {
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
        document.body.classList.remove('sidebar-open');
      } catch (e) {
        // noop
      }
    };
  }, []);

  const [portalRoot, setPortalRoot] = React.useState<HTMLElement | null>(() => {
    if (typeof document === 'undefined') return null;
    let el = document.getElementById('mobile-sidebar-root');
    if (!el) {
      el = document.createElement('div');
      el.id = 'mobile-sidebar-root';
      el.classList.add('mobile-sidebar-portal');
      // mark element so we can remove it on cleanup
      (el as HTMLElement).dataset.mobileSidebarCreated = '1';
      document.body.appendChild(el);
    }
    return el as HTMLElement;
  });

  React.useEffect(() => {
    return () => {
      // cleanup created portal root if we created it
      if (portalRoot && portalRoot.dataset.mobileSidebarCreated === '1' && portalRoot.parentNode === document.body) {
        document.body.removeChild(portalRoot);
      }
    };
  }, [portalRoot]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="fixed inset-0 z-[99999]"
          aria-hidden={!isOpen}
        >
          {/* Backdrop - sits below the sidebar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[99998] bg-black/40 sidebar-backdrop"
          />

          {/* Sidebar panel - fixed and above backdrop */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="fixed inset-y-0 left-0 w-72 max-w-[80vw] z-[99999] bg-card border-r shadow-xl flex flex-col sidebar-panel"
          >
            <div className="p-4 flex items-center justify-between border-b">
              <div className="font-semibold">Navigation</div>
              <button onClick={onClose} className="p-1 rounded hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="p-4 flex flex-col gap-2 overflow-y-auto h-[calc(100%-64px)]">
              {/* If grouped navigation provided, render groups */}
              {((navigationGroups && navigationGroups.length > 0) ? navigationGroups : undefined) ? (
                (navigationGroups as NavGroup[]).map((group) => {
                  if (group.adminOnly && !isAdmin) return null;
                  return (
                    <div key={group.title} className="mb-4">
                      <div className="px-2 text-xs text-muted-foreground uppercase mb-2 font-semibold">
                        {group.title}
                      </div>
                      <div className="flex flex-col gap-1">
                        {group.items.map((item) => (
                          <NavLink
                            key={item.href}
                            to={item.href}
                            onClick={onClose}
                            className={({ isActive }) =>
                              'flex items-center gap-3 px-3 py-2 rounded transition-colors ' + (isActive ? 'bg-accent/60 text-accent-foreground' : 'hover:bg-accent/50')
                            }
                          >
                            {renderIcon(item.icon)}
                            <span>{item.label}</span>
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                // fallback to flat navigation
                (navigation ?? navItems ?? []).map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={onClose}
                    className={({ isActive }) =>
                      'flex items-center gap-3 px-3 py-2 rounded hover:bg-accent/50 ' + (isActive ? 'bg-accent/60 text-accent-foreground' : 'text-foreground')
                    }
                  >
                    {renderIcon(item.icon)}
                    <span>{item.label}</span>
                  </NavLink>
                ))
              )}

              <div className="mt-4 border-t pt-4">
                {user ? (
                  <>
                    <NavLink to="/profile" onClick={onClose} className="block px-3 py-2 rounded hover:bg-accent/50">
                      Profil
                    </NavLink>
                    <button
                      onClick={async () => {
                        try {
                          await signOut();
                        } catch (e) {
                          // ignore signOut errors but ensure UI closes
                        } finally {
                          onClose();
                        }
                      }}
                      className="w-full text-left px-3 py-2 rounded hover:bg-destructive/10 text-destructive"
                    >
                      Déconnexion
                    </button>
                  </>
                ) : (
                  <>
                    <NavLink to="/auth" onClick={onClose} className="block px-3 py-2 rounded hover:bg-accent/50">
                      Connexion
                    </NavLink>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        </motion.aside>
      )}
    </AnimatePresence>,
    portalRoot
  );
}
