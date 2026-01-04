import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Calendar, MapPin, Trash2, Edit2, CheckCircle, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import HeroBanner from "@/components/HeroBanner";
import { useLocation } from "react-router-dom";
import usePageHero from "@/hooks/usePageHero";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useDonations, Donation } from "@/hooks/useDonations";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const DONATION_TYPES = {
  especes: { label: "Espèces", color: "bg-green-500/10 text-green-700", icon: "💵" },
  alimentaire: { label: "Denrée alimentaire", color: "bg-orange-500/10 text-orange-700", icon: "🥫" },
  vestimentaire: { label: "Vêtements", color: "bg-blue-500/10 text-blue-700", icon: "👕" },
  materiel: { label: "Matériel", color: "bg-purple-500/10 text-purple-700", icon: "🔧" },
  services: { label: "Services", color: "bg-indigo-500/10 text-indigo-700", icon: "🤝" },
  autre: { label: "Autre", color: "bg-gray-500/10 text-gray-700", icon: "📦" },
};

const DonatePage = () => {
  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);
  const { profile } = useUser();
  const { toast } = useToast();
  const { donations, loading, fetchDonations, createDonation, deleteDonation } = useDonations();

  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: "especes" as keyof typeof DONATION_TYPES,
    amount_value: "",
    amount_currency: "EUR",
    quantity: "",
    description: "",
    donation_date: new Date().toISOString().split("T")[0],
    location: "",
    donor_name: "",
    donor_email: "",
    donor_phone: "",
    is_anonymous: false,
    notes: "",
  });

  const isAdmin = !!(
    profile &&
    profile.role &&
    ["admin", "super_admin", "administrateur"].includes(String(profile.role).toLowerCase())
  );

  useEffect(() => {
    fetchDonations(profile?.id ? { userId: profile.id } : undefined);
  }, [profile?.id]);

  const filteredDonations = useMemo(() => {
    return donations.filter(
      (don) =>
        don.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        don.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (don.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [donations, searchTerm]);

  const handleSave = async () => {
    if (!formData.donation_date || !formData.location) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir la date et le lieu.",
        variant: "destructive",
      });
      return;
    }

    const donationData: any = {
      type: formData.type,
      donation_date: formData.donation_date,
      location: formData.location,
      description: formData.description || null,
      quantity: formData.quantity || null,
      notes: formData.notes || null,
      is_anonymous: formData.is_anonymous,
      donor_name: formData.is_anonymous ? null : formData.donor_name || null,
      donor_email: formData.donor_email || null,
      donor_phone: formData.donor_phone || null,
      donor_id: profile?.id || null,
    };

    if (formData.type === "especes" && formData.amount_value) {
      donationData.amount_value = parseFloat(formData.amount_value as string);
      donationData.amount_currency = formData.amount_currency;
    }

    const success = await createDonation(donationData);
    if (success) {
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      type: "especes",
      amount_value: "",
      amount_currency: "EUR",
      quantity: "",
      description: "",
      donation_date: new Date().toISOString().split("T")[0],
      location: "",
      donor_name: "",
      donor_email: "",
      donor_phone: "",
      is_anonymous: false,
      notes: "",
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce don ?")) return;
    await deleteDonation(id);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeroBanner
        title="Faire un Don"
        subtitle="Soutenez la paroisse et nos actions communautaires"
        showBackButton={true}
        backgroundImage={hero?.image_url || "/images/donate.png"}
        onBgSave={saveHero}
      />

      <div className="container mx-auto px-4 py-12">
        {/* Form Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20"
        >
          {!showForm ? (
            <Button
              onClick={() => setShowForm(true)}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              + Faire un don
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Type de don */}
                <div>
                  <label className="block text-sm font-medium mb-2">Type de don *</label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as keyof typeof DONATION_TYPES,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {Object.entries(DONATION_TYPES).map(([key, { label }]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Montant (si espèces) */}
                {formData.type === "especes" && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Montant</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Montant"
                        value={formData.amount_value}
                        onChange={(e) =>
                          setFormData({ ...formData, amount_value: e.target.value })
                        }
                        className="flex-1 px-4 py-2 rounded-lg bg-background border border-input text-foreground"
                      />
                      <select
                        value={formData.amount_currency}
                        onChange={(e) =>
                          setFormData({ ...formData, amount_currency: e.target.value })
                        }
                        className="px-3 py-2 rounded-lg bg-background border border-input text-foreground"
                      >
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                        <option value="GBP">GBP</option>
                        <option value="FCFA">FCFA</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Quantité (si pas espèces) */}
                {formData.type !== "especes" && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Quantité</label>
                    <input
                      type="text"
                      placeholder="Ex: 10 kg, 5 vêtements..."
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded-lg bg-background border border-input text-foreground"
                    />
                  </div>
                )}

                {/* Date du don */}
                <div>
                  <label className="block text-sm font-medium mb-2">Date du don *</label>
                  <input
                    type="date"
                    value={formData.donation_date}
                    onChange={(e) =>
                      setFormData({ ...formData, donation_date: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg bg-background border border-input text-foreground"
                  />
                </div>

                {/* Lieu */}
                <div>
                  <label className="block text-sm font-medium mb-2">Lieu *</label>
                  <input
                    type="text"
                    placeholder="Lieu de livraison/dépôt"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg bg-background border border-input text-foreground"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    placeholder="Décrivez votre don..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={2}
                    className="w-full px-4 py-2 rounded-lg bg-background border border-input text-foreground"
                  />
                </div>

                {/* Anonyme */}
                <div className="flex items-center gap-2 md:col-span-2">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={formData.is_anonymous}
                    onChange={(e) =>
                      setFormData({ ...formData, is_anonymous: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                  <label htmlFor="anonymous" className="text-sm font-medium cursor-pointer">
                    Rester anonyme
                  </label>
                </div>

                {/* Données donateur (si non anonyme) */}
                {!formData.is_anonymous && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Nom</label>
                      <input
                        type="text"
                        placeholder="Votre nom"
                        value={formData.donor_name}
                        onChange={(e) =>
                          setFormData({ ...formData, donor_name: e.target.value })
                        }
                        className="w-full px-4 py-2 rounded-lg bg-background border border-input text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <input
                        type="email"
                        placeholder="Votre email"
                        value={formData.donor_email}
                        onChange={(e) =>
                          setFormData({ ...formData, donor_email: e.target.value })
                        }
                        className="w-full px-4 py-2 rounded-lg bg-background border border-input text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Téléphone</label>
                      <input
                        type="tel"
                        placeholder="Votre téléphone"
                        value={formData.donor_phone}
                        onChange={(e) =>
                          setFormData({ ...formData, donor_phone: e.target.value })
                        }
                        className="w-full px-4 py-2 rounded-lg bg-background border border-input text-foreground"
                      />
                    </div>
                  </>
                )}

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Notes internes</label>
                  <textarea
                    placeholder="Informations supplémentaires..."
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={2}
                    className="w-full px-4 py-2 rounded-lg bg-background border border-input text-foreground"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSave}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Enregistrer le don
                </Button>
                <Button onClick={resetForm} variant="outline" className="flex-1">
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher un don..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
        </motion.div>

        {/* Donations List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Chargement des dons...</p>
          </div>
        ) : filteredDonations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground text-lg">
              {searchTerm
                ? "Aucun don ne correspond à votre recherche."
                : "Aucun don pour le moment."}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {filteredDonations.map((donation, index) => {
              const typeInfo = DONATION_TYPES[donation.type];
              return (
                <motion.div
                  key={donation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative overflow-hidden rounded-lg border border-border bg-card shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative p-6">
                    {/* Type Badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${typeInfo.color}`}>
                        <span>{typeInfo.icon}</span>
                        <span>{typeInfo.label}</span>
                      </div>
                      {donation.is_verified && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>

                    {/* Donor info */}
                    <p className="text-sm font-medium text-foreground mb-2">
                      {donation.is_anonymous
                        ? "Donateur anonyme"
                        : donation.donor_name || "Non spécifié"}
                    </p>

                    {/* Amount or Quantity */}
                    {donation.amount_value && (
                      <p className="text-lg font-bold text-green-600 mb-2">
                        {donation.amount_value.toFixed(2)} {donation.amount_currency}
                      </p>
                    )}
                    {donation.quantity && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Quantité: <span className="font-medium">{donation.quantity}</span>
                      </p>
                    )}

                    {/* Description */}
                    {donation.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {donation.description}
                      </p>
                    )}

                    {/* Location & Date */}
                    <div className="space-y-2 mb-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{donation.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(donation.donation_date), "d MMMM yyyy", {
                            locale: fr,
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Verification Status */}
                    <div className="flex items-center gap-2 text-xs font-medium mb-4 p-2 rounded bg-background/50">
                      {donation.is_verified ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-green-600">Vérifié</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4 text-yellow-600" />
                          <span className="text-yellow-600">En attente</span>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    {(isAdmin || profile?.id === donation.user_id) && (
                      <div className="flex gap-2 pt-4 border-t border-border/50">
                        {profile?.id === donation.user_id && (
                          <Button
                            onClick={() => setEditingId(donation.id)}
                            variant="ghost"
                            size="sm"
                            className="flex-1 text-blue-600 hover:bg-blue-500/10"
                          >
                            <Edit2 className="h-4 w-4 mr-1" />
                            Éditer
                          </Button>
                        )}
                        {isAdmin && (
                          <Button
                            onClick={() => handleDelete(donation.id)}
                            variant="ghost"
                            size="sm"
                            className="flex-1 text-red-600 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Supprimer
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DonatePage;
