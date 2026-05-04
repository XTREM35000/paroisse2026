import React, { useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { RtmpConfig } from '@/hooks/useObsMultiStream';

interface PlatformRtmpCardProps {
  platform: RtmpConfig;
  showStreamKey?: boolean;
}

const providerLabel = (p: string) => (p || 'custom').replace(/_/g, ' ');

const providerGlyph = (provider: string) => {
  const icons: Record<string, string> = {
    youtube: 'YT',
    facebook: 'FB',
    twitch: 'TW',
    tiktok: 'TT',
    instagram: 'IG',
    restream: 'RS',
    'app.restream': 'RS',
    api_video: 'AV',
    radio_stream: 'RAD',
    custom: 'RTMP',
  };
  return icons[provider] || 'RTMP';
};

export const PlatformRtmpCard: React.FC<PlatformRtmpCardProps> = ({ platform, showStreamKey = false }) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  const [revealKey, setRevealKey] = useState(false);

  const canCopy = useMemo(() => typeof navigator !== 'undefined' && !!navigator.clipboard, []);

  const copyToClipboard = async (text: string, label: string) => {
    if (!text) return;
    try {
      if (canCopy) await navigator.clipboard.writeText(text);
      setCopied(label);
      toast({ title: 'Copié', description: `${label} copié dans le presse-papier` });
      window.setTimeout(() => setCopied(null), 1500);
    } catch (e) {
      toast({ title: 'Erreur', description: 'Impossible de copier', variant: 'destructive' });
    }
  };

  return (
    <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-primary/40">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-semibold px-2 py-1 rounded bg-primary/10 text-primary shrink-0">
              {providerGlyph(String(platform.provider))}
            </span>
            <h3 className="font-semibold capitalize text-foreground truncate">
              {providerLabel(String(platform.provider))}
            </h3>
            <Badge variant="secondary" className="text-[10px]">
              RTMP
            </Badge>
          </div>

          {platform.embedUrl ? (
            <a
              href={platform.embedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors shrink-0"
              aria-label="Ouvrir le lien"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          ) : null}
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-semibold uppercase text-muted-foreground mb-1 block">
              Serveur RTMP
            </label>
            <div className="flex gap-2">
              <code className="flex-1 text-xs bg-muted p-2 rounded font-mono break-all">
                {platform.rtmpServer || '—'}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(platform.rtmpServer, 'Serveur RTMP')}
                className="flex-shrink-0"
                disabled={!platform.rtmpServer}
              >
                {copied === 'Serveur RTMP' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
          </div>

          {showStreamKey && (
            <div>
              <label className="text-[10px] font-semibold uppercase text-muted-foreground mb-1 block">
                Identifiant / clé
              </label>
              <div className="flex gap-2">
                <code className="flex-1 text-xs bg-muted p-2 rounded font-mono break-all">
                  {platform.streamKey ? (revealKey ? platform.streamKey : '••••••••••••••') : '—'}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRevealKey((v) => !v)}
                  className="flex-shrink-0"
                  disabled={!platform.streamKey}
                >
                  {revealKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(platform.streamKey, 'Clé')}
                  className="flex-shrink-0"
                  disabled={!platform.streamKey}
                >
                  {copied === 'Clé' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                Remarque: cette valeur est dérivée de vos champs (ID/URL). Les vraies clés RTMP ne sont pas stockées côté site.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

