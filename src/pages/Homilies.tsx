import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Edit2, Trash2, Upload, ChevronLeft, Calendar, User, Download, Play } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import HeroBanner from "@/components/HeroBanner";
import usePageHero from "@/hooks/usePageHero";
import { supabase } from "@/integrations/supabase/client";
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
  const { profile } = useUser();
  const { toast } = useToast();

  const [homilies, setHomilies] = useState<Homily[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    priest_name: "",
    description: "",
    homily_date: new Date().toISOString().split("T")[0],
    image_url: "",
    video_url: "",
    transcript: "",
    duration_minutes: "",
  });

  const isAdmin = !!(
    profile?.role &&
    ["admin", "super_admin", "administrateur"].includes(String(profile.role).toLowerCase())
  );

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
      console.error("Erreur lors du chargement des homélies:", err);
      toast({
        title: "Erreur",
        description: "Impossible de charger les homélies.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      toast({
        title: "Info",
        description: `Vidéo sélectionnée: ${file.name}`,
      });
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.priest_name || !formData.homily_date) {
      toast({
        title: "Erreur",
        description: "Titre, prêtre et date sont obligatoires.",
        variant: "destructive",
      });
      return;
    }

    try {
      let imageUrl = formData.image_url;
      let videoUrl = formData.video_url;

      // Upload image if selected
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `homilies/${fileName}`;
        const bucket = import.meta.env.VITE_BUCKET_GALLERY || "gallery";

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, imageFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        imageUrl = data?.publicUrl || formData.image_url;
      }

      // Upload video if selected (note: large files may need special handling)
      if (videoFile) {
        const fileExt = videoFile.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `homilies/videos/${fileName}`;
        const bucket = import.meta.env.VITE_BUCKET_GALLERY || "gallery";

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, videoFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        videoUrl = data?.publicUrl || formData.video_url;
      }

      const homilyData = {
        title: formData.title,
        priest_name: formData.priest_name,
        description: formData.description || null,
        homily_date: formData.homily_date,
        image_url: imageUrl || null,
        video_url: videoUrl || null,
        transcript: formData.transcript || null,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
      };

      if (editingId) {
        const { error } = await (supabase as any)
          .from("homilies")
          .update(homilyData)
          .eq("id", editingId);

        if (error) throw error;
        toast({ title: "Succès", description: "Homélie mise à jour." });
      } else {
        const { error } = await (supabase as any)
          .from("homilies")
          .insert([homilyData]);

        if (error) throw error;
        toast({ title: "Succès", description: "Homélie créée." });
      }

      fetchHomilies();
      resetForm();
    } catch (err) {
      console.error("Erreur:", err);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'homélie.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr ?")) return;

    try {
      const { error } = await (supabase as any)
        .from("homilies")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Succès", description: "Homélie supprimée." });
      fetchHomilies();
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'homélie.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      priest_name: "",
      description: "",
      homily_date: new Date().toISOString().split("T")[0],
      image_url: "",
      video_url: "",
      transcript: "",
      duration_minutes: "",
    });
    setImageFile(null);
    setImagePreview(null);
    setVideoFile(null);
    setShowForm(false);
    setEditingId(null);
  };

  const filteredHomilies = useMemo(() => {
    return homilies.filter(
      (h) =>
        h.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.priest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (h.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [homilies, searchTerm]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeroBanner
        title="Homélies"
        subtitle="Enregistrements et transcriptions des homélies"
        showBackButton={true}
        backgroundImage={hero?.image_url || "/images/church.png"}
        onBgSave={saveHero}
      />

      <main className="flex-1 py-12 lg:py-16">
        <div className="container mx-auto px-4 space-y-8">
          {/* Search & Admin Actions */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher une homélie..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {isAdmin && (
                <Button
                  onClick={() => (showForm ? resetForm() : setShowForm(true))}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {showForm ? "Annuler" : "Nouvelle homélie"}
                </Button>
              )}
            </div>

            {/* Admin Form */}
            {isAdmin && showForm && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-border rounded-lg p-6 bg-card space-y-4"
              >
                <h3 className="text-lg font-semibold">
                  {editingId ? "Modifier l'homélie" : "Créer une homélie"}
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Titre de l'homélie"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                  <Input
                    placeholder="Nom du prêtre"
                    value={formData.priest_name}
                    onChange={(e) => setFormData({ ...formData, priest_name: e.target.value })}
                  />
                </div>

                <textarea
                  placeholder="Description (résumé de l'homélie)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-border rounded-lg p-2 min-h-20 focus:outline-none focus:ring-2 focus:ring-primary"
                />

                <textarea
                  placeholder="Transcription (texte complet de l'homélie)"
                  value={formData.transcript}
                  onChange={(e) => setFormData({ ...formData, transcript: e.target.value })}
                  className="w-full border border-border rounded-lg p-2 min-h-24 focus:outline-none focus:ring-2 focus:ring-primary"
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Date de l'homélie"
                    type="date"
                    value={formData.homily_date}
                    onChange={(e) => setFormData({ ...formData, homily_date: e.target.value })}
                  />
                  <Input
                    placeholder="Durée (minutes)"
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">Image de couverture</label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors">
                    <label className="block cursor-pointer">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm">Cliquez pour uploader une image</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Aperçu"
                        className="mt-3 max-h-32 mx-auto rounded"
                      />
                    )}
                  </div>
                </div>

                {/* Video Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">Vidéo de l'homélie</label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors">
                    <label className="block cursor-pointer">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm">Cliquez pour uploader une vidéo</span>
                      </div>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoChange}
                        className="hidden"
                      />
                    </label>
                    {videoFile && (
                      <p className="mt-2 text-sm text-green-600">✓ {videoFile.name}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleSave} className="flex-1">
                    Sauvegarder
                  </Button>
                  <Button onClick={resetForm} variant="outline" className="flex-1">
                    Annuler
                  </Button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Homilies Grid */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Chargement des homélies...</p>
            </div>
          ) : filteredHomilies.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchTerm ? "Aucune homélie trouvée." : "Aucune homélie pour le moment."}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHomilies.map((homily, idx) => (
                <motion.div
                  key={homily.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
                >
                  {/* Image */}
                  <div className="h-48 overflow-hidden bg-muted relative group">
                    {homily.image_url ? (
                      <img
                        src={homily.image_url}
                        alt={homily.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                        <span className="text-4xl">🙏</span>
                      </div>
                    )}

                    {/* Video Badge */}
                    {homily.video_url && (
                      <a
                        href={homily.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Play className="h-12 w-12 text-white fill-white" />
                      </a>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col">
                    <div>
                      <h3 className="text-lg font-semibold leading-tight mb-1">
                        {homily.title}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {homily.priest_name}
                      </p>
                    </div>

                    {/* Date & Duration */}
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(homily.homily_date), "d MMMM yyyy", { locale: fr })}
                        </span>
                      </div>
                      {homily.duration_minutes && (
                        <span>⏱️ {homily.duration_minutes}min</span>
                      )}
                    </div>

                    {/* Description */}
                    {homily.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {homily.description}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 mt-auto border-t border-border">
                      {homily.video_url && (
                        <a
                          href={homily.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1"
                        >
                          <Button size="sm" variant="outline" className="w-full gap-1">
                            <Play className="h-3 w-3" />
                            Regarder
                          </Button>
                        </a>
                      )}

                      {homily.transcript && (
                        <a
                          href={`data:text/plain;charset=utf-8,${encodeURIComponent(homily.transcript)}`}
                          download={`${homily.title.replace(/\s+/g, "_")}.txt`}
                          className="flex-1"
                        >
                          <Button size="sm" variant="outline" className="w-full gap-1">
                            <Download className="h-3 w-3" />
                            Texte
                          </Button>
                        </a>
                      )}

                      {isAdmin && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setFormData({
                                title: homily.title,
                                priest_name: homily.priest_name,
                                description: homily.description || "",
                                homily_date: homily.homily_date,
                                image_url: homily.image_url || "",
                                video_url: homily.video_url || "",
                                transcript: homily.transcript || "",
                                duration_minutes: homily.duration_minutes?.toString() || "",
                              });
                              setEditingId(homily.id);
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
                            onClick={() => handleDelete(homily.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HomilyPage;
