/**
 * Page Donate - Plateforme de dons refactorisée
 * Sections: 1) Public (nouveau système) 2) Admin (legacy)
 */
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Calendar, MapPin, Trash2, Edit2, CheckCircle, Clock, Printer, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import DonationHero from "@/components/donations/DonationHero";
import PaymentMethodSelector from "@/components/donations/PaymentMethodSelector";
import DonationModal, { DonationFormData } from "@/components/donations/DonationModal";
import { useLocation } from "react-router-dom";
import usePageHero from "@/hooks/usePageHero";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/hooks/use-toast";
import { useDonations, Donation } from "@/hooks/useDonations";
import useRoleCheck from "@/hooks/useRoleCheck";
import { useDonationMethods } from "@/hooks/useDonationMethods";
import { useCreateDonation } from "@/hooks/useCreateDonation";
import { useGenerateReceipt } from "@/hooks/useGenerateReceipt";
import { supabase } from '@/integrations/supabase/client';
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Types de don legacy
const DONATION_TYPES = {
  especes: { label: "Espèces", color: "bg-green-500/10 text-green-700", icon: "💵" },
  alimentaire: { label: "Denrée alimentaire", color: "bg-orange-500/10 text-orange-700", icon: "🥫" },
  vestimentaire: { label: "Vêtements", color: "bg-blue-500/10 text-blue-700", icon: "👕" },
  materiel: { label: "Matériel", color: "bg-purple-500/10 text-purple-700", icon: "🔧" },
  services: { label: "Services", color: "bg-indigo-500/10 text-indigo-700", icon: "🤝" },
  autre: { label: "Autre", color: "bg-gray-500/10 text-gray-700", icon: "📦" },
};

const DonatePage = () => {
  const routerLocation = useLocation();
  const { data: hero } = usePageHero(routerLocation.pathname);
  const { profile } = useUser();
  const { toast } = useToast();
  const { donations, loading, fetchDonations, createDonation, deleteDonation } = useDonations();

  // === NOUVEAU SYSTÈME (PUBLIC) ===
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Array<{ id: string; title: string }>>([]);
  const [processingPayment, setProcessingPayment] = useState(false);

  const { methods: paymentMethods, loading: methodsLoading } = useDonationMethods();
  const { createDonation: createNewDonation, loading: createLoading } = useCreateDonation();
  const { generateReceipt } = useGenerateReceipt();

  // === ADMIN (LEGACY) ===
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });
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
    is_anonymous: false,
    notes: "",
  });

  const isAdmin = !!(
    profile?.role &&
    ["admin", "super_admin", "administrateur"].includes(String(profile.role).toLowerCase())
  );

  // Show admin panel only when explicit query param `admin=1` is present.
  // This prevents admins from seeing the legacy admin modal by default on /donate.
  const query = new URLSearchParams(routerLocation.search);
  const showAdminPanel = query.get("admin") === "1" || query.get("admin") === "true";

  // Init
  useEffect(() => {
    const init = async () => {
      try {
        await fetchDonations();
      } catch (e) {
        console.error("Donations error:", e);
      }

      // Try to load campaigns from DB if the table exists; fall back to empty array.
      try {
        // cast table name to any to avoid strict generated types if the table isn't in types
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await supabase.from(("campaigns") as any).select("id, title").eq("status", "active");
        // cast via unknown to satisfy TypeScript when generated types don't include 'campaigns'
        const campaignsData = (data as unknown) as Array<{ id: string; title: string }>;
        setCampaigns(campaignsData || []);
      } catch (e) {
        // fallback: no campaigns available
        setCampaigns([]);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredDonations = useMemo(
    () =>
      donations.filter((d) => {
        const matchSearch =
          !searchTerm ||
          d.donor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const dDate = new Date(d.donation_date);
        const matchDate =
          (!dateRange.from || dDate >= dateRange.from) &&
          (!dateRange.to || dDate <= dateRange.to);
        return matchSearch && matchDate;
      }),
    [donations, searchTerm, dateRange]
  );

  // === HANDLERS ===
  const handleSave = async () => {
    if (!formData.donation_date || !formData.location) {
      toast({ title: "Erreur", description: "Date et lieu requis", variant: "destructive" });
      return;
    }
    try {
      await createDonation({
        type: formData.type,
        amount_value: formData.type === "especes" ? parseFloat(formData.amount_value) : null,
        amount_currency: formData.amount_currency,
        description: formData.description || null,
        donation_date: formData.donation_date,
        purpose: formData.location,
        donor_name: formData.is_anonymous ? null : formData.donor_name,
        donor_email: formData.donor_email || null,
        is_anonymous: formData.is_anonymous,
        notes: formData.notes || null,
      });
      toast({ title: "✓ Succès", description: "Donation enregistrée" });
      resetForm();
    } catch (e) {
      toast({ title: "✗ Erreur", description: "Impossible d'enregistrer", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer ?")) return;
    try {
      await deleteDonation(id);
      toast({ title: "✓ Supprimée", description: "Donation supprimée" });
    } catch (e) {
      toast({ title: "✗ Erreur", variant: "destructive" });
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
      is_anonymous: false,
      notes: "",
    });
    setShowForm(false);
  };

  const handlePrintDonations = () => {
    const toPrint = filteredDonations.length > 0 ? filteredDonations : donations;
    if (toPrint.length === 0) {
      toast({ title: "Aucune donnée", variant: "destructive" });
      return;
    }

    const today = format(new Date(), "d MMMM yyyy", { locale: fr });
    const stats = {
      total: toPrint.length,
      amountTotal: toPrint.reduce((s, d) => s + (d.amount_value || 0), 0),
      verified: toPrint.filter((d) => d.is_verified).length,
    };

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Registre des Dons</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          h1 { color: #059669; border-bottom: 2px solid #059669; padding-bottom: 10px; }
          .stats { background: #f0fdf4; padding: 15px; margin: 20px 0; border-radius: 6px; }
          .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; }
          .stat { text-align: center; background: white; padding: 10px; border-radius: 4px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f0fdf4; padding: 8px; text-align: left; font-weight: bold; border-bottom: 2px solid #059669; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background: #f9fdf7; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>Registre des Dons - ${today}</h1>
        
        <div class="stats">
          <div class="stats-grid">
            <div class="stat">
              <div style="font-size: 24px; font-weight: bold; color: #059669;">${stats.total}</div>
              <div style="font-size: 12px;">Dons</div>
            </div>
            <div class="stat">
              <div style="font-size: 24px; font-weight: bold; color: #059669;">${stats.amountTotal.toFixed(2)}€</div>
              <div style="font-size: 12px;">Total</div>
            </div>
            <div class="stat">
              <div style="font-size: 24px; font-weight: bold; color: #059669;">${stats.verified}</div>
              <div style="font-size: 12px;">Vérifiés</div>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Montant</th>
              <th>Donateur</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${toPrint
              .map(
                (d) => `
              <tr>
                <td>${format(new Date(d.donation_date), "dd/MM/yyyy")}</td>
                <td>${DONATION_TYPES[d.type]?.label || d.type}</td>
                <td>${d.amount_value ? d.amount_value.toFixed(2) + " " + d.amount_currency : "-"}</td>
                <td>${d.is_anonymous ? "Anonyme" : d.donor_name || "-"}</td>
                <td>${d.is_verified ? "✓ Vérifiée" : "En attente"}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="footer">
          <p>Document officiel généré le ${today}</p>
          <p><em>"Donnez avec joie" - 2 Corinthiens 9:7</em></p>
        </div>

        <script>
          setTimeout(() => { window.print(); }, 200);
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // === RENDER ===
  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <DonationHero heroData={hero} />

      <div className="container mx-auto px-4 py-12">
        {/* ========== SECTION PUBLIQUE: NOUVEAU SYSTÈME ========== */}

        {/* Payment Methods */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-green-700">
            Choisissez votre méthode de paiement
          </h2>
          <p className="text-center text-gray-600 mb-12">
            Sélectionnez une méthode pour continuer vers votre don
          </p>

          {methodsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement des méthodes...</div>
          ) : paymentMethods.length === 0 ? (
            <div className="text-center py-8 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-700">
              Aucune méthode de paiement disponible. Veuillez réessayer plus tard.
            </div>
          ) : (
            <PaymentMethodSelector
              methods={paymentMethods}
              selectedMethod={selectedPaymentMethod}
              onSelect={setSelectedPaymentMethod}
              loading={methodsLoading}
            />
          )}
        </motion.section>

        {/* CTA Button - Only show after selection */}
        {selectedPaymentMethod && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }}
            className="text-center mb-16"
          >
            <Button
              onClick={() => setIsDonationModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
              size="lg"
            >
              <Heart className="h-6 w-6 mr-3" />
              Continuer vers le don
            </Button>
          </motion.div>
        )}

        {/* Modal */}
        <DonationModal
          open={isDonationModalOpen}
          onClose={() => setIsDonationModalOpen(false)}
          onSubmit={async (data: DonationFormData) => {
            try {
              setProcessingPayment(true);
              const chosenMethod = data.paymentMethod || selectedPaymentMethod || "card";
              const donation = await createNewDonation({
                amount: parseFloat(data.amount),
                currency: data.currency,
                payment_method: chosenMethod,
                campaign_id: data.campaign,
                payer_name: data.payerName,
                payer_email: data.payerEmail,
                payer_phone: data.payerPhone,
                intention_message: data.intentionMessage,
                is_anonymous: data.isAnonymous || false,
              });

              if (donation) {
                // Receipt generation moved to webhook confirmation handler
                toast({ title: "✓ Donation créée", description: "En attente de confirmation du paiement" });

                if (chosenMethod === "card") {
                  window.location.href = `/donation/checkout/${donation.id}`;
                } else if (chosenMethod === "mobile_money") {
                  window.location.href = `/donation/pending/${donation.id}`;
                }
              }
            } catch (error) {
              console.error(error);
              toast({ title: "✗ Erreur", description: "Impossible de créer", variant: "destructive" });
            } finally {
              setProcessingPayment(false);
            }
          }}
          selectedPaymentMethod={selectedPaymentMethod || "card"}
          campaigns={campaigns}
          loading={createLoading || processingPayment}
        />

        {/* FAQ */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16 py-12 border-t">
          <h3 className="text-3xl font-bold text-center mb-12 text-green-700">Questions fréquentes</h3>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h4 className="font-semibold text-lg mb-2 text-green-600">Donation anonyme ?</h4>
              <p className="text-muted-foreground">Oui, cochez "Anonyme" dans le formulaire.</p>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2 text-green-600">Paiements acceptés ?</h4>
              <p className="text-muted-foreground">Carte (Stripe), Mobile Money, espèces.</p>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2 text-green-600">Reçu ?</h4>
              <p className="text-muted-foreground">Généré automatiquement et envoyé par email.</p>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2 text-green-600">Espèces ?</h4>
              <p className="text-muted-foreground">Versement direct au bureau.</p>
            </div>
          </div>
        </motion.section>

        {/* Admin section moved to /admin/donate to keep public page clean */}
      </div>
    </div>
  );
};

export default DonatePage;
