import React, { useRef } from 'react';
import { useInView, motion } from 'framer-motion';
import { AlertTriangle, TrendingDown, DollarSign, Shield, Users, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const About: React.FC = () => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);
  const advantageRef = useRef<HTMLDivElement>(null);
  const taxRef = useRef<HTMLDivElement>(null);
  const securityRef = useRef<HTMLDivElement>(null);

  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });
  const advantageInView = useInView(advantageRef, { once: true, amount: 0.1 });
  const taxInView = useInView(taxRef, { once: true, amount: 0.1 });
  const securityInView = useInView(securityRef, { once: true, amount: 0.1 });

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
            className="mb-16"
          >
            <h2 className="heading-lg mb-8 text-center">Maximize Your Capital Potential</h2>
            <p className="text-center text-text-secondary mb-12 max-w-2xl mx-auto">
              Smart investors are discovering strategic alternatives to traditional approaches.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-surface/60 p-6 rounded-lg border border-gold/20 text-center">
                <AlertTriangle className="w-10 h-10 text-gold mb-4 mx-auto" />
                <h3 className="text-lg font-semibold mb-3 text-gold">Tax Optimization</h3>
                <p className="text-text-secondary text-sm">Strategic alternatives can enhance your after-tax returns significantly.</p>
              </div>

              <div className="bg-surface/60 p-6 rounded-lg border border-gold/20 text-center">
                <TrendingDown className="w-10 h-10 text-gold mb-4 mx-auto" />
                <h3 className="text-lg font-semibold mb-3 text-gold">Predictable Returns</h3>
                <p className="text-text-secondary text-sm">Fixed-return investments provide stability in an unpredictable market.</p>
              </div>

              <div className="bg-surface/60 p-6 rounded-lg border border-gold/20 text-center">
                <DollarSign className="w-10 h-10 text-gold mb-4 mx-auto" />
                <h3 className="text-lg font-semibold mb-3 text-gold">Stress-Free Growth</h3>
                <p className="text-text-secondary text-sm">Sophisticated investors prefer reliable returns over high-risk, high-stress opportunities.</p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-lg text-text-secondary">
                <strong>We specialize in this approach:</strong> fixed returns, private structure, tax alignment.
              </p>
            </div>
          </motion.div>

          {/* Our Advantage Section */}
          <motion.div
            ref={advantageRef}
            initial="hidden"
            animate={advantageInView ? "visible" : "hidden"}
            variants={contentVariants}
            className="mb-16"
          >
            <div className="bg-gradient-to-r from-gold/10 to-gold/5 p-8 rounded-lg border border-gold/20">
              <h3 className="text-2xl font-semibold text-gold mb-6 text-center">Privacy Commands a Premium</h3>

              <div className="text-center mb-8">
                <p className="text-text-secondary text-lg mb-4">
                  <em>"How can you offer these returns?"</em>
                </p>
                <p className="text-text-secondary">
                  We serve borrowers who value <strong>certainty, speed, and discretion</strong> over the lowest rate.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-surface/50 p-6 rounded-lg text-center">
                  <h4 className="font-semibold mb-3">High-Income Professionals</h4>
                  <p className="text-text-secondary text-sm">Temporary liquidity needs with privacy requirements.</p>
                </div>

                <div className="bg-surface/50 p-6 rounded-lg text-center">
                  <h4 className="font-semibold mb-3">Wealthy Individuals</h4>
                  <p className="text-text-secondary text-sm">Private expenses without disrupting long-term plans.</p>
                </div>
              </div>

              <p className="text-lg font-semibold text-gold mt-8 text-center">
                Privacy drives the yield.
              </p>
            </div>
          </motion.div>

          {/* Transform Tax Bill Section */}
          <motion.div
            ref={taxRef}
            initial="hidden"
            animate={taxInView ? "visible" : "hidden"}
            variants={contentVariants}
            className="mb-16"
          >
            <div className="bg-accent p-8 rounded-lg border border-gold/20">
              <h3 className="text-2xl font-semibold text-gold mb-6 text-center">Turn Tax Payments Into Returns</h3>

              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="text-center md:text-left">
                  <p className="text-text-secondary mb-4">
                    Instead of simply paying the IRS, redirect that capital into a lending note.
                  </p>
                  <p className="text-text-secondary text-sm">
                    <strong>Same out-of-pocket.</strong> Now earning 11-15% annually.
                  </p>
                </div>
                <div className="bg-surface/50 p-6 rounded-lg text-center">
                  <div className="text-3xl font-bold text-gold mb-2">11-15%</div>
                  <div className="text-lg text-text-secondary">Fixed Annual Returns</div>
                  <div className="text-sm text-text-secondary mt-2">On repositioned tax capital</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Security & Trust Section */}
          <motion.div
            ref={securityRef}
            initial="hidden"
            animate={securityInView ? "visible" : "hidden"}
            variants={contentVariants}
            className="mb-16"
          >
            <h3 className="text-2xl font-semibold mb-6 text-center">Security-First, Family-Run</h3>
            <p className="text-text-secondary text-center mb-8 max-w-2xl mx-auto">
              Not a startup fund. A family-run 506(c) private lending firm.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-surface p-6 rounded-lg text-center">
                <Shield className="w-12 h-12 text-gold mb-4 mx-auto" />
                <h4 className="font-semibold mb-3">Protected</h4>
                <p className="text-text-secondary text-sm">Collateralized loans, surety bonds, reserve funds.</p>
              </div>

              <div className="bg-surface p-6 rounded-lg text-center">
                <CheckCircle className="w-12 h-12 text-gold mb-4 mx-auto" />
                <h4 className="font-semibold mb-3">Simple</h4>
                <p className="text-text-secondary text-sm">Promissory note. No equity or complex structures.</p>
              </div>

              <div className="bg-surface p-6 rounded-lg text-center">
                <Users className="w-12 h-12 text-gold mb-4 mx-auto" />
                <h4 className="font-semibold mb-3">Personal</h4>
                <p className="text-text-secondary text-sm">Wayne Griswold oversees every deal personally.</p>
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
              Get in Touch
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;