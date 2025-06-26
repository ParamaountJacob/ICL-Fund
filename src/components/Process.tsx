import React, { useRef } from 'react';
import { useInView, motion } from 'framer-motion';
import { Shield, TrendingUp, Clock } from 'lucide-react';

const Process: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  return (
    <section id="process" className="py-12 md:py-32 bg-premium-gradient from-background to-surface bg-premium-pattern">
      <div className="section" ref={sectionRef}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto mb-16"
        >
          <h2 className="heading-lg text-center mb-6">Other Lenders Make a Show.<br />We Make It Work.</h2>
          <p className="text-text-secondary text-lg text-center max-w-2xl mx-auto">
            We handle everything from due diligence to risk management.
            You get consistent, reliable returns.
          </p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <motion.div 
            className="p-8 border border-graphite flex flex-col items-center text-center"
            variants={itemVariants}
          >
            <Shield className="w-12 h-12 text-gold mb-6" strokeWidth={1.5} />
            <h3 className="text-xl font-display font-semibold mb-4">We do the due diligence.</h3>
            <p className="text-text-secondary">
              Our team thoroughly vets every opportunity to ensure safety and performance.
            </p>
          </motion.div>

          <motion.div 
            className="p-8 border border-graphite flex flex-col items-center text-center"
            variants={itemVariants}
          >
            <TrendingUp className="w-12 h-12 text-gold mb-6" strokeWidth={1.5} />
            <h3 className="text-xl font-display font-semibold mb-4">We secure the loans.</h3>
            <p className="text-text-secondary">
              Our relationships allow us to negotiate terms that benefit our investors.
            </p>
          </motion.div>

          <motion.div 
            className="p-8 border border-graphite flex flex-col items-center text-center"
            variants={itemVariants}
          >
            <Clock className="w-12 h-12 text-gold mb-6" strokeWidth={1.5} />
            <h3 className="text-xl font-display font-semibold mb-4">We manage the risk.</h3>
            <p className="text-text-secondary">
              Our diverse portfolio and rigorous oversight protect your investment.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Process;