import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Calendar, MapPin, Trash2, CheckCircle, Clock, Printer } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDonations } from '@/hooks/useDonations';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const DONATION_TYPES = {
  especes: { label: 'Espèces', color: 'bg-green-500/10 text-green-700', icon: '💵' },
  alimentaire: { label: 'Denrée alimentaire', color: 'bg-orange-500/10 text-orange-700', icon: '🥫' },
  vestimentaire: { label: 'Vêtements', color: 'bg-blue-500/10 text-blue-700', icon: '👕' },
  materiel: { label: 'Matériel', color: 'bg-purple-500/10 text-purple-700', icon: '🔧' },
  services: { label: 'Services', color: 'bg-indigo-500/10 text-indigo-700', icon: '🤝' },
  autre: { label: 'Autre', color: 'bg-gray-500/10 text-gray-700', icon: '📦' },
};

export default function AdminDonate() {
  const { donations, loading, fetchDonations, createDonation, deleteDonation } = useDonations();
  const { toast } = useToast();

  useEffect(() => {
    fetchDonations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer ?')) return;
    try {
      await deleteDonation(id);
      toast({ title: '✓ Supprimée', description: 'Donation supprimée' });
    } catch (e) {
      toast({ title: '✗ Erreur', variant: 'destructive' });
    }
  };

  const handlePrintDonations = () => {
    const toPrint = donations;
    if (toPrint.length === 0) {
      toast({ title: 'Aucune donnée', variant: 'destructive' });
      return;
    }
    const today = format(new Date(), 'd MMMM yyyy', { locale: fr });
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Registre des Dons</title></head><body><h1>Registre des Dons - ${today}</h1><pre>${JSON.stringify(toPrint, null, 2)}</pre></body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Gestion Admin des Dons</h1>
      <div className="mb-6">
        <Button onClick={handlePrintDonations} className="bg-orange-600 hover:bg-orange-700">
          <Printer className="h-4 w-4 mr-2" /> Imprimer
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : donations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Aucun don</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {donations.map((donation) => (
            <div key={donation.id} className="p-6 rounded-lg border bg-card">
              <div className="mb-2 font-medium">{donation.payer_name || 'Anonyme'}</div>
              <div className="text-lg font-bold text-green-600 mb-2">{donation.amount || '-'} {donation.currency}</div>
              <div className="text-sm text-muted-foreground mb-3">{donation.description}</div>
              <div className="flex gap-2">
                <Button onClick={() => handleDelete(donation.id)} variant="ghost" className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-1" /> Supprimer
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
