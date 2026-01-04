import React, { useMemo } from 'react';
import HeroBanner from '@/components/HeroBanner';
import { useLocation } from 'react-router-dom';
import usePageHero from '@/hooks/usePageHero';
import { useAnalyticsDashboard } from '@/hooks/useAnalytics';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Users, Video, Calendar, BarChart2, TrendingUp } from 'lucide-react';
import { ChartContainer } from '@/components/ui/chart';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import VideoCard from '@/components/VideoCard';
import { useVideos } from '@/hooks/useVideos';
import { useEvents } from '@/hooks/useEvents';
import { useDirectory } from '@/hooks/useDirectory';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Dashboard: React.FC = () => {
  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);
  
  // Fetch real data
  const { videos: recentVideos = [], loading: videosLoading } = useVideos(4);
  const { events = [] } = useEvents();
  const { data: directoryItems = [] } = useDirectory();
  const { data: analyticsData } = useAnalyticsDashboard();
  
  // Fetch user count
  const { data: userCount = 0 } = useQuery({
    queryKey: ['user-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });
  
  const statsData = useMemo(() => ({
    users: userCount,
    videos: recentVideos.length || 0,
    events: events.length || 0,
    storage_gb: 42,
  }), [userCount, recentVideos.length, events.length]);
  
  const activityMock = analyticsData?.weeklyViews || [
    { day: 'Lun', views: 120 },
    { day: 'Mar', views: 200 },
    { day: 'Mer', views: 150 },
    { day: 'Jeu', views: 300 },
    { day: 'Ven', views: 240 },
    { day: 'Sam', views: 320 },
    { day: 'Dim', views: 280 },
  ];

  const statCards = useMemo(() => [
    { id: 'users', label: 'Membres', value: statsData.users, icon: Users, color: 'bg-primary/10 text-primary' },
    { id: 'videos', label: 'Vidéos', value: statsData.videos, icon: Video, color: 'bg-gold/10 text-gold' },
    { id: 'events', label: 'Événements', value: statsData.events, icon: Calendar, color: 'bg-accent/10 text-accent' },
    { id: 'storage', label: 'Stockage (GB)', value: statsData.storage_gb, icon: BarChart2, color: 'bg-muted/10 text-muted-foreground' },
  ], []);

  return (
    <div className="min-h-screen bg-background">
      <HeroBanner title="Tableau de bord" subtitle="Vue d'ensemble et statistiques" backgroundImage={hero?.image_url || '/images/videos/celebration.png'} showBackButton={true} onBgSave={saveHero} />

      <main className="py-12 lg:py-16 container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {statCards.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{c.label}</p>
                        <h3 className="text-2xl font-semibold">{c.value.toLocaleString()}</h3>
                      </div>
                      <div className={`rounded-lg p-3 ${c.color}`}>
                        <c.icon className="h-6 w-6" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <Card>
              <CardHeader>
                <CardTitle>Activité des vues (7 jours)</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ views: { color: 'linear-gradient(90deg,#f59e0b,#f97316)' } }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={activityMock} margin={{ top: 0, right: 8, left: -8, bottom: 0 }}>
                      <defs>
                        <linearGradient id="grad" x1="0" x2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="#f97316" stopOpacity={0.2} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.06} />
                      <XAxis dataKey="day" tick={{ fill: 'var(--muted-foreground)' }} />
                      <YAxis tick={{ fill: 'var(--muted-foreground)' }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="views" stroke="#f97316" fill="url(#grad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Récents</CardTitle>
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
                    <p className="text-muted-foreground">Aucune vidéo récente</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Résumé rapide
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-center justify-between">
                    <span>Membres:</span>
                    <strong className="text-foreground">{statsData.users}</strong>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Vidéos:</span>
                    <strong className="text-foreground">{statsData.videos}</strong>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Événements:</span>
                    <strong className="text-foreground">{statsData.events}</strong>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Total vues:</span>
                    <strong className="text-foreground">{analyticsData?.totalViews?.toLocaleString() || 0}</strong>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
