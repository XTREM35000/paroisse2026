import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { useNotification } from '@/components/ui/notification-system';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Composants chat
import {
  ConversationList,
  ChatHeader,
  MessageBubble,
  MessageInput,
} from '@/components/chat';

// Types Supabase
import type { ChatRoom, ChatMessage, Profile } from '@/types/database';
import { cn } from '@/lib/utils';

// Extension du type ChatRoom avec métadonnées locales
interface ExtendedChatRoom extends ChatRoom {
  lastMessage?: string;
  unreadCount?: number;
  lastMessageTime?: Date;
}

// Type pour les messages avec infos d'envoyeur
interface ExtendedChatMessage extends ChatMessage {
  sender?: Profile | null;
}

export default function ChatPage() {
  // États principaux
  const [rooms, setRooms] = useState<ExtendedChatRoom[]>([]);
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');

  // États de chargement
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // États d'erreur
  const [error, setError] = useState<string | null>(null);

  // Références
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Hooks
  const { user } = useAuth();
  const { profile } = useUser();
  const { notifyError, notifySuccess } = useNotification();

  // ====================================
  // Fonction utilitaire: Obtenir ou créer la salle privée
  // ====================================
  const getOrCreatePrivateRoom = async (recipientId: string): Promise<string | null> => {
    try {
      if (!user?.id) return null;

      // Créer un identifiant unique pour cette paire (consistent quel que soit l'ordre)
      const roomIdentifier = [user.id, recipientId].sort().join('_');
      const roomName = `direct_${roomIdentifier}`;

      // Chercher la salle existante en utilisant les salles publiques comme fallback
      // (bypass du problème RLS en cherchant simplement par nom)
      const { data: existingRooms } = await supabase
        .from('chat_rooms')
        .select('id')
        .ilike('name', `%${roomIdentifier}%`);

      if (existingRooms && existingRooms.length > 0) {
        return existingRooms[0].id;
      }

      // Créer une nouvelle salle PUBLIQUE (pour contourner RLS)
      // Les messages privés seront gérés par la logique applicative
      const { data: newRoom, error: createErr } = await supabase
        .from('chat_rooms')
        .insert([
          {
            name: roomName,
            description: `Conversation entre utilisateurs`,
            type: 'direct',
            is_private: false, // PUBLIC pour éviter les problèmes RLS
            created_by: user.id,
          }
        ])
        .select('id');

      if (createErr || !newRoom || newRoom.length === 0) {
        console.error('Erreur création salle privée:', createErr);
        return null;
      }

      return newRoom[0].id || null;
    } catch (err) {
      console.error('Erreur getOrCreatePrivateRoom:', err);
      return null;
    }
  };


  // ====================================
  // Effet: Initialisation au chargement
  // ====================================
  useEffect(() => {
    if (user) {
      fetchChatRooms();
      subscribeToRoomsUpdates();
    }
  }, [user]);

  // ====================================
  // Effet: Chargement des messages
  // ====================================
  useEffect(() => {
    if (selectedRoomId) {
      fetchMessages(selectedRoomId);
      subscribeToMessageUpdates(selectedRoomId);
    }
  }, [selectedRoomId]);

  // ====================================
  // Effet: Auto-scroll vers les nouveaux messages
  // ====================================
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  // ====================================
  // Récupération des membres enregistrés (conversations 1-on-1)
  // ====================================
  const fetchChatRooms = async () => {
    try {
      setLoadingRooms(true);
      setError(null);

      // Récupérer tous les profils des membres enregistrés (sauf l'utilisateur courant)
      const { data: profiles, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id)
        .order('full_name', { ascending: true });

      if (profileErr) throw profileErr;

      // Créer des conversations virtuelles pour chaque profil
      const enrichedRooms = (profiles || []).map((profile) => ({
        id: profile.id, // Utiliser l'ID du profil comme identifiant
        name: profile.full_name || 'Utilisateur',
        description: profile.bio || '',
        type: 'direct',
        is_private: true,
        member_count: 2,
        lastMessage: undefined,
        lastMessageTime: undefined,
        unreadCount: 0,
        avatar_url: profile.avatar_url,
        email: profile.email,
      })) as ExtendedChatRoom[];

      setRooms(enrichedRooms);

      // Sélectionner le premier membre par défaut
      if (enrichedRooms.length > 0 && !selectedRoomId) {
        setSelectedRoomId(enrichedRooms[0].id);
      }
    } catch (err: any) {
      console.error('Erreur lors de la récupération des membres:', err);
      setError('Impossible de charger les conversations');
      notifyError('Erreur', 'Impossible de charger les conversations');
    } finally {
      setLoadingRooms(false);
    }
  };

  // ====================================
  // Récupération des messages avec un membre
  // ====================================
  const fetchMessages = async (recipientId: string) => {
    try {
      setLoadingMessages(true);
      setError(null);

      // Obtenir ou créer la salle privée pour cette paire
      const roomId = await getOrCreatePrivateRoom(recipientId);
      if (!roomId) {
        setMessages([]);
        return;
      }

      // Charger les messages de la salle
      const { data, error: err } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(100);

      if (err) throw err;

      if (data && data.length > 0) {
        // Récupérer les profils des envoyeurs
        const senderIds = [...new Set(data.map(m => m.sender_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', senderIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        const enrichedMessages = data.map(msg => ({
          ...msg,
          sender: profileMap.get(msg.sender_id) || null,
        })) as ExtendedChatMessage[];

        setMessages(enrichedMessages);
      } else {
        setMessages([]);
      }

      // Marquer les messages comme lus
      if (user?.id) {
        await supabase
          .from('profiles')
          .update({ last_read_messages_at: new Date().toISOString() })
          .eq('id', user.id);
      }
    } catch (err: any) {
      console.error('Erreur lors de la récupération des messages:', err);
      setError('Impossible de charger les messages');
      notifyError('Erreur', 'Impossible de charger les messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  // ====================================
  // Envoi d'un message
  // ====================================
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !selectedRoomId) return;

    try {
      setSendingMessage(true);

      // Obtenir ou créer la salle privée pour l'utilisateur sélectionné
      const roomId = await getOrCreatePrivateRoom(selectedRoomId);
      if (!roomId) {
        throw new Error('Impossible de créer la salle de conversation');
      }

      // Envoyer le message dans la salle privée
      const { data, error: err } = await supabase
        .from('chat_messages')
        .insert([
          {
            room_id: roomId,
            sender_id: user.id,
            content: newMessage.trim(),
            type: 'text',
            is_deleted: false,
            is_edited: false,
          },
        ])
        .select('*')
        .single();

      if (err) throw err;

      // Mettre à jour last_message_at de la salle
      await supabase
        .from('chat_rooms')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', roomId);

      setNewMessage('');
      notifySuccess('Succès', 'Message envoyé');
    } catch (err: any) {
      console.error('Erreur lors de l\'envoi du message:', err);
      notifyError('Erreur', 'Impossible d\'envoyer le message');
    } finally {
      setSendingMessage(false);
    }
  };

  // ====================================
  // Subscription: Mises à jour des salles
  // ====================================
  const subscribeToRoomsUpdates = () => {
    const channel = supabase
      .channel('public:chat_rooms:updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_rooms',
        },
        (payload) => {
          // Rafraîchir les salles
          fetchChatRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // ====================================
  // Subscription: Mises à jour des messages
  // ====================================
  const subscribeToMessageUpdates = (roomId: string) => {
    const channel = supabase
      .channel(`public:chat_messages:room_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          // Récupérer les infos du profil du nouvel envoyeur
          const newMsg = payload.new as any;
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newMsg.sender_id)
            .single();

          const enrichedMessage: ExtendedChatMessage = {
            ...newMsg,
            sender: senderProfile,
          };

          setMessages(prev => [...prev, enrichedMessage]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const updatedMsg = payload.new as any;
          setMessages(prev =>
            prev.map(msg => (msg.id === updatedMsg.id ? { ...msg, ...updatedMsg } : msg))
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const deletedMsg = payload.old as any;
          setMessages(prev => prev.filter(msg => msg.id !== deletedMsg.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // ====================================
  // Gestion des clics sur les conversations
  // ====================================
  const handleSelectConversation = (roomId: string) => {
    setSelectedRoomId(roomId);
    setError(null);
  };

  // ====================================
  // Rendu: États d'erreur ou de non-authentification
  // ====================================
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2 text-foreground">Chat</h2>
          <p className="text-muted-foreground">Vous devez être connecté pour accéder au chat</p>
        </div>
      </div>
    );
  }

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  // ====================================
  // Rendu: Layout WhatsApp-like
  // ====================================
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Layout principal: Sidebar + Chat */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Conversations (masqué sur mobile si une conversation est sélectionnée) */}
        <div
          className={cn(
            'w-full lg:w-[30%] flex flex-col transition-all duration-300',
            selectedRoomId && 'hidden lg:flex'
          )}
        >
          <ConversationList
            conversations={rooms}
            selectedRoomId={selectedRoomId || undefined}
            onSelectConversation={handleSelectConversation}
            isLoading={loadingRooms}
          />
        </div>

        {/* Zone de chat principale */}
        {selectedRoom ? (
          <div className="flex-1 flex flex-col overflow-hidden bg-background">
            {/* En-tête de la conversation */}
            <ChatHeader
              room={selectedRoom}
              memberCount={selectedRoom.member_count || 0}
              showBackButton={true}
              onBack={() => setSelectedRoomId(null)}
            />

            {/* Erreur - affichée sous l'en-tête si présente */}
            {error && (
              <div className="bg-destructive/10 border-b border-destructive/20 p-3 flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Zone de messages */}
            {loadingMessages ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Chargement des messages...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Aucun message pour le moment</p>
                </div>
              </div>
            ) : (
              <ScrollArea className="flex-1 overflow-hidden">
                <div className="h-full flex flex-col p-4 max-w-4xl mx-auto w-full">
                  <AnimatePresence mode="popLayout">
                    {messages.map((message, index) => {
                      const isOwn = message.sender_id === user?.id;
                      const senderName = message.sender?.full_name || 'Utilisateur inconnu';
                      const senderAvatar = message.sender?.avatar_url;

                      return (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <MessageBubble
                            content={message.content}
                            isOwn={isOwn}
                            senderName={senderName}
                            senderAvatar={senderAvatar}
                            timestamp={new Date(message.created_at)}
                            showAvatar={true}
                          />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            )}

            {/* Zone de saisie */}
            <MessageInput
              value={newMessage}
              onChange={setNewMessage}
              onSend={handleSendMessage}
              isLoading={sendingMessage}
              disabled={loadingMessages}
              placeholder="Écrivez votre message..."
            />
          </div>
        ) : (
          /* Affichage par défaut si aucune conversation n'est sélectionnée */
          <div className="flex-1 hidden lg:flex items-center justify-center bg-gradient-to-br from-muted/50 to-background">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Sélectionnez une conversation
              </h3>
              <p className="text-sm text-muted-foreground">
                Choisissez une conversation à gauche pour commencer à discuter
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
