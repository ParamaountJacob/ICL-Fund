import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, TrendingUp, Clock, Eye, ArrowRight, Phone, Mail, Globe } from 'lucide-react';

const Overview: React.FC = () => {
    const [showDetailedSection, setShowDetailedSection] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const detailedSectionRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            if (detailedSectionRef.current) {
                const rect = detailedSectionRef.current.getBoundingClientRect();
                const isVisible = rect.top < window.innerHeight * 0.7; // Show when 70% into view
                setShowDetailedSection(isVisible);
            }
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Check initial position

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Optimize scroll handling with better performance
    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            const windowHeight = window.innerHeight;

            // Show detailed section after scrolling 20% of viewport
            if (scrollY > windowHeight * 0.2 && !showDetailedSection) {
                setShowDetailedSection(true);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [showDetailedSection]);

    const handleNavigation = async (path: string) => {
        setIsTransitioning(true);

        // Shorter transition for better perceived performance
        await new Promise(resolve => setTimeout(resolve, 150));

        navigate(path);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-6 py-8 pt-24 md:pt-32">
            {/* Page Transition Overlay */}
            <AnimatePresence>
                {isTransitioning && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 bg-black z-50 flex items-center justify-center"
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className="text-gold text-xl font-display tracking-wider flex flex-col items-center"
                        >
                            <div className="mb-4">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="w-6 h-6 border-2 border-gold/20 border-t-gold rounded-full"
                                ></motion.div>
                            </div>
                            Transitioning...
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Business Card Container - Optimized for faster loading */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-5xl mx-auto"
            >
                {/* Main Business Card - Simplified for performance */}
                <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-xl overflow-hidden shadow-2xl border border-gold/30">
                    {/* Simplified Border Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-gold/30 rounded-tl-xl"></div>
                        <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-gold/30 rounded-tr-xl"></div>
                        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-gold/30 rounded-bl-xl"></div>
                        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-gold/30 rounded-br-xl"></div>
                    </div>

                    {/* Simple Corner Elements */}
                    <div className="absolute top-4 left-4 w-6 h-6 opacity-20">
                        <div className="w-full h-full border border-gold/40 rounded-full"></div>
                    </div>
                    <div className="absolute top-4 right-4 w-6 h-6 opacity-20">
                        <div className="w-full h-full border border-gold/40 rounded-full"></div>
                    </div>

                    {/* Card Content */}
                    <div className="relative z-10 p-6 md:p-10 lg:p-12">
                        {/* Header Section - Logo & Company Name */}
                        <div className="text-center mb-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.3 }}
                                className="flex items-center justify-center mb-6"
                            >
                                <img
                                    src="https://res.cloudinary.com/digjsdron/image/upload/v1746553996/icl-logo_egk3su.webp"
                                    alt="Inner Circle Lending"
                                    className="h-16 w-auto mr-4 filter brightness-110"
                                />
                                <div className="text-left">
                                    <h1 className="text-2xl md:text-3xl font-display font-light text-white tracking-wider gold-text-shadow">
                                        INNER CIRCLE
                                    </h1>
                                    <h2 className="text-xl md:text-2xl font-display font-thin text-gold tracking-widest gold-text-shadow">
                                        LENDING
                                    </h2>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.6 }}
                                className="w-32 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mb-6"
                            ></motion.div>

                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.8 }}
                                className="text-gold/90 font-light text-lg tracking-wide"
                            >
                                Private Lending. Simplified.
                            </motion.p>
                        </div>

                        {/* Key Metrics - Card Style */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
                        >
                            <div className="text-center p-4 luxury-glass rounded-lg backdrop-blur-sm">
                                <TrendingUp className="w-8 h-8 text-gold mx-auto mb-2" />
                                <h3 className="text-xl font-bold text-white mb-1">11-15%</h3>
                                <p className="text-gold/70 text-sm">Fixed Returns</p>
                            </div>
                            <div className="text-center p-4 luxury-glass rounded-lg backdrop-blur-sm">
                                <Clock className="w-8 h-8 text-gold mx-auto mb-2" />
                                <h3 className="text-xl font-bold text-white mb-1">1-2 Years</h3>
                                <p className="text-gold/70 text-sm">Investment Tiers</p>
                            </div>
                            <div className="text-center p-4 luxury-glass rounded-lg backdrop-blur-sm">
                                <Eye className="w-8 h-8 text-gold mx-auto mb-2" />
                                <h3 className="text-xl font-bold text-white mb-1">100%</h3>
                                <p className="text-gold/70 text-sm">Discretion</p>
                            </div>
                        </motion.div>

                        {/* What We Do - Elegant List */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                            className="mb-8"
                        >
                            <h3 className="text-gold text-lg font-semibold mb-4 text-center tracking-wide">What We Do</h3>
                            <div className="space-y-3">
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                                    <p className="text-white/90 text-sm leading-relaxed">
                                        <span className="text-gold font-medium">Short-term lending</span> to high-income professionals with temporary liquidity needs
                                    </p>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                                    <p className="text-white/90 text-sm leading-relaxed">
                                        <span className="text-gold font-medium">Tax liability redirection</span> into yield-generating assets through IRS-approved strategies
                                    </p>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0"></div>
                                    <p className="text-white/90 text-sm leading-relaxed">
                                        <span className="text-gold font-medium">Proprietary model</span> kept intentionally private for clients who value discretion
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Contact Section - Business Card Style */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 1.4 }}
                            className="border-t border-gold/30 pt-6"
                        >
                            <div className="flex flex-col md:flex-row justify-between items-center">
                                <div className="mb-4 md:mb-0">
                                    <div className="flex items-center space-x-4 text-sm text-white/80">
                                        <div className="flex items-center space-x-2">
                                            <Phone className="w-4 h-4 text-gold" />
                                            <span>713-913-3179</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Globe className="w-4 h-4 text-gold" />
                                            <span>WEAREICL.COM</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 items-center justify-center md:justify-end">
                                    <Link
                                        to="/contact"
                                        className="px-6 py-2 bg-gradient-to-r from-gold to-yellow-600 text-black font-semibold text-sm rounded-lg hover:from-yellow-600 hover:to-gold transition-all duration-300 shadow-lg"
                                    >
                                        Get In Touch
                                    </Link>
                                    <button
                                        onClick={() => handleNavigation('/')}
                                        className="px-6 py-2 border border-gold/50 text-gold font-semibold text-sm rounded-lg hover:bg-gold/10 transition-all duration-300"
                                    >
                                        Learn More
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Signature Section */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.7 }}
                            className="text-center mt-6"
                        >
                            <div className="w-48 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent mx-auto mb-3"></div>
                            <p className="text-white/60 text-xs italic tracking-wide">
                                Confidential consultation available for qualified investors
                            </p>
                        </motion.div>
                    </div>

                    {/* Subtle Background Pattern */}
                    <div className="absolute inset-0 opacity-5">
                        <div className="w-full h-full" style={{
                            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(212, 175, 55, 0.1) 0%, transparent 25%),
                                            radial-gradient(circle at 75% 75%, rgba(212, 175, 55, 0.1) 0%, transparent 25%)`
                        }}></div>
                    </div>
                </div>

                {/* Premium Scroll Indicator - Only visible when detailed section is hidden */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                        opacity: !showDetailedSection ? 1 : 0,
                        y: !showDetailedSection ? 0 : 20
                    }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="relative flex flex-col items-center justify-center mt-8 mb-4"
                >
                    {/* Subtle background glow */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gold/5 to-transparent blur-xl"></div>

                    {/* Main indicator container */}
                    <div className="relative flex flex-col items-center space-y-3">
                        {/* Elegant text hint */}
                        <motion.p
                            animate={{ opacity: [0.6, 1, 0.6] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="text-gold/70 text-xs tracking-widest uppercase font-light"
                        >
                            Scroll to Explore
                        </motion.p>

                        {/* Animated stability icon */}
                        <motion.div
                            animate={{
                                scale: [1, 1.1, 1],
                                opacity: [0.7, 1, 0.7]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="relative"
                        >
                            {/* Glow effect behind icon */}
                            <div className="absolute inset-0 bg-gold/20 blur-md rounded-full w-8 h-8 -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"></div>

                            {/* Shield/Stability icon */}
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                className="text-gold relative z-10"
                            >
                                <path
                                    d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    fill="currentColor"
                                    fillOpacity="0.1"
                                />
                                <circle
                                    cx="12"
                                    cy="12"
                                    r="3"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    fill="none"
                                />
                            </svg>
                        </motion.div>                        {/* Subtle line indicator */}
                        <motion.div
                            animate={{ scaleY: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="w-px h-8 bg-gradient-to-b from-gold/40 via-gold/20 to-transparent"
                        ></motion.div>
                    </div>
                </motion.div>

                {/* Clear Separator */}
                <motion.div
                    ref={detailedSectionRef}
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{
                        opacity: showDetailedSection ? 1 : 0,
                        scaleX: showDetailedSection ? 1 : 0
                    }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="w-full max-w-md mx-auto mt-12 mb-16"
                >
                    <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent"></div>
                    <div className="text-center mt-4">
                        <p className="text-gold/60 text-sm tracking-wider">FOR THOSE WHO WANT TO KNOW MORE</p>
                    </div>
                </motion.div>

                {/* Detailed Information Section */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{
                        opacity: showDetailedSection ? 1 : 0,
                        y: showDetailedSection ? 0 : 50
                    }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="max-w-4xl mx-auto space-y-8"
                >
                    {/* Our Approach */}
                    <div className="luxury-glass rounded-lg p-8">
                        <h3 className="text-2xl font-display font-light text-gold mb-6 text-center tracking-wide">
                            Our Approach
                        </h3>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="text-white font-semibold mb-3">Selective Partnership</h4>
                                <p className="text-white/80 text-sm leading-relaxed">
                                    We work exclusively with high-income professionals who value discretion and predictability.
                                    Our clients typically include successful physicians, business owners, and executives seeking
                                    alternatives to traditional investment volatility.
                                </p>
                            </div>
                            <div>
                                <h4 className="text-white font-semibold mb-3">Strategic Tax Integration</h4>
                                <p className="text-white/80 text-sm leading-relaxed">
                                    Through partnerships with tax strategists, we help clients redirect tax liabilities
                                    into yield-generating assets. This approach transforms mandatory expenses into
                                    productive capital, often improving after-tax returns significantly.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* The Advantage */}
                    <div className="luxury-glass rounded-lg p-8">
                        <h3 className="text-2xl font-display font-light text-gold mb-6 text-center tracking-wide">
                            Why Inner Circle
                        </h3>
                        <div className="space-y-6">
                            <div className="flex items-start space-x-4">
                                <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 mt-1">
                                    <div className="w-2 h-2 bg-gold rounded-full"></div>
                                </div>
                                <div>
                                    <h4 className="text-white font-semibold mb-2">Intentionally Private</h4>
                                    <p className="text-white/80 text-sm leading-relaxed">
                                        Our lending model remains proprietary by design. We believe sophisticated investors
                                        prefer discretion over public institutions, maintaining privacy for both borrowers and lenders.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 mt-1">
                                    <div className="w-2 h-2 bg-gold rounded-full"></div>
                                </div>
                                <div>
                                    <h4 className="text-white font-semibold mb-2">Agile Capital Deployment</h4>
                                    <p className="text-white/80 text-sm leading-relaxed">
                                        With 1-2 year terms instead of decade-long commitments, we can adapt quickly to market
                                        shifts and reallocate capital in real time. This flexibility benefits both our strategy
                                        and our investors' liquidity needs.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 mt-1">
                                    <div className="w-2 h-2 bg-gold rounded-full"></div>
                                </div>
                                <div>
                                    <h4 className="text-white font-semibold mb-2">Bespoke Solutions</h4>
                                    <p className="text-white/80 text-sm leading-relaxed">
                                        Rather than one-size-fits-all products, we build specific solutions for specific people.
                                        Each engagement is crafted around the individual's financial situation, timeline, and objectives.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Next Steps */}
                    <div className="text-center luxury-glass rounded-lg p-8">
                        <h3 className="text-2xl font-display font-light text-gold mb-4 tracking-wide">
                            Ready to Explore?
                        </h3>
                        <p className="text-white/80 mb-6 max-w-xl mx-auto">
                            Initial consultations are confidential and available to qualified investors.
                            We'll discuss your specific situation and determine if Inner Circle Lending aligns with your objectives.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/contact"
                                className="px-8 py-3 bg-gradient-to-r from-gold to-yellow-600 text-black font-semibold rounded-lg hover:from-yellow-600 hover:to-gold transition-all duration-300 shadow-lg"
                            >
                                Schedule Consultation
                            </Link>
                            <button
                                onClick={() => handleNavigation('/')}
                                className="px-8 py-3 border border-gold/50 text-gold font-semibold rounded-lg hover:bg-gold/10 transition-all duration-300"
                            >
                                Learn More
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Overview;
