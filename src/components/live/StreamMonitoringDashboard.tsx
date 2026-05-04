import React from 'react';
import { Activity, AlertTriangle, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface StreamMonitoringDashboardProps {
  streamTitle: string;
  isLive: boolean;
  metrics: {
    viewers: number;
    bitrate: number; // kbps
    framerate: number;
    droppedFrames: number;
    uptimeSeconds: number;
  };
}

const formatUptime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const StreamMonitoringDashboard: React.FC<StreamMonitoringDashboardProps> = ({ streamTitle, isLive, metrics }) => {
  const bitratePct = Math.max(0, Math.min(100, (metrics.bitrate / 6000) * 100));

  return (
    <Card className={`mt-6 border-2 ${isLive ? 'border-red-500/40' : 'border-border'}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 min-w-0">
            <Activity className="w-5 h-5" />
            <span className="truncate">Monitoring — {streamTitle || 'Live'}</span>
          </span>
          <Badge variant={isLive ? 'destructive' : 'secondary'}>{isLive ? 'EN DIRECT' : 'OFFLINE'}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" /> Spectateurs
            </div>
            <div className="text-2xl font-bold mt-1">{metrics.viewers}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">Bitrate</div>
            <div className="text-2xl font-bold mt-1">{metrics.bitrate}</div>
            <div className="text-[11px] text-muted-foreground">kbps</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">FPS</div>
            <div className="text-2xl font-bold mt-1">{metrics.framerate}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">Uptime</div>
            <div className="text-lg font-mono mt-2">{formatUptime(metrics.uptimeSeconds)}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Charge bitrate (cible 6000 kbps)</span>
            <span>{Math.round(bitratePct)}%</span>
          </div>
          <Progress value={bitratePct} className="h-2" />
        </div>

        {metrics.droppedFrames > 0 ? (
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/20 p-2 rounded">
            <AlertTriangle className="w-4 h-4" />
            <span>{metrics.droppedFrames} frames perdues (vérifiez la connexion et l’encodeur)</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

