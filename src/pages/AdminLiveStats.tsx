import React from "react";
import Layout from "@/components/Layout";
import HeroBanner from "@/components/HeroBanner";
import { useLocation } from "react-router-dom";
import usePageHero from "@/hooks/usePageHero";
import { StatCard } from "@/components/admin/stats/StatCard";
import { StatsSkeleton } from "@/components/admin/stats/StatsSkeleton";
import useLiveStats from "@/hooks/useLiveStats";
import { fetchActiveLiveStream } from "@/lib/supabase/mediaQueries";

const AdminLiveStats: React.FC = () => {
  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);
  const [liveId, setLiveId] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    fetchActiveLiveStream()
      .then((live) => {
        if (live?.id) setLiveId(live.id);
      })
      .catch(() => {});
  }, []);

  const { stats, loading } = useLiveStats(liveId, 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeroBanner
        title="Statistiques Live"
        subtitle="Vue d'ensemble des performances de vos directs"
        showBackButton={true}
        backgroundImage={hero?.image_url}
        onBgSave={saveHero}
      />

      <main className="flex-1 py-10 lg:py-14">
        <div className="container mx-auto px-4 space-y-8">
          {loading ? (
            <StatsSkeleton />
          ) : stats ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Viewers actuels"
                value={stats.viewers_count}
              />
              <StatCard
                title="Pic de viewers"
                value={stats.peak_viewers}
              />
              <StatCard
                title="Vues totales ce live"
                value={stats.total_views}
              />
              <StatCard
                title="Live ID suivi"
                value={stats.live_id}
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard title="Viewers actuels" value={0} subtitle="Aucun direct actif trouvé" />
                <StatCard title="Pic de viewers" value={0} />
                <StatCard title="Vues totales ce live" value={0} />
              </div>
              <p className="text-sm text-muted-foreground">
                Aucun live actif n'a été détecté. Lancez un direct pour voir les statistiques en temps réel.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminLiveStats;

