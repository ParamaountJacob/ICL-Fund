import React, { useRef } from 'react';
import { useInView, motion } from 'framer-motion';
import { CircleDollarSign, FileText, Wallet, TrendingUp, Shield, Settings, Users, Gem } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HeroDetails: React.FC = () => {
    const navigate = useNavigate();
    const sectionRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

    return (
        <section className="min-h-screen py-20 md:py-32 bg-background relative overflow-hidden" ref={sectionRef} style={{ marginTop: '100vh', zIndex: 10, position: 'relative' }}>
            {/* Golden accent elements */}
            <div className="absolute top-20 right-10 w-32 h-32 bg-gold/5 rounded-full blur-xl"></div>
            <div className="absolute bottom-32 left-10 w-24 h-24 bg-gold/10 rounded-full blur-2xl"></div>
            <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-gold/8 rounded-full blur-lg"></div>

            <div className="section relative z-10">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                        transition={{ duration: 0.8 }}
                        className="mb-16 text-center relative"
                    >
                        {/* Golden accent behind heading */}
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-64 h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-30"></div>

                        <h2 className="text-3xl md:text-5xl font-light mb-6 text-white">
                            11-15% Fixed Returns
                        </h2>
                        <p className="text-xl md:text-2xl text-text-secondary leading-relaxed max-w-3xl mx-auto mb-8">
                            For accredited investors seeking predictable returns independent of market volatility.
                        </p>
                        <p className="text-lg md:text-xl text-text-secondary/90 leading-relaxed max-w-4xl mx-auto">
                            Turn your tax liability into a yield-generating asset. We help you unlock funds from dormant 401(k)s,
                            tax payments, or crypto holdings and deploy them strategically across short-term, secured business loans.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="grid md:grid-cols-3 gap-8 mb-16"
                    >
                        <div className="bg-surface p-8 rounded-lg border border-graphite relative group hover:border-gold/30 transition-all duration-300">
                            <FileText className="w-10 h-10 text-gold mb-6" />
                            <h3 className="text-xl font-semibold mb-4">Self-Directed Retirement</h3>
                            <p className="text-text-secondary leading-relaxed">
                                Direct 401(k)/IRA funds into high-yield investments while keeping tax benefits and building wealth faster.
                            </p>
                        </div>

                        <div className="bg-surface p-8 rounded-lg border border-gold/20 relative group hover:border-gold/40 transition-all duration-300">
                            {/* Golden frame effect for center card */}
                            <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-transparent to-gold/5 rounded-lg"></div>
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gold/40 rounded-tl-lg"></div>
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gold/40 rounded-br-lg"></div>
                            <div className="relative z-10">
                                <CircleDollarSign className="w-10 h-10 text-gold mb-6" />
                                <h3 className="text-xl font-semibold mb-4">Tax Repositioning</h3>
                                <p className="text-text-secondary leading-relaxed">
                                    Transform tax payments into investment opportunities with IRS-approved strategies that create wealth instead of expense.
                                </p>
                            </div>
                        </div>

                        <div className="bg-surface p-8 rounded-lg border border-graphite relative group hover:border-gold/30 transition-all duration-300">
                            <Wallet className="w-10 h-10 text-gold mb-6" />
                            <h3 className="text-xl font-semibold mb-4">Crypto Income Stream</h3>
                            <p className="text-text-secondary leading-relaxed">
                                Convert volatile crypto holdings into steady monthly income through our secured lending platform.
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="relative mb-16"
                    >
                        {/* Golden glow behind buttons */}
                        <div className="absolute inset-0 bg-gold/5 rounded-lg blur-2xl transform scale-150"></div>

                        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                            <button
                                onClick={() => navigate('/contact', { state: { consultation: true } })}
                                className="button text-lg px-8 py-4 relative z-10 w-full max-w-xs sm:w-auto sm:min-w-[240px]"
                            >
                                Schedule Free Consultation
                            </button>
                            <a href="#unlock" className="button-gold text-lg px-8 py-4 relative z-10 w-full max-w-xs sm:w-auto sm:min-w-[240px] text-center">
                                Learn More
                            </a>
                        </div>
                    </motion.div>

                    {/* Ultra-Premium Navigation Pills */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="flex flex-col items-center justify-center space-y-8 mt-8"
                    >
                        {/* Navigation Container */}
                        <div className="relative">
                            {/* Elegant background glow */}
                            <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-gold/10 to-gold/5 rounded-2xl blur-xl transform scale-110"></div>

                            {/* Navigation Pills */}
                            <div className="relative flex flex-col sm:flex-row sm:flex-wrap justify-center gap-5 p-8 bg-surface/30 backdrop-blur-md border border-gold/20 rounded-2xl max-w-5xl mx-auto">
                                {[
                                    { label: 'Returns', anchor: '#returns', Icon: TrendingUp },
                                    { label: 'Security', anchor: '#security', Icon: Shield },
                                    { label: 'Process', anchor: '#process', Icon: Settings },
                                    { label: 'Leadership', anchor: '#leadership', Icon: Users },
                                    { label: 'Investment', anchor: '#investment', Icon: Gem }
                                ].map((item, index) => (
                                    <motion.a
                                        key={item.label}
                                        href={item.anchor}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.4, delay: 0.8 + (index * 0.1) }}
                                        whileHover={{
                                            scale: 1.02,
                                            backgroundColor: 'rgba(212, 175, 55, 0.1)'
                                        }}
                                        whileTap={{ scale: 0.98 }}
                                        className="group flex items-center justify-center sm:justify-start space-x-4 px-10 py-6 bg-surface/40 hover:bg-surface/60 border border-gold/30 hover:border-gold/60 rounded-xl transition-all duration-300 backdrop-blur-sm relative overflow-hidden min-w-[160px] sm:min-w-[200px]"
                                    >
                                        <item.Icon className="w-5 h-5 text-gold/80 group-hover:text-gold transition-colors duration-300" strokeWidth={1.5} />
                                        <span className="text-gold/90 group-hover:text-gold font-medium text-sm tracking-wide">
                                            {item.label}
                                        </span>

                                        {/* Subtle shine effect on hover */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    </motion.a>
                                ))}
                            </div>
                        </div>

                        {/* Elegant subtitle */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 1.3 }}
                            className="text-text-secondary/70 text-sm tracking-widest uppercase font-light"
                        >
                            Explore Our Framework
                        </motion.p>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default HeroDetails;
