import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { ConversationItem } from './ConversationItem';
import { cn } from '@/lib/utils';
import type { ChatRoom } from '@/types/database';

interface ConversationListProps {
  conversations: (ChatRoom & {
    lastMessage?: string;
    unreadCount?: number;
    lastMessageTime?: Date;
  })[];
  selectedRoomId?: string;
  onSelectConversation: (roomId: string) => void;
  onCreateConversation?: () => void;
  isLoading?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedRoomId,
  onSelectConversation,
  onCreateConversation,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredConversations, setFilteredConversations] = useState(conversations);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredConversations(conversations);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredConversations(
        conversations.filter(
          conv =>
            conv.name.toLowerCase().includes(term) ||
            conv.description?.toLowerCase().includes(term) ||
            conv.lastMessage?.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, conversations]);

  return (
    <div className="h-full flex flex-col bg-background border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h2 className="text-lg font-bold text-foreground">Messages</h2>
          {onCreateConversation && (
            <Button
              onClick={onCreateConversation}
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              title="Nouvelle conversation"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-8 h-9 text-sm rounded-lg"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            Chargement des conversations...
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            {searchTerm ? 'Aucune conversation trouvée' : 'Aucune conversation'}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredConversations.map(room => (
              <ConversationItem
                key={room.id}
                room={room}
                isSelected={selectedRoomId === room.id}
                onClick={() => onSelectConversation(room.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ConversationList;
