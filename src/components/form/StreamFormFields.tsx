import React, { useCallback } from 'react';
import { Clipboard } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PROVIDER_REGISTRY } from '@/lib/providers/registry/ProviderRegistry';
import type { ProviderType } from '@/lib/providers/types';

type FormData = {
  title: string;
  stream_url: string;
  embed_html: string;
  hls_url: string;
  audio_url?: string;
  stream_type: 'tv' | 'radio';
  provider: ProviderType;
  is_active: boolean;
  scheduled_at: string;
};

interface Props {
  provider: ProviderType;
  formData: FormData;
  onChange: (field: keyof FormData, value: FormData[keyof FormData]) => void;
}

function StreamFormFieldsComponent({ provider, formData, onChange }: Props) {
  const { toast } = useToast();
  
  // Get provider capabilities
  const capability = PROVIDER_REGISTRY[provider];
  const supportsUrl = capability?.inputFormats.includes('url') ?? true;
  const supportsHls = capability?.inputFormats.includes('hls') ?? false;
  const supportsAudio = capability?.inputFormats.includes('audio') ?? false;
  const supportsEmbed = capability?.inputFormats.includes('embed') ?? true;

  // Memoized paste handler to avoid recreation
  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onChange('stream_url', text);
        toast({
          title: 'Succès',
          description: 'URL collée depuis le presse-papiers',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Presse-papiers vide',
          description: 'Aucun texte détecté',
          variant: 'default',
        });
      }
    } catch (e) {
      console.error('clipboard read failed', e);
      toast({
        title: 'Erreur',
        description: 'Impossible de lire le presse-papiers',
        variant: 'destructive',
      });
    }
  }, [onChange, toast]);

  return (
    <div className="md:col-span-2 space-y-3">
      {(supportsUrl || supportsAudio) && (
        <div className="space-y-1">
          <Label htmlFor="stream_url">
            {supportsAudio && !supportsUrl ? 'URL Audio' : 'URL / Entrée brute'}
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="stream_url"
              placeholder={capability?.example || 'URL, ID YouTube ou embed'}
              value={formData.stream_url}
              onChange={(e) => onChange('stream_url', e.target.value)}
              className="flex-1"
            />
            <button
              type="button"
              onClick={handlePaste}
              aria-label="Coller depuis le presse-papiers"
              className="inline-flex items-center justify-center rounded border border-border bg-muted/30 p-2 text-muted-foreground hover:bg-muted transition-colors"
            >
              <Clipboard className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {supportsAudio
              ? 'Collez une URL audio (MP3, M3U8, AAC)'
              : 'Collez une URL, un ID YouTube ou un embed HTML'}
          </p>
        </div>
      )}

      {(supportsHls || supportsEmbed) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {supportsHls && (
            <div>
              <Label htmlFor="hls_url">URL HLS</Label>
              <Input
                id="hls_url"
                placeholder="https://.../live.m3u8"
                value={formData.hls_url}
                onChange={(e) => onChange('hls_url', e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">Format: .m3u8 ou .m3u</p>
            </div>
          )}
          {supportsEmbed && (
            <div>
              <Label htmlFor="embed_html">Embed HTML</Label>
              <Input
                id="embed_html"
                placeholder='&lt;iframe src="..."&gt;&lt;/iframe&gt;'
                value={formData.embed_html}
                onChange={(e) => onChange('embed_html', e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">Code iframe du lecteur</p>
            </div>
          )}
        </div>
      )}

      {supportsAudio && (
        <div>
          <Label htmlFor="audio_url">URL Audio (optionnel)</Label>
          <Input
            id="audio_url"
            placeholder="https://.../stream.mp3 ou /live.m3u8"
            value={formData.audio_url || ''}
            onChange={(e) => onChange('audio_url', e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">Format: MP3, AAC, M3U8</p>
        </div>
      )}

      {capability?.example && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded p-2">
          <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">
            💡 Exemple pour {capability.label}:
          </p>
          <p className="text-xs text-blue-800 dark:text-blue-200 mt-1 break-all">
            {capability.example}
          </p>
        </div>
      )}
    </div>
  );
}

// Memoize to prevent re-renders when parent re-renders
export const StreamFormFields = React.memo(StreamFormFieldsComponent);
