import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Shield, User, Clock, Check, X, ExternalLink, CheckCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

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

interface NotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
    const { user, isAdmin } = useAuth();
    const { showError, success } = useNotifications();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    useEffect(() => {
        if (isOpen && user) {
            loadNotifications();
            setupRealtimeSubscription();
        }
    }, [isOpen, user]);

    const loadNotifications = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20); // Limit for modal view

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
            console.error('Error loading notifications:', error);
            setNotifications([]);
        } finally {
            setIsLoading(false);
        }
    };

    const setupRealtimeSubscription = () => {
        const subscription = supabase
            .channel('notifications_modal')
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

        // Close modal first
        onClose();

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
            default: return true;
        }
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{
                            type: 'spring',
                            damping: 25,
                            stiffness: 300
                        }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden md:left-1/2 md:transform md:-translate-x-1/2 md:max-w-lg md:mb-4 md:rounded-3xl md:max-h-[80vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drag Handle */}
                        <div className="flex justify-center py-3 md:hidden">
                            <div className="w-12 h-1 bg-graphite rounded-full opacity-30" />
                        </div>

                        {/* Header */}
                        <div className="px-6 py-4 border-b border-graphite">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-text-primary">Notifications</h2>
                                    <p className="text-sm text-text-secondary">
                                        {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="p-2 hover:bg-accent rounded-lg transition-colors"
                                            title="Mark all as read"
                                        >
                                            <CheckCheck className="w-5 h-5 text-gold" />
                                        </button>
                                    )}
                                    <button
                                        onClick={onClose}
                                        className="p-2 hover:bg-accent rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5 text-text-secondary" />
                                    </button>
                                </div>
                            </div>

                            {/* Filter tabs */}
                            <div className="flex gap-1 mt-4">
                                {['all', 'unread'].map((filterType) => (
                                    <button
                                        key={filterType}
                                        onClick={() => setFilter(filterType as any)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === filterType
                                            ? 'bg-gold text-background'
                                            : 'text-text-secondary hover:text-text-primary hover:bg-accent'
                                            }`}
                                    >
                                        {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                                        {filterType === 'unread' && unreadCount > 0 && (
                                            <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 inline-flex items-center justify-center">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto max-h-[60vh] md:max-h-[50vh]">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-center">
                                        <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin mx-auto mb-4" />
                                        <p className="text-text-secondary">Loading notifications...</p>
                                    </div>
                                </div>
                            ) : filteredNotifications.length === 0 ? (
                                <div className="text-center py-12">
                                    <Bell className="w-12 h-12 mx-auto mb-4 text-text-secondary opacity-30" />
                                    <h3 className="text-lg font-medium text-text-primary mb-2">No notifications</h3>
                                    <p className="text-text-secondary px-6">
                                        {filter === 'all'
                                            ? "You're all caught up! No notifications to show."
                                            : "No unread notifications."}
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-graphite">
                                    {filteredNotifications.map((notification, index) => (
                                        <motion.div
                                            key={notification.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className={`p-4 transition-all duration-200 cursor-pointer hover:bg-accent ${!notification.is_read ? 'bg-blue-50/30' : ''
                                                }`}
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            <div className="flex gap-3">
                                                {/* Icon */}
                                                <div className="flex-shrink-0">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notification.type === 'success' ? 'bg-green-100' :
                                                        notification.type === 'warning' ? 'bg-yellow-100' :
                                                            notification.type === 'error' ? 'bg-red-100' :
                                                                'bg-blue-100'
                                                        }`}>
                                                        {getNotificationIcon(notification.type, notification.action_type)}
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h3 className={`font-medium text-sm ${!notification.is_read ? 'text-text-primary' : 'text-text-secondary'
                                                            }`}>
                                                            {notification.title}
                                                        </h3>
                                                        <span className="text-xs text-text-secondary flex-shrink-0">
                                                            {formatTime(notification.created_at)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                                                        {notification.message}
                                                    </p>

                                                    <div className="flex items-center justify-between mt-2">
                                                        {/* Action indicator */}
                                                        {notification.action_type && (
                                                            <div className="flex items-center gap-1">
                                                                <ExternalLink className="w-3 h-3 text-gold" />
                                                                <span className="text-xs text-gold font-medium">
                                                                    Tap to view
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* Unread indicator */}
                                                        {!notification.is_read && (
                                                            <div className="ml-auto">
                                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {filteredNotifications.length > 0 && (
                            <div className="p-4 border-t border-graphite bg-accent/30">
                                <button
                                    onClick={() => {
                                        onClose();
                                        navigate('/notifications');
                                    }}
                                    className="w-full text-center text-sm text-gold hover:text-gold/80 transition-colors font-medium"
                                >
                                    View All Notifications
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default NotificationModal;
