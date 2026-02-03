import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import PresenceDot from '@/components/chat/PresenceDot';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ChatRoom } from '@/types/database';

interface ConversationItemProps {
  room: ChatRoom & {
    lastMessage?: string;
    unreadCount?: number;
    lastMessageTime?: Date;
    avatar_url?: string;
    messageCount?: number;
  };
  isSelected?: boolean;
  onClick: () => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  room,
  isSelected = false,
  onClick,
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (date?: Date) => {
    if (!date) return '';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}j`;
    
    return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative p-3 border-b border-border cursor-pointer transition-colors hover:bg-muted/50',
        isSelected && 'bg-muted'
      )}
    >
      <div className="flex gap-3 items-start">
        {/* Avatar */}
        <div className="flex-shrink-0 relative">
          <Avatar className="h-12 w-12">
            <AvatarImage src={room.avatar_url || ''} alt={room.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {getInitials(room.name)}
            </AvatarFallback>
          </Avatar>
          {room.type === 'direct' && room.id && <PresenceDot userId={String(room.id)} />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-semibold text-sm truncate text-foreground">{room.name}</h3>
            {room.lastMessageTime && (
              <span className="text-xs text-muted-foreground flex-shrink-0 whitespace-nowrap">
                {formatTime(room.lastMessageTime)}
              </span>
            )}
          </div>

          {/* Last message */}
          <p className="text-xs text-muted-foreground truncate mb-1">
            {room.lastMessage || room.description || 'Aucun message'}
          </p>

          {/* Total message count (subtle, at bottom) */}
          {typeof room.messageCount === 'number' && (
            <div className="text-xs text-muted-foreground">{room.messageCount} message{room.messageCount > 1 ? 's' : ''}</div>
          )}
        </div>

        {/* Unread badge (small pink circle, top-right) */}
        {room.unreadCount && room.unreadCount > 0 && (
          <div className="absolute top-3 right-3 inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-500 text-white text-xs font-semibold shadow-md">
            {room.unreadCount > 99 ? '99+' : room.unreadCount}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationItem;
