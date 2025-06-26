import React, { useRef } from 'react';
import { useInView, motion } from 'framer-motion';
import { CircleDollarSign, Wallet, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const About: React.FC = () => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <section id="unlock" className="bg-premium-gradient from-surface to-background py-12 md:py-32 bg-premium-pattern">
      <div className="section" ref={sectionRef}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={contentVariants}
            custom={0}
            className="mb-16"
          >
            <h2 className="heading-lg mb-4">Your Wealth, Unlocked</h2>
            <p className="text-text-secondary text-lg mt-6 leading-relaxed">
              You could be wealthier than you think. Many people have thousands – even hundreds of thousands – 
              of dollars "trapped" in places they can't easily access or don't realize they can invest.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-surface p-8 rounded-lg"
            >
              <FileText className="w-12 h-12 text-gold mb-6" />
              <h3 className="text-xl font-semibold mb-4">Retirement Freedom</h3>
              <p className="text-text-secondary mb-6">
                Most people don't know they can invest their 401(k) or IRA beyond stocks and mutual funds. 
                We help you unlock these funds for better returns while maintaining tax benefits.
              </p>
              <div className="pt-4 border-t border-graphite">
                <div className="flex items-baseline gap-2">
                  <span className="text-gold text-2xl font-semibold">97%</span>
                  <span className="text-text-secondary text-sm">of retirement accounts are limited to traditional options</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-surface p-8 rounded-lg"
            >
              <CircleDollarSign className="w-12 h-12 text-gold mb-6" />
              <h3 className="text-xl font-semibold mb-4">Tax Optimization</h3>
              <p className="text-text-secondary mb-6">
                High earners can lose 30-50% of income to taxes. We help you redirect tax payments into 
                investments using IRS-approved strategies the wealthy already use.
              </p>
              <div className="pt-4 border-t border-graphite">
                <div className="flex items-baseline gap-2">
                  <span className="text-gold text-2xl font-semibold">40%</span>
                  <span className="text-text-secondary text-sm">average tax rate for high earners that could be reinvested</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-surface p-8 rounded-lg"
            >
              <Wallet className="w-12 h-12 text-gold mb-6" />
              <h3 className="text-xl font-semibold mb-4">Crypto Income</h3>
              <p className="text-text-secondary mb-6">
                Convert volatile crypto holdings into steady monthly income through our secured lending platform. 
                Keep your crypto exposure while earning consistent returns.
              </p>
              <div className="pt-4 border-t border-graphite">
                <div className="flex items-baseline gap-2">
                  <span className="text-gold text-2xl font-semibold">11-15%</span>
                  <span className="text-text-secondary text-sm">fixed annual returns on repositioned assets</span>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-16 text-center"
          >
            <button
              onClick={() => navigate('/contact', { state: { consultation: true } })}
              className="button"
            >
              Schedule Your Free Consultation
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;