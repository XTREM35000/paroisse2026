/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Edit2, Trash2, Upload, Heart, Calendar, User, Printer, CalendarDays, Church } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import HeroBanner from "@/components/HeroBanner";
import usePageHero from "@/hooks/usePageHero";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Prayer {
  id: string;
  title: string;
  content: string;
  submitted_by_name?: string;
  submitted_by_email?: string;
  is_anonymous: boolean;
  status: "pending" | "approved" | "archived";
  category?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

interface HeaderConfig {
  id: string;
  logo_url: string | null;
  logo_alt_text: string | null;
  main_title: string | null;
  subtitle: string | null;
}

const PrayersPage = () => {
  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);
  const { profile } = useUser();
  const { toast } = useToast();

  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    submitted_by_name: "",
    submitted_by_email: "",
    is_anonymous: false,
    category: "autre",
  });

  const isAdmin = !!(
    profile?.role &&
    ["admin", "super_admin", "administrateur"].includes(String(profile.role).toLowerCase())
  );

  // Fetch prayers with useCallback to avoid dependency issues
  const fetchPrayers = useCallback(async () => {
    try {
      setLoading(true);
      const query = (supabase as any).from("prayer_intentions").select("*");

      // Non-admins only see approved prayers
      if (!isAdmin) {
        query.eq("status", "approved");
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      setPrayers(data || []);
    } catch (err) {
      console.error("Erreur lors du chargement des intentions:", err);
      toast({
        title: "Erreur",
        description: "Impossible de charger les intentions de prière.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [isAdmin, toast]);

  // Fetch header configuration
  useEffect(() => {
    const fetchHeaderConfig = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("header_config")
          .select("id, logo_url, logo_alt_text, main_title, subtitle")
          .eq("is_active", true)
          .order("updated_at", { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching header config:", error);
        }
        
        if (data) {
          setHeaderConfig(data);
        } else {
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

  // Fetch prayers
  useEffect(() => {
    fetchPrayers();
  }, [fetchPrayers]);

  // Fonction d'impression pour les intentions de prière
  const handlePrintPrayers = async () => {
    // 1. Filtrer les intentions par période
    const prayersToPrint = dateRange.from && dateRange.to
      ? filteredPrayers.filter((prayer) => {
          const prayerDate = new Date(prayer.created_at);
          return prayerDate >= dateRange.from! && prayerDate <= dateRange.to!;
        })
      : filteredPrayers; // Si pas de filtre, tout imprimer

    if (prayersToPrint.length === 0) {
      toast({ 
        title: "Aucune donnée", 
        description: "Aucune intention à imprimer pour cette période.", 
        variant: "destructive" 
      });
      return;
    }

    // 2. Récupérer la dernière config d'en-tête si pas déjà chargée
    let currentHeaderConfig = headerConfig;
    if (!currentHeaderConfig) {
      const { data } = await (supabase as any)
        .from("header_config")
        .select("id, logo_url, logo_alt_text, main_title, subtitle")
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();
      
      currentHeaderConfig = data || {
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
      : format(new Date(prayersToPrint[prayersToPrint.length - 1].created_at), "dd/MM/yyyy", { locale: fr });
      
    const toDate = dateRange.to 
      ? format(dateRange.to, "dd/MM/yyyy", { locale: fr })
      : format(new Date(prayersToPrint[0].created_at), "dd/MM/yyyy", { locale: fr });

    // Préparer les catégories pour les statistiques
    const categoryStats: Record<string, number> = {};
    prayersToPrint.forEach(prayer => {
      const category = prayer.category || 'autre';
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    });

    // Obtenir les labels des catégories
    const categories = {
      autre: "Autre",
      guerison: "Guérison",
      famille: "Famille",
      travail: "Travail",
      etudes: "Études",
      gratitude: "Gratitude",
      monde: "Pour le monde"
    };

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Intentions de Prière - ${today}</title>
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
          
          /* En-tête avec logo et titres */
          .print-header {
            display: flex;
            align-items: flex-start;
            justify-content: flex-start;
            margin-bottom: 25px;
            border-bottom: 2px solid #9333ea;
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
            color: #7c3aed;
            font-weight: bold;
            line-height: 1.1;
          }
          
          .print-subtitle {
            margin: 0 0 10px 0;
            font-size: 16pt;
            color: #8b5cf6;
            font-weight: normal;
            font-style: italic;
          }
          
          .print-document-info {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #e9d5ff;
          }
          
          .print-document-title {
            font-size: 18pt;
            color: #7c3aed;
            margin: 0 0 8px 0;
            font-weight: 600;
          }
          
          .print-date-period {
            font-size: 11pt;
            color: #8b5cf6;
            margin: 5px 0;
          }
          
          /* Statistiques */
          .print-stats {
            background: #faf5ff;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 25px;
            border-left: 4px solid #8b5cf6;
            page-break-inside: avoid;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 10px;
            margin-top: 10px;
          }
          
          .stat-item {
            text-align: center;
            padding: 8px;
            background: white;
            border-radius: 6px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          .stat-label {
            font-size: 10pt;
            color: #7c3aed;
            font-weight: 500;
          }
          
          .stat-value {
            font-size: 16pt;
            color: #7c3aed;
            font-weight: bold;
            margin-top: 5px;
          }
          
          /* Contenu des intentions */
          .prayer-item { 
            margin-bottom: 25px; 
            page-break-inside: avoid; 
            padding-bottom: 15px;
            border-bottom: 1px solid #e9d5ff;
          }
          
          .prayer-item:last-child {
            border-bottom: none;
          }
          
          .prayer-title { 
            color: #7c3aed; 
            margin-bottom: 8px; 
            font-size: 14pt;
            font-weight: bold;
            line-height: 1.3;
          }
          
          .prayer-category {
            display: inline-block;
            background: #f3e8ff;
            color: #7c3aed;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 10pt;
            font-weight: 500;
            margin-bottom: 10px;
          }
          
          .prayer-meta { 
            font-size: 10pt; 
            color: #8b5cf6; 
            margin-bottom: 12px;
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            font-style: italic;
          }
          
          .prayer-meta-item {
            display: flex;
            align-items: center;
            gap: 5px;
          }
          
          .prayer-content { 
            font-size: 11pt; 
            line-height: 1.6;
            white-space: pre-line;
            text-align: justify;
            color: #4a5568;
          }
          
          /* Pied de page */
          .print-footer {
            margin-top: 40px;
            padding-top: 15px;
            border-top: 1px solid #e9d5ff;
            font-size: 10pt;
            color: #8b5cf6;
            text-align: center;
            page-break-before: avoid;
          }
          
          .prayer-icon {
            display: inline-block;
            margin-right: 5px;
          }
          
          /* Masquer les éléments de contrôle */
          .no-print { 
            display: none !important; 
          }
          
          /* Utilitaires */
          .text-muted {
            color: #8b5cf6;
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
                <span class="prayer-icon">🙏</span> Intentions de Prière
              </h3>
              <div class="print-date-period">
                <span class="font-bold">Période :</span> ${fromDate} – ${toDate}<br/>
                <span class="font-bold">Imprimé le :</span> ${today}<br/>
                <span class="font-bold">Nombre d'intentions :</span> ${prayersToPrint.length}
              </div>
            </div>
          </div>
        </div>

        <!-- Statistiques -->
        <div class="print-stats avoid-break">
          <div class="font-bold" style="color: #7c3aed; margin-bottom: 10px;">
            Statistiques de la période
          </div>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-label">Total d'intentions</div>
              <div class="stat-value">${prayersToPrint.length}</div>
            </div>
            ${Object.entries(categoryStats).map(([cat, count]) => `
              <div class="stat-item">
                <div class="stat-label">${categories[cat as keyof typeof categories] || cat}</div>
                <div class="stat-value">${count}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Liste des intentions -->
        ${prayersToPrint.map((prayer, index) => `
          <div class="prayer-item avoid-break">
            <div class="prayer-category">
              ${categories[prayer.category as keyof typeof categories] || prayer.category || 'Autre'}
            </div>
            
            <h4 class="prayer-title">${prayer.title}</h4>
            
            <div class="prayer-meta">
              <span class="prayer-meta-item">
                <span class="font-bold">Date :</span>
                ${format(new Date(prayer.created_at), "d MMMM yyyy", { locale: fr })}
              </span>
              
              <span class="prayer-meta-item">
                <span class="font-bold">Par :</span>
                ${prayer.is_anonymous ? 'Anonyme' : (prayer.submitted_by_name || 'Non spécifié')}
              </span>
            </div>
            
            <div class="prayer-content">
              ${prayer.content}
            </div>
          </div>
          
          ${index < prayersToPrint.length - 1 && index % 4 === 3 ? '<div class="page-break"></div>' : ''}
        `).join('')}

        <!-- Pied de page -->
        <div class="print-footer avoid-break">
          Document des intentions de prière • ${currentHeaderConfig.main_title || 'Paroisse'} • 
          Généré le ${today} depuis l'application Paroisse<br/>
          <em>"Priez sans cesse" (1 Thessaloniciens 5:17)</em>
        </div>

        <!-- Contrôles d'impression (masqués à l'impression) -->
        <div class="no-print" style="position: fixed; top: 20px; right: 20px; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 1000;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
            <strong>Contrôles d'impression</strong><br/>
            Ce document a été généré automatiquement.
          </p>
          <div style="display: flex; gap: 10px;">
            <button onclick="window.print();" style="padding: 8px 16px; background: #7c3aed; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
              🖨️ Imprimer
            </button>
            <button onclick="window.close();" style="padding: 8px 16px; background: #e9d5ff; color: #7c3aed; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
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

  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      toast({
        title: "Erreur",
        description: "Titre et contenu sont obligatoires.",
        variant: "destructive",
      });
      return;
    }

    try {
      const prayerData = {
        title: formData.title,
        content: formData.content,
        submitted_by_name: formData.is_anonymous ? null : formData.submitted_by_name || null,
        submitted_by_email: formData.submitted_by_email || null,
        is_anonymous: formData.is_anonymous,
        category: formData.category || "autre",
        status: isAdmin ? "approved" : "pending",
        user_id: profile?.id || null,
      };

      if (editingId) {
        const { error } = await (supabase as any)
          .from("prayer_intentions")
          .update(prayerData)
          .eq("id", editingId);

        if (error) throw error;
        toast({ title: "Succès", description: "Intention mise à jour." });
      } else {
        const { error } = await (supabase as any)
          .from("prayer_intentions")
          .insert([prayerData]);

        if (error) throw error;
        toast({
          title: "Succès",
          description: isAdmin
            ? "Intention créée et approuvée."
            : "Intention soumise. Elle sera approuvée par un modérateur.",
        });
      }

      fetchPrayers();
      resetForm();
    } catch (err) {
      console.error("Erreur:", err);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'intention.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr ?")) return;

    try {
      const { error } = await (supabase as any)
        .from("prayer_intentions")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Succès", description: "Intention supprimée." });
      fetchPrayers();
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'intention.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      submitted_by_name: "",
      submitted_by_email: "",
      is_anonymous: false,
      category: "autre",
    });
    setShowForm(false);
    setEditingId(null);
  };

  const filteredPrayers = useMemo(() => {
    return prayers.filter(
      (p) =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.submitted_by_name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [prayers, searchTerm]);

  const categories = [
    { value: "autre", label: "Autre" },
    { value: "guerison", label: "Guérison" },
    { value: "famille", label: "Famille" },
    { value: "travail", label: "Travail" },
    { value: "etudes", label: "Études" },
    { value: "gratitude", label: "Gratitude" },
    { value: "monde", label: "Pour le monde" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeroBanner
        title="Intentions de prière"
        subtitle="Soumettez et consultez les intentions"
        showBackButton={true}
        backgroundImage={hero?.image_url || "/images/prayer.png"}
        onBgSave={saveHero}
      />

      <main className="flex-1 py-12 lg:py-16">
        <div className="container mx-auto px-4 space-y-8">
          {/* Filtres et Impression */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher une intention..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 bg-white/90 border-2 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500"
              />
            </div>

            {/* Filtres de date et impression */}
            <div className="flex flex-col md:flex-row gap-4 p-4 bg-card rounded-lg border">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <div className="flex-1">
                  <label className="flex items-center gap-2 text-sm font-medium mb-1">
                    <CalendarDays className="h-4 w-4" />
                    Du
                  </label>
                  <Input 
                    type="date"
                    onChange={(e) => setDateRange({...dateRange, from: e.target.value ? new Date(e.target.value) : null})}
                    className="w-full bg-white/90 border-2 border-gray-300 text-gray-900 focus:border-purple-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="flex items-center gap-2 text-sm font-medium mb-1">
                    <CalendarDays className="h-4 w-4" />
                    Au
                  </label>
                  <Input 
                    type="date"
                    onChange={(e) => setDateRange({...dateRange, to: e.target.value ? new Date(e.target.value) : null})}
                    className="w-full bg-white/90 border-2 border-gray-300 text-gray-900 focus:border-purple-500"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handlePrintPrayers}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-10 w-full md:w-auto"
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
              <div className="flex items-center gap-3 text-sm text-muted-foreground bg-purple-50 p-3 rounded-lg">
                {headerConfig.logo_url ? (
                  <img 
                    src={headerConfig.logo_url} 
                    alt={headerConfig.logo_alt_text || 'Logo'} 
                    className="h-8 w-8 object-contain"
                  />
                ) : (
                  <Church className="h-5 w-5 text-purple-500" />
                )}
                <div>
                  <span className="font-medium text-purple-700">{headerConfig.main_title}</span>
                  {headerConfig.subtitle && (
                    <span className="ml-2 text-purple-600">- {headerConfig.subtitle}</span>
                  )}
                  <span className="ml-2 text-gray-500">• Ces informations apparaîtront sur l'impression</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Search & Create */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher une intention..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/90 border-2 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500"
                />
              </div>
              <Button
                onClick={() => (showForm ? resetForm() : setShowForm(true))}
                className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Plus className="h-4 w-4" />
                {showForm ? "Annuler" : "Soumettre une intention"}
              </Button>
            </div>

            {/* Form */}
            {showForm && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-border rounded-lg p-6 bg-card space-y-4"
              >
                <h3 className="text-lg font-semibold">
                  {editingId ? "Modifier l'intention" : "Nouvelle intention de prière"}
                </h3>

                <Input
                  placeholder="Titre de l'intention"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-white/90 border-2 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500"
                />

                <textarea
                  placeholder="Décrivez votre intention de prière..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                  className="w-full bg-white/90 border-2 border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />

                <div>
                  <label className="block text-sm font-medium mb-2">Catégorie</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-white/90 border-2 border-gray-300 text-gray-900 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {categories.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={formData.is_anonymous}
                    onChange={(e) => setFormData({ ...formData, is_anonymous: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <label htmlFor="anonymous" className="text-sm font-medium cursor-pointer">
                    Rester anonyme
                  </label>
                </div>

                {!formData.is_anonymous && (
                  <>
                    <Input
                      placeholder="Votre nom"
                      value={formData.submitted_by_name}
                      onChange={(e) =>
                        setFormData({ ...formData, submitted_by_name: e.target.value })
                      }
                      className="bg-white/90 border-2 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500"
                    />
                    <Input
                      type="email"
                      placeholder="Votre email"
                      value={formData.submitted_by_email}
                      onChange={(e) =>
                        setFormData({ ...formData, submitted_by_email: e.target.value })
                      }
                      className="bg-white/90 border-2 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500"
                    />
                  </>
                )}

                <div className="flex gap-3">
                  <Button onClick={handleSave} className="flex-1">
                    Soumettre
                  </Button>
                  <Button onClick={resetForm} variant="outline" className="flex-1">
                    Annuler
                  </Button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Prayers Grid */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Chargement des intentions...</p>
            </div>
          ) : filteredPrayers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchTerm ? "Aucune intention trouvée." : "Aucune intention pour le moment."}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filteredPrayers.map((prayer, idx) => (
                <motion.div
                  key={prayer.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="border border-border rounded-lg p-6 bg-gradient-to-br from-purple-500/5 to-pink-500/5 hover:shadow-lg transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">{prayer.title}</h3>
                      <p className="text-xs text-purple-600 font-medium">
                        {categories.find((c) => c.value === prayer.category)?.label ||
                          prayer.category}
                      </p>
                    </div>
                    <Heart className="h-5 w-5 text-pink-500 flex-shrink-0" />
                  </div>

                  {/* Content */}
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {prayer.content}
                  </p>

                  {/* Meta */}
                  <div className="space-y-2 text-xs text-muted-foreground border-t border-border/50 pt-3 mb-4">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      <span>
                        {prayer.is_anonymous ? "Anonyme" : prayer.submitted_by_name || "Inconnu"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(prayer.created_at), "d MMMM", { locale: fr })}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setFormData({
                            title: prayer.title,
                            content: prayer.content,
                            submitted_by_name: prayer.submitted_by_name || "",
                            submitted_by_email: prayer.submitted_by_email || "",
                            is_anonymous: prayer.is_anonymous,
                            category: prayer.category || "autre",
                          });
                          setEditingId(prayer.id);
                          setShowForm(true);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleDelete(prayer.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PrayersPage;