import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight, 
  User, 
  Building, 
  Info, 
  FileText, 
  Phone, 
  Mail,
  CheckCircle,
  DollarSign,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FundingSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FundingSourcesModal: React.FC<FundingSourcesModalProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const fundingSources = [
    {
      icon: User,
      title: "Personal Funds",
      description: "Using your personal savings, checking, or investment accounts",
      details: [
        "Money from your bank accounts",
        "Proceeds from stock sales",
        "Personal investment accounts",
        "Cash savings"
      ],
      pros: [
        "Immediate access to funds",
        "No restrictions or penalties",
        "Simple and straightforward"
      ],
      bestFor: "Investors with liquid assets ready to invest"
    },
    {
      icon: Building,
      title: "Entity, Trust, or Family Office",
      description: "Funds from a legal entity, trust, or family office",
      details: [
        "Corporate investment accounts",
        "Family trust funds",
        "LLC or partnership capital",
        "Family office investments"
      ],
      pros: [
        "Potential tax advantages",
        "Estate planning benefits",
        "Professional management"
      ],
      bestFor: "High-net-worth individuals with structured wealth management"
    },
    {
      icon: FileText,
      title: "Self-Directed Retirement Account",
      description: "Using retirement account funds from a qualified custodian",
      details: [
        "Self-directed IRA",
        "Self-directed 401(k)",
        "Solo 401(k)",
        "SEP-IRA (if self-directed)"
      ],
      pros: [
        "Tax-deferred growth",
        "No immediate tax consequences",
        "Larger investment capacity"
      ],
      bestFor: "Investors wanting to diversify retirement portfolios",
      note: "Must be self-directed to invest in private lending"
    }
  ];

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
          
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center">
                <Info className="w-6 h-6 text-gold" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold text-text-primary">
                  Understanding Funding Sources
                </h1>
                <p className="text-gray-400">
                  Choose the right funding method for your investment
                </p>
              </div>
            </div>
          </div>
        </div>

            {/* Funding Source Options */}
            <div className="space-y-8 mb-12">
              {fundingSources.map((source, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white border border-gray-200 rounded-lg p-6 md:p-8"
                >
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <source.icon className="w-6 h-6 text-gold" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">{source.title}</h2>
                      <p className="text-gray-700 mb-4">{source.description}</p>
                      {source.note && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                          <p className="text-yellow-800 text-sm font-medium">{source.note}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">What This Includes:</h3>
                      <ul className="space-y-1">
                        {source.details.map((detail, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-gray-700 text-sm">
                            <div className="w-1.5 h-1.5 bg-gold rounded-full flex-shrink-0" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Key Benefits:</h3>
                      <ul className="space-y-1">
                        {source.pros.map((pro, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-gray-700 text-sm">
                            <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Best For:</h3>
                      <p className="text-gray-700 text-sm">{source.bestFor}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Decision Helper */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-gradient-to-r from-gold/20 to-gold/10 border border-gold/30 rounded-lg p-6 md:p-8 mb-8"
            >
              {/* FIXED: Using bright, high-contrast text colors for the dark background */}
              <h2 className="text-xl font-semibold text-gold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-gold" />
                Still Not Sure Which Option is Right for You?
              </h2>
              <p className="text-gray-700 mb-6">
                Our investment team can help you determine the best funding source based on your specific situation, tax considerations, and investment goals.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    onClose();
                    navigate('/contact');
                  }}
                  className="flex items-center justify-center gap-2 bg-gold text-background px-6 py-3 rounded-lg hover:bg-gold/90 transition-colors font-semibold"
                >
                  <Phone className="w-4 h-4" />
                  Schedule Free Consultation
                </button>
                
                <a
                  href="mailto:support@innercirclelending.com"
                  className="flex items-center justify-center gap-2 border border-gold text-gold px-6 py-3 rounded-lg hover:bg-gold/10 transition-colors font-semibold"
                >
                  <Mail className="w-4 h-4" />
                  Email Our Team
                </a>
              </div>
            </motion.div>

            {/* Ready to Continue */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-white border border-gray-200 rounded-lg p-6 md:p-8 text-center"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Ready to Continue?</h2>
              <p className="text-gray-700 mb-6">
                Once you've identified your funding source, you can return to complete your investment application.
              </p>
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 bg-gold text-background px-8 py-3 rounded-lg hover:bg-gold/90 transition-colors font-semibold"
              >
                Continue Application
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
      </div>
    )
  );
};

export default FundingSourcesModal;