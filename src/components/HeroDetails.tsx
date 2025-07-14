import React, { useRef } from 'react';
import { useInView, motion } from 'framer-motion';
import { CircleDollarSign, FileText, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HeroDetails: React.FC = () => {
    const navigate = useNavigate();
    const sectionRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

    return (
        <section className="py-16 md:py-24 bg-background" ref={sectionRef}>
            <div className="section">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                        transition={{ duration: 0.8 }}
                        className="mb-16 text-center"
                    >
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
                        <div className="bg-surface p-8 rounded-lg border border-graphite">
                            <FileText className="w-10 h-10 text-gold mb-6" />
                            <h3 className="text-xl font-semibold mb-4">Self-Directed Retirement</h3>
                            <p className="text-text-secondary leading-relaxed">
                                Direct 401(k)/IRA funds into high-yield investments while keeping tax benefits and building wealth faster.
                            </p>
                        </div>

                        <div className="bg-surface p-8 rounded-lg border border-graphite">
                            <CircleDollarSign className="w-10 h-10 text-gold mb-6" />
                            <h3 className="text-xl font-semibold mb-4">Tax Repositioning</h3>
                            <p className="text-text-secondary leading-relaxed">
                                Transform tax payments into investment opportunities with IRS-approved strategies that create wealth instead of expense.
                            </p>
                        </div>

                        <div className="bg-surface p-8 rounded-lg border border-graphite">
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
                        className="flex flex-col sm:flex-row gap-6 justify-center"
                    >
                        <button
                            onClick={() => navigate('/contact', { state: { consultation: true } })}
                            className="button text-lg px-8 py-4"
                        >
                            Schedule Free Consultation
                        </button>
                        <a href="#unlock" className="button-gold text-lg px-8 py-4">
                            Learn More
                        </a>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default HeroDetails;
