import React from "react";
import { useLocation } from "react-router-dom";
import HeroBanner from "@/components/HeroBanner";
import usePageHero from "@/hooks/usePageHero";
import { StatCard } from "@/components/admin/stats/StatCard";
import { StatsSkeleton } from "@/components/admin/stats/StatsSkeleton";
import useFinanceStats from "@/hooks/useFinanceStats";

const AdminFinanceStats: React.FC = () => {
  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);
  const { stats, loading } = useFinanceStats(30);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeroBanner
        title="Statistiques Financières"
        subtitle="Suivi des dons et des contributions"
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
                <StatCard
                  title="Dons mois en cours"
                  value={`${stats.totalThisMonth.toLocaleString("fr-FR")} F`}
                />
                <StatCard
                  title="Total dons année"
                  value={`${stats.totalYear.toLocaleString("fr-FR")} F`}
                />
                <StatCard
                  title="Donateurs uniques"
                  value={stats.uniqueDonors}
                />
                <StatCard
                  title="Don moyen"
                  value={`${stats.averageDonation.toFixed(0)} F`}
                />
              </div>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Répartition par méthode
                  </h2>
                  <div className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-2 text-sm">
                    {Object.keys(stats.byMethod).map((method) => (
                      <div key={method} className="flex items-center justify-between">
                        <span className="capitalize">
                          {method.replace(/_/g, " ")}
                        </span>
                        <span>{stats.byMethod[method].toLocaleString("fr-FR")} F</span>
                      </div>
                    ))}
                    {Object.keys(stats.byMethod).length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Aucune donnée disponible pour cette période.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Répartition par statut
                  </h2>
                  <div className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-2 text-sm">
                    {Object.keys(stats.byStatus).map((status) => (
                      <div key={status} className="flex items-center justify-between">
                        <span className="capitalize">{status}</span>
                        <span>{stats.byStatus[status].toLocaleString("fr-FR")} F</span>
                      </div>
                    ))}
                    {Object.keys(stats.byStatus).length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Aucune donnée disponible pour cette période.
                      </p>
                    )}
                  </div>
                </div>
              </section>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                  title="Dons mois en cours"
                  value="0 F"
                  subtitle="Aucun don complété pour le moment"
                />
                <StatCard
                  title="Total dons année"
                  value="0 F"
                />
                <StatCard
                  title="Donateurs uniques"
                  value={0}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Lorsque des dons seront enregistrés, cette page affichera automatiquement les montants et répartitions.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminFinanceStats;

