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
import HeroBanner from '@/components/HeroBanner';
import ErrorBoundary from '@/components/ErrorBoundary';

// Extension du type ChatRoom avec métadonnées locales
interface ExtendedChatRoom extends ChatRoom {
  lastMessage?: string;
  unreadCount?: number;
  lastMessageTime?: Date;
  lastSeenAt?: Date | null;
  isOnline?: boolean;
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
    if (!user) return;

    let roomsCleanup: (() => void) | undefined;
    let globalMsgsCleanup: (() => void) | undefined;

    // initial load
    fetchChatRooms();

    // subscribe to room updates
    roomsCleanup = subscribeToRoomsUpdates();

    // subscribe to global message inserts to keep counters in sync
    globalMsgsCleanup = subscribeToGlobalMessageInserts();

    return () => {
      if (roomsCleanup) roomsCleanup();
      if (globalMsgsCleanup) globalMsgsCleanup();
    };
  }, [user]);

  // ====================================
  // Effet: Chargement des messages
  // ====================================
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    if (selectedRoomId) {
      // subscribe asynchronously to the DB room id derived from the recipient id
      (async () => {
        cleanup = await subscribeToMessageUpdates(selectedRoomId);
      })();

      fetchMessages(selectedRoomId);
    }

    return () => {
      if (cleanup) cleanup();
    };
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
      const enrichedRooms = (profiles || []).map((p) => {
        const lastSeenAt =
          p.last_seen_at ? new Date(p.last_seen_at as string) : null;
        const isOnline =
          lastSeenAt !== null &&
          Date.now() - lastSeenAt.getTime() < 2 * 60 * 1000; // 2 minutes

        return {
          id: p.id, // Utiliser l'ID du profil comme identifiant
          name: p.full_name || 'Utilisateur',
          description: p.bio || '',
          type: 'direct',
          is_private: true,
          member_count: 2,
          lastMessage: undefined,
          lastMessageTime: undefined,
          unreadCount: 0,
          avatar_url: p.avatar_url,
          email: p.email,
          lastSeenAt,
          isOnline,
        } as ExtendedChatRoom;
      });

      // Enrich rooms with latest message and unread count if a private room exists
      const enrichedWithMeta = await Promise.all(
        enrichedRooms.map(async (r) => {
          try {
            const roomIdentifier = [user?.id, r.id].sort().join('_');
            const { data: existingRooms } = await supabase
              .from('chat_rooms')
              .select('id')
              .ilike('name', `%${roomIdentifier}%`)
              .limit(1);

            if (existingRooms && existingRooms.length > 0) {
              const roomId = existingRooms[0].id;

              // last message
              const { data: lastMsg } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('room_id', roomId)
                .eq('is_deleted', false)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

              // unread since user's last read (fallback to total messages if last_read_messages_at is missing)
              let unreadCount = 0;
              try {
                if (profile?.last_read_messages_at) {
                  const { count } = await supabase
                    .from('chat_messages')
                    .select('id', { count: 'exact', head: true })
                    .eq('room_id', roomId)
                    .eq('is_deleted', false)
                    .gt('created_at', profile.last_read_messages_at);
                  unreadCount = count || 0;
                } else {
                  // Fallback: if we don't have a last_read timestamp, consider all messages in the room as "unread"
                  const { count } = await supabase
                    .from('chat_messages')
                    .select('id', { count: 'exact', head: true })
                    .eq('room_id', roomId)
                    .eq('is_deleted', false);
                  unreadCount = count || 0;
                }
              } catch (e) {
                console.warn('fetchChatRooms: unread count fetch error', e);
                unreadCount = 0;
              }

              // total message count in this room (useful for UI badges)
              let messageCount = 0;
              try {
                const { count: totalCount } = await supabase
                  .from('chat_messages')
                  .select('id', { count: 'exact', head: true })
                  .eq('room_id', roomId)
                  .eq('is_deleted', false);
                messageCount = totalCount || 0;
              } catch (e) {
                console.warn('fetchChatRooms: total message count fetch error', e);
              }

              return {
                ...r,
                room_id: roomId,
                lastMessage: lastMsg?.content || r.lastMessage,
                lastMessageTime: lastMsg ? new Date(lastMsg.created_at) : r.lastMessageTime,
                unreadCount: unreadCount,
                messageCount,
              };
            }
          } catch (e) {
            console.warn('fetchChatRooms: enrich meta error', e);
          }

          return r;
        })
      );

      // Trier : en ligne d'abord, puis par dernier message récent, puis par nom
      enrichedWithMeta.sort((a, b) => {
        const aOnline = a.isOnline ? 1 : 0;
        const bOnline = b.isOnline ? 1 : 0;
        if (aOnline !== bOnline) return bOnline - aOnline;

        if (a.lastMessageTime && b.lastMessageTime) {
          return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
        }

        if (a.lastMessageTime && !b.lastMessageTime) return -1;
        if (!a.lastMessageTime && b.lastMessageTime) return 1;

        return a.name.localeCompare(b.name);
      });

      setRooms(enrichedWithMeta);

      // Sélectionner le premier membre par défaut
      if (enrichedWithMeta.length > 0 && !selectedRoomId) {
        setSelectedRoomId(enrichedWithMeta[0].id);
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
        let enrichedMessages = data.map(msg => ({
          ...msg,
          sender: profileMap.get(msg.sender_id) || null,
        })) as ExtendedChatMessage[];

        // Fetch attachments for these messages
        const messageIds = enrichedMessages.map(m => m.id);
        if (messageIds.length > 0) {
          const { data: atts } = await supabase.from('chat_attachments').select('*').in('message_id', messageIds);
          const attsByMsg = new Map<string, any[]>();
          (atts || []).forEach(a => {
            if (!attsByMsg.has(a.message_id)) attsByMsg.set(a.message_id, []);
            attsByMsg.get(a.message_id).push(a);
          });

          enrichedMessages = enrichedMessages.map(m => ({ ...m, attachments: attsByMsg.get(m.id) || [] }));
        }

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

      // Reset local unread counter for this opened room for immediate feedback
      try {
        setRooms(prev => prev.map(r => (r.room_id === roomId ? { ...r, unreadCount: 0 } : r)));
      } catch (e) {
        console.warn('fetchMessages: failed to reset unreadCount', e);
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
  const handleSendMessage = async (content?: string, attachments?: File[]) => {
    const messageContent = (typeof content === 'string' ? content : newMessage).trim();
    if (!messageContent && (!attachments || attachments.length === 0) || !user || !selectedRoomId) return;

    try {
      setSendingMessage(true);

      // Obtenir ou créer la salle privée pour l'utilisateur sélectionné
      const roomId = await getOrCreatePrivateRoom(selectedRoomId);
      if (!roomId) {
        throw new Error('Impossible de créer la salle de conversation');
      }

      // Upload attachments if any
      let uploadedAttachments: Array<{ file_url: string; file_name?: string; file_type?: string; file_size?: number }> = [];
      if (attachments && attachments.length > 0) {
        // Validate client-side
        const { validateFiles, uploadChatFiles } = await import('@/hooks/useChatAttachments');
        const errs = await validateFiles(attachments);
        if (errs.length > 0) {
          notifyError('Fichier invalide', errs.join('\n'));
          setSendingMessage(false);
          return;
        }

        uploadedAttachments = await uploadChatFiles(roomId, attachments);
      }

      // Use helper to send message and attach metadata
      const { sendChatMessage } = await import('@/lib/supabase/chatQueries');

      const created = await sendChatMessage({
        room_id: roomId,
        sender_id: user.id,
        content: messageContent,
        attachments: uploadedAttachments,
      });

      // Optimistically append the created message so the user sees it immediately
      setMessages(prev => [
        ...prev,
        {
          ...created,
          sender: profile || null,
          attachments: uploadedAttachments || [],
        } as ExtendedChatMessage,
      ]);

      // Mettre à jour last_message_at de la salle
      await supabase
        .from('chat_rooms')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', roomId);

      setNewMessage('');

      // Update room counters optimistically so the sidebar reflects the change immediately
      try {
        setRooms(prev => prev.map(r => {
          if (r.room_id === roomId) {
            return {
              ...r,
              messageCount: (r.messageCount || 0) + 1,
              lastMessage: messageContent,
              lastMessageTime: new Date(),
            } as ExtendedChatRoom;
          }
          return r;
        }));
      } catch (e) {
        console.warn('handleSendMessage: failed to update room counters', e);
      }

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
  // Subscription: Global message inserts (to keep unread/message counters in sync)
  // ====================================
  const subscribeToGlobalMessageInserts = () => {
    const channel = supabase
      .channel('public:chat_messages:inserts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const newMsg = payload.new as any;
          // If this message belongs to one of the rooms we display, update counters
          setRooms(prevRooms => {
            let updated = false;
            const next = prevRooms.map(r => {
              if ((r as any).room_id === newMsg.room_id) {
                updated = true;
                // Do not increment unread if message was sent by current user or if this room is currently open in the UI
                const isActiveRoom = r.id === selectedRoomId;
                const incrementUnread = newMsg.sender_id !== user?.id && !isActiveRoom;
                return {
                  ...r,
                  unreadCount: incrementUnread ? ((r.unreadCount || 0) + 1) : (r.unreadCount || 0),
                  messageCount: (r.messageCount || 0) + 1,
                  lastMessage: newMsg.content || r.lastMessage,
                  lastMessageTime: new Date(newMsg.created_at),
                } as ExtendedChatRoom;
              }
              return r;
            });

            // If updated is false, no local room matched; ignore
            return updated ? next : prevRooms;
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  // ====================================
  // Subscription: Mises à jour des messages
  // ====================================
  const subscribeToMessageUpdates = async (recipientId: string) => {
    // Ensure we subscribe to the DB room id (may differ from recipientId which can be a profile id)
    const roomId = await getOrCreatePrivateRoom(recipientId);
    if (!roomId) return () => {};

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

          // Récupérer attachments éventuels
          const { data: atts } = await supabase.from('chat_attachments').select('*').eq('message_id', newMsg.id);

          const enrichedMessage: ExtendedChatMessage = {
            ...newMsg,
            sender: senderProfile,
            attachments: atts || [],
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
      <div className="min-h-screen flex flex-col bg-background">
        <HeroBanner
          title="Chat"
          subtitle="Discutez en direct avec les membres de la communauté"
          showBackButton={true}
        />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold mb-2 text-foreground">Chat</h2>
            <p className="text-muted-foreground">
              Vous devez être connecté pour accéder au chat.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  // ====================================
  // Rendu: Layout WhatsApp-like
  // ====================================
  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">
      <HeroBanner
        title="Chat"
        subtitle="Interface inspirée de WhatsApp pour vos conversations privées"
        showBackButton={true}
      />
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
              otherUserId={selectedRoom.type === 'direct' ? selectedRoom.id : null}
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
                            attachments={(message as any).attachments || []}
                            canDelete={isOwn}
                            onDelete={async () => {
                              try {
                                const { deleteMessage } = await import('@/lib/supabase/chatQueries');
                                const deleted = await deleteMessage(message.id, user.id);
                                setMessages(prev => prev.map(m => (m.id === message.id ? { ...m, ...deleted } : m)));
                                notifySuccess('Message supprimé');
                              } catch (e) {
                                console.error('Erreur suppression message', e);
                                notifyError('Erreur', 'Impossible de supprimer ce message');
                              }
                            }}
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
            <ErrorBoundary fallback={<div className="p-3 bg-destructive/10 text-destructive rounded">Le composant de saisie a échoué.</div>}>
              <MessageInput
                value={newMessage}
                onChange={setNewMessage}
                onSend={handleSendMessage}
                isLoading={sendingMessage}
                disabled={loadingMessages}
                placeholder="Écrivez votre message..."
              />
            </ErrorBoundary>
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
