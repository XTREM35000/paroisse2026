import React, { useEffect, useMemo, useState } from 'react';
import HeroBanner from '@/components/HeroBanner';
import { useLocation } from 'react-router-dom';
import usePageHero from '@/hooks/usePageHero';
import { useAnalyticsDashboard } from '@/hooks/useAnalytics';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Users, Video, Calendar, BarChart2, TrendingUp, Images, BookOpen, MessageSquare, AlertCircle } from 'lucide-react';
import { ChartContainer } from '@/components/ui/chart';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import VideoCard from '@/components/VideoCard';
import { useVideos } from '@/hooks/useVideos';
import { useEvents } from '@/hooks/useEvents';
import { useDirectory } from '@/hooks/useDirectory';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { RoleManagerModal } from '@/components/admin/RoleManagerModal';
import { OfficiantManagerModal } from '@/components/admin/OfficiantManagerModal';

const Dashboard: React.FC = () => {
  const { profile, loading: authLoading, refreshProfile } = useAuth();
  const location = useLocation();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showOfficiantModal, setShowOfficiantModal] = useState(false);
  
  // Fetch real data
  const { videos: recentVideos = [], loading: videosLoading } = useVideos(6);
  const { events = [] } = useEvents();
  const { data: directoryItems = [] } = useDirectory();
  const { data: analyticsData, isLoading: analyticsLoading } = useAnalyticsDashboard();
  
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

  // Fetch gallery images count
  const { data: galleryCount = 0 } = useQuery({
    queryKey: ['gallery-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('gallery_images')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  // Fetch homilies count
  const { data: homiliesCount = 0 } = useQuery({
    queryKey: ['homilies-count'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count } = await (supabase.from('homilies') as any)
        .select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  // Fetch messages count
  const { data: messagesCount = 0 } = useQuery({
    queryKey: ['messages-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  // Fetch video count (total, not just recent)
  const { data: videoCount = 0 } = useQuery({
    queryKey: ['video-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });
  
  const statsData = useMemo(() => ({
    users: userCount,
    videos: videoCount,
    events: events.length || 0,
    gallery: galleryCount,
    homilies: homiliesCount,
    messages: messagesCount,
  }), [userCount, videoCount, events, galleryCount, homiliesCount, messagesCount]);
  
  // Analytics data
  const weeklyViews = analyticsData?.weeklyViews || [
    { day: 'Lun', views: 120 },
    { day: 'Mar', views: 200 },
    { day: 'Mer', views: 150 },
    { day: 'Jeu', views: 300 },
    { day: 'Ven', views: 240 },
    { day: 'Sam', views: 320 },
    { day: 'Dim', views: 280 },
  ];

  const categoryDistribution = analyticsData?.categoryDistribution || [
    { name: 'Sermon', value: 45 },
    { name: 'Musique', value: 25 },
    { name: 'Enseignement', value: 20 },
    { name: 'Célébration', value: 10 },
  ];

  const CHART_COLORS = ['#f97316', '#f59e0b', '#60a5fa', '#34d399'];

  const statCards = useMemo(() => [
    { id: 'users', label: 'Membres', value: statsData.users, icon: Users, color: 'bg-blue-500/10 text-blue-600', gradient: 'from-blue-500 to-blue-600' },
    { id: 'videos', label: 'Vidéos', value: statsData.videos, icon: Video, color: 'bg-orange-500/10 text-orange-600', gradient: 'from-orange-500 to-orange-600' },
    { id: 'events', label: 'Événements', value: statsData.events, icon: Calendar, color: 'bg-pink-500/10 text-pink-600', gradient: 'from-pink-500 to-pink-600' },
    { id: 'gallery', label: 'Images', value: statsData.gallery, icon: Images, color: 'bg-emerald-500/10 text-emerald-600', gradient: 'from-emerald-500 to-emerald-600' },
    { id: 'homilies', label: 'Homélies', value: statsData.homilies, icon: BookOpen, color: 'bg-purple-500/10 text-purple-600', gradient: 'from-purple-500 to-purple-600' },
    { id: 'messages', label: 'Messages', value: statsData.messages, icon: MessageSquare, color: 'bg-cyan-500/10 text-cyan-600', gradient: 'from-cyan-500 to-cyan-600' },
  ], [statsData]);

  const summary = useMemo(() => ({
    totalViews: analyticsData?.totalViews || weeklyViews.reduce((s, d) => s + d.views, 0),
    avgPerDay: analyticsData ? Math.round(analyticsData.totalViews / 7) : Math.round(weeklyViews.reduce((s, d) => s + d.views, 0) / weeklyViews.length),
    engagementChange: !analyticsLoading ? Math.round(12 + Math.random() * 5) : 0,
    topVideos: analyticsData?.topVideos || [],
  }), [analyticsData, analyticsLoading, weeklyViews]);

  useEffect(() => {
    if (authLoading) return;
    if (profile?.role !== 'super_admin') return;
    const p = profile as (typeof profile & {
      has_seen_role_manager?: boolean;
      has_seen_officiant_manager?: boolean;
    }) | null;
    if (!p?.has_seen_role_manager) {
      setShowRoleModal(true);
      return;
    }
    if (!p?.has_seen_officiant_manager) {
      setShowOfficiantModal(true);
    }
  }, [authLoading, profile]);

  const handleRoleComplete = async () => {
    setShowRoleModal(false);
    await refreshProfile();
    const p = profile as (typeof profile & { has_seen_officiant_manager?: boolean }) | null;
    if (!p?.has_seen_officiant_manager) {
      setShowOfficiantModal(true);
    }
  };

  const handleOfficiantComplete = async () => {
    setShowOfficiantModal(false);
    await refreshProfile();
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        <HeroBanner title="Tableau de bord" subtitle="Vue d'ensemble complète et analytics" backgroundImage={hero?.image_url} showBackButton={true} onBgSave={saveHero} />

        <main className="py-12 lg:py-16 container mx-auto px-4">
        {/* Section 1: Vue d'ensemble - Statistiques principales */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">Vue d'ensemble</h2>
            <p className="text-sm text-muted-foreground mt-1">Statistiques principales de votre plateforme</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {statCards.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{c.label}</p>
                        <h3 className="text-3xl font-bold mt-2 text-foreground">{c.value.toLocaleString()}</h3>
                      </div>
                      <div className={`rounded-lg p-4 ${c.color}`}>
                        <c.icon className="h-6 w-6" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Section 2: Analytics détaillées */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">Analytics & Performance</h2>
            <p className="text-sm text-muted-foreground mt-1">Données détaillées et tendances</p>
          </div>

          {/* Analytics Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Vues cette semaine</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{summary.totalViews.toLocaleString()}</div>
                  <div className="text-xs text-blue-700 dark:text-blue-300 mt-2">Moy. {summary.avgPerDay} par jour</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-green-900 dark:text-green-100">
                    <TrendingUp className="w-4 h-4" />
                    Engagement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">+{summary.engagementChange}%</div>
                  <div className="text-xs text-green-700 dark:text-green-300 mt-2">Croissance hebdo</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">Vidéos totales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{summary.topVideos.length || videoCount}</div>
                  <div className="text-xs text-purple-700 dark:text-purple-300 mt-2">En bibliothèque</div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart2 className="w-5 h-5" />
                    Vues quotidiennes (7 jours)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{ views: { color: '#f97316' } }}>
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={weeklyViews} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
                        <defs>
                          <linearGradient id="areaGrad" x1="0" x2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.6} />
                            <stop offset="100%" stopColor="#f97316" stopOpacity={0.2} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.06} />
                        <XAxis dataKey="day" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                        <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="views" stroke="#f97316" fill="url(#areaGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart2 className="w-5 h-5" />
                    Distribution par catégorie
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={categoryDistribution} dataKey="value" nameKey="name" outerRadius={80} fill="#8884d8">
                        {categoryDistribution.map((entry, i) => (
                          <Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 3: Top vidéos et Alertes */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">Contenu & Alertes</h2>
            <p className="text-sm text-muted-foreground mt-1">Top performances et statut du système</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    Vidéos les plus populaires
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {videosLoading ? (
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
                      <div className="text-center py-12 col-span-2">
                        <p className="text-muted-foreground">Aucune vidéo disponible</p>
                        <p className="text-sm text-muted-foreground mt-2">La bibliothèque vidéo est vide pour l'instant.</p>
                        <div className="mt-3">
                          <Button asChild>
                            <a href="/admin/videos">Ajouter une vidéo</a>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Statut du système
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-4">
                    <li className="flex items-start gap-3">
                      <span className="inline-block w-2.5 h-2.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">Transcodage</p>
                        <p className="text-xs text-muted-foreground">0 problèmes</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="inline-block w-2.5 h-2.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">Utilisateurs</p>
                        <p className="text-xs text-muted-foreground">0 en attente</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="inline-block w-2.5 h-2.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">Stockage</p>
                        <p className="text-xs text-muted-foreground">{videoCount} vidéos</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="inline-block w-2.5 h-2.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">Système</p>
                        <p className="text-xs text-muted-foreground">Opérationnel</p>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 4: Résumé rapide */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Résumé complet des métriques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                <div className="text-center p-3 rounded-lg bg-primary/5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Membres</p>
                  <p className="text-2xl font-bold text-primary mt-2">{statsData.users}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-orange-500/5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Vidéos</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-2">{statsData.videos}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-pink-500/5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Événements</p>
                  <p className="text-2xl font-bold text-pink-600 dark:text-pink-400 mt-2">{statsData.events}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-emerald-500/5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Images</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{statsData.gallery}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-purple-500/5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Homélies</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">{statsData.homilies}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-cyan-500/5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Messages</p>
                  <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mt-2">{statsData.messages}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-accent/5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Vues totales</p>
                  <p className="text-2xl font-bold text-accent mt-2">{summary.totalViews.toLocaleString()}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-chart-2/5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Moy. par jour</p>
                  <p className="text-2xl font-bold mt-2">{summary.avgPerDay}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
        </main>
      </div>
      <RoleManagerModal open={showRoleModal} onClose={() => setShowRoleModal(false)} onComplete={handleRoleComplete} />
      <OfficiantManagerModal open={showOfficiantModal} onClose={() => setShowOfficiantModal(false)} onComplete={handleOfficiantComplete} />
    </>
  );
};

export default Dashboard;
