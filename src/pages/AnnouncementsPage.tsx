import { useState, useEffect, useMemo, useRef, useCallback } from "react";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from "framer-motion";
import { Search, Calendar, Trash2, Edit2, Printer, CalendarDays, Church } from "lucide-react";
import { Input } from "@/components/ui/input";
import DraggableModal from '@/components/DraggableModal';
import HeroBanner from "@/components/HeroBanner";
import { useLocation } from "react-router-dom";
import usePageHero from "@/hooks/usePageHero";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import SectionTitle from '@/components/SectionTitle';
import { useParoisse } from '@/contexts/ParoisseContext';

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  created_by: string;
  image_url?: string;
  author_name?: string;
  profiles?: { full_name: string };
}

interface HeaderConfig {
  id: string;
  logo_url: string | null;
  logo_alt_text: string | null;
  main_title: string | null;
  subtitle: string | null;
}

const AnnouncementsPage = () => {
  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);
  const { profile } = useUser();
  const { toast } = useToast();
  const { paroisse } = useParoisse();
  const paroisseId = paroisse?.id;

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: "", content: "" });
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });

  const isAdmin = !!(
    profile &&
    profile.role &&
    ["admin", "super_admin", "administrateur"].includes(
      String(profile.role).toLowerCase()
    )
  );
  
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ title: "", content: "" });
  }, []);

  // Fetch header configuration
  useEffect(() => {
    const fetchHeaderConfig = async () => {
      try {
        const { data, error } = await supabase
          .from("header_config" as any)
          .select("id, logo_url, logo_alt_text, main_title, subtitle")
          .eq("is_active", true)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Error fetching header config:", error);
        }
        
        if (data && typeof data === 'object' && !('error' in (data as any))) {
          setHeaderConfig(data as HeaderConfig);
        } else {
          // Configuration par défaut si aucune config active
          setHeaderConfig({
            id: 'default',
            logo_url: null,
            logo_alt_text: 'Logo Paroisse',
            main_title: 'Paroisse Notre Dame',
            subtitle: 'de la Compassion'
          });
        }
      } catch (error) {
        console.error("Erreur lors du chargement de la config header:", error);
      }
    };

    fetchHeaderConfig();
  }, []);

  // Fetch announcements avec jointure pour le nom de l'auteur
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);

        // Première tentative: essayer la jointure via le cache de schéma (si la FK existe)
        let attemptQuery = supabase
          .from("announcements" as any)
          .select(`id, title, content, created_at, created_by, image_url, profiles (full_name)`)
          .order("created_at", { ascending: false });
        if (paroisseId) attemptQuery = attemptQuery.eq('paroisse_id', paroisseId);

        const attempt = await attemptQuery;

        if (!attempt.error) {
          const data = attempt.data as any[] || [];
          const transformedData = data.map((item: any) => ({
            ...item,
            author_name: item.profiles?.full_name || 'Auteur inconnu'
          }));
          setAnnouncements(transformedData);
          return;
        }

        // Si erreur PGRST200 (relation absente), fallback: récupérer annonces puis profils par lot
        console.warn('Announce relation select failed, falling back to separate queries:', attempt.error, JSON.stringify(attempt.error));

        let fallbackQuery = supabase
          .from('announcements' as any)
          .select('id, title, content, created_at, created_by, image_url')
          .order('created_at', { ascending: false });
        if (paroisseId) fallbackQuery = fallbackQuery.eq('paroisse_id', paroisseId);

        const { data, error } = await fallbackQuery;

        if (error) {
          console.error('Announcements query failed on fallback:', error, JSON.stringify(error));
          throw error;
        }

        const announcementsData = Array.isArray(data) ? data as any[] : [];
        const creatorIds = Array.from(new Set(announcementsData.map(a => a.created_by).filter(Boolean)));

        let profilesMap: Record<string, string> = {};
        if (creatorIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', creatorIds);

          if (profilesError) {
            console.warn('Failed to load profiles for announcements fallback:', profilesError, JSON.stringify(profilesError));
          } else if (profilesData) {
            profilesMap = (profilesData as any[]).reduce((acc, p) => ({ ...acc, [p.id]: p.full_name }), {} as Record<string, string>);
          }
        }

        const transformedData = announcementsData.map((item: any) => ({
          ...item,
          author_name: profilesMap[item.created_by] || 'Auteur inconnu'
        }));

        setAnnouncements(transformedData);
      } catch (error) {
        console.error("Erreur lors du chargement des annonces:", error, JSON.stringify(error));
        const msg = (error as any)?.message || JSON.stringify(error) || String(error);
        toast({
          title: "Erreur",
          description: `Impossible de charger les annonces. ${msg}`,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [toast, paroisseId]);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(
      (ann) =>
        ann.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ann.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [announcements, searchTerm]);

  // Fonction d'impression
  const handlePrintAnnouncements = async () => {
    // 1. Filtrer les annonces par période
    const announcementsToPrint = dateRange.from && dateRange.to
      ? filteredAnnouncements.filter((ann: Announcement) => {
          const announcementDate = new Date(ann.created_at);
          return announcementDate >= dateRange.from! && announcementDate <= dateRange.to!;
        })
      : filteredAnnouncements; // Si pas de filtre, tout imprimer

    if (announcementsToPrint.length === 0) {
      toast({ 
        title: "Aucune donnée", 
        description: "Aucune annonce à imprimer pour cette période.", 
        variant: "destructive" 
      });
      return;
    }

    // 2. Récupérer la dernière config d'en-tête si pas déjà chargée
    let currentHeaderConfig = headerConfig;
    if (!currentHeaderConfig) {
      const { data } = await supabase
        .from("header_config" as any)
        .select("id, logo_url, logo_alt_text, main_title, subtitle")
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      currentHeaderConfig = data && typeof data === 'object' && !('error' in (data as any)) ? (data as HeaderConfig) : {
        id: 'default',
        logo_url: null,
        logo_alt_text: 'Logo Paroisse',
        main_title: 'Paroisse Notre Dame',
        subtitle: 'de la Compassion'
      };
    }

    // 3. Créer un contenu HTML pour l'impression
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ 
        title: "Erreur", 
        description: "Veuillez autoriser les fenêtres popup pour l'impression.", 
        variant: "destructive" 
      });
      return;
    }

    // Récupérer la date du jour formatée
    const today = format(new Date(), "d MMMM yyyy", { locale: fr });
    
    // Format des dates de la période
    const fromDate = dateRange.from 
      ? format(dateRange.from, "dd/MM/yyyy", { locale: fr })
      : format(new Date(announcementsToPrint[announcementsToPrint.length - 1].created_at), "dd/MM/yyyy", { locale: fr });
      
    const toDate = dateRange.to 
      ? format(dateRange.to, "dd/MM/yyyy", { locale: fr })
      : format(new Date(announcementsToPrint[0].created_at), "dd/MM/yyyy", { locale: fr });

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Annonces Paroissiales - ${today}</title>
        <style>
          @page {
            margin: 15mm 20mm;
            size: A4;
          }
          body { 
            font-family: 'Arial', 'Helvetica', sans-serif; 
            margin: 0; 
            padding: 0; 
            color: #333; 
            font-size: 12pt;
            line-height: 1.5;
          }
          
          /* En-tête avec logo et titres alignés à gauche */
          .print-header {
            display: flex;
            align-items: flex-start;
            justify-content: flex-start;
            margin-bottom: 25px;
            border-bottom: 2px solid #2c5282;
            padding-bottom: 15px;
            page-break-after: avoid;
          }
          
          .logo-container {
            flex-shrink: 0;
            margin-right: 20px;
          }
          
          .print-logo {
            max-height: 80px;
            max-width: 120px;
            object-fit: contain;
          }
          
          .title-container {
            flex-grow: 1;
            text-align: left;
          }
          
          .print-main-title {
            margin: 0 0 5px 0;
            font-size: 24pt;
            color: #2c5282;
            font-weight: bold;
            line-height: 1.1;
          }
          
          .print-subtitle {
            margin: 0 0 10px 0;
            font-size: 16pt;
            color: #4a5568;
            font-weight: normal;
            font-style: italic;
          }
          
          .print-document-info {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
          }
          
          .print-document-title {
            font-size: 18pt;
            color: #2d3748;
            margin: 0 0 8px 0;
            font-weight: 600;
          }
          
          .print-date-period {
            font-size: 11pt;
            color: #718096;
            margin: 5px 0;
          }
          
          /* Contenu des annonces */
          .announcement { 
            margin-bottom: 25px; 
            page-break-inside: avoid; 
            padding-bottom: 15px;
            border-bottom: 1px solid #e2e8f0;
          }
          
          .announcement:last-child {
            border-bottom: none;
          }
          
          .announcement-title { 
            color: #2c5282; 
            margin-bottom: 8px; 
            font-size: 14pt;
            font-weight: bold;
            line-height: 1.3;
          }
          
          .announcement-meta { 
            font-size: 10pt; 
            color: #718096; 
            margin-bottom: 12px;
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
          }
          
          .announcement-meta-item {
            display: flex;
            align-items: center;
            gap: 5px;
          }
          
          .announcement-content { 
            font-size: 11pt; 
            line-height: 1.6;
            white-space: pre-line;
            text-align: justify;
          }
          
          /* Pied de page */
          .print-footer {
            margin-top: 40px;
            padding-top: 15px;
            border-top: 1px solid #cbd5e0;
            font-size: 10pt;
            color: #718096;
            text-align: center;
            page-break-before: avoid;
          }
          
          /* Masquer les éléments de contrôle */
          .no-print { 
            display: none !important; 
          }
          
          /* Utilitaires */
          .text-muted {
            color: #718096;
          }
          
          .font-bold {
            font-weight: bold;
          }
          
          /* Gestion des sauts de page */
          @media print {
            .page-break {
              page-break-before: always;
            }
            
            .avoid-break {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <!-- En-tête avec logo et titres -->
        <div class="print-header avoid-break">
          ${currentHeaderConfig.logo_url ? `
            <div class="logo-container">
              <img src="${currentHeaderConfig.logo_url}" 
                   alt="${currentHeaderConfig.logo_alt_text || 'Logo'}" 
                   class="print-logo" />
            </div>
          ` : ''}
          
          <div class="title-container">
            <h1 class="print-main-title">
              ${currentHeaderConfig.main_title || 'Paroisse Notre Dame'}
            </h1>
            ${currentHeaderConfig.subtitle ? `
              <h2 class="print-subtitle">
                ${currentHeaderConfig.subtitle}
              </h2>
            ` : ''}
            
            <div class="print-document-info">
              <h3 class="print-document-title">
                Annonces Paroissiales
              </h3>
              <div class="print-date-period">
                <span class="font-bold">Période :</span> ${fromDate} – ${toDate}<br/>
                <span class="font-bold">Imprimé le :</span> ${today}<br/>
                <span class="font-bold">Nombre d'annonces :</span> ${announcementsToPrint.length}
              </div>
            </div>
          </div>
        </div>

        <!-- Liste des annonces -->
        ${announcementsToPrint.map((ann, index) => `
          <div class="announcement avoid-break">
            <h4 class="announcement-title">${ann.title}</h4>
            
            <div class="announcement-meta">
              <span class="announcement-meta-item">
                <span class="font-bold">Date :</span>
                ${format(new Date(ann.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
              </span>
              
              ${ann.author_name ? `
                <span class="announcement-meta-item">
                  <span class="font-bold">Auteur :</span>
                  ${ann.author_name}
                </span>
              ` : ''}
            </div>
            
            <div class="announcement-content">
              ${ann.content}
            </div>
          </div>
          
          ${index < announcementsToPrint.length - 1 && index % 5 === 4 ? '<div class="page-break"></div>' : ''}
        `).join('')}

        <!-- Pied de page -->
        <div class="print-footer avoid-break">
          Document officiel • ${currentHeaderConfig.main_title || 'Paroisse'} • 
          Généré le ${today} depuis l'application Paroisse
        </div>

        <!-- Contrôles d'impression (masqués à l'impression) -->
        <div class="no-print" style="position: fixed; top: 20px; right: 20px; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 1000;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
            <strong>Contrôles d'impression</strong><br/>
            Ce document a été généré automatiquement.
          </p>
          <div style="display: flex; gap: 10px;">
            <button onclick="window.print();" style="padding: 8px 16px; background: #2c5282; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
              🖨️ Imprimer
            </button>
            <button onclick="window.close();" style="padding: 8px 16px; background: #e2e8f0; color: #4a5568; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
              Fermer
            </button>
          </div>
        </div>
        
        <script>
          // Délai pour s'assurer que le contenu est chargé
          setTimeout(() => {
            window.focus();
            // Lancement automatique de l'impression
            window.print();
            
            // Fermer la fenêtre après impression (optionnel)
            window.onafterprint = function() {
              setTimeout(() => {
                window.close();
              }, 100);
            };
          }, 300);
        </script>
      </body>
      </html>
    `;

    // 4. Écrire et lancer l'impression
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  // (Les autres fonctions handleSave, handleDelete, handleEdit, handleCancel restent identiques)
  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from("announcements" as any)
          .update({
            title: formData.title,
            content: formData.content,
          })
          .eq("id", editingId);

        if (error) throw error;
        toast({
          title: "Succès",
          description: "Annonce mise à jour.",
        });
        setEditingId(null);
      } else {
        const { error } = await supabase.from("announcements" as any).insert([
          {
            title: formData.title,
            content: formData.content,
            created_by: profile?.id,
            ...(paroisseId ? { paroisse_id: paroisseId } : {}),
          },
        ]);

        if (error) throw error;
        toast({
          title: "Succès",
          description: "Annonce créée.",
        });
      }

      setFormData({ title: "", content: "" });
      setIsModalOpen(false);

      // Refresh list
      let refreshQuery = supabase
        .from("announcements" as any)
        .select(`id, title, content, created_at, created_by, image_url, profiles (full_name)`)
        .order("created_at", { ascending: false });

      if (paroisseId) refreshQuery = refreshQuery.eq('paroisse_id', paroisseId);

      const { data } = await refreshQuery;
        
      const transformedData = (Array.isArray(data) ? data as any[] : []).map((item: {
        id: string;
        title: string;
        content: string;
        created_at: string;
        created_by: string;
        image_url?: string;
        profiles?: { full_name: string } | null;
      }) => ({
        ...item,
        author_name: item.profiles?.full_name || "Auteur inconnu"
      }));
      
      setAnnouncements(transformedData);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      const msg = (error as any)?.message || JSON.stringify(error) || String(error);
      toast({
        title: "Erreur",
        description: `Impossible de sauvegarder l'annonce. ${msg}`,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) return;

    try {
      const { error } = await supabase
        .from("announcements" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({
        title: "Succès",
        description: "Annonce supprimée.",
      });

      setAnnouncements(announcements.filter((a) => a.id !== id));
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      const msg = (error as any)?.message || JSON.stringify(error) || String(error);
      toast({
        title: "Erreur",
        description: `Impossible de supprimer l'annonce. ${msg}`,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setFormData({ title: announcement.title, content: announcement.content });
    setEditingId(announcement.id);
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ title: "", content: "" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeroBanner
        title="Annonces Paroissiales"
        subtitle="Retrouvez toutes les annonces et actualités de notre paroisse"
        showBackButton={true}
        backgroundImage={hero?.image_url}
        onBgSave={saveHero}
      />

      <div className="container mx-auto px-4 py-12">
        {/* Admin Panel */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 rounded-lg bg-card border border-border"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Administration des Annonces</h3>
                <p className="text-sm text-muted-foreground">Créer, modifier ou supprimer des annonces paroissiales</p>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={() => { setFormData({ title: '', content: '' }); setEditingId(null); setIsModalOpen(true); }} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">+ Nouvelle Annonce</Button>
                <Button variant="outline" onClick={() => { setFormData({ title: '', content: '' }); setEditingId(null); setIsModalOpen(true); }}>Importer</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 flex items-end gap-3">
                <label className="sr-only">Recherche rapide</label>
                <Button variant="outline" onClick={() => searchInputRef.current?.focus()}>Rechercher</Button>
                <span className="text-sm text-muted-foreground">{searchTerm ? `Filtre actif : "${searchTerm}"` : 'Aucun filtre actif'}</span>
              </div>

              <div className="flex items-end space-x-3">
                <Button onClick={handlePrintAnnouncements} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-10 w-full md:w-auto"><Printer className="h-4 w-4 mr-2" />Imprimer la Sélection</Button>
              </div>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">Utilisez la recherche et les filtres pour trouver rapidement une annonce, ou cliquez sur <strong>+ Nouvelle Annonce</strong> pour en créer une nouvelle.</p>

            {/* Modal for create/edit */}
            {/** Stable close handler to avoid remount/focus effects during typing */}
            <DraggableModal
              open={isModalOpen}
              onClose={closeModal}
              dragHandleOnly={false}
              verticalOnly={false}
              draggableOnMobile={true}
              center={true}
              maxWidthClass="max-w-2xl"
              title={editingId ? 'Modifier l\'Annonce' : 'Créer une Annonce'}
              headerClassName="bg-amber-800"
            >
              <div className="py-4 px-4 space-y-4 max-h-[calc(100vh-160px)] overflow-y-auto" aria-describedby="announcement-form-desc">
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Titre</label>
                    <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Titre de l'annonce" />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Contenu</label>
                    <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={6} className="w-full px-4 py-2 rounded-lg bg-white/90 border border-border text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Contenu détaillé de l'annonce" />
                  </div>

                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={closeModal}>Annuler</Button>
                    <Button type="submit">{editingId ? 'Mettre à jour' : 'Créer'}</Button>
                  </div>
                </form>
              </div>
            </DraggableModal>
          </motion.div>
        )}

        {/* Filtres et Impression */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 space-y-4"
        >
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Rechercher une annonce..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 bg-white/90 border-2 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
            />
          </div>

          {/* Filtres de date et impression */}
          <div className="flex flex-col md:flex-row gap-4 p-4 bg-card rounded-lg border">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="flex-1">
                <label className="flex text-sm font-medium mb-1 items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Du
                </label>
                <Input 
                  type="date"
                  onChange={(e) => setDateRange({...dateRange, from: e.target.value ? new Date(e.target.value) : null})}
                  className="w-full bg-white/90 border-2 border-gray-300 text-gray-900 focus:border-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="flex text-sm font-medium mb-1 items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Au
                </label>
                <Input 
                  type="date"
                  onChange={(e) => setDateRange({...dateRange, to: e.target.value ? new Date(e.target.value) : null})}
                  className="w-full bg-white/90 border-2 border-gray-300 text-gray-900 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handlePrintAnnouncements}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-10 w-full md:w-auto"
                disabled={!headerConfig}
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimer la Sélection
                {dateRange.from && dateRange.to && (
                  <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded">
                    {format(dateRange.from, "dd/MM")} - {format(dateRange.to, "dd/MM")}
                  </span>
                )}
              </Button>
            </div>
          </div>
          
          {/* Indication de la paroisse */}
          {headerConfig && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
              {headerConfig.logo_url ? (
                <img 
                  src={headerConfig.logo_url} 
                  alt={headerConfig.logo_alt_text || 'Logo'} 
                  className="h-8 w-8 object-contain"
                />
              ) : (
                <Church className="h-5 w-5 text-blue-500" />
              )}
              <div>
                <span className="font-medium text-blue-700">{headerConfig.main_title}</span>
                {headerConfig.subtitle && (
                  <span className="ml-2 text-blue-600">- {headerConfig.subtitle}</span>
                )}
                <span className="ml-2 text-gray-500">• Ces informations apparaîtront sur l'impression</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Announcements List */}
        <SectionTitle title="Annonces récentes" subtitle="Trouvez et consultez les annonces publiées" />
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Chargement des annonces...</p>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground text-lg">
              {searchTerm
                ? "Aucune annonce ne correspond à votre recherche."
                : "Aucune annonce pour le moment."}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {filteredAnnouncements.map((announcement, index) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative overflow-hidden rounded-lg border border-border bg-card shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {/* Background gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative p-6">
                  {/* Image (optional) */}
                  {announcement.image_url && (
                    <div className="mb-4">
                      <img src={announcement.image_url} alt={announcement.title} className="w-full h-40 object-cover rounded-md" />
                    </div>
                  )}

                  {/* Header */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2">
                      {announcement.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(
                            new Date(announcement.created_at),
                            "d MMMM yyyy",
                            { locale: fr }
                          )}
                        </span>
                      </div>
                      {announcement.author_name && (
                        <span className="text-blue-600 font-medium">
                          {announcement.author_name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {announcement.content}
                  </p>

                  {/* Admin Actions */}
                  {isAdmin && (
                    <div className="flex gap-2 pt-4 border-t border-border/50">
                      <Button
                        onClick={() => handleEdit(announcement)}
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-blue-600 hover:bg-blue-500/10"
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Éditer
                      </Button>
                      <Button
                        onClick={() => handleDelete(announcement.id)}
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-red-600 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsPage;