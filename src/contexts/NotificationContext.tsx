// GLOBAL NOTIFICATION SYSTEM - Fixes duplicate toasts and missing success/error handling

import React, { createContext, useContext, useState } from 'react';
import type { UINotification, NotificationType } from '../types/notifications';

interface NotificationContextType {
    notifications: UINotification[];
    addNotification: (notification: Omit<UINotification, 'id'>) => void;
    removeNotification: (id: string) => void;
    clearAllNotifications: () => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<UINotification[]>([]);

    const addNotification = (notification: Omit<UINotification, 'id'>) => {
        const id = Math.random().toString(36).substring(2);
        const newNotification: UINotification = {
            ...notification,
            id,
            duration: notification.duration ?? 5000
        };

        setNotifications(prev => [...prev, newNotification]);

        // Auto-remove after duration (unless persistent)
        if (!notification.persistent && newNotification.duration) {
            setTimeout(() => {
                removeNotification(id);
            }, newNotification.duration);
        }
    };

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearAllNotifications = () => {
        setNotifications([]);
    };

    // Convenience methods
    const success = (title: string, message?: string) => {
        addNotification({ type: 'success', title, message });
    };

    const error = (title: string, message?: string) => {
        addNotification({
            type: 'error',
            title,
            message,
            duration: 8000 // Errors stay longer
        });
    };

    const warning = (title: string, message?: string) => {
        addNotification({ type: 'warning', title, message });
    };

    const info = (title: string, message?: string) => {
        addNotification({ type: 'info', title, message });
    };

    const value: NotificationContextType = {
        notifications,
        addNotification,
        removeNotification,
        clearAllNotifications,
        success,
        error,
        warning,
        info
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
            <NotificationToaster />
        </NotificationContext.Provider>
    );
};

// Toast Component
const NotificationToaster: React.FC = () => {
    const { notifications, removeNotification } = useNotifications();

    if (notifications.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
            {notifications.map(notification => (
                <NotificationToast
                    key={notification.id}
                    notification={notification}
                    onRemove={() => removeNotification(notification.id)}
                />
            ))}
        </div>
    );
};

const NotificationToast: React.FC<{
    notification: UINotification;
    onRemove: () => void;
}> = ({ notification, onRemove }) => {
    const bgColor = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        warning: 'bg-yellow-600',
        info: 'bg-blue-600'
    }[notification.type];

    const textColor = 'text-white';

    return (
        <div className={`${bgColor} ${textColor} p-4 rounded-lg shadow-lg flex items-start justify-between animate-slide-in`}>
            <div className="flex-1">
                <h4 className="font-semibold text-sm">{notification.title}</h4>
                {notification.message && (
                    <p className="text-xs mt-1 opacity-90">{notification.message}</p>
                )}
            </div>
            <button
                onClick={onRemove}
                className="ml-3 text-white hover:opacity-75 flex-shrink-0"
            >
                ×
            </button>
        </div>
    );
};

// Tailwind animation classes (add to your CSS)
const styles = `
  @keyframes slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .animate-slide-in {
    animation: slide-in 0.3s ease-out;
  }
`;
