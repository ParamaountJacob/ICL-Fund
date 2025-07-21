import { supabase } from './client';

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'investment' | 'document';
    read: boolean;
    action_url?: string;
    created_at: string;
}

export const notificationService = {
    // Get user notifications
    async getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    },

    // Get unread notifications count
    async getUnreadCount(userId: string): Promise<number> {
        try {
            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('read', false);

            if (error) throw error;
            return count || 0;
        } catch (error) {
            console.error('Error fetching unread count:', error);
            return 0;
        }
    },

    // Mark notification as read
    async markAsRead(notificationId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', notificationId);

            if (error) throw error;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    },

    // Mark all notifications as read
    async markAllAsRead(userId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('user_id', userId)
                .eq('read', false);

            if (error) throw error;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    },

    // Create notification
    async createNotification(notificationData: Omit<Notification, 'id' | 'created_at'>): Promise<Notification> {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .insert({
                    ...notificationData,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    },

    // Send admin notification via edge function
    async sendAdminNotification(payload: {
        type: string;
        message: string;
        data?: any;
    }): Promise<void> {
        try {
            const { error } = await supabase.functions.invoke('send-admin-notification', {
                body: payload
            });

            if (error) {
                console.error('Error sending admin notification:', error);
                // Don't throw - notification failure shouldn't break the main flow
            }
        } catch (error) {
            console.error('Error invoking admin notification function:', error);
        }
    },

    // Subscribe to real-time notifications
    subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
        return supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    callback(payload.new as Notification);
                }
            )
            .subscribe();
    }
};
