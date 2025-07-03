import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Shield, User, Clock, Check, X, ArrowLeft, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    action_type?: string;
    action_data?: any;
    is_read: boolean;
    created_at: string;
    updated_at: string;
}

const NotificationsPage: React.FC = () => {
    const { user, isAdmin } = useAuth();
    const { showError, success } = useNotifications();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread' | 'verification'>('all');

    // Get highlighted notification from URL params
    const highlightNotificationId = searchParams.get('highlight');

    useEffect(() => {
        if (user) {
            loadNotifications();
            setupRealtimeSubscription();
        }
    }, [user]);

    const loadNotifications = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                if (error.code === '42P01') {
                    console.log('Notifications table not yet created');
                    setNotifications([]);
                    return;
                }
                throw error;
            }

            setNotifications(data || []);
        } catch (error: any) {
            showError('Failed to load notifications: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const setupRealtimeSubscription = () => {
        const subscription = supabase
            .channel('notifications_page')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user?.id}`
            }, () => {
                loadNotifications();
            })
            .subscribe();

        return () => subscription.unsubscribe();
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
        } catch (error: any) {
            showError('Failed to mark notification as read');
        }
    };

    const markAllAsRead = async () => {
        try {
            const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);

            for (const id of unreadIds) {
                await supabase.rpc('mark_notification_read', {
                    p_notification_id: id
                });
            }

            setNotifications(prev =>
                prev.map(n => ({ ...n, is_read: true }))
            );

            success('All notifications marked as read');
        } catch (error: any) {
            showError('Failed to mark all notifications as read');
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.is_read) {
            markAsRead(notification.id);
        }

        // Handle specific action types
        if (notification.action_type === 'verification_request' && isAdmin) {
            navigate(`/profile?tab=admin&user=${notification.action_data?.requesting_user_id}`);
        } else if (notification.action_type?.includes('verification')) {
            navigate('/profile?tab=overview');
        }
    };

    const getNotificationIcon = (type: string, actionType?: string) => {
        switch (actionType) {
            case 'verification_request':
                return <Shield className="w-5 h-5 text-blue-500" />;
            case 'verification_approved':
            case 'verification_verified':
                return <Check className="w-5 h-5 text-green-500" />;
            case 'verification_denied':
                return <X className="w-5 h-5 text-red-500" />;
            default:
                return <Bell className="w-5 h-5 text-blue-500" />;
        }
    };

    const getNotificationBgColor = (type: string, isRead: boolean) => {
        const opacity = isRead ? '20' : '50';
        switch (type) {
            case 'success': return `bg-green-${opacity}`;
            case 'warning': return `bg-yellow-${opacity}`;
            case 'error': return `bg-red-${opacity}`;
            default: return `bg-blue-${opacity}`;
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

    const filteredNotifications = notifications.filter(notification => {
        switch (filter) {
            case 'unread': return !notification.is_read;
            case 'verification': return notification.action_type?.includes('verification');
            default: return true;
        }
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;

    if (!user) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Bell className="w-12 h-12 mx-auto mb-4 text-text-secondary" />
                    <p className="text-text-secondary">Please log in to view notifications</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-accent rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-text-secondary" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
                            <p className="text-text-secondary">
                                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                            </p>
                        </div>
                    </div>

                    {/* Filters and Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex gap-2">
                            {['all', 'unread', 'verification'].map((filterType) => (
                                <button
                                    key={filterType}
                                    onClick={() => setFilter(filterType as any)}
                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${filter === filterType
                                            ? 'bg-gold text-background'
                                            : 'bg-accent text-text-secondary hover:text-text-primary'
                                        }`}
                                >
                                    {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                                    {filterType === 'unread' && unreadCount > 0 && (
                                        <span className="ml-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 inline-flex items-center justify-center">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-sm text-gold hover:text-gold/80 transition-colors"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>
                </div>

                {/* Notifications List */}
                <div className="space-y-3">
                    {isLoading ? (
                        <div className="text-center py-8">
                            <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-text-secondary">Loading notifications...</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="text-center py-12">
                            <Bell className="w-12 h-12 mx-auto mb-4 text-text-secondary opacity-50" />
                            <h3 className="text-lg font-medium text-text-primary mb-2">No notifications</h3>
                            <p className="text-text-secondary">
                                {filter === 'all'
                                    ? "You don't have any notifications yet."
                                    : `No ${filter} notifications found.`}
                            </p>
                        </div>
                    ) : (
                        filteredNotifications.map((notification) => (
                            <motion.div
                                key={notification.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md ${notification.id === highlightNotificationId
                                        ? 'ring-2 ring-gold bg-gold/10 border-gold'
                                        : !notification.is_read
                                            ? 'bg-blue-50/50 border-blue-200 hover:bg-blue-50'
                                            : 'bg-surface border-graphite hover:bg-accent'
                                    }`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="flex gap-4">
                                    {/* Icon */}
                                    <div className="flex-shrink-0">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getNotificationBgColor(notification.type, notification.is_read)
                                            }`}>
                                            {getNotificationIcon(notification.type, notification.action_type)}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <h3 className={`font-medium ${!notification.is_read ? 'text-text-primary' : 'text-text-secondary'
                                                }`}>
                                                {notification.title}
                                            </h3>
                                            <span className="text-xs text-text-secondary flex-shrink-0 ml-2">
                                                {formatTime(notification.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                                            {notification.message}
                                        </p>

                                        {/* Action indicator */}
                                        {notification.action_type && (
                                            <div className="flex items-center gap-1 mt-2">
                                                <ExternalLink className="w-3 h-3 text-gold" />
                                                <span className="text-xs text-gold font-medium">
                                                    Click to view details
                                                </span>
                                            </div>
                                        )}

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
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;
