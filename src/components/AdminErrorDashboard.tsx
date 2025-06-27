// ADMIN ERROR DASHBOARD COMPONENT
// Comprehensive error monitoring and management interface for admins

import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, TrendingUp, Download, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNotifications } from '../contexts/NotificationContext';

interface ErrorLog {
    id: string;
    message: string;
    stack?: string;
    url: string;
    user_agent: string;
    user_id?: string;
    user_email?: string;
    context?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    session_id: string;
    user_actions?: any[];
    resolved: boolean;
    created_at: string;
    resolved_at?: string;
    resolved_by?: string;
}

interface ErrorStats {
    total_errors: number;
    critical_errors: number;
    unresolved_errors: number;
    errors_by_day: Array<{ date: string; count: number }>;
    top_error_messages: Array<{ message: string; count: number }>;
    affected_users: number;
}

interface AdminNotification {
    id: string;
    type: string;
    title: string;
    message: string;
    data?: any;
    priority: 'low' | 'medium' | 'high' | 'critical';
    read: boolean;
    created_at: string;
}

export const AdminErrorDashboard: React.FC = () => {
    const [errors, setErrors] = useState<ErrorLog[]>([]);
    const [stats, setStats] = useState<ErrorStats | null>(null);
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
    const [filterSeverity, setFilterSeverity] = useState<string>('all');
    const [filterResolved, setFilterResolved] = useState<string>('all');
    const { success, error: showError } = useNotifications();

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Load error logs
            const { data: errorData, error: errorError } = await supabase
                .from('error_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (errorError) throw errorError;

            // Load error statistics
            const { data: statsData, error: statsError } = await supabase
                .rpc('get_error_statistics', { days_back: 7 });

            if (statsError) throw statsError;

            // Load admin notifications
            const { data: notificationData, error: notificationError } = await supabase
                .from('admin_notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (notificationError) throw notificationError;

            setErrors(errorData || []);
            setStats(statsData?.[0] || null);
            setNotifications(notificationData || []);
        } catch (err) {
            console.error('Error loading dashboard data:', err);
            showError('Load Failed', 'Failed to load error dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const resolveError = async (errorId: string) => {
        try {
            const { error } = await supabase
                .from('error_logs')
                .update({
                    resolved: true,
                    resolved_at: new Date().toISOString(),
                    resolved_by: (await supabase.auth.getUser()).data.user?.id
                })
                .eq('id', errorId);

            if (error) throw error;

            setErrors(prev => prev.map(err =>
                err.id === errorId ? { ...err, resolved: true } : err
            ));

            success('Error Resolved', 'Error has been marked as resolved');
        } catch (err) {
            console.error('Error resolving error:', err);
            showError('Resolution Failed', 'Failed to resolve error');
        }
    };

    const markNotificationRead = async (notificationId: string) => {
        try {
            const { error } = await supabase
                .rpc('mark_admin_notification_read', { notification_id: notificationId });

            if (error) throw error;

            setNotifications(prev => prev.map(notif =>
                notif.id === notificationId ? { ...notif, read: true } : notif
            ));
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const exportErrorReport = (error: ErrorLog) => {
        const report = {
            error,
            exportedAt: new Date().toISOString(),
            exportedBy: 'admin'
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `error-report-${error.id}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const filteredErrors = errors.filter(error => {
        if (filterSeverity !== 'all' && error.severity !== filterSeverity) return false;
        if (filterResolved === 'resolved' && !error.resolved) return false;
        if (filterResolved === 'unresolved' && error.resolved) return false;
        return true;
    });

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'text-red-600 bg-red-100';
            case 'high': return 'text-orange-600 bg-orange-100';
            case 'medium': return 'text-yellow-600 bg-yellow-100';
            case 'low': return 'text-green-600 bg-green-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'text-red-600 bg-red-100';
            case 'high': return 'text-orange-600 bg-orange-100';
            case 'medium': return 'text-yellow-600 bg-yellow-100';
            case 'low': return 'text-green-600 bg-green-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Error Dashboard</h1>
                <button
                    onClick={loadDashboardData}
                    className="bg-gold text-navy px-4 py-2 rounded-lg hover:bg-gold/90 transition-colors"
                >
                    Refresh Data
                </button>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center">
                            <AlertTriangle className="h-8 w-8 text-red-500" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Total Errors</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total_errors}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center">
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Critical Errors</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.critical_errors}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center">
                            <Clock className="h-8 w-8 text-orange-500" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Unresolved</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.unresolved_errors}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center">
                            <TrendingUp className="h-8 w-8 text-blue-500" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Affected Users</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.affected_users}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Notifications */}
            {notifications.filter(n => !n.read).length > 0 && (
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b">
                        <h2 className="text-xl font-semibold text-gray-900">Unread Notifications</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        {notifications.filter(n => !n.read).map(notification => (
                            <div
                                key={notification.id}
                                className="flex items-start justify-between p-4 border border-gray-200 rounded-lg"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                                            {notification.priority}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            {new Date(notification.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <h3 className="font-medium text-gray-900">{notification.title}</h3>
                                    <p className="text-sm text-gray-600">{notification.message}</p>
                                </div>
                                <button
                                    onClick={() => markNotificationRead(notification.id)}
                                    className="ml-4 text-blue-600 hover:text-blue-800 text-sm"
                                >
                                    Mark Read
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Error Filters */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex flex-wrap gap-4 items-center">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                        <select
                            value={filterSeverity}
                            onChange={(e) => setFilterSeverity(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                        >
                            <option value="all">All Severities</option>
                            <option value="critical">Critical</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={filterResolved}
                            onChange={(e) => setFilterResolved(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                        >
                            <option value="all">All Status</option>
                            <option value="unresolved">Unresolved</option>
                            <option value="resolved">Resolved</option>
                        </select>
                    </div>

                    <div className="text-sm text-gray-600">
                        Showing {filteredErrors.length} of {errors.length} errors
                    </div>
                </div>
            </div>

            {/* Error List */}
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">Recent Errors</h2>
                </div>
                <div className="divide-y divide-gray-200">
                    {filteredErrors.map(error => (
                        <div key={error.id} className="p-6 hover:bg-gray-50">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(error.severity)}`}>
                                            {error.severity}
                                        </span>
                                        {error.resolved && (
                                            <span className="px-2 py-1 rounded-full text-xs font-medium text-green-600 bg-green-100">
                                                <CheckCircle className="w-3 h-3 inline mr-1" />
                                                Resolved
                                            </span>
                                        )}
                                        <span className="text-sm text-gray-500">
                                            {new Date(error.created_at).toLocaleString()}
                                        </span>
                                    </div>

                                    <h3 className="font-medium text-gray-900 mb-1">{error.message}</h3>

                                    <div className="text-sm text-gray-600 space-y-1">
                                        <div><strong>URL:</strong> {error.url}</div>
                                        {error.context && <div><strong>Context:</strong> {error.context}</div>}
                                        {error.user_email && <div><strong>User:</strong> {error.user_email}</div>}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 ml-4">
                                    <button
                                        onClick={() => setSelectedError(error)}
                                        className="text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                        View Details
                                    </button>

                                    <button
                                        onClick={() => exportErrorReport(error)}
                                        className="text-gray-600 hover:text-gray-800"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>

                                    {!error.resolved && (
                                        <button
                                            onClick={() => resolveError(error.id)}
                                            className="text-green-600 hover:text-green-800"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Error Detail Modal */}
            {selectedError && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-96 overflow-y-auto">
                        <div className="p-6 border-b">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold">Error Details</h3>
                                <button
                                    onClick={() => setSelectedError(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <h4 className="font-medium mb-1">Error Message</h4>
                                <p className="text-sm text-gray-700">{selectedError.message}</p>
                            </div>

                            {selectedError.stack && (
                                <div>
                                    <h4 className="font-medium mb-1">Stack Trace</h4>
                                    <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                                        {selectedError.stack}
                                    </pre>
                                </div>
                            )}

                            {selectedError.user_actions && selectedError.user_actions.length > 0 && (
                                <div>
                                    <h4 className="font-medium mb-1">User Actions (Last 10)</h4>
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {selectedError.user_actions.slice(-10).map((action, index) => (
                                            <div key={index} className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
                                                <strong>{action.type}:</strong> {action.element || action.url || 'N/A'}
                                                <span className="float-right">
                                                    {new Date(action.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <strong>URL:</strong> {selectedError.url}
                                </div>
                                <div>
                                    <strong>Session ID:</strong> {selectedError.session_id}
                                </div>
                                <div>
                                    <strong>User Agent:</strong> {selectedError.user_agent}
                                </div>
                                <div>
                                    <strong>Created At:</strong> {new Date(selectedError.created_at).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminErrorDashboard;
