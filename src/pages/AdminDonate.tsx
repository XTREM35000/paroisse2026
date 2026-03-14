import React, { useEffect, useState } from 'react';
import { Trash2, Printer, CreditCard, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDonations } from '@/hooks/useDonations';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import CashDonationProcessor from '@/components/donations/CashDonationProcessor';

export default function AdminDonate() {
  const [tab, setTab] = useState<'online' | 'guichet'>('online');
  const { donations, loading, fetchDonations, deleteDonation } = useDonations();
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

  const onlineDonations = donations.filter(
    (d) => !(d.payment_method === 'cash' && d.payment_status === 'intention')
  );

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Gestion Admin des Dons</h1>

      <div className="flex gap-2 mb-6 border-b border-border pb-2">
        <Button
          variant={tab === 'online' ? 'default' : 'ghost'}
          onClick={() => setTab('online')}
          className="gap-2"
        >
          <CreditCard className="h-4 w-4" />
          Dons en ligne
        </Button>
        <Button
          variant={tab === 'guichet' ? 'default' : 'ghost'}
          onClick={() => setTab('guichet')}
          className="gap-2"
        >
          <Banknote className="h-4 w-4" />
          Dons au guichet
        </Button>
      </div>

      {tab === 'guichet' ? (
        <CashDonationProcessor />
      ) : (
        <>
          <div className="mb-6">
            <Button onClick={handlePrintDonations} className="bg-orange-600 hover:bg-orange-700">
              <Printer className="h-4 w-4 mr-2" /> Imprimer
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Chargement...</div>
          ) : onlineDonations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Aucun don en ligne</div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {onlineDonations.map((donation) => (
                <div key={donation.id} className="p-6 rounded-lg border bg-card">
                  <div className="mb-2 font-medium">
                    {(donation as { payer_name?: string }).payer_name ?? 'Anonyme'}
                  </div>
                  <div className="text-lg font-bold text-green-600 mb-2">
                    {donation.amount ?? '-'} {donation.currency ?? 'XOF'}
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    {(donation as { intention_message?: string }).intention_message}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleDelete(donation.id)} variant="ghost" className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-1" /> Supprimer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
