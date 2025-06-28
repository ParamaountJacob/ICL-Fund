import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

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
    const calendlyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen || !calendlyRef.current || !calendlyUrl) return;

        // Load Calendly script if not already loaded
        if (!window.Calendly) {
            const script = document.createElement('script');
            script.src = 'https://assets.calendly.com/assets/external/widget.js';
            script.async = true;
            script.onload = () => {
                if (window.Calendly && calendlyRef.current) {
                    window.Calendly.initInlineWidget({
                        url: calendlyUrl,
                        parentElement: calendlyRef.current,
                        prefill: {
                            consultationType: consultationType
                        }
                    });
                }
            };
            document.head.appendChild(script);
        } else {
            // Calendly is already loaded
            if (calendlyRef.current) {
                calendlyRef.current.innerHTML = ''; // Clear previous widget
                window.Calendly.initInlineWidget({
                    url: calendlyUrl,
                    parentElement: calendlyRef.current,
                    prefill: {
                        consultationType: consultationType
                    }
                });
            }
        }

        // Cleanup function
        return () => {
            if (calendlyRef.current) {
                calendlyRef.current.innerHTML = '';
            }
        };
    }, [isOpen, calendlyUrl, consultationType]);

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
                    <h2 className="text-lg sm:text-2xl font-semibold text-text-primary">
                        Schedule Your {consultationType === 'video' ? 'Video' : 'Phone'} Consultation
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-text-secondary hover:text-text-primary text-xl sm:text-2xl font-light min-w-[24px]"
                    >
                        ×
                    </button>
                </div>

                {/* Calendly Widget */}
                <div className="flex-1 overflow-hidden">
                    <div
                        ref={calendlyRef}
                        className="w-full h-full"
                        style={{ minHeight: '500px' }}
                    />
                </div>
            </motion.div>
        </div>
    );
};

export default CalendlyEmbed;
