import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Briefcase, TrendingUp, CircleDollarSign, Target, Award, Clock } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="pt-0">
      <section className="py-24 md:py-32">
        <div className="section">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto mb-16"
          >
            <h1 className="heading-xl mb-8">About Inner Circle Lending</h1>
            <p className="text-xl text-text-secondary mb-8 leading-relaxed">
              Redefining private lending through discretion, expertise, and unwavering integrity.
            </p>
          </motion.div>

          {/* Company Overview Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-6xl mx-auto mb-24"
          >
            <div className="bg-surface p-12 rounded-lg mb-16">
              <h2 className="heading text-gold mb-8">Our Mission</h2>
              <p className="text-text-secondary text-lg leading-relaxed mb-8">
                Inner Circle Lending was founded on the principle that private lending should be both 
                profitable and discreet. We bridge the gap between investors seeking consistent returns 
                and businesses requiring confidential capital solutions. Our approach prioritizes privacy, 
                performance, and long-term relationships over short-term gains.
              </p>
              <p className="text-text-secondary text-lg leading-relaxed">
                Through our carefully curated network of borrowers and investors, we've created an 
                ecosystem where discretion drives value, and trust forms the foundation of every 
                transaction. We don't just facilitate loans—we architect financial relationships 
                that benefit all parties while maintaining the highest standards of confidentiality.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-surface p-8 rounded-lg border border-graphite"
              >
                <Award className="w-12 h-12 text-gold mb-6" />
                <h3 className="text-xl font-semibold mb-4">Proven Track Record</h3>
                <p className="text-text-secondary">
                  Decades of combined experience in private lending, with a focus on delivering 
                  consistent returns while maintaining borrower privacy.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-surface p-8 rounded-lg border border-graphite"
              >
                <Shield className="w-12 h-12 text-gold mb-6" />
                <h3 className="text-xl font-semibold mb-4">Discretion First</h3>
                <p className="text-text-secondary">
                  We understand that privacy is paramount in high-value transactions. Our processes 
                  are designed to protect all parties while ensuring transparency where it matters.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="bg-surface p-8 rounded-lg border border-graphite"
              >
                <Target className="w-12 h-12 text-gold mb-6" />
                <h3 className="text-xl font-semibold mb-4">Selective Approach</h3>
                <p className="text-text-secondary">
                  We work exclusively with accredited investors and carefully vetted borrowers, 
                  ensuring quality relationships that drive superior outcomes.
                </p>
              </motion.div>
            </div>

            <div className="bg-accent p-12 rounded-lg">
              <h2 className="heading text-gold mb-8">What Sets Us Apart</h2>
              <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="flex items-start">
                    <Clock className="w-6 h-6 text-gold mt-1 mr-4" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Speed & Efficiency</h3>
                      <p className="text-text-secondary">
                        Our streamlined processes enable rapid decision-making and fund deployment, 
                        often within 24-48 hours of approval.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Users className="w-6 h-6 text-gold mt-1 mr-4" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Relationship-Driven</h3>
                      <p className="text-text-secondary">
                        We build lasting partnerships with both investors and borrowers, creating 
                        value through trust and mutual success.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <CircleDollarSign className="w-6 h-6 text-gold mt-1 mr-4" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Consistent Returns</h3>
                      <p className="text-text-secondary">
                        Our disciplined approach to risk management and borrower selection 
                        delivers predictable 11-15% annual returns.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Briefcase className="w-6 h-6 text-gold mt-1 mr-4" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Professional Excellence</h3>
                      <p className="text-text-secondary">
                        Every aspect of our operation reflects institutional-grade standards 
                        while maintaining the personal touch of boutique service.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Leadership Section */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 max-w-4xl mx-auto mb-16 md:mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-4 md:space-y-6"
            >
              <img
                src="https://res.cloudinary.com/digjsdron/image/upload/v1746554204/Wayne_Griswold_o3w3rl.webp"
                alt="Wayne Griswold"
                className="w-full max-w-xs mx-auto h-auto rounded"
              />
              <div>
                <h2 className="text-xl md:text-2xl font-semibold mb-2 text-center md:text-left">Wayne Griswold</h2>
                <h3 className="text-lg text-gold mb-4 text-center md:text-left">Founder & Chief Investment Officer</h3>
                <p className="text-text-secondary leading-relaxed text-center md:text-left">
                  Wayne leads Inner Circle Lending with a focus on structured, disciplined private lending. 
                  With decades of experience, he ensures every capital deployment is aligned with our core 
                  values—privacy, performance, and protection. His leadership in risk management and consistent 
                  returns has built a lending approach investors can trust.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="space-y-4 md:space-y-6"
            >
              <img
                src="https://res.cloudinary.com/digjsdron/image/upload/v1746554203/Michael_Griswold_aknxin.webp"
                alt="Michael Griswold"
                className="w-full max-w-xs mx-auto h-auto rounded"
              />
              <div>
                <h2 className="text-xl md:text-2xl font-semibold mb-2 text-center md:text-left">Michael Griswold</h2>
                <h3 className="text-lg text-gold mb-4 text-center md:text-left">Head of Strategic Lending</h3>
                <p className="text-text-secondary leading-relaxed text-center md:text-left">
                  Michael drives the creation of exclusive lending relationships with businesses that prioritize 
                  anonymity and certainty. His expertise in identifying high-quality borrowers allows Inner Circle 
                  Lending to offer strong, fixed returns, while maintaining the confidentiality that defines our success.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Company Stats and Values */}
          <div className="grid md:grid-cols-2 gap-16 max-w-6xl mx-auto mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h2 className="heading mb-6">Our Approach</h2>
              <p className="text-text-secondary mb-8 leading-relaxed">
                We operate differently from traditional lenders. Our focus is on creating value through privacy, 
                delivering consistent returns without unnecessary complexity or exposure.
              </p>
              <div className="space-y-6">
                <div className="flex items-start">
                  <Shield className="w-6 h-6 text-gold mt-1 mr-4" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Discretion First</h3>
                    <p className="text-text-secondary">
                      Privacy isn't just a feature—it's fundamental to our success and yours.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Users className="w-6 h-6 text-gold mt-1 mr-4" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Selective Relationships</h3>
                    <p className="text-text-secondary">
                      We work with a carefully curated network of borrowers who value privacy as much as capital.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-surface p-8"
            >
              <h2 className="heading mb-6">By the Numbers</h2>
              <div className="space-y-8">
                <div>
                  <div className="flex items-baseline space-x-2 mb-2">
                    <span className="text-gold text-4xl font-display font-semibold">$30M</span>
                  </div>
                  <p className="text-text-secondary">Current Raise Amount</p>
                </div>
                <div>
                  <div className="flex items-baseline space-x-2 mb-2">
                    <span className="text-gold text-4xl font-display font-semibold">100%</span>
                  </div>
                  <p className="text-text-secondary">Privacy Maintained</p>
                </div>
                <div>
                  <div className="flex items-baseline space-x-2 mb-2">
                    <span className="text-gold text-4xl font-display font-semibold">24hrs</span>
                  </div>
                  <p className="text-text-secondary">Average Response Time</p>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="max-w-6xl mx-auto"
          >
            <h2 className="heading mb-12 text-center">Our Core Strengths</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="border border-graphite p-8">
                <Briefcase className="w-12 h-12 text-gold mb-6" />
                <h3 className="text-xl font-semibold mb-4">Expert Due Diligence</h3>
                <p className="text-text-secondary">
                  Our team brings decades of experience in private lending, risk assessment, and portfolio management.
                  We understand both the visible and invisible factors that determine success.
                </p>
              </div>
              <div className="border border-graphite p-8">
                <TrendingUp className="w-12 h-12 text-gold mb-6" />
                <h3 className="text-xl font-semibold mb-4">Performance Focus</h3>
                <p className="text-text-secondary">
                  We maintain a laser focus on delivering consistent returns. Our track record speaks through results,
                  not marketing materials.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;