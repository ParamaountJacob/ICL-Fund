import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

/**
 * Custom hook for debouncing values to improve performance
 */
export const useDebounce = <T>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

/**
 * Custom hook for throttling function calls
 */
export const useThrottle = <T extends (...args: any[]) => any>(
    callback: T,
    delay: number
): T => {
    const lastRan = useRef<number>(Date.now());

    return useCallback(
        ((...args: Parameters<T>) => {
            if (Date.now() - lastRan.current >= delay) {
                callback(...args);
                lastRan.current = Date.now();
            }
        }) as T,
        [callback, delay]
    );
};

/**
 * Custom hook for memoizing expensive calculations
 */
export const useExpensiveCalculation = <T>(
    calculate: () => T,
    dependencies: React.DependencyList
): T => {
    return useMemo(calculate, dependencies);
};

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
    private static measurements = new Map<string, number>();

    static startMeasurement(name: string): void {
        this.measurements.set(name, performance.now());
    }

    static endMeasurement(name: string): number {
        const startTime = this.measurements.get(name);
        if (!startTime) {
            console.warn(`No measurement started for: ${name}`);
            return 0;
        }

        const duration = performance.now() - startTime;
        this.measurements.delete(name);

        if (process.env.NODE_ENV === 'development') {
            console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
        }

        return duration;
    }

    static measureFunction<T extends (...args: any[]) => any>(
        fn: T,
        name: string
    ): T {
        return ((...args: Parameters<T>) => {
            this.startMeasurement(name);
            const result = fn(...args);
            this.endMeasurement(name);
            return result;
        }) as T;
    }

    static measureAsyncFunction<T extends (...args: any[]) => Promise<any>>(
        fn: T,
        name: string
    ): T {
        return (async (...args: Parameters<T>) => {
            this.startMeasurement(name);
            const result = await fn(...args);
            this.endMeasurement(name);
            return result;
        }) as T;
    }
}

/**
 * Higher-order component for performance monitoring
 */
export const withPerformanceMonitoring = <P extends object>(
    Component: React.ComponentType<P>,
    componentName: string
) => {
    const WrappedComponent = React.memo((props: P) => {
        useEffect(() => {
            PerformanceMonitor.startMeasurement(`${componentName}-render`);
            return () => {
                PerformanceMonitor.endMeasurement(`${componentName}-render`);
            };
        });

        return React.createElement(Component, props);
    });

    WrappedComponent.displayName = `withPerformanceMonitoring(${componentName})`;
    return WrappedComponent;
};

/**
 * Hook for measuring component render performance
 */
export const useRenderPerformance = (componentName: string) => {
    const renderCount = useRef(0);
    const lastRenderTime = useRef(performance.now());

    useEffect(() => {
        renderCount.current += 1;
        const now = performance.now();
        const timeSinceLastRender = now - lastRenderTime.current;
        lastRenderTime.current = now;

        if (process.env.NODE_ENV === 'development') {
            console.log(
                `🔄 ${componentName} rendered ${renderCount.current} times. ` +
                `Time since last render: ${timeSinceLastRender.toFixed(2)}ms`
            );
        }
    });

    return {
        renderCount: renderCount.current,
        lastRenderTime: lastRenderTime.current,
    };
};
