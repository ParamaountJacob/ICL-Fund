import React, { useRef } from 'react';
import { useInView, motion } from 'framer-motion';
import { AlertTriangle, TrendingDown, DollarSign, Shield, Users, CheckCircle } from 'lucide-react';
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
          {/* Problem Section */}
          <motion.div
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={contentVariants}
            custom={0}
            className="mb-20"
          >
            <h2 className="heading-lg mb-8 text-center">You're Losing Capital Every Year, And It's Not From Market Volatility</h2>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-surface/60 p-6 rounded-lg border border-red-500/20">
                <AlertTriangle className="w-10 h-10 text-red-400 mb-4" />
                <h3 className="text-lg font-semibold mb-3 text-red-400">High Tax Burden</h3>
                <p className="text-text-secondary">High earners often overpay in taxes, losing 30-50% of income to the IRS when strategic alternatives exist.</p>
              </div>

              <div className="bg-surface/60 p-6 rounded-lg border border-red-500/20">
                <TrendingDown className="w-10 h-10 text-red-400 mb-4" />
                <h3 className="text-lg font-semibold mb-3 text-red-400">Unpredictable Returns</h3>
                <p className="text-text-secondary">Traditional investments can be unpredictable or illiquid, leaving you vulnerable to market swings.</p>
              </div>

              <div className="bg-surface/60 p-6 rounded-lg border border-red-500/20">
                <DollarSign className="w-10 h-10 text-red-400 mb-4" />
                <h3 className="text-lg font-semibold mb-3 text-red-400">High Risk, High Drama</h3>
                <p className="text-text-secondary">Many 'high-return' deals come with high risk and high drama - exactly what wealthy investors want to avoid.</p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-lg text-text-secondary max-w-3xl mx-auto">
                <strong>We offer something different:</strong> fixed returns, a private structure, and strategic tax alignment.
              </p>
            </div>
          </motion.div>

          {/* Our Advantage Section */}
          <motion.div
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={contentVariants}
            custom={0.2}
            className="mb-20"
          >
            <div className="bg-gradient-to-r from-gold/10 to-gold/5 p-8 rounded-lg border border-gold/20">
              <h3 className="text-2xl font-semibold text-gold mb-6">Our Advantage: Privacy Commands a Premium</h3>

              <p className="text-text-secondary text-lg leading-relaxed mb-6">
                A common question we get is: <em>"How can you offer these returns?"</em>
              </p>

              <p className="text-text-secondary text-lg leading-relaxed mb-6">
                The answer is simple. We operate in a niche market where our borrowers value <strong>certainty, speed, and discretion</strong> above all else.
                They aren't looking for the lowest rate; they are paying for a financial solution that is quiet and efficient.
              </p>

              <div className="grid md:grid-cols-2 gap-6 mt-8">
                <div className="bg-surface/50 p-6 rounded-lg">
                  <h4 className="font-semibold mb-3">High-Income Professionals</h4>
                  <p className="text-text-secondary">Who may have a temporary liquidity bottleneck (delayed property sale, business transaction) and need a discreet funding solution.</p>
                </div>

                <div className="bg-surface/50 p-6 rounded-lg">
                  <h4 className="font-semibold mb-3">Well-Off Individuals</h4>
                  <p className="text-text-secondary">Who need to handle significant private expenses without disrupting their long-term financial plans.</p>
                </div>
              </div>

              <p className="text-lg font-semibold text-gold mt-8 text-center">
                Privacy isn't a side benefit of our model. It's what drives the yield.
              </p>
            </div>
          </motion.div>

          {/* Transform Tax Bill Section */}
          <motion.div
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={contentVariants}
            custom={0.4}
            className="mb-20"
          >
            <div className="bg-accent p-8 rounded-lg border border-gold/20">
              <h3 className="text-2xl font-semibold text-gold mb-6">Transform Your Tax Bill into a Productive Asset</h3>

              <p className="text-text-secondary text-lg leading-relaxed mb-6">
                For many investors, our most powerful strategy involves repositioning capital you already owe in taxes.
                Instead of simply paying the IRS, we help you redirect that liability into a lending note that generates a fixed return.
              </p>

              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-text-secondary text-lg leading-relaxed mb-4">
                    <strong>Your out-of-pocket can remain the same</strong>, but now it's earning you 11-15% annually.
                  </p>
                  <p className="text-text-secondary text-lg leading-relaxed">
                    It's a powerful way high-income earners can create significant returns on capital that would have otherwise been lost.
                  </p>
                </div>
                <div className="bg-surface/50 p-6 rounded-lg text-center">
                  <div className="text-3xl font-bold text-gold mb-2">11-15%</div>
                  <div className="text-lg text-text-secondary">Annual Fixed Returns</div>
                  <div className="text-sm text-text-secondary mt-2">On repositioned tax capital</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Security & Trust Section */}
          <motion.div
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={contentVariants}
            custom={0.6}
            className="mb-16"
          >
            <h3 className="text-2xl font-semibold mb-8 text-center">Security-First Lending & Family Oversight</h3>
            <p className="text-lg text-text-secondary text-center mb-12 max-w-3xl mx-auto">
              Your peace of mind is our priority. We are not a startup fund; we are a family-run private lending firm structured as a 506(c) fund.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-surface p-6 rounded-lg text-center">
                <Shield className="w-12 h-12 text-gold mb-4 mx-auto" />
                <h4 className="font-semibold mb-3">Investor Protections</h4>
                <p className="text-text-secondary">Every loan is underwritten and collateralized, with surety bonds and reserve funds providing payout protection.</p>
              </div>

              <div className="bg-surface p-6 rounded-lg text-center">
                <CheckCircle className="w-12 h-12 text-gold mb-4 mx-auto" />
                <h4 className="font-semibold mb-3">Simple Structure</h4>
                <p className="text-text-secondary">You receive a promissory note. No equity, no complex fund structures, and no exposure to underlying business risk.</p>
              </div>

              <div className="bg-surface p-6 rounded-lg text-center">
                <Users className="w-12 h-12 text-gold mb-4 mx-auto" />
                <h4 className="font-semibold mb-3">Family-Run</h4>
                <p className="text-text-secondary">Wayne Griswold personally oversees every deal. "True wealth moves quietly, and we carry that belief into everything we do."</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-center"
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