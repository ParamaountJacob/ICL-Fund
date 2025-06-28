import React from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

interface CalendlyEmbedProps {
    isOpen: boolean;
    onClose: () => void;
    calendlyUrl: string;
    consultationType: 'video' | 'phone';
}

declare global {
    interface Window {
        Calendly?: {
            initInlineWidget: (options: {
                url: string;
                parentElement: Element;
                prefill?: Record<string, any>;
            }) => void;
        };
    }
}

const CalendlyEmbed: React.FC<CalendlyEmbedProps> = ({
    isOpen,
    onClose,
    calendlyUrl,
    consultationType
}) => {
    // DEMO MODE - No actual Calendly integration
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-surface rounded-xl w-full max-w-4xl h-[95vh] sm:h-[90vh] flex flex-col border border-graphite"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-graphite">
                    <div>
                        <h2 className="text-lg sm:text-2xl font-semibold text-text-primary">
                            Schedule Your {consultationType === 'video' ? 'Video' : 'Phone'} Consultation
                        </h2>
                        <p className="text-text-secondary mt-1 text-sm sm:text-base">
                            DEMO MODE - Calendar integration disabled
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-text-secondary hover:text-text-primary text-xl sm:text-2xl font-light min-w-[24px]"
                    >
                        ×
                    </button>
                </div>

                {/* Demo Content */}
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                        <div className="w-20 h-20 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Calendar className="w-10 h-10 text-gold" />
                        </div>
                        <h3 className="text-2xl font-semibold text-text-primary mb-4">
                            Calendar Integration
                        </h3>
                        <p className="text-text-secondary mb-6 max-w-md">
                            This is where the Calendly scheduling widget would appear.
                            Currently in demo mode - no backend integration.
                        </p>
                        <div className="space-y-3 text-left bg-accent p-4 rounded-lg max-w-md">
                            <p className="text-sm text-text-secondary">
                                <strong>Submitted Details:</strong>
                            </p>
                            <p className="text-sm text-text-primary">Type: {consultationType}</p>
                            <p className="text-sm text-text-primary">URL: {calendlyUrl}</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default CalendlyEmbed;
