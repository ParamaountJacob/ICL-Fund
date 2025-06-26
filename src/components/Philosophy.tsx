import React, { useRef } from 'react';
import { useInView, motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Philosophy: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

  return (
    <section className="py-12 md:py-32 bg-premium-gradient from-background to-surface bg-premium-pattern">
      <div className="section" ref={sectionRef}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center mb-8 md:mb-16 px-4 md:px-0"
        >
          <h2 className="heading-lg mb-8">Choose a Life of Freedom.<br />Let Us Handle the Rest.</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 md:gap-12 max-w-6xl mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center md:text-left"
          >
            <div className="h-px w-12 bg-gold mb-6"></div>
            <h3 className="text-xl font-display font-semibold mb-4">We lift the burden from you.</h3>
            <p className="text-text-secondary">
              Focus on living while we manage the complexities of private lending with complete discretion.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center md:text-left"
          >
            <div className="h-px w-12 bg-gold mb-6"></div>
            <h3 className="text-xl font-display font-semibold mb-4">We give you back your time.</h3>
            <p className="text-text-secondary">
              No more endless research or constant monitoring. We handle everything while you enjoy life.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center md:text-left"
          >
            <div className="h-px w-12 bg-gold mb-6"></div>
            <h3 className="text-xl font-display font-semibold mb-4">We deliver peace of mind.</h3>
            <p className="text-text-secondary">
              Experience the freedom of consistent returns without the stress of active management.
            </p>
          </motion.div>
        </div>

        <motion.div 
          className="mt-20 text-center"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <Link 
            to="/contact" 
            state={{ consultation: true }}
            className="button"
          >
            Get Started
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default Philosophy;