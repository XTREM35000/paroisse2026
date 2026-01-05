/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Calendar, MapPin, Trash2, Edit2, CheckCircle, Clock, Printer } from "lucide-react";
import { Input } from "@/components/ui/input";
import HeroBanner from "@/components/HeroBanner";
import { useLocation } from "react-router-dom";
import usePageHero from "@/hooks/usePageHero";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useDonations, Donation } from "@/hooks/useDonations";
import { supabase } from "@/integrations/supabase/client";
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

  const [headerConfig, setHeaderConfig] = useState<{
    id: string;
    logo_url: string | null;
    logo_alt_text: string | null;
    main_title: string | null;
    subtitle: string | null;
  } | null>(null);

  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });

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
    is_anonymous: false,
    notes: "",
  });

  const isAdmin = !!(
    profile &&
    profile.role &&
    ["admin", "super_admin", "administrateur"].includes(String(profile.role).toLowerCase())
  );

  useEffect(() => {
    // Charger la configuration du header au montage
    const loadHeaderConfig = async () => {
      try {
        const { data } = await supabase
          .from("header_config")
          .select("id, logo_url, logo_alt_text, main_title, subtitle")
          .eq("is_active", true)
          .order("updated_at", { ascending: false })
          .limit(1)
          .single();
        
        if (data) {
          setHeaderConfig(data);
        }
      } catch (error) {
        console.error("Erreur lors du chargement du header config:", error);
      }
    };
    loadHeaderConfig();
  }, []);

  useEffect(() => {
    // fetchDonations est maintenant appelé au montage du hook useDonations
    // Pas besoin de l'appeler à nouveau ici
  }, []);

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

  // Impression des dons selon période avec design professionnel
  const handlePrintDonations = async () => {
    const donationsToPrint = dateRange.from && dateRange.to
      ? donations.filter(d => {
          const dDate = new Date(d.donation_date);
          return dDate >= dateRange.from! && dDate <= dateRange.to!;
        })
      : donations;

    if (!donationsToPrint || donationsToPrint.length === 0) {
      toast({ 
        title: "Aucune donnée", 
        description: "Aucun don à imprimer pour cette période.", 
        variant: "destructive" 
      });
      return;
    }

    const currentHeaderConfig = headerConfig || {
      id: 'default',
      logo_url: null,
      logo_alt_text: 'Logo Paroisse',
      main_title: 'Paroisse Notre Dame',
      subtitle: 'de la Compassion'
    };

    const today = format(new Date(), "d MMMM yyyy", { locale: fr });
    const fromDate = dateRange.from 
      ? format(dateRange.from, "dd/MM/yyyy", { locale: fr }) 
      : format(new Date(donationsToPrint[donationsToPrint.length-1].donation_date), "dd/MM/yyyy", { locale: fr });
    const toDate = dateRange.to 
      ? format(dateRange.to, "dd/MM/yyyy", { locale: fr }) 
      : format(new Date(donationsToPrint[0].donation_date), "dd/MM/yyyy", { locale: fr });

    // Statistiques
    const stats = {
      total: donationsToPrint.length,
      amountTotal: donationsToPrint.reduce((sum, d) => sum + (d.amount_value || 0), 0),
      types: donationsToPrint.reduce((acc, d) => {
        acc[d.type] = (acc[d.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      anonymousCount: donationsToPrint.filter(d => d.is_anonymous).length,
      verifiedCount: donationsToPrint.filter(d => d.is_verified).length
    };

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ 
        title: "Erreur", 
        description: "Veuillez autoriser les fenêtres popup pour l'impression.", 
        variant: "destructive" 
      });
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Registre des Dons - ${today}</title>
        <style>
          @page {
            margin: 15mm 20mm;
            size: A4;
          }
          
          body {
            font-family: 'Segoe UI', 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            color: #2d3748;
            font-size: 11pt;
            line-height: 1.5;
          }
          
          /* En-tête */
          .print-header {
            display: flex;
            align-items: flex-start;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #059669;
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
            color: #065f46;
            margin: 0 0 4px 0;
          }
          
          .subtitle {
            font-size: 14pt;
            color: #047857;
            margin: 0 0 10px 0;
            font-style: italic;
          }
          
          .document-title {
            font-size: 16pt;
            font-weight: 600;
            color: #059669;
            margin: 0 0 8px 0;
          }
          
          .meta-info {
            font-size: 10pt;
            color: #6b7280;
            margin: 0;
          }
          
          /* Statistiques */
          .stats-section {
            background: #f0fdf4;
            border-radius: 6px;
            padding: 12px 16px;
            margin: 0 0 20px 0;
            border-left: 4px solid #059669;
            page-break-inside: avoid;
          }
          
          .stats-title {
            font-size: 12pt;
            font-weight: 600;
            color: #065f46;
            margin: 0 0 10px 0;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 8px;
          }
          
          .stat-item {
            text-align: center;
            padding: 8px;
            background: white;
            border-radius: 4px;
            border: 1px solid #d1fae5;
          }
          
          .stat-label {
            font-size: 9pt;
            color: #6b7280;
          }
          
          .stat-value {
            font-size: 14pt;
            font-weight: bold;
            color: #059669;
            margin-top: 4px;
          }
          
          .amount-total {
            font-size: 16pt;
            color: #065f46;
            font-weight: bold;
          }
          
          /* Table des dons */
          .donations-table {
            width: 100%;
            border-collapse: collapse;
            margin: 0 0 20px 0;
            page-break-inside: avoid;
          }
          
          .donations-table th {
            background: #f0fdf4;
            color: #065f46;
            font-weight: 600;
            font-size: 10pt;
            padding: 8px 10px;
            text-align: left;
            border-bottom: 2px solid #059669;
          }
          
          .donations-table td {
            padding: 8px 10px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 10pt;
            vertical-align: top;
          }
          
          .donations-table tr:last-child td {
            border-bottom: none;
          }
          
          .type-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 9pt;
            font-weight: 500;
            text-align: center;
          }
          
          .type-especes { background: #d1fae5; color: #065f46; }
          .type-alimentaire { background: #ffedd5; color: #92400e; }
          .type-vestimentaire { background: #dbeafe; color: #1e40af; }
          .type-materiel { background: #f3e8ff; color: #5b21b6; }
          .type-services { background: #e0e7ff; color: #3730a3; }
          .type-autre { background: #f3f4f6; color: #4b5563; }
          
          .amount-cell {
            text-align: right;
            font-weight: 600;
            color: #059669;
          }
          
          .donor-cell {
            max-width: 120px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          
          .status-badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 8pt;
            font-weight: 500;
          }
          
          .status-verified { background: #d1fae5; color: #065f46; }
          .status-pending { background: #fef3c7; color: #92400e; }
          
          /* Pied de page */
          .print-footer {
            margin-top: 25px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
            font-size: 9pt;
            color: #6b7280;
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
          
          .text-right {
            text-align: right;
          }
          
          .text-center {
            text-align: center;
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
            
            <h3 class="document-title">Registre des Dons</h3>
            <div class="meta-info">
              Période : ${fromDate} – ${toDate} | 
              Imprimé le : ${today} | 
              Total : ${donationsToPrint.length} don(s)
            </div>
          </div>
        </div>

        <!-- Statistiques -->
        <div class="stats-section avoid-break">
          <div class="stats-title">Synthèse de la période</div>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-label">Total dons</div>
              <div class="stat-value">${stats.total}</div>
            </div>
            
            <div class="stat-item">
              <div class="stat-label">Montant total</div>
              <div class="amount-total">${stats.amountTotal.toFixed(2)} €</div>
            </div>
            
            <div class="stat-item">
              <div class="stat-label">Dons vérifiés</div>
              <div class="stat-value">${stats.verifiedCount}</div>
            </div>
            
            <div class="stat-item">
              <div class="stat-label">Dons anonymes</div>
              <div class="stat-value">${stats.anonymousCount}</div>
            </div>
            
            ${Object.entries(stats.types).map(([type, count]) => `
              <div class="stat-item">
                <div class="stat-label">${DONATION_TYPES[type]?.label || type}</div>
                <div class="stat-value">${count}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Table des dons -->
        <table class="donations-table avoid-break">
          <thead>
            <tr>
              <th width="15%">Date</th>
              <th width="15%">Type</th>
              <th width="15%">Montant/Quantité</th>
              <th width="20%">Donateur</th>
              <th width="25%">Description</th>
              <th width="10%">Statut</th>
            </tr>
          </thead>
          <tbody>
            ${donationsToPrint.map((donation, index) => {
              const typeInfo = DONATION_TYPES[donation.type];
              const amountDisplay = donation.type === 'especes' 
                ? (donation.amount_value ? `${donation.amount_value.toFixed(2)} ${donation.amount_currency || '€'}` : '-')
                : (donation.quantity || '-');
              
              return `
                <tr class="${index % 2 === 0 ? 'even' : 'odd'}">
                  <td>${format(new Date(donation.donation_date), "dd/MM/yyyy", { locale: fr })}</td>
                  <td>
                    <span class="type-badge type-${donation.type}">
                      ${typeInfo?.label || donation.type}
                    </span>
                  </td>
                  <td class="amount-cell">${amountDisplay}</td>
                  <td class="donor-cell">
                    ${donation.is_anonymous 
                      ? '<em>Anonyme</em>' 
                      : (donation.donor_name || '<em>Non spécifié</em>')}
                  </td>
                  <td>${donation.description || '-'}</td>
                  <td class="text-center">
                    <span class="status-badge status-${donation.is_verified ? 'verified' : 'pending'}">
                      ${donation.is_verified ? '✓ Vérifié' : 'En attente'}
                    </span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <!-- Total -->
        <div class="stats-section avoid-break">
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-label">Nombre total de dons</div>
              <div class="stat-value">${stats.total}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Montant total (espèces)</div>
              <div class="amount-total">${stats.amountTotal.toFixed(2)} €</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Taux de vérification</div>
              <div class="stat-value">${stats.verifiedCount > 0 ? Math.round((stats.verifiedCount / stats.total) * 100) : 0}%</div>
            </div>
          </div>
        </div>

        <!-- Pied de page -->
        <div class="print-footer avoid-break">
          Document officiel • ${currentHeaderConfig.main_title || 'Paroisse'} • 
          Généré le ${today} depuis l'application Paroisse<br/>
          <em>"Donnez avec joie, car Dieu aime celui qui donne avec joie" (2 Corinthiens 9:7)</em>
        </div>

        <!-- Contrôles (masqués lors de l'impression) -->
        <div class="no-print" style="position: fixed; top: 20px; right: 20px; background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="margin-bottom: 10px; font-size: 14px; color: #4b5563;">
            <strong>Prêt à imprimer</strong>
          </div>
          <button onclick="window.print();" style="padding: 8px 16px; background: #059669; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; margin-right: 8px;">
            🖨️ Imprimer
          </button>
          <button onclick="window.close();" style="padding: 8px 16px; background: #e5e7eb; color: #4b5563; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
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
              className="pl-10 h-12 bg-white/90 border-2 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500"
            />
          </div>
        </motion.div>

        {/* Filtres de date et impression */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 space-y-4"
        >
          <div className="flex flex-col md:flex-row gap-4 p-4 bg-card rounded-lg border">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="flex-1">
                <label className="flex items-center gap-2 text-sm font-medium mb-1">
                  <Calendar className="h-4 w-4" />
                  Du
                </label>
                <Input
                  type="date"
                  onChange={(e) => setDateRange({ ...dateRange, from: e.target.value ? new Date(e.target.value) : null })}
                  className="w-full bg-white/90 border-2 border-gray-300 text-gray-900 focus:border-green-500"
                />
              </div>
              <div className="flex-1">
                <label className="flex items-center gap-2 text-sm font-medium mb-1">
                  <Calendar className="h-4 w-4" />
                  Au
                </label>
                <Input
                  type="date"
                  onChange={(e) => setDateRange({ ...dateRange, to: e.target.value ? new Date(e.target.value) : null })}
                  className="w-full bg-white/90 border-2 border-gray-300 text-gray-900 focus:border-green-500"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handlePrintDonations}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-10 w-full md:w-auto"
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimer la sélection
                {dateRange.from && dateRange.to && (
                  <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded">
                    {format(dateRange.from, "dd/MM")} - {format(dateRange.to, "dd/MM")}
                  </span>
                )}
              </Button>
            </div>
          </div>
          {headerConfig && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground bg-green-50 p-3 rounded-lg">
              {headerConfig.logo_url ? (
                <img src={headerConfig.logo_url} alt={headerConfig.logo_alt_text || 'Logo'} className="h-8 w-8 object-contain" />
              ) : (
                <MapPin className="h-5 w-5 text-green-500" />
              )}
              <div>
                <span className="font-medium text-green-700">{headerConfig.main_title}</span>
                {headerConfig.subtitle && <div className="text-sm text-green-600">{headerConfig.subtitle}</div>}
              </div>
            </div>
          )}
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
                    {donation.metadata?.quantity && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Quantité: <span className="font-medium">{donation.metadata.quantity}</span>
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
                        <span>{donation.purpose || ''}</span>
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
                    {(isAdmin || profile?.id === donation.donor_id) && (
                      <div className="flex gap-2 pt-4 border-t border-border/50">
                        {profile?.id === donation.donor_id && (
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
