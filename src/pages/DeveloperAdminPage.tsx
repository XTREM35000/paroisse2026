import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Building2, Download, Users, Video } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDeveloperAdmin } from '@/hooks/useDeveloperAdmin';
import { ParishCard } from '@/components/developer/ParishCard';
import { CreateParishModal } from '@/components/developer/CreateParishModal';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HeroBanner from '@/components/HeroBanner';

export default function DeveloperAdminPage() {
  const { user, role, loading: authLoading } = useAuth();
  const { parishes, loading, updateParishStatus, deleteParish, createParish } = useDeveloperAdmin();
  const [searchTerm, setSearchTerm] = useState('');

  const metaRole = String((user?.user_metadata as { role?: string } | undefined)?.role || '').toLowerCase();
  const appRole = String((user?.app_metadata as { role?: string } | undefined)?.role || '').toLowerCase();
  const isDeveloper =
    String(role || '').toLowerCase() === 'developer' || metaRole === 'developer' || appRole === 'developer';

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <Skeleton className="mb-8 h-32 w-full" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isDeveloper) {
    return <Navigate to="/unauthorized" replace />;
  }

  const totalParishes = parishes.length;
  const totalMembers = parishes.reduce((sum, parish) => sum + (parish.members_count || 0), 0);
  const totalContent = parishes.reduce((sum, parish) => sum + (parish.content_count || 0), 0);
  const activeParishes = parishes.filter((parish) => parish.is_active).length;

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredParishes = useMemo(() => {
    if (!normalizedSearch) return parishes;
    return parishes.filter(
      (p) =>
        p.nom.toLowerCase().includes(normalizedSearch) || p.slug.toLowerCase().includes(normalizedSearch),
    );
  }, [parishes, normalizedSearch]);

  const exportToCSV = () => {
    const headers = ['Nom', 'Slug', 'Actif', 'Membres', 'Contenus', 'Crée le'];
    const rows = filteredParishes.map((p) => [
      p.nom,
      p.slug,
      p.is_active ? 'Oui' : 'Non',
      String(p.members_count || 0),
      String(p.content_count || 0),
      new Date(p.created_at).toLocaleDateString('fr-FR'),
    ]);

    const escapeCell = (v: string) => {
      const s = String(v ?? '');
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const csv = [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paroisses_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const topByMembers = useMemo(() => {
    return [...parishes]
      .sort((a, b) => (b.members_count || 0) - (a.members_count || 0))
      .slice(0, 5);
  }, [parishes]);

  const topByContent = useMemo(() => {
    return [...parishes]
      .sort((a, b) => (b.content_count || 0) - (a.content_count || 0))
      .slice(0, 5);
  }, [parishes]);

  const maxMembers = Math.max(1, ...topByMembers.map((p) => p.members_count || 0));
  const maxContent = Math.max(1, ...topByContent.map((p) => p.content_count || 0));

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <HeroBanner
          title="Administration des paroisses"
          subtitle="Gestion complete des paroisses de la plateforme pour les developpeurs."
          showBackButton
        />

        <div className="mx-auto max-w-7xl space-y-10 px-4 pb-10 pt-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-end gap-3">
            <CreateParishModal onCreate={createParish} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card className="shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total paroisses</p>
                    <p className="text-3xl font-bold">{totalParishes}</p>
                  </div>
                  <Building2 className="h-10 w-10 text-[#ffb347]" />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Paroisses actives</p>
                    <p className="text-3xl font-bold text-green-600">{activeParishes}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    <span className="text-lg text-green-600">✓</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Membres totaux</p>
                    <p className="text-3xl font-bold">{totalMembers}</p>
                  </div>
                  <Users className="h-10 w-10 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Contenus publies</p>
                    <p className="text-3xl font-bold">{totalContent}</p>
                  </div>
                  <Video className="h-10 w-10 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="list">
            <TabsList className="mb-4">
              <TabsTrigger value="list">Liste</TabsTrigger>
              <TabsTrigger value="stats">Statistiques detaillees</TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              <div className="space-y-6">
                <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-800">Toutes les paroisses</h2>
                    <p className="text-sm text-gray-500">
                      {filteredParishes.length} resultat{filteredParishes.length !== 1 ? 's' : ''} (sur{' '}
                      {totalParishes})
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      placeholder="Rechercher une paroisse..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-md"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
                      onClick={exportToCSV}
                      disabled={filteredParishes.length === 0}
                    >
                      <Download className="h-4 w-4" />
                      Export CSV
                    </Button>
                  </div>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Skeleton key={i} className="h-56 w-full" />
                    ))}
                  </div>
                ) : parishes.length === 0 ? (
                  <Card className="py-12 text-center">
                    <CardContent>
                      <Building2 className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                      <p className="mb-4 text-gray-500">Aucune paroisse n'a encore ete creee</p>
                      <CreateParishModal onCreate={createParish} />
                    </CardContent>
                  </Card>
                ) : filteredParishes.length === 0 ? (
                  <Card className="py-12 text-center">
                    <CardContent>
                      <p className="mb-2 text-gray-700">Aucun resultat pour la recherche.</p>
                      <p className="text-sm text-gray-500">Essayez un autre nom ou un autre slug.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredParishes.map((parish) => (
                      <ParishCard
                        key={parish.id}
                        parish={parish}
                        onToggleStatus={updateParishStatus}
                        onDelete={deleteParish}
                      />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="stats">
              <div className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="mb-4 text-lg font-semibold">Vue globale</div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Actives</span>
                          <span className="font-medium">{activeParishes}</span>
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded bg-muted">
                          <div
                            className="h-full bg-emerald-600"
                            style={{ width: `${(activeParishes / Math.max(1, totalParishes)) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Desactivees</span>
                          <span className="font-medium">{Math.max(0, totalParishes - activeParishes)}</span>
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded bg-muted">
                          <div
                            className="h-full bg-slate-500"
                            style={{
                              width: `${((totalParishes - activeParishes) / Math.max(1, totalParishes)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="mb-4 text-lg font-semibold">Top par membres</div>
                      <div className="space-y-3">
                        {topByMembers.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Aucune donnees.</p>
                        ) : (
                          topByMembers.map((p) => {
                            const v = p.members_count || 0;
                            const pct = (v / maxMembers) * 100;
                            return (
                              <div key={p.id} className="flex items-center gap-3">
                                <div className="w-40 truncate text-sm font-medium">{p.nom}</div>
                                <div className="flex-1">
                                  <div className="h-2 w-full overflow-hidden rounded bg-muted">
                                    <div className="h-full bg-blue-600" style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                                <div className="w-16 text-right text-sm">{v}</div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="mb-4 text-lg font-semibold">Top par contenus</div>
                      <div className="space-y-3">
                        {topByContent.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Aucune donnees.</p>
                        ) : (
                          topByContent.map((p) => {
                            const v = p.content_count || 0;
                            const pct = (v / maxContent) * 100;
                            return (
                              <div key={p.id} className="flex items-center gap-3">
                                <div className="w-40 truncate text-sm font-medium">{p.nom}</div>
                                <div className="flex-1">
                                  <div className="h-2 w-full overflow-hidden rounded bg-muted">
                                    <div className="h-full bg-purple-600" style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                                <div className="w-16 text-right text-sm">{v}</div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
