// Development-only logging utility with configurable levels
export const isDevelopment = import.meta.env.DEV;

// Force silent logging to reduce console noise
const LOG_LEVEL = 0;

export const logger = {
    log: (...args: any[]) => {
        if (isDevelopment && LOG_LEVEL >= 4) {
            console.log(...args);
        }
    },

    debug: (...args: any[]) => {
        if (isDevelopment && LOG_LEVEL >= 4) {
            console.log('[DEBUG]', ...args);
        }
    },

    info: (...args: any[]) => {
        if (isDevelopment && LOG_LEVEL >= 3) {
            console.info('[INFO]', ...args);
        }
    },

    warn: (...args: any[]) => {
        if (isDevelopment && LOG_LEVEL >= 2) {
            console.warn('[WARN]', ...args);
        }
    },

    error: (...args: any[]) => {
        // Always show errors, even with silent logging
        if (isDevelopment) {
            console.error('[ERROR]', ...args);
        }
    }
};
