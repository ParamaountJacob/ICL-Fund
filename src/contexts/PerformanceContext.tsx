// PERFORMANCE MONITORING SYSTEM
// Real-time tracking of application performance and user experience

import React, { createContext, useContext, useEffect, useState } from 'react';

interface PerformanceMetrics {
    pageLoadTime: number;
    apiResponseTimes: Record<string, number[]>;
    componentRenderTimes: Record<string, number>;
    errorCount: number;
    memoryUsage: number;
    databaseQueryTimes: Record<string, number[]>;
}

interface PerformanceContextType {
    metrics: PerformanceMetrics;
    trackApiCall: (endpoint: string, duration: number) => void;
    trackComponentRender: (componentName: string, duration: number) => void;
    trackError: (error: Error, context?: string) => void;
    trackDatabaseQuery: (query: string, duration: number) => void;
    getAverageApiTime: (endpoint: string) => number;
    getSlowQueries: () => Array<{ query: string; avgTime: number }>;
    exportMetrics: () => void;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

export const usePerformance = () => {
    const context = useContext(PerformanceContext);
    if (!context) {
        throw new Error('usePerformance must be used within a PerformanceProvider');
    }
    return context;
};

export const PerformanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [metrics, setMetrics] = useState<PerformanceMetrics>({
        pageLoadTime: 0,
        apiResponseTimes: {},
        componentRenderTimes: {},
        errorCount: 0,
        memoryUsage: 0,
        databaseQueryTimes: {}
    });

    // Track page load time
    useEffect(() => {
        const startTime = performance.now();

        const handleLoad = () => {
            const loadTime = performance.now() - startTime;
            setMetrics(prev => ({ ...prev, pageLoadTime: loadTime }));
        };

        if (document.readyState === 'complete') {
            handleLoad();
        } else {
            window.addEventListener('load', handleLoad);
            return () => window.removeEventListener('load', handleLoad);
        }
    }, []);

    // Monitor memory usage
    useEffect(() => {
        const updateMemoryUsage = () => {
            if ('memory' in performance) {
                const memory = (performance as any).memory;
                setMetrics(prev => ({
                    ...prev,
                    memoryUsage: memory.usedJSHeapSize / memory.jsHeapSizeLimit
                }));
            }
        };

        const interval = setInterval(updateMemoryUsage, 10000); // Every 10 seconds
        return () => clearInterval(interval);
    }, []);

    const trackApiCall = (endpoint: string, duration: number) => {
        setMetrics(prev => ({
            ...prev,
            apiResponseTimes: {
                ...prev.apiResponseTimes,
                [endpoint]: [...(prev.apiResponseTimes[endpoint] || []), duration]
            }
        }));

        // Alert if API call is unusually slow
        if (duration > 5000) {
            console.warn(`Slow API call detected: ${endpoint} took ${duration}ms`);
        }
    };

    const trackComponentRender = (componentName: string, duration: number) => {
        setMetrics(prev => ({
            ...prev,
            componentRenderTimes: {
                ...prev.componentRenderTimes,
                [componentName]: duration
            }
        }));

        // Alert if component render is slow
        if (duration > 100) {
            console.warn(`Slow component render: ${componentName} took ${duration}ms`);
        }
    };

    const trackError = (error: Error, context?: string) => {
        setMetrics(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));

        // Log error details for debugging
        console.error('Performance Tracker - Error:', {
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        });
    };

    const trackDatabaseQuery = (query: string, duration: number) => {
        const queryKey = query.split(' ')[0]; // Get query type (SELECT, INSERT, etc.)

        setMetrics(prev => ({
            ...prev,
            databaseQueryTimes: {
                ...prev.databaseQueryTimes,
                [queryKey]: [...(prev.databaseQueryTimes[queryKey] || []), duration]
            }
        }));

        // Alert if database query is slow
        if (duration > 1000) {
            console.warn(`Slow database query: ${queryKey} took ${duration}ms`);
        }
    };

    const getAverageApiTime = (endpoint: string) => {
        const times = metrics.apiResponseTimes[endpoint] || [];
        return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    };

    const getSlowQueries = () => {
        return Object.entries(metrics.databaseQueryTimes)
            .map(([query, times]) => ({
                query,
                avgTime: times.reduce((a, b) => a + b, 0) / times.length
            }))
            .filter(({ avgTime }) => avgTime > 500)
            .sort((a, b) => b.avgTime - a.avgTime);
    };

    const exportMetrics = () => {
        const exportData = {
            ...metrics,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            connection: (navigator as any).connection ? {
                effectiveType: (navigator as any).connection.effectiveType,
                downlink: (navigator as any).connection.downlink
            } : null
        };

        // Download as JSON file
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `performance-metrics-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const value: PerformanceContextType = {
        metrics,
        trackApiCall,
        trackComponentRender,
        trackError,
        trackDatabaseQuery,
        getAverageApiTime,
        getSlowQueries,
        exportMetrics
    };

    return (
        <PerformanceContext.Provider value={value}>
            {children}
            <PerformanceMonitorOverlay />
        </PerformanceContext.Provider>
    );
};

// Development-only performance overlay
const PerformanceMonitorOverlay: React.FC = () => {
    const { metrics, getSlowQueries, exportMetrics } = usePerformance();
    const [isVisible, setIsVisible] = useState(false);

    // Only show in development
    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    // Toggle with Ctrl+Shift+P
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'P') {
                setIsVisible(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!isVisible) {
        return (
            <div className="fixed bottom-4 right-4 bg-black text-white text-xs p-2 rounded opacity-50">
                Ctrl+Shift+P for performance metrics
            </div>
        );
    }

    const slowQueries = getSlowQueries();

    return (
        <div className="fixed top-4 right-4 bg-black text-white p-4 rounded-lg shadow-lg max-w-sm text-xs z-50 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold">Performance Metrics</h3>
                <button
                    onClick={() => setIsVisible(false)}
                    className="text-white hover:text-gray-300"
                >
                    ×
                </button>
            </div>

            <div className="space-y-2">
                <div>
                    <strong>Page Load:</strong> {metrics.pageLoadTime.toFixed(0)}ms
                </div>

                <div>
                    <strong>Memory Usage:</strong> {(metrics.memoryUsage * 100).toFixed(1)}%
                </div>

                <div>
                    <strong>Errors:</strong> {metrics.errorCount}
                </div>

                {Object.entries(metrics.apiResponseTimes).length > 0 && (
                    <div>
                        <strong>API Calls:</strong>
                        {Object.entries(metrics.apiResponseTimes).map(([endpoint, times]) => (
                            <div key={endpoint} className="ml-2">
                                {endpoint}: {(times.reduce((a, b) => a + b, 0) / times.length).toFixed(0)}ms avg
                            </div>
                        ))}
                    </div>
                )}

                {slowQueries.length > 0 && (
                    <div>
                        <strong>Slow Queries:</strong>
                        {slowQueries.slice(0, 3).map(({ query, avgTime }) => (
                            <div key={query} className="ml-2 text-yellow-300">
                                {query}: {avgTime.toFixed(0)}ms
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <button
                onClick={exportMetrics}
                className="mt-3 bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
            >
                Export Metrics
            </button>
        </div>
    );
};

// Hook for tracking component performance
export const useComponentPerformance = (componentName: string) => {
    const { trackComponentRender } = usePerformance();

    useEffect(() => {
        const startTime = performance.now();

        return () => {
            const renderTime = performance.now() - startTime;
            trackComponentRender(componentName, renderTime);
        };
    }, [componentName, trackComponentRender]);
};

// Hook for tracking API calls
export const useApiPerformance = () => {
    const { trackApiCall } = usePerformance();

    const trackCall = async <T,>(
        endpoint: string,
        apiCall: () => Promise<T>
    ): Promise<T> => {
        const startTime = performance.now();
        try {
            const result = await apiCall();
            const duration = performance.now() - startTime;
            trackApiCall(endpoint, duration);
            return result;
        } catch (error) {
            const duration = performance.now() - startTime;
            trackApiCall(`${endpoint} (ERROR)`, duration);
            throw error;
        }
    };

    return { trackCall };
};
