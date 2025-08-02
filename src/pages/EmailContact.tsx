import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const EmailContact: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate iframe loading
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-background pt-20">
            {/* Mobile-optimized Header */}
            <div className="fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-graphite">
                <div className="container mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center justify-center w-10 h-10 text-text-secondary hover:text-text-primary transition-colors duration-200 rounded-lg hover:bg-graphite/20"
                            aria-label="Go back"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gold/20 flex items-center justify-center">
                                <Mail className="w-4 h-4 md:w-5 md:h-5 text-gold" />
                            </div>
                            <h1 className="text-lg md:text-xl font-semibold text-text-primary">
                                Email Contact
                            </h1>
                        </div>

                        <div className="w-10 h-10"></div> {/* Spacer for balance */}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 pt-16 pb-6 md:pt-20 md:pb-8 max-w-4xl">
                {/* Loading State */}
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-center py-12"
                    >
                        <div className="flex items-center gap-3 text-text-secondary">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Loading contact form...</span>
                        </div>
                    </motion.div>
                )}

                {/* Enhanced Iframe Container */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: isLoading ? 0 : 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="relative w-full"
                >
                    <div className="bg-surface border border-graphite rounded-lg overflow-hidden shadow-lg">
                        <iframe
                            src="https://api.leadconnectorhq.com/widget/form/672F7WVRP5znSmIf35ts"
                            className="w-full"
                            style={{
                                height: 'min(1000px, 80vh)',
                                minHeight: '600px',
                                border: 'none',
                                background: 'transparent'
                            }}
                            frameBorder="0"
                            scrolling="no"
                            loading="lazy"
                            id="inline-672F7WVRP5znSmIf35ts"
                            data-layout="{'id':'INLINE'}"
                            data-trigger-type="alwaysShow"
                            data-trigger-value=""
                            data-activation-type="alwaysActivated"
                            data-activation-value=""
                            data-deactivation-type="neverDeactivate"
                            data-deactivation-value=""
                            data-form-name="ICL Email"
                            data-height="866"
                            data-layout-iframe-id="inline-672F7WVRP5znSmIf35ts"
                            data-form-id="672F7WVRP5znSmIf35ts"
                            title="ICL Email Contact Form"
                            onLoad={() => setIsLoading(false)}
                        />
                    </div>
                </motion.div>

                {/* Mobile Footer Info */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="mt-6 md:mt-8 text-center"
                >
                    <p className="text-sm text-text-secondary">
                        Need immediate assistance? Try our{' '}
                        <button
                            onClick={() => navigate('/video-call-booking')}
                            className="text-gold hover:text-gold/80 underline transition-colors"
                        >
                            video call booking
                        </button>
                        {' '}for same-day availability.
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default EmailContact;
