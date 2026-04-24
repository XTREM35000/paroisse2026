import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Trash2 } from 'lucide-react';
import type { OfficiantRow } from '@/types/culte';
import { getOfficiantTitleDescription, useOfficiantTitles } from '@/hooks/useOfficiantTitles';
import {
  deleteOfficiant,
  fetchDailyOfficiant,
  listAllOfficiantsAdmin,
  setDailyOfficiant,
  upsertOfficiant,
} from '@/lib/supabase/culteApi';

type OfficiantsAdminProps = {
  paroisseId: string;
};

export default function OfficiantsAdmin({ paroisseId }: OfficiantsAdminProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { ensureTitles, titles: canonicalTitles } = useOfficiantTitles(paroisseId);

  const [officiants, setOfficiants] = useState<OfficiantRow[]>([]);
  const [titleFilter, setTitleFilter] = useState<string>('__all');

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [dailyOfficiantId, setDailyOfficiantId] = useState<string | null>(null);

  const [form, setForm] = useState({
    id: '' as string,
    name: '',
    title: '',
    description: '',
    bio: '',
    photo_url: '',
    is_active: true,
    sort_order: 0,
  });

  const resetForm = () => {
    setForm({
      id: '',
      name: '',
      title: '',
      description: '',
      bio: '',
      photo_url: '',
      is_active: true,
      sort_order: 0,
    });
  };

  useEffect(() => {
    void ensureTitles();
  }, [ensureTitles]);

  const refresh = async () => {
    setLoading(true);
    try {
      const offs = await listAllOfficiantsAdmin(paroisseId);
      setOfficiants(offs);

      const day = await fetchDailyOfficiant(paroisseId, selectedDate);
      setDailyOfficiantId(day.officiant?.id ?? null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: 'Erreur', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paroisseId, selectedDate]);

  const handleEdit = (o: OfficiantRow) => {
    setForm({
      id: o.id,
      name: o.name,
      title: o.title ?? '',
      description: o.description ?? '',
      bio: o.bio ?? '',
      photo_url: o.photo_url ?? '',
      is_active: o.is_active,
      sort_order: o.sort_order ?? o.display_order ?? 0,
    });
  };

  const titleOptions = useMemo(() => {
    const existingTitles = officiants
      .map((o) => o.title)
      .filter((t): t is string => Boolean(t && t.trim()))
      .map((t) => t.trim());
    const extraCurrent = form.title?.trim() ? [form.title.trim()] : [];
    const all = Array.from(new Set([...canonicalTitles, ...existingTitles, ...extraCurrent]));
    return all;
  }, [canonicalTitles, officiants, form.title]);

  const filteredOfficiants = useMemo(() => {
    if (titleFilter === '__all') return officiants;
    if (titleFilter === '__none') return officiants.filter((o) => !o.title);
    return officiants.filter((o) => (o.title ?? '') === titleFilter);
  }, [officiants, titleFilter]);

  const handleSaveOfficiant = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Nom requis', description: 'Veuillez saisir un nom d’officiant.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await upsertOfficiant({
        paroisse_id: paroisseId,
        id: form.id || undefined,
        name: form.name.trim(),
        title: form.title.trim() || null,
        description: form.description.trim() || null,
        bio: form.bio.trim() || null,
        photo_url: form.photo_url.trim() || null,
        is_active: form.is_active,
        sort_order: Number(form.sort_order) || 0,
      });
      toast({ title: 'Officiant enregistré' });
      resetForm();
      await refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: 'Erreur', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (officiantId: string) => {
    if (!confirm('Supprimer cet officiant ?')) return;
    setLoading(true);
    try {
      await deleteOfficiant(officiantId);
      toast({ title: 'Officiant supprimé' });
      await refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: 'Erreur', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSetDaily = async () => {
    setLoading(true);
    try {
      await setDailyOfficiant(paroisseId, selectedDate, dailyOfficiantId);
      toast({ title: 'Officiant du jour mis à jour' });
      await refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: 'Erreur', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin — Officiants</CardTitle>
          <CardDescription>CRUD + officiant du jour (utilisé automatiquement dans les formulaires).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold mb-3">Liste des officiants</h3>
                <div className="mb-3 grid gap-2 sm:grid-cols-2">
                  <Select value={titleFilter} onValueChange={setTitleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrer par titre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all">Tous les titres</SelectItem>
                      <SelectItem value="__none">Sans titre</SelectItem>
                      {titleOptions.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-2">
                  {filteredOfficiants.map((o) => (
                    <div key={o.id} className="flex items-start justify-between gap-3 rounded-lg border p-3 bg-background/50">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{o.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {o.title ? `${o.title} · ` : ''}#{o.sort_order ?? o.display_order ?? 0} {o.is_active ? '· Actif' : '· Inactif'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => handleEdit(o)}>
                          Modifier
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => void handleDelete(o.id)} disabled={loading}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filteredOfficiants.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Aucun officiant.</div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold mb-3">{form.id ? 'Modifier un officiant' : 'Ajouter un officiant'}</h3>
                <div className="grid gap-3">
                  <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nom" />
                  <Select
                    value={form.title || '__none'}
                    onValueChange={(v) => {
                      const nextTitle = v === '__none' ? '' : v;
                      setForm((p) => {
                        const prevSuggestion = p.title ? getOfficiantTitleDescription(p.title) : null;
                        const nextSuggestion = nextTitle ? getOfficiantTitleDescription(nextTitle) : null;
                        const shouldAutofill = !p.description.trim() || (prevSuggestion && p.description.trim() === prevSuggestion.trim());
                        return {
                          ...p,
                          title: nextTitle,
                          description: shouldAutofill ? (nextSuggestion ?? p.description) : p.description,
                        };
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Titre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">— Aucun —</SelectItem>
                      {titleOptions.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Description (pré-remplie automatiquement selon le titre, modifiable)"
                    rows={3}
                  />
                  <Input value={form.photo_url} onChange={(e) => setForm((p) => ({ ...p, photo_url: e.target.value }))} placeholder="URL photo (optionnel)" />
                  <Textarea value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} placeholder="Bio (optionnel)" rows={3} />

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={form.is_active}
                      onCheckedChange={(c) => setForm((p) => ({ ...p, is_active: c === true }))}
                      id="off-active"
                    />
                    <label htmlFor="off-active" className="text-sm font-medium cursor-pointer">
                      Actif
                    </label>
                  </div>

                  <Input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value) }))}
                    placeholder="Ordre d'affichage"
                  />

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={resetForm} disabled={loading}>
                      Annuler
                    </Button>
                    <Button type="button" onClick={() => void handleSaveOfficiant()} disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Enregistrer
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <h3 className="text-sm font-semibold">Officiant du jour</h3>
                <div className="grid gap-3">
                  <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                  <Select
                    value={dailyOfficiantId ?? '__none'}
                    onValueChange={(v) => setDailyOfficiantId(v === '__none' ? null : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un officiant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">— Aucun —</SelectItem>
                      {officiants.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.name}
                          {o.title ? ` (${o.title})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={() => void handleSetDaily()} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Appliquer
                  </Button>
                  <Textarea
                    value={`L’officiant d’office visible dans les formulaires dépend de cette configuration pour la date ${selectedDate}.`}
                    readOnly
                    rows={3}
                    className="bg-muted/30"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

