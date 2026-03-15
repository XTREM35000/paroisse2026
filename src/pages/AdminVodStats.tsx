import React from "react";
import { useLocation } from "react-router-dom";
import HeroBanner from "@/components/HeroBanner";
import usePageHero from "@/hooks/usePageHero";
import { StatCard } from "@/components/admin/stats/StatCard";
import { StatsSkeleton } from "@/components/admin/stats/StatsSkeleton";
import useVodStats from "@/hooks/useVodStats";

const AdminVodStats: React.FC = () => {
  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);
  const { stats, loading } = useVodStats(30);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeroBanner
        title="Statistiques VOD"
        subtitle="Performance de vos vidéos à la demande"
        showBackButton={true}
        backgroundImage={hero?.image_url}
        onBgSave={saveHero}
      />

      <main className="flex-1 py-10 lg:py-14">
        <div className="container mx-auto px-4 space-y-8">
          {loading ? (
            <StatsSkeleton />
          ) : stats ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Vidéos (30 jours)" value={stats.totalVideos} />
                <StatCard title="Vues totales" value={stats.totalViews} />
                <StatCard title="Likes totaux" value={stats.totalLikes} />
                <StatCard title="Temps de visionnage" value={`${stats.totalWatchTime} h`} />
              </div>

              {stats.topVideos.length > 0 && (
                <section className="mt-6">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Top 10 des vidéos les plus vues
                  </h2>
                  <div className="rounded-xl border border-border/60 bg-card/60 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/60">
                        <tr>
                          <th className="text-left px-4 py-2">Titre</th>
                          <th className="text-right px-4 py-2">Vues</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.topVideos.map((v) => (
                          <tr key={v.id} className="border-t border-border/40">
                            <td className="px-4 py-2">{v.title}</td>
                            <td className="px-4 py-2 text-right">
                              {v.views_count.toLocaleString("fr-FR")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard title="Vidéos (30 jours)" value={0} subtitle="Aucune vidéo enregistrée sur la période" />
                <StatCard title="Vues totales" value={0} />
                <StatCard title="Likes totaux" value={0} />
              </div>
              <p className="text-sm text-muted-foreground">
                Publiez des vidéos et revenez sur cette page pour visualiser leurs performances.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminVodStats;

