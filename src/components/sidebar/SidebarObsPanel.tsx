import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Copy, MonitorPlay, Radio, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useObsMultiStream } from '@/hooks/useObsMultiStream';
import { fetchActiveLiveStream, type LiveStream } from '@/lib/supabase/mediaQueries';
import { supabase } from '@/integrations/supabase/client';

interface SidebarObsPanelProps {
  className?: string;
}

export const SidebarObsPanel: React.FC<SidebarObsPanelProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeStream, setActiveStream] = useState<LiveStream | null>(null);
  const [copied, setCopied] = useState(false);

  const { config, generateObsConfig, getRtmpServer } = useObsMultiStream(activeStream?.id);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const s = await fetchActiveLiveStream();
      if (!mounted) return;
      setActiveStream(s);
      if (s?.id) await generateObsConfig(s.id);
    };

    load();

    const channel = supabase
      .channel('sidebar-obs-live-streams')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_streams' }, () => load())
      .subscribe();

    return () => {
      mounted = false;
      channel.unsubscribe();
    };
  }, [generateObsConfig]);

  const mainStreamConfig = config.streams[0];
  const rtmpServer = useMemo(
    () => (mainStreamConfig ? getRtmpServer(String(mainStreamConfig.provider)) : ''),
    [mainStreamConfig, getRtmpServer]
  );

  if (!activeStream) return null;

  const copyQuickConfig = async () => {
    const key = mainStreamConfig?.streamKey;
    if (!rtmpServer || !key) return;

    const text = `Serveur RTMP: ${rtmpServer}\nStream Key/ID: ${key}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className={`border-t bg-card/50 ${className || ''}`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex w-full items-center justify-between p-3 hover:bg-accent/50 transition-colors">
          <div className="flex items-center gap-2 min-w-0">
            <Radio className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm font-medium truncate">OBS Multi-Stream</span>
            <Badge variant="secondary" className="text-[10px] px-1">
              ACTIF
            </Badge>
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </CollapsibleTrigger>

        <CollapsibleContent>
          <ScrollArea className="max-h-[280px] p-3 pt-0">
            <div className="space-y-3">
              <div className="text-xs font-medium truncate">{activeStream.title}</div>

              <button
                onClick={copyQuickConfig}
                className="w-full text-xs bg-primary/10 hover:bg-primary/20 rounded-md p-2 transition-colors flex items-center justify-between"
                disabled={!rtmpServer || !mainStreamConfig?.streamKey}
                title="Copier la config rapide"
              >
                <span className="flex items-center gap-1">
                  <MonitorPlay className="w-3 h-3" />
                  Config OBS
                </span>
                {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
              </button>

              <div className="space-y-1">
                {config.streams.slice(0, 3).map((s, i) => (
                  <div key={`${s.provider}_${i}`} className="text-xs text-muted-foreground flex items-center justify-between">
                    <span className="capitalize truncate">{String(s.provider)}</span>
                    <Badge variant="outline" className="text-[9px]">
                      RTMP
                    </Badge>
                  </div>
                ))}
                {config.streams.length > 3 ? (
                  <div className="text-[10px] text-center text-muted-foreground">
                    +{config.streams.length - 3} autre(s)
                  </div>
                ) : null}
              </div>

              <div className="text-[10px] text-center text-muted-foreground pt-2 border-t">
                Ouvrez “Streaming” pour la config complète
              </div>
            </div>
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

