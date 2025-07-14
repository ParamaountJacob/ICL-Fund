import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, TrendingUp, Clock, Eye, ArrowRight, Phone, Mail, Globe } from 'lucide-react';

const Overview: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-6 py-8 pt-24 md:pt-32">
            {/* Business Card Container - Desktop: Card Proportions, Mobile: Full Screen */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="w-full max-w-5xl mx-auto"
            >
                {/* Main Business Card */}
                <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-xl overflow-hidden business-card-shadow border border-gold/30">
                    {/* Ornate Border Pattern */}
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-gold/40 rounded-tl-xl"></div>
                        <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-gold/40 rounded-tr-xl"></div>
                        <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-gold/40 rounded-bl-xl"></div>
                        <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-gold/40 rounded-br-xl"></div>
                    </div>

                    {/* Decorative Corner Elements */}
                    <div className="absolute top-4 left-4 w-8 h-8 opacity-30">
                        <div className="w-full h-full border border-gold/60 rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 bg-gold/60 rounded-full"></div>
                        </div>
                    </div>
                    <div className="absolute top-4 right-4 w-8 h-8 opacity-30">
                        <div className="w-full h-full border border-gold/60 rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 bg-gold/60 rounded-full"></div>
                        </div>
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
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 1.0 }}
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
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 1.2 }}
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
                                            <span>847-736-2496</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Globe className="w-4 h-4 text-gold" />
                                            <span>WEAREICL.COM</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex space-x-3">
                                    <Link
                                        to="/contact"
                                        className="px-6 py-2 bg-gradient-to-r from-gold to-yellow-600 text-black font-semibold text-sm rounded-lg hover:from-yellow-600 hover:to-gold transition-all duration-300 shadow-lg"
                                    >
                                        Get In Touch
                                    </Link>
                                    <Link
                                        to="/"
                                        className="px-6 py-2 border border-gold/50 text-gold font-semibold text-sm rounded-lg hover:bg-gold/10 transition-all duration-300"
                                    >
                                        Learn More
                                    </Link>
                                </div>
                            </div>
                        </motion.div>

                        {/* Signature Section */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 1.6 }}
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
            </motion.div>
        </div>
    );
};

export default Overview;
