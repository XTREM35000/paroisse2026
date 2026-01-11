import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from './useUser';

export const useUnreadNotifications = () => {
  const { profile } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!profile?.id) {
      setUnreadCount(0);
      return;
    }

    console.log('[useUnreadNotifications] Initializing for profile:', profile.id);

    // Load initial count
    const loadCount = async () => {
      try {
        const { count, error } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .eq('is_read', false);

        if (error) throw error;
        console.log('[useUnreadNotifications] Initial count:', count);
        setUnreadCount(count || 0);
      } catch (e) {
        console.error('[useUnreadNotifications] load error', e);
      }
    };

    loadCount();

    // Subscribe to realtime changes on notifications table (NO FILTER - filter manually)
    const channel = supabase
      .channel(`public:notifications:user_${profile.id}`)
      .on('postgres_changes', 
        { 
          event: '*',  // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public', 
          table: 'notifications'
        }, 
        (payload) => {
          console.log('[useUnreadNotifications] Realtime event received:', payload.eventType, 'new:', payload.new, 'old:', payload.old);
          
          // Filter manually: only react to events for THIS user
          const isForThisUser = (payload.new?.user_id === profile.id) || (payload.old?.user_id === profile.id);
          
          if (!isForThisUser) {
            console.log('[useUnreadNotifications] Event is not for this user, ignoring');
            return;
          }

          // Reload the count whenever there's a change for this user
          (async () => {
            try {
              const { count, error } = await supabase
                .from('notifications')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', profile.id)
                .eq('is_read', false);

              if (error) throw error;
              console.log('[useUnreadNotifications] Updated count after realtime event:', count);
              setUnreadCount(count || 0);
            } catch (e) {
              console.error('[useUnreadNotifications] realtime count error', e);
            }
          })();
        }
      )
      .subscribe();

    return () => {
      console.log('[useUnreadNotifications] Cleanup: removing channel');
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        // ignore cleanup errors
      }
    };
  }, [profile?.id]);

  // Function to mark all notifications as read
  const markAllAsRead = async () => {
    if (!profile?.id) return;
    try {
      console.log('[useUnreadNotifications] Marking all as read for user:', profile.id);
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', profile.id)
        .eq('is_read', false);

      if (error) {
        console.error('[useUnreadNotifications] Error marking all as read:', error);
        return;
      }

      console.log('[useUnreadNotifications] Successfully marked all as read');
      // Reset count immediately
      setUnreadCount(0);
    } catch (error) {
      console.error('[useUnreadNotifications] Unexpected error:', error);
    }
  };

  return { unreadCount, markAllAsRead };
};

export default useUnreadNotifications;
