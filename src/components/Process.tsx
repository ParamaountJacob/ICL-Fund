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
          <h2 className="heading-lg text-center mb-6">Smart Capital Deployment.<br />Consistent Investor Returns.</h2>
          <p className="text-text-secondary text-lg text-center max-w-3xl mx-auto">
            While you enjoy 12-24 month investment terms with predictable returns, we deploy your capital across
            short-term opportunities (typically 6 months or less), allowing us to adapt quickly and maintain
            peak performance in any market condition.
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
            <h3 className="text-xl font-display font-semibold mb-4">We maintain agility.</h3>
            <p className="text-text-secondary">
              Short-term deployments mean we're never locked into underperforming assets. We pivot quickly when opportunities shift.
            </p>
          </motion.div>

          <motion.div
            className="p-8 border border-graphite flex flex-col items-center text-center"
            variants={itemVariants}
          >
            <TrendingUp className="w-12 h-12 text-gold mb-6" strokeWidth={1.5} />
            <h3 className="text-xl font-display font-semibold mb-4">We secure premium terms.</h3>
            <p className="text-text-secondary">
              Our focus on select niches where privacy commands a premium allows us to negotiate superior rates and terms.
            </p>
          </motion.div>

          <motion.div
            className="p-8 border border-graphite flex flex-col items-center text-center"
            variants={itemVariants}
          >
            <Clock className="w-12 h-12 text-gold mb-6" strokeWidth={1.5} />
            <h3 className="text-xl font-display font-semibold mb-4">We reallocate in real time.</h3>
            <p className="text-text-secondary">
              Unlike 5-10 year commitments, our model allows continuous optimization of capital allocation based on market performance.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Process;