import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Download, Filter, TrendingUp, Heart, Calendar, Mail } from "lucide-react";
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

interface Donation {
  id: string;
  user_id?: string;
  is_anonymous: boolean;
  donor_name?: string;
  donor_email?: string;
  type: string;
  amount_currency?: string;
  amount_value?: number;
  description?: string;
  quantity?: string;
  donation_date: string;
  location: string;
  purpose?: string;
  metadata?: any;
  notes?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

const DonationsHistoryPage = () => {
  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);
  const { profile } = useUser();
  const { toast } = useToast();

  const [allDonations, setAllDonations] = useState<Donation[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterYear, setFilterYear] = useState("all");

  const isAdmin = !!(
    profile?.role &&
    ["admin", "super_admin", "administrateur"].includes(String(profile.role).toLowerCase())
  );

  // Fetch donations
  useEffect(() => {
    fetchDonations();
  }, [profile?.id]);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      // RLS policies handle filtering by user_id; no need to manually filter
      const query = (supabase as any).from("donations").select("*");
      const { data, error } = await query.order("donation_date", { ascending: false });

      if (error) throw error;
      const mappedData = (data || []).map((d: any) => ({
        ...d,
        user_id: d.user_id ?? d.donor_id,
        // compatibility: map purpose -> location, metadata.quantity -> quantity
        location: d.purpose ?? d.location ?? "",
        quantity: d.metadata?.quantity ?? d.quantity ?? undefined,
        purpose: d.purpose ?? undefined,
        metadata: d.metadata ?? undefined,
      }));
      setAllDonations(mappedData);
      setDonations(mappedData);
    } catch (err) {
      console.error("Erreur lors du chargement de l'historique:", err);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'historique des dons.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter donations
  useEffect(() => {
    let filtered = allDonations;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (d) =>
          (d.donor_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (d.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter((d) => d.type === filterType);
    }

    // Year filter
    if (filterYear !== "all") {
      filtered = filtered.filter(
        (d) => new Date(d.donation_date).getFullYear().toString() === filterYear
      );
    }

    setDonations(filtered);
  }, [searchTerm, filterType, filterYear, allDonations]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalDonations = donations.length;
    const totalAmount = donations
      .filter((d) => d.amount_value)
      .reduce((sum, d) => sum + (d.amount_value || 0), 0);
    const averageAmount =
      totalDonations > 0 ? totalAmount / donations.filter((d) => d.amount_value).length : 0;

    return { totalDonations, totalAmount, averageAmount };
  }, [donations]);

  const donationTypes: Record<string, { label: string; color: string; icon: string }> = {
    especes: { label: "Espèces", color: "bg-green-500/10 text-green-700", icon: "💵" },
    alimentaire: {
      label: "Denrée alimentaire",
      color: "bg-orange-500/10 text-orange-700",
      icon: "🥫",
    },
    vestimentaire: { label: "Vêtements", color: "bg-blue-500/10 text-blue-700", icon: "👕" },
    materiel: { label: "Matériel", color: "bg-purple-500/10 text-purple-700", icon: "🔧" },
    services: { label: "Services", color: "bg-indigo-500/10 text-indigo-700", icon: "🤝" },
    autre: { label: "Autre", color: "bg-gray-500/10 text-gray-700", icon: "📦" },
  };

  const getTypeLabel = (type: string) => {
    return donationTypes[type]?.label || type;
  };

  const getTypeColor = (type: string) => {
    return donationTypes[type]?.color || "bg-gray-500/10 text-gray-700";
  };

  const years = Array.from(
    new Set(allDonations.map((d) => new Date(d.donation_date).getFullYear()))
  ).sort((a, b) => b - a);

  const handleExportCSV = () => {
    const headers = [
      "Date",
      "Type",
      "Montant",
      "Devise",
      "Donateur",
      "Email",
      "Description",
      "Lieu",
    ];
    const rows = donations.map((d) => [
      format(new Date(d.donation_date), "dd/MM/yyyy"),
      getTypeLabel(d.type),
      d.amount_value || "",
      d.amount_currency || "",
      d.is_anonymous ? "Anonyme" : d.donor_name || "",
      d.donor_email || "",
      d.description || "",
      d.location || "",
    ]);

    const csv =
      [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n") +
      "\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `historique_dons_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeroBanner
        title="Historique des dons"
        subtitle="Vos donations et historique"
        showBackButton={true}
        backgroundImage={hero?.image_url || "/images/bapteme.png"}
        onBgSave={saveHero}
      />

      <main className="flex-1 py-12 lg:py-16">
        <div className="container mx-auto px-4 space-y-8">
          {/* Statistics Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-3 gap-4"
          >
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total donné</p>
                  <p className="text-3xl font-bold text-green-700">
                      {stats.totalAmount.toFixed(0)} FCFA
                  </p>
                </div>
                <TrendingUp className="h-12 w-12 text-green-500/50" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Nombre de dons</p>
                  <p className="text-3xl font-bold text-blue-700">{stats.totalDonations}</p>
                </div>
                <Heart className="h-12 w-12 text-blue-500/50" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Moyenne par don</p>
                  <p className="text-3xl font-bold text-purple-700">
                      {stats.averageAmount.toFixed(0)} FCFA
                  </p>
                </div>
                <Filter className="h-12 w-12 text-purple-500/50" />
              </div>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4 bg-card border border-border rounded-lg p-6"
          >
            <h3 className="text-lg font-semibold mb-4">Filtres</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Type Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Tous les types</option>
                {Object.entries(donationTypes).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>

              {/* Year Filter */}
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="px-4 py-2 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Toutes les années</option>
                {years.map((year) => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Export Button */}
            <div className="pt-2">
              <Button onClick={handleExportCSV} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Exporter en CSV
              </Button>
            </div>
          </motion.div>

          {/* Donations List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold">
              {donations.length} don{donations.length !== 1 ? "s" : ""} trouvé
              {donations.length !== 1 ? "s" : ""}
            </h3>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Chargement de l'historique...</p>
              </div>
            ) : donations.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-lg">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">
                  {searchTerm || filterType !== "all" || filterYear !== "all"
                    ? "Aucun don ne correspond à vos critères."
                    : "Aucun don enregistré."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {donations.map((donation, idx) => (
                  <motion.div
                    key={donation.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05 }}
                    className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-semibold px-2 py-1 rounded ${getTypeColor(donation.type)}`}>
                            {getTypeLabel(donation.type)}
                          </span>
                          {donation.is_verified && (
                            <span className="text-xs bg-green-500/20 text-green-700 px-2 py-1 rounded font-medium">
                              ✓ Vérifié
                            </span>
                          )}
                        </div>

                        {donation.amount_value && (
                          <p className="text-2xl font-bold text-green-600 mb-1">
                            {donation.amount_value.toFixed(2)} {donation.amount_currency}
                          </p>
                        )}

                        {donation.quantity && (
                          <p className="text-sm text-muted-foreground">
                            Quantité: <span className="font-medium">{donation.quantity}</span>
                          </p>
                        )}
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-semibold">
                          {format(new Date(donation.donation_date), "d MMM yyyy", { locale: fr })}
                        </p>
                        <p className="text-sm text-muted-foreground">{donation.location}</p>
                      </div>
                    </div>

                    {/* Description */}
                    {donation.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {donation.description}
                      </p>
                    )}

                    {/* Donor Info */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t border-border/50">
                      {!donation.is_anonymous && (
                        <>
                          {donation.donor_name && (
                            <span className="font-medium">{donation.donor_name}</span>
                          )}
                          {donation.donor_email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span>{donation.donor_email}</span>
                            </div>
                          )}
                        </>
                      )}
                      {donation.is_anonymous && <span className="italic">Donateur anonyme</span>}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default DonationsHistoryPage;
