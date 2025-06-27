import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

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
    useEffect(() => {
        if (isOpen) {
            // Load Calendly script if not already loaded
            if (!document.querySelector('script[src*="calendly"]')) {
                const script = document.createElement('script');
                script.src = 'https://assets.calendly.com/assets/external/widget.js';
                script.async = true;
                document.head.appendChild(script);
            }

            // Initialize Calendly widget when script loads
            const initCalendly = () => {
                const calendlyDiv = document.getElementById('calendly-embed-container');
                if (calendlyDiv && window.Calendly) {
                    window.Calendly.initInlineWidget({
                        url: calendlyUrl,
                        parentElement: calendlyDiv
                    });
                }
            };

            // Check if Calendly is already loaded
            if (window.Calendly) {
                initCalendly();
            } else {
                // Wait for script to load
                const checkCalendly = setInterval(() => {
                    if (window.Calendly) {
                        clearInterval(checkCalendly);
                        initCalendly();
                    }
                }, 100);

                return () => clearInterval(checkCalendly);
            }
        }
    }, [isOpen, calendlyUrl]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-surface rounded-xl w-full max-w-4xl h-[90vh] flex flex-col border border-graphite"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-graphite">
                    <div>
                        <h2 className="text-2xl font-semibold text-text-primary">
                            Schedule Your {consultationType === 'video' ? 'Video' : 'Phone'} Consultation
                        </h2>
                        <p className="text-text-secondary mt-1">
                            Select your preferred time slot below
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-text-secondary hover:text-text-primary text-2xl font-light"
                    >
                        ×
                    </button>
                </div>

                {/* Calendly Embed Container */}
                <div className="flex-1 relative overflow-hidden">
                    <div
                        id="calendly-embed-container"
                        className="w-full h-full"
                        style={{ minHeight: '700px' }}
                    />

                    {/* Fallback Link */}
                    <div className="absolute bottom-4 right-4">
                        <motion.a
                            href={calendlyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="inline-flex items-center gap-2 bg-gold text-background px-4 py-2 rounded-lg font-medium hover:bg-gold/90 transition-colors text-sm"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Can't see the calendar? Click here
                        </motion.a>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default CalendlyEmbed;
