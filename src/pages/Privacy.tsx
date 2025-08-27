import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, FileCheck, MessageSquare, Mail, Share2 } from 'lucide-react';

const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-background pt-28">
      <section className="py-24 md:py-32">
        <div className="section">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto mb-16"
          >
            <h1 className="heading-xl mb-8">Privacy Policy & Terms</h1>
            <p className="text-xl text-text-secondary leading-relaxed">
              At Inner Circle Lending, privacy isn't just a policy—it's a cornerstone of our business.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto space-y-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="flex items-center mb-6">
                <Shield className="w-8 h-8 text-gold mr-4" />
                <h2 className="heading">Privacy Policy</h2>
              </div>
              <div className="space-y-6 text-text-secondary">
                <p>
                  Inner Circle Lending is committed to maintaining the confidentiality, integrity, and security of personal information entrusted to us by our investors and business partners.
                </p>
                <h3 className="text-xl font-semibold text-text-primary">Information Collection</h3>
                <p>
                  We collect information necessary to provide our services, comply with regulatory requirements, and maintain secure business operations. This includes:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Contact information</li>
                  <li>Investment preferences and history</li>
                  <li>Accreditation status</li>
                  <li>Financial information relevant to investments</li>
                </ul>

                <h3 className="text-xl font-semibold text-text-primary">Information Use</h3>
                <p>
                  We use collected information solely for:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Processing investments</li>
                  <li>Managing investor relationships</li>
                  <li>Regulatory compliance</li>
                  <li>Communication about investments</li>
                </ul>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="flex items-center mb-6">
                <Lock className="w-8 h-8 text-gold mr-4" />
                <h2 className="heading">Data Security</h2>
              </div>
              <div className="space-y-6 text-text-secondary">
                <p>
                  We implement robust security measures to protect your information:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Encryption of sensitive data</li>
                  <li>Secure data storage systems</li>
                  <li>Regular security audits</li>
                  <li>Strict access controls</li>
                </ul>
              </div>
            </motion.div>

            {/* Communications Consent (A2P) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <div className="flex items-center mb-6">
                <MessageSquare className="w-8 h-8 text-gold mr-4" />
                <h2 className="heading">Communications & Consent</h2>
              </div>
              <div className="space-y-6 text-text-secondary">
                <p>
                  By providing your contact information, you consent to receive communications related to your investments, including SMS and email updates. Message frequency may vary. Standard messaging and data rates may apply. You can opt out of SMS at any time by replying <span className="font-semibold">STOP</span>, and opt out of emails by clicking <span className="font-semibold">Unsubscribe</span>.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Reply <span className="font-semibold">HELP</span> for help or assistance.</li>
                  <li>Consent to receive messages is not a condition of any investment or purchase.</li>
                  <li>You may update your communication preferences at any time by contacting us or through your account profile (where available).</li>
                  <li>Carriers are not liable for delayed or undelivered messages.</li>
                </ul>
              </div>
            </motion.div>

            {/* Information Sharing */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.55 }}
            >
              <div className="flex items-center mb-6">
                <Share2 className="w-8 h-8 text-gold mr-4" />
                <h2 className="heading">Information Sharing</h2>
              </div>
              <div className="space-y-6 text-text-secondary">
                <p>
                  We do not sell or rent personal information. We share information only with regulators or trusted service providers as required to process investments and comply with applicable laws.
                </p>
                <p>
                  When sharing information with service providers (for example, custodians, transfer agents, KYC/AML vendors, email or SMS delivery platforms), we require appropriate safeguards, confidentiality, and use restrictions consistent with this Privacy Policy.
                </p>
              </div>
            </motion.div>

            {/* Contact Us */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="flex items-center mb-6">
                <Mail className="w-8 h-8 text-gold mr-4" />
                <h2 className="heading">Contact Us</h2>
              </div>
              <div className="space-y-4 text-text-secondary">
                <p>
                  For questions about our Privacy Policy or Terms, please contact us:
                </p>
                <ul className="list-none pl-0 space-y-2">
                  <li>
                    📧 <a className="text-gold hover:underline" href="mailto:support@innercirclelending.com">support@innercirclelending.com</a>
                  </li>
                  <li>
                    � <a className="text-gold hover:underline" href="tel:+17753494682">+1 (775) 349-4682</a>
                  </li>
                  <li className="leading-snug">
                    📍 <div>
                      <div>117 S LEXINGTON ST STE 100</div>
                      <div>Harrisonville Missouri 64701-2444</div>
                      <div>United States</div>
                    </div>
                  </li>
                </ul>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="flex items-center mb-6">
                <FileCheck className="w-8 h-8 text-gold mr-4" />
                <h2 className="heading">Terms of Service</h2>
              </div>
              <div className="space-y-6 text-text-secondary">
                <h3 className="text-xl font-semibold text-text-primary">Investment Terms</h3>
                <p>
                  All investments are subject to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Minimum investment requirements</li>
                  <li>Accredited investor verification</li>
                  <li>Specified investment periods</li>
                  <li>Agreed-upon payment schedules</li>
                </ul>

                <h3 className="text-xl font-semibold text-text-primary">Confidentiality</h3>
                <p>
                  All parties agree to maintain strict confidentiality regarding:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Investment details</li>
                  <li>Borrower information</li>
                  <li>Business operations</li>
                  <li>Financial terms</li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Privacy;