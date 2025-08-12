import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Video, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

// Dedicated Wayne booking page (updated widget ID provided by user).
const WAYNE_BOOKING_WIDGET = 'https://api.leadconnectorhq.com/widget/booking/lUYY4S2MCpGeexdimCwC';

const WayneContact: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    // Provide a taller height so embedded widget rarely needs its own scrollbar on mobile
    const [iframeHeight, setIframeHeight] = useState(1100);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 2000);

        // Inject LeadConnector script once (needed for some widgets to auto-resize)
        const scriptId = 'leadconnector-form-embed';
        if (!document.getElementById(scriptId)) {
            const s = document.createElement('script');
            s.id = scriptId;
            s.src = 'https://link.msgsndr.com/js/form_embed.js';
            s.async = true;
            document.body.appendChild(s);
        }

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        // After mount / orientation change, set a generous height: viewport + padding
        const compute = () => {
            const vh = window.innerHeight || 800;
            // Add extra space so widget internal content (header + calendar + timezone selector) fits
            const target = Math.max(vh + 500, 1100); // ensure at least 1100px
            setIframeHeight(target);
        };
        compute();
        window.addEventListener('orientationchange', compute);
        window.addEventListener('resize', compute);
        return () => {
            window.removeEventListener('orientationchange', compute);
            window.removeEventListener('resize', compute);
        };
    }, []);

    return (
        <div className="min-h-screen bg-background pt-20">
            {/* Sticky Header */}
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
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-gold/30 bg-gold/10 flex items-center justify-center">
                                <img
                                    src="https://res.cloudinary.com/digjsdron/image/upload/v1746554204/Wayne_Griswold_o3w3rl.webp"
                                    alt="Wayne Griswold"
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            </div>
                            <h1 className="text-lg md:text-xl font-semibold text-text-primary">Wayne Griswold</h1>
                        </div>
                        <div className="w-10 h-10" />
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 pt-24 pb-4 md:pt-14 md:pb-6 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-10 md:mb-14"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Catch Up With Wayne</h2>
                    <p className="text-text-secondary max-w-2xl mx-auto leading-relaxed">
                        A personal video session to reconnect with Wayne Griswold.
                    </p>
                </motion.div>

                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-center py-12"
                    >
                        <div className="flex items-center gap-3 text-text-secondary">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Loading Wayne's calendar...</span>
                        </div>
                    </motion.div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: isLoading ? 0 : 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="relative w-full"
                >
                    <div className="bg-surface border border-graphite rounded-lg overflow-hidden shadow-lg">
                        <iframe
                            src={WAYNE_BOOKING_WIDGET}
                            className="w-full block"
                            id="wayne-booking-widget"
                            style={{
                                height: `${iframeHeight}px`,
                                border: 'none',
                                background: 'transparent',
                                display: 'block'
                            }}
                            frameBorder="0"
                            scrolling="no"
                            loading="lazy"
                            title="Wayne Griswold Booking Calendar"
                            onLoad={() => setIsLoading(false)}
                        />
                    </div>
                </motion.div>

                {/* Footer space intentionally minimal after simplification */}
            </div>
        </div>
    );
};

export default WayneContact;
