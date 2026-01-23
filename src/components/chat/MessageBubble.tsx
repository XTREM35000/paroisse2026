import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  content: string;
  isOwn: boolean;
  senderName: string;
  senderAvatar?: string | null;
  timestamp: Date;
  showAvatar?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  content,
  isOwn,
  senderName,
  senderAvatar,
  timestamp,
  showAvatar = true,
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const timeString = timestamp.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={cn('flex gap-2 mb-3 animate-in fade-in slide-in-from-bottom-2', isOwn && 'flex-row-reverse')}>
      {/* Avatar - uniquement si on affiche les avatars et que ce n'est pas mon message */}
      {showAvatar && !isOwn && (
        <div className="flex-shrink-0 pt-1">
          <Avatar className="h-8 w-8">
            {senderAvatar && <AvatarImage src={senderAvatar} alt={senderName} />}
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {getInitials(senderName)}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Message bubble container */}
      <div className={cn('flex flex-col max-w-xs lg:max-w-md xl:max-w-lg', isOwn && 'items-end')}>
        {/* Sender name - uniquement pour les messages reçus */}
        {!isOwn && showAvatar && (
          <span className="text-xs font-semibold text-muted-foreground px-3 mb-1">{senderName}</span>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            'px-3 py-2 rounded-lg break-words',
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-none'
              : 'bg-muted text-muted-foreground rounded-bl-none'
          )}
        >
          <p className="text-sm leading-relaxed">{content}</p>
        </div>

        {/* Timestamp */}
        <span className={cn('text-xs text-muted-foreground mt-1 px-3', isOwn && 'text-right')}>
          {timeString}
        </span>
      </div>
    </div>
  );
};

export default MessageBubble;
