import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Users, Heart, Share2, MoreVertical, Send, Trash2 } from "lucide-react";
import HeroBanner from "@/components/HeroBanner";
import { useLocation } from 'react-router-dom';
import usePageHero from '@/hooks/usePageHero';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/hooks/useUser';
import useRoleCheck from '@/hooks/useRoleCheck';
import { useToast } from '@/hooks/use-toast';

function getYouTubeEmbedUrl(input?: string) {
  if (!input) return '';
  // Try to extract a YouTube video id from many common formats
  let id: string | null = null;
  try {
    const url = new URL(input);
    const host = url.hostname.replace('www.', '');
    if (host.includes('youtube.com')) {
      // /embed/ID or v=ID
      if (url.pathname.includes('/embed/')) {
        id = url.pathname.split('/embed/')[1].split('/')[0];
      } else {
        id = url.searchParams.get('v');
      }
    } else if (host === 'youtu.be') {
      id = url.pathname.replace('/', '');
    }
  } catch (e) {
    // not a full URL, fall through to regex
  }

  if (!id) {
    const m = input.match(/(?:v=|v\/|embed\/|youtu\.be\/|watch\?v=)([A-Za-z0-9_-]{11})/);
    if (m) id = m[1];
  }

  if (id) return `https://www.youtube.com/embed/${id}`;
  // If input already looks like an embed URL, return it
  if (input.includes('youtube.com/embed')) return input;
  // As a last resort, assume the whole input is the id
  return `https://www.youtube.com/embed/${input}`;
}
import { useEffectState } from '@/lib/utils';

interface ChatMessage {
  id: string;
  author: string;
  message: string;
  timestamp: Date;
  avatarUrl?: string | null;
  avatarInitials?: string | null;
}

const Live: React.FC = () => {
  // ALL HOOKS FIRST - strict order
  const [isLive, setIsLive] = useState(false);
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [viewerCount, setViewerCount] = useState<number>(0);
  const [duration, setDuration] = useState<string>('00:00:00');

  const location = useLocation();
  const { profile } = useUser();
  const { isAdmin } = useRoleCheck();
  const { toast } = useToast();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);
  const [liveSections, setLiveSections] = useState<Array<any>>([]);

  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [nextLiveAt, setNextLiveAt] = useState<Date | null>(null);

  // Load dynamic sections for live page
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase.from('homepage_sections').select('*').eq('section_key', 'live_sections').maybeSingle();
        if (!mounted) return;
        if (error) throw error;
        if (data && data.content) {
          const parsed = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
          if (Array.isArray(parsed)) setLiveSections(parsed);
        }
      } catch (e) {
        console.error('Could not load live sections', e);
      }
    })();
    return () => { mounted = false };
  }, []);

  // Determine if there is an active live section and compute next scheduled live
  useEffect(() => {
    try {
      const now = new Date();
      let foundActive: any = null;
      let next: Date | null = null;

      for (const sec of liveSections) {
        if (sec.type === 'youtube' && sec.content) {
          // active if explicitly marked or within start/end window
          const isMarkedLive = !!sec.is_live;
          const start = sec.start_time ? new Date(sec.start_time) : null;
          const end = sec.end_time ? new Date(sec.end_time) : null;

          const withinWindow = start && (start <= now) && (!end || end > now);

          if (isMarkedLive || withinWindow) {
            foundActive = sec;
            break;
          }

          // compute next upcoming start
          if (start && start > now) {
            if (!next || start < next) next = start;
          }
        }
      }

      if (foundActive) {
        setIsLive(true);
        setActiveVideoUrl(getYouTubeEmbedUrl(foundActive.content));
        setNextLiveAt(null);
      } else {
        setIsLive(false);
        setActiveVideoUrl(null);
        setNextLiveAt(next);
      }
    } catch (e) {
      console.error('[Live] compute liveSections error', e);
    }
  }, [liveSections]);

  // Fetch messages from Supabase
  const fetchMessages = useCallback(async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, content, sender_id, created_at')
        .order('created_at', { ascending: true })
        .limit(200);

      if (error) throw error;

      const rows = (data || []);
      const senderIds = Array.from(new Set(rows.map((r: any) => r.sender_id).filter(Boolean)));

      // Fetch profiles for all senders to display friendly names
      let profilesMap: Record<string, any> = {};
      if (senderIds.length > 0) {
        try {
          const { data: profs } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url')
            .in('id', senderIds as string[]);
          (profs || []).forEach((p: any) => { profilesMap[p.id] = p; });
        } catch (e) {
          // ignore profile fetch failures, we'll fallback to IDs
        }
      }

      const getInitials = (name?: string) => {
        if (!name) return '';
        return name.split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase();
      };

      const msgs: ChatMessage[] = rows.map((m: any) => {
        const prof = profilesMap[m.sender_id];
        const isMe = profile && m.sender_id === profile.id;
        const author = isMe ? 'Vous' : (prof?.full_name || prof?.username || m.sender_id || 'Invité');
        const avatarUrl = prof?.avatar_url || null;
        const avatarInitials = avatarUrl ? null : (prof?.full_name ? getInitials(prof.full_name) : (prof?.username ? getInitials(prof.username) : ''));
        return {
          id: m.id,
          author,
          message: m.content,
          timestamp: new Date(m.created_at),
          avatarUrl,
          avatarInitials,
        } as ChatMessage;
      });

      setMessages(msgs);
    } catch (e) {
      // silent
    }
  }, [profile]);

  // Polling for messages
  useEffect(() => {
    if (!profile) return;
    fetchMessages();
    const t = setInterval(fetchMessages, 6000);
    return () => clearInterval(t);
  }, [fetchMessages, profile]);

  // Mark messages as read on mount
  useEffect(() => {
    if (!profile) return;
    const markRead = async () => {
      try {
        await supabase
          .from('profiles')
          .update({ last_read_messages_at: new Date().toISOString() })
          .eq('id', profile.id);
      } catch (e) {
        // silent
      }
    };
    markRead();
  }, [profile]);

  // Handlers
  const handleLike = () => {
    setHasLiked(!hasLiked);
    setLikes(hasLiked ? Math.max(0, likes - 1) : likes + 1);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !profile) return;

    try {
      await supabase
        .from('messages')
        .insert([{ content: newMessage.trim(), sender_id: profile.id }]);

      setNewMessage('');
      await supabase
        .from('profiles')
        .update({ last_read_messages_at: new Date().toISOString() })
        .eq('id', profile.id);

      fetchMessages();
    } catch (e) {
      // silent
    }
  };

  const deleteSection = async (index: number) => {
    if (!isAdmin) return;
    try {
      const ok = window.confirm('Supprimer cette section ?');
      if (!ok) return;
      const previous = liveSections;
      const next = previous.filter((_, i) => i !== index);
      setLiveSections(next);

      const payload = {
        section_key: 'live_sections',
        title: 'En Ligne - Sections',
        content: JSON.stringify(next),
        display_order: 0,
        is_active: true,
      };
      const { error } = await supabase.from('homepage_sections').upsert([payload], { onConflict: 'section_key' });
      if (error) {
        setLiveSections(previous);
        console.error('deleteSection error', error);
        toast({ title: 'Erreur', description: 'Impossible de supprimer la section', variant: 'destructive' });
        return;
      }
      toast({ title: 'Supprimé', description: 'Section supprimée' });
    } catch (e) {
      console.error('deleteSection exception', e);
      toast({ title: 'Erreur', description: 'Une erreur est survenue', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <HeroBanner
        title="Messe en direct"
        subtitle="Rejoignez notre communauté pour ce moment de prière"
        backgroundImage={hero?.image_url}
        onBgSave={saveHero}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative w-full bg-black rounded-xl overflow-hidden shadow-2xl"
            >
              <div className="relative aspect-video bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center group">
                <iframe
                  width="100%"
                  height="100%"
                  src={activeVideoUrl ?? "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0"}
                  title="Messe en direct"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0"
                  style={{ border: "none" }}
                />

                {isLive && (
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute top-4 left-4 z-10 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2"
                  >
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    EN DIRECT
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute top-4 right-4 z-10 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  {viewerCount.toLocaleString("fr-FR")} spectateurs
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute bottom-4 right-4 z-10 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded text-xs font-semibold"
                >
                  {duration}
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-xl p-6 border border-border"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    Messe Solennelle du Dimanche
                  </h1>
                  <p className="text-muted-foreground">
                    Rejoignez-nous pour cette messe solennelle en direct. Un moment de prière et de recueillement en famille.
                  </p>
                  {!isLive && nextLiveAt && (
                    <p className="text-sm text-muted-foreground mt-2">Prochain live prévu le {nextLiveAt.toLocaleString('fr-FR')}</p>
                  )}
                  {!isLive && !nextLiveAt && (
                    <p className="text-sm text-muted-foreground mt-2">Aucun live programmé pour le moment.</p>
                  )}
                </div>
                <button className="text-muted-foreground hover:text-foreground transition-colors p-2">
                  <MoreVertical className="w-6 h-6" />
                </button>
              </div>
              {/* Render dynamic live sections if present */}
              {liveSections.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {liveSections.map((sec: any, i: number) => (
                    <div key={i} className="p-4 bg-background rounded border border-border">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold mb-2">{sec.title}</h3>
                        {isAdmin && (
                          <div className="ml-4">
                            <Button variant="ghost" size="icon" onClick={() => deleteSection(i)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </div>
                      {sec.type === 'youtube' && (
                        <div className="relative aspect-video">
                          <iframe
                            src={getYouTubeEmbedUrl(sec.content)}
                            title={sec.title || `video-${i}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute inset-0 w-full h-full"
                          />
                        </div>
                      )}
                      {sec.type === 'image' && sec.content && (
                        <img src={sec.content} alt={sec.title || ''} className="w-full h-auto rounded" />
                      )}
                      {sec.type === 'html' && (
                        <div dangerouslySetInnerHTML={{ __html: sec.content || '' }} />
                      )}
                      {(!sec.type || sec.type === 'text') && (
                        <p className="text-muted-foreground">{sec.content}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4 mb-6 py-4 border-y border-border">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{viewerCount.toLocaleString("fr-FR")}</p>
                    <p className="text-sm text-muted-foreground">Spectateurs en ligne</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{likes.toLocaleString("fr-FR")}</p>
                    <p className="text-sm text-muted-foreground">J&apos;aime</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{messages.length}</p>
                    <p className="text-sm text-muted-foreground">Messages</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={handleLike}
                  variant={hasLiked ? "default" : "outline"}
                  className="flex-1"
                >
                  <Heart className={`w-5 h-5 mr-2 ${hasLiked ? "fill-current" : ""}`} />
                  J&apos;aime
                </Button>
                <Button variant="outline" className="flex-1">
                  <Share2 className="w-5 h-5 mr-2" />
                  Partager
                </Button>
                <Button variant="outline" size="icon">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>

            
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-card rounded-xl border border-border overflow-hidden flex flex-col h-[600px]">
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 border-b border-border flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                <h3 className="font-bold">Chat en direct</h3>
                <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                  {messages.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, idx) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="text-sm space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      {msg.avatarUrl ? (
                        <img src={msg.avatarUrl} alt={msg.author} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">{msg.avatarInitials}</div>
                      )}
                      <span className="font-semibold text-foreground">{msg.author}</span>
                      <span className="text-xs text-muted-foreground">
                        {msg.timestamp.toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-muted-foreground pl-8">{msg.message}</p>
                  </motion.div>
                ))}
              </div>

              <div className="border-t border-border p-3 bg-muted/30 space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Votre message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") handleSendMessage();
                    }}
                    className="text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={handleSendMessage}
                    className="px-3"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Soyez respectueux et bienveillant
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Live;
