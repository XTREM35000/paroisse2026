import React from 'react';
import { BarChart3, Users, Flame } from 'lucide-react';

interface ActivityMetricsProps {
  totalUsers?: number;
  activeUsersToday?: number;
  averageSessionDuration?: string;
  isLoading?: boolean;
}

const SimpleBarChart = ({ data, label }: { data: number[]; label: string }) => {
  const max = Math.max(...data);
  const width = 100 / data.length;

  return (
    <div className="bg-card rounded-lg border border-border p-4 mb-4">
      <h4 className="text-sm font-semibold mb-3">{label}</h4>
      <div className="flex items-end justify-between h-20 gap-1">
        {data.map((value, idx) => (
          <div
            key={idx}
            className="flex-1 bg-gradient-to-t from-primary/80 to-primary rounded-t"
            style={{ height: `${(value / max) * 100}%` }}
            title={`Jour ${idx + 1}: ${value}`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">7 derniers jours</p>
    </div>
  );
};

const ActivityMetrics: React.FC<ActivityMetricsProps> = ({
  totalUsers = 0,
  activeUsersToday = 0,
  averageSessionDuration = '12m',
  isLoading = false,
}) => {
  // Données simulées pour les 7 derniers jours (à remplacer par des vraies données)
  const activityData = [45, 52, 48, 61, 55, 67, 70];
  const engagementData = [12, 15, 14, 18, 16, 22, 25];

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Utilisateurs</p>
              <p className="text-2xl font-bold">{totalUsers}</p>
            </div>
            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400 opacity-50" />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Actifs (24h)</p>
              <p className="text-2xl font-bold">{activeUsersToday}</p>
            </div>
            <Flame className="h-6 w-6 text-orange-600 dark:text-orange-400 opacity-50" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-sm font-semibold">Activité du site</h3>
        </div>

        <SimpleBarChart data={activityData} label="Visites par jour" />
        <SimpleBarChart data={engagementData} label="Engagements par jour" />

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 text-xs mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary/80" />
            <span className="text-muted-foreground">Données actuelles</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-muted" />
            <span className="text-muted-foreground">À la même période</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs text-blue-900 dark:text-blue-100">
        <p className="font-semibold mb-1">💡 Astuce</p>
        <p>Les données sont mises à jour toutes les heures. Pour des analyses plus détaillées, consultez la page Analytics.</p>
      </div>
    </div>
  );
};

export default ActivityMetrics;
