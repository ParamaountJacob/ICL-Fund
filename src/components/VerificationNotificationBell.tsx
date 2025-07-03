import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Shield, User, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

interface SimpleNotification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    action_type?: string;
    action_data?: any;
    is_read: boolean;
    created_at: string;
}

interface VerificationNotificationBellProps {
    onAdminNotificationClick?: (userId: string) => void;
}

const VerificationNotificationBell: React.FC<VerificationNotificationBellProps> = ({
    onAdminNotificationClick
}) => {
    const { user, isAdmin } = useAuth();
    const { showError } = useNotifications();
    const [notifications, setNotifications] = useState<SimpleNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isTableAvailable, setIsTableAvailable] = useState<boolean | null>(null); // null = checking, false = not available, true = available

    useEffect(() => {
        if (user) {
            loadNotifications();

            // Set up real-time subscription for notifications
            // Only set up subscription if notifications table exists
            const setupSubscription = async () => {
                try {
                    // Test if notifications table exists first
                    const { error: testError } = await supabase
                        .from('notifications')
                        .select('id')
                        .limit(1);

                    if (testError && testError.code === '42P01') {
                        console.log('Notifications table not yet created, skipping subscription');
                        return;
                    }

                    // Table exists, set up subscription
                    const subscription = supabase
                        .channel('user_notifications')
                        .on('postgres_changes', {
                            event: '*',
                            schema: 'public',
                            table: 'notifications',
                            filter: `user_id=eq.${user.id}`
                        }, () => {
                            loadNotifications();
                        })
                        .subscribe();

                    return () => {
                        subscription.unsubscribe();
                    };
                } catch (error) {
                    console.log('Failed to set up notification subscription:', error);
                }
            };

            const cleanup = setupSubscription();
            return () => {
                cleanup?.then(fn => fn?.());
            };
        }
    }, [user]);

    const loadNotifications = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) {
                // If notifications table doesn't exist yet, fail silently
                if (error.code === '42P01') {
                    console.log('Notifications table not yet created');
                    setIsTableAvailable(false);
                    return;
                }
                throw error;
            }

            setIsTableAvailable(true);
            setNotifications(data || []);
            setUnreadCount(data?.filter(n => !n.is_read).length || 0);
        } catch (error: any) {
            console.error('Failed to load notifications:', error.message);
            setIsTableAvailable(false);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            const { error } = await supabase.rpc('mark_notification_read', {
                p_notification_id: notificationId
            });

            if (error) throw error;

            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error: any) {
            console.error('Failed to mark notification as read:', error.message);
        }
    };

    const handleNotificationClick = (notification: SimpleNotification) => {
        if (!notification.is_read) {
            markAsRead(notification.id);
        }

        // Handle verification request notifications for admins
        if (
            isAdmin &&
            notification.action_type === 'verification_request' &&
            notification.action_data?.requesting_user_id &&
            onAdminNotificationClick
        ) {
            onAdminNotificationClick(notification.action_data.requesting_user_id);
        }

        setIsOpen(false);
    };

    const getNotificationIcon = (actionType?: string) => {
        switch (actionType) {
            case 'verification_request':
                return <Shield className="w-4 h-4" />;
            case 'verification_approved':
            case 'verification_verified':
                return <User className="w-4 h-4 text-green-600" />;
            case 'verification_denied':
                return <User className="w-4 h-4 text-red-600" />;
            default:
                return <Bell className="w-4 h-4" />;
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'success': return 'bg-green-50 border-green-200';
            case 'warning': return 'bg-yellow-50 border-yellow-200';
            case 'error': return 'bg-red-50 border-red-200';
            default: return 'bg-blue-50 border-blue-200';
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    // Don't render if user is not logged in or table is not available
    if (!user || isTableAvailable === false) return null;

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-accent"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}
            </button>

            {/* Notification Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full mt-2 w-80 bg-surface border border-graphite rounded-lg shadow-lg z-50 max-h-96 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-3 border-b border-graphite bg-accent">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-text-primary">Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="text-xs text-text-secondary">
                                        {unreadCount} unread
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Notification List */}
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-6 text-center text-text-secondary">
                                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No notifications yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-graphite">
                                    {notifications.map((notification) => (
                                        <motion.div
                                            key={notification.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            onClick={() => handleNotificationClick(notification)}
                                            className={`p-3 hover:bg-accent cursor-pointer transition-colors border-l-4 ${!notification.is_read
                                                ? 'bg-blue-50/30 border-l-blue-500'
                                                : 'border-l-transparent'
                                                }`}
                                        >
                                            <div className="flex gap-3">
                                                {/* Icon */}
                                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                                                    {getNotificationIcon(notification.action_type)}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between">
                                                        <h4 className={`text-sm font-medium ${!notification.is_read ? 'text-text-primary' : 'text-text-secondary'
                                                            }`}>
                                                            {notification.title}
                                                        </h4>
                                                        <span className="text-xs text-text-secondary flex-shrink-0 ml-2">
                                                            {formatTime(notification.created_at)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                                                        {notification.message}
                                                    </p>

                                                    {/* Unread indicator */}
                                                    {!notification.is_read && (
                                                        <div className="flex items-center gap-1 mt-2">
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                            <span className="text-xs text-blue-600 font-medium">New</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="p-3 border-t border-graphite bg-accent">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-full text-center text-xs text-text-secondary hover:text-text-primary transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

export default VerificationNotificationBell;
