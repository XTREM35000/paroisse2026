import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useEnsureOAuthProfile } from '@/hooks/useEnsureOAuthProfile';
import { SetupProvider, useSetup } from '@/contexts/SetupContext';
import { EventModalProvider } from '@/contexts/EventModalContext';
import useFirstLaunch from '@/hooks/useFirstLaunch';
import SetupWizardModal from './SetupWizardModal';

const Layout: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    return stored ? JSON.parse(stored) : false;
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const { user, profile } = useAuth();
  const showDesktopSidebar = !!user && profile?.role !== 'guest';
  // Appliquer le hook pour assurer que le profil existe après OAuth
  useEnsureOAuthProfile();
  
  const { isFirstLaunch, loading: firstLaunchLoading } = useFirstLaunch();

  // consume setup context to check completed flag
  // We'll render the provider lower in the tree, so create a small inner component to use it.
  const SetupGate: React.FC = () => {
    const { setupCompleted } = useSetup();
    const [modalOpen, setModalOpen] = React.useState(false);

    React.useEffect(() => {
      if (!firstLaunchLoading && isFirstLaunch && user && !setupCompleted) {
        // show modal only for admin users — best-effort: check email presence
        setModalOpen(true);
      }
    }, [firstLaunchLoading, isFirstLaunch, user, setupCompleted]);

    return (
      <>
        <SetupWizardModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  };

  return (
    <SetupProvider>
      <EventModalProvider>
        <div className="min-h-screen flex flex-col">
          <Header darkMode={false} toggleDarkMode={() => {}} />
          <SetupGate />
          <div className="flex flex-1">
            {/* Sidebar fixed à gauche - visible sur desktop uniquement (affiché seulement si connecté) */}
            {showDesktopSidebar && (
              <div className="hidden lg:block">
                <Sidebar isCollapsed={sidebarCollapsed} onToggle={setSidebarCollapsed} />
              </div>
            )}

            {/* Main content with margin pour la sidebar */}
            <main className={`flex-1 overflow-auto transition-all duration-300 ${
              showDesktopSidebar ? (sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64') : ''
            }`}>
              <div className="p-6">
                {children}
              </div>
            </main>
          </div>
          <Footer />
        </div>
      </EventModalProvider>
    </SetupProvider>
  );
};

export default Layout;
