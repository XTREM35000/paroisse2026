import { supabase } from '@/integrations/supabase/client';
import type { ChatRoom, ChatMessage } from '@/types/database';

export async function fetchChatRooms() {
  const { data, error } = await supabase
    .from('chat_rooms')
    .select('*')
    .eq('is_private', false)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) throw error;
  return data as ChatRoom[];
}

export async function fetchChatMessages(roomId: string, limit = 100) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('room_id', roomId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  
  if (data && data.length > 0) {
    const senderIds = [...new Set(data.map(m => m.sender_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', senderIds);
    
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    return data.map(msg => ({
      ...msg,
      sender: profileMap.get(msg.sender_id) || null,
    })) as ChatMessage[];
  }
  
  return data as ChatMessage[];
}

export async function sendChatMessage(message: {
  room_id: string;
  sender_id: string;
  content: string;
}) {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert([message])
    .select('*')
    .single();

  if (error) throw error;

  await supabase
    .from('chat_rooms')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', message.room_id);

  return data as ChatMessage;
}

export async function createChatRoom(room: { name: string; description?: string; is_private?: boolean; created_by?: string }) {
  const { data, error } = await supabase
    .from('chat_rooms')
    .insert([room])
    .select()
    .single();

  if (error) throw error;
  return data as ChatRoom;
}

export async function joinChatRoom(roomId: string, userId: string) {
  const { error } = await supabase
    .from('chat_room_members')
    .insert([{ room_id: roomId, user_id: userId }]);

  if (error) throw error;
  return true;
}

export function subscribeToChatMessages(
  roomId: string,
  onMessage: (message: ChatMessage) => void
) {
  const channel = supabase
    .channel(`chat-${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`,
      },
      async (payload) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', payload.new.sender_id)
          .maybeSingle();

        onMessage({
          ...payload.new,
          sender: profile,
        } as ChatMessage);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
