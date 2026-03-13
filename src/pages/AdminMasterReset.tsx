import { useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";
import HeroBanner from "@/components/HeroBanner";
import usePageHero from "@/hooks/usePageHero";
import useRoleCheck from "@/hooks/useRoleCheck";
import { BackupRestore } from "@/components/admin-master/BackupRestore";
import { ConfigGeneral } from "@/components/admin-master/ConfigGeneral";
import { ConfigBanners } from "@/components/admin-master/ConfigBanners";
import { ConfigText } from "@/components/admin-master/ConfigText";
import { ConfigCritical } from "@/components/admin-master/ConfigCritical";
import { ConfigAdmins } from "@/components/admin-master/ConfigAdmins";
import { AuditLogs } from "@/components/admin-master/AuditLogs";
import { ConfigFactoryReset } from "@/components/admin-master/ConfigFactoryReset";

const TABS = [
  { id: "backup", label: "Sauvegarde & restauration" },
  { id: "general", label: "Configuration générale" },
  { id: "banners", label: "Bannières" },
  { id: "text", label: "Contenu texte" },
  { id: "critical", label: "Actions critiques" },
  { id: "factory", label: "🏭 Mise à nu complète" },
  { id: "admins", label: "Rôles Admin" },
  { id: "logs", label: "Journal" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AdminMasterReset() {
  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);
  const { hasRole } = useRoleCheck();
  const [activeTab, setActiveTab] = useState<TabId>("backup");

  const isMaster = hasRole("super_admin");

  if (!isMaster) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <HeroBanner
          title="Outil Master Admin"
          subtitle="Accès restreint aux responsables techniques"
          showBackButton={true}
          backgroundImage={hero?.image_url}
          onBgSave={saveHero}
        />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md text-center space-y-4">
            <ShieldAlert className="h-10 w-10 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">
              Accès réservé à l’Admin Master
            </h2>
            <p className="text-sm text-muted-foreground">
              Vous devez disposer du rôle <strong>super_admin</strong> pour
              accéder à cet outil de réinitialisation avancée.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeroBanner
        title="Outil Master Admin"
        subtitle="Sauvegarde, restauration et réinitialisation complète du site"
        showBackButton={true}
        backgroundImage={hero?.image_url}
        onBgSave={saveHero}
      />

      <main className="flex-1 py-10">
        <div className="container mx-auto px-4 max-w-6xl space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2 border-b border-border overflow-x-auto pb-3"
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-t-md border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "text-primary border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </motion.div>

          <div className="space-y-6">
            {activeTab === "backup" && <BackupRestore isMaster={isMaster} />}
            {activeTab === "general" && <ConfigGeneral />}
            {activeTab === "banners" && <ConfigBanners />}
            {activeTab === "text" && <ConfigText />}
            {activeTab === "critical" && <ConfigCritical />}
            {activeTab === "factory" && <ConfigFactoryReset />}
            {activeTab === "admins" && <ConfigAdmins />}
            {activeTab === "logs" && <AuditLogs />}
          </div>
        </div>
      </main>
    </div>
  );
}

