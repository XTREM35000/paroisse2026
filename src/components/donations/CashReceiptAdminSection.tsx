import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCashDonation } from '@/hooks/useCashDonation';
import type { CashIntentionRow } from '@/lib/supabase/cashDonationQueries';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type CreateMode = 'direct' | 'intention';

export default function CashReceiptAdminSection() {
  const {
    allCash,
    searchResult,
    loading,
    fetchAllCash,
    searchByToken,
    processIntention,
    createDirect,
    updateDonation,
    removeDonation,
    clearSearchResult,
  } = useCashDonation();

  const [createOpen, setCreateOpen] = useState(false);
  const [createMode, setCreateMode] = useState<CreateMode>('direct');
  const [tokenSearch, setTokenSearch] = useState('');
  const [directForm, setDirectForm] = useState({
    payer_name: '',
    payer_phone: '',
    payer_email: '',
    amount: '',
    intention_message: '',
  });
  const [processForm, setProcessForm] = useState({
    actualAmount: '',
    receiptNumber: '',
    notes: '',
  });
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<CashIntentionRow | null>(null);
  const [editForm, setEditForm] = useState({
    payer_name: '',
    payer_phone: '',
    amount: '',
    intention_message: '',
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchAllCash();
  }, [fetchAllCash]);

  const openCreate = () => {
    setCreateOpen(true);
    setCreateMode('direct');
    setDirectForm({ payer_name: '', payer_phone: '', payer_email: '', amount: '', intention_message: '' });
    setTokenSearch('');
    setProcessForm({ actualAmount: '', receiptNumber: '', notes: '' });
    setProcessingId(null);
    setHasSearched(false);
    clearSearchResult();
  };

  const handleSearchIntention = async () => {
    if (!tokenSearch.trim()) return;
    setHasSearched(true);
    const row = await searchByToken(tokenSearch);
    if (row) {
      setProcessForm({ actualAmount: String(row.amount ?? ''), receiptNumber: '', notes: '' });
      setProcessingId(row.id);
    } else {
      setProcessingId(null);
    }
  };

  const handleProcessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processingId || !processForm.actualAmount) return;
    const ok = await processIntention(processingId, {
      actual_amount: Number(processForm.actualAmount),
      receipt_number: processForm.receiptNumber.trim() || undefined,
      notes: processForm.notes.trim() || undefined,
    });
    if (ok) {
      setCreateOpen(false);
      setProcessingId(null);
    }
  };

  const handleDirectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directForm.payer_name?.trim() || !directForm.amount || Number(directForm.amount) <= 0) return;
    const res = await createDirect({
      payer_name: directForm.payer_name.trim(),
      payer_phone: directForm.payer_phone.trim() || '',
      payer_email: directForm.payer_email.trim() || undefined,
      amount: Number(directForm.amount),
      intention_message: directForm.intention_message.trim() || undefined,
    });
    if (res) {
      setCreateOpen(false);
      setDirectForm({ payer_name: '', payer_phone: '', payer_email: '', amount: '', intention_message: '' });
    }
  };

  const openEdit = (row: CashIntentionRow) => {
    setEditRow(row);
    setEditForm({
      payer_name: (row.payer_name ?? row.donor_name ?? '').toString(),
      payer_phone: (row.payer_phone ?? row.donor_phone ?? '').toString(),
      amount: String(row.amount ?? ''),
      intention_message: (row.intention_message ?? '').toString(),
    });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editRow) return;
    const ok = await updateDonation(editRow.id, {
      payer_name: editForm.payer_name || undefined,
      payer_phone: editForm.payer_phone || undefined,
      amount: Number(editForm.amount),
      intention_message: editForm.intention_message || undefined,
    });
    if (ok) {
      setEditOpen(false);
      setEditRow(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    const ok = await removeDonation(deleteId);
    if (ok) setDeleteId(null);
  };

  const displayName = (row: CashIntentionRow) => {
    const name = row.payer_name ?? (row as unknown as { donor_name?: string })?.donor_name;
    if (name && String(name).trim()) return name;
    return (row as unknown as { is_anonymous?: boolean })?.is_anonymous ? 'Anonyme' : '—';
  };
  const displayPhone = (row: CashIntentionRow) =>
    row.payer_phone ?? row.donor_phone ?? '—';

  return (
    <div className="mt-12 pt-8 border-t border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Reçus espèces (guichet)</h3>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Création de reçu
        </Button>
      </div>

      {loading && <p className="text-sm text-muted-foreground mb-4">Chargement...</p>}

      <div className="overflow-x-auto bg-card border border-border rounded-lg">
        <table className="w-full table-auto">
          <thead>
            <tr className="text-left">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">Montant</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Intention / Message</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {allCash.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Aucun reçu espèces enregistré.
                </td>
              </tr>
            ) : (
              allCash.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-4 py-3 font-mono text-sm">
                    {row.intention_token ?? '—'}
                  </td>
                  <td className="px-4 py-3">{displayName(row)}</td>
                  <td className="px-4 py-3">{displayPhone(row)}</td>
                  <td className="px-4 py-3">{row.amount != null ? `${row.amount} FCFA` : '—'}</td>
                  <td className="px-4 py-3">
                    {row.created_at
                      ? format(new Date(row.created_at), 'd MMM yyyy HH:mm', { locale: fr })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 max-w-[200px] truncate" title={String(row.intention_message ?? '')}>
                    {row.intention_message ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(row)}>
                        <Pencil className="h-3 w-3 mr-1" />
                        Éditer
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setDeleteId(row.id)}>
                        <Trash2 className="h-3 w-3 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Création de reçu */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg" aria-describedby="create-receipt-desc">
          <DialogHeader>
            <DialogTitle>Création de reçu espèces</DialogTitle>
          </DialogHeader>
          <div id="create-receipt-desc" className="sr-only">
            Formulaire de création de reçu pour paiement en espèces au guichet.
          </div>

          <div className="flex gap-2 mb-4">
            <Button
              variant={createMode === 'direct' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setCreateMode('direct');
                clearSearchResult();
                setProcessingId(null);
              }}
            >
              Nouveau paiement direct
            </Button>
            <Button
              variant={createMode === 'intention' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setCreateMode('intention');
                setTokenSearch('');
                setProcessingId(null);
                setHasSearched(false);
              }}
            >
              Traiter une intention
            </Button>
          </div>

          {createMode === 'direct' ? (
            <form onSubmit={handleDirectSubmit} className="space-y-4">
              <div>
                <Label>Nom *</Label>
                <Input
                  value={directForm.payer_name}
                  onChange={(e) => setDirectForm({ ...directForm, payer_name: e.target.value })}
                  placeholder="Nom du donateur"
                  required
                />
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input
                  value={directForm.payer_phone}
                  onChange={(e) => setDirectForm({ ...directForm, payer_phone: e.target.value })}
                  placeholder="+225..."
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={directForm.payer_email}
                  onChange={(e) => setDirectForm({ ...directForm, payer_email: e.target.value })}
                  placeholder="email@exemple.com"
                />
              </div>
              <div>
                <Label>Montant (FCFA) *</Label>
                <Input
                  type="number"
                  min={1}
                  value={directForm.amount}
                  onChange={(e) => setDirectForm({ ...directForm, amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Message / Intention</Label>
                <Input
                  value={directForm.intention_message}
                  onChange={(e) => setDirectForm({ ...directForm, intention_message: e.target.value })}
                  placeholder="Optionnel"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">Créer le reçu</Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Code intention (ex: INT-20250314-ABCD)"
                    value={tokenSearch}
                    onChange={(e) => setTokenSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchIntention())}
                    className="pl-9"
                  />
                </div>
                <Button type="button" variant="secondary" onClick={handleSearchIntention}>
                  Rechercher
                </Button>
              </div>

              {hasSearched && tokenSearch.trim() && !searchResult && (
                <p className="text-sm text-muted-foreground">Aucune intention trouvée pour ce code.</p>
              )}

              {processingId && searchResult && (
                <form onSubmit={handleProcessSubmit} className="space-y-4">
                  <div className="rounded border p-3 bg-muted/30 text-sm">
                    <div className="font-medium">
                      {displayName(searchResult)} · {displayPhone(searchResult)}
                    </div>
                    <div className="text-muted-foreground">
                      Montant prévu : {searchResult.amount} FCFA
                    </div>
                  </div>
                  <div>
                    <Label>Montant réel reçu (FCFA) *</Label>
                    <Input
                      type="number"
                      min={1}
                      value={processForm.actualAmount}
                      onChange={(e) => setProcessForm({ ...processForm, actualAmount: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Numéro de reçu</Label>
                    <Input
                      value={processForm.receiptNumber}
                      onChange={(e) => setProcessForm({ ...processForm, receiptNumber: e.target.value })}
                      placeholder="REC-2025-001"
                    />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Input
                      value={processForm.notes}
                      onChange={(e) => setProcessForm({ ...processForm, notes: e.target.value })}
                      placeholder="..."
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">Valider et enregistrer le reçu</Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Édition */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent aria-describedby="edit-receipt-desc">
          <DialogHeader>
            <DialogTitle>Éditer le reçu</DialogTitle>
          </DialogHeader>
          <div id="edit-receipt-desc" className="sr-only">
            Formulaire d&apos;édition du reçu espèces.
          </div>
          {editRow && (
            <div className="space-y-4">
              <div>
                <Label>Nom</Label>
                <Input
                  value={editForm.payer_name}
                  onChange={(e) => setEditForm({ ...editForm, payer_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input
                  value={editForm.payer_phone}
                  onChange={(e) => setEditForm({ ...editForm, payer_phone: e.target.value })}
                />
              </div>
              <div>
                <Label>Montant (FCFA)</Label>
                <Input
                  type="number"
                  min={1}
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                />
              </div>
              <div>
                <Label>Message / Intention</Label>
                <Input
                  value={editForm.intention_message}
                  onChange={(e) => setEditForm({ ...editForm, intention_message: e.target.value })}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleEditSave}>Enregistrer</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmation suppression */}
      <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent aria-describedby="delete-confirm-desc">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <div id="delete-confirm-desc" className="sr-only">
            Confirmation de suppression du reçu espèces.
          </div>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Êtes-vous sûr de vouloir supprimer ce reçu ? Cette action ne peut pas être annulée.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteId(null)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                Supprimer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
