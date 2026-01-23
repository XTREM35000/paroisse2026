import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import type { ChatRoom, Profile } from '@/types/database';

interface ChatHeaderProps {
  room: ChatRoom;
  memberCount?: number;
  onBack?: () => void;
  showBackButton?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  room,
  memberCount,
  onBack,
  showBackButton = false,
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-background">
      <div className="flex items-center gap-3 flex-1">
        {showBackButton && onBack && (
          <Button
            onClick={onBack}
            variant="ghost"
            size="icon"
            className="h-8 w-8 lg:hidden"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Avatar */}
        <Avatar className="h-10 w-10">
          <AvatarImage src={undefined} alt={room.name} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
            {getInitials(room.name)}
          </AvatarFallback>
        </Avatar>

        {/* Room Info */}
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground truncate">{room.name}</h2>
          {memberCount !== undefined && (
            <p className="text-xs text-muted-foreground">
              {memberCount === 1 ? '1 membre' : `${memberCount} membres`}
            </p>
          )}
          {room.description && !memberCount && (
            <p className="text-xs text-muted-foreground truncate">{room.description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
