import * as Sentry from "@sentry/react";

export const initSentry = () => {
    if (import.meta.env.PROD) {
        Sentry.init({
            dsn: import.meta.env.VITE_SENTRY_DSN || "", // Add your Sentry DSN
            environment: import.meta.env.MODE,
            tracesSampleRate: 0.1, // Adjust sampling rate (10% in production)
            integrations: [
                Sentry.browserTracingIntegration(),
                Sentry.replayIntegration({
                    maskAllText: false,
                    blockAllMedia: false,
                }),
            ],
            beforeSend: (event, hint) => {
                // Filter out known noise
                if (event.exception) {
                    const error = hint.originalException;
                    if (error && typeof error === 'object' && 'message' in error) {
                        const message = error.message as string;
                        // Filter out webcontainer/StackBlitz specific errors
                        if (message.includes('webcontainer') || message.includes('credentialless')) {
                            return null;
                        }
                    }
                }
                return event;
            },
        });
    }
};
