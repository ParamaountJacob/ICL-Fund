import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, TrendingUp, Clock, Eye, ArrowRight } from 'lucide-react';

const Overview: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-surface to-background">
            {/* Hero Section */}
            <section className="pt-32 pb-16">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="flex items-center justify-center mb-8">
                            <img
                                src="https://res.cloudinary.com/digjsdron/image/upload/v1746553996/icl-logo_egk3su.webp"
                                alt="Inner Circle Lending"
                                className="h-12 w-auto mr-4"
                            />
                            <h1 className="text-3xl md:text-4xl font-display font-semibold text-text-primary">
                                Inner Circle Lending
                            </h1>
                        </div>
                        <p className="text-xl md:text-2xl text-gold font-light mb-4">
                            Private Lending. Simplified.
                        </p>
                        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                            Exclusive short-term lending for high-income professionals seeking discretion and predictable returns.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Key Metrics */}
            <section className="py-12">
                <div className="max-w-6xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="grid md:grid-cols-3 gap-8 mb-16"
                    >
                        <div className="text-center p-6 bg-surface border border-gold/20 rounded-lg">
                            <TrendingUp className="w-10 h-10 text-gold mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-text-primary mb-2">11-15%</h3>
                            <p className="text-text-secondary">Fixed Annual Returns</p>
                        </div>
                        <div className="text-center p-6 bg-surface border border-gold/20 rounded-lg">
                            <Clock className="w-10 h-10 text-gold mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-text-primary mb-2">6 Months</h3>
                            <p className="text-text-secondary">Average Loan Terms</p>
                        </div>
                        <div className="text-center p-6 bg-surface border border-gold/20 rounded-lg">
                            <Eye className="w-10 h-10 text-gold mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-text-primary mb-2">100%</h3>
                            <p className="text-text-secondary">Discretion Guaranteed</p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* What We Do */}
            <section className="py-12">
                <div className="max-w-4xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl font-display font-semibold text-text-primary mb-6">
                            What We Do
                        </h2>
                        <div className="max-w-3xl mx-auto space-y-6 text-left">
                            <div className="flex items-start space-x-4">
                                <div className="w-2 h-2 bg-gold rounded-full mt-3 flex-shrink-0"></div>
                                <p className="text-lg text-text-secondary">
                                    <span className="font-semibold text-text-primary">Short-term lending</span> exclusively to high-income professionals with temporary liquidity needs - not long-term commitments.
                                </p>
                            </div>
                            <div className="flex items-start space-x-4">
                                <div className="w-2 h-2 bg-gold rounded-full mt-3 flex-shrink-0"></div>
                                <p className="text-lg text-text-secondary">
                                    <span className="font-semibold text-text-primary">Tax liability redirection</span> - transform tax payments into yield-generating assets through IRS-approved strategies.
                                </p>
                            </div>
                            <div className="flex items-start space-x-4">
                                <div className="w-2 h-2 bg-gold rounded-full mt-3 flex-shrink-0"></div>
                                <p className="text-lg text-text-secondary">
                                    <span className="font-semibold text-text-primary">Proprietary lending model</span> kept intentionally private, serving clients who value discretion over public institutions.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Who We Serve */}
            <section className="py-12">
                <div className="max-w-4xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="text-center"
                    >
                        <h2 className="text-3xl font-display font-semibold text-text-primary mb-8">
                            Who We Serve
                        </h2>
                        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                            <div className="p-6 bg-surface border border-graphite/30 rounded-lg text-left">
                                <h3 className="font-semibold text-text-primary mb-3">High-Income Professionals</h3>
                                <p className="text-text-secondary text-sm">
                                    Doctors, business owners, investors experiencing short-term liquidity challenges who have real wealth but choose discretion over traditional institutions.
                                </p>
                            </div>
                            <div className="p-6 bg-surface border border-graphite/30 rounded-lg text-left">
                                <h3 className="font-semibold text-text-primary mb-3">Financial Transition Clients</h3>
                                <p className="text-text-secondary text-sm">
                                    Individuals navigating delayed settlements, equity events, or private matters who need quick, quiet solutions without lengthy commitments.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* The Advantage */}
            <section className="py-12">
                <div className="max-w-4xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                        className="bg-gradient-to-r from-gold/5 to-transparent p-8 rounded-lg border border-gold/20"
                    >
                        <div className="flex items-center mb-6">
                            <Shield className="w-8 h-8 text-gold mr-3" />
                            <h2 className="text-2xl font-display font-semibold text-text-primary">
                                The Inner Circle Advantage
                            </h2>
                        </div>
                        <div className="space-y-4">
                            <p className="text-text-secondary">
                                <span className="font-semibold text-text-primary">Quick 6-month terms</span> - not 5-10 year commitments. We move quickly, adapt to market shifts, and reallocate capital in real time.
                            </p>
                            <p className="text-text-secondary">
                                <span className="font-semibold text-text-primary">Collaboration with tax strategists</span> - for many investors, we don't just provide returns but help redirect tax liability directly into the fund, turning expenses into productive assets.
                            </p>
                            <p className="text-text-secondary">
                                <span className="font-semibold text-text-primary">Intentionally private</span> - our lending model is proprietary and kept close. We build specific solutions for specific people, maintaining discretion on both sides.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="py-16 pb-24">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 1.0 }}
                    >
                        <h2 className="text-2xl font-display font-semibold text-text-primary mb-8">
                            Ready to Learn More?
                        </h2>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/contact"
                                className="inline-flex items-center justify-center px-8 py-4 bg-gold text-background font-semibold rounded-lg hover:bg-gold/90 transition-all duration-300"
                            >
                                Get In Touch
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Link>
                            <Link
                                to="/"
                                className="inline-flex items-center justify-center px-8 py-4 border border-text-primary text-text-primary font-semibold rounded-lg hover:bg-text-primary hover:text-background transition-all duration-300"
                            >
                                Learn More
                            </Link>
                        </div>
                        <p className="text-sm text-text-secondary mt-6">
                            Confidential consultation available for qualified investors.
                        </p>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default Overview;
