import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  CreditCard,
  Smartphone,
  Banknote,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import HeroBanner from "@/components/HeroBanner";
import usePageHero from "@/hooks/usePageHero";
import useRoleCheck from "@/hooks/useRoleCheck";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ReceiptPreviewModal from "@/components/donations/ReceiptPreviewModal";
import { findCashDonationByCode } from "@/lib/supabase/cashDonationQueries";
import type { ReceiptDonation } from "@/components/donations/ReceiptPreviewModal";

type Donation = {
  id: string;
  user_id?: string | null;
  created_at: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_status: string;
  transaction_id?: string | null;
  intention_token?: string | null;
  receipt_number?: string | null;
  payer_name?: string | null;
  payer_phone?: string | null;
  donor_phone?: string | null;
  intention_message?: string | null;
  metadata?: Record<string, unknown> | null;
};

function getDisplayCode(row: Donation): { code: string; isPaid: boolean } {
  const paid = row.payment_status === "completed";
  const token = row.intention_token || "";
  const receiptNum = row.receipt_number || "";
  const method = row.payment_method || "";
  const datePart = row.created_at ? new Date(row.created_at).toISOString().slice(0, 10).replace(/-/g, "") : new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const shortId = (row.id || "").slice(-6).toUpperCase();

  if (method === "cash") {
    if (paid && receiptNum) {
      return { code: receiptNum.startsWith("PAIE") ? receiptNum : `PAIE_${receiptNum}`, isPaid: true };
    }
    if (paid && token) {
      return { code: `PAIE_${token.replace(/^INT-?/, "").replace(/-/g, "_")}`, isPaid: true };
    }
    return { code: token || "INT_", isPaid: false };
  }
  if (method === "stripe") {
    return { code: paid ? `CARTE_${datePart}_${shortId}` : `CARTE_${datePart}_${shortId}`, isPaid: !!paid };
  }
  if (method === "cinetpay") {
    return { code: paid ? `MOBILE_${datePart}_${shortId}` : `MOBILE_${datePart}_${shortId}`, isPaid: !!paid };
  }
  const txRef = row.transaction_id || row.id?.slice(-8) || "REC";
  return { code: paid ? `PAIE_${txRef}` : String(txRef), isPaid: !!paid };
}

export default function Receipts() {
  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);
  const { isAdmin } = useRoleCheck();
  const { profile } = useUser();

  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [codeSearch, setCodeSearch] = useState("");
  const [codeSearching, setCodeSearching] = useState(false);
  const [codeResult, setCodeResult] = useState<ReceiptDonation | null>(null);
  const [previewDonation, setPreviewDonation] = useState<ReceiptDonation | null>(null);
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);

  const pageSize = 10;

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setDonations([]);
        setLoading(false);
        return;
      }

      // Donations de l'utilisateur (toutes méthodes)
      const { data: userData, error: userErr } = await (supabase as any)
        .from("donations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (userErr) {
        console.error("[Receipts] Erreur chargement dons:", userErr);
        setDonations([]);
        setLoading(false);
        return;
      }

      let list: Donation[] = (userData || []) as Donation[];

      // Admin : ajouter toutes les donations espèces (avec intention_token)
      if (isAdmin) {
        const { data: cashData, error: cashErr } = await (supabase as any)
          .from("donations")
          .select("*")
          .eq("payment_method", "cash")
          .not("intention_token", "is", null)
          .order("created_at", { ascending: false });

        if (!cashErr && cashData?.length) {
          const cashIds = new Set(list.map((d) => d.id));
          const extra = (cashData as Donation[]).filter((d) => !cashIds.has(d.id));
          list = [...extra, ...list].sort(
            (a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        }
      }

      setDonations(list);
    } catch (e) {
      console.error("[Receipts] Exception:", e);
      setDonations([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  const handleSearchByCode = async () => {
    const code = codeSearch.trim();
    if (!code) return;
    setCodeSearching(true);
    setCodeResult(null);
    try {
      const found = await findCashDonationByCode(code);
      setCodeResult(found);
      if (found) {
        setPreviewDonation(found as ReceiptDonation);
      }
    } catch {
      setCodeResult(null);
    } finally {
      setCodeSearching(false);
    }
  };

  const filteredDonations = donations
    .filter((donation) => {
      const matchesMethod =
        methodFilter === "all" || donation.payment_method === methodFilter;
      const matchesStatus =
        statusFilter === "all" || donation.payment_status === statusFilter;
      const codeInfo = getDisplayCode(donation);
      const matchesSearch =
        donation.amount.toString().includes(searchTerm) ||
        new Date(donation.created_at)
          .toLocaleDateString("fr-FR")
          .includes(searchTerm) ||
        codeInfo.code.toUpperCase().includes(searchTerm.toUpperCase()) ||
        (donation.intention_token || "").toUpperCase().includes(searchTerm.toUpperCase());
      return matchesMethod && matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sortOrder === "desc" ? db - da : da - db;
    });

  const totalAmount = filteredDonations.reduce(
    (sum, d) => sum + (d.amount || 0),
    0
  );
  const lastDonation = filteredDonations[0];
  const averageDonation =
    filteredDonations.length > 0
      ? Math.round(totalAmount / filteredDonations.length)
      : 0;

  const totalPages = Math.max(
    1,
    Math.ceil(filteredDonations.length / pageSize)
  );
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedDonations = filteredDonations.slice(
    startIndex,
    startIndex + pageSize
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeroBanner
        title="📋 Reçus et historique de dons"
        subtitle="Consultez vos reçus, recherchez par code (INT_ / PAIE_), imprimez ou envoyez par SMS"
        showBackButton={true}
        backgroundImage={hero?.image_url}
        onBgSave={saveHero}
      />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
              📋 Reçus de dons
            </h1>
            <p className="text-muted-foreground">
              Recherchez par code, consultez et imprimez vos reçus.
            </p>
          </motion.div>

          {/* Recherche par code */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Rechercher un reçu par code
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Saisissez votre code (ex: INT-20250314-ABCD ou PAIE_20250314_ABCD)
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Code du reçu..."
                  value={codeSearch}
                  onChange={(e) => setCodeSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchByCode()}
                  className="flex-1"
                />
                <Button
                  onClick={handleSearchByCode}
                  disabled={codeSearching || !codeSearch.trim()}
                >
                  {codeSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Rechercher
                </Button>
              </div>
              {codeSearch.trim() && !codeSearching && codeResult === null && (
                <p className="text-sm text-muted-foreground mt-2">
                  Aucun reçu trouvé pour ce code.
                </p>
              )}
              {codeResult && (
                <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Reçu trouvé – cliquez pour afficher
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => setPreviewDonation(codeResult)}
                  >
                    Voir le reçu
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
              title="Total des dons"
              value={`${totalAmount.toLocaleString("fr-FR")} FCFA`}
              icon="💰"
              color="from-blue-500 to-blue-600"
            />
            <StatsCard
              title="Nombre de dons"
              value={filteredDonations.length.toString()}
              icon="📊"
              color="from-green-500 to-green-600"
            />
            <StatsCard
              title="Dernier don"
              value={
                lastDonation
                  ? `${lastDonation.amount.toLocaleString("fr-FR")} ${lastDonation.currency || "FCFA"}`
                  : "-"
              }
              subtitle={
                lastDonation
                  ? new Date(lastDonation.created_at).toLocaleDateString("fr-FR")
                  : ""
              }
              icon="⏱️"
              color="from-purple-500 to-purple-600"
            />
            <StatsCard
              title="Don moyen"
              value={`${averageDonation.toLocaleString("fr-FR")} FCFA`}
              icon="📈"
              color="from-amber-500 to-amber-600"
            />
          </div>

          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Rechercher par montant, date ou code..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={methodFilter}
                  onValueChange={(v) => {
                    setMethodFilter(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Méthode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les méthodes</SelectItem>
                    <SelectItem value="stripe">💳 Carte bancaire</SelectItem>
                    <SelectItem value="cinetpay">📱 Mobile Money</SelectItem>
                    <SelectItem value="cash">💵 Espèces (Guichet)</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="completed">✅ Payé (PAIE_)</SelectItem>
                    <SelectItem value="intention">📝 Intention (INT_)</SelectItem>
                    <SelectItem value="pending">⏳ En attente</SelectItem>
                    <SelectItem value="failed">❌ Échoué</SelectItem>
                    <SelectItem value="cancelled">🚫 Annulé</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() =>
                    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
                  }
                  className="w-full md:w-auto"
                >
                  Trier :{" "}
                  {sortOrder === "desc" ? "Récent → Ancien" : "Ancien → Récent"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Historique des dons</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Méthode</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Reçu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : paginatedDonations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Aucun don trouvé
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedDonations.map((donation) => (
                        <DonationRow
                          key={donation.id}
                          donation={donation}
                          onPreview={() =>
                            setPreviewDonation(donation as ReceiptDonation)
                          }
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {!loading && filteredDonations.length > pageSize && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} sur {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <ReceiptPreviewModal
        open={!!previewDonation}
        onClose={() => setPreviewDonation(null)}
        donation={previewDonation}
        responsableCaisse={profile?.full_name || "—"}
      />
    </div>
  );
}

function DonationRow({
  donation,
  onPreview,
}: {
  donation: Donation;
  onPreview: () => void;
}) {
  const { code, isPaid } = getDisplayCode(donation);

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "stripe":
        return <CreditCard className="h-4 w-4 mr-2" />;
      case "cinetpay":
        return <Smartphone className="h-4 w-4 mr-2" />;
      case "cash":
        return <Banknote className="h-4 w-4 mr-2" />;
      default:
        return null;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case "stripe":
        return "Carte bancaire";
      case "cinetpay":
        return "Mobile Money";
      case "cash":
        return "Espèces";
      default:
        return method;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400",
      intention: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      failed: "bg-red-100 text-red-700 border-red-200",
      cancelled: "bg-gray-100 text-gray-700 border-gray-200",
    };
    const icons: Record<string, React.ReactNode> = {
      completed: <CheckCircle className="h-3 w-3 mr-1" />,
      intention: <FileText className="h-3 w-3 mr-1" />,
      pending: <Clock className="h-3 w-3 mr-1" />,
      failed: <XCircle className="h-3 w-3 mr-1" />,
      cancelled: <XCircle className="h-3 w-3 mr-1" />,
    };
    const labels: Record<string, string> = {
      completed: "Payé (PAIE_)",
      intention: "Intention (INT_)",
      pending: "En attente",
      failed: "Échoué",
      cancelled: "Annulé",
    };
    const key = (status || "pending") as string;
    return (
      <Badge
        variant="outline"
        className={`flex items-center w-fit ${styles[key] || styles.pending}`}
      >
        {icons[key] || icons.pending}
        {labels[key] || status}
      </Badge>
    );
  };

  const canPreview =
    donation.payment_method === "cash" ||
    donation.payment_status === "completed";

  return (
    <TableRow>
      <TableCell>
        <span
          className={`font-mono text-sm font-medium ${
            isPaid ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"
          }`}
        >
          {code || "—"}
        </span>
      </TableCell>
      <TableCell className="font-medium">
        {new Date(donation.created_at).toLocaleDateString("fr-FR")}
      </TableCell>
      <TableCell>
        <span className="font-bold">
          {donation.amount.toLocaleString("fr-FR")}{" "}
          {donation.currency || "FCFA"}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center">
          {getMethodIcon(donation.payment_method)}
          {getMethodLabel(donation.payment_method)}
        </div>
      </TableCell>
      <TableCell>{getStatusBadge(donation.payment_status)}</TableCell>
      <TableCell className="text-right">
        {canPreview && (
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-green-50 dark:hover:bg-green-900/20"
            title="Voir / Imprimer / Envoyer par SMS"
            onClick={onPreview}
          >
            <FileText className="h-4 w-4 text-green-600" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

function StatsCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  color: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className={`bg-gradient-to-br ${color} text-white`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">{icon}</span>
            {subtitle && (
              <span className="text-sm opacity-90 text-right">{subtitle}</span>
            )}
          </div>
          <p className="text-2xl font-bold mb-1">{value}</p>
          <p className="text-sm opacity-90">{title}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
