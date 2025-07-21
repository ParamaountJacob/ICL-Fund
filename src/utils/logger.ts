// Development-only logging utility with configurable levels
export const isDevelopment = import.meta.env.DEV;

// Log levels: 0 = silent, 1 = errors only, 2 = warnings + errors, 3 = info + warnings + errors, 4 = all (debug)
const LOG_LEVEL = parseInt(import.meta.env.VITE_LOG_LEVEL || '2');

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
        if (isDevelopment && LOG_LEVEL >= 1) {
            console.error('[ERROR]', ...args);
        }
    }
};
