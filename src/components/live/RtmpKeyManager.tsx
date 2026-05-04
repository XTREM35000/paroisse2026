import React, { useMemo, useState } from 'react';
import { AlertCircle, Eye, EyeOff, KeyRound, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { saveRtmpKey } from '@/lib/supabase/rtmpQueries';

interface RtmpKeyManagerProps {
  liveStreamId: string;
  provider: string;
  hasKey: boolean;
  onSaved?: () => void;
}

export const RtmpKeyManager: React.FC<RtmpKeyManagerProps> = ({ liveStreamId, provider, hasKey, onSaved }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [streamKey, setStreamKey] = useState('');
  const [expiresInDays, setExpiresInDays] = useState<number>(0);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);

  const expiresAt = useMemo(() => {
    if (!expiresInDays || expiresInDays <= 0) return null;
    return new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();
  }, [expiresInDays]);

  const handleSave = async () => {
    if (!streamKey.trim()) return;
    setSaving(true);
    try {
      await saveRtmpKey({
        liveStreamId,
        provider,
        plainKey: streamKey.trim(),
        expiresAt,
      });
      toast({ title: 'Clé enregistrée', description: `Clé ${provider} sauvegardée (chiffrée)` });
      setOpen(false);
      setStreamKey('');
      setExpiresInDays(0);
      onSaved?.();
    } catch (e) {
      console.error(e);
      toast({ title: 'Erreur', description: 'Impossible d’enregistrer la clé', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <KeyRound className="w-4 h-4 mr-2" />
          {hasKey ? 'Remplacer la clé' : 'Ajouter une clé'}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clé RTMP — {provider}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Stream key</Label>
            <div className="flex gap-2">
              <Input
                type={showKey ? 'text' : 'password'}
                value={streamKey}
                onChange={(e) => setStreamKey(e.target.value)}
                placeholder="Collez la clé RTMP fournie par la plateforme"
                autoComplete="off"
              />
              <Button type="button" variant="outline" size="icon" onClick={() => setShowKey((v) => !v)}>
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Cette clé est chiffrée avant stockage. Ne la partagez jamais.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Expiration (jours)</Label>
              <Input
                type="number"
                min={0}
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(Number(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">0 = pas d’expiration</p>
            </div>
            <div className="space-y-2">
              <Label>Valide jusqu’au</Label>
              <Input type="text" readOnly value={expiresAt ? new Date(expiresAt).toLocaleString('fr-FR') : '—'} />
            </div>
          </div>

          <Card className="bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-3 text-xs">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="text-amber-800 dark:text-amber-200">
                  Recommandé “production”: déplacer le chiffrement côté serveur (Edge Function) avec un secret Supabase.
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving || !streamKey.trim()}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

