import React, { useRef } from 'react';
import { useInView, motion } from 'framer-motion';

const Leadership: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

  return (
    <section className="py-12 md:py-32 bg-premium-gradient from-surface to-background bg-premium-pattern">
      <div className="section" ref={sectionRef}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          <h2 className="heading-lg mb-6">Leadership You Can Trust</h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <img
              src="https://res.cloudinary.com/digjsdron/image/upload/v1746554204/Wayne_Griswold_o3w3rl.webp"
              alt="Wayne Griswold"
              className="w-full h-auto mb-6 rounded"
            />
            <h3 className="text-2xl font-display font-semibold text-gold mb-2">Wayne Griswold</h3>
            <p className="text-lg text-text-primary mb-4">Founder & Chief Investment Officer</p>
            <p className="text-text-secondary leading-relaxed">
              Decades of experience in structured private lending, delivering disciplined, secure, and consistent returns for investors.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center"
          >
            <img
              src="https://res.cloudinary.com/digjsdron/image/upload/v1746554203/Michael_Griswold_aknxin.webp"
              alt="Michael Griswold"
              className="w-full h-auto mb-6 rounded"
            />
            <h3 className="text-2xl font-display font-semibold text-gold mb-2">Michael Griswold</h3>
            <p className="text-lg text-text-primary mb-4">Head of Strategic Lending</p>
            <p className="text-text-secondary leading-relaxed">
              Focused on developing discreet, high-value lending relationships with businesses that value speed and privacy.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Leadership;