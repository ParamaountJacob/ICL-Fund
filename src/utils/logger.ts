// Development-only logging utility with configurable levels
export const isDevelopment = import.meta.env.DEV;

// Force silent logging to reduce console noise
const LOG_LEVEL = -1; // Completely silent

export const logger = {
    log: (...args: any[]) => {
        // Completely disabled
    },

    debug: (...args: any[]) => {
        // Completely disabled
    },

    info: (...args: any[]) => {
        // Completely disabled
    },

    warn: (...args: any[]) => {
        // Completely disabled
    },

    error: (...args: any[]) => {
        // Only show critical errors
        if (isDevelopment && args[0] && !args[0].toString().includes('Sentry')) {
            console.error('[ERROR]', ...args);
        }
    }
};