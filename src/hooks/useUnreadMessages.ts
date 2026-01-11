import { useState, useEffect } from 'react';
import { useUser } from './useUser';
import { supabase } from '@/integrations/supabase/client';

export default function useUnreadMessages() {
  const { profile } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!profile?.id) {
      setUnreadCount(0);
      return;
    }

    console.log('[useUnreadMessages] Initializing for profile:', profile.id);

    // Initial load: count unread messages sent TO this profile
    const loadUnreadCount = async () => {
      try {
        // Query profile to get last_read_messages_at
        const { data: profileData } = await supabase
          .from('profiles')
          .select('last_read_messages_at')
          .eq('id', profile.id)
          .single();

        // Count messages where sender is NOT profile.id and:
        // - Either last_read_messages_at is null (never read) → count last 7 days
        // - Or last_read_messages_at is set → count messages newer than that
        if (profileData?.last_read_messages_at) {
          const { count } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .gt('created_at', profileData.last_read_messages_at)
            .neq('sender_id', profile.id);
          console.log('[useUnreadMessages] Initial count:', count);
          setUnreadCount(count || 0);
        } else {
          const d = new Date();
          d.setDate(d.getDate() - 7);
          const { count } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .gt('created_at', d.toISOString())
            .neq('sender_id', profile.id);
          console.log('[useUnreadMessages] Initial count (7 days):', count);
          setUnreadCount(count || 0);
        }
      } catch (error) {
        console.error('[useUnreadMessages] Error loading count:', error);
      }
    };

    loadUnreadCount();

    // Subscribe to messages table changes (NO FILTER - filter manually)
    const channel = supabase
      .channel(`public:messages:user_${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('[useUnreadMessages] Realtime event received:', (payload as Record<string, unknown>).eventType, 'message:', (payload as Record<string, unknown>).new);
          
          // Filter manually: only react to messages sent TO this profile (sender_id != profile.id)
          const newData = (payload as Record<string, unknown>).new as Record<string, unknown> | undefined;
          const isForThisUser = newData?.sender_id !== profile.id;
          
          if (!isForThisUser) {
            console.log('[useUnreadMessages] Message is from this user or not relevant, ignoring');
            return;
          }

          // Reload count on any change
          loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      console.log('[useUnreadMessages] Cleanup: removing channel');
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  // Function to mark all messages as read (update last_read_messages_at)
  const markAllAsRead = async () => {
    if (!profile?.id) return;
    try {
      console.log('[useUnreadMessages] Marking all as read for user:', profile.id);
      const { error } = await supabase
        .from('profiles')
        .update({ last_read_messages_at: new Date().toISOString() })
        .eq('id', profile.id);
      
      if (error) {
        console.error('[useUnreadMessages] Error marking as read:', error);
        return;
      }

      console.log('[useUnreadMessages] Successfully marked all as read');
      // Reset count immediately
      setUnreadCount(0);
    } catch (error) {
      console.error('[useUnreadMessages] Unexpected error:', error);
    }
  };

  return { unreadCount, markAllAsRead };
}
