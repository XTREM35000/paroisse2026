import { useState, useEffect, useMemo } from "react";
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
  }, []);

  const fetchPrayers = async () => {
    try {
      setLoading(true);
      const query = (supabase as any).from("prayer_intentions").select("*");

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
  };

  // Fonction d'impression avec design professionnel
  const handlePrintPrayers = async () => {
    const prayersToPrint = dateRange.from && dateRange.to
      ? filteredPrayers.filter((prayer) => {
          const prayerDate = new Date(prayer.created_at);
          return prayerDate >= dateRange.from! && prayerDate <= dateRange.to!;
        })
      : filteredPrayers;

    if (prayersToPrint.length === 0) {
      toast({ 
        title: "Aucune donnée", 
        description: "Aucune intention à imprimer pour cette période.", 
        variant: "destructive" 
      });
      return;
    }

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

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ 
        title: "Erreur", 
        description: "Veuillez autoriser les fenêtres popup pour l'impression.", 
        variant: "destructive" 
      });
      return;
    }

    const today = format(new Date(), "d MMMM yyyy", { locale: fr });
    const fromDate = dateRange.from 
      ? format(dateRange.from, "dd/MM/yyyy", { locale: fr })
      : format(new Date(prayersToPrint[prayersToPrint.length - 1].created_at), "dd/MM/yyyy", { locale: fr });
      
    const toDate = dateRange.to 
      ? format(dateRange.to, "dd/MM/yyyy", { locale: fr })
      : format(new Date(prayersToPrint[0].created_at), "dd/MM/yyyy", { locale: fr });

    // Catégories pour l'affichage
    const categories: Record<string, string> = {
      autre: "Autre",
      guerison: "Guérison",
      famille: "Famille",
      travail: "Travail",
      etudes: "Études",
      gratitude: "Gratitude",
      monde: "Pour le monde"
    };

    // Générer le contenu HTML avec un design propre
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
            font-family: 'Segoe UI', 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            color: #333;
            font-size: 11pt;
            line-height: 1.5;
          }
          
          /* En-tête */
          .print-header {
            display: flex;
            align-items: flex-start;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #7c3aed;
            page-break-after: avoid;
          }
          
          .logo-container {
            margin-right: 16px;
            flex-shrink: 0;
          }
          
          .print-logo {
            max-height: 70px;
            max-width: 100px;
            object-fit: contain;
          }
          
          .title-container {
            flex-grow: 1;
          }
          
          .main-title {
            font-size: 20pt;
            font-weight: bold;
            color: #2d3748;
            margin: 0 0 4px 0;
          }
          
          .subtitle {
            font-size: 14pt;
            color: #4a5568;
            margin: 0 0 10px 0;
            font-style: italic;
          }
          
          .document-title {
            font-size: 16pt;
            font-weight: 600;
            color: #7c3aed;
            margin: 0 0 8px 0;
          }
          
          .meta-info {
            font-size: 10pt;
            color: #718096;
            margin: 0;
          }
          
          /* Statistiques */
          .stats-section {
            background: #f8f5ff;
            border-radius: 6px;
            padding: 12px 16px;
            margin: 0 0 20px 0;
            border-left: 4px solid #7c3aed;
            page-break-inside: avoid;
          }
          
          .stats-title {
            font-size: 12pt;
            font-weight: 600;
            color: #7c3aed;
            margin: 0 0 10px 0;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 8px;
          }
          
          .stat-item {
            text-align: center;
            padding: 8px;
            background: white;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
          }
          
          .stat-label {
            font-size: 9pt;
            color: #718096;
          }
          
          .stat-value {
            font-size: 14pt;
            font-weight: bold;
            color: #7c3aed;
            margin-top: 4px;
          }
          
          /* Liste des intentions */
          .prayer-item {
            margin: 0 0 16px 0;
            padding-bottom: 16px;
            border-bottom: 1px solid #e2e8f0;
            page-break-inside: avoid;
          }
          
          .prayer-item:last-child {
            border-bottom: none;
          }
          
          .prayer-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
          }
          
          .prayer-title {
            font-size: 13pt;
            font-weight: 600;
            color: #2d3748;
            margin: 0;
            flex-grow: 1;
          }
          
          .prayer-category {
            display: inline-block;
            background: #f3e8ff;
            color: #7c3aed;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 9pt;
            font-weight: 500;
            margin-left: 10px;
            white-space: nowrap;
          }
          
          .prayer-meta {
            display: flex;
            gap: 15px;
            margin-bottom: 10px;
            font-size: 9pt;
            color: #718096;
          }
          
          .prayer-content {
            font-size: 11pt;
            line-height: 1.6;
            color: #4a5568;
            white-space: pre-line;
            text-align: justify;
          }
          
          .author-info {
            font-style: italic;
            color: #7c3aed;
          }
          
          /* Pied de page */
          .print-footer {
            margin-top: 25px;
            padding-top: 15px;
            border-top: 1px solid #e2e8f0;
            font-size: 9pt;
            color: #718096;
            text-align: center;
            page-break-before: avoid;
          }
          
          /* Utilitaires */
          .page-break {
            page-break-before: always;
          }
          
          .avoid-break {
            page-break-inside: avoid;
          }
          
          .no-print {
            display: none;
          }
        </style>
      </head>
      <body>
        <div class="print-header avoid-break">
          ${currentHeaderConfig.logo_url ? `
            <div class="logo-container">
              <img src="${currentHeaderConfig.logo_url}" 
                   alt="${currentHeaderConfig.logo_alt_text || 'Logo'}" 
                   class="print-logo" />
            </div>
          ` : ''}
          
          <div class="title-container">
            <h1 class="main-title">${currentHeaderConfig.main_title || 'Paroisse Notre Dame'}</h1>
            ${currentHeaderConfig.subtitle ? `
              <h2 class="subtitle">${currentHeaderConfig.subtitle}</h2>
            ` : ''}
            
            <h3 class="document-title">Intentions de Prière</h3>
            <div class="meta-info">
              Période : ${fromDate} – ${toDate} | 
              Imprimé le : ${today} | 
              Total : ${prayersToPrint.length} intention(s)
            </div>
          </div>
        </div>

        <!-- Statistiques -->
        <div class="stats-section avoid-break">
          <div class="stats-title">Statistiques</div>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-label">Total d'intentions</div>
              <div class="stat-value">${prayersToPrint.length}</div>
            </div>
            
            ${(() => {
              const stats: Record<string, number> = {};
              prayersToPrint.forEach(p => {
                const cat = p.category || 'autre';
                stats[cat] = (stats[cat] || 0) + 1;
              });
              
              return Object.entries(stats).map(([cat, count]) => `
                <div class="stat-item">
                  <div class="stat-label">${categories[cat] || cat}</div>
                  <div class="stat-value">${count}</div>
                </div>
              `).join('');
            })()}
          </div>
        </div>

        <!-- Liste des intentions -->
        ${prayersToPrint.map((prayer, index) => `
          <div class="prayer-item avoid-break">
            <div class="prayer-header">
              <div class="prayer-title">${prayer.title}</div>
              <span class="prayer-category">
                ${categories[prayer.category as string] || prayer.category || 'Autre'}
              </span>
            </div>
            
            <div class="prayer-meta">
              <span><strong>Date :</strong> ${format(new Date(prayer.created_at), "d MMMM yyyy", { locale: fr })}</span>
              <span class="author-info">
                <strong>Auteur :</strong> ${prayer.is_anonymous ? 'Anonyme' : (prayer.submitted_by_name || 'Non spécifié')}
              </span>
            </div>
            
            <div class="prayer-content">
              ${prayer.content}
            </div>
          </div>
          
          ${index < prayersToPrint.length - 1 && index % 8 === 7 ? '<div class="page-break"></div>' : ''}
        `).join('')}

        <!-- Pied de page -->
        <div class="print-footer avoid-break">
          Document généré depuis l'application Paroisse • ${currentHeaderConfig.main_title || 'Paroisse'} • 
          ${today}<br/>
          "Priez sans cesse" (1 Thessaloniciens 5:17)
        </div>

        <!-- Contrôles (masqués lors de l'impression) -->
        <div class="no-print" style="position: fixed; top: 20px; right: 20px; background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="margin-bottom: 10px; font-size: 14px; color: #4a5568;">
            <strong>Prêt à imprimer</strong>
          </div>
          <button onclick="window.print();" style="padding: 8px 16px; background: #7c3aed; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; margin-right: 8px;">
            🖨️ Imprimer
          </button>
          <button onclick="window.close();" style="padding: 8px 16px; background: #e2e8f0; color: #4a5568; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
            Fermer
          </button>
        </div>
        
        <script>
          // Délai pour s'assurer que le contenu est chargé
          setTimeout(() => {
            window.focus();
            window.print();
            
            // Option: fermer après impression
            window.onafterprint = function() {
              setTimeout(() => {
                window.close();
              }, 500);
            };
          }, 300);
        </script>
      </body>
      </html>
    `;

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
                className="pl-10 h-12"
              />
            </div>

            {/* Filtres de date et impression */}
            <div className="flex flex-col md:flex-row gap-4 p-4 bg-card rounded-lg border">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Du
                  </label>
                  <Input 
                    type="date"
                    onChange={(e) => setDateRange({...dateRange, from: e.target.value ? new Date(e.target.value) : null})}
                    className="w-full"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Au
                  </label>
                  <Input 
                    type="date"
                    onChange={(e) => setDateRange({...dateRange, to: e.target.value ? new Date(e.target.value) : null})}
                    className="w-full"
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
                  className="pl-10"
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
                />

                <textarea
                  placeholder="Décrivez votre intention de prière..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                  className="w-full border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />

                <div>
                  <label className="block text-sm font-medium mb-2">Catégorie</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary"
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
                    />
                    <Input
                      type="email"
                      placeholder="Votre email"
                      value={formData.submitted_by_email}
                      onChange={(e) =>
                        setFormData({ ...formData, submitted_by_email: e.target.value })
                      }
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