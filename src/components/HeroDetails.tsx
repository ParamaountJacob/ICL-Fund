import React, { useRef } from 'react';
import { useInView, motion } from 'framer-motion';
import { CircleDollarSign, FileText, Wallet } from 'lucide-react';
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

                        {/* Market context moved to its own section */}
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
                                Meet the <span className="founder-script">Founder</span>
                            </button>
                            <button
                                onClick={() => navigate('/docs')}
                                className="button-gold text-lg px-8 py-4 relative z-10 w-full max-w-xs sm:w-auto sm:min-w-[240px] text-center"
                            >
                                Learn More
                            </button>
                        </div>
                    </motion.div>

                    {/* Discover More Below with Arrow */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="flex flex-col items-center justify-center space-y-4 mt-8"
                    >
                        {/* Discover more text */}
                        <motion.p
                            animate={{ opacity: [0.4, 0.7, 0.4] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="text-text-secondary/60 text-sm tracking-wide"
                        >
                            Discover more below
                        </motion.p>

                        {/* Pulsing down arrow */}
                        <motion.div
                            animate={{
                                y: [0, 6, 0],
                                opacity: [0.5, 1, 0.5]
                            }}
                            transition={{
                                duration: 2.5,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                className="text-gold/60"
                            >
                                <path
                                    d="M7 10L12 15L17 10"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default HeroDetails;
