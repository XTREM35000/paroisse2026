import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Edit2, Trash2, Upload, ChevronLeft, Target, Calendar } from "lucide-react";
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

interface Campaign {
  id: string;
  title: string;
  description: string;
  goal_amount: number;
  raised_amount?: number;
  image_url?: string | null;
  status: "active" | "completed" | "paused";
  start_date: string;
  end_date?: string | null;
  created_at: string;
}

const CampaignsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);
  const { profile } = useUser();
  const { toast } = useToast();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    goal_amount: "",
    image_url: "",
    status: "active" as const,
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
  });

  const isAdmin = !!(
    profile?.role &&
    ["admin", "super_admin", "administrateur"].includes(String(profile.role).toLowerCase())
  );

  // Fetch campaigns
  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("campaigns")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (err) {
      console.error("Erreur lors du chargement des campagnes:", err);
      toast({
        title: "Erreur",
        description: "Impossible de charger les campagnes.",
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
    if (!formData.title || !formData.goal_amount) {
      toast({
        title: "Erreur",
        description: "Titre et montant cible sont obligatoires.",
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
        const filePath = `campaigns/${fileName}`;
        const bucket = import.meta.env.VITE_BUCKET_GALLERY || "gallery";

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, imageFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        imageUrl = data?.publicUrl || formData.image_url;
      }

      const campaignData = {
        title: formData.title,
        description: formData.description,
        goal_amount: parseFloat(formData.goal_amount),
        image_url: imageUrl || null,
        status: formData.status,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
      };

      if (editingId) {
        const { error } = await (supabase as any)
          .from("campaigns")
          .update(campaignData)
          .eq("id", editingId);

        if (error) throw error;
        toast({ title: "Succès", description: "Campagne mise à jour." });
      } else {
        const { error } = await (supabase as any)
          .from("campaigns")
          .insert([campaignData]);

        if (error) throw error;
        toast({ title: "Succès", description: "Campagne créée." });
      }

      fetchCampaigns();
      resetForm();
    } catch (err) {
      console.error("Erreur:", err);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la campagne.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr ?")) return;

    try {
      const { error } = await (supabase as any)
        .from("campaigns")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Succès", description: "Campagne supprimée." });
      fetchCampaigns();
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la campagne.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      goal_amount: "",
      image_url: "",
      status: "active",
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
    });
    setImageFile(null);
    setImagePreview(null);
    setShowForm(false);
    setEditingId(null);
  };

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(
      (c) =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [campaigns, searchTerm]);

  const getProgressPercentage = (campaign: Campaign) => {
    const raised = campaign.raised_amount || 0;
    return Math.min((raised / campaign.goal_amount) * 100, 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-700";
      case "completed":
        return "bg-blue-500/10 text-blue-700";
      case "paused":
        return "bg-yellow-500/10 text-yellow-700";
      default:
        return "bg-gray-500/10 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Actif";
      case "completed":
        return "Terminé";
      case "paused":
        return "En pause";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeroBanner
        title="Campagnes de financement"
        subtitle="Projets et collectes de la paroisse"
        showBackButton={true}
        backgroundImage={hero?.image_url || "/images/bapteme.png"}
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
                  placeholder="Rechercher une campagne..."
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
                  {showForm ? "Annuler" : "Nouvelle campagne"}
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
                  {editingId ? "Modifier la campagne" : "Créer une campagne"}
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Titre"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                  <Input
                    placeholder="Montant cible (€)"
                    type="number"
                    value={formData.goal_amount}
                    onChange={(e) => setFormData({ ...formData, goal_amount: e.target.value })}
                  />
                </div>

                <textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-border rounded-lg p-2 min-h-20 focus:outline-none focus:ring-2 focus:ring-primary"
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Date de début"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                  <Input
                    placeholder="Date de fin"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Statut</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as any })
                    }
                    className="w-full border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="active">Actif</option>
                    <option value="paused">En pause</option>
                    <option value="completed">Terminé</option>
                  </select>
                </div>

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

          {/* Campaigns Grid */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Chargement des campagnes...</p>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchTerm ? "Aucune campagne trouvée." : "Aucune campagne pour le moment."}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((campaign, idx) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Image */}
                  {campaign.image_url && (
                    <div className="h-40 overflow-hidden">
                      <img
                        src={campaign.image_url}
                        alt={campaign.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-semibold leading-tight flex-1">
                        {campaign.title}
                      </h3>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ${getStatusColor(
                          campaign.status
                        )}`}
                      >
                        {getStatusLabel(campaign.status)}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {campaign.description}
                    </p>

                    {/* Progress */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium">
                          {campaign.raised_amount || 0}€ / {campaign.goal_amount}€
                        </span>
                        <span className="text-muted-foreground">
                          {Math.round(getProgressPercentage(campaign))}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-full rounded-full transition-all"
                          style={{ width: `${getProgressPercentage(campaign)}%` }}
                        />
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(campaign.start_date), "d MMM", { locale: fr })}
                        </span>
                      </div>
                      {campaign.end_date && (
                        <div className="flex items-center gap-1">
                          <span>→</span>
                          <span>
                            {format(new Date(campaign.end_date), "d MMM", { locale: fr })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Admin Actions */}
                    {isAdmin && (
                      <div className="flex gap-2 pt-3 border-t border-border">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-1"
                          onClick={() => {
                            setFormData({
                              title: campaign.title,
                              description: campaign.description,
                              goal_amount: campaign.goal_amount.toString(),
                              image_url: campaign.image_url || "",
                              status: campaign.status,
                              start_date: campaign.start_date,
                              end_date: campaign.end_date || "",
                            });
                            setEditingId(campaign.id);
                            setShowForm(true);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                          Modifier
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1 gap-1"
                          onClick={() => handleDelete(campaign.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                          Supprimer
                        </Button>
                      </div>
                    )}
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

export default CampaignsPage;
