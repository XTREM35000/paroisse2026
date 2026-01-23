# 🚀 ChatPage Refondée - Extensions & Améliorations futures

## 📦 Extension 1: Édition et suppression de messages

```typescript
// src/components/chat/MessageBubble.tsx - Ajouter dans les props

interface MessageBubbleProps {
  // ... props existants
  onEdit?: () => void;
  onDelete?: () => void;
  canEdit?: boolean; // Uniquement si l'utilisateur en est l'auteur
}

// Dans le rendu, ajouter un menu contextuel
<div className="group relative">
  <MessageContent />
  {canEdit && (
    <MessageActions
      onEdit={onEdit}
      onDelete={onDelete}
    />
  )}
</div>
```

**Intégration dans ChatPage :**
```typescript
const handleEditMessage = async (messageId: string, newContent: string) => {
  const { error } = await supabase
    .from('chat_messages')
    .update({ content: newContent, is_edited: true })
    .eq('id', messageId);
  
  if (!error) notifySuccess('Message modifié');
};

const handleDeleteMessage = async (messageId: string) => {
  const { error } = await supabase
    .from('chat_messages')
    .update({ is_deleted: true, content: '🗑️ Message supprimé' })
    .eq('id', messageId);
  
  if (!error) notifySuccess('Message supprimé');
};
```

---

## 📌 Extension 2: Réactions d'emoji (Like WhatsApp)

```typescript
// src/components/chat/MessageReactions.tsx - Nouveau composant

interface MessageReaction {
  messageId: string;
  emoji: string;
  users: string[];
  count: number;
}

export function MessageReactions({ reactions, onReact }: MessageReactionsProps) {
  const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
  
  return (
    <div className="flex gap-1 flex-wrap">
      {reactions.map(reaction => (
        <button
          key={reaction.emoji}
          onClick={() => onReact(reaction.emoji)}
          className="px-2 py-1 bg-muted rounded-full text-sm hover:bg-muted/80"
        >
          {reaction.emoji} {reaction.count}
        </button>
      ))}
      <EmojiPicker onSelect={onReact} />
    </div>
  );
}
```

**Table Supabase :**
```sql
CREATE TABLE chat_message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);
```

---

## 💬 Extension 3: Indicateurs "En train d'écrire"

```typescript
// Hook personnalisé
export function useTypingIndicator(roomId: string) {
  const channel = supabase
    .channel(`typing:${roomId}`)
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const typing = Object.values(state)
        .flat()
        .filter((presence: any) => presence.typing);
      setTyping(typing);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          typing: false,
          user: profile?.full_name,
        });
      }
    });

  const setTyping = (value: boolean) => {
    channel.track({ typing: value });
  };

  return { typing, setTyping };
}

// Utilisation dans ChatPage
const { typing, setTyping } = useTypingIndicator(selectedRoomId);

<MessageInput
  onTyping={(value) => setTyping(!!value)}
  typingUsers={typing.map(t => t.user)}
/>
```

---

## 📎 Extension 4: Pièces jointes et partage de fichiers

```typescript
// src/components/chat/MessageAttachment.tsx

export function MessageAttachment({ attachment }: { attachment: string }) {
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(attachment);
  const isVideo = /\.(mp4|webm|mov)$/i.test(attachment);
  const isAudio = /\.(mp3|wav|aac)$/i.test(attachment);
  const isDocument = /\.(pdf|doc|docx|xls|xlsx)$/i.test(attachment);

  if (isImage) {
    return <img src={attachment} className="max-w-sm rounded-lg" />;
  }
  if (isVideo) {
    return <video src={attachment} controls className="max-w-sm rounded-lg" />;
  }
  if (isAudio) {
    return <audio src={attachment} controls className="w-full" />;
  }
  if (isDocument) {
    return (
      <a href={attachment} className="bg-muted p-3 rounded-lg inline-flex items-center gap-2">
        📄 Télécharger le document
      </a>
    );
  }

  return <a href={attachment} className="text-primary underline">Ouvrir</a>;
}

// Dans MessageInput.tsx
<MessageInput>
  <FileUploadButton
    onUpload={async (file) => {
      const url = await uploadToSupabase(file);
      sendMessageWithAttachment(url);
    }}
  />
</MessageInput>
```

---

## 🔍 Extension 5: Recherche globale de messages

```typescript
// src/components/chat/MessageSearch.tsx

export function MessageSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ChatMessage[]>([]);

  const handleSearch = async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .textSearch('content', q)
      .order('created_at', { ascending: false })
      .limit(50);

    setResults(data || []);
  };

  return (
    <div className="flex flex-col gap-2">
      <Input
        placeholder="Rechercher dans tous les messages..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          handleSearch(e.target.value);
        }}
      />
      <SearchResults results={results} />
    </div>
  );
}
```

---

## 👥 Extension 6: Gestion des salons privés (DM)

```typescript
// src/hooks/usePrivateChat.ts

export function usePrivateChat(userId: string) {
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Trouver ou créer une salle privée entre 2 utilisateurs
    const findOrCreatePrivateRoom = async () => {
      const { data: existing } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('type', 'direct')
        .eq('is_private', true);

      // Vérifier si une salle existe déjà
      const existingRoom = existing?.find(
        room => room.created_by === userId
      );

      if (existingRoom) {
        setChatRoom(existingRoom);
      } else {
        // Créer une nouvelle salle privée
        const { data: newRoom } = await supabase
          .from('chat_rooms')
          .insert([
            {
              name: `Private chat with ${userId}`,
              type: 'direct',
              is_private: true,
              created_by: userId,
            },
          ])
          .select()
          .single();

        setChatRoom(newRoom);
      }

      setLoading(false);
    };

    findOrCreatePrivateRoom();
  }, [userId]);

  return { chatRoom, loading };
}

// Utilisation
const { chatRoom } = usePrivateChat(targetUserId);
if (chatRoom) {
  navigate(`/chat/${chatRoom.id}`);
}
```

---

## 🔔 Extension 7: Notifications push

```typescript
// src/hooks/useChatNotifications.ts

export function useChatNotifications(roomId: string) {
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${roomId}:notifications`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const newMsg = payload.new;

          // Si ce n'est pas notre message
          if (newMsg.sender_id !== user?.id) {
            // Envoyer notification push
            if ('Notification' in window) {
              new Notification('Nouveau message', {
                body: newMsg.content,
                icon: '/logo.png',
              });
            }

            // Envoyer notification audio
            new Audio('/notification.mp3').play();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, user?.id]);
}
```

---

## 📊 Extension 8: Statistiques et analytiques

```typescript
// src/lib/supabase/chatAnalytics.ts

export async function getChatStatistics(roomId: string) {
  // Messages par jour
  const { data: messagesByDay } = await supabase
    .from('chat_messages')
    .select('created_at, count')
    .eq('room_id', roomId)
    .gte('created_at', oneMonthAgo.toISOString());

  // Utilisateurs actifs
  const { data: activeUsers } = await supabase
    .from('chat_messages')
    .select('sender_id, count')
    .eq('room_id', roomId)
    .groupBy('sender_id');

  // Mots clés populaires
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('content')
    .eq('room_id', roomId);

  const keywords = extractKeywords(messages?.map(m => m.content) || []);

  return {
    messagesByDay,
    activeUsers: activeUsers?.length || 0,
    totalMessages: messages?.length || 0,
    topKeywords: keywords,
  };
}

export function ChatAnalyticsDashboard({ roomId }: { roomId: string }) {
  const stats = getChatStatistics(roomId);

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <h3>Total messages</h3>
        <p className="text-3xl font-bold">{stats.totalMessages}</p>
      </Card>
      <Card>
        <h3>Utilisateurs actifs</h3>
        <p className="text-3xl font-bold">{stats.activeUsers}</p>
      </Card>
      {/* ... autres cards */}
    </div>
  );
}
```

---

## 🔐 Extension 9: Chiffrement end-to-end (E2EE)

```typescript
// src/lib/crypto/chatEncryption.ts

import { AES, enc } from 'crypto-js';

export async function encryptMessage(content: string, sharedSecret: string) {
  return AES.encrypt(content, sharedSecret).toString();
}

export async function decryptMessage(encrypted: string, sharedSecret: string) {
  const decrypted = AES.decrypt(encrypted, sharedSecret);
  return decrypted.toString(enc.Utf8);
}

// Utilisation
const sendEncryptedMessage = async (content: string) => {
  const encrypted = await encryptMessage(content, sharedSecret);
  
  await supabase
    .from('chat_messages')
    .insert([{ content: encrypted, is_encrypted: true }]);
};

const displayMessage = async (msg: ChatMessage) => {
  if (msg.is_encrypted) {
    const decrypted = await decryptMessage(msg.content, sharedSecret);
    return decrypted;
  }
  return msg.content;
};
```

---

## ⏰ Extension 10: Messages programmés (Scheduled messages)

```typescript
// src/components/chat/ScheduleMessageModal.tsx

export function ScheduleMessageModal() {
  const [datetime, setDatetime] = useState<Date>();
  const [content, setContent] = useState('');

  const handleSchedule = async () => {
    await supabase
      .from('scheduled_messages')
      .insert([
        {
          room_id: selectedRoomId,
          sender_id: user?.id,
          content,
          scheduled_for: datetime,
          status: 'pending',
        },
      ]);

    // Edge Function pour envoyer au moment prévu
    // voir: supabase/functions/send-scheduled-messages
  };

  return (
    <Dialog>
      <Input
        type="datetime-local"
        value={datetime?.toISOString()}
        onChange={(e) => setDatetime(new Date(e.target.value))}
      />
      <Button onClick={handleSchedule}>Programmer</Button>
    </Dialog>
  );
}
```

---

## 🎯 Roadmap d'implémentation

| Extension | Priorité | Complexité | Durée estimée |
|-----------|----------|-----------|----------------|
| Édition/Suppression | 🔴 Haute | Moyenne | 2-3h |
| Réactions emoji | 🟠 Haute | Faible | 1-2h |
| Typing indicators | 🟠 Haute | Moyenne | 2-3h |
| Pièces jointes | 🟡 Moyenne | Haute | 4-6h |
| Recherche globale | 🟡 Moyenne | Moyenne | 2-3h |
| DM privés | 🔴 Haute | Haute | 4-5h |
| Notifications push | 🟡 Moyenne | Moyenne | 2-3h |
| Analytiques | 🟢 Basse | Moyenne | 3-4h |
| E2EE | 🟢 Basse | Haute | 6-8h |
| Messages programmés | 🟢 Basse | Haute | 5-6h |

---

## 📝 Notes d'implémentation

1. **Avant** chaque extension, créer une branche Git
2. **Tester** en isolation avant la fusion
3. **Documenter** les changements
4. **Valider** avec les utilisateurs finaux
5. **Optimiser** les performances après l'ajout

---

## 🚀 Prochains pas

1. ✅ Base ChatPage implémentée
2. ⏳ Implémenter Extension 1 & 2 (édition, réactions)
3. ⏳ Implémenter Extension 3 & 4 (typing, fichiers)
4. ⏳ Implémenter DM privés
5. 🎯 Collecteur de feedback utilisateur

