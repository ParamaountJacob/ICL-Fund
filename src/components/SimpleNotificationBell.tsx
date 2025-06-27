import React, { useState, useEffect } from 'react';
import { Bell, Check, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import {
    getUserNotifications,
    getAdminNotifications,
    markNotificationRead,
    type SimpleNotification,
    type AdminNotification
} from '../lib/simple-workflow';
import { supabase } from '../lib/supabase';

interface NotificationBellProps {
    isAdmin?: boolean;
    className?: string;
}

export default function NotificationBell({ isAdmin = false, className = '' }: NotificationBellProps) {
    const [notifications, setNotifications] = useState<SimpleNotification[] | AdminNotification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Load notifications
    const loadNotifications = async () => {
        setLoading(true);
        try {
            if (isAdmin) {
                const adminNotifications = await getAdminNotifications(20);
                setNotifications(adminNotifications);
                setUnreadCount(adminNotifications.filter(n => !n.is_read).length);
            } else {
                const userNotifications = await getUserNotifications(20);
                setNotifications(userNotifications);
                setUnreadCount(userNotifications.filter(n => !n.is_read).length);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    // Mark notification as read
    const handleMarkRead = async (notificationId: string) => {
        try {
            await markNotificationRead(notificationId);
            setNotifications(prev =>
                prev.map(n =>
                    n.id === notificationId ? { ...n, is_read: true } : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Mark all as read
    const handleMarkAllRead = async () => {
        const unreadNotifications = notifications.filter(n => !n.is_read);
        for (const notification of unreadNotifications) {
            try {
                await markNotificationRead(notification.id);
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
        }
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
    };

    // Load notifications on mount
    useEffect(() => {
        loadNotifications();
    }, [isAdmin]);

    // Set up real-time subscription for new notifications
    useEffect(() => {
        const channel = supabase
            .channel('simple_notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'simple_notifications'
                },
                (payload) => {
                    // Only reload if this notification is for the current user type
                    loadNotifications();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isAdmin]);

    // Get notification type icon
    const getNotificationIcon = (notification: SimpleNotification) => {
        switch (notification.notification_type) {
            case 'admin_action_needed':
                return <AlertCircle className="w-4 h-4 text-orange-500" />;
            case 'user_action_needed':
                return <Clock className="w-4 h-4 text-blue-500" />;
            case 'step_complete':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            default:
                return <Bell className="w-4 h-4 text-gray-500" />;
        }
    };

    // Format relative time
    const formatRelativeTime = (timestamp: string) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now.getTime() - time.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return time.toLocaleDateString();
    };

    return (
        <div className={`relative ${className}`}>
            {/* Notification Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">
                            {isAdmin ? 'Admin Notifications' : 'Notifications'}
                        </h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-sm text-blue-600 hover:text-blue-800"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-64 overflow-y-auto">
                        {loading ? (
                            <div className="px-4 py-8 text-center text-gray-500">
                                Loading notifications...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-500">
                                No notifications yet
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                        }`}
                                    onClick={() => handleMarkRead(notification.id)}
                                >
                                    <div className="flex items-start space-x-3">
                                        {getNotificationIcon(notification)}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className={`text-sm font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'
                                                    }`}>
                                                    {notification.title}
                                                </p>
                                                {!notification.is_read && (
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-xs text-gray-500">
                                                    {formatRelativeTime(notification.created_at)}
                                                </span>
                                                {isAdmin && 'user_email' in notification && (
                                                    <span className="text-xs text-gray-500">
                                                        {notification.user_first_name} {notification.user_last_name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-sm text-gray-600 hover:text-gray-800"
                            >
                                Close notifications
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}
