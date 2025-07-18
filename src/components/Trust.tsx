import React, { useRef } from 'react';
import { useInView, motion } from 'framer-motion';
import { Shield, Scale, FileCheck } from 'lucide-react';

const Trust: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

  return (
    <section className="py-12 md:py-24 bg-premium-gradient from-surface to-background bg-premium-pattern relative overflow-hidden">
      <div className="section" ref={sectionRef}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          <h2 className="heading-lg mb-6">Your Peace of Mind is Our Priority</h2>
          <p className="text-text-secondary text-lg leading-relaxed">
            We understand that true wealth isn't just about returns—it's about peace of mind.
            That's why we've built a fortress of protection around your investment, letting you
            step back and enjoy life while your money works for you.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-accent p-8 border border-graphite"
          >
            <Shield className="w-12 h-12 text-gold mb-6" strokeWidth={1.5} />
            <h3 className="text-xl font-display font-semibold mb-4">Relax, You're Protected</h3>
            <p className="text-text-secondary">
              Your investment is secured by comprehensive safeguards, letting you enjoy life without worry.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-accent p-8 border border-graphite"
          >
            <Scale className="w-12 h-12 text-gold mb-6" strokeWidth={1.5} />
            <h3 className="text-xl font-display font-semibold mb-4">We Handle the Stress</h3>
            <p className="text-text-secondary">
              Our rigorous vetting process means you never have to worry about who's behind the returns.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-accent p-8 border border-graphite"
          >
            <FileCheck className="w-12 h-12 text-gold mb-6" strokeWidth={1.5} />
            <h3 className="text-xl font-display font-semibold mb-4">Focus on Living</h3>
            <p className="text-text-secondary">
              While we maintain strict oversight and regular audits, you're free to enjoy what matters most.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Trust;