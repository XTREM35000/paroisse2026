import React, { useEffect, useState, useRef } from 'react';
import { ChatHeader, MessageBubble, MessageInput } from '@/components/chat';
import ErrorBoundary from '@/components/ErrorBoundary';
import { fetchChatMessages, sendChatMessage, subscribeToChatMessages, joinChatRoom } from '@/lib/supabase/chatQueries';
import { getOrCreateLiveChatRoom } from '@/lib/supabase/mediaQueries';
import type { ChatMessage, ChatRoom } from '@/types/database';
import { useAuthContext } from '@/hooks/useAuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
  liveId: string;
  title?: string;
}

const LiveChatSidebar: React.FC<Props> = ({ liveId, title }) => {
  const { user } = useAuthContext();
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let mounted = true;

    (async () => {
      try {
        const r = await getOrCreateLiveChatRoom(liveId, title, user?.id);
        if (!mounted) return;
        setRoom(r as ChatRoom | null);

        if (!r) {
          // No room available for unauthenticated users — stop here and let UI show a prompt
          setLoading(false);
          return;
        }

        // If user is authenticated, attempt to join the room so policies allow reading/sending messages
        if (user?.id) {
          try {
            await joinChatRoom(r.id, user.id);
          } catch (joinErr) {
            // non-fatal: log and continue, UI will indicate restricted access
            console.warn('LiveChatSidebar: joinChatRoom failed', joinErr);
          }
        }

        const msgs = await fetchChatMessages(r.id, 200);
        if (!mounted) return;
        setMessages(msgs as ChatMessage[]);

        cleanup = subscribeToChatMessages(r.id, (m) => {
          setMessages((prev) => [...prev, m]);
        });
      } catch (e) {
        console.warn('LiveChatSidebar init error', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      if (cleanup) cleanup();
    };
  }, [liveId, title]);

  useEffect(() => {
    // auto-scroll
    const t = setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
    return () => clearTimeout(t);
  }, [messages]);

  const [inputValue, setInputValue] = React.useState('');
  const [sending, setSending] = React.useState(false);

  const handleSend = async (content?: string, attachments?: File[]) => {
    if (!room || !user) return;
    const text = (content ?? inputValue).trim();
    if (!text && (!attachments || attachments.length === 0)) return;
    try {
      setSending(true);
      const created = await sendChatMessage({ room_id: room.id, sender_id: user.id, content: text });
      // optimistic append using basic info from authenticated user
      const sender = { id: user.id, display_name: (user as any)?.email || 'Vous', avatar_url: (user as any)?.user_metadata?.avatar_url || undefined };
      setMessages((prev) => [...prev, { ...(created as any), sender }]);
      setInputValue('');
      // auto-scroll to new message
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (e) {
      console.warn('send chat message failed', e);
    } finally {
      setSending(false);
    }
  };

  if (!room) {
    return (
      <div className="w-full max-w-xs border-l border-border bg-card p-4">
        {loading ? (
          <div className="text-sm text-muted-foreground">Chargement du chat...</div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Le chat n'est pas disponible pour les visiteurs. <br />
            <strong>Connectez-vous</strong> pour initier la conversation et créer la salle live.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-xs border-l border-border bg-card flex flex-col">
      <div className="p-3 border-b border-border">
        <ChatHeader room={{ ...room, name: title ?? room.name }} />
      </div> 

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-3 space-y-3">
            {loading ? (
              <div className="text-sm text-muted-foreground">Chargement des messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-sm text-muted-foreground">Soyez le premier à saluer 🎉</div>
            ) : (
              messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  content={m.content}
                  isOwn={m.sender_id === user?.id}
                  senderName={m.sender?.display_name || 'Utilisateur'}
                  senderAvatar={m.sender?.avatar_url}
                  timestamp={new Date(m.created_at)}
                  attachments={[]}
                />
              ))
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </div>

      <div className="p-3 border-t border-border">
        {!user ? (
          <div className="text-sm text-muted-foreground">Vous devez être connecté pour participer au chat.</div>
        ) : (
          <ErrorBoundary fallback={<div className="p-2 bg-destructive/10 text-destructive rounded">Le composant de saisie est indisponible.</div>}>
            <MessageInput value={inputValue} onChange={setInputValue} onSend={handleSend} isLoading={sending} placeholder="Envoyer un message au live" />
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
};

export default LiveChatSidebar;
