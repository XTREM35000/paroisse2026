import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Users, Heart, Share2, MoreVertical, Send } from "lucide-react";
import HeroBanner from "@/components/HeroBanner";
import { useLocation } from 'react-router-dom';
import usePageHero from '@/hooks/usePageHero';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/hooks/useUser';

interface ChatMessage {
  id: string;
  author: string;
  message: string;
  timestamp: Date;
  avatar?: string;
}

const Live: React.FC = () => {
  // ALL HOOKS FIRST - strict order
  const [isLive] = useState(true);
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [viewerCount, setViewerCount] = useState<number>(0);
  const [duration, setDuration] = useState<string>('00:00:00');

  const location = useLocation();
  const { profile } = useUser();
  const { data: hero, save: saveHero } = usePageHero(location.pathname);

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

      const msgs: ChatMessage[] = (data || []).map((m) => ({
        id: m.id,
        author: m.sender_id === profile.id ? 'Vous' : (m.sender_id || 'Invité'),
        message: m.content,
        timestamp: new Date(m.created_at),
      }));

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

  return (
    <div className="min-h-screen bg-background">
      <HeroBanner
        title="Messe en direct"
        subtitle="Rejoignez notre communauté pour ce moment de prière"
        backgroundImage={hero?.image_url || '/images/gallery/prieres.png'}
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
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0"
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
                </div>
                <button className="text-muted-foreground hover:text-foreground transition-colors p-2">
                  <MoreVertical className="w-6 h-6" />
                </button>
              </div>

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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-xl p-6 border border-border space-y-4"
            >
              <h2 className="text-xl font-bold">À propos de cet événement</h2>
              <p className="text-muted-foreground leading-relaxed">
                Cette messe solennelle marque un moment important de notre vie spirituelle en communauté.
                Nous vous invitons à vous joindre à nous pour ce temps de prière et de recueillement,
                que vous soyez présent physiquement dans notre église ou en ligne depuis chez vous.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Lieu</p>
                  <p className="font-semibold">Église Saint-Jean, Paris</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Horaire</p>
                  <p className="font-semibold">10:00 - 11:30</p>
                </div>
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
                      <span className="text-lg">{msg.avatar}</span>
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
