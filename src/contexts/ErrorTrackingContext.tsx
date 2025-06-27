// ADVANCED ERROR TRACKING & DEBUGGING SYSTEM
// Comprehensive error monitoring with admin notifications and session replay

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface ErrorDetail {
    id: string;
    message: string;
    stack?: string;
    componentStack?: string;
    url: string;
    userAgent: string;
    timestamp: Date;
    userId?: string;
    userEmail?: string;
    context?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    resolved: boolean;
    sessionId: string;
}

interface UserAction {
    type: 'click' | 'input' | 'navigation' | 'api_call' | 'error';
    element?: string;
    url?: string;
    data?: any;
    timestamp: Date;
}

interface ErrorTrackingContextType {
    errors: ErrorDetail[];
    userActions: UserAction[];
    sessionId: string;
    trackError: (error: Error, context?: string, severity?: ErrorDetail['severity']) => void;
    trackUserAction: (action: Omit<UserAction, 'timestamp'>) => void;
    resolveError: (errorId: string) => void;
    exportErrorReport: (errorId: string) => void;
    clearErrors: () => void;
    getErrorStats: () => {
        total: number;
        byStatus: Record<string, number>;
        bySeverity: Record<string, number>;
    };
}

const ErrorTrackingContext = createContext<ErrorTrackingContextType | undefined>(undefined);

export const useErrorTracking = () => {
    const context = useContext(ErrorTrackingContext);
    if (!context) {
        throw new Error('useErrorTracking must be used within an ErrorTrackingProvider');
    }
    return context;
};

export const ErrorTrackingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [errors, setErrors] = useState<ErrorDetail[]>([]);
    const [userActions, setUserActions] = useState<UserAction[]>([]);
    const [sessionId] = useState(() => generateSessionId());

    // Generate unique session ID
    function generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    }

    // Track user interactions for session replay
    useEffect(() => {
        const trackClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const element = target.tagName.toLowerCase() +
                (target.id ? `#${target.id}` : '') +
                (target.className ? `.${target.className.split(' ').join('.')}` : '');

            trackUserAction({
                type: 'click',
                element,
                data: {
                    x: e.clientX,
                    y: e.clientY,
                    button: e.button
                }
            });
        };

        const trackInput = (e: Event) => {
            const target = e.target as HTMLInputElement;
            if (target.type === 'password') return; // Don't track passwords

            trackUserAction({
                type: 'input',
                element: target.name || target.id || target.tagName.toLowerCase(),
                data: {
                    value: target.value.length, // Track length, not actual value for privacy
                    type: target.type
                }
            });
        };

        const trackNavigation = () => {
            trackUserAction({
                type: 'navigation',
                url: window.location.href
            });
        };

        // Add event listeners
        document.addEventListener('click', trackClick);
        document.addEventListener('input', trackInput);
        window.addEventListener('popstate', trackNavigation);

        // Track initial page load
        trackNavigation();

        return () => {
            document.removeEventListener('click', trackClick);
            document.removeEventListener('input', trackInput);
            window.removeEventListener('popstate', trackNavigation);
        };
    }, []);

    // Auto-cleanup old actions (keep last 100)
    useEffect(() => {
        if (userActions.length > 100) {
            setUserActions(prev => prev.slice(-100));
        }
    }, [userActions.length]);

    const trackError = async (
        error: Error,
        context?: string,
        severity: ErrorDetail['severity'] = 'medium'
    ) => {
        try {
            // Get current user info
            const { data: { user } } = await supabase.auth.getUser();

            const errorDetail: ErrorDetail = {
                id: `error_${Date.now()}_${Math.random().toString(36).substring(2)}`,
                message: error.message,
                stack: error.stack,
                url: window.location.href,
                userAgent: navigator.userAgent,
                timestamp: new Date(),
                userId: user?.id,
                userEmail: user?.email,
                context,
                severity,
                resolved: false,
                sessionId
            };

            setErrors(prev => [errorDetail, ...prev]);

            // Store in database for admin review
            await supabase
                .from('error_logs')
                .insert({
                    id: errorDetail.id,
                    message: errorDetail.message,
                    stack: errorDetail.stack,
                    url: errorDetail.url,
                    user_agent: errorDetail.userAgent,
                    user_id: errorDetail.userId,
                    user_email: errorDetail.userEmail,
                    context: errorDetail.context,
                    severity: errorDetail.severity,
                    session_id: errorDetail.sessionId,
                    user_actions: userActions.slice(-20), // Last 20 actions for context
                    created_at: new Date().toISOString()
                });

            // Send immediate notification for critical errors
            if (severity === 'critical') {
                await notifyAdminsOfCriticalError(errorDetail);
            }

            console.error('Error tracked:', errorDetail);
        } catch (trackingError) {
            console.error('Failed to track error:', trackingError);
        }
    };

    const trackUserAction = (action: Omit<UserAction, 'timestamp'>) => {
        const actionWithTimestamp: UserAction = {
            ...action,
            timestamp: new Date()
        };

        setUserActions(prev => [...prev, actionWithTimestamp]);
    };

    const resolveError = async (errorId: string) => {
        setErrors(prev => prev.map(error =>
            error.id === errorId ? { ...error, resolved: true } : error
        ));

        // Update in database
        await supabase
            .from('error_logs')
            .update({ resolved: true })
            .eq('id', errorId);
    };

    const exportErrorReport = (errorId: string) => {
        const error = errors.find(e => e.id === errorId);
        if (!error) return;

        const report = {
            error,
            sessionActions: userActions.slice(-50), // Last 50 actions
            browserInfo: {
                userAgent: navigator.userAgent,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                },
                url: window.location.href,
                timestamp: new Date().toISOString()
            },
            systemInfo: {
                memory: (performance as any).memory ? {
                    used: (performance as any).memory.usedJSHeapSize,
                    total: (performance as any).memory.totalJSHeapSize,
                    limit: (performance as any).memory.jsHeapSizeLimit
                } : null,
                connection: (navigator as any).connection ? {
                    type: (navigator as any).connection.effectiveType,
                    downlink: (navigator as any).connection.downlink
                } : null
            }
        };

        // Download as JSON
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `error-report-${errorId}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const clearErrors = () => {
        setErrors([]);
    };

    const getErrorStats = () => {
        const total = errors.length;
        const byStatus = errors.reduce((acc, error) => {
            const status = error.resolved ? 'resolved' : 'unresolved';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const bySeverity = errors.reduce((acc, error) => {
            acc[error.severity] = (acc[error.severity] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return { total, byStatus, bySeverity };
    };

    // Notify admins of critical errors
    const notifyAdminsOfCriticalError = async (error: ErrorDetail) => {
        try {
            await supabase
                .from('admin_notifications')
                .insert({
                    type: 'critical_error',
                    title: 'Critical Error Detected',
                    message: `Critical error in ${error.context || 'application'}: ${error.message}`,
                    data: {
                        errorId: error.id,
                        url: error.url,
                        userId: error.userId,
                        userEmail: error.userEmail
                    },
                    priority: 'high',
                    created_at: new Date().toISOString()
                });
        } catch (notificationError) {
            console.error('Failed to notify admins:', notificationError);
        }
    };

    const value: ErrorTrackingContextType = {
        errors,
        userActions,
        sessionId,
        trackError,
        trackUserAction,
        resolveError,
        exportErrorReport,
        clearErrors,
        getErrorStats
    };

    return (
        <ErrorTrackingContext.Provider value={value}>
            {children}
            <ErrorTrackingOverlay />
        </ErrorTrackingContext.Provider>
    );
};

// Development overlay for error tracking
const ErrorTrackingOverlay: React.FC = () => {
    const { errors, getErrorStats, clearErrors, exportErrorReport } = useErrorTracking();
    const [isVisible, setIsVisible] = useState(false);
    const stats = getErrorStats();

    // Only show in development or for admin users
    if (process.env.NODE_ENV === 'production') {
        return null;
    }

    // Toggle with Ctrl+Shift+E
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'E') {
                setIsVisible(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!isVisible) {
        return errors.length > 0 ? (
            <div className="fixed bottom-16 right-4 bg-red-600 text-white text-xs p-2 rounded opacity-75">
                {errors.length} error(s) - Ctrl+Shift+E
            </div>
        ) : null;
    }

    return (
        <div className="fixed top-4 left-4 bg-red-900 text-white p-4 rounded-lg shadow-lg max-w-md text-xs z-50 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold">Error Tracking</h3>
                <button
                    onClick={() => setIsVisible(false)}
                    className="text-white hover:text-gray-300"
                >
                    ×
                </button>
            </div>

            <div className="space-y-2">
                <div>
                    <strong>Total Errors:</strong> {stats.total}
                </div>

                <div>
                    <strong>By Severity:</strong>
                    {Object.entries(stats.bySeverity).map(([severity, count]) => (
                        <div key={severity} className="ml-2">
                            {severity}: {count}
                        </div>
                    ))}
                </div>

                <div>
                    <strong>Recent Errors:</strong>
                    {errors.slice(0, 5).map(error => (
                        <div key={error.id} className="ml-2 mb-2 p-2 bg-red-800 rounded">
                            <div className="font-medium">{error.message}</div>
                            <div className="text-xs opacity-75">
                                {error.context} - {error.severity} - {error.timestamp.toLocaleTimeString()}
                            </div>
                            <button
                                onClick={() => exportErrorReport(error.id)}
                                className="mt-1 bg-red-700 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                            >
                                Export Report
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <button
                onClick={clearErrors}
                className="mt-3 bg-red-700 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
            >
                Clear All Errors
            </button>
        </div>
    );
};

// Hook for automatic error tracking in components
export const useComponentErrorTracking = (componentName: string) => {
    const { trackError } = useErrorTracking();

    const trackComponentError = (error: Error, additionalContext?: string) => {
        const context = `Component: ${componentName}${additionalContext ? ` - ${additionalContext}` : ''}`;
        trackError(error, context, 'medium');
    };

    return { trackComponentError };
};

// HOC for automatic error boundary with tracking
export const withErrorTracking = <P extends object>(
    Component: React.ComponentType<P>,
    componentName: string
) => {
    return (props: P) => {
        const { trackError } = useErrorTracking();

        const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
            trackError(error, `Component: ${componentName} - ${errorInfo.componentStack}`, 'high');
        };

        return (
            <ErrorBoundary onError={handleError}>
                <Component {...props} />
            </ErrorBoundary>
        );
    };
};

// Simple Error Boundary component
class ErrorBoundary extends React.Component<
    { children: React.ReactNode; onError?: (error: Error, errorInfo: React.ErrorInfo) => void },
    { hasError: boolean }
> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    Something went wrong in this component.
                </div>
            );
        }

        return this.props.children;
    }
}
