import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useUnreadNotifications = () => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let subscription: any;

        const fetchUnreadCount = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setUnreadCount(0);
                    setIsLoading(false);
                    return;
                }

                // Check if notifications table exists
                const { data: tableExists } = await supabase
                    .from('notifications')
                    .select('id')
                    .limit(1);

                if (!tableExists) {
                    setUnreadCount(0);
                    setIsLoading(false);
                    return;
                }

                // Get unread notification count
                const { data, error, count } = await supabase
                    .from('notifications')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .eq('is_read', false);

                if (error) {
                    console.error('Error fetching unread notifications:', error);
                    setUnreadCount(0);
                } else {
                    setUnreadCount(count || 0);
                }
            } catch (error) {
                console.error('Error in fetchUnreadCount:', error);
                setUnreadCount(0);
            } finally {
                setIsLoading(false);
            }
        };

        const setupRealtimeSubscription = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Subscribe to real-time changes
                subscription = supabase
                    .channel('notifications_count')
                    .on(
                        'postgres_changes',
                        {
                            event: '*',
                            schema: 'public',
                            table: 'notifications',
                            filter: `user_id=eq.${user.id}`,
                        },
                        () => {
                            fetchUnreadCount();
                        }
                    )
                    .subscribe();
            } catch (error) {
                console.error('Error setting up real-time subscription:', error);
            }
        };

        fetchUnreadCount();
        setupRealtimeSubscription();

        return () => {
            if (subscription) {
                supabase.removeChannel(subscription);
            }
        };
    }, []);

    return { unreadCount, isLoading };
};
