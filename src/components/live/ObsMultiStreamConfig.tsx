import React, { useEffect, useState } from 'react';
import { Download, Power, PowerOff, Radio, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useObsMultiStream } from '@/hooks/useObsMultiStream';
import { PlatformRtmpCard } from './PlatformRtmpCard';
import { useObsMultiStreamPro } from '@/hooks/useObsMultiStreamPro';
import { RtmpKeyManager } from '@/components/live/RtmpKeyManager';
import { StreamMonitoringDashboard } from '@/components/live/StreamMonitoringDashboard';
import { saveRtmpKey } from '@/lib/supabase/rtmpQueries';

interface ObsMultiStreamConfigProps {
  liveStreamId: string;
  streamTitle: string;
  isActive?: boolean;
}

export const ObsMultiStreamConfig: React.FC<ObsMultiStreamConfigProps> = ({
  liveStreamId,
  streamTitle,
  isActive = false,
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'platforms'>('config');
  const [exportFormat, setExportFormat] = useState<'json' | 'xml' | 'txt'>('json');

  const { config, loading, generateObsConfig, exportObsConfig, connectObsWebSocket, startObsStream, stopObsStream } =
    useObsMultiStream(liveStreamId);

  const {
    loading: proLoading,
    config: proConfig,
    generateObsConfig: generateProConfig,
    startProStream,
    stopProStream,
    hasMissingKeys,
  } = useObsMultiStreamPro(liveStreamId);

  useEffect(() => {
    if (liveStreamId) generateObsConfig(liveStreamId);
  }, [liveStreamId, generateObsConfig]);

  if (loading || proLoading) {
    return (
      <Card className="mt-6">
        <CardContent className="p-6 space-y-3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasStreams = config.streams.length > 0;

  return (
    <Card className="mt-6 shadow-sm border-t-4 border-t-primary">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Radio className="w-5 h-5 text-primary" />
              OBS Multi-Stream
              {isActive ? (
                <Badge variant="default" className="ml-2 bg-green-600">
                  EN DIRECT
                </Badge>
              ) : null}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {streamTitle ? `Diffusion: “${streamTitle}”` : 'Diffusion'}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => connectObsWebSocket()}
            className={config.obsWebSocketConnected ? 'bg-green-50 border-green-300 dark:bg-green-950/30' : ''}
          >
            {config.obsWebSocketConnected ? (
              <>
                <Wifi className="w-3 h-3 mr-1 text-green-600" />
                OBS connecté
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 mr-1" />
                Connecter OBS
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="platforms">Plateformes</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4">
            {!hasStreams ? (
              <Alert>
                <AlertDescription>Aucune plateforme détectée pour ce live.</AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={() => exportObsConfig(exportFormat)} className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Exporter la configuration
                    </Button>
                    <select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value as any)}
                      className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="json">JSON</option>
                      <option value="xml">XML</option>
                      <option value="txt">TXT</option>
                    </select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Vous pouvez importer ces valeurs dans votre configuration OBS / plugins multi-RTMP.
                  </p>
                </div>

                {/* Session tracking + (placeholder) metrics */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={startProStream} className="flex-1 bg-red-600 hover:bg-red-700" disabled={proConfig.isLive}>
                    <Power className="w-4 h-4 mr-2" />
                    Démarrer (session)
                  </Button>
                  <Button onClick={() => stopProStream()} className="flex-1" variant="outline" disabled={!proConfig.isLive}>
                    <PowerOff className="w-4 h-4 mr-2" />
                    Arrêter (session)
                  </Button>
                </div>

                {config.obsWebSocketConnected ? (
                  <div className="flex gap-3 p-3 bg-secondary/20 rounded-lg">
                    <Button onClick={startObsStream} className="flex-1 bg-green-600 hover:bg-green-700">
                      <Power className="w-4 h-4 mr-2" />
                      Démarrer
                    </Button>
                    <Button onClick={stopObsStream} variant="destructive" className="flex-1">
                      <PowerOff className="w-4 h-4 mr-2" />
                      Arrêter
                    </Button>
                  </div>
                ) : null}

                {proConfig.isLive ? (
                  <StreamMonitoringDashboard
                    streamTitle={streamTitle}
                    isLive={proConfig.isLive}
                    metrics={{
                      viewers: proConfig.metrics.viewers,
                      bitrate: proConfig.metrics.bitrate,
                      framerate: proConfig.metrics.framerate,
                      droppedFrames: proConfig.metrics.droppedFrames,
                      uptimeSeconds: proConfig.metrics.uptimeSeconds,
                    }}
                  />
                ) : null}

                {hasMissingKeys ? (
                  <Alert>
                    <AlertDescription>
                      Certaines plateformes n’ont pas de clé RTMP enregistrée. Ajoutez-les dans l’onglet “Plateformes”.
                    </AlertDescription>
                  </Alert>
                ) : null}
              </>
            )}
          </TabsContent>

          <TabsContent value="platforms" className="space-y-4">
            {config.streams.length === 0 ? (
              <Alert>
                <AlertDescription>Aucune plateforme configurée.</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {config.streams.map((platform, idx) => (
                    <PlatformRtmpCard key={`${platform.provider}_${idx}`} platform={platform} showStreamKey />
                  ))}
                </div>

                <div className="rounded-lg border border-border bg-card p-4">
                  <h4 className="font-semibold mb-2">Clés RTMP (réelles)</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Les clés RTMP sont stockées chiffrées (table `rtmp_keys`). Seuls les admins y ont accès via RLS.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {proConfig.streams.map((s) => (
                      <RtmpKeyManager
                        key={s.provider}
                        liveStreamId={liveStreamId}
                        provider={s.provider}
                        hasKey={!!s.streamKey}
                        onSaved={() => generateProConfig(liveStreamId)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

