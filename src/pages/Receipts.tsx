import { useState, useEffect } from 'react';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { useAuthContext } from '@/hooks/useAuthContext';
import { useLocation } from 'react-router-dom';
import usePageHero from '@/hooks/usePageHero';
import HeroBanner from '@/components/HeroBanner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Receipt {
  id: string;
  receipt_number: string;
  donor_name: string;
  donor_email: string;
  donation_amount: number;
  donation_currency: string;
  donation_date: string;
  issued_date: string;
  fiscal_year: number;
  tax_deductible: boolean;
  deduction_rate: number;
  pdf_url: string | null;
  created_at: string;
}

export default function Receipts() {
  const { isAdmin } = useRoleCheck();
  const { user } = useAuthContext();
  const { toast } = useToast();

  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  // Fetch receipts
  useEffect(() => {
    fetchReceipts();
  }, []);

  // Filter receipts
  useEffect(() => {
    let filtered = receipts;

    if (searchTerm) {
      filtered = filtered.filter(
        (receipt) =>
          receipt.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          receipt.donor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          receipt.donor_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedYear !== 'all') {
      filtered = filtered.filter(
        (receipt) => receipt.fiscal_year.toString() === selectedYear
      );
    }

    setFilteredReceipts(filtered);
  }, [receipts, searchTerm, selectedYear]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('receipts')
        .select('*')
        .order('issued_date', { ascending: false });

      // Non-admins only see their own receipts
      if (!isAdmin && user) {
        query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReceipts(data || []);
    } catch (err) {
      console.error('Error fetching receipts:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les reçus',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = () => {
    try {
      setDownloadingCsv(true);

      // CSV headers
      const headers = [
        'Numéro de reçu',
        'Donateur',
        'Email',
        'Montant',
        'Devise',
        'Date du don',
        'Date d\'émission',
        'Année fiscale',
        'Déductible',
        'Taux de déduction',
      ];

      // CSV rows
      const rows = filteredReceipts.map((receipt) => [
        receipt.receipt_number,
        receipt.donor_name,
        receipt.donor_email,
        receipt.donation_amount.toFixed(2),
        receipt.donation_currency,
        new Date(receipt.donation_date).toLocaleDateString('fr-FR'),
        new Date(receipt.issued_date).toLocaleDateString('fr-FR'),
        receipt.fiscal_year,
        receipt.tax_deductible ? 'Oui' : 'Non',
        `${receipt.deduction_rate}%`,
      ]);

      // Build CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map((row) =>
          row
            .map((cell) => {
              // Escape quotes and wrap in quotes if contains comma
              const cellStr = String(cell);
              if (cellStr.includes(',') || cellStr.includes('"')) {
                return `"${cellStr.replace(/"/g, '""')}"`;
              }
              return cellStr;
            })
            .join(',')
        ),
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `reçus-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Succès',
        description: 'Fichier CSV téléchargé',
      });
    } catch (err) {
      console.error('Error downloading CSV:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger le CSV',
        variant: 'destructive',
      });
    } finally {
      setDownloadingCsv(false);
    }
  };

  const years = Array.from(
    new Set(receipts.map((r) => r.fiscal_year))
  )
    .sort((a, b) => b - a);

  const totalAmount = filteredReceipts.reduce(
    (sum, receipt) => sum + receipt.donation_amount,
    0
  );

  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeroBanner
        title="Reçus de don"
        subtitle="Gérer et télécharger vos reçus fiscaux"
        showBackButton={true}
        backgroundImage={hero?.image_url}
        onBgSave={saveHero}
      />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          {/* Header with stats */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Vos reçus
            </h2>
        {filteredReceipts.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Nombre de reçus
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredReceipts.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Montant total
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {totalAmount.toFixed(2)}
                  <span className="text-lg ml-1">
                    {filteredReceipts[0]?.donation_currency || 'EUR'}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Montant déductible
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {(
                    (totalAmount *
                      (filteredReceipts[0]?.deduction_rate || 66)) /
                    100
                  ).toFixed(2)}
                  <span className="text-lg ml-1">
                    {filteredReceipts[0]?.donation_currency || 'EUR'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
          </div>

          {/* Search & Filters */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Rechercher par n° reçu, donateur ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Année fiscale" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les années</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {filteredReceipts.length > 0 && (
                <Button
                  onClick={downloadCsv}
                  disabled={downloadingCsv}
                  className="bg-green-600 hover:bg-green-700 flex-shrink-0"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {downloadingCsv ? 'Téléchargement...' : 'Exporter CSV'}
                </Button>
              )}
            </div>
          </div>

          {/* Receipts Table */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Chargement des reçus...</p>
            </div>
          ) : filteredReceipts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">
                {searchTerm || selectedYear !== 'all'
                  ? 'Aucun reçu trouvé'
                  : 'Aucun reçu disponible'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-lg shadow-md">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase">
                      N° Reçu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase">
                      Donateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-900 dark:text-white uppercase">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase">
                      Date du don
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase">
                      Année fiscale
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white uppercase">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-900 dark:text-white uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {filteredReceipts.map((receipt) => (
                    <tr
                      key={receipt.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                        {receipt.receipt_number}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {receipt.donor_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {receipt.donor_email}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-right text-gray-900 dark:text-gray-100">
                        {receipt.donation_amount.toFixed(2)} {receipt.donation_currency}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(receipt.donation_date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {receipt.fiscal_year}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            receipt.tax_deductible
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}
                        >
                          {receipt.tax_deductible
                            ? `Déductible (${receipt.deduction_rate}%)`
                            : 'Non déductible'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm">
                        {receipt.pdf_url ? (
                          <a href={receipt.pdf_url} target="_blank" rel="noopener noreferrer">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs">Non disponible</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
