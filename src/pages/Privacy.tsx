import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, FileCheck } from 'lucide-react';

const Privacy: React.FC = () => {
  return (
    <div className="pt-28">
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