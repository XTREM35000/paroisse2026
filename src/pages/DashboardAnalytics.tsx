import React, { useMemo } from 'react';
import HeroBanner from '@/components/HeroBanner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ChartContainer } from '@/components/ui/chart';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { useVideos } from '@/hooks/useVideos';
import VideoCard from '@/components/VideoCard';

const weeklyViews = [
  { day: 'Lun', views: 120 },
  { day: 'Mar', views: 200 },
  { day: 'Mer', views: 150 },
  { day: 'Jeu', views: 300 },
  { day: 'Ven', views: 240 },
  { day: 'Sam', views: 320 },
  { day: 'Dim', views: 280 },
];

const categoryDistribution = [
  { name: 'Sermon', value: 45 },
  { name: 'Musique', value: 25 },
  { name: 'Enseignement', value: 20 },
  { name: 'Célébration', value: 10 },
];

const COLORS = ['#f97316', '#f59e0b', '#60a5fa', '#34d399'];

const DashboardAnalytics: React.FC = () => {
  const { videos: recentVideos = [], loading: videosLoading } = useVideos(6);

  const summary = useMemo(() => ({
    totalViews: weeklyViews.reduce((s, d) => s + d.views, 0),
    avgPerDay: Math.round(weeklyViews.reduce((s, d) => s + d.views, 0) / weeklyViews.length),
  }), []);

  return (
    <div className="min-h-screen bg-background">
      <HeroBanner title="Analytics" subtitle="Rapports et graphiques" backgroundImage="/images/events/bapteme.png" showBackButton={false} />

      <main className="py-12 lg:py-16 container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle>Vues cette semaine</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold mb-2">{summary.totalViews.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Moyenne par jour : {summary.avgPerDay}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle>Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">+12%</div>
                <div className="text-sm text-muted-foreground">Croissance vs semaine précédente</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle>Vidéos totales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{recentVideos.length}</div>
                <div className="text-sm text-muted-foreground">Vidéos récupérées</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Vues quotidiennes</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ views: { color: '#f97316' } }}>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={weeklyViews} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.06} />
                      <XAxis dataKey="day" tick={{ fill: 'var(--muted-foreground)' }} />
                      <YAxis tick={{ fill: 'var(--muted-foreground)' }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="views" stroke="#f97316" strokeWidth={3} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Répartition par catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={categoryDistribution} dataKey="value" nameKey="name" outerRadius={90} fill="#8884d8" label />
                    {categoryDistribution.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Top vidéos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {videosLoading && recentVideos.length === 0 ? (
                    <p className="text-muted-foreground">Chargement...</p>
                  ) : recentVideos.length > 0 ? (
                    recentVideos.map((v: any) => (
                      <VideoCard
                        key={v.id}
                        id={v.id}
                        title={v.title}
                        description={v.description}
                        thumbnail={v.thumbnail_url || '/images/videos/default-thumbnail.jpg'}
                        duration={v.duration ? `${Math.floor(v.duration / 60)}:${String(v.duration % 60).padStart(2,'0')}` : '0:00'}
                        views={v.views}
                        category={v.category}
                        date={v.created_at ? new Date(v.created_at).toLocaleDateString('fr-FR') : ''}
                      />
                    ))
                  ) : (
                    <p className="text-muted-foreground">Aucune vidéo</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Alertes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>Problèmes de transcoding: 0</li>
                  <li>Utilisateurs en attente de validation: 3</li>
                  <li>Espace disque libre faible: 58% restant</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardAnalytics;
