// Unified notification type definitions
// Consolidates duplicate interfaces across the codebase

export type NotificationType =
    | 'info'
    | 'success'
    | 'warning'
    | 'error'
    | 'investment'
    | 'document';

// Database notification (from Supabase)
export interface DatabaseNotification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: NotificationType;
    read: boolean;
    action_url?: string;
    action_type?: string;
    action_data?: any;
    is_read?: boolean; // Legacy field for backward compatibility
    created_at: string;
}

// UI notification (for toast/in-app notifications)
export interface UINotification {
    id: string;
    type: NotificationType;
    title: string;
    message?: string;
    duration?: number;
    persistent?: boolean;
}

// Unified notification interface that works for both contexts
export interface Notification extends DatabaseNotification {
    // Extends DatabaseNotification with optional UI properties
    duration?: number;
    persistent?: boolean;
}

// Notification service response types
export interface NotificationResponse {
    notifications: Notification[];
    total: number;
    unread_count: number;
}

// Real-time notification payload
export interface NotificationPayload {
    new: Notification;
    old?: Notification;
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
}

// Admin notification interface
export interface AdminNotification {
    id: string;
    notification_type: string;
    message: string;
    application_id?: string;
    user_id?: string;
    document_type?: string;
    is_read: boolean;
    created_at: string;
}
