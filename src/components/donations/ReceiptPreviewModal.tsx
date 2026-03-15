import { useState, useEffect } from 'react';
import { Printer, MessageCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

export interface ReceiptDonation {
  id: string;
  payer_name?: string | null;
  payer_phone?: string | null;
  payer_email?: string | null;
  donor_phone?: string | null;
  amount: number;
  currency?: string | null;
  payment_method?: string | null;
  payment_status?: string | null;
  intention_token?: string | null;
  receipt_number?: string | null;
  intention_message?: string | null;
  created_at?: string | null;
  metadata?: Record<string, unknown> | null;
}

function getDisplayCode(row: ReceiptDonation): { code: string; isPaid: boolean } {
  const paid = row.payment_status === 'completed';
  const token = row.intention_token || '';
  const receiptNum = row.receipt_number || '';
  const method = row.payment_method || '';
  const created = (row as { created_at?: string }).created_at;
  const datePart = created ? new Date(created).toISOString().slice(0, 10).replace(/-/g, '') : new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const shortId = (row.id || '').slice(-6).toUpperCase();

  if (method === 'cash') {
    if (paid && receiptNum) {
      return { code: receiptNum.startsWith('PAIE') ? receiptNum : `PAIE_${receiptNum}`, isPaid: true };
    }
    if (paid && token) {
      return { code: `PAIE_${token.replace(/^INT-?/, '').replace(/-/g, '_')}`, isPaid: true };
    }
    return { code: token || 'INT_', isPaid: false };
  }
  if (method === 'stripe') {
    return { code: `CARTE_${datePart}_${shortId}`, isPaid: !!paid };
  }
  if (method === 'cinetpay') {
    return { code: `MOBILE_${datePart}_${shortId}`, isPaid: !!paid };
  }
  const txRef = (row as { transaction_id?: string; transaction_ref?: string }).transaction_id
    || (row as { transaction_id?: string; transaction_ref?: string }).transaction_ref
    || row.id?.slice(-8) || 'REC';
  return { code: paid ? `PAIE_${txRef}` : String(txRef), isPaid: !!paid };
}

function getPaymentMethodLabel(method?: string | null): string {
  switch (method) {
    case 'stripe': return 'Carte bancaire (Visa/Mastercard)';
    case 'cinetpay': return 'Mobile Money (MTN/Orange/Moov/Wave)';
    case 'cash': return 'Espèces (Guichet)';
    default: return method || '—';
  }
}

function getDisplayName(row: ReceiptDonation): string {
  const name = row.payer_name ?? (row as unknown as { donor_name?: string })?.donor_name;
  if (name && String(name).trim()) return String(name);
  return (row as unknown as { is_anonymous?: boolean })?.is_anonymous ? 'Anonyme' : '—';
}

interface HeaderConfig {
  logo_url: string | null;
  logo_alt_text: string | null;
  main_title: string | null;
  subtitle: string | null;
}

interface ReceiptPreviewModalProps {
  open: boolean;
  onClose: () => void;
  donation: ReceiptDonation | null;
  responsableCaisse?: string;
}

export default function ReceiptPreviewModal({
  open,
  onClose,
  donation,
  responsableCaisse = 'Responsable caisse',
}: ReceiptPreviewModalProps) {
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      try {
        const { data } = await (supabase as any)
          .from('header_config')
          .select('logo_url, logo_alt_text, main_title, subtitle')
          .eq('is_active', true)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        setHeaderConfig(data || { logo_url: null, logo_alt_text: 'Logo', main_title: 'Paroisse Notre Dame', subtitle: 'de la Compassion' });
      } catch {
        setHeaderConfig({ logo_url: null, logo_alt_text: 'Logo', main_title: 'Paroisse Notre Dame', subtitle: 'de la Compassion' });
      }
    };
    load();
  }, [open]);

  if (!donation) return null;

  const { code, isPaid } = getDisplayCode(donation);
  const displayName = getDisplayName(donation);
  const phone = donation.payer_phone ?? donation.donor_phone ?? '';
  const datePaid = donation.created_at ? format(new Date(donation.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr }) : '—';
  const paymentMethodLabel = getPaymentMethodLabel(donation.payment_method);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ title: 'Erreur', description: "Veuillez autoriser les fenêtres popup pour l'impression.", variant: 'destructive' });
      return;
    }
    const today = format(new Date(), 'd MMMM yyyy', { locale: fr });
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Reçu de don - ${code}</title>
  <style>
    @page { margin: 15mm 20mm; size: A4; }
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; font-size: 12pt; }
    .header { display: flex; align-items: flex-start; margin-bottom: 25px; border-bottom: 2px solid #15803d; padding-bottom: 15px; }
    .logo { max-height: 70px; max-width: 100px; object-fit: contain; margin-right: 20px; }
    .title-block { flex: 1; }
    .main-title { font-size: 22pt; color: #15803d; margin: 0 0 4px 0; font-weight: bold; }
    .subtitle { font-size: 14pt; color: #16a34a; margin: 0; font-style: italic; }
    .doc-title { font-size: 18pt; color: #15803d; margin-top: 15px; font-weight: 600; }
    .receipt-body { margin-top: 25px; padding: 20px; background: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0; }
    .row { display: flex; margin: 10px 0; }
    .label { font-weight: 600; min-width: 140px; color: #15803d; }
    .code-badge { display: inline-block; padding: 6px 14px; background: ${isPaid ? '#15803d' : '#ca8a04'}; color: white; border-radius: 6px; font-weight: bold; font-size: 14pt; margin: 10px 0; }
    .footer { margin-top: 35px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 10pt; color: #6b7280; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    ${headerConfig?.logo_url ? `<img src="${headerConfig.logo_url}" alt="${headerConfig.logo_alt_text || 'Logo'}" class="logo" />` : ''}
    <div class="title-block">
      <h1 class="main-title">${headerConfig?.main_title || 'Paroisse Notre Dame'}</h1>
      ${headerConfig?.subtitle ? `<p class="subtitle">${headerConfig.subtitle}</p>` : ''}
      <p class="doc-title">Reçu de don</p>
    </div>
  </div>
  <div class="receipt-body">
    <div class="code-badge">${code} – ${isPaid ? 'PAYÉ' : 'INTENTION'}</div>
    <div class="row"><span class="label">Mode de paiement :</span> ${paymentMethodLabel}</div>
    <div class="row"><span class="label">Donateur :</span> ${displayName}</div>
    ${phone ? `<div class="row"><span class="label">Téléphone :</span> ${phone}</div>` : ''}
    <div class="row"><span class="label">Montant :</span> ${donation.amount.toLocaleString('fr-FR')} ${donation.currency || 'FCFA'}</div>
    <div class="row"><span class="label">Date :</span> ${datePaid}</div>
    ${donation.intention_message ? `<div class="row"><span class="label">Message :</span> ${donation.intention_message}</div>` : ''}
    <div class="row" style="margin-top: 20px;"><span class="label">Responsable caisse :</span> ${responsableCaisse}</div>
  </div>
  <div class="footer">
    Imprimé le ${today} – Ce document atteste du don effectué.
  </div>
</body>
</html>`;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 350);
  };

  const handleSms = () => {
    const phoneNum = phone.replace(/\D/g, '');
    const text = `Reçu don: ${code} - ${donation.amount.toLocaleString('fr-FR')} FCFA - ${datePaid}. Paroisse Notre Dame de la Compassion.`;
    const smsUrl = phoneNum
      ? `sms:${phoneNum.startsWith('+') ? phoneNum : `+${phoneNum}`}?body=${encodeURIComponent(text)}`
      : null;
    if (smsUrl) {
      window.location.href = smsUrl;
      toast({ title: 'SMS', description: 'Application SMS ouverte' });
    } else {
      navigator.clipboard.writeText(text);
      toast({ title: 'Copié', description: 'Texte du reçu copié dans le presse-papiers. Collez-le dans votre application SMS.' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" aria-describedby="receipt-preview-desc">
        <DialogHeader>
          <DialogTitle>Reçu de don</DialogTitle>
        </DialogHeader>
        <div id="receipt-preview-desc" className="space-y-4">
          <div className="flex items-center gap-3 border-b pb-4">
            {headerConfig?.logo_url && (
              <img src={headerConfig.logo_url} alt={headerConfig.logo_alt_text || 'Logo'} className="h-14 w-auto object-contain" />
            )}
            <div>
              <p className="font-semibold text-foreground">{headerConfig?.main_title || 'Paroisse Notre Dame'}</p>
              <p className="text-sm text-muted-foreground">{headerConfig?.subtitle || 'de la Compassion'}</p>
            </div>
          </div>
          <div
            className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold ${
              isPaid ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
            }`}
          >
            {code} – {isPaid ? 'PAYÉ' : 'INTENTION'}
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Mode de paiement</dt>
              <dd className="font-medium">{paymentMethodLabel}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Donateur</dt>
              <dd className="font-medium">{displayName}</dd>
            </div>
            {phone && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Téléphone</dt>
                <dd>{phone}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Montant</dt>
              <dd className="font-bold">{donation.amount.toLocaleString('fr-FR')} {donation.currency || 'FCFA'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Date</dt>
              <dd>{datePaid}</dd>
            </div>
            {donation.intention_message && (
              <div>
                <dt className="text-muted-foreground mb-1">Message</dt>
                <dd className="text-muted-foreground">{donation.intention_message}</dd>
              </div>
            )}
            <div className="flex justify-between pt-2">
              <dt className="text-muted-foreground">Responsable caisse</dt>
              <dd>{responsableCaisse}</dd>
            </div>
          </dl>
          <div className="flex gap-2 pt-4">
            <Button onClick={handlePrint} className="flex-1">
              <Printer className="h-4 w-4 mr-2" />
              Imprimer
            </Button>
            <Button variant="outline" onClick={handleSms} className="flex-1">
              <MessageCircle className="h-4 w-4 mr-2" />
              Envoyer par SMS
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
