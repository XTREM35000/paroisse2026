import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Save, X, AlertCircle, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks";
import { useHomepageContent } from "@/hooks/useHomepageContent";
import { useHeaderConfig, useUpdateHeaderConfig } from "@/hooks/useHeaderConfig";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { uploadFile } from "@/lib/supabase/storage";
import type { NavigationItem } from "@/hooks/useHeaderConfig";
import useRoleCheck from '@/hooks/useRoleCheck';

// use shared `supabase` client from integrations
const AdminHomepageEditor = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sections, isLoading: contentLoading } = useHomepageContent();
  
  const [loading, setLoading] = useState(false);
  const [heroData, setHeroData] = useState({
    title: "",
    subtitle: "",
    content: "",
    button_text: "",
    button_link: "",
    image_url: "",
  });
  
  const [galleryConfig, setGalleryConfig] = useState({
    limit: 4,
    order: "recent" as "recent" | "popular",
  });
  
  const [videosConfig, setVideosConfig] = useState({
    limit: 4,
    order: "recent" as "recent" | "popular",
  });
  
  const [eventsConfig, setEventsConfig] = useState({
    limit: 2,
    upcoming_only: true,
  });
  
  const [massTimes, setMassTimes] = useState({
    sunday: ["9h00", "11h00", "18h30"],
    weekdays: ["8h00", "18h30"],
    saturday: ["9h00", "18h00 (anticipée)"],
  });
  
  const [contact, setContact] = useState({
    address: "",
    email: "",
    moderator_phone: "",
    super_admin_email: "",
    super_admin_phone: "",
  });
  
  const [activeTab, setActiveTab] = useState("hero");

  // Header config state
  const { data: headerConfig, isLoading: headerConfigLoading } = useHeaderConfig();
  const { mutate: updateHeaderConfig, isPending: isSavingHeader } = useUpdateHeaderConfig();
  
  const [headerData, setHeaderData] = useState({
    logo_url: "",
    logo_alt_text: "Logo Paroisse",
    logo_size: "sm" as "sm" | "md" | "lg",
    main_title: "Paroisse Notre Dame",
    subtitle: "de la Compassion",
    navigation_items: [] as NavigationItem[],
  });

  // Load sections data on mount
  useEffect(() => {
    if (headerConfig) {
      setHeaderData({
        logo_url: headerConfig.logo_url || "",
        logo_alt_text: headerConfig.logo_alt_text,
        logo_size: headerConfig.logo_size,
        main_title: headerConfig.main_title,
        subtitle: headerConfig.subtitle,
        navigation_items: headerConfig.navigation_items || [],
      });
    }

    if (sections && sections.length > 0) {
      const heroSection = sections.find((s) => s.section_key === "hero");
      const gallerySection = sections.find((s) => s.section_key === "gallery_section");
      const videosSection = sections.find((s) => s.section_key === "videos_section");
      const eventsSection = sections.find((s) => s.section_key === "events_section");
      const massTSection = sections.find((s) => s.section_key === "footer_mass_times");
      const contactSection = sections.find((s) => s.section_key === "footer_contact");

      if (heroSection) {
        setHeroData({
          title: heroSection.title || "",
          subtitle: heroSection.subtitle || "",
          content: heroSection.content || "",
          button_text: heroSection.button_text || "",
          button_link: heroSection.button_link || "",
          image_url: heroSection.image_url || "",
        });
      }

      if (gallerySection && gallerySection.content) {
        try {
          const parsed = typeof gallerySection.content === "string" 
            ? JSON.parse(gallerySection.content) 
            : gallerySection.content;
          setGalleryConfig(parsed);
        } catch (e) {
          console.error("Error parsing gallery config:", e);
        }
      }

      if (videosSection && videosSection.content) {
        try {
          const parsed = typeof videosSection.content === "string" 
            ? JSON.parse(videosSection.content) 
            : videosSection.content;
          setVideosConfig(parsed);
        } catch (e) {
          console.error("Error parsing videos config:", e);
        }
      }

      if (eventsSection && eventsSection.content) {
        try {
          const parsed = typeof eventsSection.content === "string" 
            ? JSON.parse(eventsSection.content) 
            : eventsSection.content;
          setEventsConfig(parsed);
        } catch (e) {
          console.error("Error parsing events config:", e);
        }
      }

      if (massTSection && massTSection.content) {
        try {
          const parsed = typeof massTSection.content === "string" 
            ? JSON.parse(massTSection.content) 
            : massTSection.content;
          setMassTimes(parsed);
        } catch (e) {
          console.error("Error parsing mass times:", e);
        }
      }

      if (contactSection && contactSection.content) {
        try {
          const parsed = typeof contactSection.content === "string" 
            ? JSON.parse(contactSection.content) 
            : contactSection.content;
          setContact(parsed);
        } catch (e) {
          console.error("Error parsing contact:", e);
        }
      }
    }
  }, [sections, headerConfig]);

  const { profile, isAdmin } = useRoleCheck();

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <p className="text-lg font-semibold">Accès refusé</p>
          <p className="text-muted-foreground">Vous devez être connecté pour accéder à cette page.</p>
          <button
            onClick={() => navigate("/?mode=login#auth")}
            className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <p className="text-lg font-semibold">Accès interdit</p>
          <p className="text-muted-foreground">Vous n'avez pas les permissions nécessaires pour modifier la page d'accueil.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const handleSaveHero = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("homepage_sections")
        .update({
          title: heroData.title,
          subtitle: heroData.subtitle,
          content: heroData.content,
          button_text: heroData.button_text,
          button_link: heroData.button_link,
          image_url: heroData.image_url,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        })
        .eq("section_key", "hero");

      if (error) throw error;
      toast({ title: "Succès", description: "Section héro mise à jour" });
    } catch (error) {
      console.error("Error saving hero:", error);
      toast({ 
        title: "Erreur", 
        description: "Impossible de mettre à jour la section héro",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGalleryConfig = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("homepage_sections")
        .update({
          content: JSON.stringify(galleryConfig),
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        })
        .eq("section_key", "gallery_section");

      if (error) throw error;
      toast({ title: "Succès", description: "Configuration galerie mise à jour" });
    } catch (error) {
      console.error("Error saving gallery config:", error);
      toast({ 
        title: "Erreur", 
        description: "Impossible de mettre à jour la configuration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVideosConfig = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("homepage_sections")
        .update({
          content: JSON.stringify(videosConfig),
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        })
        .eq("section_key", "videos_section");

      if (error) throw error;
      toast({ title: "Succès", description: "Configuration vidéos mise à jour" });
    } catch (error) {
      console.error("Error saving videos config:", error);
      toast({ 
        title: "Erreur", 
        description: "Impossible de mettre à jour la configuration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEventsConfig = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("homepage_sections")
        .update({
          content: JSON.stringify(eventsConfig),
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        })
        .eq("section_key", "events_section");

      if (error) throw error;
      toast({ title: "Succès", description: "Configuration événements mise à jour" });
    } catch (error) {
      console.error("Error saving events config:", error);
      toast({ 
        title: "Erreur", 
        description: "Impossible de mettre à jour la configuration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMassTimes = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("homepage_sections")
        .update({
          content: JSON.stringify(massTimes),
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        })
        .eq("section_key", "footer_mass_times");

      if (error) throw error;
      toast({ title: "Succès", description: "Horaires des messes mis à jour" });
    } catch (error) {
      console.error("Error saving mass times:", error);
      toast({ 
        title: "Erreur", 
        description: "Impossible de mettre à jour les horaires",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Header handlers
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const fileName = `header-logo-${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const res = await uploadFile(file, `logos/${fileName}`);
      if (!res || !res.publicUrl) throw new Error('Upload failed');
      setHeaderData({ ...headerData, logo_url: res.publicUrl });
      toast({ title: "Succès", description: "Logo téléchargé" });

      // Auto-save header logo so header and favicon update immediately
      try {
        updateHeaderConfig({ logo_url: res.publicUrl });
      } catch (err) {
        console.error('Error auto-saving header logo:', err);
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({ 
        title: "Erreur", 
        description: "Impossible de télécharger le logo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const fileName = `hero-${Date.now()}-${file.name}`;
      const res = await uploadFile(file, `heroes/${fileName}`);
      if (!res || !res.publicUrl) throw new Error('Upload failed');
      setHeroData({ ...heroData, image_url: res.publicUrl });
      toast({ title: 'Succès', description: 'Image héro téléchargée' });
    } catch (error) {
      console.error('Error uploading hero image:', error);
      toast({ title: 'Erreur', description: "Impossible de télécharger l'image héro", variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const addNavigationItem = () => {
    setHeaderData({
      ...headerData,
      navigation_items: [
        ...headerData.navigation_items,
        { label: "", href: "", icon: "home" },
      ],
    });
  };

  const updateNavigationItem = (index: number, field: keyof NavigationItem, value: string) => {
    const newItems = [...headerData.navigation_items];
    newItems[index] = { ...newItems[index], [field]: value };
    setHeaderData({ ...headerData, navigation_items: newItems });
  };

  const removeNavigationItem = (index: number) => {
    const newItems = headerData.navigation_items.filter((_, i) => i !== index);
    setHeaderData({ ...headerData, navigation_items: newItems });
  };

  const handleSaveHeader = async () => {
    try {
      updateHeaderConfig({
        logo_url: headerData.logo_url || null,
        logo_alt_text: headerData.logo_alt_text,
        logo_size: headerData.logo_size,
        main_title: headerData.main_title,
        subtitle: headerData.subtitle,
        navigation_items: headerData.navigation_items,
      });
    } catch (error) {
      console.error("Error saving header:", error);
      toast({ 
        title: "Erreur", 
        description: "Impossible de sauvegarder la configuration du header",
        variant: "destructive"
      });
    }
  };

  const handleSaveContact = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("homepage_sections")
        .update({
          content: JSON.stringify(contact),
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        })
        .eq("section_key", "footer_contact");

      if (error) throw error;
      toast({ title: "Succès", description: "Informations de contact mises à jour" });
    } catch (error) {
      console.error("Error saving contact:", error);
      toast({ 
        title: "Erreur", 
        description: "Impossible de mettre à jour les contacts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (contentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold font-display">
              Page d’accueil &amp; SEO
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Optimisez le premier écran que voient vos visiteurs : logo, titres,
              section héro et blocs clés. Concentrez-vous d’abord sur un message
              clair avec des mots‑clés locaux (paroisse, ville, quartier).
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-border overflow-x-auto pb-3">
              {[
                { id: "header", label: "En‑tête (logo & menu)" },
                { id: "hero", label: "Section héro (SEO)" },
                { id: "gallery", label: "Bloc Galerie" },
                { id: "videos", label: "Bloc Vidéos" },
                { id: "events", label: "Bloc Événements" },
                { id: "mass-times", label: "Horaires des messes" },
                { id: "contact", label: "Contact & infos pratiques" },
              ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-primary border-b-2 border-primary -mb-4 pb-4"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-sm">
            {/* Header Tab */}
            {activeTab === "header" && (
              <div className="space-y-6">
                {/* Logo Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Logo</h3>
                  <div className="flex gap-4 items-start">
                    <div className="flex-1 space-y-2">
                      <label className="block text-sm font-medium">Logo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={loading}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    {headerData.logo_url && (
                      <img
                        src={headerData.logo_url}
                        alt="Logo preview"
                        className="h-16 w-auto object-contain rounded border border-border p-2"
                      />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Texte alternatif</label>
                      <input
                        type="text"
                        value={headerData.logo_alt_text}
                        onChange={(e) => setHeaderData({ ...headerData, logo_alt_text: e.target.value })}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Taille du logo</label>
                      <select
                        value={headerData.logo_size}
                        onChange={(e) => setHeaderData({ ...headerData, logo_size: e.target.value as "sm" | "md" | "lg" })}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="sm">Petit</option>
                        <option value="md">Moyen</option>
                        <option value="lg">Grand</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Titles Section */}
                <div className="space-y-4 border-t border-border pt-6">
                  <h3 className="text-lg font-semibold">Titres</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Titre principal</label>
                      <input
                        type="text"
                        value={headerData.main_title}
                        onChange={(e) => setHeaderData({ ...headerData, main_title: e.target.value })}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Sous-titre</label>
                      <input
                        type="text"
                        value={headerData.subtitle}
                        onChange={(e) => setHeaderData({ ...headerData, subtitle: e.target.value })}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Navigation Section */}
                <div className="space-y-4 border-t border-border pt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Navigation</h3>
                    <button
                      onClick={addNavigationItem}
                      disabled={loading}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                      Ajouter un lien
                    </button>
                  </div>

                  <div className="space-y-3">
                    {headerData.navigation_items.map((item, index) => (
                      <div key={index} className="flex gap-2 items-center p-3 border border-border rounded">
                        <input
                          type="text"
                          placeholder="Label (ex: Accueil)"
                          value={item.label}
                          onChange={(e) => updateNavigationItem(index, "label", e.target.value)}
                          className="flex-1 px-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <input
                          type="text"
                          placeholder="Lien (ex: /)"
                          value={item.href}
                          onChange={(e) => updateNavigationItem(index, "href", e.target.value)}
                          className="flex-1 px-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <input
                          type="text"
                          placeholder="Icône (ex: home)"
                          value={item.icon}
                          onChange={(e) => updateNavigationItem(index, "icon", e.target.value)}
                          className="flex-1 px-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                          onClick={() => removeNavigationItem(index)}
                          disabled={loading}
                          className="flex items-center justify-center h-10 w-10 bg-destructive/10 text-destructive rounded hover:bg-destructive/20 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save Buttons */}
                <div className="flex justify-end gap-2 pt-6 border-t border-border">
                  <button
                    onClick={() => {
                      if (headerConfig) {
                        setHeaderData({
                          logo_url: headerConfig.logo_url || "",
                          logo_alt_text: headerConfig.logo_alt_text,
                          logo_size: headerConfig.logo_size,
                          main_title: headerConfig.main_title,
                          subtitle: headerConfig.subtitle,
                          navigation_items: headerConfig.navigation_items || [],
                        });
                      }
                    }}
                    disabled={loading || isSavingHeader}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveHeader}
                    disabled={loading || isSavingHeader}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isSavingHeader && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isSavingHeader ? "Sauvegarde..." : "Sauvegarder"}
                  </button>
                </div>
              </div>
            )}

            {/* Hero Tab */}
            {activeTab === "hero" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Titre principal (H1)</label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Phrase courte et claire qui décrit la paroisse (inclure idéalement la
                    ville ou le quartier&nbsp;: ex. &laquo;&nbsp;Paroisse Notre Dame de la Compassion – Abidjan&nbsp;&raquo;).
                  </p>
                  <input
                    type="text"
                    value={heroData.title}
                    onChange={(e) => setHeroData({ ...heroData, title: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sous-titre</label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Accroche qui résume la mission ou un appel à l’action (ex. &laquo;&nbsp;Une communauté vivante au service de la foi&nbsp;&raquo;).
                  </p>
                  <input
                    type="text"
                    value={heroData.subtitle}
                    onChange={(e) => setHeroData({ ...heroData, subtitle: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Paragraphe d’introduction</label>
                  <p className="text-xs text-muted-foreground mb-2">
                    2–3 phrases maximum, avec des mots‑clés naturels (paroisse, ville, horaires, communautés…)
                    pour aider le référencement sans surcharger en texte.
                  </p>
                  <textarea
                    value={heroData.content}
                    onChange={(e) => setHeroData({ ...heroData, content: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Texte du bouton principal</label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Appel à l’action clair (ex. &laquo;&nbsp;Découvrir les messes&nbsp;&raquo;, &laquo;&nbsp;Voir les événements&nbsp;&raquo;).
                    </p>
                    <input
                      type="text"
                      value={heroData.button_text}
                      onChange={(e) => setHeroData({ ...heroData, button_text: e.target.value })}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Lien du bouton</label>
                    <p className="text-xs text-muted-foreground mb-2">
                      URL interne à privilégier (ex. <code className="font-mono text-[11px]">/evenements</code> ou
                      <code className="font-mono text-[11px]">/donate</code>).
                    </p>
                    <input
                      type="text"
                      value={heroData.button_link}
                      onChange={(e) => setHeroData({ ...heroData, button_link: e.target.value })}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">URL de l'image</label>
                  <div className="flex gap-4 items-start">
                    <input
                      type="text"
                      value={heroData.image_url}
                      onChange={(e) => setHeroData({ ...heroData, image_url: e.target.value })}
                      className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="/images/hero.png"
                    />
                    <div className="flex flex-col items-start gap-2">
                      <label className="block text-sm font-medium mb-1">Ou téléverser</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleHeroImageUpload}
                        disabled={loading}
                        className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>
                  {heroData.image_url && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium mb-2">Aperçu</label>
                      <img src={heroData.image_url} alt="aperçu hero" className="w-full max-h-60 object-cover rounded border border-border" />
                    </div>
                  )}
                </div>
                <button
                  onClick={handleSaveHero}
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Enregistrer
                </button>
              </div>
            )}

            {/* Gallery Config Tab */}
            {activeTab === "gallery" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre d'images à afficher</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={galleryConfig.limit}
                    onChange={(e) => setGalleryConfig({ ...galleryConfig, limit: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Ordre d'affichage</label>
                  <select
                    value={galleryConfig.order}
                    onChange={(e) => setGalleryConfig({ ...galleryConfig, order: e.target.value as "recent" | "popular" })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="recent">Récentes</option>
                    <option value="popular">Populaires</option>
                  </select>
                </div>
                <button
                  onClick={handleSaveGalleryConfig}
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Enregistrer
                </button>
              </div>
            )}

            {/* Videos Config Tab */}
            {activeTab === "videos" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre de vidéos à afficher</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={videosConfig.limit}
                    onChange={(e) => setVideosConfig({ ...videosConfig, limit: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Ordre d'affichage</label>
                  <select
                    value={videosConfig.order}
                    onChange={(e) => setVideosConfig({ ...videosConfig, order: e.target.value as "recent" | "popular" })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="recent">Récentes</option>
                    <option value="popular">Populaires</option>
                  </select>
                </div>
                <button
                  onClick={handleSaveVideosConfig}
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Enregistrer
                </button>
              </div>
            )}

            {/* Events Config Tab */}
            {activeTab === "events" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre d'événements à afficher</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={eventsConfig.limit}
                    onChange={(e) => setEventsConfig({ ...eventsConfig, limit: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="upcoming-only"
                    checked={eventsConfig.upcoming_only}
                    onChange={(e) => setEventsConfig({ ...eventsConfig, upcoming_only: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="upcoming-only" className="text-sm font-medium">
                    Afficher uniquement les événements à venir
                  </label>
                </div>
                <button
                  onClick={handleSaveEventsConfig}
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Enregistrer
                </button>
              </div>
            )}

            {/* Mass Times Tab */}
            {activeTab === "mass-times" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Dimanche</label>
                  <div className="space-y-2">
                    {massTimes.sunday.map((time, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          value={time}
                          onChange={(e) => {
                            const updated = [...massTimes.sunday];
                            updated[idx] = e.target.value;
                            setMassTimes({ ...massTimes, sunday: updated });
                          }}
                          className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                          onClick={() => {
                            const updated = massTimes.sunday.filter((_, i) => i !== idx);
                            setMassTimes({ ...massTimes, sunday: updated });
                          }}
                          className="px-3 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setMassTimes({ ...massTimes, sunday: [...massTimes.sunday, ""] })}
                      className="text-sm text-primary hover:underline"
                    >
                      + Ajouter une heure
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Lunes - Viernes</label>
                  <div className="space-y-2">
                    {massTimes.weekdays.map((time, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          value={time}
                          onChange={(e) => {
                            const updated = [...massTimes.weekdays];
                            updated[idx] = e.target.value;
                            setMassTimes({ ...massTimes, weekdays: updated });
                          }}
                          className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                          onClick={() => {
                            const updated = massTimes.weekdays.filter((_, i) => i !== idx);
                            setMassTimes({ ...massTimes, weekdays: updated });
                          }}
                          className="px-3 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setMassTimes({ ...massTimes, weekdays: [...massTimes.weekdays, ""] })}
                      className="text-sm text-primary hover:underline"
                    >
                      + Ajouter une heure
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Samedi</label>
                  <div className="space-y-2">
                    {massTimes.saturday.map((time, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          value={time}
                          onChange={(e) => {
                            const updated = [...massTimes.saturday];
                            updated[idx] = e.target.value;
                            setMassTimes({ ...massTimes, saturday: updated });
                          }}
                          className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                          onClick={() => {
                            const updated = massTimes.saturday.filter((_, i) => i !== idx);
                            setMassTimes({ ...massTimes, saturday: updated });
                          }}
                          className="px-3 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setMassTimes({ ...massTimes, saturday: [...massTimes.saturday, ""] })}
                      className="text-sm text-primary hover:underline"
                    >
                      + Ajouter une heure
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleSaveMassTimes}
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Enregistrer
                </button>
              </div>
            )}

            {/* Contact Tab */}
            {activeTab === "contact" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Adresse</label>
                  <textarea
                    value={contact.address}
                    onChange={(e) => setContact({ ...contact, address: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email principal</label>
                  <input
                    type="email"
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Téléphone modérateur</label>
                  <input
                    type="tel"
                    value={contact.moderator_phone}
                    onChange={(e) => setContact({ ...contact, moderator_phone: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email super admin</label>
                  <input
                    type="email"
                    value={contact.super_admin_email}
                    onChange={(e) => setContact({ ...contact, super_admin_email: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Téléphone super admin</label>
                  <input
                    type="tel"
                    value={contact.super_admin_phone}
                    onChange={(e) => setContact({ ...contact, super_admin_phone: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <button
                  onClick={handleSaveContact}
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Enregistrer
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminHomepageEditor;
