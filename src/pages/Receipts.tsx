import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Download,
  Search,
  CreditCard,
  Smartphone,
  Banknote,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import HeroBanner from "@/components/HeroBanner";
import usePageHero from "@/hooks/usePageHero";
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

type Donation = {
  id: string;
  created_at: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_status: string;
  transaction_id?: string | null;
};

export default function Receipts() {
  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);

  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);

  const pageSize = 10;

  useEffect(() => {
    const fetchDonations = async () => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setDonations([]);
          setLoading(false);
          return;
        }

        // Cast léger pour éviter la profondeur de types générée par les types Supabase
        const { data, error } = await (supabase as unknown as {
          from: (table: string) => {
            select: (cols: string) => {
              eq: (col: string, val: string) => {
                order: (
                  col: string,
                  opts: { ascending: boolean }
                ) => Promise<{ data: Donation[] | null; error: unknown | null }>;
              };
            };
          };
        })
          .from("donations")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("[Receipts] Erreur chargement dons:", error);
          setDonations([]);
        } else {
          setDonations((data as Donation[]) || []);
        }
      } catch (e) {
        console.error("[Receipts] Exception chargement dons:", e);
        setDonations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, []);

  const filteredDonations = donations
    .filter((donation) => {
      const matchesMethod =
        methodFilter === "all" || donation.payment_method === methodFilter;
      const matchesStatus =
        statusFilter === "all" || donation.payment_status === statusFilter;
      const matchesSearch =
        donation.amount.toString().includes(searchTerm) ||
        new Date(donation.created_at)
          .toLocaleDateString("fr-FR")
          .includes(searchTerm);
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
        title="📋 Mon historique de dons"
        subtitle="Retrouvez tous vos dons passés (Stripe, Mobile Money, Caisse)"
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
              📋 Mon historique de dons
            </h1>
            <p className="text-gray-600">
              Retrouvez tous vos dons passés (Stripe, Mobile Money, Caisse).
            </p>
          </motion.div>

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
                  ? `${lastDonation.amount.toLocaleString("fr-FR")} ${
                      lastDonation.currency || "FCFA"
                    }`
                  : "-"
              }
              subtitle={
                lastDonation
                  ? new Date(lastDonation.created_at).toLocaleDateString(
                      "fr-FR"
                    )
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
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher par montant ou date..."
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
                    <SelectItem value="completed">✅ Complété</SelectItem>
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
                  Trier par date :{" "}
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
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-32" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-16" />
                          </TableCell>
                          <TableCell className="text-right">
                            <Skeleton className="h-8 w-8 ml-auto" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : paginatedDonations.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-gray-500"
                        >
                          Aucun don trouvé
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedDonations.map((donation) => (
                        <DonationRow key={donation.id} donation={donation} />
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {!loading && filteredDonations.length > pageSize && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-gray-600">
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
    </div>
  );
}

function DonationRow({ donation }: { donation: Donation }) {
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
        return "Espèces (Guichet)";
      default:
        return method;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: "bg-green-100 text-green-700 border-green-200",
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      failed: "bg-red-100 text-red-700 border-red-200",
      cancelled: "bg-gray-100 text-gray-700 border-gray-200",
    } as const;

    const icons = {
      completed: <CheckCircle className="h-3 w-3 mr-1" />,
      pending: <Clock className="h-3 w-3 mr-1" />,
      failed: <XCircle className="h-3 w-3 mr-1" />,
      cancelled: <XCircle className="h-3 w-3 mr-1" />,
    } as const;

    const key = (status || "pending") as keyof typeof styles;

    return (
      <Badge
        variant="outline"
        className={`flex items-center w-fit ${
          styles[key] || styles.pending
        }`}
      >
        {icons[key] || icons.pending}
        {status === "completed"
          ? "Complété"
          : status === "pending"
          ? "En attente"
          : status === "failed"
          ? "Échoué"
          : status === "cancelled"
          ? "Annulé"
          : status}
      </Badge>
    );
  };

  return (
    <TableRow>
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
        {donation.payment_status === "completed" && (
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-green-50"
            title="Télécharger le reçu"
          >
            <Download className="h-4 w-4 text-green-600" />
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
              <span className="text-sm opacity-90 text-right">
                {subtitle}
              </span>
            )}
          </div>
          <p className="text-2xl font-bold mb-1">{value}</p>
          <p className="text-sm opacity-90">{title}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
