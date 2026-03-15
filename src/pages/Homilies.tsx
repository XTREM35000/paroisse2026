import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, BookOpen, Users, Calendar, Play, Plus, Edit2, Trash2, Clock, Zap, Music } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import useRoleCheck from "@/hooks/useRoleCheck";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import HeroBanner from "@/components/HeroBanner";
import usePageHero from "@/hooks/usePageHero";
import { supabase } from "@/integrations/supabase/client";
import HomilyModal from '@/components/HomilyModal';
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Homily {
  id: string;
  title: string;
  priest_name: string;
  description?: string;
  homily_date: string;
  video_url?: string | null;
  image_url?: string | null;
  transcript?: string | null;
  duration_minutes?: number;
  created_at: string;
  updated_at: string;
}

const HomilyPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);
  const { toast } = useToast();
  const { isAdmin } = useRoleCheck();

  const [homilies, setHomilies] = useState<Homily[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "priest">("date");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch homilies
  useEffect(() => {
    fetchHomilies();
  }, []);

  const fetchHomilies = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("homilies")
        .select("*")
        .order("homily_date", { ascending: false });

      if (error) throw error;
      setHomilies(data || []);
    } catch (err) {
      console.error("Erreur:", err);
      toast({
        title: "Erreur",
        description: "Impossible de charger les homélies.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette homélie ?")) return;

    try {
      const { error } = await (supabase as any)
        .from("homilies")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Succès", description: "Homélie supprimée." });
      fetchHomilies();
    } catch (err) {
      console.error("Erreur:", err);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'homélie.",
        variant: "destructive",
      });
    }
  };

  // Filter & sort homilies
  const filteredHomilies = useMemo(() => {
    let filtered = homilies.filter(
      (h) =>
        h.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.priest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (h.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    );

    if (sortBy === "priest") {
      filtered.sort((a, b) => a.priest_name.localeCompare(b.priest_name));
    }

    return filtered;
  }, [homilies, searchTerm, sortBy]);

  // Stats
  const stats = {
    total: homilies.length,
    priests: new Set(homilies.map((h) => h.priest_name)).size,
    avgDuration:
      homilies.length > 0
        ? Math.round(
            homilies.reduce((sum, h) => sum + (h.duration_minutes || 0), 0) / homilies.length
          )
        : 0,
  };

  // Priests list
  const priests = useMemo(() => {
    return Array.from(new Set(homilies.map((h) => h.priest_name)));
  }, [homilies]);

  return (
    <div className="min-h-screen bg-background">
      <HeroBanner
        title="Les Homélies"
        subtitle="Écoutez les prédications spirituelles de nos prêtres"
        backgroundImage={hero?.image_url}
        onBgSave={saveHero}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Homilies */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              className="relative overflow-hidden bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-200 dark:border-blue-800 rounded-xl p-8"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -mr-12 -mt-12" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                    Homélies
                  </h3>
                  <BookOpen className="h-6 w-6 text-blue-500" />
                </div>
                <p className="text-4xl font-bold text-blue-700 dark:text-blue-300 mb-2">
                  {stats.total}
                </p>
                <p className="text-sm text-blue-600/70 dark:text-blue-400/70">
                  Ensemble des prédications
                </p>
              </div>
            </motion.div>

            {/* Priests */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              className="relative overflow-hidden bg-gradient-to-br from-purple-500/20 to-purple-600/5 border border-purple-200 dark:border-purple-800 rounded-xl p-8"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full -mr-12 -mt-12" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                    Prêtres
                  </h3>
                  <Users className="h-6 w-6 text-purple-500" />
                </div>
                <p className="text-4xl font-bold text-purple-700 dark:text-purple-300 mb-2">
                  {stats.priests}
                </p>
                <p className="text-sm text-purple-600/70 dark:text-purple-400/70">
                  Prédicateurs
                </p>
              </div>
            </motion.div>

            {/* Duration */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              className="relative overflow-hidden bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-200 dark:border-amber-800 rounded-xl p-8"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full -mr-12 -mt-12" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                    Durée Moy.
                  </h3>
                  <Clock className="h-6 w-6 text-amber-500" />
                </div>
                <p className="text-4xl font-bold text-amber-700 dark:text-amber-300 mb-2">
                  {stats.avgDuration}
                  <span className="text-lg ml-1">min</span>
                </p>
                <p className="text-sm text-amber-600/70 dark:text-amber-400/70">
                  Par homélie
                </p>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Controls Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-border p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 flex-1">
              {/* Search */}
              <div className="sm:col-span-2 relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une homélie..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "date" | "priest")}
                className="px-4 py-2 rounded-lg bg-background border border-border text-sm font-medium"
              >
                <option value="date">Récentes d'abord</option>
                <option value="priest">Par prêtre</option>
              </select>
            </div>

            {/* Nouvelle homélie - en haut à droite pour Admin/Super_Admin */}
            {isAdmin && (
              <Button
                onClick={() => {
                  setShowForm(true);
                  setEditingId(null);
                }}
                className="md:ml-4 shrink-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle homélie
              </Button>
            )}
          </div>
        </motion.section>

        {/* Homily Modal for create/edit */}
        <HomilyModal
          open={showForm}
          homilyId={editingId}
          onClose={() => {
            setShowForm(false);
            setEditingId(null);
          }}
          onSaved={() => {
            fetchHomilies();
          }}
        />

        {/* Priests Directory Section */}
        {priests.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-foreground mb-6">Nos Prédicateurs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {priests.map((priest, idx) => {
                const priestHomilies = homilies.filter((h) => h.priest_name === priest);
                return (
                  <motion.div
                    key={priest}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-card border border-border rounded-lg p-5 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center flex-shrink-0">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{priest}</h3>
                        <p className="text-sm text-muted-foreground">
                          {priestHomilies.length} homélie{priestHomilies.length > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Homilies List */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {filteredHomilies.length === homilies.length
              ? "Toutes les homélies"
              : `${filteredHomilies.length} résultat${filteredHomilies.length > 1 ? "s" : ""}`}
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
              <p className="text-muted-foreground">Chargement des homélies...</p>
            </div>
          ) : filteredHomilies.length === 0 ? (
            <div className="bg-muted/50 rounded-lg p-12 text-center">
              <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Aucune homélie ne correspond à votre recherche"
                  : "Aucune homélie disponible"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHomilies.map((homily, idx) => (
                <motion.div
                  key={homily.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-all hover:shadow-md"
                >
                  <div className="flex flex-col md:flex-row gap-4 p-6">
                    {/* Image */}
                    {homily.image_url && (
                      <div className="md:w-40 md:h-40 flex-shrink-0">
                        <img
                          src={homily.image_url}
                          alt={homily.title}
                          className="w-full h-40 md:h-40 object-cover rounded-lg"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                            {homily.title}
                          </h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <Users className="h-4 w-4" />
                            {homily.priest_name}
                          </p>
                        </div>
                      </div>

                      {homily.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {homily.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(homily.homily_date), "dd MMM yyyy", { locale: fr })}
                        </span>
                        {homily.duration_minutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {homily.duration_minutes} min
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {homily.video_url && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => window.open(homily.video_url, "_blank")}
                            className="flex-1"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Écouter
                          </Button>
                        )}
                        {isAdmin && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingId(homily.id);
                                setShowForm(true);
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(homily.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Info Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200/50 dark:border-blue-800/50 rounded-xl p-8"
        >
          <h3 className="text-xl font-bold text-foreground mb-4">À propos des homélies</h3>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Retrouvez ici toutes les homélies prononcées par nos prêtres lors des célébrations. 
            Chaque homélie est une réflexion spirituelle approfondie sur la Parole de Dieu et 
            un guide pour notre vie de foi.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <Zap className="h-5 w-5 text-blue-500 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-foreground">Spiritualité</h4>
                <p className="text-sm text-muted-foreground">
                  Nourrir votre foi avec des enseignements profonds
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Music className="h-5 w-5 text-purple-500 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-foreground">Accessibles</h4>
                <p className="text-sm text-muted-foreground">
                  Écoutez à tout moment, n'importe où
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default HomilyPage;
