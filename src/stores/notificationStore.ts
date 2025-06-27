import { create } from 'zustand';
import { notificationService, type Notification } from '../lib/notifications';

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchNotifications: (userId: string, limit?: number) => Promise<void>;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: (userId: string) => Promise<void>;
    addNotification: (notification: Notification) => void;
    clearError: () => void;
    reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,

    fetchNotifications: async (userId: string, limit = 50) => {
        set({ isLoading: true, error: null });
        try {
            const [notifications, unreadCount] = await Promise.all([
                notificationService.getUserNotifications(userId, limit),
                notificationService.getUnreadCount(userId)
            ]);

            set({
                notifications,
                unreadCount
            });
        } catch (error: any) {
            set({ error: error.message || 'Failed to fetch notifications' });
        } finally {
            set({ isLoading: false });
        }
    },

    markAsRead: async (notificationId: string) => {
        try {
            await notificationService.markAsRead(notificationId);

            const notifications = get().notifications.map(notification =>
                notification.id === notificationId
                    ? { ...notification, read: true }
                    : notification
            );

            const unreadCount = notifications.filter(n => !n.read).length;

            set({ notifications, unreadCount });
        } catch (error: any) {
            set({ error: error.message || 'Failed to mark notification as read' });
        }
    },

    markAllAsRead: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
            await notificationService.markAllAsRead(userId);

            const notifications = get().notifications.map(notification => ({
                ...notification,
                read: true
            }));

            set({
                notifications,
                unreadCount: 0
            });
        } catch (error: any) {
            set({ error: error.message || 'Failed to mark all notifications as read' });
        } finally {
            set({ isLoading: false });
        }
    },

    addNotification: (notification: Notification) => {
        const notifications = [notification, ...get().notifications];
        const unreadCount = notification.read ? get().unreadCount : get().unreadCount + 1;

        set({
            notifications: notifications.slice(0, 50), // Keep only latest 50
            unreadCount
        });
    },

    clearError: () => set({ error: null }),

    reset: () => set({
        notifications: [],
        unreadCount: 0,
        error: null
    })
}));
