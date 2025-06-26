import React, { useRef } from 'react';
import { useInView, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Investors: React.FC = () => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

  return (
    <section id="investor" className="py-12 md:py-32 bg-premium-gradient from-surface to-background bg-premium-pattern">
      <div className="section" ref={sectionRef}>
        <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="heading mb-6">Why Investors Stay:</h2>
            <ul className="space-y-6 text-text-secondary">
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold mt-3 mr-4"></span>
                <p>They realize privacy protects performance.</p>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold mt-3 mr-4"></span>
                <p>They don't need every detail—they need consistency.</p>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold mt-3 mr-4"></span>
                <p>And they know we deliver.</p>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-accent p-8 md:p-10"
          >
            <h3 className="text-2xl font-display font-semibold mb-6">Predictable Returns</h3>
            <div className="mb-8">
              <div className="flex items-baseline space-x-2 mb-3">
                <span className="text-gold text-4xl md:text-5xl font-display font-semibold">11-15%</span>
                <span className="text-text-secondary">Annual Returns</span>
              </div>
              <p className="text-text-secondary text-sm">
                Fixed returns regardless of market conditions
              </p>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Monthly Payouts</span>
                <span className="text-gold">Available</span>
              </div>
              <div className="h-px bg-graphite"></div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Quarterly Payouts</span>
                <span className="text-gold">Available</span>
              </div>
              <div className="h-px bg-graphite"></div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Annual Payouts</span>
                <span className="text-gold">Available</span>
              </div>
            </div>
            
            <button 
              onClick={() => navigate('/contact', { state: { consultation: true } })}
              className="button w-full text-center"
            >
              Request Investment Details
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Investors;