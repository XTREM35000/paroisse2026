import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Edit2, Trash2, Upload, Heart, Calendar, User } from "lucide-react";
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

const PrayersPage = () => {
  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);
  const { profile } = useUser();
  const { toast } = useToast();

  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  // Fetch prayers
  useEffect(() => {
    fetchPrayers();
  }, []);

  const fetchPrayers = async () => {
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
                className="gap-2"
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
