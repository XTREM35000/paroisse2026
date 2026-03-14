import { useState } from 'react';
import { Search, CheckCircle, Banknote } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useCashDonation } from '@/hooks/useCashDonation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { CashIntentionRow } from '@/lib/supabase/cashDonationQueries';
import UnifiedFormModal from '@/components/ui/unified-form-modal';

export default function CashDonationProcessor() {
  const {
    pending,
    searchResult,
    loading,
    searchByToken,
    processIntention,
    clearSearchResult,
  } = useCashDonation();
  const [tokenSearch, setTokenSearch] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actualAmount, setActualAmount] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    setHasSearched(true);
    await searchByToken(tokenSearch);
  };

  const openProcessModal = (row: CashIntentionRow) => {
    setProcessingId(row.id);
    setActualAmount(String(row.amount ?? ''));
    setReceiptNumber('');
    setNotes('');
  };

  const handleProcessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processingId || !actualAmount) return;
    const ok = await processIntention(processingId, {
      actual_amount: Number(actualAmount),
      receipt_number: receiptNumber.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    if (ok) {
      setProcessingId(null);
      clearSearchResult();
    }
  };

  const displayRow = searchResult ?? null;
  const list = searchResult ? [searchResult] : pending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par code (ex: INT-20250314-ABCD)"
            value={tokenSearch}
            onChange={(e) => setTokenSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} variant="secondary">
          Rechercher
        </Button>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Chargement...</p>}

      {displayRow && !searchResult && tokenSearch.trim() && (
        <p className="text-sm text-muted-foreground">Aucune intention trouvée pour ce code.</p>
      )}

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 font-medium flex items-center gap-2">
          <Banknote className="h-4 w-4" />
          Intentions en attente ({list.length})
        </div>
        {list.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Aucune intention en attente.
          </div>
        ) : (
          <ul className="divide-y">
            {list.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div>
                  <div className="font-mono font-semibold text-primary">
                    {(row.intention_token ?? (row.metadata as Record<string, unknown> | null)?.intention_token) ?? '-'}
                  </div>
                  <div className="text-sm text-foreground">
                    {row.donor_name ?? row.payer_name ?? 'Sans nom'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {row.donor_phone ?? row.payer_phone ?? row.donor_email ?? row.payer_email ?? '-'}
                    {row.created_at && (
                      <> · {format(new Date(row.created_at), 'd MMM yyyy HH:mm', { locale: fr })}</>
                    )}
                  </div>
                  {row.amount != null && row.amount > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Montant prévu : {row.amount} FCFA
                    </div>
                  )}
                </div>
                <Button size="sm" onClick={() => openProcessModal(row)}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Traiter
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <UnifiedFormModal
        open={!!processingId}
        onClose={() => setProcessingId(null)}
        title="Valider le don au guichet"
        headerClassName="bg-green-800"
      >
        <form onSubmit={handleProcessSubmit} className="space-y-4">
          <div>
            <Label>Montant réel reçu (FCFA) *</Label>
            <Input
              type="number"
              min={1}
              value={actualAmount}
              onChange={(e) => setActualAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Numéro de reçu (optionnel)</Label>
            <Input
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
              placeholder="REC-2025-001"
            />
          </div>
          <div>
            <Label>Notes (optionnel)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="..."
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              Valider et enregistrer le reçu
            </Button>
            <Button type="button" variant="outline" onClick={() => setProcessingId(null)}>
              Annuler
            </Button>
          </div>
        </form>
      </UnifiedFormModal>
    </div>
  );
}
