import React, { useRef } from 'react';
import { useInView, motion } from 'framer-motion';
import { ArrowRight, DollarSign, FileText, TrendingUp, Banknote } from 'lucide-react';

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
          className="max-w-4xl mx-auto mb-16 text-center"
        >
          <h2 className="heading-lg mb-6">Simple Process. Sophisticated Results.</h2>
          <p className="text-text-secondary text-lg max-w-3xl mx-auto">
            Our streamlined approach delivers consistent returns through a proven four-step process designed for discretion and efficiency.
          </p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <motion.div
            className="relative bg-surface p-8 rounded-lg border border-graphite text-center"
            variants={itemVariants}
          >
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gold text-background rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <DollarSign className="w-12 h-12 text-gold mb-6 mx-auto" strokeWidth={1.5} />
            <h3 className="text-xl font-display font-semibold mb-4">Invest & Select Term</h3>
            <p className="text-text-secondary">
              You invest a minimum of $200k+ and select a 12 or 24-month term that fits your financial timeline.
            </p>
          </motion.div>

          <motion.div
            className="relative bg-surface p-8 rounded-lg border border-graphite text-center"
            variants={itemVariants}
          >
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gold text-background rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <FileText className="w-12 h-12 text-gold mb-6 mx-auto" strokeWidth={1.5} />
            <h3 className="text-xl font-display font-semibold mb-4">Receive Your Note</h3>
            <p className="text-text-secondary">
              We issue a private promissory note with a contractually fixed annual yield. Simple, transparent, secure.
            </p>
          </motion.div>

          <motion.div
            className="relative bg-surface p-8 rounded-lg border border-graphite text-center"
            variants={itemVariants}
          >
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gold text-background rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <TrendingUp className="w-12 h-12 text-gold mb-6 mx-auto" strokeWidth={1.5} />
            <h3 className="text-xl font-display font-semibold mb-4">Capital Deployed</h3>
            <p className="text-text-secondary">
              Your capital funds a portfolio of short-term (1-6 month), secured business loans to privacy-focused borrowers.
            </p>
          </motion.div>

          <motion.div
            className="relative bg-surface p-8 rounded-lg border border-graphite text-center"
            variants={itemVariants}
          >
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gold text-background rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
              4
            </div>
            <Banknote className="w-12 h-12 text-gold mb-6 mx-auto" strokeWidth={1.5} />
            <h3 className="text-xl font-display font-semibold mb-4">Get Paid</h3>
            <p className="text-text-secondary">
              You receive consistent, fixed payouts on your preferred schedule: monthly, quarterly, or annually.
            </p>
          </motion.div>
        </motion.div>

        {/* Why This Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-4xl mx-auto mt-16"
        >
          <div className="bg-accent p-8 rounded-lg border border-gold/20">
            <h3 className="text-xl font-semibold text-gold mb-6 text-center">Why This Model Works</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <h4 className="font-semibold mb-2">Agility</h4>
                <p className="text-text-secondary text-sm">Short-term deployments mean we're never locked into underperforming assets. We pivot quickly when opportunities shift.</p>
              </div>
              <div className="text-center">
                <h4 className="font-semibold mb-2">Premium Terms</h4>
                <p className="text-text-secondary text-sm">Our focus on privacy-premium niches allows us to negotiate superior rates that traditional lenders can't access.</p>
              </div>
              <div className="text-center">
                <h4 className="font-semibold mb-2">Real-Time Optimization</h4>
                <p className="text-text-secondary text-sm">Unlike 5-10 year commitments, our model allows continuous optimization of capital allocation based on performance.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Process;