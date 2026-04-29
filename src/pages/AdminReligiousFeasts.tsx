import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useReligiousFeasts } from '@/hooks/useReligiousFeasts';

export default function AdminReligiousFeasts() {
  const { feasts, refresh, refetch, loading, error } = useReligiousFeasts();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    date: '',
    feast_type: 'fixed',
    gospel_reference: '',
    prayer_text: '',
    reflection_text: '',
  });

  const save = async () => {
    if (!form.name || !form.date) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('religious_feasts').insert([
        {
          name: form.name,
          description: form.description || null,
          date: form.date,
          feast_type: form.feast_type,
          gospel_reference: form.gospel_reference || null,
          prayer_text: form.prayer_text || null,
          reflection_text: form.reflection_text || null,
          is_active: true,
        },
      ]);
      if (error) throw error;
      toast({ title: 'Succes', description: 'Fete enregistree.' });
      setForm({
        name: '',
        description: '',
        date: '',
        feast_type: 'fixed',
        gospel_reference: '',
        prayer_text: '',
        reflection_text: '',
      });
      await refresh();
    } catch (e) {
      toast({
        title: 'Erreur',
        variant: 'destructive',
        description: e instanceof Error ? e.message : 'Erreur de sauvegarde',
      });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('religious_feasts').delete().eq('id', id);
    if (!error) await refresh();
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Admin - Fetes religieuses</h1>

      {error === 'TABLE_MISSING' ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-amber-700">
            La table `religious_feasts` est absente. Exécutez la migration puis rafraîchissez.
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" onClick={() => void refetch()}>
              Rafraîchir
            </Button>
          </div>
        </div>
      ) : null}

      {error && error !== 'TABLE_MISSING' ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <Input placeholder="Nom de la fete" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
        <Input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
        <Input placeholder="Type (fixed ou movable)" value={form.feast_type} onChange={(e) => setForm((p) => ({ ...p, feast_type: e.target.value }))} />
        <Input placeholder="Reference evangile" value={form.gospel_reference} onChange={(e) => setForm((p) => ({ ...p, gospel_reference: e.target.value }))} />
      </div>
      <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
      <Textarea placeholder="Priere" value={form.prayer_text} onChange={(e) => setForm((p) => ({ ...p, prayer_text: e.target.value }))} />
      <Textarea placeholder="Reflexion" value={form.reflection_text} onChange={(e) => setForm((p) => ({ ...p, reflection_text: e.target.value }))} />
      <Button onClick={save} disabled={saving || loading || error === 'TABLE_MISSING'}>
        {saving ? 'Enregistrement...' : 'Ajouter la fete'}
      </Button>

      <div className="space-y-2">
        {feasts.map((f) => (
          <div key={f.id} className="border rounded p-3 flex items-center justify-between gap-3">
            <div>
              <div className="font-medium">{f.name}</div>
              <div className="text-xs text-muted-foreground">{f.date}</div>
            </div>
            <Button variant="destructive" onClick={() => remove(f.id)}>Supprimer</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
