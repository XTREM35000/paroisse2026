import { Button } from '@/components/ui/button';
import FeastCalendarView from '@/components/religious-feasts/FeastCalendarView';
import FeastNotificationBanner from '@/components/religious-feasts/FeastNotificationBanner';
import { useReligiousFeasts } from '@/hooks/useReligiousFeasts';
import { buildMonthFeastsIcs, downloadIcsFile } from '@/lib/religiousFeastsIcs';

export default function ReligiousFeastsCalendar() {
  const { feasts, loading, error, monthDate, setMonthDate, refetch } = useReligiousFeasts();

  const goMonth = (offset: number) => {
    const next = new Date(monthDate);
    next.setMonth(next.getMonth() + offset);
    setMonthDate(next);
  };

  const nextFeast = feasts[0];
  const monthLabel = monthDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const monthSlug = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;

  const downloadMonthIcs = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const ics = buildMonthFeastsIcs(feasts, origin);
    downloadIcsFile(`fetes-religieuses-${monthSlug}.ics`, ics);
  };

  if (error === 'TABLE_MISSING') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-6 text-center">
          <p className="text-amber-700">Configuration des fêtes religieuses en cours...</p>
          <Button variant="outline" className="mt-4" onClick={() => void refetch()}>
            Rafraîchir
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Fêtes religieuses</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => goMonth(-1)}>Mois précédent</Button>
          <Button variant="outline" onClick={() => goMonth(1)}>Mois suivant</Button>
          <Button variant="secondary" onClick={downloadMonthIcs} disabled={!feasts.length}>
            Télécharger le mois (.ics)
          </Button>
        </div>
      </div>

      <p className="text-muted-foreground capitalize">{monthLabel}</p>
      <FeastNotificationBanner nextFeast={nextFeast} />

      {loading ? <div>Chargement...</div> : null}
      {error ? <div className="text-destructive">{error}</div> : null}
      {!loading && !error ? <FeastCalendarView feasts={feasts} /> : null}
    </div>
  );
}
