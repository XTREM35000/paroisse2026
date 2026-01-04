import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, Upload, Calendar, BookOpen } from "lucide-react";
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

interface Verse {
  id: string;
  book: string;
  chapter: number;
  verse_start: number;
  verse_end?: number;
  text: string;
  commentary?: string;
  image_url?: string | null;
  featured_date: string;
  created_at: string;
  updated_at: string;
}

const VersePage = () => {
  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);
  const { profile } = useUser();
  const { toast } = useToast();

  const [verses, setVerses] = useState<Verse[]>([]);
  const [todayVerse, setTodayVerse] = useState<Verse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    book: "",
    chapter: "",
    verse_start: "",
    verse_end: "",
    text: "",
    commentary: "",
    image_url: "",
    featured_date: new Date().toISOString().split("T")[0],
  });

  const isAdmin = !!(
    profile?.role &&
    ["admin", "super_admin", "administrateur"].includes(String(profile.role).toLowerCase())
  );

  // Fetch verses
  useEffect(() => {
    fetchVerses();
  }, []);

  const fetchVerses = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("daily_verses")
        .select("*")
        .order("featured_date", { ascending: false });

      if (error) throw error;
      setVerses(data || []);

      // Find today's verse
      const today = new Date().toISOString().split("T")[0];
      const today_verse = data?.find((v: Verse) => v.featured_date === today);
      setTodayVerse(today_verse || null);
    } catch (err) {
      console.error("Erreur lors du chargement des versets:", err);
      toast({
        title: "Erreur",
        description: "Impossible de charger les versets.",
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

  const handleSave = async () => {
    if (!formData.book || !formData.chapter || !formData.verse_start || !formData.text) {
      toast({
        title: "Erreur",
        description: "Livre, chapitre, verset et texte sont obligatoires.",
        variant: "destructive",
      });
      return;
    }

    try {
      let imageUrl = formData.image_url;

      // Upload image if selected
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `verses/${fileName}`;
        const bucket = import.meta.env.VITE_BUCKET_GALLERY || "gallery";

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, imageFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        imageUrl = data?.publicUrl || formData.image_url;
      }

      const verseData = {
        book: formData.book,
        chapter: parseInt(formData.chapter),
        verse_start: parseInt(formData.verse_start),
        verse_end: formData.verse_end ? parseInt(formData.verse_end) : null,
        text: formData.text,
        commentary: formData.commentary || null,
        image_url: imageUrl || null,
        featured_date: formData.featured_date,
      };

      if (editingId) {
        const { error } = await (supabase as any)
          .from("daily_verses")
          .update(verseData)
          .eq("id", editingId);

        if (error) throw error;
        toast({ title: "Succès", description: "Verset mis à jour." });
      } else {
        const { error } = await (supabase as any)
          .from("daily_verses")
          .insert([verseData]);

        if (error) throw error;
        toast({ title: "Succès", description: "Verset créé." });
      }

      fetchVerses();
      resetForm();
    } catch (err) {
      console.error("Erreur:", err);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le verset.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr ?")) return;

    try {
      const { error } = await (supabase as any)
        .from("daily_verses")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Succès", description: "Verset supprimé." });
      fetchVerses();
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le verset.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      book: "",
      chapter: "",
      verse_start: "",
      verse_end: "",
      text: "",
      commentary: "",
      image_url: "",
      featured_date: new Date().toISOString().split("T")[0],
    });
    setImageFile(null);
    setImagePreview(null);
    setShowForm(false);
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeroBanner
        title="Verset du jour"
        subtitle="Un verset pour aujourd'hui"
        showBackButton={true}
        backgroundImage={hero?.image_url || "/images/bible.png"}
        onBgSave={saveHero}
      />

      <main className="flex-1 py-12 lg:py-16">
        <div className="container mx-auto px-4 space-y-12">
          {/* Today's Verse */}
          {todayVerse && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden rounded-xl"
            >
              {todayVerse.image_url && (
                <div className="absolute inset-0 z-0">
                  <img
                    src={todayVerse.image_url}
                    alt="Fond"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60" />
                </div>
              )}

              <div className="relative z-10 p-8 md:p-12 text-white">
                <p className="text-sm font-medium text-blue-200 mb-2">🙏 Verset du jour</p>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 italic">
                  "{todayVerse.text}"
                </h2>
                <p className="text-lg text-blue-100 font-semibold mb-6">
                  {todayVerse.book} {todayVerse.chapter}:{todayVerse.verse_start}
                  {todayVerse.verse_end && `-${todayVerse.verse_end}`}
                </p>

                {todayVerse.commentary && (
                  <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                    <p className="text-blue-50 leading-relaxed">{todayVerse.commentary}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Admin Section */}
          {isAdmin && (
            <div className="space-y-4">
              <Button
                onClick={() => (showForm ? resetForm() : setShowForm(true))}
                className="gap-2"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
                {showForm ? "Annuler" : "Ajouter un verset"}
              </Button>

              {/* Form */}
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-border rounded-lg p-6 bg-card space-y-4"
                >
                  <h3 className="text-lg font-semibold">
                    {editingId ? "Modifier le verset" : "Créer un verset"}
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Livre biblique"
                      value={formData.book}
                      onChange={(e) => setFormData({ ...formData, book: e.target.value })}
                    />
                    <Input
                      placeholder="Chapitre"
                      type="number"
                      value={formData.chapter}
                      onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Verset début"
                      type="number"
                      value={formData.verse_start}
                      onChange={(e) =>
                        setFormData({ ...formData, verse_start: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Verset fin (optionnel)"
                      type="number"
                      value={formData.verse_end}
                      onChange={(e) => setFormData({ ...formData, verse_end: e.target.value })}
                    />
                  </div>

                  <textarea
                    placeholder="Texte du verset"
                    value={formData.text}
                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                    rows={3}
                    className="w-full border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />

                  <textarea
                    placeholder="Commentaire (optionnel)"
                    value={formData.commentary}
                    onChange={(e) => setFormData({ ...formData, commentary: e.target.value })}
                    rows={2}
                    className="w-full border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />

                  <Input
                    placeholder="Date à afficher"
                    type="date"
                    value={formData.featured_date}
                    onChange={(e) =>
                      setFormData({ ...formData, featured_date: e.target.value })
                    }
                  />

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Image de fond</label>
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
          )}

          {/* All Verses */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Tous les versets</h3>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Chargement des versets...</p>
              </div>
            ) : verses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Aucun verset pour le moment.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {verses.map((verse, idx) => (
                  <motion.div
                    key={verse.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05 }}
                    className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <p className="font-bold text-lg">
                          {verse.book} {verse.chapter}:{verse.verse_start}
                          {verse.verse_end && `-${verse.verse_end}`}
                        </p>
                        <p className="text-sm text-muted-foreground italic">
                          "{verse.text.substring(0, 100)}..."
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {format(new Date(verse.featured_date), "d MMM", { locale: fr })}
                      </span>
                    </div>

                    {isAdmin && (
                      <div className="flex gap-2 pt-2 border-t border-border/50">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setFormData({
                              book: verse.book,
                              chapter: verse.chapter.toString(),
                              verse_start: verse.verse_start.toString(),
                              verse_end: verse.verse_end?.toString() || "",
                              text: verse.text,
                              commentary: verse.commentary || "",
                              image_url: verse.image_url || "",
                              featured_date: verse.featured_date,
                            });
                            setEditingId(verse.id);
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
                          onClick={() => handleDelete(verse.id)}
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
        </div>
      </main>
    </div>
  );
};

export default VersePage;
