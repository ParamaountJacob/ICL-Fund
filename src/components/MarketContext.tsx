import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const MarketContext: React.FC = () => {
    const sectionRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

    return (
        <section className="py-12 md:py-24 bg-premium-gradient from-surface to-background bg-premium-pattern">
            <div className="section" ref={sectionRef}>
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-5xl mx-auto text-center"
                >
                    <h3 className="text-2xl md:text-4xl font-display font-semibold mb-4">Why private credit now</h3>
                    <p className="text-base md:text-lg text-text-secondary max-w-3xl mx-auto mb-6">
                        Investor interest in private credit has strengthened in recent periods, as widely noted by leading institutions. Many investors are drawn to its income‑oriented, downside‑focused structures that aim for steadier cash flows and lower sensitivity to broad market swings.
                    </p>
                    <p className="text-xs md:text-sm text-text-secondary/80">
                        <a className="text-gold underline" href="https://privatebank.jpmorgan.com/latam/en/insights/markets-and-investing/why-private-credit-remains-a-strong-opportunity" target="_blank" rel="noreferrer">J.P. Morgan (2025)</a>
                        <span className="mx-2">·</span>
                        <a className="text-gold underline" href="https://www.blackrock.com/corporate/newsroom/press-releases/article/corporate-one/press-releases/blackrock-family-office-survey-2025" target="_blank" rel="noreferrer">BlackRock (2025)</a>
                        <span className="mx-2">·</span>
                        <a className="text-gold underline" href="https://rcmbrand.rockco.com/The%20Long%20and%20Short%20of%20It%20-%20Private%20Credit%20February%202024.pdf" target="_blank" rel="noreferrer">Rockefeller (2024)</a>
                    </p>
                </motion.div>
            </div>
        </section>
    );
};

export default MarketContext;
