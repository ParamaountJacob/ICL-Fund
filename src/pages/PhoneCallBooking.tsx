import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const PhoneCallBooking: React.FC = () => {
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
                            className="flex items-center gap-2 px-3 py-2 text-text-secondary hover:text-text-primary transition-colors duration-200 md:px-4"
                            aria-label="Go back"
                        >
                            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="text-sm md:text-base">Back</span>
                        </button>

                        <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gold/20 flex items-center justify-center">
                                <Phone className="w-4 h-4 md:w-5 md:h-5 text-gold" />
                            </div>
                            <h1 className="text-lg md:text-xl font-semibold text-text-primary">
                                Phone Call
                            </h1>
                        </div>

                        <div className="w-16 md:w-20"></div> {/* Spacer for balance */}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 pt-12 pb-6 md:pt-16 md:pb-8 max-w-4xl">
                {/* Description */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-6 md:mb-8 text-center"
                >
                    <p className="text-base md:text-lg text-text-secondary leading-relaxed">
                        Direct phone consultation for focused discussion and immediate answers.
                    </p>
                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-gold/10 text-gold rounded-full text-sm">
                        <span className="w-2 h-2 bg-gold rounded-full animate-pulse"></span>
                        3-4 hours availability
                    </div>
                </motion.div>

                {/* Loading State */}
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-center py-12"
                    >
                        <div className="flex items-center gap-3 text-text-secondary">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Loading booking calendar...</span>
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
                            src="https://api.leadconnectorhq.com/widget/booking/ArouErFpNGMUDeiiUv5k"
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
                            id="ArouErFpNGMUDeiiUv5k_1754087680510"
                            title="Phone Call Booking Calendar"
                            onLoad={() => setIsLoading(false)}
                        />
                    </div>
                </motion.div>

                {/* Mobile Footer Info */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="mt-6 md:mt-8 text-center space-y-3"
                >
                    <div className="text-sm text-text-secondary">
                        <p className="mb-2">What to expect:</p>
                        <ul className="inline-flex flex-wrap gap-4 justify-center text-xs">
                            <li className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-gold rounded-full"></span>
                                Direct line call
                            </li>
                            <li className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-gold rounded-full"></span>
                                Focused discussion
                            </li>
                            <li className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-gold rounded-full"></span>
                                15-30 minutes
                            </li>
                        </ul>
                    </div>
                    <p className="text-sm text-text-secondary">
                        Need visual presentation?{' '}
                        <button
                            onClick={() => navigate('/video-call-booking')}
                            className="text-gold hover:text-gold/80 underline transition-colors"
                        >
                            Book a video call instead
                        </button>
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default PhoneCallBooking;
