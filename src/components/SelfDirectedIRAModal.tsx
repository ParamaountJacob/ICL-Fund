import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  CheckCircle, 
  X, 
  FileText, 
  Phone, 
  Mail,
  ExternalLink,
  Building,
  Shield,
  Info
} from 'lucide-react';

interface SelfDirectedIRAModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SelfDirectedIRAModal: React.FC<SelfDirectedIRAModalProps> = ({ 
  isOpen, 
  onClose 
}) => {
  if (!isOpen) return null;

  return (
    isOpen && (
      <div className="w-full">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-gold hover:text-gold/80 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Application
          </button>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center">
              <Info className="w-6 h-6 text-gold" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-text-primary">
                Self-Directed Retirement Accounts
              </h1>
              <p className="text-text-secondary">
                Understanding your investment options
              </p>
            </div>
          </div>
        </div>

            <div className="space-y-8">
              {/* What is Self-Directed */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-white border border-gray-200 rounded-lg p-6 md:p-8"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  What is a Self-Directed Account?
                </h2>
                {/* FIXED: Removed text-text-primary from parent */}
                <div className="space-y-4">
                  {/* FIXED: Added specific dark text color */}
                  <p className="text-gray-700">
                    A self-directed IRA or 401(k) gives you control over your investment choices beyond traditional stocks, bonds, and mutual funds. With a self-directed account, you can invest in alternative assets like private lending, real estate, and other opportunities.
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-2">Key Benefits:</h3>
                    <ul className="space-y-1 text-green-700 text-sm list-disc list-inside">
                      <li>Greater investment flexibility and control</li>
                      <li>Access to alternative investment opportunities</li>
                      <li>Potential for higher returns</li>
                      <li>Same tax advantages as traditional retirement accounts</li>
                    </ul>
                  </div>
                </div>
              </motion.div>

              {/* Why Traditional Accounts Don't Qualify */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white border border-gray-200 rounded-lg p-6 md:p-8"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <X className="w-5 h-5 text-red-600 flex-shrink-0" />
                  Why Traditional IRAs/401(k)s Don't Qualify
                </h2>
                {/* FIXED: Removed text-text-primary from parent */}
                <div className="space-y-4">
                  {/* FIXED: Added specific dark text color */}
                  <p className="text-gray-700">
                    Traditional retirement accounts managed by employers or major financial institutions typically restrict investments to their pre-approved list of stocks, bonds, and mutual funds. These accounts cannot be used for private lending or alternative investments.
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-semibold text-red-800 mb-2">Common Restrictions:</h3>
                    <ul className="space-y-1 text-red-700 text-sm list-disc list-inside">
                      <li>Limited to pre-approved investment options</li>
                      <li>Cannot invest in private companies or lending</li>
                      <li>Managed by the plan administrator</li>
                      <li>No control over investment decisions</li>
                    </ul>
                  </div>
                </div>
              </motion.div>

              {/* How to Convert */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-white border border-gray-200 rounded-lg p-6 md:p-8"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  How to Convert Your Account
                </h2>
                {/* FIXED: Removed text-text-primary from parent */}
                <div className="space-y-6">
                  {/* FIXED: Added specific dark text color */}
                  <p className="text-gray-700">
                    Converting to a self-directed account is typically straightforward and can often be done without tax penalties through a direct rollover or transfer.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-800 mb-3">Step 1: Choose a Custodian</h3>
                      <p className="text-blue-700 text-sm mb-3">
                        Select a self-directed IRA custodian that allows alternative investments.
                      </p>
                      <div className="space-y-1 text-blue-700 text-sm list-disc list-inside">
                        <li>Equity Trust Company</li>
                        <li>Entrust Group</li>
                        <li>IRA Services Trust Company</li>
                        <li>Pensco Trust Company</li>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-800 mb-3">Step 2: Initiate Transfer</h3>
                      <p className="text-blue-700 text-sm mb-3">
                        Work with your new custodian to transfer funds from your current account.
                      </p>
                      <div className="space-y-1 text-blue-700 text-sm list-disc list-inside">
                        <li>Direct rollover (no taxes)</li>
                        <li>Trustee-to-trustee transfer</li>
                        <li>Usually takes 2-4 weeks</li>
                        <li>No early withdrawal penalties</li>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gold/10 border border-gold/20 rounded-lg p-4">
                    <h3 className="font-semibold text-gold mb-2">Important Note:</h3>
                    {/* FIXED: Changed text-text-primary to a specific dark gold color */}
                    <p className="text-yellow-800 text-sm">
                      The conversion process maintains all tax advantages of your retirement account. You're simply changing custodians to gain more investment flexibility.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Contact Support */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="bg-gradient-to-r from-gold/20 to-gold/10 border border-gold/30 rounded-lg p-6 md:p-8"
              >
                {/* FIXED: Using bright, high-contrast text for dark background */}
                <h2 className="text-xl font-semibold text-gold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-gold flex-shrink-0" />
                  Need Help Getting Started?
                </h2>
                <p className="text-gray-700 mb-6">
                  Our team can help guide you through the self-directed account setup process and connect you with trusted custodians.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 bg-gold text-background px-6 py-3 rounded-lg hover:bg-gold/90 transition-colors font-semibold"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Return to Application
                  </button>
                  
                  <a
                    href="mailto:support@innercirclelending.com"
                    className="flex items-center justify-center gap-2 border border-gold text-gold px-6 py-3 rounded-lg hover:bg-gold/10 transition-colors font-semibold"
                  >
                    <Mail className="w-4 h-4" />
                    Email Support
                  </a>
                </div>
              </motion.div>

              {/* Additional Resources */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="bg-white border border-gray-200 rounded-lg p-6 md:p-8"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-600 flex-shrink-0" />
                  Additional Resources
                </h2>
                <div className="space-y-3">
                  <a
                    href="https://www.irs.gov/retirement-plans/self-directed-iras"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    IRS Guide to Self-Directed IRAs
                  </a>
                  <a
                    href="https://www.investopedia.com/articles/retirement/03/092403.asp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Self-Directed IRA Investment Guide
                  </a>
                </div>
              </motion.div>
            </div>
      </div>
    )
  );
};

export default SelfDirectedIRAModal;